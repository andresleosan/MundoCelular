"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cerrarSesion } from "@/lib/auth-client";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { usuario, esAdmin, cargando, authActiva, activarAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const esLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!esLogin) activarAuth();
  }, [activarAuth, esLogin]);

  useEffect(() => {
    if (authActiva && !cargando && !usuario && !esLogin) router.replace("/admin/login");
  }, [authActiva, cargando, usuario, esLogin, router]);

  if (esLogin) return <>{children}</>;
  if (!authActiva || cargando || !usuario) {
    return <main className="flex min-h-screen items-center justify-center text-[14px] text-steel-blue-gray">Cargando…</main>;
  }
  if (!cargando && usuario && !esAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-[16px] font-medium">Sin acceso</p>
        <p className="text-[14px] text-muted-foreground">Esta cuenta no tiene permisos de administrador.</p>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              await cerrarSesion();
              router.replace("/");
            }}
            className="rounded-lg border border-input px-4 py-2 text-[14px] transition hover:bg-muted"
          >
            Cerrar sesión
          </button>
          <button
            onClick={() => router.replace("/")}
            className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
