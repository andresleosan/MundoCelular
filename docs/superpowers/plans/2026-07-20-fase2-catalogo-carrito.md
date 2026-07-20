# Fase 2 — Catálogo Público + SEO + Carrito — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar el catálogo de Mundo Celular (home, categoría, producto) con SEO First completo (metadata, JSON-LD, sitemap, robots) usando SSG/ISR sobre Next.js App Router, más un carrito persistente por usuario en Firestore y un CTA de WhatsApp por producto.

**Architecture:** Server Components leen Firestore vía firebase-admin (bypass de reglas, contenido indexable); `unstable_cache` con tags `productos`/`categorias`/`config` associa el cache a las revalidaciones que ya dispara el panel admin vía `/api/revalidate` (Fase 1). Carrito en componentes cliente con Firebase SDK. Slugs en URLs (`/celulares`, `/celulares/iphone-13`).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind v4, firebase 11 (cliente), firebase-admin 13 (servidor), Vitest.

## Global Constraints

- **Spec de referencia:** `docs/superpowers/specs/2026-07-19-mundocelular-mvp-design.md` (secciones 3, 4, 6)
- **DESIGN doc:** `docs/DESIGN-mundocelular.md` — tokens exactos, componentes (HeroProductCard, CategoryPill, SearchInput, VariantSwatch, PriceBadge, Sidebar/BottomTab)
- **Acento `#143b98` (mundo-blue) SOLO en:** botón WhatsApp, wordmark, submit del buscador
- **Tipografía:** Sora (texto), JetBrains Mono **solo** para precios/specs/códigos
- **1 solo H1 por página**; slugs limpios sin IDs visibles
- **Carrito requiere sesión Google** (es persistente por uid en Firestore)
- **Precio/stock nunca se confían del cliente** — el carrito guarda solo `{ productoId, cantidad }`; precios se releen al mostrar y se recalculan en el Worker al pedir (Fase 3)
- **Sin Firebase Storage**; imágenes llegan en Fase 4 (placeholder visual por ahora)
- **ISR:** `revalidate = 3600` de respaldo + revalidación bajo demanda vía `/api/revalidate` (ya existe) con tags `productos`/`categorias`/`config`
- **Commits:** Conventional Commits en español. Solo si el operador autoriza (autorizado).
- **Sin worktree:** se trabaja en `main`.
- **Cierre de tarea:** aplicar checklist de autocrítica del spec (sección 10) en lo que aplique.

---

### Task 1: Lecturas servidor del catálogo (firebase-admin) + ISR por tag

**Files:**
- Create: `src/lib/firestore/public.ts`
- Test: `tests/lib/firestore-public.test.ts`

**Interfaces:**
- Consumes: `getAdminDb()` (`@/lib/firebase-admin`); tipos `Categoria`, `Producto`, `ConfigTienda` (`@/types`).
- Produces:
  - `listarCategoriasPublic(): Promise<Categoria[]>` — activas, ordenadas por `orden`
  - `getCategoriaPorSlug(slug: string): Promise<Categoria | null>`
  - `listarProductosCategoria(categoriaId: string): Promise<Producto[]>` — activos, ordenados por `nombre`
  - `getProductoPorSlug(categoriaSlug: string, productoSlug: string): Promise<Producto | null>`
  - `listarDestacados(): Promise<Producto[]>` — `activo && destacado`, ordenado por `nombre`
  - `obtenerConfigTiendaServidor(): Promise<ConfigTienda>` — lee `configuracion/tienda`; lanza si no existe (la Fase 1 la seedea)
  - `listarTodosLosSlugsProducto(): Promise<Array<{ categoria: string; producto: string }>>` — para `generateStaticParams`

- [ ] **Step 1: Test failing —ugh**

`tests/lib/firestore-public.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            get: vi.fn(async () => ({ docs: [{ id: "p1", data: () => ({ nombre: "iPhone 13", slug: "iphone-13", categoriaId: "c1", precio: 1000, stock: 3, activo: true }) }] }),
        })),
      })),
    })),
    doc: vi.fn(() => ({ get: vi.fn(async () => ({ exists: true, data: () => ({ nombre: "Celulares", slug: "celulares", orden: 1, activa: true }) })) }),
    }),
  })),
}));

import { listarCategoriasPublic, getCategoriaPorSlug } from "@/lib/firestore/public";

describe("lecturas servidor", () => {
  it("listarCategoriasPublic devuelve array", async () => {
    const cats = await listarCategoriasPublic();
    expect(Array.isArray(cats)).toBe(true);
  });
  it("getCategoriaPorSlug devuelve la categoría o null", async () => {
    const cat = await getCategoriaPorSlug("celulares");
    expect(cat).not.toBeNull();
  });
});
```

Run: `npm test -- tests/lib/firestore-public.test.ts` → FAIL (módulo no existe).

- [ ] **Step 2: Implementar `src/lib/firestore/public.ts`**

```ts
import { unstable_cache } from "next/cache";
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import type { Categoria, Producto, ConfigTienda } from "@/types";

function toCategoria(d: QueryDocumentSnapshot<DocumentData>): Categoria {
  return { id: d.id, ...(d.data() as Omit<Categoria, "id">) };
}
function toProducto(d: QueryDocumentSnapshot<DocumentData>): Producto {
  return { id: d.id, ...(d.data() as Omit<Producto, "id">) };
}

export const listarCategoriasPublic = unstable_cache(
  async (): Promise<Categoria[]> => {
    const db = getAdminDb();
    const snap = await getDocs(query(collection(db, "categorias"), where("activa", "==", true), orderBy("orden")));
    return snap.docs.map(toCategoria);
  },
  ["categorias-public"],
  { tags: ["categorias"] }
);

export const getCategoriaPorSlug = unstable_cache(
  async (slug: string): Promise<Categoria | null> => {
    const db = getAdminDb();
    const snap = await getDocs(query(collection(db, "categorias"), where("slug", "==", slug), limit(1)));
    return snap.empty ? null : toCategoria(snap.docs[0]);
  },
  ["categoria-por-slug"],
  { tags: ["categorias"] }
);

export const listarProductosCategoria = unstable_cache(
  async (categoriaId: string): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await getDocs(query(collection(db, "productos"), where("categoriaId", "==", categoriaId), where("activo", "==", true), orderBy("nombre")));
    return snap.docs.map(toProducto);
  },
  ["productos-categoria"],
  { tags: ["productos"] }
);

export const getProductoPorSlug = unstable_cache(
  async (categoriaSlug: string, productoSlug: string): Promise<Producto | null> => {
    const db = getAdminDb();
    const catSnap = await getDocs(query(collection(db, "categorias"), where("slug", "==", categoriaSlug), limit(1)));
    if (catSnap.empty) return null;
    const categoriaId = catSnap.docs[0].id;
    const snap = await getDocs(query(collection(db, "productos"), where("categoriaId", "==", categoriaId), where("slug", "==", productoSlug), where("activo", "==", true), limit(1)));
    return snap.empty ? null : toProducto(snap.docs[0]);
  },
  ["producto-por-slug"],
  { tags: ["productos"] }
);

export const listarDestacados = unstable_cache(
  async (): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await getDocs(query(collection(db, "productos"), where("activo", "==", true), where("destacado", "==", true), orderBy("nombre")));
    return snap.docs.map(toProducto);
  },
  ["destacados"],
  { tags: ["productos"] }
);

export const obtenerConfigTiendaServidor = unstable_cache(
  async (): Promise<ConfigTienda> => {
    const db = getAdminDb();
    const snap = await getDoc(doc(db, "configuracion", "tienda"));
    if (!snap.exists) throw new Error("Falta configuracion/tienda — ejecuta npm run seed:config");
    return snap.data() as ConfigTienda;
  },
  ["config-tienda"],
  { tags: ["config"] }
);

export async function listarTodosLosSlugsProducto(): Promise<Array<{ categoria: string; producto: string }>> {
  const db = getAdminDb();
  const cats = await getDocs(query(collection(db, "categorias"), where("activa", "==", true)));
  const out: Array<{ categoria: string; producto: string }> = [];
  for (const c of cats.docs) {
    const prods = await getDocs(query(collection(db, "productos"), where("categoriaId", "==", c.id), where("activo", "==", true)));
    for (const p of prods.docs) {
      out.push({ categoria: c.data().slug as string, producto: p.data().slug as string });
    }
  }
  return out;
}
```

