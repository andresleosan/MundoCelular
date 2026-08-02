"use client";

import Link from "next/link";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { Categoria } from "@/types";

interface CategoryCardProps {
  categoria: Categoria;
  index: number;
  reducedMotion: boolean;
}

const iconMap: Record<string, IconName> = {
  celulares: "smartphone",
  accesorios: "headphones",
  consolas: "gamepad",
  wearables: "watch",
  audio: "headphones",
  tablets: "smartphone",
  laptops: "smartphone",
};

function getIcon(categoria: Categoria): IconName {
  const slug = categoria.slug.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (slug.includes(key)) return icon;
  }
  return "grid";
}

export function CategoryCard({ categoria, index, reducedMotion }: CategoryCardProps) {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();
  const icon = getIcon(categoria);

  return (
    <div
      ref={ref}
      className={`${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} motion-reduce:!transition-none`}
      style={{
        transitionProperty: "opacity, transform",
        transitionDuration: "0.5s",
        transitionTimingFunction: "ease-out",
        transitionDelay: reducedMotion ? "0ms" : `${index * 70}ms`,
      }}
    >
      <Link
        href={`/${categoria.slug}`}
        className="group relative flex min-h-[140px] flex-col justify-end overflow-hidden rounded-cards border border-fog-white/10 bg-navy-surface/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-glow-cyan/30 hover:shadow-cyan-glow md:min-h-[180px]"
      >
        {/* Background accent glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, rgba(0,212,255,0.12) 0%, transparent 60%)",
          }}
        />

        <span className="relative text-[11px] font-semibold uppercase tracking-widest text-glow-cyan-soft">
          {categoria.size === "lg" ? "Destacada" : "Categoría"}
        </span>

        <div className="relative mt-3 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-glow-cyan/10 text-glow-cyan transition-colors group-hover:bg-glow-cyan/20">
            <Icon name={icon} size={20} />
          </span>
          <h3 className="font-sora text-[18px] font-bold text-fog-white transition-colors group-hover:text-glow-cyan md:text-[22px]">
            {categoria.nombre}
          </h3>
        </div>

        {categoria.size === "lg" && categoria.descripcion && (
          <p className="relative mt-2 text-[13px] leading-relaxed text-fog-white/60 line-clamp-2">
            {categoria.descripcion}
          </p>
        )}
      </Link>
    </div>
  );
}