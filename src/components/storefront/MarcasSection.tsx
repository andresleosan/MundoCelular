"use client";

import Link from "next/link";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { MarcaResumen } from "@/lib/storefront/brands";

export function MarcasSection({ marcas }: { marcas: MarcaResumen[] }) {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  if (marcas.length === 0) return null;

  return (
    <section
      id="marcas"
      ref={ref}
      className="mx-auto max-w-[1280px] px-4 py-12 sm:py-16"
      aria-label="Marcas"
    >
      <div className="mb-10 text-center">
        <h2 className="font-sora text-[24px] font-semibold tracking-[-0.02em] text-fog-white sm:text-[32px]">
          Las marcas que distribuimos y reparamos
        </h2>
        <p className="mt-3 text-[15px] text-fog-white/70 sm:text-[16px]">
          Equipos originales con respaldo directo
        </p>
      </div>

      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {marcas.map((marca, i) => {
          const className = `group relative flex aspect-[16/9] flex-col items-center justify-center overflow-hidden rounded-cards border border-fog-white/10 bg-navy-surface/40 transition-all duration-300 hover:-translate-y-0.5 hover:border-glow-cyan/30 hover:shadow-cyan-glow focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan/40 ${visible ? "animate-fade-up" : "opacity-0"}`;
          const content = (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-glow-cyan/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative font-sora text-[18px] font-semibold tracking-[-0.01em] text-fog-white/80 transition-colors duration-300 group-hover:text-glow-cyan sm:text-[20px]">
                {marca.nombre}
              </span>
              {marca.cantidad > 0 && (
                <span className="relative mt-1 text-[12px] text-fog-white/60">
                  {marca.cantidad} {marca.cantidad === 1 ? "producto" : "productos"}
                </span>
              )}
            </>
          );

          return marca.cantidad > 0 ? (
            <Link
              key={marca.slug}
              href={`/marca/${marca.slug}`}
              aria-label={`${marca.nombre}: ${marca.cantidad} ${marca.cantidad === 1 ? "producto" : "productos"}`}
              className={className}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {content}
            </Link>
          ) : (
            <div
              key={marca.slug}
              aria-label={marca.nombre}
              className={className}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
