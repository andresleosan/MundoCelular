"use client";

import { AdminUsuarios } from "@/components/admin/AdminUsuarios";

export default function AdminUsuariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">
          Gestionar administradores
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Agregá o quitá permisos de administrador.
        </p>
      </div>
      <AdminUsuarios />
    </div>
  );
}
