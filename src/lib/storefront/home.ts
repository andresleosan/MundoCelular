import type { Producto } from "@/types";

export function separarProductosHome(productos: Producto[]): {
  destacados: Producto[];
  nuevos: Producto[];
} {
  return {
    destacados: productos.filter((producto) => producto.destacado).slice(0, 6),
    nuevos: productos.filter((producto) => !producto.destacado).slice(0, 8),
  };
}
