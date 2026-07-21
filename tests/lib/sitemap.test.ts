import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCategorias = [
  { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "Todos los celulares", orden: 1, activa: true },
];

const mockSlugs = [
  { categoria: "celulares", producto: "iphone-13" },
];

vi.mock("@/lib/firestore/public", () => ({
  listarCategoriasPublic: vi.fn(() => Promise.resolve(mockCategorias)),
  listarTodosLosSlugsProducto: vi.fn(() => Promise.resolve(mockSlugs)),
}));

import sitemap from "@/app/sitemap";
import { listarCategoriasPublic, listarTodosLosSlugsProducto } from "@/lib/firestore/public";

describe("sitemap.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (listarCategoriasPublic as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategorias);
    (listarTodosLosSlugsProducto as ReturnType<typeof vi.fn>).mockResolvedValue(mockSlugs);
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
    expect(staticUrls).toContain("http://localhost:3000/celulares");
  });

  it("genera URLs para productos", async () => {
    const urls = await sitemap();
    const staticUrls = urls.map((u) => u.url);
    expect(staticUrls).toContain("http://localhost:3000/celulares/iphone-13");
  });

  it("cada URL tiene lastModified y changeFrequency", async () => {
    const urls = await sitemap();
    for (const entry of urls) {
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.changeFrequency).toBeDefined();
    }
  });
});
