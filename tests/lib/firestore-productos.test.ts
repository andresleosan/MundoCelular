import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn<(...args: unknown[]) => Promise<{ docs: Array<{ data: () => Record<string, unknown> }> }>>();
const mockAddDoc = vi.fn<(...args: unknown[]) => Promise<{ id: string }>>(async () => ({ id: "prod-nuevo" }));
const mockUpdateDoc = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const mockAvisarRevalidacion = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});

vi.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: vi.fn(() => ({ path: "productos" })),
  deleteDoc: vi.fn(async () => {}),
  doc: vi.fn(() => ({ path: "productos/p1" })),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(() => ({ serverTimestamp: true })),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

vi.mock("@/lib/firebase", () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock("@/lib/revalidate", () => ({
  avisarRevalidacion: (...args: unknown[]) => mockAvisarRevalidacion(...args),
}));

import { actualizarProducto, crearProducto } from "@/lib/firestore/productos";

const input = {
  nombre: "iPhone 17 Pro Max",
  descripcion: "Equipo de prueba",
  precio: 6500000,
  stock: 3,
  categoriaId: "cat-celulares",
  marca: "Apple",
  specs: { Capacidad: "256GB" },
  activo: true,
  destacado: true,
  imagenes: [{ url: "https://img.test/full.webp", thumb: "https://img.test/thumb.webp", alt: "iPhone 17 Pro Max" }],
  tieneVariantes: true,
  atributosDisponibles: ["Color", "Capacidad"],
};

describe("persistencia de productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  describe("crearProducto", () => {
    it("persiste activo, destacado, imágenes y configuración de variantes", async () => {
      await crearProducto(input);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          activo: true,
          destacado: true,
          imagenes: input.imagenes,
          tieneVariantes: true,
          atributosDisponibles: input.atributosDisponibles,
        }),
      );
      expect(mockAvisarRevalidacion).toHaveBeenCalledWith(["productos"]);
    });

    it("usa defaults para variantes ausentes", async () => {
      await crearProducto({
        ...input,
        imagenes: undefined,
        tieneVariantes: undefined,
        atributosDisponibles: undefined,
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ imagenes: [], tieneVariantes: false, atributosDisponibles: [] }),
      );
    });
  });

  describe("actualizarProducto", () => {
    it("persiste defaults de variantes y revalida productos", async () => {
      await actualizarProducto("p1", {
        ...input,
        imagenes: undefined,
        tieneVariantes: undefined,
        atributosDisponibles: undefined,
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ imagenes: [], tieneVariantes: false, atributosDisponibles: [] }),
      );
      expect(mockAvisarRevalidacion).toHaveBeenCalledWith(["productos"]);
    });
  });
});
