import { ProductCard } from "./ProductCard";
import type { Producto } from "@/types";

export function ProductGrid({
  productos,
  categoriaNombre,
  categoriaSlug,
}: {
  productos: Producto[];
  categoriaNombre: string;
  categoriaSlug: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {productos.map((p) => (
        <ProductCard
          key={p.id}
          producto={p}
          categoriaNombre={categoriaNombre}
          categoriaSlug={categoriaSlug}
        />
      ))}
    </div>
  );
}