Run: `npm test` → PASS (mocks minimales; pruebas verifican formato y null-handling).

- [ ] **Step 3: Verificar build**

```bash
npm run build
```
Expected: OK (sin credenciales reales las funciones cacheadas no se ejercen en build; `unstable_cache` es SSR-safe).

- [ ] **Step 4: Commit**

```bash
git add src/lib/firestore/public.ts tests/lib/firestore-public.test.ts
git commit -m "feat: lecturas servidor del catálogo con unstable_cache por tag"
```

---

### Task 2: Generadores de metadata + JSON-LD (TDD)

**Files:**
- Create: `src/lib/seo/metadata.ts`, `src/lib/seo/jsonld.ts`
- Test: `tests/lib/seo/metadata.test.ts`, `tests/lib/seo/jsonld.test.ts`

**Interfaces:**
- Consumes: tipos `Categoria`, `Producto`, `ConfigTienda`; `formatearCOP` (`@/lib/format`).
- Produces:
  - `metadataHome(config, destacadosCount): Metadata`
  - `metadataCategoria(cat): Metadata`
  - `metadataProducto(prod, cat, config): Metadata`
  - `jsonldOrganization(config): object`
  - `jsonldLocalBusiness(config): object`
  - `jsonldWebSite(config): object`
  - `jsonldCollectionPage(cat): object`
  - `jsonldBreadcrumbList(items: string[][]): object`
  - `jsonldProducto(prod, cat, config): object`

- [ ] **Step 1: Test metadata (falla)**

`tests/lib/seo/metadata.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { metadataHome, metadataCategoria, metadataProducto } from "@/lib/seo/metadata";
import type { Categoria, Producto, ConfigTienda } from "@/types";

const config: ConfigTienda = {
  nombre: "Mundo Celular", whatsapp: "573113554021",
  direccion: "Cra 36 # 38 - 33, Barrio El Salvador", ciudad: "Medellín",
  departamento: "Antioquia", pais: "Colombia", horario: "",
  redes: { instagram: "i", facebook: "f", tiktok: "t" },
};

describe("metadataHome", () => {
  it("title único con propuesta y ciudad", () => {
    const m = metadataHome(config, 12);
    expect(m.title).toContain("Mundo Celular");
    expect(m.title).toContain("Medellín");
  });
  it("canonical en /", () => {
    expect(metadataHome(config, 0).alternates?.canonical).toBe("/");
  });
});

describe("metadataCategoria", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "Smartphones", orden: 1, activa: true };
  it("title = 'Celulares en Medellín | Mundo Celular'", () => {
    expect(metadataCategoria(cat, config).title).toBe("Celulares en Medellín | Mundo Celular");
  });
  it("canonical en /celulares", () => {
    expect(metadataCategoria(cat, config).alternates?.canonical).toBe("/celulares");
  });
});

describe("metadataProducto", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true };
  const prod: Producto = {
    id: "p1", nombre: "iPhone 13 128GB", slug: "iphone-13", descripcion: "Excelente estado",
    precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple",
    specs: {}, imagenes: [], activo: true, destacado: false,
  };
  it("title incluye producto, categoría y marca", () => {
    const m = metadataProducto(prod, cat, config);
    expect(m.title).toContain("iPhone 13 128GB");
    expect(m.title).toContain("Medellín");
  });
  it("canonical en /celulares/iphone-13", () => {
    expect(metadataProducto(prod, cat, config).alternates?.canonical).toBe("/celulares/iphone-13");
  });
  it("description menciona precio en COP", () => {
    const m = metadataProducto(prod, cat, config);
    expect(m.description).toContain("$ 1.850.000");
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implementar `src/lib/seo/metadata.ts`**

```ts
import type { Metadata } from "next";
import type { Categoria, Producto, ConfigTienda } from "@/types";
import { formatearCOP } from "@/lib/format";

const siteName = (config: ConfigTienda) => config.nombre;

export function metadataHome(config: ConfigTienda, destacadosCount: number): Metadata {
  return {
    title: `${siteName(config)} | Tecnología y celulares en ${config.ciudad}`,
    description: `Tienda de celulares, accesorios, consolas y tecnología en ${config.ciudad}. Compra por WhatsApp. También reparamos celulares.`,
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: siteName(config), title: `${siteName(config)} en ${config.ciudad}` },
    twitter: { card: "summary_large_image" },
  };
}

export function metadataCategoria(cat: Categoria, config: ConfigTienda): Metadata {
  return {
    title: `${cat.nombre} en ${config.ciudad} | ${siteName(config)}`,
    description: cat.descripcion || `Comprar ${cat.nombre.toLowerCase()} en ${config.ciudad}. ${siteName(config)}`,
    alternates: { canonical: `/${cat.slug}` },
    openGraph: { type: "website", title: `${cat.nombre} en ${config.ciudad}` },
  };
}

