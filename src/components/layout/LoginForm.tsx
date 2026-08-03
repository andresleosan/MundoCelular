"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginConGoogle, loginConEmail, traducirErrorAuth } from "@/lib/auth-client";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/components/ui/Icon";

export function LoginForm() {
  const [cargando, setCargando] = useState<"cliente" | "admin" | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { usuario, esAdmin, cargando: authCargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authCargando || !cargando || !usuario) return;
    if (cargando === "admin") {
      if (esAdmin) {
        router.push("/admin");
      } else {
        setError("Esta cuenta no tiene permisos de administrador.");
        setCargando(null);
      }
    } else {
      router.push("/");
    }
  }, [cargando, usuario, esAdmin, authCargando, router]);

  async function handleLoginGoogle(tipo: "cliente" | "admin") {
    setCargando(tipo);
    setError("");
    try {
      await loginConGoogle();
    } catch (e: unknown) {
      setError(traducirErrorAuth(e));
      setCargando(null);
    }
  }

  async function handleLoginEmail(tipo: "cliente" | "admin") {
    setCargando(tipo);
    setError("");
    try {
      await loginConEmail(email, password);
    } catch (e: unknown) {
      setError(traducirErrorAuth(e));
      setCargando(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => handleLoginGoogle("cliente")}
          disabled={cargando !== null}
          className="flex flex-col items-center gap-2 rounded-cards border border-faint-border bg-pure-white px-8 py-6 transition hover:shadow-lg disabled:opacity-50"
        >
          <Icon name="user" size={24} className="text-primary" />
          <span className="text-[14px] font-medium text-navy-deep">Cliente</span>
          <span className="text-[12px] text-steel-blue-gray">Ir a la tienda</span>
        </button>

        <button
          type="button"
          onClick={() => handleLoginGoogle("admin")}
          disabled={cargando !== null}
          className="flex flex-col items-center gap-2 rounded-cards border border-faint-border bg-pure-white px-8 py-6 transition hover:shadow-lg disabled:opacity-50"
        >
          <Icon name="badge-check" size={24} className="text-primary" />
          <span className="text-[14px] font-medium text-navy-deep">Administrador</span>
          <span className="text-[12px] text-steel-blue-gray">Panel de control</span>
        </button>
      </div>

      <div className="w-full max-w-[300px]">
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-faint-border" /></div>
          <div className="relative flex justify-center text-[12px]"><span className="bg-pure-white px-3 text-steel-blue-gray">o con email</span></div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleLoginEmail("cliente"); }} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-chips border border-faint-border px-4 py-2 text-[14px] text-navy-deep placeholder:text-navy-deep/50 focus:border-mundo-blue focus:outline-none"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-chips border border-faint-border px-4 py-2 text-[14px] text-navy-deep placeholder:text-navy-deep/50 focus:border-mundo-blue focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={cargando !== null || !email || !password}
              className="flex-1 rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] font-medium text-navy-deep transition hover:shadow-lg disabled:opacity-50"
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => handleLoginEmail("admin")}
              disabled={cargando !== null || !email || !password}
              className="flex-1 rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] font-medium text-navy-deep transition hover:shadow-lg disabled:opacity-50"
            >
              Admin
            </button>
          </div>
        </form>
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
