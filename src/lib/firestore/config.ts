import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { avisarRevalidacion } from "../revalidate";
import type { ConfigTienda } from "@/types";

const REF = () => doc(db, "configuracion", "tienda");

export async function obtenerConfigTienda(): Promise<ConfigTienda | null> {
  const snap = await getDoc(REF());
  return snap.exists() ? (snap.data() as ConfigTienda) : null;
}

export async function guardarConfigTienda(config: ConfigTienda): Promise<void> {
  await setDoc(REF(), config);
  await avisarRevalidacion(["config"]);
}
