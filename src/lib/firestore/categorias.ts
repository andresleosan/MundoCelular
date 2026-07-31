import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where, limit,
} from "firebase/firestore";
import { getDb } from "../firebase";
import { asegurarSlugUnico, esSlugReservado, generarSlug } from "../slug";
import { validarCategoria } from "../validacion";
import { avisarRevalidacion } from "../revalidate";
import type { Categoria } from "@/types";

const COL = "categorias";

export interface CategoriaInput {
  nombre: string;
  descripcion: string;
  orden: number;
  activa: boolean;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const db = getDb();
  const snap = await getDocs(query(collection(db, COL), orderBy("orden")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Categoria, "id">) }));
}

async function slugsExistentes(): Promise<string[]> {
  const db = getDb();
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => d.data().slug as string);
}

export async function crearCategoria(input: CategoriaInput): Promise<string> {
  const errores = validarCategoria(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  const base = generarSlug(input.nombre);
  if (!base) throw new Error("El nombre no genera una URL válida");
  if (esSlugReservado(base)) throw new Error("Ese nombre usa una URL reservada del sistema");
  const slug = asegurarSlugUnico(base, await slugsExistentes());
  const db = getDb();
  const ref = await addDoc(collection(db, COL), { ...input, nombre: input.nombre.trim(), slug });
  await avisarRevalidacion(["categorias"]);
  return ref.id;
}

export async function actualizarCategoria(id: string, input: CategoriaInput): Promise<void> {
  const errores = validarCategoria(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  const db = getDb();
  await updateDoc(doc(db, COL, id), { ...input, nombre: input.nombre.trim() });
  await avisarRevalidacion(["categorias"]);
}

export async function eliminarCategoria(id: string): Promise<void> {
  const db = getDb();
  const productos = await getDocs(query(collection(db, "productos"), where("categoriaId", "==", id), limit(1)));
  if (!productos.empty) throw new Error("No se puede eliminar: la categoría tiene productos");
  await deleteDoc(doc(db, COL, id));
  await avisarRevalidacion(["categorias"]);
}
