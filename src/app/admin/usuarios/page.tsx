"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUsuarios } from "@/components/admin/AdminUsuarios";

export default function AdminUsuariosPage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Gestionar administradores</h1>
        <AdminUsuarios />
      </main>
    </>
  );
}
