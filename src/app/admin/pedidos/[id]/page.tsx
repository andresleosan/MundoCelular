"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { obtenerPedido, actualizarEstadoPedido } from "@/lib/firestore/pedidos";
import { formatearCOP } from "@/lib/format";
import type { Pedido } from "@/types";

export default function DetallePedido() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerPedido(id).then((p) => {
      if (!p) setError("Pedido no encontrado");
      else setPedido(p);
    });
  }, [id]);

  async function cambiarEstado(estado: Pedido["estado"]) {
    setError("");
    try {
      await actualizarEstadoPedido(id, estado);
      const p = await obtenerPedido(id);
      if (p) setPedido(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (!pedido) return <><AdminNav /><main className="mx-auto max-w-[800px] px-4 py-10 text-steel-blue-gray">Cargando\u2026</main></>;

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[800px] px-4 py-10">
        <button onClick={() => router.back()} className="text-[12px] text-mundo-blue mb-4">\u2190 Volver</button>
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Pedido #{id.slice(0, 8)}</h1>

        <div className="mt-6 rounded-cards bg-pure-white p-6 shadow-sm-2">
          <div className="flex justify-between text-[14px]">
            <span className="font-semibold">{pedido.clienteNombre}</span>
            <span className="text-steel-blue-gray">{pedido.clienteEmail}</span>
          </div>
          <p className="mt-1 text-[12px] text-steel-blue-gray">UID: {pedido.clienteUid}</p>

          <h2 className="mt-4 text-[14px] font-semibold text-steel-blue-gray">Items</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {pedido.items.map((item) => (
              <li key={item.productoId} className="flex justify-between text-[14px]">
                <span>{item.nombre} x{item.cantidad}</span>
                <span className="font-jetbrains-mono">{formatearCOP(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-faint-border pt-3 text-right">
            <span className="font-semibold">Total: </span>
            <span className="font-jetbrains-mono text-mundo-blue">{formatearCOP(pedido.total)}</span>
          </div>

          <h2 className="mt-4 text-[14px] font-semibold text-steel-blue-gray">Entrega</h2>
          <p className="mt-1 text-[14px]">
            {pedido.entrega.tipo === "domicilio"
              ? `Domicilio \u2014 ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}`
              : "Retiro en tienda"}
          </p>

          <h2 className="mt-4 text-[14px] font-semibold text-steel-blue-gray">Estado</h2>
          <p className="mt-1 text-[14px] font-semibold">{pedido.estado}</p>

          <div className="mt-4 flex gap-2">
            {pedido.estado === "pendiente" && (
              <>
                <button onClick={() => cambiarEstado("contactado")} className="rounded-chips bg-mundo-blue px-4 py-2 text-[12px] font-semibold text-pure-white">Marcar contactado</button>
                <button onClick={() => { if (confirm("\u00bfCancelar y devolver stock?")) cambiarEstado("cancelado"); }} className="rounded-chips border border-red-300 px-4 py-2 text-[12px] text-red-600">Cancelar y devolver stock</button>
              </>
            )}
            {pedido.estado === "contactado" && (
              <>
                <button onClick={() => cambiarEstado("cerrado")} className="rounded-chips bg-green-600 px-4 py-2 text-[12px] font-semibold text-pure-white">Marcar cerrado</button>
                <button onClick={() => { if (confirm("\u00bfCancelar y devolver stock?")) cambiarEstado("cancelado"); }} className="rounded-chips border border-red-300 px-4 py-2 text-[12px] text-red-600">Cancelar y devolver stock</button>
              </>
            )}
          </div>
        </div>

        {error && <p className="mt-4 text-[12px] text-mundo-blue">{error}</p>}
      </main>
    </>
  );
}
