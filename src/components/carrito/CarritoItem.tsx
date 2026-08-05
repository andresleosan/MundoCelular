"use client";

import Image from "next/image";
import { formatearCOP } from "@/lib/format";
import { useCarrito } from "@/hooks/useCarrito";
import { Icon } from "@/components/ui/Icon";

interface CarritoItemProps {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  varianteId?: string;
  atributos?: Record<string, string>;
  imagenUrl?: string;
  imagenAlt?: string;
}

export function CarritoItem({
  productoId,
  nombre,
  precio,
  cantidad,
  varianteId,
  atributos,
  imagenUrl,
  imagenAlt,
}: CarritoItemProps) {
  const { quitar, cambiarCantidad } = useCarrito();

  const atributosTexto = atributos ? Object.values(atributos).join(" / ") : null;

  return (
    <div className="flex gap-4 rounded-cards border border-fog-white/10 bg-navy-surface/40 p-4 sm:p-5">
      {/* Imagen */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-cards-sm bg-navy-surface/20 sm:h-[80px] sm:w-[80px]">
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={imagenAlt || nombre}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon name="shopping-bag" size={24} className="text-fog-white/70" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h3 className="text-[14px] font-semibold text-fog-white truncate sm:text-[15px]">
            {nombre}
          </h3>
          {atributosTexto && (
            <p className="mt-0.5 text-[12px] text-fog-white/70">
              {atributosTexto}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-jetbrains-mono text-[15px] font-bold text-fog-white sm:text-[16px]">
            {formatearCOP(precio)}
          </p>

          <div className="flex items-center gap-3">
            {/* Controles cantidad */}
            <div className="flex items-center gap-2 rounded-full bg-navy-base px-2 py-1">
              <button
                onClick={() => cambiarCantidad(productoId, cantidad - 1, varianteId)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-fog-white transition-colors hover:bg-glow-cyan hover:text-navy-deep"
                aria-label="Reducir cantidad"
              >
                −
              </button>
              <span className="w-5 text-center text-[14px] font-semibold text-fog-white">
                {cantidad}
              </span>
              <button
                onClick={() => cambiarCantidad(productoId, cantidad + 1, varianteId)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-fog-white transition-colors hover:bg-glow-cyan hover:text-navy-deep"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>

            {/* Quitar */}
            <button
              onClick={() => quitar(productoId, varianteId)}
              className="text-[12px] font-medium text-danger transition-colors hover:underline"
              aria-label="Quitar del carrito"
            >
              Quitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
