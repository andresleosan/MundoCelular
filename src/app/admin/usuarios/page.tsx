"use client";

import { AdminUsuarios } from "@/components/admin/AdminUsuarios";

export default function AdminUsuariosPage() {
  return (
    <main className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Gestionar administradores</h1>
        <AdminUsuarios />
      </div>
    </main>
  );
}
