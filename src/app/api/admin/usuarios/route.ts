import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/api-auth";
import { listarAdmins, listarClientes, asignarAdmin, revocarAdmin } from "@/lib/firestore/usuarios";

export async function GET(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    if (role === "customer") {
      const clientes = await listarClientes();
      return NextResponse.json({ success: true, data: { clientes } });
    }
    const admins = await listarAdmins();
    return NextResponse.json({ success: true, data: { admins } });
  } catch (error) {
    console.error("[api/admin/usuarios GET] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const { uid } = await req.json();
    if (!uid || typeof uid !== "string" || !uid.trim()) {
      return NextResponse.json({ success: false, error: "UID requerido" }, { status: 400 });
    }
    await asignarAdmin(uid.trim());
    console.log(`[api/admin/usuarios POST] Admin asignado uid=${uid.trim()}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/usuarios POST] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const { uid } = await req.json();
    if (!uid || typeof uid !== "string" || !uid.trim()) {
      return NextResponse.json({ success: false, error: "UID requerido" }, { status: 400 });
    }
    await revocarAdmin(uid.trim());
    console.log(`[api/admin/usuarios DELETE] Admin revocado uid=${uid.trim()}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/usuarios DELETE] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
