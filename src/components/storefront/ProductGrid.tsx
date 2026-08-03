import { ProductCard } from "./ProductCard";
import type { Producto } from "@/types";

export function ProductGrid({
  productos,
  categoriaNombre,
  variant = "default",
}: {
  productos: Producto[];
  categoriaNombre?: string;
  variant?: "default" | "compact" | "featured";
  /** Kept for existing category and brand page callers; product URLs are canonical. */
  categoriaSlug?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {productos.map((p, i) => (
        <ProductCard
          key={p.id}
          producto={p}
          categoriaNombre={categoriaNombre}
          variant={variant}
          priority={i < 4}
        />
      ))}
    </div>
  );
}
