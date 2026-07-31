import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "../firebase";
import { avisarRevalidacion } from "../revalidate";
import type { ConfigTienda } from "@/types";

export async function obtenerConfigTienda(): Promise<ConfigTienda | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, "configuracion", "tienda"));
  return snap.exists() ? (snap.data() as ConfigTienda) : null;
}

export async function guardarConfigTienda(config: ConfigTienda): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, "configuracion", "tienda"), config);
  await avisarRevalidacion(["config"]);
}
