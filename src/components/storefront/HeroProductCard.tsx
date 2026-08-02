import Image from "next/image";
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import type { Producto } from "@/types";

export function HeroProductCard({
  producto,
  categoriaSlug,
  precioMinimo,
}: {
  producto: Producto;
  categoriaSlug: string;
  precioMinimo?: number;
}) {
  const mostrarDesde = Boolean(producto.tieneVariantes) && typeof precioMinimo === "number";
  return (
    <Link
      href={`/${categoriaSlug}/${producto.slug}`}
      className="group block overflow-hidden rounded-cards bg-white/5 border border-white/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-white/5">
        {producto.imagenes[0]?.url ? (
          <Image
            src={producto.imagenes[0].thumb || producto.imagenes[0].url}
            alt={producto.imagenes[0].alt}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-muted text-[12px]">Sin imagen</div>
        )}
      </div>
      <div className="px-4 py-3">
        <h3 className="font-sora text-[14px] font-semibold tracking-[-0.015em] text-fog-white">{producto.nombre}</h3>
        <p className="mt-1 font-jetbrains-mono text-[14px] font-semibold text-primary-light">
          {mostrarDesde ? `Desde ${formatearCOP(precioMinimo!)}` : formatearCOP(producto.precio)}
        </p>
      </div>
    </Link>
  );
}