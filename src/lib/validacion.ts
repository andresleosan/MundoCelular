import type { ImagenProducto } from "@/types";

export interface ProductoInput {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId: string;
  marca: string;
  specs: Record<string, string>;
  activo: boolean;
  destacado: boolean;
  imagenes?: ImagenProducto[];
}

export interface VarianteInput {
  productId: string;
  attributes: Record<string, string>;
  precio: number;
  stock: number;
  imagenes?: ImagenProducto[];
}

export function validarCategoria(input: { nombre: string }): string[] {
  const errores: string[] = [];
  if (!input.nombre.trim()) errores.push("El nombre es obligatorio");
  return errores;
}

export function validarProducto(input: ProductoInput): string[] {
  const errores: string[] = [];
  if (!input.nombre.trim()) errores.push("El nombre es obligatorio");
  if (!input.categoriaId) errores.push("La categoría es obligatoria");
  if (!Number.isInteger(input.precio) || input.precio <= 0) {
    errores.push("El precio debe ser un entero mayor que 0");
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    errores.push("El stock debe ser un entero mayor o igual a 0");
  }
  return errores;
}

export function validarVariante(input: VarianteInput): string[] {
  const errores: string[] = [];
  if (!input.productId.trim()) errores.push("El producto es obligatorio");
  if (!input.attributes || Object.keys(input.attributes).length === 0) {
    errores.push("Debe tener al menos un atributo");
  }
  if (Object.keys(input.attributes).length > 10) {
    errores.push("Máximo 10 atributos");
  }
  for (const [clave, valor] of Object.entries(input.attributes)) {
    if (!clave.trim()) errores.push("Los atributos no pueden tener claves vacías");
    if (!valor.trim()) errores.push("Los atributos no pueden tener valores vacíos");
  }
  if (!Number.isInteger(input.precio) || input.precio <= 0) {
    errores.push("El precio debe ser un entero mayor que 0");
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    errores.push("El stock debe ser un entero mayor o igual a 0");
  }
  return errores;
}
