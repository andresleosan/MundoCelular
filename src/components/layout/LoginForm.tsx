"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginConGoogle } from "@/lib/auth-client";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/components/ui/Icon";

export function LoginForm() {
  const [cargando, setCargando] = useState<"cliente" | "admin" | null>(null);
  const [error, setError] = useState("");
  const { usuario, esAdmin, cargando: authCargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authCargando || !cargando || !usuario) return;
    if (cargando === "admin") {
      if (esAdmin) {
        router.push("/admin");
      } else {
        setError("Esta cuenta no tiene permisos de administrador. Ejecuta: npm run set:admin -- <uid>");
        setCargando(null);
      }
    } else {
      router.push("/");
    }
  }, [cargando, usuario, esAdmin, authCargando, router]);

  async function handleLogin(tipo: "cliente" | "admin") {
    setCargando(tipo);
    setError("");
    try {
      await loginConGoogle();
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
      setCargando(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => handleLogin("cliente")}
          disabled={cargando !== null}
          className="flex flex-col items-center gap-2 rounded-cards border border-faint-border bg-pure-white px-8 py-6 transition hover:shadow-lg disabled:opacity-50"
        >
          <Icon name="user" size={24} className="text-primary" />
          <span className="text-[14px] font-medium text-ink-navy">Cliente</span>
          <span className="text-[12px] text-steel-blue-gray">Ir a la tienda</span>
        </button>

        <button
          type="button"
          onClick={() => handleLogin("admin")}
          disabled={cargando !== null}
          className="flex flex-col items-center gap-2 rounded-cards border border-faint-border bg-pure-white px-8 py-6 transition hover:shadow-lg disabled:opacity-50"
        >
          <Icon name="badge-check" size={24} className="text-primary" />
          <span className="text-[14px] font-medium text-ink-navy">Administrador</span>
          <span className="text-[12px] text-steel-blue-gray">Panel de control</span>
        </button>
      </div>

      {cargando && (
        <p className="text-[14px] text-steel-blue-gray">
          Ingresando como {cargando === "cliente" ? "cliente" : "administrador"}…
        </p>
      )}

      {error && <p className="text-[14px] text-mundo-blue">{error}</p>}
    </div>
  );
}
