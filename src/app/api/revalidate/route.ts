import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";

const TAGS_PERMITIDOS = new Set(["productos", "categorias", "config"]);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
    if (decoded.admin !== true) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }
    const body = (await req.json()) as { tags?: unknown };
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string" || !TAGS_PERMITIDOS.has(t))) {
      return NextResponse.json({ error: "Tags inválidos" }, { status: 400 });
    }
    for (const tag of body.tags as string[]) revalidateTag(tag);
    return NextResponse.json({ revalidado: true, tags: body.tags });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
