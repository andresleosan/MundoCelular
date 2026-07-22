"use client";

import Link from "next/link";
import { useCarrito } from "@/hooks/useCarrito";
import { formatearCOP } from "@/lib/format";
import { CarritoItem } from "./CarritoItem";

export function CarritoResumen() {
  const { items, total, vaciar } = useCarrito();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-[16px] text-steel-blue-gray">
          Tu carrito est\u00e1 vac\u00edo
        </p>
        <Link
          href="/"
          className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] font-semibold text-gray-900 shadow-sm-2"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <CarritoItem
            key={item.productoId}
            productoId={item.productoId}
            nombre={item.nombre}
            precio={item.precio}
            cantidad={item.cantidad}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex justify-between text-[16px] font-semibold text-gray-900">
          <span>Total</span>
          <span className="font-jetbrains-mono">{formatearCOP(total)}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={vaciar}
            className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] text-steel-blue-gray hover:text-gray-900"
          >
            Vaciar carrito
          </button>

          <Link
            href="/checkout"
            className="rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
          >
            Proceder al checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
