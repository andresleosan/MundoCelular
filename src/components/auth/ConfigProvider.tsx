"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { ConfigTienda } from "@/types";

interface ConfigContextValue {
  config: ConfigTienda | null;
  cargando: boolean;
}

const ConfigContext = createContext<ConfigContextValue>({ config: null, cargando: true });

const FALLBACK: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: "573113554021",
  direccion: "",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "CO",
  horario: "",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigTienda | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const db = getDb();
        if (!db) { setConfig(FALLBACK); setCargando(false); return; }
        const snap = await getDoc(doc(db, "configuracion", "tienda"));
        setConfig(snap.exists() ? (snap.data() as ConfigTienda) : FALLBACK);
      } catch {
        setConfig(FALLBACK);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, cargando }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigTienda {
  const { config } = useContext(ConfigContext);
  return config ?? FALLBACK;
}
