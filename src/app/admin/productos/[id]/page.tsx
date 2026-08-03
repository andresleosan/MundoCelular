"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductoForm } from "@/components/admin/ProductoForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import type { Categoria, Producto } from "@/types";

type Estado = "cargando" | "no-encontrada" | "error" | "lista";

export default function EditarProducto() {
  const { id } = useParams<{ id: string }>();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    setEstado("cargando");
    listarCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]));
    listarProductos()
      .then((prods) => {
        const encontrado = prods.find((p) => p.id === id);
        if (encontrado) {
          setProducto(encontrado);
          setEstado("lista");
        } else {
          setEstado("no-encontrada");
        }
      })
      .catch(() => setEstado("error"));
  }, [id]);

  return (
    <div className="space-y-6">
      <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Editar producto</h1>
      {estado === "lista" && producto ? (
        <ProductoForm categorias={categorias} producto={producto} />
      ) : estado === "cargando" ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-32 w-full max-w-xl" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-[16px] font-semibold">
            {estado === "no-encontrada" ? "Producto no encontrado" : "No se pudo cargar el producto"}
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {estado === "no-encontrada"
              ? "El producto que buscás no existe o fue eliminado."
              : "Ocurrió un error al cargar. Intentá de nuevo más tarde."}
          </p>
          <Link href="/admin/productos" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-3.5" />
              Volver a productos
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
