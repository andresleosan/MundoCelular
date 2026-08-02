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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {productos.map((p, i) => (
        <ProductCard
          key={p.id}
          producto={p}
          categoriaNombre={categoriaNombre}
          categoriaSlug={categoriaSlug}
          priority={i < 4}
        />
      ))}
    </div>
  );
}
