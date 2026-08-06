"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { esClaimAdmin } from "@/lib/auth-claims";

interface AuthContextValue {
  usuario: User | null;
  esAdmin: boolean;
  cargando: boolean;
  authActiva: boolean;
  activarAuth: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  usuario: null,
  esAdmin: false,
  cargando: false,
  authActiva: false,
  activarAuth: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [authActiva, setAuthActiva] = useState(false);
  // Incrementa en cada cambio de estado de auth para descartar resoluciones
  // de claims obsoletas (previene races entre onIdTokenChanged consecutivos).
  const sesionRef = useRef(0);

  const activarAuth = useCallback(() => {
    setCargando(true);
    setAuthActiva(true);
  }, []);

  useEffect(() => {
    if (!authActiva) return;

    let activo = true;
    let unsubscribe: (() => void) | undefined;
    async function iniciarSuscripcion() {
      const [{ onIdTokenChanged }, { getAuthClient }] = await Promise.all([
        import("firebase/auth"),
        import("@/lib/firebase"),
      ]);
      const authClient = await getAuthClient();
      if (!activo || !authClient) {
        if (activo) setCargando(false);
        return;
      }

      unsubscribe = onIdTokenChanged(authClient, async (user) => {
        const sesion = ++sesionRef.current;
        // Marca como cargando hasta resolver claims: evita que consumidores
        // (LoginForm, AdminGuard) vean un usuario sin su claim de admin aún
        // calculado (p. ej. al reloguear sin recargar la página).
        setCargando(true);
        setUsuario(user);
        if (user) {
          user.getIdToken().then((token) => {
            fetch("/api/auth/sync", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          });
        }
        if (user) {
          try {
            const token = await user.getIdTokenResult();
            if (sesion !== sesionRef.current) return;
            setEsAdmin(esClaimAdmin(token.claims));
          } catch {
            if (sesion !== sesionRef.current) return;
            setEsAdmin(false);
          }
        } else {
          if (sesion !== sesionRef.current) return;
          setEsAdmin(false);
          localStorage.removeItem("login-destino");
        }
        if (sesion === sesionRef.current) setCargando(false);
      });
    }

    void iniciarSuscripcion();

    return () => {
      activo = false;
      unsubscribe?.();
    };
  }, [authActiva]);

  return <AuthContext.Provider value={{ usuario, esAdmin, cargando, authActiva, activarAuth }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
