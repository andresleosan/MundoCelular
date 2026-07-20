"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { BotonGoogle } from "@/components/auth/BotonGoogle";

export default function LoginAdmin() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && usuario) router.replace("/admin");
  }, [cargando, usuario, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-mundo-blue">MUNDO CELULAR</h1>
      <p className="text-[14px] text-steel-blue-gray">Panel de administración</p>
      <BotonGoogle />
    </main>
  );
}
