"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Producto } from "@/types";

interface OfertasSectionProps {
  productos: Producto[];
}

export function OfertasSection({ productos }: OfertasSectionProps) {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  if (productos.length === 0) return null;

  return (
    <section
      id="destacados"
      ref={ref}
      className="mx-auto max-w-[1280px] px-4 py-12 sm:py-16"
      aria-label="Productos destacados"
    >
      <div className="mb-10 text-center">
        <h2 className="font-sora text-[24px] font-semibold tracking-[-0.02em] text-fog-white sm:text-[32px]">
          Productos destacados
        </h2>
        <p className="mt-3 text-[15px] text-fog-white/70 sm:text-[16px]">
          La mejor tecnología al mejor precio
        </p>
      </div>

      <div
        className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${visible ? "animate-fade-in" : "opacity-0"}`}
      >
        {productos.map((producto, i) => (
          <div
            key={producto.id}
            className={visible ? "animate-fade-up" : "opacity-0"}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <ProductCard
              producto={producto}
              variant="featured"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