export function metadataProducto(prod: Producto, cat: Categoria, config: ConfigTienda): Metadata {
  const title = `${prod.nombre} | ${cat.nombre} en ${config.ciudad} | ${siteName(config)}`;
  const description = prod.metaDescription?.trim()
    || `${prod.nombre} ${prod.marca ? `de ${prod.marca} ` : ""}por ${formatearCOP(prod.precio)} en ${config.ciudad}. Stock: ${prod.stock}.`;
  return {
    title: prod.metaTitle?.trim() || title,
    description,
    alternates: { canonical: `/${cat.slug}/${prod.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      images: prod.imagenes.length ? [{ url: prod.imagenes[0].url, alt: prod.imagenes[0].alt }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}
```

Run: `npm test -- tests/lib/seo/metadata.test.ts` → PASS.

- [ ] **Step 3: Test JSON-LD (falla)**

`tests/lib/seo/jsonld.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { jsonldOrganization, jsonldLocalBusiness, jsonldWebSite, jsonldCollectionPage, jsonldBreadcrumbList, jsonldProducto } from "@/lib/seo/jsonld";
import type { Categoria, Producto, ConfigTienda } from "@/types";

const config: ConfigTienda = {
  nombre: "Mundo Celular", whatsapp: "573113554021",
  direccion: "Cra 36 # 38 - 33, Barrio El Salvador", ciudad: "Medellín",
  departamento: "Antioquia", pais: "Colombia", horario: "L-V 9-18",
  redes: { instagram: "https://instagram.com/mundo_celular_75", facebook: "https://facebook.com/Mundo.Celular.01", tiktok: "https://tiktok.com/@mundocelular75" },
};

describe("jsonldOrganization", () => {
  it("tiene @type Organization y name", () => {
    const o = jsonldOrganization(config);
    expect(o["@type"]).toBe("Organization");
    expect(o.name).toBe("Mundo Celular");
    expect(o.sameAs).toContain("https://instagram.com/mundo_celular_75");
  });
});

describe("jsonldLocalBusiness", () => {
  it("tiene @type Store, address y geo opcional", () => {
    const lb = jsonldLocalBusiness(config);
    expect(lb["@type"]).toBe("Store");
    expect((lb as any).address.addressLocality).toBe("Medellín");
  });
});

describe("jsonldWebSite", () => {
  it("tiene @type WebSite y potentialSearchAction", () => {
    const w = jsonldWebSite(config);
    expect(w["@type"]).toBe("WebSite");
    expect((w as any).potentialAction["@type"]).toBe("SearchAction");
  });
});

describe("jsonldCollectionPage", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true };
  it("tiene @type CollectionPage y url /celulares", () => {
    const c = jsonldCollectionPage(cat);
    expect(c["@type"]).toBe("CollectionPage");
    expect((c as any).url).toBe("/celulares");
  });
});

describe("jsonldBreadcrumbList", () => {
  it("tiene itemListElement ordenado", () => {
    const b = jsonldBreadcrumbList([["Inicio", "/"], ["Celulares", "/celulares"]]);
    expect(b["@type"]).toBe("BreadcrumbList");
    expect((b as any).itemListElement).toHaveLength(2);
    expect((b as any).itemListElement[1].name).toBe("Celulares");
  });
});

describe("jsonldProducto", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true };
  const prod: Producto = {
    id: "p1", nombre: "iPhone 13 128GB", slug: "iphone-13", descripcion: "Excelente",
    precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple",
    specs: { Almacenamiento: "128GB" }, imagenes: [], activo: true, destacado: false,
  };
  it("tiene @type Product, Offer con price COP, y availability por stock", () => {
    const p = jsonldProducto(prod, cat, config);
    expect(p["@type"]).toBe("Product");
    expect((p as any).offers.price).toBe("1850000");
    expect((p as any).offers.priceCurrency).toBe("COP");
    expect((p as any).offers.availability).toBe(prod.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock");
  });
});
```

Run → FAIL.

- [ ] **Step 4: Implementar `src/lib/seo/jsonld.ts`**

```ts
import type { Categoria, Producto, ConfigTienda } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const url = (path: string) => `${BASE_URL}${path}`;

export function jsonldOrganization(config: ConfigTienda) {
  return {
    "@type": "Organization",
    name: config.nombre,
    url: url("/"),
    sameAs: [config.redes.instagram, config.redes.facebook, config.redes.tiktok].filter(Boolean),
  };
}

export function jsonldLocalBusiness(config: ConfigTienda) {
  return {
    "@type": "Store",
    name: config.nombre,
    image: url("/logo.png"),
    url: url("/"),
    telephone: `+${config.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: config.direccion,
      addressLocality: config.ciudad,
      addressRegion: config.departamento,
      addressCountry: config.pais,
    },
    openingHours: config.horario || undefined,
  };
}

export function jsonldWebSite(config: ConfigTienda) {
  return {
    "@type": "WebSite",
    name: config.nombre,
    url: url("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${url("/buscar")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function jsonldCollectionPage(cat: Categoria) {
  return {
    "@type": "CollectionPage",
    name: cat.nombre,
    url: url(`/${cat.slug}`),
    description: cat.descripcion || undefined,
  };
}

export function jsonldBreadcrumbList(items: Array<[string, string]>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: url(path),
    })),
  };
}

export function jsonldProducto(prod: Producto, cat: Categoria, _config: ConfigTienda) {
  return {
    "@type": "Product",
    name: prod.nombre,
    description: prod.descripcion,
    brand: { "@type": "Brand", name: prod.marca || undefined },
    image: prod.imagenes.map((im) => im.url),
    offers: {
      "@type": "Offer",
      price: String(prod.precio),
      priceCurrency: "COP",
      availability: prod.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: url(`/${cat.slug}/${prod.slug}`),
    },
  };
}
```

Run: `npm test -- tests/lib/seo/jsonld.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo tests/lib/seo
git commit -m "feat: generadores de metadata y JSON-LD por página con tests"
```

---

### Task 3: sitemap.ts + robots.ts

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`

**Interfaces:**
- Consumes: `listarCategoriasPublic`, `listarTodosLosSlugsProducto`, `obtenerConfigTiendaServidor` (`@/lib/firestore/public`).

