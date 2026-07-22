import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import type { Producto } from "@/types";

export function HeroProductCard({ producto, categoriaSlug }: { producto: Producto; categoriaSlug: string }) {
  return (
    <Link href={`/${categoriaSlug}/${producto.slug}`} className="block rounded-cards bg-pure-white shadow-sm-2">
      <div className="aspect-square overflow-hidden rounded-[20px] bg-canvas-frost">
        {producto.imagenes[0]?.url ? (
          <img src={producto.imagenes[0].thumb || producto.imagenes[0].url} alt={producto.imagenes[0].alt} className="h-full w-full object-cover" width={400} height={400} loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-steel-blue-gray text-[12px]">Sin imagen</div>
        )}
      </div>
      <div className="px-4 py-3">
        <h3 className="text-[14px] font-semibold tracking-[-0.015em] text-ink-navy">{producto.nombre}</h3>
        <p className="mt-1 font-jetbrains-mono text-[14px] text-mundo-blue">{formatearCOP(producto.precio)}</p>
      </div>
    </Link>
  );
}
