"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { usuario, esAdmin, cargando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const esLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!cargando && !usuario && !esLogin) router.replace("/admin/login");
  }, [cargando, usuario, esLogin, router]);

  if (esLogin) return <>{children}</>;
  if (cargando || !usuario) {
    return <main className="flex min-h-screen items-center justify-center text-[14px] text-steel-blue-gray">Cargando…</main>;
  }
  if (!esAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Sin acceso</h1>
        <p className="text-[14px] text-steel-blue-gray">Esta cuenta no tiene permisos de administrador.</p>
      </main>
    );
  }
  return <>{children}</>;
}
