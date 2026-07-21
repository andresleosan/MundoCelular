"use client";

import { formatearCOP } from "@/lib/format";
import { useCarrito } from "@/hooks/useCarrito";

interface CarritoItemProps {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export function CarritoItem({
  productoId,
  nombre,
  precio,
  cantidad,
}: CarritoItemProps) {
  const { quitar, cambiarCantidad } = useCarrito();

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-semibold text-gray-900 truncate">
          {nombre}
        </h3>
        <p className="mt-0.5 font-jetbrains-mono text-[14px] text-gray-900">
          {formatearCOP(precio)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => cambiarCantidad(productoId, cantidad - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-faint-border text-[14px] text-gray-900"
          aria-label="Reducir cantidad"
        >
          -
        </button>
        <span className="w-6 text-center text-[14px] font-semibold text-gray-900">
          {cantidad}
        </span>
        <button
          onClick={() => cambiarCantidad(productoId, cantidad + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-faint-border text-[14px] text-gray-900"
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>
      <button
        onClick={() => quitar(productoId)}
        className="text-[12px] text-steel-blue-gray hover:text-gray-900"
        aria-label="Quitar del carrito"
      >
        Quitar
      </button>
    </div>
  );
}