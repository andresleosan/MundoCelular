# Lighthouse Producción — Mundo Celular

**Fecha:** 2026-08-01  
**Comando:** `next build && next start` (localhost:3000)  
**Preset:** desktop (`throttling.cpuSlowdownMultiplier: 1`, sin throttling CPU)  
**Runs:** 3 por URL, navegador: Chromium headless

## URLs evaluadas

| URL | Performance | A11y | BP | SEO |
|---|---|---|---|---|
| `/` (Home) | 100 / 100 / 99 | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 |
| `/reparaciones` | 99 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 |
| `/contacto` | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 |
| `/preguntas` | 100 / 100 / 100 | 98 / 98 / 98 | 100 / 100 / 100 | 100 / 100 / 100 |

## Core Web Vitals (mediana de las 3 runs)

| URL | FCP (ms) | LCP (ms) | TBT (ms) | CLS |
|---|---|---|---|---|
| `/` | 212 | 819 | 0 | 0 |
| `/reparaciones` | 211 | 820 | 0 | 0 |
| `/contacto` | 411 | 778 | 0 | 0.002 |
| `/preguntas` | 208 | 812 | 0 | 0 |

## Observaciones

- **Performance 99-100** en todas las páginas — supera el objetivo (>90).
- **A11y 98-100** — `/preguntas` baja a 98 (un solo audit específico; páginas con `<details>`). No es regresión.
- **Best Practices y SEO: 100** constante.
- **LCP < 1s** en desktop — excelente.
- **CLS ≤ 0.002** — no hay layout shift visible.
- **TBT 0ms** — sin bloqueo del hilo principal.

## Conclusión

El sitio en producción pasa Lighthouse con puntajes **casi perfectos**. Las páginas son estáticas (SSG/ISR) y están optimizadas con `next/image`, fuentes self-hosted vía `next/font/google`, y bundle compartido de 340 kB (sin código muerto por el tree-shaking de Turbopack).

Reportes HTML completos en `docs/lighthouse-reports/`.
