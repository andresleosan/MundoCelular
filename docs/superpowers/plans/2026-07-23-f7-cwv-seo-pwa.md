# F7 — Core Web Vitals + SEO + PWA · Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimizar Core Web Vitals del storefront migrando a `next/image`, enriquecer SEO on-page (OG/Twitter/schema), añadir telemetría de Web Vitals reales, y habilitar PWA mínimo instalable.

**Architecture:** 7 tareas secuenciales con checkpoint de Lighthouse entre la migración (`T1`+`T2`) y el resto (`T3`-`T7`). Cada tarea produce un commit convencional independiente, sus propios tests pasan, y `tsc --noEmit` + `lint` quedan sin errores.

**Tech Stack:** Next.js 15.5.20 (App Router webpack — NO turbopack), React 19, TypeScript 5, Firebase 12, Cloudflare R2, Vitest 4, `@lhci/cli`, `sharp`.

## Global Constraints

- UI y commits en español (Colombia). Commit convencional: `feat(f7-tN): ...`, `fix(f7): ...`
- Moneda COP entero, locale `es-CO`
- Accent color `#143b98` (`mundo-blue`) SOLO en botón WhatsApp, wordmark y search submit — también válido como `theme_color` del PWA manifest (metadato semántico, no componente visual)
- Tokens de diseño en `src/app/globals.css` bajo `@theme` — usar clases Tailwind (`text-mundo-blue`, `rounded-cards`), no hex directo
- Alias `@/*` → `src/*`
- Windows PowerShell 5.1 (sin WSL)
- `npm run build` usa turbopack que NO respeta `serverExternalPackages` (bug F6); la verificación de F7 usa `npx next build` (webpack)
- Imágenes se sirven desde Cloudflare R2 por `R2_PUBLIC_URL` (path `/productos/**`)
- 109 tests existentes deben seguir pasando

---

## Estructura de Archivos

