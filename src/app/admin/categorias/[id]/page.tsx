"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CategoriaForm } from "@/components/admin/CategoriaForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import type { Categoria } from "@/types";

type Estado = "cargando" | "no-encontrada" | "error" | "lista";

export default function EditarCategoria() {
  const { id } = useParams<{ id: string }>();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    setEstado("cargando");
    listarCategorias()
      .then((cats) => {
        const encontrada = cats.find((c) => c.id === id);
        if (encontrada) {
          setCategoria(encontrada);
          setEstado("lista");
        } else {
          setEstado("no-encontrada");
        }
      })
      .catch(() => setEstado("error"));
  }, [id]);

  return (
    <div className="space-y-6">
      <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Editar categoría</h1>
      {estado === "lista" && categoria ? (
        <CategoriaForm categoria={categoria} />
      ) : estado === "cargando" ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-24 w-full max-w-xl" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-[16px] font-semibold">
            {estado === "no-encontrada" ? "Categoría no encontrada" : "No se pudo cargar la categoría"}
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {estado === "no-encontrada"
              ? "La categoría que buscás no existe o fue eliminada."
              : "Ocurrió un error al cargar. Intentá de nuevo más tarde."}
          </p>
          <Link href="/admin/categorias" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-3.5" />
              Volver a categorías
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
