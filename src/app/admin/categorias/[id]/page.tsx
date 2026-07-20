"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { CategoriaForm } from "@/components/admin/CategoriaForm";
import { listarCategorias } from "@/lib/firestore/categorias";
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
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Editar categoría</h1>
        {estado === "lista" && categoria ? (
          <CategoriaForm categoria={categoria} />
        ) : estado === "cargando" ? (
          <p className="text-[14px] text-steel-blue-gray">Cargando…</p>
        ) : (
          <div className="rounded-cards bg-pure-white p-6 shadow-sm-2">
            <h2 className="mb-2 text-[16px] font-semibold">
              {estado === "no-encontrada" ? "Categoría no encontrada" : "No se pudo cargar la categoría"}
            </h2>
            <p className="mb-4 text-[14px] text-steel-blue-gray">
              {estado === "no-encontrada"
                ? "La categoría que buscás no existe o fue eliminada."
                : "Ocurrió un error al cargar la categoría. Intentá de nuevo más tarde."}
            </p>
            <Link href="/admin/categorias" className="rounded-chips border border-faint-border px-3 py-1 text-[12px]">
              Volver a categorías
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
