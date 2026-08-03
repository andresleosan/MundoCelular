"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";
import { listarPedidos } from "@/lib/firestore/pedidos";
import { formatearCOP } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Clock,
  ShoppingBag,
  Package,
  Layers,
  ClipboardList,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import type { Pedido } from "@/types";

export default function AdminDashboard() {
  const [totales, setTotales] = useState<{
    categorias: number;
    productos: number;
    activos: number;
  } | null>(null);
  const [pedidosStats, setPedidosStats] = useState<{
    total: number;
    pendientes: number;
    ingresos: number;
  } | null>(null);
  const [pedidosRecientes, setPedidosRecientes] = useState<Pedido[] | null>(
    null
  );
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      listarCategorias(),
      listarProductos(),
      listarPedidos(),
    ]).then(([cats, prods, pedidos]) => {
      setTotales({
        categorias: cats.length,
        productos: prods.length,
        activos: prods.filter((p) => p.activo).length,
      });
      const pendientes = pedidos.filter(
        (p) => p.estado === "pendiente"
      ).length;
      const ingresos = pedidos
        .filter((p) => p.estado === "cerrado")
        .reduce((sum, p) => sum + p.total, 0);
      setPedidosStats({ total: pedidos.length, pendientes, ingresos });
      setPedidosRecientes(
        [...pedidos]
          .sort((a, b) => {
            const aTime =
              typeof a.creadoEn === "object" && a.creadoEn !== null && "toMillis" in a.creadoEn
                ? (a.creadoEn as { toMillis: () => number }).toMillis()
                : (a.creadoEn as number) ?? 0;
            const bTime =
              typeof b.creadoEn === "object" && b.creadoEn !== null && "toMillis" in b.creadoEn
                ? (b.creadoEn as { toMillis: () => number }).toMillis()
                : (b.creadoEn as number) ?? 0;
            return bTime - aTime;
          })
          .slice(0, 5)
      );
      setCargando(false);
    });
  }, []);

  const estadoBadgeVariant = (
    estado: Pedido["estado"]
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) {
      case "pendiente":
        return "default";
      case "contactado":
        return "secondary";
      case "cerrado":
        return "outline";
      case "cancelado":
        return "destructive";
      default:
        return "outline";
    }
  };

  const KPICards = [
    {
      title: "Ingresos",
      value: pedidosStats?.ingresos
        ? formatearCOP(pedidosStats.ingresos)
        : "—",
      description: "Pedidos cerrados",
      icon: DollarSign,
      href: "/admin/pedidos",
      accent: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      title: "Pendientes",
      value: pedidosStats?.pendientes ?? "—",
      description: "Requieren atención",
      icon: Clock,
      href: "/admin/pedidos",
      accent: "from-amber-500/10 to-amber-500/5",
    },
    {
      title: "Activos",
      value: totales?.activos ?? "—",
      description: "En tienda",
      icon: ShoppingBag,
      href: "/admin/productos",
      accent: "from-cyan-500/10 to-cyan-500/5",
    },
    {
      title: "Total Productos",
      value: totales?.productos ?? "—",
      description: "Inventario",
      icon: Package,
      href: "/admin/productos",
      accent: "from-blue-500/10 to-blue-500/5",
    },
    {
      title: "Categorías",
      value: totales?.categorias ?? "—",
      description: "Secciones",
      icon: Layers,
      href: "/admin/categorias",
      accent: "from-violet-500/10 to-violet-500/5",
    },
    {
      title: "Total Pedidos",
      value: pedidosStats?.total ?? "—",
      description: "Historial",
      icon: ClipboardList,
      href: "/admin/pedidos",
      accent: "from-rose-500/10 to-rose-500/5",
    },
  ];

  if (cargando) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="mb-3 h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sora text-[26px] font-bold tracking-[-0.03em] text-foreground">
          Panel de Control
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Bienvenido al centro de gestión de Mundo Celular.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPICards.map((kpi) => (
          <Link key={kpi.title} href={kpi.href}>
            <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${kpi.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <kpi.icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-[24px] font-bold tabular-nums tracking-tight text-foreground">
                  {kpi.value}
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pedidos recientes</CardTitle>
              <CardDescription>
                Últimos 5 pedidos recibidos
              </CardDescription>
            </div>
            <Link
              href="/admin/pedidos"
              className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
            >
              Ver todos
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pedidosRecientes && pedidosRecientes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosRecientes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.clienteNombre}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.items?.length ?? 0}{" "}
                      {p.items?.length === 1 ? "producto" : "productos"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatearCOP(p.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoBadgeVariant(p.estado)}>
                        {p.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="mb-3 size-8 text-muted-foreground/40" />
              <p className="text-[14px] font-medium text-muted-foreground">
                No hay pedidos aún
              </p>
              <p className="text-[13px] text-muted-foreground/60">
                Los pedidos aparecerán aquí cuando los clientes compren.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
