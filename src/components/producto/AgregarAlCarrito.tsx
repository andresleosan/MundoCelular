"use client";

import { useCarrito } from "@/hooks/useCarrito";
import type { Producto, VarianteProducto } from "@/types";

export function AgregarAlCarrito({
  producto,
  variante,
}: {
  producto: Producto;
  variante?: VarianteProducto;
}) {
  const { agregar } = useCarrito();

  const disabled = Boolean(producto.tieneVariantes) && !variante;

  function handleClick() {
    if (variante) {
      agregar(producto, 1, variante.id, variante.attributes);
    } else {
      agregar(producto);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] font-semibold text-gray-900 shadow-sm-2 disabled:opacity-50"
    >
      Agregar al carrito
    </button>
  );
}