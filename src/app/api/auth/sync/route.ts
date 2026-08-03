import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";
import { crearOActualizarUsuario } from "@/lib/firestore/usuarios";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    const token = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
    await crearOActualizarUsuario(token.uid, {
      email: token.email ?? "",
      displayName: token.name ?? "",
      photoURL: token.picture ?? "",
    });
    console.log(`[api/auth/sync] Sync OK uid=${token.uid} email=${token.email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/auth/sync] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
