# Fase 7 — Core Web Vitals + SEO enriquecido + PWA mínimo · Spec de diseño

**Fecha:** 2026-07-23
**Plan padre:** Continuación de F1-F6 (Mundo Celular MVP)
**Modelo de agencia:** v3.3.3
**Stack:** Next.js 15.5.20 (App Router, webpack), React 19, TypeScript 5, Firebase 12, Cloudflare R2, Vitest 4

## Objetivo

Optimizar Core Web Vitals (LCP, CLS, INP) en el storefront medibles con Lighthouse, enriquecer SEO on-page (Open Graph/Twitter/schema.org), añadir telemetría de Web Vitals reales de usuarios, y habilitar PWA mínimo instalable en home screen — todo sin añadir dependencias SaaS ni inventar datos estructurados.

## Alcance

F7 = **migración `<img>` → `next/image`** + **B1 Lighthouse** + **B2 Web Vitals analytics** + **B3 Schema Product (reducido)** + **B4 OG/Twitter enrichment** + **B5 PWA manifest (sin service worker)**.

### Tareas

```
T1: Migración <img> → <Image> en 4 componentes  (código, impacto visual)
T2: Lighthouse → reporte LCP/CLS/INP baseline   (evidencia, no code)
─── checkpoint ───
T3: OG/Twitter enrichment + B3 schema sku       (SEO on-page + tests)
T4: Web Vitals analytics (useReportWebVitals)   (B2 + test)
T5: PWA manifest + iconos placeholder            (B5 + test)
T6: Lighthouse final → comparación con Tarea 2  (evidencia)
T7: (condicional) fixes que surjan de Tarea 6   (placeholder)
```

### Secuencia

T1 → T2 → **checkpoint de observación** → T3 → T4 → T5 → T6 → T7 (si aplica). Cada tarea commiteada por separado con commit convencional `feat(f7-tN): ...` o `fix(f7): ...`.

### Fuera de alcance (explícito, YAGNI)

- **No crear service worker** (skip offline real). El PWA es instalable pero todo carga desde red.
- **No inventar `aggregateRating`** en schema Product (penalización Google + no hay reviews). Solo añadir `sku = prod.id`.
- **No añadir `gtin13`/`mpn`** sin datos reales (no están en el modelo Producto).
- **No añadir Datadog/Sentry/analytics SaaS** (alineado con cost-intelligence — sin dependencias de pago).
- **No migrar `ImageUploader` de admin** a `next/image` (imagenes son blobs locales, no URLs R2; no impacta CWV del storefront). Se añade `eslint-disable` justificado.
- **No batchear Web Vitals client-side** (YAGNI hasta volumen alto).
- **No añadir cache headers avanzados** salvo que Lighthouse (T6) lo pida → T7 lo recoge.
- **No OG image dinámica por producto** (la imagen del producto ya es OG image — suficiente).

### Decisiones explícitas documentadas arriba

- **Skip SW** ( decisión del usuario — offline real no aporta valor en e-commerce sin pasarela de pago)
- **Iconos placeholder** generados por script (el usuario los reemplazará con logo real más adelante)
- **`theme_color` = #143b98** en manifest (campo semántico, no componente visual — alineado con identidad de marca) — revisar con usuario, blanco/neutral también válido si prefiere

## Arquitectura

### Estructura de archivos

```
src/
  components/
    producto/
      ProductDetail.tsx          # MODIFY T1: thumbs <img> → <Image>
    storefront/
      HeroProductCard.tsx         # MODIFY T1: <img> → <Image priority>
      ProductCard.tsx            # MODIFY T1: <img> → <Image fill + sizes>
    admin/
      ImageUploader.tsx          # MODIFY T1: añadir eslint-disable justificado (NO migrar)
  app/
    manifest.ts                  # CREATE T5: PWA manifest (B5)
    web-vitals.tsx              # CREATE T4: useReportWebVitals hook (B2)
    api/vitals/route.ts          # CREATE T4: endpoint POST que loguea métricas (B2)
    layout.tsx                   # MODIFY T4+T5: importar WebVitals + manifest metadata
  lib/
    seo/
      metadata.ts                # MODIFY T3: OG/Twitter enrichment (B4)
      jsonld.ts                  # MODIFY T3: agregar sku = prod.id (B3)
  public/
    icons/                       # CREATE T5: 192.png, 512.png, 512-maskable.png, favicon, apple-touch
    og-default.png               # CREATE T5: 1200×630 PNG default para OG home/categoría
scripts/
  generate-icons.ts              # CREATE T5: one-shot que genera PNGs de placeholder
next.config.ts                   # MODIFY T1: images.remotePatterns para R2 (manteniendo serverExternalPackages de F6)
docs/superpowers/
  specs/2026-07-23-f7-cwv-seo-pwa-design.md   # este archivo
  plans/2026-07-23-f7-cwv-seo-pwa.md          # CREATE writing-plans (next)
  reports/
    2026-07-23-lighthouse-baseline.md          # CREATE T2
    2026-07-23-lighthouse-final.md             # CREATE T6
tests/
  lib/seo-metadata.test.ts        # MODIFY T3: tests nuevos de OG/Twitter
  lib/seo-jsonld.test.ts          # MODIFY T3: test de sku en jsonldProducto
  api/vitals.test.ts              # CREATE T4: test del endpoint
  app/manifest.test.ts            # CREATE T5: test del manifest
.lighthouserc.json                # CREATE T2: config LHCI
docs/lighthouse-reports/          # CREATE T2: HTML reports (gitignored? ver T2)
```

