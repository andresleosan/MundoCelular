"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatearCOP } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Producto } from "@/types";

type ProductCardVariant = "default" | "compact" | "featured";

interface ProductCardProps {
  producto: Producto;
  categoriaNombre?: string;
  /** Kept for existing callers; product links do not depend on category. */
  categoriaSlug?: string;
  precioMinimo?: number;
  variant?: ProductCardVariant;
  priority?: boolean;
  onAddToCart?: (producto: Producto) => void;
}

/**
 * ProductCard unificado — inspirado en shadcn/ui ecommerce blocks + Aceternity 3D Card hover.
 * Variantes:
 *  - default: card blanco sobre grid de categoría
 *  - compact: card compacto sobre fondo navy (home destacados)
 *  - featured: card grande con marca + precio destacado (ofertas home)
 */
export function ProductCard({
  producto,
  categoriaNombre,
  precioMinimo,
  variant = "default",
  priority = false,
  onAddToCart,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const mostrarDesde = Boolean(producto.tieneVariantes) && typeof precioMinimo === "number";
  const href = `/producto/${producto.slug}`;
  const hasDiscount = specsDiscount(producto);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    onAddToCart?.(producto);
    setTimeout(() => setIsAdding(false), 1200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((v) => !v);
  };

  const containerClasses = {
    default:
      "group relative block overflow-hidden rounded-cards bg-navy-surface/40 border border-fog-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-glow-cyan/30",
    compact:
      "group relative block overflow-hidden rounded-cards bg-navy-surface/40 border border-fog-white/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-cyan-glow hover:border-glow-cyan/30",
    featured:
      "group relative block overflow-hidden rounded-cards bg-navy-surface/40 border border-fog-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cyan-glow hover:border-glow-cyan/40",
  };

  const aspectClass = variant === "featured" ? "aspect-[4/5]" : "aspect-square";
  const bgClass = "bg-navy-surface/20";

  return (
    <Link href={href} className={cn(containerClasses[variant])}>
      {/* === Imagen === */}
      <div className={cn("relative overflow-hidden rounded-t-cards", aspectClass, bgClass)}>
        {producto.imagenes?.[0]?.url ? (
          <Image
            src={producto.imagenes[0].thumb || producto.imagenes[0].url}
            alt={producto.imagenes[0].alt || producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon
              name="smartphone"
              size={32}
              className="text-fog-white/30"
            />
          </div>
        )}

        {/* Badges top-left: descuento + stock */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <Badge variant="danger" className="shadow-sm">Oferta</Badge>
          )}
          {producto.stock <= 0 && <Badge variant="outline">Agotado</Badge>}
        </div>

        {/* Wishlist button top-right */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Quitar de favoritos" : "Añadir a favoritos"}
          aria-pressed={isWishlisted}
          className={cn(
            "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110",
            isWishlisted
              ? "bg-danger/90 text-pure-white"
              : "bg-fog-white/80 text-navy-deep hover:bg-fog-white",
          )}
        >
          <Icon name="heart" size={14} className={isWishlisted ? "fill-current" : ""} />
        </button>

        {/* Quick-add button (desktop hover) */}
        {onAddToCart && producto.stock > 0 && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block hidden">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding}
              className={cn(
                "flex h-9 w-full items-center justify-center gap-2 rounded-pills text-[13px] font-semibold transition-all duration-200",
                isAdding
                  ? "bg-success text-pure-white"
                  : "bg-glow-cyan text-navy-deep hover:bg-glow-cyan-soft hover:shadow-cyan-glow",
              )}
            >
              {isAdding ? (
                <>
                  <Icon name="check" size={14} /> Añadido
                </>
              ) : (
                <>
                  <Icon name="plus" size={14} /> Añadir
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* === Info === */}
      <div className={cn("px-4", variant === "featured" ? "py-5 sm:py-6" : "py-3")}>
        {categoriaNombre && variant === "default" && (
          <span className="inline-block rounded-chips bg-glow-cyan/10 px-2 py-0.5 text-[11px] font-medium text-glow-cyan">
            {categoriaNombre}
          </span>
        )}

        {producto.marca && variant !== "default" && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-glow-cyan-soft">
            {producto.marca}
          </span>
        )}

        <h3
          className={cn(
            "font-sora font-semibold tracking-[-0.015em] line-clamp-2",
            variant === "featured"
              ? "mt-2 text-[18px] text-fog-white sm:text-[20px]"
              : variant === "compact"
                ? "text-[14px] text-fog-white"
                : "mt-2 text-[14px] text-fog-white",
          )}
        >
          {producto.nombre}
        </h3>

        <div
          className={cn(
            "mt-1.5 flex items-baseline gap-2 font-jetbrains-mono font-bold",
            variant === "featured" ? "text-[20px] text-glow-cyan sm:text-[22px]" : "text-[14px] text-glow-cyan-soft",
          )}
        >
          <span>{mostrarDesde ? `Desde ${formatearCOP(precioMinimo!)}` : formatearCOP(producto.precio)}</span>
        </div>

        {variant === "featured" && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-glow-cyan transition-all duration-200 group-hover:gap-2.5">
            Ver oferta
            <Icon name="arrow-right" size={14} />
          </span>
        )}
      </div>
    </Link>
  );
}

function specsDiscount(p: Producto): boolean {
  return p.destacado;
}
