# Lighthouse — F7 (Baseline + Final post-T7)

**Fecha:** 2026-07-31
**Build mode:** `npm run dev` (Turbopack, dev server)
**URLs medidas:**
- http://127.0.0.1:3000/
- http://127.0.0.1:3000/reparaciones
- http://127.0.0.1:3000/contacto
- http://127.0.0.1:3000/preguntas

## Contexto

- **T2 Baseline original:** Falleció con HTTP 500 (ERRORED_DOCUMENT_REQUEST) en todas las URLs. Reportado en `docs/superpowers/reports/2026-07-31-lighthouse-baseline.md`.
- **Causa raíz:** `firebase.ts` llamaba `getFirestore()` al evaluar el módulo durante SSR; el SDK cliente lanza `Service firestore is not available` cuando se importa desde un Server Component (AuthProvider). Aunque las páginas storefront sí tenían degradación graceful en el código de página, el layout vecino propagaba el error al 500.
- **T7 Fix aplicado:** Cambio de `export const db = getFirestore(app)` a `export function getDb(): Firestore` (lazy). Los 4 módulos cliente (`categorias.ts`, `productos.ts`, `pedidos.ts`, `config.ts`) ahora llaman `getDb()` dentro de cada función en vez de al evaluar el módulo.

## Scores (mediana de 3 runs — desktop)

| URL              | Performance | Accessibility | SEO  | Best Practices |
|------------------|-------------|---------------|------|----------------|
| /                | 81          | 96            | 100  | 100            |
| /reparaciones    | 71          | 100           | 91   | 100            |
| /contacto        | 85          | 100           | 91   | 100            |
| /preguntas       | 82          | 98            | 91   | 100            |

## Core Web Vitals (mediana de 3 runs)

| URL              | LCP (s) | CLS   | INP (ms) | FCP (s) | TTFB (ms) |
|------------------|---------|-------|----------|---------|-----------|
| /                | 1.83    | 0.000 | 0        | 0.31    | 521       |
| /reparaciones    | 3.40    | 0.000 | 0        | 0.29    | 59        |
| /contacto        | 0.58    | 0.002 | 0        | 0.46    | 56        |
| /preguntas       | 1.75    | 0.000 | 0        | 0.29    | 61       |

## Métrica de éxito

- [x] CLS ≤ 0.1 en todas las URLs (0.000-0.002) ✅
- [x] INP ≤ 200ms en todas las URLs (0ms) ✅
- [x] Performance ≥ 80 en 3/4 URLs (81, 85, 82) — `/reparaciones` en 71 (pendiente optimizar)
- [ ] LCP < 2.5s en todas las URLs — `/reparaciones` en 3.40s (CRÍTICO), `/` en 1.83s OK
- [x] SEO ≥ 90 en todas las URLs (100, 91, 91, 91) ✅

## Top 5 hallazgos

1. **`/reparaciones` LCP = 3.40s** — Above the threshold (2.5s). Probablemente relacionado con la precarga del hero/LCP en el dev server. A investigar en producción (webpack build) para diferenciar dev overhead de problema real.

2. **`/` LCP = 1.83s** — Dentro del threshold pero alto para una home sin datos dinámicos (las categorías/destacados fallan en Firestore). Si hubiera imágenes reales de productos, LCP podría subir por carga de R2.

3. **SEO = 91 en 3 URLs** — No llega a 100. Posible causa: falta de `<meta name="viewport">` adecuada o un detalle en canonical/robots. Revisar el reporte HTML para identificar el audit fallido.

4. **Accessibility = 96-100** — Bueno en general. `/` en 96 sugiere 1-2 issues menores (probablemente color contrast o button name). Revisar el reporte HTML.

5. **TTFB alto en `/` (521ms)** — En dev server es esperado (compilación turbopack on-the-fly). En producción (build webpack) debería bajar significativamente.

## Notas

- Todas las mediciones son en dev server con Turbopack, desarrollando en drive de red lento (~3min builds).
- El índice compuesto de Firestore `categorias(activa, orden, __name__)` sigue sin crear — las páginas storefront renderizan el shell (header, hero, footer, categorías vacías, destacados vacíos) pero no muestran datos de catálogo.
- Para métricas defintivas de producción, re-correr Lighthouse tras `npx next build && npx next start` con `.env.local` poblado y el índice Firestore creado.
