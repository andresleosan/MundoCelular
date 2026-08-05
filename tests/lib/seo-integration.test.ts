import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Metadata } from "next";

const mockCategoriaData = {
  nombre: "Celulares", slug: "celulares", descripcion: "Smartphones",
  orden: 1, activa: true,
};
const mockProductoData = {
  nombre: "iPhone 13", slug: "iphone-13", descripcion: "Excelente estado",
  precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple",
  specs: {}, imagenes: [], activo: true, destacado: false,
};
const mockConfigTienda = {
  nombre: "Mundo Celular", whatsapp: "573147757223",
  direccion: "Cra 36 # 38 - 33", ciudad: "Medellín",
  departamento: "Antioquia", pais: "Colombia", horario: "L-V 9-6",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

type DocData = { id: string; data: () => Record<string, unknown> };
const mockGetFn = vi.fn<() => Promise<{ docs: DocData[]; empty: boolean }>>();
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

function makeDocData(id: string, data: Record<string, unknown>): DocData {
  return { id, data: () => data };
}

describe("SEO integration — generateMetadata exports across pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFn.mockResolvedValue({
      docs: [makeDocData("c1", mockCategoriaData)],
      empty: false,
    });
    mockDocGetFn.mockResolvedValue({ exists: true, data: () => mockConfigTienda });
  });

  function setupProductoMocks() {
    mockGetFn
      .mockResolvedValueOnce({ docs: [makeDocData("p1", mockProductoData)], empty: false })
      .mockResolvedValueOnce({ docs: [makeDocData("c1", mockCategoriaData)], empty: false });
  }

  function setupCategoriaMocks() {
    mockGetFn
      .mockResolvedValueOnce({ docs: [makeDocData("c1", mockCategoriaData)], empty: false })
      .mockResolvedValueOnce({ docs: [], empty: true });
  }

  const paginas: Array<{ nombre: string; rutaImport: string; testBase: (m: Metadata) => void }> = [
    {
      nombre: "home (/)",
      rutaImport: "@/app/page",
      testBase: (m) => { expect(m.title).toBeDefined(); },
    },
    {
      nombre: "categoria (/categoria/[slug])",
      rutaImport: "@/app/categoria/[slug]/page",
      testBase: (m) => { expect(m.title).toBeDefined(); },
    },
    {
      nombre: "producto (/producto/[slug])",
      rutaImport: "@/app/producto/[slug]/page",
      testBase: (m) => { expect(m.title).toBeDefined(); },
    },
    {
      nombre: "carrito (/carrito)",
      rutaImport: "@/app/carrito/page",
      testBase: (m) => { expect(m.title).toBeDefined(); },
    },
    {
      nombre: "buscar (/buscar)",
      rutaImport: "@/app/buscar/page",
      testBase: (m) => { expect(m.title).toBeDefined(); },
    },
    {
      nombre: "reparaciones (/reparaciones)",
      rutaImport: "@/app/reparaciones/page",
      testBase: (m) => { expect(m.title).toBeDefined(); },
    },
  ];

  for (const pagina of paginas) {
    describe(`${pagina.nombre}`, () => {
      it("exporta generateMetadata", async () => {
        const mod = await import(pagina.rutaImport);
        expect(typeof mod.generateMetadata).toBe("function");
      });

      it("generateMetadata devuelve Metadata con title", async () => {
        if (pagina.nombre === "categoria (/categoria/[slug])") {
          setupCategoriaMocks();
        } else if (pagina.nombre === "producto (/producto/[slug])") {
          setupProductoMocks();
        }

        const mod = await import(pagina.rutaImport);
        if (typeof mod.generateMetadata !== "function") return;

        let result: Metadata;
        if (pagina.nombre === "categoria (/categoria/[slug])" || pagina.nombre === "producto (/producto/[slug])") {
          result = await mod.generateMetadata({ params: Promise.resolve({ slug: "celulares" }) });
        } else if (pagina.nombre === "buscar (/buscar)") {
          result = await mod.generateMetadata({ searchParams: Promise.resolve({ q: "iphone" }) });
        } else {
          result = await mod.generateMetadata();
        }
        pagina.testBase(result);
      });
    });
  }
});
