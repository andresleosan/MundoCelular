"use client";

import { useState } from "react";
import { loginConGoogle } from "@/lib/auth-client";
import { Icon } from "@/components/ui/Icon";

export function LoginForm() {
  const [cargando, setCargando] = useState<"cliente" | "admin" | null>(null);
  const [error, setError] = useState("");

  async function handleLogin(tipo: "cliente" | "admin") {
    setCargando(tipo);
    setError("");
    try {
      localStorage.setItem("login-destino", tipo);
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
