import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ScrollReveal } from "@/components/storefront/ScrollReveal";
import type { Producto } from "@/types";

export function NuevosProductosSection({ productos }: { productos: Producto[] }) {
  if (productos.length === 0) return null;

  return (
    <section
      id="nuevos"
      className="mx-auto max-w-[1280px] px-4 py-12 sm:py-16"
      aria-label="Nuevos productos"
    >
      <div className="mb-8 text-center">
        <h2 className="font-sora text-[24px] font-semibold tracking-[-0.02em] text-fog-white sm:text-[32px]">
          Nuevos productos
        </h2>
        <p className="mt-3 text-[15px] text-fog-white/70 sm:text-[16px]">
          Lo último que llegó a Mundo Celular
        </p>
      </div>

      <ScrollReveal className="scroll-reveal-container">
        <ProductGrid productos={productos} variant="compact" />
      </ScrollReveal>
    </section>
  );
}
