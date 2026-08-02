"use client";

import { useEffect, useState } from "react";
import { ProductoForm } from "@/components/admin/ProductoForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export default function NuevoProducto() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  useEffect(() => { listarCategorias().then(setCategorias); }, []);

  return (
    <main className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Nuevo producto</h1>
        <ProductoForm categorias={categorias} />
      </div>
    </main>
  );
}
