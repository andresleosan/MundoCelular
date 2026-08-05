"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { CONFIG_TIENDA_DEFAULT } from "@/lib/config-tienda";
import type { ConfigTienda } from "@/types";

interface ConfigContextValue {
  config: ConfigTienda | null;
  cargando: boolean;
}

const ConfigContext = createContext<ConfigContextValue>({ config: null, cargando: true });

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigTienda | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const db = getDb();
        if (!db) { setConfig(CONFIG_TIENDA_DEFAULT); setCargando(false); return; }
        const snap = await getDoc(doc(db, "configuracion", "tienda"));
        setConfig(snap.exists() ? (snap.data() as ConfigTienda) : CONFIG_TIENDA_DEFAULT);
      } catch {
        setConfig(CONFIG_TIENDA_DEFAULT);
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
  return config ?? CONFIG_TIENDA_DEFAULT;
}
