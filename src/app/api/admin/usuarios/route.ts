import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/api-auth";
import {
  listarAdmins,
  listarClientes,
  listarSolicitudesAdmin,
  asignarAdmin,
  aprobarSolicitudAdmin,
  rechazarSolicitudAdmin,
  revocarAdmin,
} from "@/lib/firestore/usuarios";
import type { Usuario } from "@/types";

type Body = Record<string, unknown>;

function serializarValor(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : value;
  }
  return value;
}

function serializarUsuario(usuario: Usuario): Record<string, unknown> {
  return Object.fromEntries(Object.entries(usuario).map(([key, value]) => [key, serializarValor(value)]));
}

async function leerBody(req: NextRequest): Promise<Body | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body as Body : null;
  } catch {
    return null;
  }
}

function validarUid(body: Body): { uid?: string; error?: string } {
  if (typeof body.uid !== "string" || !body.uid.trim()) return { error: "UID requerido" };
  const uid = body.uid.trim();
  return uid.length <= 128 ? { uid } : { error: "UID invalido" };
}

function esSolicitudNoPendiente(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "REQUEST_NOT_PENDING",
  );
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    if (role === "customer") {
      const clientes = await listarClientes();
      return NextResponse.json({ success: true, data: { clientes: clientes.map(serializarUsuario) } });
    }
    const [admins, solicitudes] = await Promise.all([listarAdmins(), listarSolicitudesAdmin()]);
    return NextResponse.json({
      success: true,
      data: { admins: admins.map(serializarUsuario), solicitudes: solicitudes.map(serializarUsuario) },
    });
  } catch (error) {
    console.error("[api/admin/usuarios GET] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const body = await leerBody(req);
    if (!body) return NextResponse.json({ success: false, error: "Cuerpo invalido" }, { status: 400 });
    const { uid, error } = validarUid(body);
    if (error) return NextResponse.json({ success: false, error }, { status: 400 });
    if (body.action !== undefined && body.action !== "approve") {
      return NextResponse.json({ success: false, error: "Accion invalida" }, { status: 400 });
    }
    if (body.action === "approve") {
      await aprobarSolicitudAdmin(uid!);
    } else {
      await asignarAdmin(uid!);
    }
    console.log(`[api/admin/usuarios POST] Admin asignado uid=${uid}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (esSolicitudNoPendiente(error)) {
      return NextResponse.json({ success: false, error: "La solicitud ya no esta pendiente" }, { status: 409 });
    }
    console.error("[api/admin/usuarios POST] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const body = await leerBody(req);
    if (!body) return NextResponse.json({ success: false, error: "Cuerpo invalido" }, { status: 400 });
    const { uid, error } = validarUid(body);
    if (error) return NextResponse.json({ success: false, error }, { status: 400 });
    if (body.action !== "reject") {
      return NextResponse.json({ success: false, error: "Accion invalida" }, { status: 400 });
    }
    await rechazarSolicitudAdmin(uid!);
    console.log(`[api/admin/usuarios PATCH] Solicitud rechazada uid=${uid}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (esSolicitudNoPendiente(error)) {
      return NextResponse.json({ success: false, error: "La solicitud ya no esta pendiente" }, { status: 409 });
    }
    console.error("[api/admin/usuarios PATCH] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const body = await leerBody(req);
    if (!body) return NextResponse.json({ success: false, error: "Cuerpo invalido" }, { status: 400 });
    const { uid, error } = validarUid(body);
    if (error) return NextResponse.json({ success: false, error }, { status: 400 });
    await revocarAdmin(uid!);
    console.log(`[api/admin/usuarios DELETE] Admin revocado uid=${uid}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/usuarios DELETE] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
