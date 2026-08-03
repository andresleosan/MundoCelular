"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { esClaimAdmin } from "@/lib/auth-claims";

interface AuthContextValue {
  usuario: User | null;
  esAdmin: boolean;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextValue>({ usuario: null, esAdmin: false, cargando: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);
  // Incrementa en cada cambio de estado de auth para descartar resoluciones
  // de claims obsoletas (previene races entre onIdTokenChanged consecutivos).
  const sesionRef = useRef(0);

  useEffect(() => {
    if (!auth) {
      setCargando(false);
      return;
    }
    return onIdTokenChanged(auth, async (user) => {
      const sesion = ++sesionRef.current;
      // Marca como cargando hasta resolver claims: evita que consumidores
      // (LoginForm, AdminGuard) vean un usuario sin su claim de admin aún
      // calculado (p. ej. al reloguear sin recargar la página).
      setCargando(true);
      setUsuario(user);
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
  }, []);

  return <AuthContext.Provider value={{ usuario, esAdmin, cargando }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
