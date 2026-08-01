"use client";

import Link from "next/link";
import { useCarrito } from "@/hooks/useCarrito";
import { formatearCOP } from "@/lib/format";
import { CarritoItem } from "./CarritoItem";
import { Icon } from "@/components/ui/Icon";

export function CarritoResumen() {
  const { items, total, vaciar } = useCarrito();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-bg">
          <Icon name="shopping-bag" size={32} className="text-text-secondary" />
        </span>
        <h2 className="font-inter-tight text-[20px] font-semibold text-text sm:text-[24px]">
          Tu carrito está vacío
        </h2>
        <p className="text-[15px] text-text-secondary">
          Explora nuestro catálogo y encuentra lo que necesitas
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-11 items-center justify-center rounded-[12px] bg-primary px-6 text-[14px] font-semibold text-pure-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Lista items */}
      <div className="flex flex-1 flex-col gap-4">
        {items.map((item) => (
          <CarritoItem
            key={`${item.productoId}__${item.varianteId ?? ""}`}
            productoId={item.productoId}
            nombre={item.nombre}
            precio={item.precio}
            cantidad={item.cantidad}
            varianteId={item.varianteId}
            atributos={item.atributos}
          />
        ))}

        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 text-[14px] font-medium text-primary transition-colors hover:underline"
        >
          <Icon name="arrow-right" size={16} className="rotate-180" />
          Seguir comprando
        </Link>
      </div>

      {/* Resumen sticky */}
      <div className="lg:sticky lg:top-24 lg:h-fit lg:w-[320px] lg:flex-shrink-0">
        <div className="rounded-[24px] border border-faint-border bg-surface p-6 shadow-sm-2 sm:p-8">
          <h2 className="mb-6 font-inter-tight text-[18px] font-semibold text-text">
            Resumen del pedido
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between text-[14px] text-text">
              <span>Subtotal</span>
              <span className="font-jetbrains-mono font-medium">{formatearCOP(total)}</span>
            </div>
            <div className="flex justify-between text-[14px] text-text">
              <span>Envío</span>
              <span className="font-medium text-success">Gratis</span>
            </div>
          </div>

          <div className="my-4 border-t border-faint-border" />

          <div className="flex justify-between text-[18px] font-bold text-text">
            <span>Total</span>
            <span className="font-jetbrains-mono">{formatearCOP(total)}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center justify-center rounded-[12px] bg-primary px-6 text-[14px] font-semibold text-pure-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary/30"
            >
              Proceder al checkout
            </Link>

            <button
              onClick={vaciar}
              className="text-[13px] font-medium text-text-secondary transition-colors hover:text-danger"
            >
              Vaciar carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}