import { describe, it, expect } from "vitest";
import { validarCategoria, validarProducto, validarVariante, type ProductoInput } from "@/lib/validacion";

const productoValido: ProductoInput = {
  nombre: "iPhone 13 128GB",
  descripcion: "iPhone 13 en excelente estado",
  precio: 1850000,
  stock: 3,
  categoriaId: "cat1",
  marca: "Apple",
  specs: { Almacenamiento: "128GB" },
  activo: true,
  destacado: false,
};

const varianteValida = {
  productId: "prod1",
  attributes: { Color: "Negro", Capacidad: "128GB" },
  precio: 1850000,
  stock: 5,
  imagenes: [],
};

describe("validarCategoria", () => {
  it("exige nombre", () => {
    expect(validarCategoria({ nombre: "" })).toContain("El nombre es obligatorio");
    expect(validarCategoria({ nombre: "Celulares" })).toHaveLength(0);
  });
});

describe("validarProducto", () => {
  it("acepta un producto válido", () => {
    expect(validarProducto(productoValido)).toHaveLength(0);
  });
  it("exige nombre y categoría", () => {
    const errores = validarProducto({ ...productoValido, nombre: " ", categoriaId: "" });
    expect(errores).toContain("El nombre es obligatorio");
    expect(errores).toContain("La categoría es obligatoria");
  });
  it("precio debe ser entero positivo (COP)", () => {
    expect(validarProducto({ ...productoValido, precio: 0 })).toContain("El precio debe ser un entero mayor que 0");
    expect(validarProducto({ ...productoValido, precio: 99.9 })).toContain("El precio debe ser un entero mayor que 0");
  });
  it("stock debe ser entero >= 0", () => {
    expect(validarProducto({ ...productoValido, stock: -1 })).toContain("El stock debe ser un entero mayor o igual a 0");
    expect(validarProducto({ ...productoValido, stock: 0 })).toHaveLength(0);
  });
});

describe("validarVariante", () => {
  it("acepta una variante válida con 2 atributos", () => {
    expect(validarVariante(varianteValida)).toHaveLength(0);
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
    const errores = validarVariante({ ...varianteValida, attributes: attrs });
    expect(errores).toContain("Máximo 10 atributos");
  });
  it("precio debe ser entero positivo", () => {
    expect(validarVariante({ ...varianteValida, precio: 0 })).toContain("El precio debe ser un entero mayor que 0");
    expect(validarVariante({ ...varianteValida, precio: 99.9 })).toContain("El precio debe ser un entero mayor que 0");
  });
  it("stock debe ser entero >= 0", () => {
    expect(validarVariante({ ...varianteValida, stock: -1 })).toContain("El stock debe ser un entero mayor o igual a 0");
    expect(validarVariante({ ...varianteValida, stock: 0 })).toHaveLength(0);
  });
  it("atributos requieren clave y valor no vacíos", () => {
    expect(validarVariante({ ...varianteValida, attributes: { "": "Valor" } })).toContain("Los atributos no pueden tener claves vacías");
    expect(validarVariante({ ...varianteValida, attributes: { Color: "" } })).toContain("Los atributos no pueden tener valores vacíos");
  });
});
