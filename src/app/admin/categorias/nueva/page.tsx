"use client";

import { CategoriaForm } from "@/components/admin/CategoriaForm";

export default function NuevaCategoria() {
  return (
    <main className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Nueva categoría</h1>
        <CategoriaForm />
      </div>
    </main>
  );
}