### Tarea 1 — Migración `<img>` → `<Image>`

**Configuración `next.config.ts`:**

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: [
    "firebase-admin", "@firebase/firestore", "google-gax",
    "@grpc/grpc-js", "@grpc/proto-loader", "google-auth-library",
  ],  // existente de F6
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
```

Si `R2_PUBLIC_URL` no está seteado (dev sin `.env.local`), fallback `r2.dev` — no rompe el build; en runtime real usa el host real.

**Migración por componente:**

1. `HeroProductCard.tsx` (línea 10): `<img loading="lazy">` → `<Image priority>` (candidato LCP de home, preload justificado). Width/height explícitos 400×400.
2. `ProductCard.tsx` (línea 21): `<img>` → `<Image fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw">` envuelto en container `relative aspect-square`.
3. `ProductDetail.tsx` (línea 37, thumbs): `<img>` → `<Image fill sizes="100px">` con container relativo. La imagen principal (línea 49) ya usa `<Image>`.
4. `ImageUploader.tsx` (línea 66): **no migrar**. Las src son `URL.createObjectURL` blobs; `next/image` con blobs requiere `unoptimized` y hay corner cases. Añadir `// eslint-disable-next-line @next/next/no-img-element` con comentario justificando "admin preview, blob URLs, no storefront CWV impact".

**Tests T1:** No se añaden tests nuevos — el verificador es Lighthouse (T2) + lint (sin warnings `no-img-element` en storefront/ProductDetail).

**Definición de hecho (T1):** `npx tsc --noEmit` ✓ y `npm run lint` muestra 0 warnings `no-img-element` en archivos storefront/ y producto/ (ImageUploader queda con eslint-disable justificado).

### Tarea 2 — Lighthouse baseline

**Herramienta:** `@lhci/cli@0.14` (última estable al momento del plan) instalado como devDependency.

**Configuración `.lighthouserc.json` en raíz:**

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

Las URLs asumen dev server corriendo con `.env.local` poblado (Firebase ok). Si no hay creds, las páginas de producto/categoría cargan vacías — Lighthouse medirá el shell visible, no el contenido dinámico. **Documentado en el reporte que es baseline dev si no hay prod build.**

Adicionar a `.gitignore`: `docs/lighthouse-reports/` (HTML voluminoso, no útil en repo).

**Pasos T2:**

1. `npm i -D @lhci/cli@0.14`
2. Crear `.lighthouserc.json`
3. Añadir `docs/lighthouse-reports/` a `.gitignore`
4. Construir/servir: preferir `npm run build && npm start` (webpack — Turbopack no respeta serverExternalPackages, según hallazgo F6). Si no hay `.env.local`, usar `npm run dev` y documentar.
5. Correr `npx lhci autorun`
6. Escribir `docs/superpowers/reports/2026-07-23-lighthouse-baseline.md` con: LCP, CLS, INP, FCP, TTFB, scores de Performance/Accessibility/SEO/Best-Practices, top 5 hallazgos.

**Definición de hecho (T2):** El reporte MD existe con métricas documentadas y top hallazgos. No se aplica fixes aquí — solo referencia basal.

### Tarea 3 — SEO enrichment (B3 schema + B4 OG/Twitter)

#### B3 — Schema Product reducido

`jsonldProducto` (en `src/lib/seo/jsonld.ts:66`) ya incluye `Product` con `name`, `description`, `brand`, `image`, `offers[]` completo (price, currency, availability, seller). Añadir:

- `sku: prod.id` (Firestore doc ID es el SKU legit del producto)

**Sin inventar ratings ni IDs de código de barras ausentes del modelo.**

#### B4 — Open Graph / Twitter enrichment

