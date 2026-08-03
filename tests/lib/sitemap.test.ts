import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCategorias = [
  { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "Todos los celulares", orden: 1, activa: true },
];

const mockSlugs = [
  { categoria: "celulares", producto: "iphone-13" },
];

const mockProductos = [
  {
    id: "p1", nombre: "iPhone 13", slug: "iphone-13", descripcion: "OK",
    precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple", specs: {}, imagenes: [],
    activo: true, destacado: false,
  },
];

vi.mock("@/lib/firestore/public", () => ({
  listarCategoriasPublic: vi.fn(() => Promise.resolve(mockCategorias)),
  listarTodosLosSlugsProducto: vi.fn(() => Promise.resolve(mockSlugs)),
  listarProductosActivos: vi.fn(() => Promise.resolve(mockProductos)),
}));

import sitemap from "@/app/sitemap";
import { listarCategoriasPublic, listarTodosLosSlugsProducto, listarProductosActivos } from "@/lib/firestore/public";

describe("sitemap.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (listarCategoriasPublic as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategorias);
    (listarTodosLosSlugsProducto as ReturnType<typeof vi.fn>).mockResolvedValue(mockSlugs);
    (listarProductosActivos as ReturnType<typeof vi.fn>).mockResolvedValue(mockProductos);
  });

  it("genera URLs para páginas estáticas", async () => {
    const urls = await sitemap();
    const staticUrls = urls.map((u) => u.url);
    expect(staticUrls).toContain("http://localhost:3000/");
    expect(staticUrls).toContain("http://localhost:3000/reparaciones");
    expect(staticUrls).toContain("http://localhost:3000/carrito");
    expect(staticUrls).toContain("http://localhost:3000/buscar");
  });

  it("genera URLs para categorías", async () => {
    const urls = await sitemap();
    const staticUrls = urls.map((u) => u.url);
    expect(staticUrls).toContain("http://localhost:3000/categoria/celulares");
  });

  it("genera URLs para productos", async () => {
    const urls = await sitemap();
    const staticUrls = urls.map((u) => u.url);
    expect(staticUrls).toContain("http://localhost:3000/producto/iphone-13");
  });

  it("genera URLs para marcas de productos activos", async () => {
    const urls = await sitemap();
    const staticUrls = urls.map((u) => u.url);

    expect(staticUrls).toContain("http://localhost:3000/marca/apple");
  });

  it("conserva categorías y productos si falla la lectura activa de marcas", async () => {
    (listarProductosActivos as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Índice pendiente"));

    const urls = await sitemap();
    const sitemapUrls = urls.map((u) => u.url);

    expect(sitemapUrls).toContain("http://localhost:3000/categoria/celulares");
    expect(sitemapUrls).toContain("http://localhost:3000/producto/iphone-13");
    expect(sitemapUrls).not.toContain("http://localhost:3000/marca/apple");
  });

  it("cada URL tiene lastModified y changeFrequency", async () => {
    const urls = await sitemap();
    for (const entry of urls) {
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.changeFrequency).toBeDefined();
    }
  });
});
