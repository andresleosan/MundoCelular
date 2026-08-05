import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getAdminApp, verifyIdToken, crearOActualizarUsuario } = vi.hoisted(() => ({
  getAdminApp: vi.fn(() => ({})),
  verifyIdToken: vi.fn(),
  crearOActualizarUsuario: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({ verifyIdToken })),
}));
vi.mock("@/lib/firebase-admin", () => ({ getAdminApp }));
vi.mock("@/lib/firestore/usuarios", () => ({ crearOActualizarUsuario }));

import { POST } from "@/app/api/auth/sync/route";

describe("POST /api/auth/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no registra el email del usuario en los logs", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    verifyIdToken.mockResolvedValueOnce({
      uid: "uid-de-prueba",
      email: "privado@example.com",
      name: "Usuario de Prueba",
      picture: "https://example.com/avatar.jpg",
    });

    try {
      const response = await POST(
        new NextRequest("http://localhost:3000/api/auth/sync", {
          method: "POST",
          headers: { authorization: "Bearer token-de-prueba" },
        }),
      );

      expect(response.status).toBe(200);
      expect(logSpy.mock.calls.flat().join(" ")).not.toContain("privado@example.com");
    } finally {
      logSpy.mockRestore();
    }
  });
});