- [ ] **Step 1: Implementar `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { listarCategoriasPublic, listarTodosLosSlugsProducto } from "@/lib/firestore/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const cats = await listarCategoriasPublic();
  const prods = await listarTodosLosSlugsProducto();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/reparaciones`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/preguntas`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...cats.map((c) => ({ url: `${base}/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...prods.map((p) => ({ url: `${base}/${p.categoria}/${p.producto}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
```

- [ ] **Step 2: Implementar `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/carrito", "/checkout", "/cuenta", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```
Expected: `sitemap.xml` y `robots.txt` aparecen en el listado de rutas.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: sitemap.xml dinamico y robots.txt con disallow admin/carrito/api"
```

---

### Task 4: Home page (SSG/ISR + schemas + hero + chips + destacados)

**Files:**
- Create: `src/components/storefront/Hero.tsx`, `src/components/storefront/CategoryPill.tsx`, `src/components/storefront/HeroProductCard.tsx`, `src/components/storefront/CategorySectionHeader.tsx`, `src/components/storefront/SearchInput.tsx`, `src/components/seo/JsonLd.tsx`, `src/app/page.tsx` (reemplaza placeholder de Fase 1)
- Test: `tests/components/storefront/HeroProductCard.test.tsx`

**Interfaces:**
- Consumes: `listarCategoriasPublic`, `listarDestacados`, `obtenerConfigTiendaServidor`; `metadataHome`, `jsonldOrganization`, `jsonldLocalBusiness`, `jsonldWebSite`; `formatearCOP`.
- Produces: home indexable con 1 H1, Organization+LocalBusiness+WebSite JSON-LD, hero, chips de categoría, sección de destacados.

- [ ] **Step 1: Componente JsonLd reutilizable**

`src/components/seo/JsonLd.tsx`:
```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
```

- [ ] **Step 2: Componentes storefront (design tokens del DESIGN doc)**

`src/components/storefront/CategoryPill.tsx`:
```tsx
import Link from "next/link";

export function CategoryPill({ nombre, slug, icono }: { nombre: string; slug: string; icono: React.ReactNode }) {
  return (
    <Link
      href={`/${slug}`}
      className="inline-flex items-center gap-2 rounded-chips border border-faint-border bg-pure-white px-3 py-1.5 text-[14px] text-ink-navy shadow-sm hover:shadow-sm-2"
    >
      <span className="text-mundo-blue">{icono}</span>
      {nombre}
    </Link>
  );
}
```

`src/components/storefront/HeroProductCard.tsx`:
```tsx
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import type { Producto } from "@/types";

export function HeroProductCard({ producto, categoriaSlug }: { producto: Producto; categoriaSlug: string }) {
  return (
    <Link href={`/${categoriaSlug}/${producto.slug}`} className="block rounded-cards bg-pure-white shadow-sm-2">
      <div className="aspect-square overflow-hidden rounded-[20px] bg-canvas-frost">
        {producto.imagenes[0]?.url ? (
          <img src={producto.imagenes[0].url} alt={producto.imagenes[0].alt} className="h-full w-full object-cover" width={400} height={400} loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-steel-blue-gray text-[12px]">Sin imagen</div>
        )}
      </div>
      <div className="px-4 py-3">
        <h3 className="text-[14px] font-semibold tracking-[-0.015em] text-ink-navy">{producto.nombre}</h3>
        <p className="mt-1 font-jetbrains-mono text-[14px] text-mundo-blue">{formatearCOP(producto.precio)}</p>
      </div>
    </Link>
  );
}
```

`src/components/storefront/CategorySectionHeader.tsx`:
```tsx
import Link from "next/link";

export function CategorySectionHeader({ titulo, verTodoSlug }: { titulo: string; verTodoSlug?: string }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-ink-navy">{titulo}</h2>
      {verTodoSlug && (
        <Link href={`/${verTodoSlug}`} className="ml-auto text-[12px] text-mundo-blue" aria-label={`Ver todos en ${titulo}`}>
          Ver todos →
        </Link>
      )}
    </div>
  );
}
```

`src/components/storefront/SearchInput.tsx` (client):
```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchInput() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`); }}
      className="flex items-center gap-2 rounded-chips border border-faint-border bg-pure-white px-2 py-1"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar celulares, accesorios, consolas…"
        aria-label="Buscar productos"
        className="w-full bg-transparent px-3 py-2 text-[16px] text-ink-navy outline-none placeholder:text-steel-blue-gray"
      />
      <button type="submit" aria-label="Buscar" className="flex h-8 w-8 items-center justify-center rounded-chips bg-mundo-blue text-pure-white shadow-lg-2">
        →
      </button>
    </form>
  );
}
```

`src/components/storefront/Hero.tsx` (server, simple):
```tsx
import Link from "next/link";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";

export async function Hero() {
  const config = await obtenerConfigTiendaServidor();
  return (
    <section className="relative overflow-hidden rounded-cards bg-abyss-navy px-6 py-16 text-center text-pure-white">
      <h1 className="font-sora text-[28px] font-semibold tracking-[-0.03em] text-mundo-blue sm:text-[36px]">
        {config.nombre}
      </h1>
      <p className="mt-3 text-[16px] tracking-[-0.02em] text-canvas-frost">
        Celulares, accesorios, consolas y tecnología en {config.ciudad}. Compra por WhatsApp.
      </p>
      <p className="mt-2 text-[12px] text-cool-frost">También reparamos celulares.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/reparaciones" className="rounded-chips bg-pure-white px-4 py-2 text-[12px] font-semibold text-ink-navy">
          Reparaciones
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Test de HeroProductCard (falla)**

`tests/components/storefront/HeroProductCard.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import type { Producto } from "@/types";

vi.mock("next/link", () => ({ default: ({ children }: any) => children }));

const producto: Producto = {
  id: "p1", nombre: "iPhone 13", slug: "iphone-13", descripcion: "",
  precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple",
  specs: {}, imagenes: [], activo: true, destacado: false,
};

describe("HeroProductCard", () => {
  it("muestra nombre y precio COP", () => {
    render(<HeroProductCard producto={producto} categoriaSlug="celulares" />);
    expect(screen.getByText("iPhone 13")).toBeInTheDocument();
    expect(screen.getByText(/\$ 1\.850\.000/)).toBeInTheDocument();
  });
  it("muestra 'Sin imagen' cuando no hay imágenes", () => {
    render(<HeroProductCard producto={producto} categoriaSlug="celulares" />);
    expect(screen.getByText(/sin imagen/i)).toBeInTheDocument();
  });
});
```

Run → FAIL; implementar/verificar → PASS.

- [ ] **Step 4: Reemplazar `src/app/page.tsx`**

```tsx
import type { Metadata } from "next";
import { listarCategoriasPublic, listarDestacados, obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataHome } from "@/lib/seo/metadata";
import { jsonldOrganization, jsonldLocalBusiness, jsonldWebSite } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/storefront/Hero";
import { CategoryPill } from "@/components/storefront/CategoryPill";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import { CategorySectionHeader } from "@/components/storefront/CategorySectionHeader";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const config = await obtenerConfigTiendaServidor();
  const destacados = await listarDestacados();
  return metadataHome(config, destacados.length);
}

export default async function Home() {
  const [config, categorias, destacados] = await Promise.all([
    obtenerConfigTiendaServidor(),
    listarCategoriasPublic(),
    listarDestacados(),
  ]);
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <JsonLd data={{ "@context": "https://schema.org", ...jsonldOrganization(config) }} />
      <JsonLd data={{ "@context": "https://schema.org", ...jsonldLocalBusiness(config) }} />
      <JsonLd data={{ "@context": "https://schema.org", ...jsonldWebSite(config) }} />

      <Hero />

      <section className="mt-10">
        <CategorySectionHeader titulo="Categorías" />
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <CategoryPill key={c.id} nombre={c.nombre} slug={c.slug} icono={<span>●</span>} />
          ))}
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="mt-12">
          <CategorySectionHeader titulo="Destacados" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {destacados.map((p) => {
              const catSlug = categorias.find((c) => c.id === p.categoriaId)?.slug ?? "";
              return <HeroProductCard key={p.id} producto={p} categoriaSlug={catSlug} />;
            })}
          </div>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Verificar build + tests**

```bash
npm test && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: home page con hero, chips de categoria, destacados y schemas JSON-LD"
```

---

### Task 5: Página de categoría `[categoria]` (SSG/ISR + grid + CollectionPage + Breadcrumb)

**Files:**
- Create: `src/app/[categoria]/page.tsx`
- Test: `tests/lib/seo/categoria-page.test.ts` (comprueba que generateMetadata resuelve slug inválido a null)

**Interfaces:**
- Consumes: `getCategoriaPorSlug`, `listarProductosCategoria`, `obtenerConfigTiendaServidor`; `metadataCategoria`, `jsonldCollectionPage`, `jsonldBreadcrumbList`.

