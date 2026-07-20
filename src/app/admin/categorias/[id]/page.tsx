"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { CategoriaForm } from "@/components/admin/CategoriaForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export default function EditarCategoria() {
  const { id } = useParams<{ id: string }>();
  const [categoria, setCategoria] = useState<Categoria | null>(null);

  useEffect(() => {
    listarCategorias().then((cats) => setCategoria(cats.find((c) => c.id === id) ?? null));
  }, [id]);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Editar categoría</h1>
        {categoria ? <CategoriaForm categoria={categoria} /> : <p className="text-[14px] text-steel-blue-gray">Cargando…</p>}
      </main>
    </>
  );
}
