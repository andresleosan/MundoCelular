import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { ejecutarLecturaFirestore } from "@/lib/firestore/diagnostics";
import type { Categoria, Producto, ConfigTienda, VarianteProducto, ImagenProducto } from "@/types";

type FirestoreData = Record<string, unknown>;
type FirestoreSnapshot = { id: string; data: () => unknown };

function esObjetoPlano(value: unknown): value is FirestoreData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stringSeguro(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numeroSeguro(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toSpecs(value: unknown): Record<string, string> {
  if (!esObjetoPlano(value)) return {};
  return Object.entries(value).reduce<Record<string, string>>((specs, [key, item]) => {
    if (typeof item === "string") specs[key] = item;
    return specs;
  }, {});
}

function toImagenes(value: unknown): ImagenProducto[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is FirestoreData =>
      esObjetoPlano(item) && ["url", "thumb", "alt"].some((field) => field in item)
    )
    .map((item) => ({
      url: stringSeguro(item.url),
      thumb: stringSeguro(item.thumb),
      alt: stringSeguro(item.alt),
    }));
}

function toAtributosDisponibles(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toAttributes(value: unknown): Record<string, string> {
  if (!esObjetoPlano(value)) return {};
  return Object.entries(value).reduce<Record<string, string>>((attributes, [key, item]) => {
    if (typeof item === "string") attributes[key] = item;
    return attributes;
  }, {});
}

function toCreadoEnMillis(value: unknown): number {
  if (typeof value !== "object" || value === null) return 0;

  const timestamp = value as {
    toMillis?: unknown;
    _seconds?: unknown;
    _nanoseconds?: unknown;
  };

  if (typeof timestamp.toMillis === "function") {
    const millis = timestamp.toMillis();
    return typeof millis === "number" && Number.isFinite(millis) ? millis : 0;
  }

  if (typeof timestamp._seconds === "number" && typeof timestamp._nanoseconds === "number") {
    return timestamp._seconds * 1000 + timestamp._nanoseconds / 1_000_000;
  }

  return 0;
}

function toCategoria(snap: FirestoreSnapshot): Categoria {
  const data = esObjetoPlano(snap.data()) ? snap.data() as FirestoreData : {};
  const size = data.size === "lg" || data.size === "md" || data.size === "sm" ? data.size : undefined;

  return {
    id: snap.id,
    nombre: stringSeguro(data.nombre),
    slug: stringSeguro(data.slug),
    descripcion: stringSeguro(data.descripcion),
    orden: numeroSeguro(data.orden),
    activa: data.activa === true,
    ...(size ? { size } : {}),
  };
}
function toProducto(snap: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Producto {
  const data = snap.data();
  const producto: Producto = {
    id: snap.id,
    nombre: typeof data.nombre === "string" ? data.nombre : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    descripcion: typeof data.descripcion === "string" ? data.descripcion : "",
    precio: typeof data.precio === "number" ? data.precio : 0,
    stock: typeof data.stock === "number" ? data.stock : 0,
    categoriaId: typeof data.categoriaId === "string" ? data.categoriaId : "",
    marca: typeof data.marca === "string" ? data.marca : "",
    specs: toSpecs(data.specs),
    imagenes: toImagenes(data.imagenes),
    activo: data.activo === true,
    destacado: data.destacado === true,
    tieneVariantes: data.tieneVariantes === true,
    atributosDisponibles: toAtributosDisponibles(data.atributosDisponibles),
  };
  if (typeof data.metaTitle === "string") producto.metaTitle = data.metaTitle;
  if (typeof data.metaDescription === "string") producto.metaDescription = data.metaDescription;
  return producto;
}
function toVariante(snap: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): VarianteProducto {
  const data = snap.data();
  return {
    id: snap.id,
    productId: typeof data.productId === "string" ? data.productId : "",
    attributes: toAttributes(data.attributes),
    precio: typeof data.precio === "number" ? data.precio : 0,
    stock: typeof data.stock === "number" ? data.stock : 0,
    imagenes: toImagenes(data.imagenes),
    activo: data.activo === true,
  };
}

function toConfigTienda(value: unknown): ConfigTienda {
  const data = esObjetoPlano(value) ? value : {};
  const redes = esObjetoPlano(data.redes) ? data.redes : {};

  return {
    nombre: stringSeguro(data.nombre),
    whatsapp: stringSeguro(data.whatsapp),
    direccion: stringSeguro(data.direccion),
    ciudad: stringSeguro(data.ciudad),
    departamento: stringSeguro(data.departamento),
    pais: stringSeguro(data.pais),
    horario: stringSeguro(data.horario),
    redes: {
      instagram: stringSeguro(redes.instagram),
      facebook: stringSeguro(redes.facebook),
      tiktok: stringSeguro(redes.tiktok),
    },
  };
}

export const listarCategoriasPublic = unstable_cache(
  async (): Promise<Categoria[]> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "categorias-public",
        coleccion: "categorias",
        filtros: ["activa == true", "orderBy orden"],
      },
      () => db.collection("categorias").where("activa", "==", true).orderBy("orden").get(),
    );
    return snap.docs.map(toCategoria);
  },
  ["categorias-public"],
  { tags: ["categorias"] }
);

