import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where,
} from "firebase/firestore";
import { getDb } from "../firebase";
import { validarVariante, type VarianteInput } from "../validacion";
import { avisarRevalidacion } from "../revalidate";
import type { VarianteProducto } from "@/types";

const COL = "variantes";

export async function listarVariantesPorProducto(productId: string): Promise<VarianteProducto[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COL), where("productId", "==", productId), where("activo", "==", true), orderBy("precio"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VarianteProducto, "id">) }));
}

export async function crearVariante(input: VarianteInput): Promise<string> {
  const errores = validarVariante(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  const db = getDb();
  const ref = await addDoc(collection(db, COL), {
    productId: input.productId,
    attributes: input.attributes,
    precio: input.precio,
    stock: input.stock,
    imagenes: input.imagenes ?? [],
    activo: true,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  await avisarRevalidacion(["productos"]);
  return ref.id;
}

export async function actualizarVariante(id: string, input: Partial<VarianteInput>): Promise<void> {
  if (Object.keys(input).length === 0) return;
  const db = getDb();
  const updateData: Record<string, unknown> = { ...input, actualizadoEn: serverTimestamp() };
  const imagenes = (input as { imagenes?: VarianteInput["imagenes"] }).imagenes;
  if (imagenes !== undefined) updateData.imagenes = imagenes;
  await updateDoc(doc(db, COL, id), updateData);
  await avisarRevalidacion(["productos"]);
}

export async function eliminarVariante(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COL, id));
  await avisarRevalidacion(["productos"]);
}