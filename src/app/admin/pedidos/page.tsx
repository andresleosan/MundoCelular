"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { listarPedidos, actualizarEstadoPedido } from "@/lib/firestore/pedidos";
import { formatearCOP } from "@/lib/format";
import type { Pedido } from "@/types";

const ESTADOS = ["", "pendiente", "contactado", "cerrado", "cancelado"] as const;

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");

  const cargar = () => listarPedidos(filtro || undefined).then(setPedidos).catch(() => setError("No se pudieron cargar"));
  useEffect(() => { cargar(); }, [filtro]);

  async function cambiarEstado(id: string, estado: Pedido["estado"]) {
    setError("");
    try {
      await actualizarEstadoPedido(id, estado);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Pedidos</h1>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-chips border border-faint-border px-3 py-2 text-[14px]">
            <option value="">Todos</option>
            {ESTADOS.filter(Boolean).map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        {error && <p className="mt-4 text-[12px] text-mundo-blue">{error}</p>}
        <ul className="mt-6 flex flex-col gap-3">
          {pedidos.map((p) => (
            <li key={p.id} className="rounded-cards bg-pure-white px-6 py-4 shadow-sm-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[14px] font-semibold">#{p.id.slice(0, 8)}</span>
                  <span className="ml-3 text-[12px] text-steel-blue-gray">{p.clienteNombre}</span>
                </div>
                <span className="font-jetbrains-mono text-[14px] text-mundo-blue">{formatearCOP(p.total)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <span className={`rounded-chips px-2 py-1 ${
                  p.estado === "pendiente" ? "bg-canvas-frost text-ink-navy" :
                  p.estado === "contactado" ? "bg-blue-wash text-mundo-blue" :
                  p.estado === "cerrado" ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                }`}>{p.estado}</span>
                <span className="text-steel-blue-gray">{p.entrega.tipo === "domicilio" ? "Domicilio" : "Retiro"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.estado === "pendiente" && (
                  <>
                    <button onClick={() => cambiarEstado(p.id, "contactado")} className="rounded-chips border border-faint-border px-3 py-1 text-[12px]">Marcar contactado</button>
                    <button onClick={() => { if (confirm("\u00bfCancelar pedido y devolver stock?")) cambiarEstado(p.id, "cancelado"); }} className="rounded-chips border border-red-300 px-3 py-1 text-[12px] text-red-600">Cancelar</button>
                  </>
                )}
                {p.estado === "contactado" && (
                  <>
                    <button onClick={() => cambiarEstado(p.id, "cerrado")} className="rounded-chips border border-green-300 px-3 py-1 text-[12px] text-green-600">Cerrar</button>
                    <button onClick={() => { if (confirm("\u00bfCancelar pedido y devolver stock?")) cambiarEstado(p.id, "cancelado"); }} className="rounded-chips border border-red-300 px-3 py-1 text-[12px] text-red-600">Cancelar</button>
                  </>
                )}
                <Link href={`/admin/pedidos/${p.id}`} className="ml-auto text-[12px] text-mundo-blue">Ver detalle \u2192</Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
