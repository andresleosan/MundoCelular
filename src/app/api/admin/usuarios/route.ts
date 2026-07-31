import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verificarAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const admin = await verificarAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getAdminDb();
  const snapshot = await db.collection("usuarios").where("admin", "==", true).get();
  const admins = snapshot.docs.map((doc) => doc.data());

  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  const admin = await verificarAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { email } = (await req.json()) as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getAdminDb();
  const docRef = db.collection("usuarios").doc(normalizedEmail);
  const doc = await docRef.get();

  if (doc.exists && doc.data()?.admin === true) {
    return NextResponse.json({ error: "Este usuario ya tiene permisos de administrador." }, { status: 409 });
  }

  await docRef.set(
    {
      email: normalizedEmail,
      admin: true,
      pendiente: true,
      creadoEn: new Date(),
    },
    { merge: true }
  );

  return NextResponse.json({
    ok: true,
    mensaje: "Permiso asignado. El usuario debe cerrar sesión y volver a entrar.",
  });
}

export async function DELETE(req: NextRequest) {
  const admin = await verificarAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { email } = (await req.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === (admin.email || "").toLowerCase()) {
    return NextResponse.json({ error: "No puedes quitarte tu propio permiso." }, { status: 400 });
  }

  const db = getAdminDb();
  const docRef = db.collection("usuarios").doc(normalizedEmail);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.admin !== true) {
    return NextResponse.json({ error: "Este usuario no es administrador." }, { status: 404 });
  }

  await docRef.update({ admin: false });

  return NextResponse.json({ ok: true, mensaje: "Permiso revocado." });
}
