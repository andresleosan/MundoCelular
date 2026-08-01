"use client";

import Image from "next/image";
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Icon } from "@/components/ui/Icon";
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
        <h2 className="font-inter-tight text-[24px] font-semibold tracking-[-0.02em] text-text sm:text-[32px]">
          Ofertas destacadas
        </h2>
        <p className="mt-3 text-[15px] text-text-secondary sm:text-[16px]">
          La mejor tecnología al mejor precio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {productos.slice(0, 3).map((p, i) => {
          const catSlug = catSlugDe(p.categoriaId);
          return (
            <Link
              key={p.id}
              href={`/${catSlug}/${p.slug}`}
              className={`group block overflow-hidden rounded-cards border border-faint-border bg-surface transition-all duration-250 hover:-translate-y-1.5 hover:shadow-lg ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-canvas-frost">
                {p.imagenes?.[0]?.url ? (
                  <Image
                    src={p.imagenes[0].thumb || p.imagenes[0].url}
                    alt={p.imagenes[0].alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-text-secondary">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="p-5 sm:p-6">
                {p.marca && (
                  <span className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                    {p.marca}
                  </span>
                )}
                <h3 className="mt-2 font-inter-tight text-[18px] font-semibold tracking-[-0.015em] text-text sm:text-[20px]">
                  {p.nombre}
                </h3>
                <p className="mt-1.5 font-jetbrains-mono text-[20px] font-bold text-primary sm:text-[22px]">
                  {formatearCOP(p.precio)}
                </p>
                <span
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary transition-transform duration-200 group-hover:gap-2"
                >
                  Ver oferta
                  <Icon name="arrow-right" size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