### Nuevos
- `src/app/manifest.ts` — PWA manifest (T5)
- `src/app/web-vitals.tsx` — hook `useReportWebVitals` (T4)
- `src/app/api/vitals/route.ts` — endpoint POST que loguea métricas (T4)
- `src/app/api/vitals/route.test.ts` o `tests/api/vitals.test.ts` — test del endpoint
- `tests/app/manifest.test.ts` — test del manifest (T5)
- `scripts/generate-icons.ts` — script one-shot para PNGs placeholder (T5)
- `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `favicon-32.png`, `apple-touch-icon-180.png` (T5)
- `public/og-default.png` — 1200×630 default OG image (T5)
- `.lighthouserc.json` — config LHCI (T2)
- `docs/superpowers/reports/2026-07-23-lighthouse-baseline.md` (T2)
- `docs/superpowers/reports/2026-07-23-lighthouse-final.md` (T6)

### Modificados
- `next.config.ts` — añadir `images.remotePatterns` (T1)
- `src/components/storefront/HeroProductCard.tsx` — migrar `<img>` → `<Image priority>` (T1)
- `src/components/storefront/ProductCard.tsx` — migrar `<img>` → `<Image fill>` con `sizes` (T1)
- `src/components/producto/ProductDetail.tsx` — migrar thumbs `<img>` → `<Image>` (T1)
- `src/components/admin/ImageUploader.tsx` — añadir `eslint-disable` justificado (T1)
- `src/lib/seo/metadata.ts` — enriquecer OG/Twitter (T3)
- `src/lib/seo/jsonld.ts` — añadir `sku = prod.id` en `jsonldProducto` (T3)
- `tests/lib/seo-metadata.test.ts` — añadir tests OG/Twitter (T3)
- `tests/lib/seo-jsonld.test.ts` — añadir test de `sku` (T3)
- `src/app/layout.tsx` — añadir `<WebVitals />` + `metadata.manifest` + `metadata.icons` (T4+T5)
- `.gitignore` — añadir `docs/lighthouse-reports/` (T2)

---

### Task 1: Migración `<img>` → `<Image>` en storefront

**Files:**
- Modify: `next.config.ts`
- Modify: `src/components/storefront/HeroProductCard.tsx:10`
- Modify: `src/components/storefront/ProductCard.tsx:21-28`
- Modify: `src/components/producto/ProductDetail.tsx:37-41`
- Modify: `src/components/admin/ImageUploader.tsx:66`

**Interfaces:**
- Consumes: `Image` de `next/image`; `Producto`, `ImagenProducto` de `@/types` (sin cambios)
- Produces: Componentes que renderizan `<Image>` en vez de `<img>`; `next.config.ts` con `images.remotePatterns` válido

- [ ] **Step 1: Modificar `next.config.ts` — añadir `images.remotePatterns`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "firebase-admin",
    "@firebase/firestore",
    "google-gax",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "google-auth-library",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.R2_PUBLIC_URL
          ? new URL(process.env.R2_PUBLIC_URL).hostname
          : "r2.dev",
        pathname: "/productos/**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Migrar `HeroProductCard.tsx` (línea 10)**

Reemplazar todo el archivo con:

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import type { Producto } from "@/types";

export function HeroProductCard({ producto, categoriaSlug }: { producto: Producto; categoriaSlug: string }) {
  return (
    <Link href={`/${categoriaSlug}/${producto.slug}`} className="block rounded-cards bg-pure-white shadow-sm-2">
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-canvas-frost">
        {producto.imagenes[0]?.url ? (
          <Image
            src={producto.imagenes[0].thumb || producto.imagenes[0].url}
            alt={producto.imagenes[0].alt}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="h-full w-full object-cover"
            priority
          />
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

Nota técnica: el container externo `relative aspect-square` es obligatorio porque `<Image fill>` necesita un padre posicionado. Originalmente el div era `aspect-square overflow-hidden` sin `relative`; añadir `relative` hace que `fill` coloque la imagen en absoluto dentro del cuadrado.

`priority` justificado: este es el producto destacado del hero, candidato LCP en mobile.

- [ ] **Step 3: Migrar `ProductCard.tsx` (líneas 19-34)**

Reemplazar el bloque `<div className="aspect-square ...">...</div>` (líneas 19-34) con:

```tsx
        <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-canvas-frost">
          {producto.imagenes[0]?.url ? (
            <Image
              src={producto.imagenes[0].thumb || producto.imagenes[0].url}
              alt={producto.imagenes[0].alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-steel-blue-gray">
              Sin imagen
            </div>
          )}
        </div>
```

Añadir al inicio del archivo el import de `Image`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import type { Producto } from "@/types";
```

`sizes` calibrado: mobile 2 columnas (50vw), tablet 3 (33vw), desktop 4 (25vw). Sin `priority` (grid; el hero es el candidato LCP, el resto lazy por defecto).

- [ ] **Step 4: Migrar `ProductDetail.tsx` thumbnails (líneas 30-43)**

Reemplazar el bloque `<button>...<img ... /></button>` (líneas 30-43) con:

```tsx
              <button
                key={i}
                onClick={() => setImgActiva(i)}
                className={`relative h-16 w-16 overflow-hidden rounded-[12px] border-2 transition ${
                  i === imgActiva ? "border-mundo-blue" : "border-faint-border"
                }`}
              >
                <Image
                  src={img.thumb || img.url}
                  alt={img.alt}
                  fill
                  sizes="64px"
                  className="h-full w-full object-cover"
                />
              </button>
```

El botón añade `relative` para que `fill` posicione la imagen. La imagen principal (líneas 49-56) ya usa `<Image priority width={800} height={800}>` — no tocar.

- [ ] **Step 5: Añadir `eslint-disable` justificado en `ImageUploader.tsx` (línea 66)**

Reemplazar la línea 66:

```tsx
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, src es blob URL (no R2); no impacta CWV del storefront */}
              <img src={img.thumb} alt={img.alt} className="aspect-square w-full rounded-[12px] object-cover" />
```

- [ ] **Step 6: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: sin errores

- [ ] **Step 7: Verificar lint — 0 warnings `no-img-element` en storefront/ y producto/**

Run: `npm run lint`
Expected:  
- Warning `src/components/storefront/HeroProductCard.tsx` → eliminado
- Warning `src/components/storefront/ProductCard.tsx` → eliminado
- Warning `src/components/producto/ProductDetail.tsx` → eliminado
- Warning `src/components/admin/ImageUploader.tsx` → sigue, pero ahora con `eslint-disable` (no cuenta en nivel de warning)
- Warnings previos (`useEffect` en pedidos, etc.) se mantienen

- [ ] **Step 8: Verificar tests existentes pasan**

Run: `npm test`
Expected: 109/109 pasan (sin cambios — T1 sólo afecta JSX de componentes, no metadata/JSON-LD/format tests)

- [ ] **Step 9: Commit**

```bash
git add next.config.ts src/components/storefront/HeroProductCard.tsx src/components/storefront/ProductCard.tsx src/components/producto/ProductDetail.tsx src/components/admin/ImageUploader.tsx
git commit -m "feat(f7-t1): migrar <img> a <Image> en storefront (HeroProductCard, ProductCard, ProductDetail)"
```

---

### Task 2: Lighthouse baseline

**Files:**
- Create: `.lighthouserc.json`
- Modify: `.gitignore`
- Create: `docs/superpowers/reports/2026-07-23-lighthouse-baseline.md`

**Interfaces:**
- Consumes: dev server corriendo en `http://localhost:3000`
- Produces: reporte baseline documentado para comparación final (T6)

**Nota previa:** Si no hay `.env.local` poblado, las páginas dinámicas cargarán sin datos de Firestore — Lighthouse medirá el shell visible. Documentar explícitamente en el reporte que es "baseline en dev sin Firebase".

- [ ] **Step 1: Instalar `@lhci/cli`**

Run: `npm i -D @lhci/cli@0.14`
Expected: `added N packages` con `@lhci/cli@0.14.x` en `devDependencies`

- [ ] **Step 2: Crear `.lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/celulares",
        "http://localhost:3000/celulares/iphone-13"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 40,
          "throughputKbps": 10240,
          "cpuSlowdownMultiplier": 1
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": "warn",
        "categories:accessibility": "warn",
        "categories:seo": "warn",
        "categories:best-practices": "warn"
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "docs/lighthouse-reports"
    }
  }
}
```

NOTA: las URLs asumen que existen categorías/productos; en un env sin seed/config, ajustar a las URLs realmente disponibles (en runtime real, revisar primero con `curl localhost:3000/celulares`). Si `/celulares/iphone-13` no existe, sustituir por la primera URL producto válida del dev server.

- [ ] **Step 3: Añadir `docs/lighthouse-reports/` a `.gitignore`**

Run: `Add-Content -Path .gitignore -Value "`ndocs/lighthouse-reports/`n"` (PowerShell) o añadir manualmente la línea `docs/lighthouse-reports/` al final de `.gitignore`.

- [ ] **Step 4: Construir y servir (preferir webpack)**

Si hay `.env.local` poblado:
```bash
npx next build && npx next start
```
Si NO hay `.env.local`:
```bash
npm run dev
```
Documentar cuál se usó en el reporte.

- [ ] **Step 5: Correr Lighthouse**

Con el server corriendo en background (otra terminal o `Start-Job`):
```bash
npx lhci autorun
```
Expected: termina con "Done" y un scorecard; los HTML reports quedan en `docs/lighthouse-reports/`.

- [ ] **Step 6: Escribir `docs/superpowers/reports/2026-07-23-lighthouse-baseline.md`**

Formato:

```markdown
# Lighthouse Baseline — F7 T2

**Fecha:** 2026-07-23
**Build mode:** `npx next build` + `npx next start` | `npm run dev` (marcar el usado)
**URLs medidas:**
- http://localhost:3000/
- http://localhost:3000/celulares
- http://localhost:3000/celulares/iphone-13

## Scores (mediana de 3 runs)

| URL                  | Performance | Accessibility | SEO  | Best Practices |
|----------------------|-------------|---------------|------|----------------|
| /                    | NN          | NN            | NN   | NN             |
| /celulares           | NN          | NN            | NN   | NN             |
| /celulares/iphone-13 | NN          | NN            | NN   | NN             |

## Core Web Vitals

| URL                  | LCP (s) | CLS  | INP (ms) | FCP (s) | TTFB (ms) |
|----------------------|---------|------|----------|---------|-----------|
| /                    | X.XX    | 0.0X | XXX      | X.XX    | XXX       |
| /celulares           | X.XX    | 0.0X | XXX      | X.XX    | XXX       |
| /celulares/iphone-13 | X.XX    | 0.0X | XXX      | X.XX    | XXX       |

## Top 5 hallazgos (de las 3 URLs combinadas)

1. ...
2. ...
3. ...
4. ...
5. ...

## Notas

- [ ] XCTest setting (dev vs prod build)
- Hallazgos a priorizar en T7 si hay regresión / oportunidades críticas
```

Reemplazar todos los `NN`/`X.XX` con los valores reales del LHCI output HTML o `lighthouserc.json` stdout.

- [ ] **Step 7: Commit**

```bash
git add .lighthouserc.json .gitignore docs/superpowers/reports/2026-07-23-lighthouse-baseline.md package.json package-lock.json
git commit -m "feat(f7-t2): lighthouse baseline + config LHCI"
```

---

### Task 3: SEO enrichment (B3 schema sku + B4 OG/Twitter)

**Files:**
- Modify: `src/lib/seo/jsonld.ts:66-88` (añadir `sku`)
- Modify: `src/lib/seo/metadata.ts` (enriquecer 8 funciones)
- Modify: `tests/lib/seo-jsonld.test.ts` (añadir test sku)
- Modify: `tests/lib/seo-metadata.test.ts` (añadir tests OG/Twitter)

**Interfaces:**
- Consumes: `Categoria`, `Producto`, `ConfigTienda` de `@/types` (sin cambios)
- Produces: `jsonldProducto` con campo `sku: string`; funciones `metadata*` con `openGraph.url`, `openGraph.locale: "es_CO"`, `openGraph.siteName`, `twitter.title/description/images`

- [ ] **Step 1: Añadir test de `sku` en `jsonldProducto`**

Abrir `tests/lib/seo-jsonld.test.ts`. Al final del bloque `describe("jsonldProducto", ...)` (antes de su `});` de cierre), añadir:

```ts
  it("incluye sku = prod.id", () => {
    const j = jsonldProducto(prod, cat);
    expect((j as Record<string, unknown>).sku).toBe(prod.id);
  });
```

- [ ] **Step 2: Verificar que el test falla**

Run: `npm test -- tests/lib/seo-jsonld.test.ts`
Expected: FAIL con `expected undefined to be 'p1'` en el test "incluye sku = prod.id"

- [ ] **Step 3: Añadir `sku` en `src/lib/seo/jsonld.ts` (función `jsonldProducto`)**

Reemplazar las líneas 66-68 (apertura del return):

```ts
export function jsonldProducto(prod: Producto, cat: Categoria): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    sku: prod.id,
    name: prod.nombre,
    description: prod.descripcion,
    brand: { "@type": "Brand", name: prod.marca || undefined },
    image: prod.imagenes.map((im) => im.url),
    offers: [
      {
        "@type": "Offer",
        price: String(prod.precio),
        priceCurrency: "COP",
        availability: prod.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: url(`/${cat.slug}/${prod.slug}`),
        seller: {
          "@type": "Organization",
          name: "Mundo Celular",
        },
      },
    ],
  };
}
```

(Toda la función reemplazada — sólo se añadió la línea `sku: prod.id,` entre `@type` y `name`)

- [ ] **Step 4: Verificar que el test pasa**

Run: `npm test -- tests/lib/seo-jsonld.test.ts`
Expected: PASS

- [ ] **Step 5: Añadir tests de OG/Twitter en `tests/lib/seo-metadata.test.ts`**

Al final del archivo (antes de `describe("metadataAdmin", ...)`):

```ts
describe("metadataInicio OG/Twitter", () => {
  it("incluye og:locale=es_CO y og:url absoluta", () => {
    const m = metadataInicio(config);
    expect(m.openGraph?.locale).toBe("es_CO");
    expect(m.openGraph?.url).toBeDefined();
    expect(m.openGraph?.siteName).toBe(config.nombre);
  });
  it("incluye twitter:image y twitter:title", () => {
    const m = metadataInicio(config);
    expect(m.twitter?.card).toBe("summary_large_image");
    expect(m.twitter?.title).toBeDefined();
    expect(m.twitter?.description).toBeDefined();
  });
});

describe("metadataProducto OG/Twitter", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true };
  const prodConImagen: Producto = {
    id: "p1", nombre: "iPhone 13", slug: "iphone-13", descripcion: "OK",
    precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple",
    specs: {}, imagenes: [{ url: "https://r2.test/productos/p1.webp", thumb: "https://r2.test/productos/p1-thumb.webp", alt: "iPhone 13" }], activo: true, destacado: false,
  };
  it("incluye twitter:image con la imagen del producto", () => {
    const m = metadataProducto(prodConImagen, cat, config);
    expect(m.twitter?.images?.[0]).toBe("https://r2.test/productos/p1.webp");
  });
  it("incluye og:url absoluta y og:locale=es_CO", () => {
    const m = metadataProducto(prodConImagen, cat, config);
    expect(m.openGraph?.url).toContain("/celulares/iphone-13");
    expect(m.openGraph?.locale).toBe("es_CO");
  });
});

describe("metadataCategoria OG/Twitter", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "Smartphones", orden: 1, activa: true };
  it("incluye og:url, siteName, locale", () => {
    const m = metadataCategoria(cat, config);
    expect(m.openGraph?.url).toContain("/celulares");
    expect(m.openGraph?.siteName).toBe(config.nombre);
    expect(m.openGraph?.locale).toBe("es_CO");
  });
});
```

- [ ] **Step 6: Verificar que los tests fallan**

Run: `npm test -- tests/lib/seo-metadata.test.ts`
Expected: FAIL con errores tipo `expected undefined to be 'es_CO'`

- [ ] **Step 7: Modificar `src/lib/seo/metadata.ts` — añadir constantes y enriquecer funciones**

Reemplazar las líneas 1-5 (imports + helpers) con:

```ts
import type { Metadata } from "next";
import type { Categoria, Producto, ConfigTienda } from "@/types";
import { formatearCOP } from "@/lib/format";

const OG_LOCALE = "es_CO";
const OG_DEFAULT_IMAGE = "/og-default.png";

function siteName(config: ConfigTienda): string {
  return config.nombre;
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function ogUrl(canonical?: string): string {
  return canonical ? `${baseUrl()}${canonical}` : baseUrl();
}
```

- [ ] **Step 8: Reescribir `metadataInicio`**

Reemplazar la función completa (líneas 7-15) con:

```ts
export function metadataInicio(config: ConfigTienda): Metadata {
  const description = `Tienda de celulares, accesorios, consolas y tecnología en ${config.ciudad}. Compra por WhatsApp. También reparamos celulares.`;
  const title = `${siteName(config)} | Tecnología y celulares en ${config.ciudad}`;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: siteName(config),
      title,
      description,
      url: ogUrl("/"),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: siteName(config) }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}
```

- [ ] **Step 9: Reescribir `metadataCategoria`**

Reemplazar (líneas 17-24):

```ts
export function metadataCategoria(cat: Categoria, config: ConfigTienda): Metadata {
  const description = cat.descripcion || `Comprar ${cat.nombre.toLowerCase()} en ${config.ciudad}. ${siteName(config)}`;
  const title = `${cat.nombre} en ${config.ciudad} | ${siteName(config)}`;
  return {
    title,
    description,
    alternates: { canonical: `/${cat.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: ogUrl(`/${cat.slug}`),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}
```

- [ ] **Step 10: Reescribir `metadataProducto`**

Reemplazar (líneas 26-44):

```ts
export function metadataProducto(prod: Producto, cat: Categoria | null, config: ConfigTienda): Metadata {
  const title = cat
    ? `${prod.nombre} | ${cat.nombre} en ${config.ciudad} | ${siteName(config)}`
    : `${prod.nombre} | ${siteName(config)}`;
  const description = prod.metaDescription?.trim()
    || `${prod.nombre} ${prod.marca ? `de ${prod.marca} ` : ""}por ${formatearCOP(prod.precio)} en ${config.ciudad}. Stock: ${prod.stock}.`;
  const canonical = cat ? `/${cat.slug}/${prod.slug}` : `/producto/${prod.slug}`;
  const ogImages = prod.imagenes.length
    ? [{ url: prod.imagenes[0].url, width: 1200, height: 1200, alt: prod.imagenes[0].alt }]
    : [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: prod.nombre }];
  return {
    title: prod.metaTitle?.trim() || title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: ogUrl(canonical),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}
```

- [ ] **Step 11: Reescribir `metadataReparaciones`**

Reemplazar (líneas 46-53):

```ts
export function metadataReparaciones(config: ConfigTienda): Metadata {
  const description = `Servicio técnico de celulares en ${config.ciudad}. ${siteName(config)}. Reparamos pantallas, baterías, software y más.`;
  const title = `Reparación de celulares en ${config.ciudad} | ${siteName(config)}`;
  return {
    title,
    description,
    alternates: { canonical: "/reparaciones" },
    openGraph: {
      type: "website",
      title,
      description,
      url: ogUrl("/reparaciones"),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}
```

- [ ] **Step 12: Reescribir `metadataContacto`**

Reemplazar (líneas 78-85):

```ts
export function metadataContacto(config: ConfigTienda): Metadata {
  const description = `Dirección, horario y contacto de ${siteName(config)} en ${config.ciudad}. WhatsApp, redes sociales y mapa.`;
  const title = `Contacto | ${siteName(config)}`;
  return {
    title,
    description,
    alternates: { canonical: "/contacto" },
    openGraph: {
      type: "website",
      title,
      description,
      url: ogUrl("/contacto"),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}
```

- [ ] **Step 13: Reescribir `metadataPreguntas`**

Reemplazar (líneas 87-94):

```ts
export function metadataPreguntas(config: ConfigTienda): Metadata {
  const description = `Resolvemos tus dudas sobre compras, envíos, garantía y reparaciones en ${siteName(config)}.`;
  const title = `Preguntas frecuentes | ${siteName(config)}`;
  return {
    title,
    description,
    alternates: { canonical: "/preguntas" },
    openGraph: {
      type: "website",
      title,
      description,
      url: ogUrl("/preguntas"),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}
```

NOTA: `metadataBusqueda` y `metadataCarrito` NO se modifican (robots index:false — OG/Twitter no relevantes).

- [ ] **Step 14: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: sin errores

- [ ] **Step 15: Verificar tests pasan**

Run: `npm test -- tests/lib/seo-metadata.test.ts tests/lib/seo-jsonld.test.ts`
Expected: TODOS los tests de ambos archivos pasan (incluye los nuevos)

- [ ] **Step 16: Verificar suite completa**

Run: `npm test`
Expected: 109 + nuevos (≥117) pasan

- [ ] **Step 17: Commit**

```bash
git add src/lib/seo/metadata.ts src/lib/seo/jsonld.ts tests/lib/seo-metadata.test.ts tests/lib/seo-jsonld.test.ts
git commit -m "feat(f7-t3): enriquecer OG/Twitter metadata + sku en schema Product"
```

---

### Task 4: Web Vitals analytics (B2)

**Files:**
- Create: `src/app/web-vitals.tsx`
- Create: `src/app/api/vitals/route.ts`
- Create: `tests/api/vitals.test.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `useReportWebVitals` de `next/web-vitals` (Next 15); WebVitalsMetric tipado por Next
- Produces: Componente `<WebVitals />` no-op en render; endpoint POST `/api/vitals` que loguea JSON estructurado `{ type: "web-vital", name, value, rating, ... }`

- [ ] **Step 1: Escribir test del endpoint**

Crear `tests/api/vitals.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

describe("POST /api/vitals", () => {
  it("responde 200 y loguea la métrica en formato JSON estructurado", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { POST } = await import("@/app/api/vitals/route");

    const req = new Request("http://localhost/api/vitals", {
      method: "POST",
      body: JSON.stringify({
        name: "LCP",
        value: 1234,
        id: "v1-123",
        rating: "good",
        path: "/",
        timestamp: Date.now(),
      }),
    });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(200);
    const logged = spy.mock.calls[0]?.[0] as string;
    expect(logged).toContain('"type":"web-vital"');
    expect(logged).toContain('"name":"LCP"');
    expect(logged).toContain('"value":1234');
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Verificar que falla (aún no existe la ruta)**

Run: `npm test -- tests/api/vitals.test.ts`
Expected: FAIL con error de importación (`Cannot find module '@/app/api/vitals/route'`)

- [ ] **Step 3: Crear `src/app/api/vitals/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name: string;
    value: number;
    id: string;
    rating: string;
    path: string;
    timestamp: number;
  };

  console.log(JSON.stringify({ type: "web-vital", ...body }));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verificar que el test pasa**

Run: `npm test -- tests/api/vitals.test.ts`
Expected: PASS

- [ ] **Step 5: Crear `src/app/web-vitals.tsx`**

```tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals(async (metric) => {
    if (process.env.NODE_ENV !== "production") return;

    try {
      await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          path: typeof window !== "undefined" ? window.location.pathname : "/",
          timestamp: Date.now(),
        }),
        keepalive: true,
      });
    } catch {
      // Telemetría no debe romper UX
    }
  });

  return null;
}
```

- [ ] **Step 6: Integrar `<WebVitals />` en `src/app/layout.tsx`**

Añadir import al inicio (junto a otros imports de `@/components/...`):

```tsx
import { WebVitals } from "@/app/web-vitals";
```

Añadir dentro de `<body>` justo antes de `</body>`:

```tsx
      <BottomTabBar />
      <WebVitals />
    </body>
```

El orden final del body debe ser:
```tsx
      <Header />
      <AuthProvider>{children}</AuthProvider>
      <Footer />
      <BottomTabBar />
      <WebVitals />
    </body>
```

- [ ] **Step 7: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: sin errores. Si Next reporta error con `useReportWebVitals` types, verificar que es `import { useReportWebVitals } from "next/web-vitals"` (no `next/dist/...`) y que el type export `WebVitalsMetric` existe en Next 15.5.20.

- [ ] **Step 8: Verificar suite completa**

Run: `npm test`
Expected: todos pasan (109 + 1 + 3+3+OG nuevos anteriores)

- [ ] **Step 9: Commit**

```bash
git add src/app/web-vitals.tsx src/app/api/vitals/route.ts tests/api/vitals.test.ts src/app/layout.tsx
git commit -m "feat(f7-t4): hook useReportWebVitals + endpoint /api/vitals para telemetría CWV"
```

---

### Task 5: PWA manifest + iconos placeholder

**Files:**
- Create: `src/app/manifest.ts`
- Create: `scripts/generate-icons.ts`
- Create: `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `favicon-32.png`, `apple-touch-icon-180.png`
- Create: `public/og-default.png`
- Create: `tests/app/manifest.test.ts`
- Modify: `src/app/layout.tsx` (añadir `manifest` + `icons` en metadata)

**Interfaces:**
- Consumes: `sharp` (incluido como dep transitiva de `next`) o `@resvg/resvg-js`
- Produces: `src/app/manifest.ts` exportando `default()` que retorna `MetadataRoute.Manifest`; PNGs en `public/icons/` y `public/og-default.png`

- [ ] **Step 1: Escribir test del manifest**

Crear `tests/app/manifest.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("PWA manifest", () => {
  it("tiene iconos 192, 512 y 512 maskable", async () => {
    const { default: manifest } = await import("@/app/manifest");
    const m = manifest();
    expect(m.icons?.find((i) => i.sizes === "192x192")).toBeDefined();
    expect(m.icons?.find((i) => i.sizes === "512x512")).toBeDefined();
    expect(m.icons?.find((i) => i.purpose === "maskable")).toBeDefined();
    expect(m.theme_color).toBe("#143b98");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("es-CO");
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm test -- tests/app/manifest.test.ts`
Expected: FAIL con `Cannot find module '@/app/manifest'`

- [ ] **Step 3: Crear `src/app/manifest.ts`**

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mundo Celular",
    short_name: "Mundo Celular",
    description: "Celulares, accesorios, consolas y tecnología en Medellín. Compra por WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#143b98",
    lang: "es-CO",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

- [ ] **Step 4: Verificar que el test pasa**

Run: `npm test -- tests/app/manifest.test.ts`
Expected: PASS

- [ ] **Step 5: Crear `scripts/generate-icons.ts`**

```ts
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BLUE = "#143b98";

function svgIcon(size: number): string {
  const fontSize = Math.round(size / 2.2);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BLUE}"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="#ffffff">MC</text>
</svg>`;
}

function svgMaskable(size: number): string {
  // Maskable: contenido dentro de safe-zone (80% central ≈ 0.1..0.9)
  // El rect azul sigue coveriendo toda la imagen (background_color del manifest es blanco,
  // pero el icono mismo es azul — así cualquier recorte de la máscara sigue siendo azul + MC centrado).
  return svgIcon(size);
}

function svgOgDefault(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BLUE}"/>
  <text x="50%" y="42%" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="#ffffff">Mundo Celular</text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="#ffffff" opacity="0.85">Tecnología en Medellín</text>
</svg>`;
}

async function main() {
  mkdirSync(resolve("public/icons"), { recursive: true });

  const targets = [
    { file: "public/icons/icon-192.png", size: 192, svg: svgIcon(192) },
    { file: "public/icons/icon-512.png", size: 512, svg: svgIcon(512) },
    { file: "public/icons/icon-512-maskable.png", size: 512, svg: svgMaskable(512) },
    { file: "public/icons/favicon-32.png", size: 32, svg: svgIcon(32) },
    { file: "public/icons/apple-touch-icon-180.png", size: 180, svg: svgIcon(180) },
    { file: "public/og-default.png", size: null, svg: svgOgDefault() },
  ];

  for (const t of targets) {
    const png = await sharp(Buffer.from(t.svg)).png().toBuffer();
    writeFileSync(t.file, png);
    console.log(`OK: ${t.file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

NOTA: Si `sharp` falla al importarse en Windows (build nativo), instalar `@resvg/resvg-js` como devDep y adaptar las sharp `.png().toBuffer()` por resvg. Resolvedor en ejecución.

- [ ] **Step 6: Ejecutar el script**

Run: `npx tsx scripts/generate-icons.ts`
Expected: stdout con 6 líneas `OK: public/icons/icon-XXX.png` y `OK: public/og-default.png`

Verificar visualmente abriendo una de las PNGs.

- [ ] **Step 7: Modificar `src/app/layout.tsx` — añadir `manifest` y `icons` en metadata**

Reemplazar el bloque `export const metadata: Metadata = { ... }` (líneas 12-16):

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Mundo Celular | Tecnología en Medellín", template: "%s | Mundo Celular" },
  description: "Celulares, accesorios, consolas y tecnología en Medellín. Compra por WhatsApp. También reparamos celulares.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};
```

El resto del `layout.tsx` no se toca; el import de `WebVitals` ya quedó de T4.

- [ ] **Step 8: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: sin errores. Si type `Metadata.manifest` no es soportado, verificar versión de `next` declarations (debería estar soportado desde Next 13.4+; 15.5.20 lo soporta).

- [ ] **Step 9: Verificar suite completa**

Run: `npm test`
Expected: todos los tests pasan (incluye `tests/app/manifest.test.ts`)

- [ ] **Step 10: Commit**

```bash
git add src/app/manifest.ts scripts/generate-icons.ts src/app/layout.tsx public/icons/ public/og-default.png tests/app/manifest.test.ts
git commit -m "feat(f7-t5): manifest PWA + iconos placeholder + og-default.png"
```

---

### Task 6: Lighthouse final + comparación con baseline

**Files:**
- Create: `docs/superpowers/reports/2026-07-23-lighthouse-final.md`

**Interfaces:**
- Consumes: `.lighthouserc.json` de T2; dev/build server corriendo
- Produces: reporte final con diff cuantitativo vs baseline

- [ ] **Step 1: Construir/servir — mismo modo que T2**

Repetir el build/serve decisión de T2 (mismo `npx next build && npx next start` o `npm run dev`).

- [ ] **Step 2: Correr Lighthouse final**

Run: `npx lhci autorun`
Expected: HTML reports en `docs/lighthouse-reports/`

- [ ] **Step 3: Escribir `docs/superpowers/reports/2026-07-23-lighthouse-final.md`**

```markdown
# Lighthouse Final — F7 T6

**Fecha:** 2026-07-23
**Build mode:** <igual que T2>
**URLs medidas:** <igual que T2>

## Scores (mediana de 3 runs)

| URL                  | Performance | Accessibility | SEO  | Best Practices |
|----------------------|-------------|---------------|------|----------------|
| /                    | NN          | NN            | NN   | NN             |
| /celulares           | NN          | NN            | NN   | NN             |
| /celulares/iphone-13 | NN          | NN            | NN   | NN             |

## Core Web Vitals — Final vs Baseline

| URL                  | Métrica      | Baseline | Final  | Δ      |
|----------------------|--------------|----------|--------|--------|
| /                    | LCP          | X.XX     | X.XX   | ±X.XX  |
| /                    | CLS          | 0.0X     | 0.0X   | ±X.XX  |
| /                    | INP          | XXX      | XXX    | ±XXX   |
| /celulares           | LCP          | X.XX     | X.XX   | ...    |
| /celulares/iphone-13 | LCP          | X.XX     | X.XX   | ...    |

## Métrica de éxito

- [ ] LCP final < 2.5s (o igual/mejor que baseline)
- [ ] CLS final ≤ 0.1
- [ ] INP final ≤ 200ms
- [ ] SEO score ≥ 95
- [ ] Performance ≥ baseline (sin regresión)

## Hallazgos a priorizar en T7 (si los hay)

1. ...
```

Reemplazar todos los placeholders con valores reales.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/reports/2026-07-23-lighthouse-final.md
git commit -m "feat(f7-t6): lighthouse final + comparación con baseline"
```

---

### Task 7: Fixes condicionales (placeholder)

**Files:**
- Variable según hallazgos de T6. Posibles:
  - `next.config.ts` (cache headers)
  - `src/app/layout.tsx` (DOM order del hero)
  - Firebase dynamic import en layout

**Interfaces:**
- Consumes: hallazgos cuantitativos de T6 reporte
- Produces: Fix específico del hallazgo + re-run Lighthouse para confirmar

**Condición:** Si T6 sale verde (LCP<2.5, CLS≤0.1, INP≤200, SEO≥95) → saltar T7 (no commitear nada, documentarlo en el reporte final).

Si hay hallazgos, ejecutar:

- [ ] **Step 1: Identificar fix**

Leer el reporte T6, identificar la oportunidad/issue con mayor prioridad por impacto en métrica.

- [ ] **Step 2: Implementar el fix**

(Aquí aplicar el fix específico según el hallazgo. Posibles ejemplos:

Si LCP regressó por `HeroProductCard` DOM order → mover el hero component para que sea el primer elemento visible.

Si Firebase JS bloquea render → cambiar `import { ... } from "firebase/..."` a `dynamic(() => import(...), { ssr: false })` en `AuthProvider`.

Si cache headers ausentes → añadir en `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  ...
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};
```

)

- [ ] **Step 3: Verificar `tsc + lint + test`**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: todo pasa

- [ ] **Step 4: Re-correr Lighthouse para confirmar fix**

Run: `npx lhci autorun`
Expected: la métrica problemática mejoró

- [ ] **Step 5: Actualizar el reporte T6 con el resultado post-fix**

Append al final de `docs/superpowers/reports/2026-07-23-lighthouse-final.md`:

```markdown
## T7 Fixes aplicados

- Fix: <descripción del fix>
- Métrica antes → después: LCP X.XX → X.XX
- Commit: <hash>
```

- [ ] **Step 6: Commit**

```bash
git add <archivos modificados> docs/superpowers/reports/2026-07-23-lighthouse-final.md
git commit -m "fix(f7-t7): <descripción específica del hallazgo fixeado>"
```

---

## Verificación final de F7

Antes de marcar la fase como completa:

- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run lint` sin warnings `no-img-element` en `src/components/storefront/` ni `src/components/producto/`
- [ ] `npm test` ≥117/117 (109 previos + 1 manifest + 1 vitals + 3 sku/OG/Twitter nuevos + 3 OG product/Categoría nuevos)
- [ ] `npx next build` (webpack) Compiled successfully (prerender puede fallar sin `.env.local` — documentado)
- [ ] `/manifest.webmanifest` accesible al servir
- [ ] `public/icons/icon-{192,512,512-maskable}.png` + `public/og-default.png` existen
- [ ] `docs/superpowers/reports/2026-07-23-lighthouse-{baseline,final}.md` existen

Si todo OK, marcar F7 como completa en `tasks.md` y alinear Actual `tasks.md` con un cierre de Fase 7 bloque.