export const getCategoriaPorSlug = unstable_cache(
  async (slug: string): Promise<Categoria | null> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "categoria-por-slug",
        coleccion: "categorias",
        filtros: ["slug == <slug>", "limit 1"],
      },
      () => db.collection("categorias").where("slug", "==", slug).limit(1).get(),
    );
    return snap.empty ? null : toCategoria(snap.docs[0]);
  },
  ["categoria-por-slug"],
  { tags: ["categorias"] }
);

export const listarProductosCategoria = unstable_cache(
  async (categoriaId: string): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "productos-categoria",
        coleccion: "productos",
        filtros: ["categoriaId == <categoriaId>", "activo == true", "orderBy nombre"],
      },
      () => db.collection("productos").where("categoriaId", "==", categoriaId).where("activo", "==", true).orderBy("nombre").get(),
    );
    return snap.docs.map(toProducto);
  },
  ["productos-categoria"],
  { tags: ["productos"] }
);

export const listarProductosActivos = unstable_cache(
  async (): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "productos-activos",
        coleccion: "productos",
        filtros: ["activo == true"],
      },
      () => db.collection("productos").where("activo", "==", true).get(),
    );
    return snap.docs
      .slice()
      .sort((a, b) => toCreadoEnMillis(b.data().creadoEn) - toCreadoEnMillis(a.data().creadoEn))
      .map(toProducto);
  },
  ["productos-activos"],
  { tags: ["productos"] },
);

export const getProductoPorSlug = unstable_cache(
  async (categoriaSlug: string, productoSlug: string): Promise<Producto | null> => {
    const db = getAdminDb();
    const catSnap = await ejecutarLecturaFirestore(
      {
        nombre: "producto-por-slug-categoria",
        coleccion: "categorias",
        filtros: ["slug == <categoriaSlug>", "limit 1"],
      },
      () => db.collection("categorias").where("slug", "==", categoriaSlug).limit(1).get(),
    );
    if (catSnap.empty) return null;
    const categoriaId = catSnap.docs[0].id;
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "producto-por-slug",
        coleccion: "productos",
        filtros: ["categoriaId == <categoriaId>", "slug == <productoSlug>", "activo == true", "limit 1"],
      },
      () => db.collection("productos").where("categoriaId", "==", categoriaId).where("slug", "==", productoSlug).where("activo", "==", true).limit(1).get(),
    );
    return snap.empty ? null : toProducto(snap.docs[0]);
  },
  ["producto-por-slug"],
  { tags: ["productos"] }
);

export const getProductoPorId = unstable_cache(
  async (slug: string): Promise<Producto | null> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "producto-por-slug-directo",
        coleccion: "productos",
        filtros: ["slug == <slug>", "activo == true", "limit 1"],
      },
      () => db.collection("productos").where("slug", "==", slug).where("activo", "==", true).limit(1).get(),
    );
    return snap.empty ? null : toProducto(snap.docs[0]);
  },
  ["producto-por-id"],
  { tags: ["productos"] }
);

