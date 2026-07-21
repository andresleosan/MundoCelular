"use client";

import { useCarrito } from "@/hooks/useCarrito";
import type { Producto } from "@/types";

export function AgregarAlCarrito({ producto }: { producto: Producto }) {
  const { agregar } = useCarrito();

  return (
    <button
      onClick={() => agregar(producto)}
      className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] font-semibold text-gray-900 shadow-sm-2"
    >
      Agregar al carrito
    </button>
  );
}