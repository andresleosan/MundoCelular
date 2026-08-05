import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "../firebase";
import type { Pedido } from "@/types";

export const PEDIDOS_POR_PAGINA = 10;

export interface PaginaPedidosCliente {
  pedidos: Pedido[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
}

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

export async function listarPedidosCliente(
  clienteUid: string,
  cursor?: QueryDocumentSnapshot<DocumentData>,
): Promise<PaginaPedidosCliente> {
  const restricciones: QueryConstraint[] = [
    where("clienteUid", "==", clienteUid),
    orderBy("creadoEn", "desc"),
    limit(PEDIDOS_POR_PAGINA),
  ];
  if (cursor) restricciones.push(startAfter(cursor));

  const snap = await getDocs(query(collection(getDb(), "pedidos"), ...restricciones));
  const documentos = snap.docs;
  return {
    pedidos: documentos.map((documento) => ({
      id: documento.id,
      ...(documento.data() as Omit<Pedido, "id">),
    })),
    cursor: documentos.length === PEDIDOS_POR_PAGINA ? (documentos.at(-1) ?? null) : null,
  };
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
