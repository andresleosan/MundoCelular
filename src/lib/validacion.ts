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
