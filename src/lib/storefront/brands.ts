import { generarSlug } from "@/lib/slug";
import type { Producto } from "@/types";

export interface MarcaResumen {
  nombre: string;
  slug: string;
  cantidad: number;
}

export function normalizarMarca(marca: string): string {
  return marca.trim().replace(/\s+/g, " ").toLowerCase();
}

export function resumirMarcas(productos: Producto[]): MarcaResumen[] {
  const resumen = new Map<string, MarcaResumen>();

  for (const producto of productos) {
    if (producto.activo !== true) continue;

    const marcaNormalizada = normalizarMarca(producto.marca);
    if (!marcaNormalizada) continue;

    const marca = resumen.get(marcaNormalizada);
    if (marca) {
      marca.cantidad += 1;
      continue;
    }

    const nombre = producto.marca.trim().replace(/\s+/g, " ");
    resumen.set(marcaNormalizada, {
      nombre,
      slug: generarSlug(nombre),
      cantidad: 1,
    });
  }

  return Array.from(resumen.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function filtrarProductosPorMarca(productos: Producto[], marcaSlug: string): Producto[] {
  const slug = generarSlug(normalizarMarca(marcaSlug));
  if (!slug) return [];

  return productos.filter(
    (producto) =>
      producto.activo === true && generarSlug(normalizarMarca(producto.marca)) === slug,
  );
}
