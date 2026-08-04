import { NextRequest, NextResponse } from "next/server";
import { normalizarCodigoFirestore } from "@/lib/firestore/diagnostics";
import { listarTodosLosProductosActivos } from "@/lib/firestore/public";
import { filtrarProductosPorMarca } from "@/lib/storefront/brands";

function detallesError(error: unknown): { code: string; message: string } {
  const details = (typeof error === "object" && error !== null ? error : {}) as {
    code?: unknown;
    message?: unknown;
  };
  const code = normalizarCodigoFirestore(details.code);
  const rawMessage = typeof details.message === "string" ? details.message.toLowerCase() : "";

  let message = "Firestore read failed.";
  if (code === "firebase-admin/missing-config") {
    message = "Firebase Admin configuration missing.";
  } else if (code === "failed-precondition" || rawMessage.includes("index") || rawMessage.includes("precondition")) {
    message = "Firestore query precondition failed.";
  } else if (code === "permission-denied" || code === "unauthenticated" || rawMessage.includes("permission")) {
    message = "Firestore permission denied.";
  } else if (code === "unavailable" || code === "deadline-exceeded" || rawMessage.includes("timeout")) {
    message = "Firestore temporarily unavailable.";
  }

  return {
    code,
    message,
  };
}

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

  let todos: Awaited<ReturnType<typeof listarTodosLosProductosActivos>>;
  try {
    todos = await listarTodosLosProductosActivos();
  } catch (error) {
    console.error("[buscar:firestore-error]", detallesError(error));
    return NextResponse.json(
      { error: "El catalogo no esta disponible temporalmente." },
      { status: 503 },
    );
  }

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
