"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";
import { listarPedidos } from "@/lib/firestore/pedidos";
import { formatearCOP } from "@/lib/format";

export default function AdminInicio() {
  const [totales, setTotales] = useState<{ categorias: number; productos: number; activos: number } | null>(null);
  const [pedidosStats, setPedidosStats] = useState<{ total: number; pendientes: number; ingresos: number } | null>(null);

  useEffect(() => {
    Promise.all([
      listarCategorias(),
      listarProductos(),
      listarPedidos(),
    ]).then(([cats, prods, pedidos]) => {
      setTotales({ categorias: cats.length, productos: prods.length, activos: prods.filter((p) => p.activo).length });
      const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;
      const ingresos = pedidos
        .filter((p) => p.estado === "cerrado")
        .reduce((sum, p) => sum + p.total, 0);
      setPedidosStats({ total: pedidos.length, pendientes, ingresos });
    });
  }, []);

  const stats = [
    { etiqueta: "Categorías", valor: totales?.categorias, href: "/admin/categorias" },
    { etiqueta: "Productos", valor: totales?.productos, href: "/admin/productos" },
    { etiqueta: "Productos activos", valor: totales?.activos, href: "/admin/productos" },
    { etiqueta: "Pedidos totales", valor: pedidosStats?.total, href: "/admin/pedidos" },
    { etiqueta: "Pedidos pendientes", valor: pedidosStats?.pendientes, href: "/admin/pedidos" },
    { etiqueta: "Ingresos (cerrados)", valor: pedidosStats?.ingresos != null ? formatearCOP(pedidosStats.ingresos) : null, href: "/admin/pedidos" },
  ];

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Panel de administración</h1>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((c) => (
            <Link
              key={c.etiqueta}
              href={c.href}
              className="rounded-cards bg-pure-white p-6 shadow-sm-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-[12px] font-medium text-steel-blue-gray">{c.etiqueta}</p>
              <p className="mt-2 font-jetbrains-mono text-[16px]">{c.valor ?? "…"}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
