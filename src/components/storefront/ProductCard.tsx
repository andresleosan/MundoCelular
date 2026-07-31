import Image from "next/image";
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import type { Producto } from "@/types";

export function ProductCard({
  producto,
  categoriaNombre,
  categoriaSlug,
  precioMinimo,
}: {
  producto: Producto;
  categoriaNombre: string;
  categoriaSlug: string;
  precioMinimo?: number;
}) {
  const mostrarDesde = Boolean(producto.tieneVariantes) && typeof precioMinimo === "number";
  return (
    <Link
      href={`/${categoriaSlug}/${producto.slug}`}
      className="group block rounded-2xl bg-pure-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-canvas-frost">
        {producto.imagenes[0]?.url ? (
          <Image
            src={producto.imagenes[0].thumb || producto.imagenes[0].url}
            alt={producto.imagenes[0].alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-steel-blue-gray">
            Sin imagen
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <span className="inline-block rounded-full bg-blue-wash px-2 py-0.5 text-[11px] font-medium text-mundo-blue">
          {categoriaNombre}
        </span>
        <h3 className="mt-2 text-[14px] font-semibold tracking-[-0.015em] text-ink-navy">
          {producto.nombre}
        </h3>
        <p className="mt-1 font-jetbrains-mono text-[14px] text-mundo-blue">
          {mostrarDesde ? `Desde ${formatearCOP(precioMinimo!)}` : formatearCOP(producto.precio)}
        </p>
      </div>
    </Link>
  );
}
