import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST, runtime } from "@/app/api/revalidate/route";
import { verificarAdmin } from "@/lib/api-auth";

const { verifyIdToken, revalidateTag, getAdminApp } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  revalidateTag: vi.fn(),
  getAdminApp: vi.fn(() => ({})),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({ verifyIdToken })),
}));
vi.mock("@/lib/firebase-admin", () => ({ getAdminApp }));
vi.mock("next/cache", () => ({ revalidateTag }));

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function request(body: string, authorization = "Bearer token-de-prueba") {
    return new NextRequest("http://localhost/api/revalidate", {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body,
    });
  }

  it("declara runtime Node.js", () => {
    expect(runtime).toBe("nodejs");
  });

  it("rechaza una solicitud sin bearer", async () => {
    const response = await POST(request(JSON.stringify({ tags: ["productos"] }), ""));

    expect(response.status).toBe(401);
  });

  it("rechaza un token que no se puede verificar", async () => {
    verifyIdToken.mockRejectedValueOnce(new Error("invalid token"));

    const response = await POST(request(JSON.stringify({ tags: ["productos"] })));

    expect(response.status).toBe(401);
  });

  it("devuelve 503 cuando Firebase Admin no puede inicializarse", async () => {
    getAdminApp.mockImplementationOnce(() => {
      throw Object.assign(new Error("missing config"), { code: "firebase-admin/missing-config" });
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await POST(request(JSON.stringify({ tags: ["productos"] })));

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "Servicio de autenticación no disponible." });
      expect(errorSpy).toHaveBeenCalledWith("[revalidate:auth-error]", {
        code: "firebase-admin/missing-config",
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("devuelve 503 cuando las credenciales Admin son inválidas", async () => {
    getAdminApp.mockImplementationOnce(() => {
      throw Object.assign(new Error("invalid credentials"), { code: "auth/invalid-credential" });
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await POST(request(JSON.stringify({ tags: ["productos"] })));

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "Servicio de autenticación no disponible." });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("registra solo detalles sanitizados cuando falla la verificacion compartida", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error("token-de-prueba"), { code: "auth/id-token-expired" }),
    );

    try {
      await expect(verificarAdmin(request(JSON.stringify({ tags: ["productos"] })))).resolves.toBeNull();

      expect(errorSpy).toHaveBeenCalledWith("[api-auth:verify-error]", {
        code: "auth/id-token-expired",
        message: "No se pudo verificar el token.",
      });
      expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("token-de-prueba");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("rechaza un token sin claim de administrador", async () => {
    verifyIdToken.mockResolvedValueOnce({ admin: false });

    const response = await POST(request(JSON.stringify({ tags: ["productos"] })));

    expect(response.status).toBe(403);
  });

  it("devuelve 400 para JSON invalido", async () => {
    verifyIdToken.mockResolvedValueOnce({ admin: true });

    const response = await POST(request("{"));

    expect(response.status).toBe(400);
  });

  it("devuelve 400 para un body JSON sin objeto de tags", async () => {
    verifyIdToken.mockResolvedValueOnce({ admin: true });

    const response = await POST(request("null"));

    expect(response.status).toBe(400);
  });

  it("devuelve 400 para tags fuera de la lista permitida", async () => {
    verifyIdToken.mockResolvedValueOnce({ admin: true });

    const response = await POST(request(JSON.stringify({ tags: ["usuarios"] })));

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("devuelve 400 para una lista de tags vacía", async () => {
    verifyIdToken.mockResolvedValueOnce({ admin: true });

    const response = await POST(request(JSON.stringify({ tags: [] })));

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalida tags permitidos para un admin", async () => {
    verifyIdToken.mockResolvedValueOnce({ admin: true });

    const response = await POST(request(JSON.stringify({ tags: ["productos", "categorias"] })));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      revalidado: true,
      tags: ["productos", "categorias"],
    });
    expect(revalidateTag).toHaveBeenCalledWith("productos", "max");
    expect(revalidateTag).toHaveBeenCalledWith("categorias", "max");
  });

  it("devuelve 500 cuando revalidateTag falla", async () => {
    verifyIdToken.mockResolvedValueOnce({ admin: true });
    revalidateTag.mockImplementationOnce(() => {
      throw new Error("cache unavailable");
    });

    const response = await POST(request(JSON.stringify({ tags: ["productos"] })));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "No se pudo invalidar el cache." });
  });
});
