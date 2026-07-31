import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { verificarAdmin } from "@/lib/api-auth";
import { validarVariante, type VarianteInput } from "@/lib/validacion";

export async function GET(req: NextRequest) {
  const admin = await verificarAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const productoId = req.nextUrl.searchParams.get("productoId");
  if (!productoId) {
    return NextResponse.json({ error: "productoId es obligatorio" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db
    .collection("variantes")
    .where("productId", "==", productoId)
    .orderBy("precio")
    .get();

  const variantes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ variantes });
}

export async function POST(req: NextRequest) {
  const admin = await verificarAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as VarianteInput;
  const errores = validarVariante(body);
  if (errores.length > 0) {
    return NextResponse.json({ error: errores.join(". ") }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = await db.collection("variantes").add({
    productId: body.productId,
    attributes: body.attributes,
    precio: body.precio,
    stock: body.stock,
    imagenes: body.imagenes ?? [],
    activo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  });

  revalidateTag("variantes");
  revalidateTag("productos");

  return NextResponse.json({ id: ref.id });
}