Para cada función de `src/lib/seo/metadata.ts` (`metadataInicio`, `metadataCategoria`, `metadataProducto`, `metadataReparaciones`, `metadataContacto`, `metadataPreguntas`, `metadataBusqueda`, `metadataCarrito`), asegurar formato:

```ts
openGraph: {
  type: "website" | "article",  // article para producto
  title: ...,
  description: ...,             // consistente con metadata.description
  url: `${base}${canonicalPath}`,  // URL absoluta
  siteName: siteName(config),
  locale: "es_CO",
  images: ogImages,             // array si existen, undefined si no
},
twitter: {
  card: "summary_large_image",
  title: ...,
  description: ...,
  images: ogImages ? [ogImages[0].url] : undefined,
},
```

**Estado actual y gaps por función:**

| Función         | OG actual                    | Gap a llenar T3                                    |
|-----------------|------------------------------|----------------------------------------------------|
| metadataInicio  | type+siteName+title          | url, description, locale, images=[/og-default.png] |
| metadataCategoria | type+title                | url, description, siteName, locale, images (categoria.imagen o default) |
| metadataProducto | images+title+description    | url, siteName, locale, twitter.title/description/image |
| metadataReparaciones | type+title             | url, description, siteName, locale, twitter completo, images=[/og-default.png] |
| metadataContacto | type+title                  | url, description, siteName, locale, twitter completo, images=[/og-default.png] |
| metadataPreguntas | type+title                 | url, description, siteName, locale, twitter completo, images=[/og-default.png] |
| metadataBusqueda | (noindex)                   | sin OG (robots index:false, OG no relevante)        |
| metadataCarrito  | (noindex)                   | sin OG (robots index:false)                         |

**`og-default.png`** se crea en Tarea 5 (1200×630, fondo `mundo-blue`, texto "Mundo Celular" + tagline). En runtime post-T5 aparece; pre-T5 fallback a sin image. No rompe nada.

**Tests T3:**

- En `tests/lib/seo-jsonld.test.ts`, añadir:
```ts
it("jsonldProducto incluye sku = prod.id", () => {
  const ld = jsonldProducto(prodMock, catMock);
  expect(ld.sku).toBe(prodMock.id);
  expect(ld["@type"]).toBe("Product");
});
```

- En `tests/lib/seo-metadata.test.ts`, añadir:
```ts
it("metadataProducto incluye twitter:image con imagen de producto", () => {
  const m = metadataProducto(prodConImagen, cat, config);
  expect(m.twitter?.images?.[0]).toBe(prodConImagen.imagenes[0].url);
});

it("metadataInicio incluye og:locale=es_CO y og:url canónica absoluta", () => {
  const m = metadataInicio(config);
  expect(m.openGraph?.locale).toBe("es_CO");
  expect(m.openGraph?.url).toBe(`${base}/`);
});

it("metadataCategoria completa og:url, siteName, locale", () => {
  const m = metadataCategoria(catMock, config);
  expect(m.openGraph?.url).toContain(`/${catMock.slug}`);
  expect(m.openGraph?.siteName).toBe(config.nombre);
  expect(m.openGraph?.locale).toBe("es_CO");
});
```

**Definición de hecho (T3):** `npx tsc --noEmit` ✓ y nuevos tests pasan. `npm test` total sube de 109 a ≥112.

### Tarea 4 — Web Vitals analytics (B2)

#### `src/app/web-vitals.tsx`

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
      // swallow — no romper UX por telemetría
    }
  });

  return null;
}
```

#### `src/app/api/vitals/route.ts`

Endpoint minimal que solo loguea. **No** almacenar en Firestore (costo de escritura por pageview, alineado con cost-intelligence):

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

#### `src/app/layout.tsx` — integración

```tsx
import { WebVitals } from "@/app/web-vitals";

// En el body:
<body className="pb-20 sm:pb-0">
  <Header />
  <AuthProvider>{children}</AuthProvider>
  <Footer />
  <BottomTabBar />
  <WebVitals />
</body>
```

#### Tests T4

`tests/api/vitals.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

