import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { asegurarSlugUnico, esSlugReservado, generarSlug } from "../slug";
import { validarProducto, type ProductoInput } from "../validacion";
import { avisarRevalidacion } from "../revalidate";
import type { Producto } from "@/types";

const COL = "productos";

export async function listarProductos(): Promise<Producto[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy("nombre")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Producto, "id">) }));
}

async function slugsExistentes(): Promise<string[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => d.data().slug as string);
}

export async function crearProducto(input: ProductoInput): Promise<string> {
  const errores = validarProducto(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  const base = generarSlug(input.nombre);
  if (!base) throw new Error("El nombre no genera una URL válida");
  if (esSlugReservado(base)) throw new Error("Ese nombre usa una URL reservada del sistema");
  const slug = asegurarSlugUnico(base, await slugsExistentes());
  const ref = await addDoc(collection(db, COL), {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion,
    precio: input.precio,
    stock: input.stock,
    categoriaId: input.categoriaId,
    marca: input.marca,
    specs: input.specs,
    activo: input.activo,
    destacado: input.destacado,
    imagenes: input.imagenes ?? [],
    slug,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  await avisarRevalidacion(["productos"]);
  return ref.id;
}

export async function actualizarProducto(id: string, input: ProductoInput): Promise<void> {
  const errores = validarProducto(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  await updateDoc(doc(db, COL, id), {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion,
    precio: input.precio,
    stock: input.stock,
    categoriaId: input.categoriaId,
    marca: input.marca,
    specs: input.specs,
    activo: input.activo,
    destacado: input.destacado,
    imagenes: input.imagenes ?? [],
    actualizadoEn: serverTimestamp(),
  });
  await avisarRevalidacion(["productos"]);
}

export async function eliminarProducto(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
  await avisarRevalidacion(["productos"]);
}
