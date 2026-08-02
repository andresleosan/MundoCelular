import { ProductCard } from "@/components/storefront/ProductCard";
import type { Producto } from "@/types";

/**
 * @deprecated Usar `ProductCard` con `variant="compact"` directamente.
 * Wrapper temporal para mantener compatibilidad de imports existentes.
 */
export function HeroProductCard({
  producto,
  categoriaSlug,
  precioMinimo,
}: {
  producto: Producto;
  categoriaSlug: string;
  precioMinimo?: number;
}) {
  return (
    <ProductCard
      producto={producto}
      categoriaSlug={categoriaSlug}
      precioMinimo={precioMinimo}
      variant="compact"
    />
  );
}
