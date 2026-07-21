"use client";

import { useCarrito } from "@/hooks/useCarrito";
import type { Producto } from "@/types";

const WHATSAPP_NUMERO = "573113554021";

export function BotonWhatsAppProducto({ producto }: { producto: Producto }) {
  const { items } = useCarrito();
  const enCarrito = items.some((i) => i.productoId === producto.id);

  if (enCarrito) return null;

  const mensaje = `Hola, me interesa ${producto.nombre}`;
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;

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