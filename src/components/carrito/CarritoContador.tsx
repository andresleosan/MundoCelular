"use client";

import Link from "next/link";
import { useCarrito } from "@/hooks/useCarrito";
import { Icon } from "@/components/ui/Icon";

export function CarritoContador() {
  const { items } = useCarrito();
  const count = items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <Link
      href="/carrito"
      aria-label={`Carrito (${count} ${count === 1 ? "producto" : "productos"})`}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-canvas-frost"
    >
      <Icon name="shopping-bag" size={20} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-pure-white leading-none">
          {count}
        </span>
      )}
    </Link>
  );
}
