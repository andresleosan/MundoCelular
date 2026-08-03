"use client";

import { ProductGrid } from "@/components/storefront/ProductGrid";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { Producto } from "@/types";

export function NuevosProductosSection({ productos }: { productos: Producto[] }) {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  if (productos.length === 0) return null;

  return (
    <section
      id="nuevos"
      ref={ref}
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

      <div className={visible ? "animate-fade-in" : "opacity-0"}>
        <ProductGrid productos={productos} variant="compact" />
      </div>
    </section>
  );
}
