import { describe, expect, it } from "vitest";
import type { Producto } from "@/types";
import {
  filtrarProductosPorMarca,
  normalizarMarca,
  resumirMarcas,
} from "@/lib/storefront/brands";

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

describe("normalizarMarca", () => {
  it("recorta, colapsa espacios internos y convierte a minúsculas", () => {
    expect(normalizarMarca("  Apple   Pro  ")).toBe("apple pro");
  });
});

describe("resumirMarcas", () => {
  it("agrupa marcas activas sin distinguir mayúsculas ni espacios", () => {
    const resumen = resumirMarcas([
      producto({ id: "a1", marca: "Apple", activo: true }),
      producto({ id: "a2", marca: " apple ", activo: true }),
      producto({ id: "s1", marca: "Samsung", activo: true }),
      producto({ id: "a3", marca: "Apple", activo: false }),
    ]);

    expect(resumen).toEqual([
      { nombre: "Apple", slug: "apple", cantidad: 2 },
      { nombre: "Samsung", slug: "samsung", cantidad: 1 },
    ]);
  });
});

describe("marcas derivadas del inventario", () => {
  it("no crea marcas sin productos activos", () => {
    expect(resumirMarcas([
      producto({ id: "apple", marca: "Apple", activo: true }),
      producto({ id: "samsung", marca: "Samsung", activo: false }),
    ])).toEqual([
      { nombre: "Apple", slug: "apple", cantidad: 1 },
    ]);
  });

  it("conserva una marca activa aunque su producto tenga stock cero", () => {
    expect(resumirMarcas([
      producto({ id: "apple", marca: "Apple", activo: true, stock: 0 }),
    ])).toEqual([
      { nombre: "Apple", slug: "apple", cantidad: 1 },
    ]);
  });
});

describe("filtrarProductosPorMarca", () => {
  it("solo devuelve coincidencias activas de la marca normalizada", () => {
    const apple = producto({ id: "a1", marca: "Apple", activo: true });
    const appleConEspacios = producto({ id: "a2", marca: " apple ", activo: true });
    const samsung = producto({ id: "s1", marca: "Samsung", activo: true });
    const appleInactivo = producto({ id: "a3", marca: "APPLE", activo: false });

    expect(
      filtrarProductosPorMarca(
        [apple, appleConEspacios, samsung, appleInactivo],
        "apple",
      ),
    ).toEqual([apple, appleConEspacios]);
  });
});
