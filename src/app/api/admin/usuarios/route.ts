import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/api-auth";
import { listarAdmins, listarClientes, asignarAdmin, revocarAdmin } from "@/lib/firestore/usuarios";

export async function GET(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    if (role === "customer") {
      const clientes = await listarClientes();
      return NextResponse.json({ clientes });
    }
    const admins = await listarAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    console.error("[admin/usuarios GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { uid } = await req.json();
    if (!uid || typeof uid !== "string" || !uid.trim()) {
      return NextResponse.json({ error: "UID requerido" }, { status: 400 });
    }
    await asignarAdmin(uid.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/usuarios POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { uid } = await req.json();
    if (!uid || typeof uid !== "string" || !uid.trim()) {
      return NextResponse.json({ error: "UID requerido" }, { status: 400 });
    }
    await revocarAdmin(uid.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/usuarios DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
