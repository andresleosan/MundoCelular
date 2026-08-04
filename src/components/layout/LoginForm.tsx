"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginConGoogle, loginConEmail, cerrarSesion, traducirErrorAuth } from "@/lib/auth-client";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/components/ui/Icon";

type RoleSelection = "customer" | "admin" | null;

const inputClasses =
  "w-full h-[52px] rounded-[14px] border-2 border-[#D8E2FF] bg-[#F8FAFF] px-4 text-[15px] text-[#081B4B] outline-none placeholder:text-[#7A89AF] transition-all duration-200 focus:border-[#00CFFF] focus:shadow-[0_0_0_4px_rgba(0,207,255,0.15)]";

const labelClasses = "block text-[14px] font-semibold text-[#22335C] mb-2";

export function LoginForm() {
  const router = useRouter();
  const { usuario, esAdmin, cargando: authCargando } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleSelection>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const solicitudAdminUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!usuario) {
      solicitudAdminUidRef.current = null;
      return;
    }
    if (authCargando || !cargando) return;
    setCargando(false);
    if (selectedRole === "admin" && !esAdmin) {
      if (solicitudAdminUidRef.current === usuario.uid) return;
      solicitudAdminUidRef.current = usuario.uid;
      void (async () => {
        let mensaje = "No se pudo enviar la solicitud. Intenta de nuevo.";
        try {
          const token = await usuario.getIdToken();
          const response = await fetch("/api/auth/admin-request", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 201) {
            mensaje = "Solicitud enviada. Un administrador revisara tu acceso.";
          } else if (response.status === 409) {
            const payload = await response.json().catch(() => null);
            mensaje = typeof payload?.error === "string"
              ? payload.error
              : "Tu solicitud de administrador ya esta pendiente.";
          }
        } catch {
          mensaje = "No se pudo enviar la solicitud. Intenta de nuevo.";
        }
        setError(mensaje);
        try {
          await cerrarSesion();
        } catch {
          setError("No se pudo enviar la solicitud. Intenta de nuevo.");
        }
      })();
      return;
    }
    if (selectedRole === "customer") {
      router.push("/");
    } else if (selectedRole === "admin") {
      router.push("/admin");
    }
  }, [authCargando, usuario, esAdmin, selectedRole, router, cargando]);

  async function handleLoginGoogle() {
    if (!selectedRole) {
      setError("Selecciona Cliente o Administrador");
      return;
    }
    setCargando(true);
    setError("");
    try {
      await loginConGoogle();
    } catch (err) {
      setError(traducirErrorAuth(err));
      setCargando(false);
    }
  }

  async function handleLoginEmail() {
    if (!selectedRole) {
      setError("Selecciona Cliente o Administrador");
      return;
    }
    if (!email || !password) {
      setError("Ingresa email y contraseña");
      return;
    }
    setCargando(true);
    setError("");
    try {
      await loginConEmail(email, password);
    } catch (err) {
      setError(traducirErrorAuth(err));
      setCargando(false);
    }
  }

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="size-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="email" className={labelClasses}>Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClasses}>Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClasses}
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-3">
        <p className="text-[14px] font-semibold text-[#22335C]">Selecciona tu tipo de acceso</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setSelectedRole("customer"); setError(""); }}
            className={`flex flex-col items-center gap-2 rounded-[16px] border-2 bg-[#F8FAFF] p-5 transition-all duration-200 ${
              selectedRole === "customer"
                ? "border-[#00CFFF] bg-[rgba(0,207,255,0.08)] shadow-[0_10px_30px_rgba(0,207,255,0.15)]"
                : "border-[#D8E2FF] hover:border-[#B8C8F0]"
            }`}
          >
            <Icon name="user" size={28} className={selectedRole === "customer" ? "text-[#00CFFF]" : "text-[#4B5A7D]"} />
            <span className="text-[14px] font-semibold text-[#22335C]">Cliente</span>
            <span className="text-[12px] font-medium text-[#4B5A7D]">Ir a la tienda</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedRole("admin"); setError(""); }}
            className={`flex flex-col items-center gap-2 rounded-[16px] border-2 bg-[#F8FAFF] p-5 transition-all duration-200 ${
              selectedRole === "admin"
                ? "border-[#00CFFF] bg-[rgba(0,207,255,0.08)] shadow-[0_10px_30px_rgba(0,207,255,0.15)]"
                : "border-[#D8E2FF] hover:border-[#B8C8F0]"
            }`}
          >
            <Icon name="badge-check" size={28} className={selectedRole === "admin" ? "text-[#00CFFF]" : "text-[#4B5A7D]"} />
            <span className="text-[14px] font-semibold text-[#22335C]">Administrador</span>
            <span className="text-[12px] font-medium text-[#4B5A7D]">Panel de control</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-[12px] border border-[#DC2626]/25 bg-[#DC2626]/5 p-3 text-[13px] font-medium text-[#DC2626]">{error}</p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleLoginGoogle}
          disabled={cargando}
          className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#D8E2FF] bg-white px-4 text-[15px] font-semibold text-[#081B4B] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <GoogleIcon />
          {cargando ? "Ingresando…" : "Iniciar sesión con Google"}
        </button>

        <button
          type="button"
          onClick={handleLoginEmail}
          disabled={cargando}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#003DAA] to-[#00CFFF] px-4 text-[15px] font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_15px_35px_rgba(0,61,170,0.25)] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {cargando ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}
