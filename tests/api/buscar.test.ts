import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Producto } from "@/types";

const { listarTodosLosProductosActivos } = vi.hoisted(() => ({
  listarTodosLosProductosActivos: vi.fn(),
}));

vi.mock("@/lib/firestore/public", () => ({ listarTodosLosProductosActivos }));

import { GET } from "@/app/api/buscar/route";

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: "p1",
    nombre: "iPhone 13",
    slug: "iphone-13",
    descripcion: "Apple iPhone 13",
    precio: 1850000,
    stock: 3,
    categoriaId: "c1",
    marca: "Apple",
    specs: { Capacidad: "128GB" },
    imagenes: [],
    activo: true,
    destacado: false,
    ...overrides,
  };
}

const appleActivo = producto({ id: "apple-activo" });
const samsungActivo = producto({
  id: "samsung-activo",
  nombre: "Galaxy S24",
  slug: "galaxy-s24",
  marca: "Samsung",
});
const appleInactivo = producto({ id: "apple-inactivo", activo: false });

const catalogo = [
  { producto: appleActivo, categoriaSlug: "celulares" },
  { producto: samsungActivo, categoriaSlug: "celulares" },
  { producto: appleInactivo, categoriaSlug: "celulares" },
];

function request(query: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/buscar${query}`);
}

describe("GET /api/buscar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarTodosLosProductosActivos.mockResolvedValue(catalogo);
  });

  it("filtra resultados por marca y solo devuelve activos", async () => {
    const response = await GET(request("?marca=Apple"));

    expect(response.status).toBe(200);
    expect((await response.json()).resultados.map((r: { producto: Producto }) => r.producto.marca)).toEqual(["Apple"]);
  });

  it("rechaza una query demasiado larga", async () => {
    const response = await GET(request(`?q=${"x".repeat(101)}`));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeDefined();
  });

  it("rechaza una marca demasiado larga", async () => {
    const response = await GET(request(`?marca=${"x".repeat(81)}`));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeDefined();
  });

  it("devuelve vacío sin consultar productos cuando no hay filtros", async () => {
    const response = await GET(request(""));

    expect(response.status).toBe(200);
    expect((await response.json()).resultados).toEqual([]);
    expect(listarTodosLosProductosActivos).not.toHaveBeenCalled();
  });

  it("convierte specs no string antes de comparar texto y conserva la categoría", async () => {
    const productoConSpecNumerica = producto({
      id: "spec-numerica",
      specs: { Memoria: 8 as unknown as string },
    });
    listarTodosLosProductosActivos.mockResolvedValueOnce([
      { producto: productoConSpecNumerica, categoriaSlug: "accesorios" },
    ]);

    const response = await GET(request("?q=8"));
    const resultado = (await response.json()).resultados[0];

    expect(response.status).toBe(200);
    expect(resultado.producto.id).toBe("spec-numerica");
    expect(resultado.categoriaSlug).toBe("accesorios");
  });

  it("aplica el filtro de marca antes de limitar los resultados textuales", async () => {
    const samsungTextual = Array.from({ length: 30 }, (_, index) => ({
      producto: producto({
        id: `samsung-pro-${index}`,
        nombre: `Galaxy Pro ${index}`,
        marca: "Samsung",
      }),
      categoriaSlug: "celulares",
    }));
    const appleTextual = [
      {
        producto: producto({ id: "apple-pro-1", nombre: "iPhone Pro 1" }),
        categoriaSlug: "celulares",
      },
      {
        producto: producto({ id: "apple-pro-2", nombre: "iPhone Pro 2" }),
        categoriaSlug: "celulares",
      },
    ];
    listarTodosLosProductosActivos.mockResolvedValueOnce([...samsungTextual, ...appleTextual]);

    const response = await GET(request("?marca=Apple&q=pro"));
    const resultados = (await response.json()).resultados as Array<{ producto: Producto }>;

    expect(response.status).toBe(200);
    expect(resultados.map(({ producto: item }) => item.id)).toEqual(["apple-pro-1", "apple-pro-2"]);
    expect(resultados.every(({ producto: item }) => item.marca === "Apple")).toBe(true);
  });
});
