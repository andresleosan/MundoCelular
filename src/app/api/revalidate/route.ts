import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";
import { normalizarCodigoFirestore } from "@/lib/firestore/diagnostics";

export const runtime = "nodejs";

const TAGS_PERMITIDOS = new Set(["productos", "categorias", "config"]);

function codigoErrorAuth(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? (error as { code?: unknown }).code
    : undefined;
  if (typeof code === "string" && (/^auth\/[a-z0-9-]+$/.test(code) || /^app\/[a-z0-9-]+$/.test(code))) {
    return code;
  }
  if (typeof code === "string" && code === "firebase-admin/missing-config") {
    return code;
  }
  return normalizarCodigoFirestore(code);
}

function respuestaErrorAuth(error: unknown) {
  const code = codigoErrorAuth(error);
  console.error("[revalidate:auth-error]", { code });
  const infraestructura =
    code === "firebase-admin/missing-config" ||
    code === "app/invalid-credential" ||
    code === "app/no-app" ||
    code === "auth/invalid-credential" ||
    code === "auth/internal-error";

  return NextResponse.json(
    { error: infraestructura ? "Servicio de autenticación no disponible." : "Token inválido" },
    { status: infraestructura ? 503 : 401 },
  );
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAuth(getAdminApp()).verifyIdToken(token);
  } catch (error) {
    return respuestaErrorAuth(error);
  }

  if (decoded.admin !== true) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Tags inválidos" }, { status: 400 });
  }

  const tags = typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as { tags?: unknown }).tags
    : undefined;

  if (!Array.isArray(tags) || tags.length === 0 || tags.some((tag) => typeof tag !== "string" || !TAGS_PERMITIDOS.has(tag))) {
    return NextResponse.json({ error: "Tags inválidos" }, { status: 400 });
  }

  try {
    for (const tag of tags) revalidateTag(tag);
  } catch {
    return NextResponse.json({ error: "No se pudo invalidar el cache." }, { status: 500 });
  }

  return NextResponse.json({ revalidado: true, tags });
}
