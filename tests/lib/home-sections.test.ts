import { describe, expect, it } from "vitest";
import type { Producto } from "@/types";
import { separarProductosHome } from "@/lib/storefront/home";

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: "p1",
    nombre: "Producto de prueba",
    slug: "producto-de-prueba",
    descripcion: "",
    precio: 100000,
    stock: 1,
    categoriaId: "celulares",
    marca: "Apple",
    specs: {},
    imagenes: [],
    activo: true,
    destacado: false,
    ...overrides,
  };
}

describe("separarProductosHome", () => {
  it("separa destacados y nuevos desde productos activos", () => {
    const productos = [
      producto({ id: "p1", destacado: true }),
      producto({ id: "p2", destacado: false }),
    ];

    expect(separarProductosHome(productos)).toEqual({
      destacados: [productos[0]],
      nuevos: [productos[1]],
    });
  });

  it("limita destacados a 6 y nuevos a 8 sin cambiar su orden", () => {
    const destacados = Array.from({ length: 7 }, (_, index) =>
      producto({ id: `destacado-${index}`, destacado: true }),
    );
    const nuevos = Array.from({ length: 9 }, (_, index) =>
      producto({ id: `nuevo-${index}`, destacado: false }),
    );

    expect(separarProductosHome([...destacados, ...nuevos])).toEqual({
      destacados: destacados.slice(0, 6),
      nuevos: nuevos.slice(0, 8),
    });
  });
});
