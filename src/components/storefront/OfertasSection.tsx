"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Categoria, Producto } from "@/types";

interface OfertasSectionProps {
  productos: Producto[];
  categorias: Categoria[];
}

export function OfertasSection({ productos, categorias }: OfertasSectionProps) {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  if (productos.length === 0) return null;

  const catSlugDe = (categoriaId: string) =>
    categorias.find((c) => c.id === categoriaId)?.slug ?? "";

  return (
    <section
      id="ofertas"
      ref={ref}
      className="mx-auto max-w-[1280px] px-4 py-16 sm:py-20"
      aria-label="Ofertas destacadas"
    >
      <div className="mb-10 text-center">
        <h2 className="font-sora text-[24px] font-semibold tracking-[-0.02em] text-fog-white sm:text-[32px]">
          Ofertas destacadas
        </h2>
        <p className="mt-3 text-[15px] text-fog-white/70 sm:text-[16px]">
          La mejor tecnología al mejor precio
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 ${visible ? "animate-fade-in" : "opacity-0"}`}
      >
        {productos.slice(0, 3).map((p, i) => {
          const catSlug = catSlugDe(p.categoriaId);
          return (
            <div
              key={p.id}
              className={visible ? "animate-fade-up" : "opacity-0"}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <ProductCard
                producto={p}
                categoriaSlug={catSlug}
                variant="featured"
                priority={i === 0}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
