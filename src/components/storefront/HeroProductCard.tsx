import { ProductCard } from "@/components/storefront/ProductCard";
import type { Producto } from "@/types";

/**
 * @deprecated Usar `ProductCard` con `variant="compact"` directamente.
 * Wrapper temporal para mantener compatibilidad de imports existentes.
 */
export function HeroProductCard({
  producto,
  precioMinimo,
}: {
  producto: Producto;
  /** Kept for existing search result callers; ProductCard owns the canonical URL. */
  categoriaSlug?: string;
  precioMinimo?: number;
}) {
  return (
    <ProductCard
      producto={producto}
      precioMinimo={precioMinimo}
      variant="compact"
    />
  );
}