describe("POST /api/vitals", () => {
  it("responde ok y loguea la métrica en formato JSON", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { POST } = await import("@/app/api/vitals/route");

    const req = new Request("http://localhost/api/vitals", {
      method: "POST",
      body: JSON.stringify({
        name: "LCP", value: 1234, id: "v1", rating: "good",
        path: "/", timestamp: Date.now(),
      }),
    });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"type":"web-vital"'));
    spy.mockRestore();
  });
});
```

No se testa el hook `useReportWebVitals` en jsdom (no implementa `LCP`/`CLS`/`INP` performance observers ni `PerformanceObserver` adecuadamente). Documentado.

#### Decisiones explícitas T4

- **Sin auth:** métricas anónimas. No hay PII en payload (no se envía email/uid).
- **Sin Firestore:** costo de escritura por cada pageview; logs son suficientes para empezar.
- **Sin rate limiting:** payload pequeño y path abierto. Si se expone en prod, agregar rate limit básico o poner detrás de reverse proxy (documentado como limitación en spec).
- **`keepalive: true`** en fetch para que no se pierdan métricas en unload.

#### Riesgos T4

1. **`useReportWebVitals` types:** importar desde `next/web-vitals` (Next 14+). Verificar export correcto en Next 15.5.20.
2. **Volumen:** cada pageview = 5-6 métricas × 1 POST. En tienda pequeña (cientos/día), despreciable. Si crece, agregar batching client-side (no YAGNI ahora).
3. **Ataque de métricas falsas:** acepto (solo telemetría, no impacta negocio). Documentado.
4. **Namespace de logs:** filtrable con `type: "web-vital"` JSON. Patrón documentado.

**Definición de hecho (T4):** `npm test -- tests/api/vitals.test.ts` ✓ pasa. `npx tsc --noEmit` ✓.

### Tarea 5 — PWA manifest + iconos

#### `src/app/manifest.ts` (Next App Router nativo)

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

#### `src/app/layout.tsx` — metadata icons

Añadir a la `metadata` del root:

```ts
export const metadata: Metadata = {
  metadataBase: ...,
  title: ...,
  description: ...,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};