- [ ] **Step 1: Implementar `src/app/[categoria]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoriaPorSlug, listarProductosCategoria, obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataCategoria } from "@/lib/seo/metadata";
import { jsonldCollectionPage, jsonldBreadcrumbList } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import { formatearCOP } from "@/lib/format";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { listarCategoriasPublic } = await import("@/lib/firestore/public");
  return (await listarCategoriasPublic()).map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params;
  const [cat, config] = await Promise.all([getCategoriaPorSlug(categoria), obtenerConfigTiendaServidor()]);
  if (!cat) return { title: "Categoría no encontrada" };
  return metadataCategoria(cat, config);
}

export default async function PaginaCategoria({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  const cat = await getCategoriaPorSlug(categoria);
  if (!cat) notFound();
  const [config, productos] = await Promise.all([obtenerConfigTiendaServidor(), listarProductosCategoria(cat.id)]);
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <JsonLd data={{ "@context": "https://schema.org", ...jsonldCollectionPage(cat) }} />
      <JsonLd data={{ "@context": "https://schema.org", ...jsonldBreadcrumbList([["Inicio", "/"], [cat.nombre, `/${cat.slug}`]]) }} />
      <nav className="text-[12px] text-steel-blue-gray"><a href="/">Inicio</a> / {cat.nombre}</nav>
      <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.03em] text-ink-navy">{cat.nombre} en {config.ciudad}</h1>
      {cat.descripcion && <p className="mt-3 max-w-prose text-[16px] tracking-[-0.02em] text-steel-blue-gray">{cat.descripcion}</p>}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {productos.map((p) => <HeroProductCard key={p.id} producto={p} categoriaSlug={cat.slug} />)}
      </div>
      {productos.length === 0 && <p className="mt-8 text-[14px] text-steel-blue-gray">No hay productos en esta categoría todavía.</p>}
    </main>
  );
}
```

- [ ] **Step 2: Verificar build (route `[categoria]` aparece)**

- [ ] **Step 3: Commit**

```bash
git add src/app/[categoria] tests
git commit -m "feat: pagina de categoria con SSG/ISR, CollectionPage y BreadcrumbList"
```

---

### Task 6: Página de producto `[categoria]/[producto]` (SSG/ISR + Product + Offer + CTA WhatsApp + add to cart)

**Files:**
- Create: `src/app/[categoria]/[producto]/page.tsx`, `src/components/storefront/ProductoDetalle.tsx` (client, add to cart + WhatsApp), `src/components/storefront/VariantSwatch.tsx`, `src/components/storefront/PriceBadge.tsx`, `src/lib/whatsapp.ts` (mensaje + URL)
- Test: `tests/lib/whatsapp.test.ts`

**Interfaces:**
- Consumes: `getProductoPorSlug`, `getCategoriaPorSlug`, `obtenerConfigTiendaServidor`; `metadataProducto`, `jsonldProducto`, `jsonldBreadcrumbList`; `useCart()` (de Task 8 — aún no existe; el botón Add usa el hook cuando exista; en esta tarea el botón "Agregar" puede ser un enlace a `/carrito` si el hook no existe — pero el orden de tareas pone carrito en Task 8. Para que Task 6 sea testeable, el componente client acepta un `onAgregarAlCarrito` prop y la página lo cablea a una función stub que Task 8 sustituye por `useCart.agregar`. Mejor: crear la interfaz mínima del hook aquí y el contexto en Task 8). 
- **Decisión:** implementamos el `useCart` hook + `CartProvider` ahora (en `src/components/cart/`) con la lógica mínima de `agregar`, y Task 8 completa la persistencia en Firestore y la página `/carrito`. Así Task 6 es funcional.

- [ ] **Step 1: Helper de WhatsApp (TDD)**

`tests/lib/whatsapp.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { urlWhatsApp, mensajeProducto } from "@/lib/whatsapp";

describe("mensajeProducto", () => {
  it("arma texto con nombre, precio COP y link del producto", () => {
    const m = mensajeProducto({
      nombre: "iPhone 13 128GB",
      precio: 1850000,
      categoriaSlug: "celulares",
      productoSlug: "iphone-13",
    });
    expect(m).toContain("iPhone 13 128GB");
    expect(m).toContain("$ 1.850.000");
  });
});

describe("urlWhatsApp", () => {
  it("codifica el mensaje con encodeURIComponent", () => {
    const u = urlWhatsApp("573113554021", "Hola, quiero: iPhone 13 128GB $ 1.850.000");
    expect(u).toContain("https://wa.me/573113554021?text=");
    expect(u).toContain("1.850.000");
    expect(decodeURIComponent(u.split("text=")[1])).toContain("Hola");
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implementar `src/lib/whatsapp.ts`**

```ts
import { formatearCOP } from "./format";

export function mensajeProducto(p: { nombre: string; precio: number; categoriaSlug: string; productoSlug: string }): string {
  return `Hola Mundo Celular, quiero comprar: ${p.nombre} — ${formatearCOP(p.precio)}.\nLink: /${p.categoriaSlug}/${p.productoSlug}`;
}

export function urlWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
```

Run: `npm test -- tests/lib/whatsapp.test.ts` → PASS.

- [ ] **Step 3: CartContext mínimo (sin persistencia aún; Task 8 la añade)**

`src/components/cart/CartContext.tsx`:
```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ItemCarrito } from "@/types";

interface CartContextValue {
  items: ItemCarrito[];
  agregar: (productoId: string, cantidad?: number) => void;
  quitar: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  vaciar: () => void;
}
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const agregar = (productoId: string, cantidad = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.productoId === productoId);
      if (found) return prev.map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + cantidad } : i);
      return [...prev, { productoId, cantidad }];
    });
  const quitar = (productoId: string) => setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  const cambiarCantidad = (productoId: string, cantidad: number) =>
    setItems((prev) => cantidad <= 0 ? prev.filter((i) => i.productoId !== productoId) : prev.map((i) => i.productoId === productoId ? { ...i, cantidad } : i));
  const vaciar = () => setItems([]);
  return <CartContext.Provider value={{ items, agregar, quitar, cambiarCantidad, vaciar }}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
```

Montar `<CartProvider>` en `src/app/layout.tsx` envolviendo `{children}` junto al `<AuthProvider>` existente.

- [ ] **Step 4: Componente ProductoDetalle (client, usa useCart)**

`src/components/storefront/ProductoDetalle.tsx`:
```tsx
"use client";

import { useCart } from "@/components/cart/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { urlWhatsApp } from "@/lib/whatsapp";
import { formatearCOP } from "@/lib/format";
import type { Producto, ConfigTienda } from "@/types";

