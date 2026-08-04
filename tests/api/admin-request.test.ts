import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getAdminApp, verifyIdToken, solicitarAdmin } = vi.hoisted(() => ({
  getAdminApp: vi.fn(() => ({})),
  verifyIdToken: vi.fn(),
  solicitarAdmin: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({ verifyIdToken })),
}));
vi.mock("@/lib/firebase-admin", () => ({ getAdminApp }));
vi.mock("@/lib/firestore/usuarios", () => ({ solicitarAdmin }));

import { POST } from "@/app/api/auth/admin-request/route";

describe("POST /api/auth/admin-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function request(authorization = "Bearer token-de-prueba", body = { uid: "uid-del-navegador" }) {
    return new NextRequest("http://localhost:3000/api/auth/admin-request", {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("crea la solicitud usando la identidad del token", async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: "uid-del-token",
      email: "token@example.com",
      name: "Usuario Token",
      picture: "https://example.com/avatar.jpg",
      admin: false,
    });
    solicitarAdmin.mockResolvedValueOnce("created");

    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, status: "pending" });
    expect(solicitarAdmin).toHaveBeenCalledWith("uid-del-token", {
      email: "token@example.com",
      displayName: "Usuario Token",
      photoURL: "https://example.com/avatar.jpg",
    });
  });

  it("rechaza una cuenta que ya es administradora", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "admin-1", admin: true });

    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      success: false,
      error: "Esta cuenta ya tiene permisos de administrador.",
    });
    expect(solicitarAdmin).not.toHaveBeenCalled();
  });

  it("rechaza una solicitud que ya esta pendiente", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "user-1", admin: false });
    solicitarAdmin.mockResolvedValueOnce("already-pending");

    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      success: false,
      error: "Tu solicitud de administrador ya esta pendiente.",
    });
  });

  it("rechaza una solicitud sin autenticacion", async () => {
    const response = await POST(request(""));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "No autorizado" });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it("rechaza un token invalido", async () => {
    verifyIdToken.mockRejectedValueOnce(new Error("token invalido"));

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "No autorizado" });
    expect(solicitarAdmin).not.toHaveBeenCalled();
  });

  it("devuelve error interno y no registra el token cuando falla la solicitud", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    verifyIdToken.mockResolvedValueOnce({ uid: "user-1", admin: false });
    solicitarAdmin.mockRejectedValueOnce(new Error("fallo con token-secreto"));

    try {
      const response = await POST(request());

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ success: false, error: "Error interno" });
      expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("token-secreto");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("aplica un limite fijo por UID y devuelve Retry-After", async () => {
    verifyIdToken.mockResolvedValue({ uid: "rate-limit-user", admin: false });
    solicitarAdmin.mockResolvedValue("created");

    for (let index = 0; index < 5; index += 1) {
      expect((await POST(request())).status).toBe(201);
    }

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).toEqual({ success: false, error: "Demasiadas solicitudes. Intenta de nuevo mas tarde." });
  });
});
