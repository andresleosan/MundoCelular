import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { verificarAdmin } from "@/lib/api-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const admin = await verificarAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json()) as Record<string, unknown>;

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  const db = getAdminDb();
  await db.collection("variantes").doc(id).update({ ...body, actualizadoEn: new Date() });

  revalidateTag("variantes");
  revalidateTag("productos");

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const admin = await verificarAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = getAdminDb();
  await db.collection("variantes").doc(id).delete();

  revalidateTag("variantes");
  revalidateTag("productos");

  return NextResponse.json({ ok: true });
}
