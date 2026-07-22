import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCategoriaData = {
  nombre: "Celulares",
  slug: "celulares",
  descripcion: "Todos los celulares",
  orden: 1,
  activa: true,
};

const mockProductoData = {
  nombre: "iPhone 13",
  slug: "iphone-13",
  descripcion: "Apple iPhone 13",
  precio: 1000,
  stock: 3,
  categoriaId: "c1",
  marca: "Apple",
  specs: {},
  imagenes: [],
  activo: true,
  destacado: true,
};

const mockConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: "573113554021",
  direccion: "Calle 123",
  ciudad: "Bogotá",
  departamento: "Cundinamarca",
  pais: "Colombia",
  horario: "L-V 9-6",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

type DocData = { id: string; data: () => Record<string, unknown> };
type MockQueryResult = { docs: DocData[]; empty: boolean };

function makeDocData(id: string, data: Record<string, unknown>): DocData {
  return { id, data: () => data };
}

const mockGetFn = vi.fn<() => Promise<MockQueryResult>>();
const mockDocGetFn = vi.fn<() => Promise<{ exists: boolean; data: () => Record<string, unknown> | null }>>();

function makeChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  chain.where = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.limit = vi.fn(() => ({ get: mockGetFn }));
  chain.get = mockGetFn;
  return chain;
}

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => makeChain()),
    doc: vi.fn(() => ({
      get: mockDocGetFn,
    })),
  })),
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

import {
  listarCategoriasPublic,
  getCategoriaPorSlug,
  listarProductosCategoria,
  getProductoPorSlug,
  listarDestacados,
  obtenerConfigTiendaServidor,
  listarTodosLosSlugsProducto,
} from "@/lib/firestore/public";

describe("lecturas servidor del catálogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFn.mockResolvedValue({
      docs: [makeDocData("c1", mockCategoriaData)],
      empty: false,
    });
    mockDocGetFn.mockResolvedValue({ exists: true, data: () => mockConfigTienda });
  });

  describe("listarCategoriasPublic", () => {
    it("devuelve un array", async () => {
      const cats = await listarCategoriasPublic();
      expect(Array.isArray(cats)).toBe(true);
    });

    it("devuelve categorías con id, nombre, slug", async () => {
      const cats = await listarCategoriasPublic();
      expect(cats[0]).toHaveProperty("id");
      expect(cats[0]).toHaveProperty("nombre");
      expect(cats[0]).toHaveProperty("slug");
    });
  });

  describe("getCategoriaPorSlug", () => {
    it("devuelve categoría cuando existe el slug", async () => {
      mockGetFn.mockResolvedValue({
        docs: [makeDocData("c1", mockCategoriaData)],
        empty: false,
      });
      const cat = await getCategoriaPorSlug("celulares");
      expect(cat).not.toBeNull();
      expect(cat!.slug).toBe("celulares");
    });

    it("devuelve null si el slug no existe", async () => {
      mockGetFn.mockResolvedValue({ docs: [], empty: true });
      const cat = await getCategoriaPorSlug("inexistente");
      expect(cat).toBeNull();
    });
  });

  describe("listarProductosCategoria", () => {
    it("devuelve un array", async () => {
      mockGetFn.mockResolvedValue({
        docs: [makeDocData("p1", mockProductoData)],
        empty: false,
      });
      const prods = await listarProductosCategoria("c1");
      expect(Array.isArray(prods)).toBe(true);
    });

    it("devuelve productos con id, nombre, precio", async () => {
      mockGetFn.mockResolvedValue({
        docs: [makeDocData("p1", mockProductoData)],
        empty: false,
      });
      const prods = await listarProductosCategoria("c1");
      expect(prods[0]).toHaveProperty("id");
      expect(prods[0]).toHaveProperty("nombre");
      expect(prods[0]).toHaveProperty("precio");
    });
  });

  describe("getProductoPorSlug", () => {
    it("devuelve producto cuando existen ambos slugs", async () => {
      mockGetFn
        .mockResolvedValueOnce({ docs: [makeDocData("c1", mockCategoriaData)], empty: false })
        .mockResolvedValueOnce({ docs: [makeDocData("p1", mockProductoData)], empty: false });
      const prod = await getProductoPorSlug("celulares", "iphone-13");
      expect(prod).not.toBeNull();
      expect(prod!.slug).toBe("iphone-13");
    });

    it("devuelve null si el producto no existe", async () => {
      mockGetFn
        .mockResolvedValueOnce({ docs: [makeDocData("c1", mockCategoriaData)], empty: false })
        .mockResolvedValueOnce({ docs: [], empty: true });
      const prod = await getProductoPorSlug("celulares", "no-existe");
      expect(prod).toBeNull();
    });
  });

  describe("listarDestacados", () => {
    it("devuelve un array", async () => {
      mockGetFn.mockResolvedValue({
        docs: [makeDocData("p1", mockProductoData)],
        empty: false,
      });
      const prods = await listarDestacados();
      expect(Array.isArray(prods)).toBe(true);
    });
  });

  describe("obtenerConfigTiendaServidor", () => {
    it("devuelve la configuración con nombre y whatsapp", async () => {
      mockDocGetFn.mockResolvedValue({ exists: true, data: () => mockConfigTienda });
      const config = await obtenerConfigTiendaServidor();
      expect(config).toHaveProperty("nombre");
      expect(config).toHaveProperty("whatsapp");
    });

    it("lanza error si configuracion/tienda no existe", async () => {
      mockDocGetFn.mockResolvedValue({ exists: false, data: () => null });
      await expect(obtenerConfigTiendaServidor()).rejects.toThrow("Falta configuracion/tienda");
    });
  });

  describe("listarTodosLosSlugsProducto", () => {
    it("devuelve array con slugs de categoría y producto", async () => {
      mockGetFn
        .mockResolvedValueOnce({ docs: [makeDocData("c1", mockCategoriaData)], empty: false })
        .mockResolvedValueOnce({ docs: [makeDocData("p1", mockProductoData)], empty: false });
      const slugs = await listarTodosLosSlugsProducto();
      expect(Array.isArray(slugs)).toBe(true);
      expect(slugs[0]).toHaveProperty("categoria");
      expect(slugs[0]).toHaveProperty("producto");
      expect(slugs[0].categoria).toBe("celulares");
      expect(slugs[0].producto).toBe("iphone-13");
    });
  });
});