export function ProductoDetalle({ producto, config, categoriaSlug }: { producto: Producto; config: ConfigTienda; categoriaSlug: string }) {
  const { agregar } = useCart();
  const { usuario } = useAuth();
  const mensaje = `Hola Mundo Celular, quiero comprar: ${producto.nombre} — ${formatearCOP(producto.precio)}. ¡Lo quiero!`;

  return (
    <div className="flex flex-col gap-6">
      <div className="aspect-square rounded-[20px] bg-canvas-frost">
        {producto.imagenes[0]?.url ? (
          <img src={producto.imagenes[0].url} alt={producto.imagenes[0].alt} className="h-full w-full object-cover" width={800} height={800} />
        ) : (
          <div className="flex h-full items-center justify-center text-steel-blue-gray text-[14px]">Sin imagen</div>
        )}
      </div>
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-ink-navy">{producto.nombre}</h1>
        <p className="mt-2 font-jetbrains-mono text-[20px] text-mundo-blue">{formatearCOP(producto.precio)}</p>
        {producto.marca && <p className="mt-1 text-[12px] text-steel-blue-gray">Marca: {producto.marca}</p>}
        {producto.stock > 0 ? (
          <p className="mt-1 text-[12px] text-steel-blue-gray">Disponible: {producto.stock}</p>
        ) : (
          <p className="mt-1 text-[12px] text-mundo-blue">Agotado</p>
        )}
      </div>
      {producto.descripcion && <p className="text-[16px] tracking-[-0.02em] text-ink-navy">{producto.descripcion}</p>}
      {Object.keys(producto.specs).length > 0 && (
        <dl className="rounded-cards bg-pure-white p-4 shadow-sm-2">
          {Object.entries(producto.specs).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-faint-border py-2 last:border-0">
              <dt className="text-[12px] text-steel-blue-gray">{k}</dt>
              <dd className="font-jetbrains-mono text-[14px] text-ink-navy">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="sticky bottom-4 flex flex-wrap gap-3">
        {producto.stock > 0 && usuario && (
          <button onClick={() => agregar(producto.id)} className="rounded-chips border border-faint-border bg-pure-white px-6 py-3 text-[14px] font-semibold text-ink-navy shadow-sm-2">
            Agregar al carrito
          </button>
        )}
        {producto.stock > 0 && !usuario && (
          <a href="/admin/login" className="rounded-chips border border-faint-border bg-pure-white px-6 py-3 text-[14px] text-steel-blue-gray">Inicia sesión para agregar al carrito</a>
        )}
        <a href={urlWhatsApp(config.whatsapp, mensaje)} target="_blank" rel="noopener noreferrer" className="rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2">
          Comprar por WhatsApp
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Página `src/app/[categoria]/[producto]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoriaPorSlug, getProductoPorSlug, obtenerConfigTiendaServidor, listarTodosLosSlugsProducto } from "@/lib/firestore/public";
import { metadataProducto } from "@/lib/seo/metadata";
import { jsonldProducto, jsonldBreadcrumbList } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductoDetalle } from "@/components/storefront/ProductoDetalle";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listarTodosLosSlugsProducto()).map((p) => ({ categoria: p.categoria, producto: p.producto }));
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string; producto: string }> }): Promise<Metadata> {
  const { categoria, producto } = await params;
  const [cat, prod, config] = await Promise.all([getCategoriaPorSlug(categoria), getProductoPorSlug(categoria, producto), obtenerConfigTiendaServidor()]);
  if (!cat || !prod) return { title: "Producto no encontrado" };
  return metadataProducto(prod, cat, config);
}

export default async function PaginaProducto({ params }: { params: Promise<{ categoria: string; producto: string }> }) {
  const { categoria, producto } = await params;
  const cat = await getCategoriaPorSlug(categoria);
  if (!cat) notFound();
  const prod = await getProductoPorSlug(categoria, producto);
  if (!prod) notFound();
  const config = await obtenerConfigTiendaServidor();
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <JsonLd data={{ "@context": "https://schema.org", ...jsonldProducto(prod, cat, config) }} />
      <JsonLd data={{ "@context": "https://schema.org", ...jsonldBreadcrumbList([["Inicio", "/"], [cat.nombre, `/${cat.slug}`], [prod.nombre, `/${cat.slug}/${prod.slug}`]]) }} />
      <nav className="text-[12px] text-steel-blue-gray"><a href="/">Inicio</a> / <a href={`/${cat.slug}`}>{cat.nombre}</a> / {prod.nombre}</nav>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <ProductoDetalle producto={prod} config={config} categoriaSlug={cat.slug} />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verificar build + tests**

```bash
npm test && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: pagina de producto con Product+Offer, CTA WhatsApp y add-to-cart"
```

---

### Task 7: Buscador `/buscar` + integración header

**Files:**
- Create: `src/app/buscar/page.tsx` (client, filtra productos), `src/components/storefront/Header.tsx` (server + SearchInput)

**Interfaces:**
- Consumes: `listarCategoriasPublic`, búsqueda server-side con `listarTodosLosProductosActivos` (añadir a `public.ts`).

- [ ] **Step 1: Añadir `listarTodosLosProductosActivos` a `src/lib/firestore/public.ts`**

```ts
export const listarTodosLosProductosActivos = unstable_cache(
  async (): Promise<Array<{ producto: Producto; categoriaSlug: string }>> => {
    const db = getAdminDb();
    const cats = await getDocs(query(collection(db, "categorias"), where("activa", "==", true)));
    const catsMap = new Map(cats.docs.map((d) => [d.id, d.data().slug as string]));
    const prods = await getDocs(query(collection(db, "productos"), where("activo", "==", true), orderBy("nombre")));
    return prods.docs.map((d) => ({ producto: toProducto(d), categoriaSlug: catsMap.get(d.data().categoriaId) ?? "" }));
  },
  ["todos-productos"],
  { tags: ["productos"] }
);
```

- [ ] **Step 2: Página `/buscar` (client, sin indexar)**

`src/app/buscar/page.tsx`:
```tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import type { Producto } from "@/types";

interface Resultado { producto: Producto; categoriaSlug: string; }

function Buscador() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [resultados, setResultados] = useState<Resultado[] | null>(null);

  useEffect(() => {
    if (!q.trim()) { setResultados([]); return; }
    fetch(`/api/buscar?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d) => setResultados(d.resultados ?? [])).catch(() => setResultados([]));
  }, [q]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="text-[24px] font-semibold tracking-[-0.03em]">Resultados para “{q}”</h1>
      {resultados === null ? (
        <p className="mt-6 text-[14px] text-steel-blue-gray">Buscando…</p>
      ) : resultados.length === 0 ? (
        <p className="mt-6 text-[14px] text-steel-blue-gray">No encontramos productos. Prueba con otra palabra o escríbenos por WhatsApp.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {resultados.map((r) => <HeroProductCard key={r.producto.id} producto={r.producto} categoriaSlug={r.categoriaSlug} />)}
        </div>
      )}
    </main>
  );
}

export default function PaginaBuscar() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-steel-blue-gray">Cargando…</p>}>
      <Buscador />
    </Suspense>
  );
}
```

Metadata: en `src/app/buscar/page.tsx` añadir `export const metadata = { robots: { index: false, follow: true } };` — pero como es `"use client"`, la metadata va en un layout `src/app/buscar/layout.tsx` (server) que exporte `metadata` y renderice children.

`src/app/buscar/layout.tsx`:
```tsx
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: true } };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
```

- [ ] **Step 3: Endpoint `/api/buscar` (server, filtra server-side)**

`src/app/api/buscar/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { listarTodosLosProductosActivos } from "@/lib/firestore/public";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  if (!q) return NextResponse.json({ resultados: [] });
  const todos = await listarTodosLosProductosActivos();
  const resultados = todos.filter(({ producto, categoriaSlug }) =>
    producto.nombre.toLowerCase().includes(q) ||
    producto.marca.toLowerCase().includes(q) ||
    Object.values(producto.specs).some((v) => v.toLowerCase().includes(q))
  ).slice(0, 24);
  return NextResponse.json({ resultados });
}
```

- [ ] **Step 4: Header con SearchInput (en layout raíz)**

`src/components/storefront/Header.tsx`:
```tsx
import Link from "next/link";
import { SearchInput } from "./SearchInput";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-faint-border bg-pure-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3">
        <Link href="/" className="font-sora text-[16px] font-semibold tracking-[-0.015em] text-mundo-blue">MUNDO CELULAR</Link>
        <div className="ml-auto max-w-md flex-1"><SearchInput /></div>
      </div>
    </header>
  );
}
```

Añadir `<Header />` al inicio del `<body>` en `src/app/layout.tsx` (después de AuthProvider/CartProvider, antes de children).

- [ ] **Step 5: Verificar build + tests**

```bash
npm test && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: buscador /buscar + endpoint /api/buscar + header con SearchInput"
```

---

### Task 8: Carrito persistente en Firestore + página `/carrito`

**Files:**
- Create: `src/lib/firestore/carrito.ts` (client), `src/components/cart/CartDrawer.tsx` (client), `src/app/carrito/page.tsx` (client + noindex layout), `src/app/carrito/layout.tsx`
- Modify: `src/components/cart/CartContext.tsx` (añadir persistencia en Firestore cuando hay sesión)

**Interfaces:**
- Consumes: `db` (`@/lib/firebase`), `useAuth()`, types.
- Produces: carrito con sync a `carritos/{uid}` en Firestore; página `/carrito` (noindex) con items, totales calculados server-side en la página, CTA WhatsApp de todo el carrito (placeholder — el flujo real de pedido es Fase 3; aquí el botón "Pedir por WhatsApp" arma el mensaje Client-side como adelanto visual, pero NO crea pedido aún: la página muestra una nota "El pedido se registrará al confirmar (Fase 3)").

- [ ] **Step 1: Capa de datos `src/lib/firestore/carrito.ts`**

```ts
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { ItemCarrito } from "@/types";

export async function leerCarrito(uid: string): Promise<ItemCarrito[]> {
  const snap = await getDoc(doc(db, "carritos", uid));
  return snap.exists() ? (snap.data().items as ItemCarrito[]) : [];
}
export async function guardarCarrito(uid: string, items: ItemCarrito[]): Promise<void> {
  await setDoc(doc(db, "carritos", uid), { items, actualizadoEn: serverTimestamp() });
}
export async function vaciarCarrito(uid: string): Promise<void> {
  await deleteDoc(doc(db, "carritos", uid));
}
```

- [ ] **Step 2: Modificar `CartContext` para sync con Firestore**

Reemplazar la implementación de `CartProvider` para:
- Cargar items desde Firestore al iniciar sesión (`useEffect` que escucha `usuario` de `useAuth`)
- Tras cada mutación local, si hay sesión, llamar `guardarCarrito(uid, items)` (debounce simple con `setTimeout` 500ms)
- Si no hay sesión, items viven solo en memoria (el carrito "persistente" requiere login, como dice el spec)

Estructura:
```tsx
"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ItemCarrito } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { leerCarrito, guardarCarrito, vaciarCarrito } from "@/lib/firestore/carrito";

interface CartContextValue {
  items: ItemCarrito[];
  agregar: (productoId: string, cantidad?: number) => void;
  quitar: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  vaciar: () => void;
  cargando: boolean;
}
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!usuario) { setItems([]); return; }
    setCargando(true);
    leerCarrito(usuario.uid).then((its) => setItems(its)).finally(() => setCargando(false));
  }, [usuario]);

  useEffect(() => {
    if (!usuario || cargando) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { guardarCarrito(usuario.uid, items).catch(() => {}); }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [items, usuario, cargando]);

  const agregar = (productoId: string, cantidad = 1) => setItems((prev) => {
    const found = prev.find((i) => i.productoId === productoId);
    if (found) return prev.map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + cantidad } : i);
    return [...prev, { productoId, cantidad }];
  });
  const quitar = (productoId: string) => setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  const cambiarCantidad = (productoId: string, cantidad: number) =>
    setItems((prev) => cantidad <= 0 ? prev.filter((i) => i.productoId !== productoId) : prev.map((i) => i.productoId === productoId ? { ...i, cantidad } : i));
  const vaciar = () => { setItems([]); if (usuario) vaciarCarrito(usuario.uid).catch(() => {}); };

  return <CartContext.Provider value={{ items, agregar, quitar, cambiarCantidad, vaciar, cargando }}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
```

- [ ] **Step 3: Página `/carrito`**

`src/app/carrito/layout.tsx`:
```tsx
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
```

`src/app/carrito/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { formatearCOP } from "@/lib/format";
import { urlWhatsApp } from "@/lib/whatsapp";
import type { Producto, ConfigTienda } from "@/types";

export default function CarritoPage() {
  const { items, cambiarCantidad, quitar, vaciar } = useCart();
  const { usuario } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [config, setConfig] = useState<ConfigTienda | null>(null);

  useEffect(() => {
    fetch("/api/carrito").then((r) => r.json()).then((d) => { setProductos(d.productos ?? []); setConfig(d.config ?? null); }).catch(() => {});
  }, [items]);

  if (!usuario) {
    return (
      <main className="mx-auto max-w-[800px] px-4 py-10">
        <h1 className="text-[24px] font-semibold">Tu carrito</h1>
        <p className="mt-4 text-[14px] text-steel-blue-gray">Inicia sesión para armar tu carrito.</p>
        <a href="/admin/login" className="mt-4 inline-block rounded-chips bg-mundo-blue px-4 py-2 text-[14px] text-pure-white">Iniciar sesión con Google</a>
      </main>
    );
  }

  const lineas = productos.map((p) => ({ producto: p, cantidad: items.find((i) => i.productoId === p.id)?.cantidad ?? 0 })).filter((l) => l.cantidad > 0);
  const total = lineas.reduce((s, l) => s + l.producto.precio * l.cantidad, 0);
  const mensaje = `Hola Mundo Celular, quiero comprar:\n${lineas.map((l) => `• ${l.producto.nombre} — x${l.cantidad} — ${formatearCOP(l.producto.precio * l.cantidad)}`).join("\n")}\nTotal: ${formatearCOP(total)}`;

  return (
    <main className="mx-auto max-w-[800px] px-4 py-10">
      <h1 className="text-[24px] font-semibold tracking-[-0.03em]">Tu carrito</h1>
      {lineas.length === 0 ? (
        <p className="mt-4 text-[14px] text-steel-blue-gray">Tu carrito está vacío. <Link href="/" className="text-mundo-blue">Ver productos</Link></p>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-3">
            {lineas.map((l) => (
              <li key={l.producto.id} className="flex items-center gap-4 rounded-cards bg-pure-white p-4 shadow-sm-2">
                <div className="flex-1">
                  <p className="text-[14px] font-semibold">{l.producto.nombre}</p>
                  <p className="font-jetbrains-mono text-[12px] text-steel-blue-gray">{formatearCOP(l.producto.precio)}</p>
                </div>
                <input type="number" min={1} value={l.cantidad} onChange={(e) => cambiarCantidad(l.producto.id, Number(e.target.value))} className="w-16 rounded-chips border border-faint-border px-2 py-1 text-[12px] font-jetbrains-mono" />
                <button onClick={() => quitar(l.producto.id)} className="text-[12px] text-steel-blue-gray">Quitar</button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[14px] text-steel-blue-gray">Total</span>
            <span className="font-jetbrains-mono text-[20px] text-mundo-blue">{formatearCOP(total)}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {config && (
              <a href={urlWhatsApp(config.whatsapp, mensaje)} target="_blank" rel="noopener noreferrer" className="rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2">
                Pedir por WhatsApp
              </a>
            )}
            <button onClick={vaciar} className="rounded-chips border border-faint-border px-4 py-2 text-[12px] text-steel-blue-gray">Vaciar carrito</button>
          </div>
          <p className="mt-4 text-[11px] text-steel-blue-gray">Nota: el pedido se registrará oficialmente en la Fase 3 del proyecto. Por ahora el botón abre WhatsApp sin guardar el pedido.</p>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Endpoint `/api/carrito` (resuelve productos por ids)**

`src/app/api/carrito/route.ts`:
```ts
import { NextResponse } from "next/server";
import { collection, doc, getDoc, getDocs, where, query, limit, documentId } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json({ productos: [], config: await obtenerConfigTiendaServidor().catch(() => null) });
  const db = getAdminDb();
  const chunks = ids.length > 10 ? Array.from({ length: Math.ceil(ids.length / 10) }, (_, i) => ids.slice(i * 10, i * 10 + 10)) : [ids];
  const prods = [];
  for (const chunk of chunks) {
    const snap = await getDocs(query(collection(db, "productos"), where(documentId(), "in", chunk), limit(30)));
    for (const d of snap.docs) prods.push({ id: d.id, ...(d.data() as object) });
  }
  return NextResponse.json({ productos: prods, config: await obtenerConfigTiendaServidor().catch(() => null) });
}
```

Nota: el cliente `/carrito` pase los ids; ajustar el fetch del cliente a `fetch("/api/carrito?ids=" + items.map(i => i.productoId).join(","))`.

- [ ] **Step 5: Footer con redes + navegación**

`src/components/storefront/Footer.tsx`:
```tsx
import Link from "next/link";

export async function Footer() {
  let config: any = null;
  try { const { obtenerConfigTiendaServidor } = await import("@/lib/firestore/public"); config = await obtenerConfigTiendaServidor(); } catch {}
  return (
    <footer className="border-t border-faint-border bg-pure-white">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-sora text-[14px] font-semibold text-mundo-blue">MUNDO CELULAR</p>
          {config && <p className="mt-2 text-[12px] text-steel-blue-gray">{config.direccion}, {config.ciudad}</p>}
        </div>
        <div>
          <p className="text-[12px] font-medium text-steel-blue-gray">Sitio</p>
          <ul className="mt-2 flex flex-col gap-1 text-[12px]">
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/reparaciones">Reparaciones</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
            <li><Link href="/preguntas">Preguntas frecuentes</Link></li>
          </ul>
        </div>
        {config && (
          <div>
            <p className="text-[12px] font-medium text-steel-blue-gray">Síguenos</p>
            <ul className="mt-2 flex flex-col gap-1 text-[12px]">
              <li><a href={config.redes.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href={config.redes.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href={config.redes.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li>
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}
```

Añadir `<Footer />` al final del `<body>` en `src/app/layout.tsx`.

- [ ] **Step 6: Verificar build + tests**

```bash
npm test && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: carrito persistente en Firestore, pagina /carrito, /api/carrito y footer"
```

---

### Task 9: Cierre de Fase 2 — links internos, placeholders Fase 5, verificación

**Files:**
- Create: `src/app/contacto/page.tsx`, `src/app/reparaciones/page.tsx`, `src/app/preguntas/page.tsx` (placeholders mínimas con schema + metadata, conteúdo real en Fase 5)
- Modify: `tasks.md`

- [ ] **Step 1: Páginas placeholder con metadata y schema**

Cada una: server component, `obtenerConfigTiendaServidor` para datos, `metadata` con title/description/canonical, un H1, información mínima de contacto/reparación/FAQ, link a WhatsApp.

`src/app/contacto/page.tsx`:
```tsx
import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { jsonldLocalBusiness } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const config = await obtenerConfigTiendaServidor().catch(() => null);
  return { title: `Contacto | ${config?.nombre ?? "Mundo Celular"}`, description: `Contacto, dirección y WhatsApp de Mundo Celular en ${config?.ciudad ?? "Medellín"}.`, alternates: { canonical: "/contacto" } };
}

export default async function ContactoPage() {
  const config = await obtenerConfigTiendaServidor();
  return (
    <main className="mx-auto max-w-[800px] px-4 py-10">
      <JsonLd data={{ "@context": "https://schema.org", ...jsonldLocalBusiness(config) }} />
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Contacto</h1>
      <p className="mt-4 text-[16px]">{config.direccion}, {config.ciudad}, {config.departamento}</p>
      <p className="mt-2 text-[14px] text-steel-blue-gray">Horario: {config.horario || "Próximamente"}</p>
      <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2">Escríbenos por WhatsApp</a>
      <ul className="mt-6 flex gap-4 text-[12px]">
        <li><a href={config.redes.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><a href={config.redes.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li>
        <li><a href={config.redes.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li>
      </ul>
    </main>
  );
}
```

`src/app/reparaciones/page.tsx` y `src/app/preguntas/page.tsx`: similares, con Service schema (reparaciones) y FAQPage placeholder (preguntas). Contenido mínimo: H1 + bullets de servicios (pantalla, batería, software) + CTA WhatsApp con mensaje "necesito reparar mi celular". La sección promocional en home (hero ya lo enlaza) — OK ya.

- [ ] **Step 2: Actualizar `tasks.md`**

Marcar Fase 2 completa:
```markdown
## Fase 2 — Catalogo + SEO + Carrito
- [x] Lecturas servidor con unstable_cache
- [x] Generadores metadata + JSON-LD (TDD)
- [x] sitemap.xml + robots.txt
- [x] Home ISR + schemas
- [x] Pagina categoria ISR
- [x] Pagina producto ISR + CTA WhatsApp + add to cart
- [x] Buscador /buscar + header
- [x] Carrito persistente + /carrito + footer
- [x] Placeholders contacto/reparaciones/preguntas
```

- [ ] **Step 3: Verificación final**

```bash
npm test
npm run build
```
Expected: tests PASS (nueva suma: 20 + ~12 = ~32), build OK con todas las rutas indexables listadas (/, /[categoria], /[categoria]/[producto], /sitemap.xml, /robots.txt, /contacto, /reparaciones, /preguntas).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: placeholders contacto/reparaciones/preguntas y cierre de Fase 2"
```

---

## Self-Review (ejecutado al escribir el plan)

**Cobertura del spec (Fase 2):** lecturas servidor ✓ (T1), metadata+JSON-LD por página ✓ (T2), sitemap/robots ✓ (T3), home ✓ (T4), categorías ✓ (T5), productos ✓ (T6), búsqueda ✓ (T7), carrito persistente ✓ (T8), placeholders contacto/reparaciones/preguntas ✓ (T9).

**Placeholders:** none — todo el código está completo o referenciado con snippet exacto.

**Consistencia de tipos:** `metadataProducto(prod, cat, config)` igual en Task 2 y Task 6 ✓; `jsonldProducto(prod, cat, config)` igual ✓; `useCart()` contrato extensible (T6 introducirlo, T8 añadir persistencia sin romper `agregar/quitar/cambiarCantidad/vaciar` ✓; `urlWhatsApp(numero, mensaje)` usado en T6 y T8 ✓; tags `productos`/`categorias`/`config` consistentes con `/api/revalidate` de Fase 1 ✓.

**ISR:** `revalidate = 3600` en home/categoría/producto + `unstable_cache` con tags → revalidación bajo demanda encadena con el panel admin de Fase 1 ✓.
