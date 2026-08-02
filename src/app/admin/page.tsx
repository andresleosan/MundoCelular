"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";
import { listarPedidos } from "@/lib/firestore/pedidos";
import { formatearCOP } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/Icon";

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

  type Stat = {
    etiqueta: string;
    valor: number | string | null | undefined;
    href: string;
    descripcion: string;
    icon: IconName;
  };

  const stats: Stat[] = [
    { 
      etiqueta: "Ingresos (cerrados)", 
      valor: pedidosStats?.ingresos != null ? formatearCOP(pedidosStats.ingresos) : null, 
      href: "/admin/pedidos",
      descripcion: "Total acumulado de pedidos cerrados",
      icon: "dollar-sign"
    },
    { 
      etiqueta: "Pedidos pendientes", 
      valor: pedidosStats?.pendientes, 
      href: "/admin/pedidos",
      descripcion: "Pedidos que requieren atención",
      icon: "clock"
    },
    { 
      etiqueta: "Productos activos", 
      valor: totales?.activos, 
      href: "/admin/productos",
      descripcion: "Visibles en la tienda pública",
      icon: "shopping-bag"
    },
    { 
      etiqueta: "Total productos", 
      valor: totales?.productos, 
      href: "/admin/productos",
      descripcion: "Inventario completo",
      icon: "package"
    },
    { 
      etiqueta: "Categorías", 
      valor: totales?.categorias, 
      href: "/admin/categorias",
      descripcion: "Estructura de la tienda",
      icon: "layers"
    },
    { 
      etiqueta: "Pedidos totales", 
      valor: pedidosStats?.total, 
      href: "/admin/pedidos",
      descripcion: "Historial completo",
      icon: "clipboard-list"
    },
  ];

  return (
    <main className="px-4 py-10 lg:px-10">
        <header className="mb-10">
          <h1 className="font-sora text-[28px] font-bold tracking-[-0.03em] text-ink-navy">
            Panel de Control
          </h1>
          <p className="mt-1 text-[14px] text-steel-blue-gray">
            Bienvenido al centro de gestión de Mundo Celular.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((c) => (
            <Link
              key={c.etiqueta}
              href={c.href}
              className="group relative overflow-hidden rounded-cards border border-faint-border bg-pure-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-glow-cyan/30 hover:shadow-lg-2"
            >
              {/* Glow effect on hover */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-glow-cyan/5 transition-all duration-500 group-hover:scale-150" />
              
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-steel-blue-gray/70">
                    {c.etiqueta}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-glow-cyan/10 group-hover:text-glow-cyan">
                    <Icon name={c.icon} size={20} />
                  </div>
                </div>
                
                <div>
                  <p className="font-jetbrains-mono text-[24px] font-bold text-ink-navy">
                    {c.valor ?? "…"}
                  </p>
                  <p className="mt-1 text-[13px] text-steel-blue-gray">
                    {c.descripcion}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
  );
}
