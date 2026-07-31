import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAddDocFn = vi.fn();
const mockUpdateFn = vi.fn();
const mockDeleteFn = vi.fn();
const mockGetFn = vi.fn<() => Promise<{ docs: Array<{ id: string; data: () => Record<string, unknown> }>; empty: boolean }>>();

vi.mock("@/lib/api-auth", () => ({
  verificarAdmin: vi.fn().mockResolvedValue({ uid: "admin1", admin: true }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          get: mockGetFn,
        })),
        get: mockGetFn,
      })),
      orderBy: vi.fn(() => ({
        get: mockGetFn,
      })),
      doc: vi.fn((id: string) => ({
        get: vi.fn().mockResolvedValue({ exists: true, id, data: () => ({ productId: "prod1" }) }),
        update: mockUpdateFn,
        delete: mockDeleteFn,
      })),
      add: mockAddDocFn,
    })),
  })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { POST, GET } from "@/app/api/admin/variantes/route";
import { PUT, DELETE } from "@/app/api/admin/variantes/[id]/route";

describe("API admin variantes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDocFn.mockResolvedValue({ id: "newId" });
  });

  function makeReq(body: unknown, url = "http://localhost:3000/api/admin/variantes"): NextRequest {
    return new NextRequest(new Request(url, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json", authorization: "Bearer valid-token" },
    }));
  }

  describe("POST /api/admin/variantes", () => {
    it("crea una variante y retorna el id", async () => {
      const body = {
        productId: "prod1",
        attributes: { Color: "Negro", Capacidad: "128GB" },
        precio: 1850000,
        stock: 5,
        imagenes: [],
      };

      const res = await POST(makeReq(body));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe("newId");
      expect(mockAddDocFn).toHaveBeenCalled();
    });

    it("rechaza si falta productId", async () => {
      const body = {
        attributes: { Color: "Negro" },
        precio: 1850000,
        stock: 5,
      };

      const res = await POST(makeReq(body));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("El producto es obligatorio");
    });

    it("rechaza si precio no es entero positivo", async () => {
      const body = {
        productId: "prod1",
        attributes: { Color: "Negro" },
        precio: 0,
        stock: 5,
      };

      const res = await POST(makeReq(body));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("El precio debe ser un entero mayor que 0");
    });
  });

  describe("GET /api/admin/variantes", () => {
    it("retorna variantes del producto", async () => {
      mockGetFn.mockResolvedValue({
        docs: [
          {
            id: "v1",
            data: () => ({
              productId: "prod1",
              attributes: { Color: "Negro" },
              precio: 1850000,
              stock: 5,
              imagenes: [],
              activo: true,
            }),
          },
        ],
        empty: false,
      });

      const req = makeReq({}, "http://localhost:3000/api/admin/variantes?productoId=prod1");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.variantes)).toBe(true);
    });

    it("rechaza si falta productoId", async () => {
      const req = makeReq({}, "http://localhost:3000/api/admin/variantes");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("productoId");
    });
  });

  describe("PUT /api/admin/variantes/[id]", () => {
    it("actualiza una variante", async () => {
      const body = { stock: 10 };
      const req = new NextRequest(
        new Request("http://localhost:3000/api/admin/variantes/v1", {
          method: "PUT",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json", authorization: "Bearer valid-token" },
        })
      );

      const res = await PUT(req, { params: Promise.resolve({ id: "v1" }) });

      expect(res.status).toBe(200);
      expect(mockUpdateFn).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/admin/variantes/[id]", () => {
    it("elimina una variante", async () => {
      const req = new NextRequest(
        new Request("http://localhost:3000/api/admin/variantes/v1", {
          method: "DELETE",
          headers: { authorization: "Bearer valid-token" },
        })
      );

      const res = await DELETE(req, { params: Promise.resolve({ id: "v1" }) });

      expect(res.status).toBe(200);
      expect(mockDeleteFn).toHaveBeenCalled();
    });
  });
});
