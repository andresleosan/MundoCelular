import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  verificarAdmin,
  listarAdmins,
  listarClientes,
  listarSolicitudesAdmin,
  asignarAdmin,
  aprobarSolicitudAdmin,
  rechazarSolicitudAdmin,
  revocarAdmin,
} = vi.hoisted(() => ({
  verificarAdmin: vi.fn(),
  listarAdmins: vi.fn(),
  listarClientes: vi.fn(),
  listarSolicitudesAdmin: vi.fn(),
  asignarAdmin: vi.fn(),
  aprobarSolicitudAdmin: vi.fn(),
  rechazarSolicitudAdmin: vi.fn(),
  revocarAdmin: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({ verificarAdmin }));
vi.mock("@/lib/firestore/usuarios", () => ({
  listarAdmins,
  listarClientes,
  listarSolicitudesAdmin,
  asignarAdmin,
  aprobarSolicitudAdmin,
  rechazarSolicitudAdmin,
  revocarAdmin,
}));

import { DELETE, GET, PATCH, POST } from "@/app/api/admin/usuarios/route";

describe("API admin usuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verificarAdmin.mockResolvedValue({ uid: "admin-1", admin: true });
    listarAdmins.mockResolvedValue([{ uid: "admin-1" }]);
    listarClientes.mockResolvedValue([{ uid: "cliente-1" }]);
    listarSolicitudesAdmin.mockResolvedValue([{ uid: "solicitud-1" }]);
    asignarAdmin.mockResolvedValue(undefined);
  rechazarSolicitudAdmin.mockResolvedValue(undefined);
    aprobarSolicitudAdmin.mockResolvedValue(undefined);
    revocarAdmin.mockResolvedValue(undefined);
  });

  function request(method: string, body?: unknown, url = "http://localhost:3000/api/admin/usuarios") {
    return new NextRequest(url, {
      method,
      headers: { authorization: "Bearer token-de-prueba", "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  it("GET devuelve administradores y solicitudes pendientes", async () => {
    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: {
        admins: [{ uid: "admin-1" }],
        solicitudes: [{ uid: "solicitud-1" }],
      },
    });
    expect(listarAdmins).toHaveBeenCalledOnce();
    expect(listarSolicitudesAdmin).toHaveBeenCalledOnce();
  });

  it("GET con role customer devuelve clientes sin cargar solicitudes", async () => {
    const response = await GET(request("GET", undefined, "http://localhost:3000/api/admin/usuarios?role=customer"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { clientes: [{ uid: "cliente-1" }] } });
    expect(listarClientes).toHaveBeenCalledOnce();
    expect(listarAdmins).not.toHaveBeenCalled();
    expect(listarSolicitudesAdmin).not.toHaveBeenCalled();
  });

  it("rechaza GET sin autenticacion", async () => {
    verificarAdmin.mockResolvedValueOnce(null);

    const response = await GET(request("GET"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "No autorizado" });
  });

  it("POST aprueba un administrador usando el UID recortado", async () => {
    const response = await POST(request("POST", { uid: "  usuario-1  " }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(asignarAdmin).toHaveBeenCalledWith("usuario-1");
  });

  it("POST con approve aprueba condicionalmente una solicitud", async () => {
    const response = await POST(request("POST", { uid: "  solicitud-1  ", action: "approve" }));

    expect(response.status).toBe(200);
    expect(aprobarSolicitudAdmin).toHaveBeenCalledWith("solicitud-1");
    expect(asignarAdmin).not.toHaveBeenCalled();
  });

  it("rechaza POST sin autenticacion", async () => {
    verificarAdmin.mockResolvedValueOnce(null);

    const response = await POST(request("POST", { uid: "usuario-1" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "No autorizado" });
    expect(asignarAdmin).not.toHaveBeenCalled();
  });

  it("PATCH rechaza una solicitud usando el UID recortado", async () => {
    const response = await PATCH(request("PATCH", { uid: "  usuario-1  ", action: "reject" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(rechazarSolicitudAdmin).toHaveBeenCalledWith("usuario-1");
  });

  it("rechaza PATCH sin autenticacion", async () => {
    verificarAdmin.mockResolvedValueOnce(null);

    const response = await PATCH(request("PATCH", { uid: "usuario-1", action: "reject" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "No autorizado" });
    expect(rechazarSolicitudAdmin).not.toHaveBeenCalled();
  });

  it.each([
    ["POST", { uid: "   " }, "UID requerido"],
    ["POST", { uid: 123 }, "UID requerido"],
    ["POST", { uid: "a".repeat(129) }, "UID invalido"],
    ["POST", { uid: "usuario-1", action: "reject" }, "Accion invalida"],
    ["PATCH", { uid: "   ", action: "reject" }, "UID requerido"],
    ["PATCH", { uid: "a".repeat(129), action: "reject" }, "UID invalido"],
    ["PATCH", { uid: "usuario-1", action: "approve" }, "Accion invalida"],
  ])("%s rechaza un body invalido", async (method, body, error) => {
    const response = method === "POST" ? await POST(request(method, body)) : await PATCH(request(method, body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ success: false, error });
    expect(asignarAdmin).not.toHaveBeenCalled();
    expect(rechazarSolicitudAdmin).not.toHaveBeenCalled();
  });

  it.each(["POST", "PATCH", "DELETE"])("devuelve 400 para JSON malformado en %s", async (method) => {
    const response = await (method === "POST" ? POST : method === "PATCH" ? PATCH : DELETE)(new NextRequest(
      "http://localhost:3000/api/admin/usuarios",
      { method, headers: { authorization: "Bearer token", "content-type": "application/json" }, body: "{" },
    ));

    expect(response.status).toBe(400);
  });

  it.each(["POST", "PATCH", "DELETE"])("devuelve 400 para un body no objeto en %s", async (method) => {
    const response = await (method === "POST" ? POST : method === "PATCH" ? PATCH : DELETE)(request(method, []));

    expect(response.status).toBe(400);
  });

  it("serializa Date y Timestamp de los usuarios", async () => {
    const requestedAt = new Date("2026-08-01T12:00:00.000Z");
    listarAdmins.mockResolvedValueOnce([{ uid: "admin-1", createdAt: requestedAt }]);
    listarSolicitudesAdmin.mockResolvedValueOnce([{
      uid: "solicitud-1",
      adminRequestedAt: { toDate: () => requestedAt },
    }]);

    const response = await GET(request("GET"));

    expect(await response.json()).toEqual({
      success: true,
      data: {
        admins: [{ uid: "admin-1", createdAt: "2026-08-01T12:00:00.000Z" }],
        solicitudes: [{ uid: "solicitud-1", adminRequestedAt: "2026-08-01T12:00:00.000Z" }],
      },
    });
  });

  it("responde 409 si aprobar o rechazar ya no encuentra una solicitud pendiente", async () => {
    const conflict = Object.assign(new Error("not pending"), { code: "REQUEST_NOT_PENDING" });
    aprobarSolicitudAdmin.mockRejectedValueOnce(conflict);

    const approveResponse = await POST(request("POST", { uid: "solicitud-1", action: "approve" }));
    expect(approveResponse.status).toBe(409);

    rechazarSolicitudAdmin.mockRejectedValueOnce(conflict);
    const rejectResponse = await PATCH(request("PATCH", { uid: "solicitud-1", action: "reject" }));
    expect(rejectResponse.status).toBe(409);
  });

  it("DELETE revoca un administrador usando el UID recortado", async () => {
    const response = await DELETE(request("DELETE", { uid: "  admin-2  " }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(revocarAdmin).toHaveBeenCalledWith("admin-2");
  });

  it("rechaza DELETE sin autenticacion", async () => {
    verificarAdmin.mockResolvedValueOnce(null);

    const response = await DELETE(request("DELETE", { uid: "admin-2" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "No autorizado" });
    expect(revocarAdmin).not.toHaveBeenCalled();
  });

  it("devuelve error generico si falla Firebase", async () => {
    listarAdmins.mockRejectedValueOnce(new Error("error interno de Firebase"));

    const response = await GET(request("GET"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: "Error interno del servidor" });
  });

  it.each([
    ["POST", asignarAdmin, POST, { uid: "usuario-1" }],
    ["PATCH", rechazarSolicitudAdmin, PATCH, { uid: "usuario-1", action: "reject" }],
    ["DELETE", revocarAdmin, DELETE, { uid: "admin-2" }],
  ])("%s devuelve error generico si falla la mutacion", async (_method, operation, handler, body) => {
    operation.mockRejectedValueOnce(new Error("error interno de Firebase"));

    const response = await handler(request(_method, body));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: "Error interno del servidor" });
  });
});
