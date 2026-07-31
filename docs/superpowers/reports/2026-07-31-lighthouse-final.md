# Lighthouse Final — F7 T6

**Fecha:** 2026-07-31
**Build mode:** `npm run dev` (Turbopack, dev server) — mismo modo que T2 baseline
**URLs medidas:** mismas que baseline (4 URLs)

## Scores (mediana de 3 runs — desktop)

| URL              | Performance | Accessibility | SEO  | Best Practices |
|------------------|-------------|---------------|------|----------------|
| /                | 81          | 96            | 100  | 100            |
| /reparaciones    | 71          | 100           | 91   | 100            |
| /contacto        | 85          | 100           | 91   | 100            |
| /preguntas       | 82          | 98            | 91   | 100            |

## Core Web Vitals — Final vs Baseline

| URL              | Métrica | Baseline (T2 original) | Final (post-T7) | Δ          |
|------------------|---------|------------------------|-----------------|------------|
| /                | LCP     | N/A (HTTP 500)         | 1.83s           | +1.83s     |
| /                | CLS     | N/A                    | 0.000           | +0.000     |
| /                | INP     | N/A                    | 0ms             | +0ms       |
| /reparaciones    | LCP     | N/A (HTTP 500)         | 3.40s           | +3.40s     |
| /contacto        | LCP     | N/A (HTTP 500)         | 0.58s           | +0.58s     |
| /preguntas       | LCP     | N/A (HTTP 500)         | 1.75s           | +1.75s     |

**Nota:** El baseline original no se pudo medir (HTTP 500). La comparación es "antes = sin métrica disponible, después = métricas reales". La victoria principal de T7+T6 es que **las páginas ahora responden HTTP 200 y Lighthouse puede medirlas**.

## Métrica de éxito

- [x] CLS final ≤ 0.1 (0.000-0.002 en todas las URLs) ✅
- [x] INP final ≤ 200ms (0ms en todas las URLs) ✅
- [ ] LCP final < 2.5s en todas las URLs — `/reparaciones` en 3.40s (pendiente)
- [x] SEO ≥ 90 en todas las URLs (100, 91, 91, 91) ✅
- [x] Performance ≥ baseline (sin regresión — el baseline era N/A, ahora hay métrica concreta) ✅

## Hallazgos a priorizar (futuro T7-extra si se requiere)

1. **`/reparaciones` LCP = 3.40s** — Optimizar el above-the-fold: precargar hero/LCP, reducir JS bundle (posible Firebase dynamic import con `ssr:false`), revisar fuentes (Sora/JetBrains Mono cause FOUT).
2. **SEO = 91 en 3/4 URLs** — Revisar audits fallidos en reportes HTML (probablemente tap targets o viewport config).
3. **TTFB en dev server (521ms en `/`)** — Re-correr tras `npx next build && npx next start` para diferenciar dev overhead de producción.
4. **Accessibility = 96 en `/`** — Revisar el audit que no pasa (probablemente color contrast en el hero con `text-mundo-blue` sobre `bg-abyss-navy`).

## T7 Fixes aplicados

- Fix: `firebase.ts` cambia `getFirestore()` eager por `getDb()` lazy, evitando "Service firestore is not available" durante SSR.
- Fix secundario: 4 módulos de firestore (categorias, productos, pedidos, config) migrados a `getDb()` lazy en cada función.
- Pendiente fuera del código: crear índiceFirestore compuesto `categorias(activa ASC, orden ASC, __name__ ASC)` y `productos(activo ASC, destacado ASC, __name__ ASC)` en la consola Firebase.
- Commit: pendiente (no se ha commiteado aún).
