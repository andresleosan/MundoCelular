import { formatearCOP } from "./format";
import type { Pedido } from "@/types";

type ItemPedido = Pedido["items"][number];

export function armarmensajePedido(pedido: {
  items: ItemPedido[];
  total: number;
  entrega: { tipo: "retiro" | "domicilio"; direccion?: string; barrio?: string };
  clienteNombre: string;
  clienteTelefono?: string;
  ciudad?: string;
  observaciones?: string;
  pedidoId: string;
}): string {
  const lineas = pedido.items.map(
    (i) => `\u2022 ${i.nombre} \u2014 x${i.cantidad} \u2014 ${formatearCOP(i.subtotal)}`
  );
  const entrega = pedido.entrega.tipo === "domicilio"
    ? `Entrega: Domicilio \u2014 ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}${pedido.ciudad ? ` (${pedido.ciudad})` : ""}`
    : "Entrega: Retiro en tienda";
  const clienteLine = [
    `Cliente: ${pedido.clienteNombre}`,
    pedido.clienteTelefono ? `Telefono: ${pedido.clienteTelefono}` : "",
    pedido.observaciones ? `Obs: ${pedido.observaciones}` : "",
  ].filter(Boolean).join("\n");
  return [
    "Hola Mundo Celular, quiero comprar:",
    ...lineas,
    `Total: ${formatearCOP(pedido.total)}`,
    entrega,
    clienteLine,
    `Pedido #${pedido.pedidoId}`,
  ].join("\n");
}

export function urlWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
