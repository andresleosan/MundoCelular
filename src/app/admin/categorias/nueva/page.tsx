"use client";

import { CategoriaForm } from "@/components/admin/CategoriaForm";

export default function NuevaCategoria() {
  return (
    <div className="space-y-6">
      <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Nueva categoría</h1>
      <CategoriaForm />
    </div>
  );
}
