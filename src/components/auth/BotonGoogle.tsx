"use client";

import { useState } from "react";
import { loginConGoogle } from "@/lib/auth-client";

export function BotonGoogle() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setCargando(true);
    setError("");
    try {
      await loginConGoogle();
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={cargando}
        className="rounded-chips bg-pure-white px-6 py-3 text-[14px] font-medium text-ink-navy shadow-sm-2 transition hover:shadow-lg disabled:opacity-50"
      >
        {cargando ? "Ingresando…" : "Ingresar con Google"}
      </button>
      {error && <p className="text-[12px] text-mundo-blue">{error}</p>}
    </div>
  );
}
