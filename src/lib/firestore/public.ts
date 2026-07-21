import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import type { Categoria, Producto, ConfigTienda } from "@/types";

function toCategoria(snap: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Categoria {
  return { id: snap.id, ...(snap.data() as Omit<Categoria, "id">) };
}
function toProducto(snap: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Producto {
  return { id: snap.id, ...(snap.data() as Omit<Producto, "id">) };
}

export const listarCategoriasPublic = unstable_cache(
  async (): Promise<Categoria[]> => {
    const db = getAdminDb();
    const snap = await db.collection("categorias").where("activa", "==", true).orderBy("orden").get();
    return snap.docs.map(toCategoria);
  },
  ["categorias-public"],
  { tags: ["categorias"] }
);

export const getCategoriaPorSlug = unstable_cache(
  async (slug: string): Promise<Categoria | null> => {
    const db = getAdminDb();
    const snap = await db.collection("categorias").where("slug", "==", slug).limit(1).get();
    return snap.empty ? null : toCategoria(snap.docs[0]);
  },
  ["categoria-por-slug"],
  { tags: ["categorias"] }
);

export const listarProductosCategoria = unstable_cache(
  async (categoriaId: string): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await db.collection("productos").where("categoriaId", "==", categoriaId).where("activo", "==", true).orderBy("nombre").get();
    return snap.docs.map(toProducto);
  },
  ["productos-categoria"],
  { tags: ["productos"] }
);

export const getProductoPorSlug = unstable_cache(
  async (categoriaSlug: string, productoSlug: string): Promise<Producto | null> => {
    const db = getAdminDb();
    const catSnap = await db.collection("categorias").where("slug", "==", categoriaSlug).limit(1).get();
    if (catSnap.empty) return null;
    const categoriaId = catSnap.docs[0].id;
    const snap = await db.collection("productos").where("categoriaId", "==", categoriaId).where("slug", "==", productoSlug).where("activo", "==", true).limit(1).get();
    return snap.empty ? null : toProducto(snap.docs[0]);
  },
  ["producto-por-slug"],
  { tags: ["productos"] }
);

export const getProductoPorId = unstable_cache(
  async (slug: string): Promise<Producto | null> => {
    const db = getAdminDb();
    const snap = await db.collection("productos").where("slug", "==", slug).where("activo", "==", true).limit(1).get();
    return snap.empty ? null : toProducto(snap.docs[0]);
  },
  ["producto-por-id"],
  { tags: ["productos"] }
);

export const getCategoriaPorId = unstable_cache(
  async (id: string): Promise<Categoria | null> => {
    const db = getAdminDb();
    const snap = await db.doc(`categorias/${id}`).get();
    return snap.exists ? toCategoria(snap as FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) : null;
  },
  ["categoria-por-id"],
  { tags: ["categorias"] }
);

export const getTodosLosProductos = unstable_cache(
  async (): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await db.collection("productos").where("activo", "==", true).orderBy("nombre").get();
    return snap.docs.map(toProducto);
  },
  ["todos-productos"],
  { tags: ["productos"] }
);

export const listarDestacados = unstable_cache(
  async (): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await db.collection("productos").where("activo", "==", true).where("destacado", "==", true).orderBy("nombre").get();
    return snap.docs.map(toProducto);
  },
  ["destacados"],
  { tags: ["productos"] }
);

export const obtenerConfigTiendaServidor = unstable_cache(
  async (): Promise<ConfigTienda> => {
    const db = getAdminDb();
    const snap = await db.doc("configuracion/tienda").get();
    if (!snap.exists) throw new Error("Falta configuracion/tienda — ejecuta npm run seed:config");
    return snap.data() as ConfigTienda;
  },
  ["config-tienda"],
  { tags: ["config"] }
);

export async function listarTodosLosSlugsProducto(): Promise<Array<{ categoria: string; producto: string }>> {
  const db = getAdminDb();
  const cats = await db.collection("categorias").where("activa", "==", true).get();
  const out: Array<{ categoria: string; producto: string }> = [];
  for (const c of cats.docs) {
    const prods = await db.collection("productos").where("categoriaId", "==", c.id).where("activo", "==", true).get();
    for (const p of prods.docs) {
      out.push({ categoria: c.data().slug as string, producto: p.data().slug as string });
    }
  }
  return out;
}