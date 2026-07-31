import { describe, it, expect } from "vitest";
import type { VarianteProducto } from "@/types";
import type { VarianteInput } from "@/lib/validacion";
import { validarVariante } from "@/lib/validacion";

const varianteValida: VarianteInput = {
  productId: "prod1",
  attributes: { Color: "Negro", Capacidad: "128GB" },
  precio: 1850000,
  stock: 5,
  imagenes: [],
};

describe("validarVariante", () => {
  it("acepta una variante válida", () => {
    expect(validarVariante(varianteValida)).toEqual([]);
  });

  it("exige productId", () => {
    expect(validarVariante({ ...varianteValida, productId: "" })).toContain("El producto es obligatorio");
  });

  it("requiere al menos un atributo", () => {
    expect(validarVariante({ ...varianteValida, attributes: {} })).toContain("Debe tener al menos un atributo");
  });

  it("rechaza más de 10 atributos", () => {
    const attrs: Record<string, string> = {};
    for (let i = 0; i < 11; i++) attrs[`Attr${i}`] = `Val${i}`;
    expect(validarVariante({ ...varianteValida, attributes: attrs })).toContain("Máximo 10 atributos");
  });

  it("precio debe ser entero positivo", () => {
    expect(validarVariante({ ...varianteValida, precio: 0 })).toContain("El precio debe ser un entero mayor que 0");
    expect(validarVariante({ ...varianteValida, precio: 99.9 })).toContain("El precio debe ser un entero mayor que 0");
  });

  it("stock debe ser entero >= 0", () => {
    expect(validarVariante({ ...varianteValida, stock: -1 })).toContain("El stock debe ser un entero mayor o igual a 0");
    expect(validarVariante({ ...varianteValida, stock: 0 })).toEqual([]);
  });

  it("atributos requieren clave y valor no vacíos", () => {
    expect(validarVariante({ ...varianteValida, attributes: { "": "Valor" } })).toContain(
      "Los atributos no pueden tener claves vacías"
    );
    expect(validarVariante({ ...varianteValida, attributes: { Color: "" } })).toContain(
      "Los atributos no pueden tener valores vacíos"
    );
  });
});

describe("Tipos de variante", () => {
  it("VarianteProducto incluye todos los campos necesarios", () => {
    const v: VarianteProducto = {
      id: "v1",
      productId: "prod1",
      attributes: { Color: "Negro" },
      precio: 1000000,
      stock: 5,
      imagenes: [],
      activo: true,
    };
    expect(v.id).toBe("v1");
    expect(v.productId).toBe("prod1");
    expect(v.attributes.Color).toBe("Negro");
  });

  it("VarianteInput puede tener imagenes opcional", () => {
    const input: VarianteInput = {
      productId: "prod1",
      attributes: {},
      precio: 1000000,
      stock: 5,
    };
    expect(input.imagenes).toBeUndefined();
  });
});