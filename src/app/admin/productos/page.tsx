"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { eliminarProducto, listarProductos } from "@/lib/firestore/productos";
import { formatearCOP } from "@/lib/format";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Producto } from "@/types";

export default function ProductosAdmin() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    setCargando(true);
    listarProductos().then(setProductos).finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await eliminarProducto(id);
    await cargar();
  }

  const columns: Column<Producto>[] = [
    {
      header: "Nombre",
      cell: (p) => (
        <div className="flex items-center gap-3">
          {p.imagenes?.[0]?.thumb && (
            <img
              src={p.imagenes[0].thumb}
              alt={p.nombre}
              className="size-9 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="text-[14px] font-medium">{p.nombre}</p>
            <p className="text-[12px] text-muted-foreground">/{p.slug}</p>
          </div>
          {p.destacado && (
            <Badge variant="secondary" className="ml-1 text-[10px]">
              destacado
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Precio",
      className: "tabular-nums w-[120px]",
      cell: (p) => <span className="text-[14px]">{formatearCOP(p.precio)}</span>,
    },
    {
      header: "Stock",
      className: "w-[80px]",
      cell: (p) => (
        <span
          className={`text-[14px] ${p.stock <= 3 ? "font-medium text-destructive" : ""}`}
        >
          {p.stock}
        </span>
      ),
    },
    {
      header: "Estado",
      className: "w-[100px]",
      cell: (p) =>
        p.activo ? (
          <Badge variant="default">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    {
      header: "Acciones",
      className: "w-[120px] text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/productos/${p.id}`}>
            <Button variant="ghost" size="icon" className="size-8">
              <Pencil className="size-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              eliminar(p.id);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">
            Productos
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Gestiona el catálogo de la tienda.
          </p>
        </div>
        <Link href="/admin/productos/nueva">
          <Button size="sm">
            <Plus className="size-4" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={productos}
        keyField="id"
        loading={cargando}
        loadingRows={8}
        emptyTitle="No hay productos"
        emptyDescription="Crea tu primer producto para empezar a vender."
        onRowClick={(p) =>
          (window.location.href = `/admin/productos/${p.id}`)
        }
      />
    </div>
  );
}
