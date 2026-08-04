import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
const mockWhere = vi.fn<(...args: unknown[]) => void>();
const mockOrderBy = vi.fn<(...args: unknown[]) => void>();

function makeChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  chain.where = vi.fn((...args: unknown[]) => {
    mockWhere(...args);
    return chain;
  });
  chain.orderBy = vi.fn((...args: unknown[]) => {
    mockOrderBy(...args);
    return chain;
  });
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
  listarProductosActivos,
  getCategoriaPorSlug,
  listarProductosCategoria,
  getProductoPorSlug,
  listarDestacados,
  obtenerConfigTiendaServidor,
  listarTodosLosSlugsProducto,
  listarTodosLosProductosActivos,
  obtenerVariantesPorProducto,
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

  afterEach(() => {
    mockOrderBy.mockReset();
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

  describe("mappers públicos", () => {
    it("no propaga campos internos de categorías ni configuración", async () => {
      mockGetFn.mockResolvedValueOnce({
        docs: [makeDocData("c1", { ...mockCategoriaData, secreto: "interno" })],
        empty: false,
      });
      const categoria = await getCategoriaPorSlug("celulares");
      expect(categoria).toEqual({ id: "c1", ...mockCategoriaData });
      expect(categoria).not.toHaveProperty("secreto");

      mockDocGetFn.mockResolvedValueOnce({
        exists: true,
        data: () => ({ ...mockConfigTienda, apiSecret: "interno" }),
      });
      const config = await obtenerConfigTiendaServidor();
      expect(config).toEqual(mockConfigTienda);
      expect(config).not.toHaveProperty("apiSecret");
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

  describe("listarProductosActivos", () => {
    it("expone productos planos sin timestamps internos de Firestore", async () => {
      mockGetFn.mockResolvedValue({
        docs: [makeDocData("p1", {
          ...mockProductoData,
          creadoEn: { toMillis: () => 20 },
          actualizadoEn: { toMillis: () => 21 },
        })],
        empty: false,
      });

      const productos = await listarProductosActivos();

      expect(productos[0]).toMatchObject({ id: "p1", nombre: "iPhone 13", activo: true });
      expect(productos[0]).not.toHaveProperty("creadoEn");
      expect(productos[0]).not.toHaveProperty("actualizadoEn");
    });

    it("ordena productos activos por creadoEn sin depender del índice compuesto", async () => {
      mockOrderBy.mockImplementation(() => {
        throw new Error("FAILED_PRECONDITION: The query requires an index");
      });
      mockGetFn.mockResolvedValue({
        docs: [
          makeDocData("p-sin-fecha", { ...mockProductoData, creadoEn: undefined }),
          makeDocData("p-plano", {
            ...mockProductoData,
            creadoEn: { _seconds: 1, _nanoseconds: 500_000_000 },
          }),
          makeDocData("p-timestamp", {
            ...mockProductoData,
            creadoEn: { toMillis: () => 2_500 },
          }),
        ],
        empty: false,
      });

      const productos = await listarProductosActivos();

      expect(productos.map((producto) => producto.id)).toEqual([
        "p-timestamp",
        "p-plano",
        "p-sin-fecha",
      ]);
      expect(productos.every((producto) => producto.activo)).toBe(true);
      expect(mockOrderBy).not.toHaveBeenCalled();
    });

    it("conserva metadatos SEO y sanitiza estructuras anidadas", async () => {
      const timestamp = { toMillis: () => 20 };
      mockGetFn.mockResolvedValue({
        docs: [makeDocData("p1", {
          ...mockProductoData,
          metaTitle: "iPhone 13 | Mundo Celular",
          metaDescription: "Compra el iPhone 13 en Mundo Celular.",
          specs: {
            Capacidad: "128GB",
            interno: timestamp,
            precioInterno: 1000,
          },
          imagenes: [
            {
              url: "https://img.test/full.webp",
              thumb: "https://img.test/thumb.webp",
              alt: "iPhone 13",
              creadoEn: timestamp,
            },
            { url: timestamp, thumb: "https://img.test/second.webp", alt: { toMillis: () => 21 } },
            timestamp,
          ],
          atributosDisponibles: ["Color", timestamp, 128],
        })],
        empty: false,
      });

      const productos = await listarProductosActivos();

      expect(productos[0]).toMatchObject({
        metaTitle: "iPhone 13 | Mundo Celular",
        metaDescription: "Compra el iPhone 13 en Mundo Celular.",
        specs: { Capacidad: "128GB" },
        imagenes: [
          { url: "https://img.test/full.webp", thumb: "https://img.test/thumb.webp", alt: "iPhone 13" },
          { url: "", thumb: "https://img.test/second.webp", alt: "" },
        ],
        atributosDisponibles: ["Color"],
      });
      expect(productos[0].specs).not.toHaveProperty("interno");
      expect(productos[0].imagenes[0]).not.toHaveProperty("creadoEn");
    });

    it("consulta únicamente productos activos", async () => {
      mockGetFn.mockResolvedValue({ docs: [], empty: true });

      await listarProductosActivos();

      expect(mockWhere).toHaveBeenCalledWith("activo", "==", true);
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

    it("usa los campos públicos activo y destacado y ordena por nombre", async () => {
      mockGetFn.mockResolvedValue({
        docs: [makeDocData("p1", mockProductoData)],
        empty: false,
      });

      await listarDestacados();

      expect(mockWhere).toHaveBeenCalledWith("activo", "==", true);
      expect(mockWhere).toHaveBeenCalledWith("destacado", "==", true);
      expect(mockWhere.mock.calls.some(([field]) => field === "active" || field === "featured")).toBe(false);
      expect(mockOrderBy).toHaveBeenCalledWith("nombre");
    });
  });

  describe("listarTodosLosProductosActivos", () => {
    it("instrumenta la consulta activa ordenada usada por búsqueda", async () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => {});

      try {
        await listarTodosLosProductosActivos();

        expect(info).toHaveBeenCalledWith(
          "[firestore:read]",
          expect.objectContaining({
            nombre: "todos-productos-activos",
            coleccion: "productos",
            filtros: ["activo == true", "orderBy nombre"],
          }),
        );
        expect(mockWhere).toHaveBeenCalledWith("activo", "==", true);
        expect(mockOrderBy).toHaveBeenCalledWith("nombre");
      } finally {
        info.mockRestore();
      }
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

describe("variantes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("obtenerVariantesPorProducto", () => {
    it("devuelve variantes activas del producto", async () => {
      mockGetFn.mockResolvedValue({
        docs: [
          makeDocData("v1", {
            productId: "prod1",
            attributes: { Color: "Negro", Capacidad: "128GB" },
            precio: 1850000,
            stock: 5,
            imagenes: [],
            activo: true,
          }),
        ],
        empty: false,
      });
      const variantes = await obtenerVariantesPorProducto("prod1");
      expect(Array.isArray(variantes)).toBe(true);
      expect(variantes).toHaveLength(1);
      expect(variantes[0].productId).toBe("prod1");
    });

    it("devuelve array vacío si no hay variantes", async () => {
      mockGetFn.mockResolvedValue({ docs: [], empty: true });
      const variantes = await obtenerVariantesPorProducto("prod1");
      expect(variantes).toEqual([]);
    });

    it("devuelve variantes planas y sanea estructuras internas de Firestore", async () => {
      const timestamp = { toMillis: () => 20 };
      mockGetFn.mockResolvedValue({
        docs: [
          makeDocData("v1", {
            productId: "prod1",
            attributes: { Color: "Negro", interno: timestamp, unidades: 8 },
            precio: 1850000,
            stock: 5,
            imagenes: [
              { url: "https://img.test/variant.webp", thumb: "https://img.test/variant-thumb.webp", alt: "Variante" },
              { url: timestamp, thumb: "", alt: "" },
            ],
            activo: true,
            creadoEn: timestamp,
          }),
        ],
        empty: false,
      });

      const variantes = await obtenerVariantesPorProducto("prod1");

      expect(variantes[0]).toEqual({
        id: "v1",
        productId: "prod1",
        attributes: { Color: "Negro" },
        precio: 1850000,
        stock: 5,
        imagenes: [
          { url: "https://img.test/variant.webp", thumb: "https://img.test/variant-thumb.webp", alt: "Variante" },
          { url: "", thumb: "", alt: "" },
        ],
        activo: true,
      });
      expect(variantes[0]).not.toHaveProperty("creadoEn");
    });
  });
});
