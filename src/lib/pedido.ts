import { formatearCOP } from "./format";
import type { Pedido } from "@/types";

type ItemPedido = Pedido["items"][number];

export function armarmensajePedido(pedido: {
  items: ItemPedido[];
  total: number;
  entrega: { tipo: "retiro" | "domicilio"; direccion?: string; barrio?: string };
  clienteNombre: string;
  pedidoId: string;
}): string {
  const lineas = pedido.items.map(
    (i) => `\u2022 ${i.nombre} \u2014 x${i.cantidad} \u2014 ${formatearCOP(i.subtotal)}`
  );
  const entrega = pedido.entrega.tipo === "domicilio"
    ? `Entrega: Domicilio \u2014 ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}`
    : "Entrega: Retiro en tienda";
  return [
    "Hola Mundo Celular, quiero comprar:",
    ...lineas,
    `Total: ${formatearCOP(pedido.total)}`,
    entrega,
    `Pedido #${pedido.pedidoId} \u2014 ${pedido.clienteNombre}`,
  ].join("\n");
}

export function urlWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