export const getCategoriaPorId = unstable_cache(
  async (id: string): Promise<Categoria | null> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "categoria-por-id",
        coleccion: "categorias",
        filtros: ["documentId == <id>"],
      },
      () => db.doc(`categorias/${id}`).get(),
    );
    return snap.exists ? toCategoria(snap) : null;
  },
  ["categoria-por-id"],
  { tags: ["categorias"] }
);

export const getTodosLosProductos = unstable_cache(
  async (): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "todos-productos",
        coleccion: "productos",
        filtros: ["activo == true", "orderBy nombre"],
      },
      () => db.collection("productos").where("activo", "==", true).orderBy("nombre").get(),
    );
    return snap.docs.map(toProducto);
  },
  ["todos-productos"],
  { tags: ["productos"] }
);

export const listarDestacados = unstable_cache(
  async (): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "destacados",
        coleccion: "productos",
        filtros: ["activo == true", "destacado == true", "orderBy nombre"],
      },
      () => db.collection("productos").where("activo", "==", true).where("destacado", "==", true).orderBy("nombre").get(),
    );
    return snap.docs.map(toProducto);
  },
  ["destacados"],
  { tags: ["productos"] }
);

export const obtenerConfigTiendaServidor = unstable_cache(
  async (): Promise<ConfigTienda> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "configuracion-tienda",
        coleccion: "configuracion",
        filtros: ["documentId == tienda"],
      },
      () => db.doc("configuracion/tienda").get(),
    );
    if (!snap.exists) throw new Error("Falta configuracion/tienda — ejecuta npm run seed:config");
    return toConfigTienda(snap.data());
  },
  ["config-tienda"],
  { tags: ["config"] }
);

export const listarTodosLosProductosActivos = unstable_cache(
  async (): Promise<Array<{ producto: Producto; categoriaSlug: string }>> => {
    const db = getAdminDb();
    const cats = await ejecutarLecturaFirestore(
      {
        nombre: "todos-productos-activos-categorias",
        coleccion: "categorias",
        filtros: ["activa == true"],
      },
      () => db.collection("categorias").where("activa", "==", true).get(),
    );
    const catsMap = new Map(cats.docs.map((d) => [d.id, d.data().slug as string]));
    const prods = await ejecutarLecturaFirestore(
      {
        nombre: "todos-productos-activos",
        coleccion: "productos",
        filtros: ["activo == true", "orderBy nombre"],
      },
      () => db.collection("productos").where("activo", "==", true).orderBy("nombre").get(),
    );
    return prods.docs.map((d) => ({ producto: toProducto(d), categoriaSlug: catsMap.get(d.data().categoriaId) ?? "" }));
  },
  ["todos-productos-activos"],
  { tags: ["productos", "categorias"] }
);

export async function listarTodosLosSlugsProducto(): Promise<Array<{ categoria: string; producto: string }>> {
  const db = getAdminDb();
  const cats = await ejecutarLecturaFirestore(
    {
      nombre: "slugs-categorias",
      coleccion: "categorias",
      filtros: ["activa == true"],
    },
    () => db.collection("categorias").where("activa", "==", true).get(),
  );
  const out: Array<{ categoria: string; producto: string }> = [];
  for (const c of cats.docs) {
    const prods = await ejecutarLecturaFirestore(
      {
        nombre: "slugs-productos-categoria",
        coleccion: "productos",
        filtros: ["categoriaId == <categoriaId>", "activo == true"],
      },
      () => db.collection("productos").where("categoriaId", "==", c.id).where("activo", "==", true).get(),
    );
    for (const p of prods.docs) {
      out.push({ categoria: c.data().slug as string, producto: p.data().slug as string });
    }
  }
  return out;
}

export const obtenerVariantesPorProducto = unstable_cache(
  async (productId: string): Promise<VarianteProducto[]> => {
    const db = getAdminDb();
    const snap = await ejecutarLecturaFirestore(
      {
        nombre: "variantes-por-producto",
        coleccion: "variantes",
        filtros: ["productId == <productId>", "activo == true", "orderBy precio"],
      },
      () => db
        .collection("variantes")
        .where("productId", "==", productId)
        .where("activo", "==", true)
        .orderBy("precio")
        .get(),
    );
    return snap.docs.map(toVariante);
  },
  ["variantes-por-producto"],
  { tags: ["variantes", "productos"] }
);
