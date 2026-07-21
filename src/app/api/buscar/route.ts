import { NextRequest, NextResponse } from "next/server";
import { listarTodosLosProductosActivos } from "@/lib/firestore/public";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  if (!q) return NextResponse.json({ resultados: [] });
  const todos = await listarTodosLosProductosActivos();
  const resultados = todos.filter(({ producto, categoriaSlug }) =>
    producto.nombre.toLowerCase().includes(q) ||
    producto.marca.toLowerCase().includes(q) ||
    Object.values(producto.specs).some((v) => v.toLowerCase().includes(q))
  ).slice(0, 24);
  return NextResponse.json({ resultados });
}