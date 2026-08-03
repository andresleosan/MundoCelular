import { NextRequest, NextResponse } from "next/server";
import { listarTodosLosProductosActivos } from "@/lib/firestore/public";
import { filtrarProductosPorMarca } from "@/lib/storefront/brands";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const marca = (req.nextUrl.searchParams.get("marca") ?? "").trim();

  if (q.length > 100) {
    return NextResponse.json({ error: "La búsqueda no puede superar 100 caracteres." }, { status: 400 });
  }
  if (marca.length > 80) {
    return NextResponse.json({ error: "La marca no puede superar 80 caracteres." }, { status: 400 });
  }
  if (!q && !marca) return NextResponse.json({ resultados: [] }, { status: 200 });

  const todos = await listarTodosLosProductosActivos();
  const activos = todos.filter(({ producto }) => producto.activo === true);
  const marcasCoincidentes = marca
    ? new Set(filtrarProductosPorMarca(activos.map(({ producto }) => producto), marca).map((producto) => producto.id))
    : null;
  const candidatos = marcasCoincidentes
    ? activos.filter(({ producto }) => marcasCoincidentes.has(producto.id))
    : activos;

  const resultados = candidatos.filter(({ producto }) => {
    if (!q) return true;
    return (
      String(producto.nombre ?? "").toLowerCase().includes(q) ||
      String(producto.marca ?? "").toLowerCase().includes(q) ||
      Object.values(producto.specs ?? {}).some((valor) => String(valor ?? "").toLowerCase().includes(q))
    );
  }).slice(0, 24);
  return NextResponse.json({ resultados }, { status: 200 });
}
