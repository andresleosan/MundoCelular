"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getDb } from "@/lib/firebase";
import { CONFIG_TIENDA_DEFAULT } from "@/lib/config-tienda";
import type { ConfigTienda } from "@/types";

interface ConfigContextValue {
  config: ConfigTienda | null;
  cargando: boolean;
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

const ConfigContext = createContext<ConfigContextValue>({ config: null, cargando: true });

export function ConfigProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [config, setConfig] = useState<ConfigTienda | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (pathname === "/") {
      setConfig(CONFIG_TIENDA_DEFAULT);
      setCargando(false);
      return;
    }

    let activo = true;

    async function cargar() {
      try {
        const [{ doc, getDoc }, db] = await Promise.all([
          import("firebase/firestore"),
          getDb(),
        ]);
        if (!db) {
          if (activo) {
            setConfig(CONFIG_TIENDA_DEFAULT);
            setCargando(false);
          }
          return;
        }
        const snap = await getDoc(doc(db, "configuracion", "tienda"));
        if (activo) setConfig(snap.exists() ? (snap.data() as ConfigTienda) : CONFIG_TIENDA_DEFAULT);
      } catch {
        if (activo) setConfig(CONFIG_TIENDA_DEFAULT);
      } finally {
        if (activo) setCargando(false);
      }
    }

    const idleWindow = window as IdleWindow;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(cargar, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(cargar, 200);
    }

    return () => {
      activo = false;
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [pathname]);

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