```

#### `scripts/generate-icons.ts` — one-shot

Genera placeholders (texto "MC" sobre fondo `mundo-blue`):

- `/public/icons/icon-192.png`
- `/public/icons/icon-512.png`
- `/public/icons/icon-512-maskable.png` (mismo con safe-zone padding para maskable)
- `/public/icons/favicon-32.png`
- `/public/icons/apple-touch-icon-180.png`
- `/public/og-default.png` (1200×630, fondo `mundo-blue`, "Mundo Celular" + tagline "Tecnología en Medellín")

**Implementación:**首选 `sharp` (incluido con Next.js como build dep). Si no está disponible como script runtime, fallback a `@resvg/resvg-js` (ligero, nativo, sin deps SaaS). Probar primero `sharp`.

**Secuencia:** el script se ejecuta una vez (`tsx scripts/generate-icons.ts`), los PNGs (~3-5KB c/u, <30KB total) se commitean al repo. El script queda en `scripts/` para regenerar cuando el usuario reemplace el logo.

#### Tests T5

`tests/app/manifest.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("manifest PWA", () => {
  it("tiene iconos 192, 512 y 512 maskable", async () => {
    const { default: manifest } = await import("@/app/manifest");
    const m = manifest();
    expect(m.icons?.find((i) => i.sizes === "192x192")).toBeDefined();
    expect(m.icons?.find((i) => i.sizes === "512x512")).toBeDefined();
    expect(m.icons?.find((i) => i.purpose === "maskable")).toBeDefined();
    expect(m.theme_color).toBe("#143b98");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });
});
```

No hay test de generación del script — es one-shot, se verifica visualmente abriendo los PNGs.

#### Riesgos T5

1. **`sharp` nativo en Windows:** puede requerir build. Si no compila, fallback a `@resvg/resvg-js`.
2. **PNG commit en repo:** ~30KB total, aceptable.
3. **Maskable safe-zone:** contenido del icono maskable debe estar dentro del 80% central. SVG usa rectángulo azul completo + texto "MC" centrado — visible en cualquier máscara (círculo, squircle, etc.).
4. **iOS Safari ignora `manifest`:** usa `<link rel="apple-touch-icon">`. Añadido en `metadata.icons.apple`.
5. **Sin SW:** install-prompt funcional, pero al abrir la app standalone todo carga desde red. Aceptado por el usuario.
6. **`sharp` requiere `await` para rasterizar:** el script usa async/await, ok con `tsx`.

**Definición de hecho (T5):** `src/app/manifest.ts` y `public/icons/icon-{192,512,512-maskable}.png` + `public/og-default.png` existen. `npm test -- tests/app/manifest.test.ts` ✓ pasa.

### Tarea 6 — Lighthouse final

Mismo comando que T2:
- `npx lhci autorun` (con `.lighthouserc.json` existente)
- Escribir `docs/superpowers/reports/2026-07-23-lighthouse-final.md` conmétricas finales + diff cuantitativo vs baseline.

**Métrica de éxito:**

- LCP mejor o igual que baseline (objetivo < 2.5s mobile)
- CLS ≤ 0.1
- INP ≤ 200ms
- SEO score ≥ 95
- Performance score ≥ degradado o igual al baseline

**Definición de hecho (T6):** El reporte MD existe y muestra comparación cuantitativa con baseline.

### Tarea 7 — Fixes condicionales

Materializa solo si Lighthouse final trae hallazgos urgentes:

| Hallazgo posible                                       | Fix aplicable                                             |
|--------------------------------------------------------|-----------------------------------------------------------|
| LCP > 2.5s en mobile, hero es candidate                | `priority` en HeroProductCard ya en T1; revisar DOM order |
| CLS > 0.1 en imágenes                                  | Ya arreglado por T1; verificar fuentes/banners dinámicos |
| Render-blocking JS de Firebase                         | Import dinámico de `firebase/app`                         |
| Textos sin `font-display: swap`                        | Revisar `next/font/google` config                         |
| Cache headers ausentes                                 | `Cache-Control` en middleware o `next.config.ts`          |

**Si Lighthouse final sale verde → Tarea 7 se cierra como "no aplicable"**, documentado en el reporte final. No se commitea nada.

**Si hay findings → fix, commit, re-correr Lighthouse para confirmar.**

### Verificación final de F7

| Check                                  | Esperado                                                    |
|----------------------------------------|------------------------------------------------------------|
| `npx tsc --noEmit`                     | ✓ sin errores                                              |
| `npm run lint`                         | ✓ 0 warnings `no-img-element` en storefront/ y producto/   |
| `npm test`                             | ✓ 109 + nuevos (≥112) tests pasan                          |
| `npx next build` (webpack, sin turbopack) | ✓ Compiled successfully (prerender puede fallar sin .env.local — documentado) |
| Manifest servido en `/manifest.webmanifest` | ✓ accesible                                            |
| `og-default.png` existe                | ✓ en `public/`                                             |
| `icon-{192,512,512-maskable}.png` existen | ✓ en `public/icons/`                                       |

## Riesgos totales del plan

1. **Bloqueo por `.env.local` ausente:** T2 y T6 miden dev, no prod. Mitigación: reportes documentan explícitamente que es baseline dev.
2. **Bloqueo por `R2_PUBLIC_URL` ausente:** `next/image` falla en runtime sin remotePatterns válido. Mitigación: fallback `r2.dev` en config default.
3. **`@vercel/og` no genera PNG estático:** alternativa `sharp` o `@resvg/resvg-js`. Resolvedor en implementación T5.
4. **`useReportWebVitals` API:** importar desde `next/web-vitals` en Next 15.5.20. Verificar al implementar T4.
5. **T3→T5 referencia forward:** T3 commita código que referencia `/og-default.png` (path estático). Si la imagen no existe todavía, fallback OG sin image. En runtime post-T5, muestra imagen. No hay race; feature-progression normal.
6. **Turbopack vs webpack:** el script `npm run build` sigue usando `--turbopack`. Turbopack no respeta `serverExternalPackages` para firebase-admin (bug F6). La verificación F7 usa `npx next build` (webpack). Documentar en AGENTS.md que build de CI/deploy debe usar webpack, no turbopack.

## Dependencias nuevas

- `@lhci/cli@0.14` (devDep, T2+T6) — CLI local, sin SaaS.
- `sharp` o `@resvg/resvg-js` (devDep, T5) — solo si `sharp` incluido con Next no es accesible via script.

**Sin** deps SaaS. Sin upgrades de prod deps. Alineado con cost-intelligence.

## Impacto esperado

- LCP storefront se reduce (imágenes optimizadas, `priority` en hero, `sizes` calibrados para servir ancho correcto).
- CLS de imágenes desaparece (next/image reserva box).
- SEO on-page mejorado (OG/Twitter completo → mejor preview en RRSS, WhatsApp).
- Schema Product enriquecido (`sku`).
- Telemetría real de CWV en producción (logs estructurados).
- PWA instalable en mobile (banner "Agregar a pantalla de inicio".)
- 3 warnings de lint eliminados (no-img-element).

## Apéndice — Relación con skills aplicadas

- **brainstorming** (Superpowers): usado para diseño iterativo con preguntas+toma de decisiones.
- **cost-intelligence** (Reops): aplicado al elegir LHCI local (sin SaaS), no Firestore para vitals, no Datadog.
- **frontend-craft**: aplicado en T1 (next/image con `sizes` y `priority` calibrados, no solo sustitución ciega).
- **security-baseline**: aplicado al no inventar ratings/PII en vitals, documentar limitaciones sin auth en endpoint.
