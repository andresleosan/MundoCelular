"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listarPedidos, actualizarEstadoPedido } from "@/lib/firestore/pedidos";
import { useAuth } from "@/hooks/useAuth";
import { formatearCOP } from "@/lib/format";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Check, Ban } from "lucide-react";
import type { Pedido } from "@/types";

const ESTADOS = ["pendiente", "contactado", "cerrado", "cancelado"] as const;

const estadoVariant = (
  estado: Pedido["estado"]
): "default" | "secondary" | "outline" | "destructive" => {
  switch (estado) {
    case "pendiente":
      return "default";
    case "contactado":
      return "secondary";
    case "cerrado":
      return "outline";
    case "cancelado":
      return "destructive";
  }
};

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const { usuario } = useAuth();

  const cargar = useCallback(() => {
    setCargando(true);
    listarPedidos(filtro || undefined)
      .then(setPedidos)
      .finally(() => setCargando(false));
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstado(id: string, estado: Pedido["estado"]) {
    try {
      if (estado === "cancelado" && usuario) {
        const token = await usuario.getIdToken();
        await fetch(`/api/pedidos/${id}/cancelar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await actualizarEstadoPedido(id, estado);
      }
      await cargar();
    } catch {
      // error handled silently
    }
  }

  const columns: Column<Pedido>[] = [
    {
      header: "Pedido",
      cell: (p) => (
        <div>
          <p className="text-[14px] font-medium">#{p.id.slice(0, 8)}</p>
          <p className="text-[12px] text-muted-foreground">
            {p.clienteNombre}
          </p>
        </div>
      ),
    },
    {
      header: "Productos",
      className: "w-[100px]",
      cell: (p) => (
        <span className="text-[14px] text-muted-foreground">
          {p.items?.length ?? 0}
        </span>
      ),
    },
    {
      header: "Total",
      className: "w-[140px] tabular-nums",
      cell: (p) => (
        <span className="text-[14px] font-medium">
          {formatearCOP(p.total)}
        </span>
      ),
    },
    {
      header: "Entrega",
      className: "w-[100px]",
      cell: (p) => (
        <span className="text-[13px] text-muted-foreground">
          {p.entrega.tipo === "domicilio" ? "Domicilio" : "Retiro"}
        </span>
      ),
    },
    {
      header: "Estado",
      className: "w-[120px]",
      cell: (p) => (
        <Badge variant={estadoVariant(p.estado)}>{p.estado}</Badge>
      ),
    },
    {
      header: "Acciones",
      className: "w-[180px] text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          {p.estado === "pendiente" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                title="Marcar contactado"
                onClick={(e) => {
                  e.stopPropagation();
                  cambiarEstado(p.id, "contactado");
                }}
              >
                <Check className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                title="Cancelar pedido"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("¿Cancelar pedido y devolver stock?"))
                    cambiarEstado(p.id, "cancelado");
                }}
              >
                <Ban className="size-3.5" />
              </Button>
            </>
          )}
          {p.estado === "contactado" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-green-600"
                title="Cerrar pedido"
                onClick={(e) => {
                  e.stopPropagation();
                  cambiarEstado(p.id, "cerrado");
                }}
              >
                <Check className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                title="Cancelar pedido"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("¿Cancelar pedido y devolver stock?"))
                    cambiarEstado(p.id, "cancelado");
                }}
              >
                <Ban className="size-3.5" />
              </Button>
            </>
          )}
          <Link href={`/admin/pedidos/${p.id}`}>
            <Button variant="ghost" size="icon" className="size-8" title="Ver detalle">
              <Eye className="size-3.5" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">
            Pedidos
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Gestiona los pedidos de los clientes.
          </p>
        </div>
        <Select value={filtro || "all"} onValueChange={(v) => setFiltro(v === "all" ? "" : v ?? "")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={pedidos}
        keyField="id"
        loading={cargando}
        loadingRows={6}
        emptyTitle="No hay pedidos"
        emptyDescription="Los pedidos de los clientes aparecerán aquí."
        onRowClick={(p) =>
          (window.location.href = `/admin/pedidos/${p.id}`)
        }
      />
    </div>
  );
}
