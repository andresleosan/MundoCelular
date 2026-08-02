"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { Categoria } from "@/types";

const sizeClasses: Record<string, string> = {
  lg: "md:col-span-2 md:row-span-2",
  md: "",
  sm: "",
};

function BentoCard({
  categoria,
  index,
  reducedMotion,
}: {
  categoria: Categoria;
  index: number;
  reducedMotion: boolean;
}) {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();
  const size = categoria.size ?? "md";

  return (
    <div
      ref={ref}
      className={`${sizeClasses[size]} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} motion-reduce:!transition-none`}
      style={{
        transitionProperty: "opacity, transform",
        transitionDuration: "0.5s",
        transitionTimingFunction: "ease-out",
        transitionDelay: reducedMotion ? "0ms" : `${index * 70}ms`,
      }}
    >
      <Link
        href={`/${categoria.slug}`}
        className="group flex h-full min-h-[140px] flex-col justify-end overflow-hidden rounded-2xl border border-faint-border bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-glow-cyan/30 hover:shadow-[0_8px_32px_rgba(51,214,255,0.12)] md:min-h-[180px]"
      >
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-muted">
          {size === "lg" ? "Destacada" : "Categoría"}
        </span>
        <h3 className="mt-1 font-sora text-[18px] font-bold text-text transition-colors group-hover:text-primary md:text-[22px]">
          {categoria.nombre}
        </h3>
        {size === "lg" && categoria.descripcion && (
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary line-clamp-2">
            {categoria.descripcion}
          </p>
        )}
      </Link>
    </div>
  );
}

export function BentoGrid({ categorias }: { categorias: Categoria[] }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (categorias.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {categorias.map((c, i) => (
        <BentoCard key={c.id} categoria={c} index={i} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}
