"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { CategoriaForm } from "@/components/admin/CategoriaForm";

export default function NuevaCategoria() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Nueva categoría</h1>
        <CategoriaForm />
      </main>
    </>
  );
}
