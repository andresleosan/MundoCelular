"use client";

import { useEffect, useState } from "react";
import { ProductoForm } from "@/components/admin/ProductoForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export default function NuevoProducto() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  useEffect(() => { listarCategorias().then(setCategorias); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Nuevo producto</h1>
      <ProductoForm categorias={categorias} />
    </div>
  );
}
