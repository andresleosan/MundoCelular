"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
    if (!auth) {
      setCargando(false);
      return;
    }
    return onIdTokenChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        try {
          const token = await user.getIdTokenResult();
          setEsAdmin(esClaimAdmin(token.claims));
        } catch {
          setEsAdmin(false);
        }
      } else {
        setEsAdmin(false);
        localStorage.removeItem("login-destino");
      }
      setCargando(false);
    });
  }, []);

  return <AuthContext.Provider value={{ usuario, esAdmin, cargando }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
