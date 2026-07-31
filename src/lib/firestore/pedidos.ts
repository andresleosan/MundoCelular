import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { getDb } from "../firebase";
import type { Pedido } from "@/types";

export async function listarPedidos(estado?: string): Promise<Pedido[]> {
  const db = getDb();
  let q;
  if (estado) {
    q = query(collection(db, "pedidos"), where("estado", "==", estado), orderBy("creadoEn", "desc"));
  } else {
    q = query(collection(db, "pedidos"), orderBy("creadoEn", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Pedido, "id">) }));
}

export async function obtenerPedido(id: string): Promise<Pedido | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, "pedidos", id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Pedido, "id">) }) : null;
}

export async function actualizarEstadoPedido(id: string, estado: Pedido["estado"]): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, "pedidos", id), { estado, actualizadoEn: new Date() });
}
