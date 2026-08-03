import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";
import { crearOActualizarUsuario } from "@/lib/firestore/usuarios";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const token = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
    await crearOActualizarUsuario(token.uid, {
      email: token.email ?? "",
      displayName: token.name ?? "",
      photoURL: token.picture ?? "",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[auth/sync]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
