"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoginButtons } from "@/components/auth/LoginButtons";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { usuario, esAdmin, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando || !usuario) return;

    const destino = localStorage.getItem("login-destino");
    localStorage.removeItem("login-destino");

    if (destino === "admin" && esAdmin) {
      router.replace("/admin");
    } else if (destino === "cliente") {
      router.replace("/");
    } else if (esAdmin) {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  }, [cargando, usuario, esAdmin, router]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center text-[14px] text-steel-blue-gray">
        Cargando…
      </main>
    );
  }

  if (usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center text-[14px] text-steel-blue-gray">
        Redirigiendo…
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <h1 className="font-sora text-[20px] font-semibold tracking-[-0.03em] text-mundo-blue">
        MUNDO CELULAR
      </h1>
      <p className="text-[14px] text-steel-blue-gray">Iniciar sesión</p>
      <LoginButtons />
    </main>
  );
}