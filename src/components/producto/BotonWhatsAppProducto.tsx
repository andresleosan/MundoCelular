"use client";

import { useCarrito } from "@/hooks/useCarrito";
import { useConfig } from "@/components/auth/ConfigProvider";
import type { Producto } from "@/types";

export function BotonWhatsAppProducto({ producto }: { producto: Producto }) {
  const { items } = useCarrito();
  const config = useConfig();
  const enCarrito = items.some((i) => i.productoId === producto.id);

  if (enCarrito) return null;

  const mensaje = `Hola, me interesa ${producto.nombre}`;
  const url = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
    >
      Comprar por WhatsApp
    </a>
  );
}