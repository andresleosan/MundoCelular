"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { eliminarCategoria, listarCategorias } from "@/lib/firestore/categorias";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Categoria } from "@/types";

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    setCargando(true);
    listarCategorias()
      .then(setCategorias)
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await eliminarCategoria(id);
    await cargar();
  }

  const columns: Column<Categoria>[] = [
    {
      header: "Nombre",
      cell: (c) => (
        <div>
          <p className="text-[14px] font-medium">{c.nombre}</p>
          <p className="text-[12px] text-muted-foreground">/{c.slug}</p>
        </div>
      ),
    },
    {
      header: "Estado",
      className: "w-[100px]",
      cell: (c) =>
        c.activa ? (
          <Badge variant="default">Activa</Badge>
        ) : (
          <Badge variant="secondary">Inactiva</Badge>
        ),
    },
    {
      header: "Acciones",
      className: "w-[120px] text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/categorias/${c.id}`}>
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
              eliminar(c.id);
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
            Categorías
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Organiza los productos en secciones.
          </p>
        </div>
        <Link href="/admin/categorias/nueva">
          <Button size="sm">
            <Plus className="size-4" />
            Nueva categoría
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={categorias}
        keyField="id"
        loading={cargando}
        loadingRows={5}
        emptyTitle="No hay categorías"
        emptyDescription="Crea tu primera categoría para organizar los productos."
        onRowClick={(c) =>
          (window.location.href = `/admin/categorias/${c.id}`)
        }
      />
    </div>
  );
}
