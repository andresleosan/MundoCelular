import { describe, expect, it } from "vitest";
import type { Producto } from "@/types";
import {
  completarMarcasParaHome,
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

describe("completarMarcasParaHome", () => {
  it("mantiene las marcas visibles del catálogo y conserva los contadores activos", () => {
    const marcas = completarMarcasParaHome([
      { nombre: "Apple", slug: "apple", cantidad: 2 },
    ]);

    expect(marcas.slice(0, 6).map((marca) => marca.nombre)).toEqual([
      "Apple",
      "Samsung",
      "Xiaomi",
      "Motorola",
      "Honor",
      "Redmi",
    ]);
    expect(marcas[0]).toEqual({ nombre: "Apple", slug: "apple", cantidad: 2 });
    expect(marcas.slice(1, 6).every((marca) => marca.cantidad === 0)).toBe(true);
    expect(completarMarcasParaHome([
      { nombre: "Google", slug: "google", cantidad: 1 },
    ])).toHaveLength(6);
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
