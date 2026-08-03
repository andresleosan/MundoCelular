"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { obtenerPedido, actualizarEstadoPedido } from "@/lib/firestore/pedidos";
import { useAuth } from "@/hooks/useAuth";
import { formatearCOP } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, Ban } from "lucide-react";
import type { Pedido } from "@/types";

const estadoVariant = (
  estado: Pedido["estado"]
): "default" | "secondary" | "outline" | "destructive" => {
  switch (estado) {
    case "pendiente": return "default";
    case "contactado": return "secondary";
    case "cerrado": return "outline";
    case "cancelado": return "destructive";
  }
};

export default function DetallePedido() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const { usuario } = useAuth();

  useEffect(() => {
    obtenerPedido(id).then((p) => {
      setPedido(p ?? null);
      setCargando(false);
    });
  }, [id]);

  async function cambiarEstado(estado: Pedido["estado"]) {
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
      const p = await obtenerPedido(id);
      if (p) setPedido(p);
    } catch { /* handled silently */ }
  }

  if (cargando) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-[20px] font-semibold">Pedido no encontrado</h1>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="size-4" /> Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">
          Pedido #{id.slice(0, 8)}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Información del cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[14px] font-medium">{pedido.clienteNombre}</p>
          <p className="text-[13px] text-muted-foreground">{pedido.clienteEmail}</p>
          {pedido.clienteTelefono && (
            <p className="text-[13px] text-muted-foreground">Tel: {pedido.clienteTelefono}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {pedido.items.map((item) => (
              <li key={item.productoId} className="flex justify-between text-[14px]">
                <span>{item.nombre} ×{item.cantidad}</span>
                <span className="tabular-nums text-muted-foreground">{formatearCOP(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-3 text-right">
            <span className="text-[15px] font-semibold">
              Total: {formatearCOP(pedido.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[14px]">
            {pedido.entrega.tipo === "domicilio"
              ? `Domicilio — ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}${pedido.ciudad ? ` (${pedido.ciudad})` : ""}`
              : "Retiro en tienda"}
          </p>
          {pedido.observaciones && (
            <p className="mt-2 text-[13px] italic text-muted-foreground">
              Obs: {pedido.observaciones}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Estado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant={estadoVariant(pedido.estado)} className="text-[13px]">
            {pedido.estado}
          </Badge>

          <div className="flex gap-2">
            {pedido.estado === "pendiente" && (
              <>
                <Button size="sm" onClick={() => cambiarEstado("contactado")}>
                  <Check className="size-3.5" /> Marcar contactado
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("¿Cancelar y devolver stock?"))
                      cambiarEstado("cancelado");
                  }}
                >
                  <Ban className="size-3.5" /> Cancelar
                </Button>
              </>
            )}
            {pedido.estado === "contactado" && (
              <>
                <Button size="sm" onClick={() => cambiarEstado("cerrado")}>
                  <Check className="size-3.5" /> Marcar cerrado
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("¿Cancelar y devolver stock?"))
                      cambiarEstado("cancelado");
                  }}
                >
                  <Ban className="size-3.5" /> Cancelar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
