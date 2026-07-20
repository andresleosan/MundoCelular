import { describe, it, expect } from "vitest";
import { validarCategoria, validarProducto, type ProductoInput } from "@/lib/validacion";

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
