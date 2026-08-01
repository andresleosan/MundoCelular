# Tareas — Mundo_Celular

Spec: docs/superpowers/specs/2026-07-19-mundocelular-mvp-design.md
Plan Fase 1: docs/superpowers/plans/2026-07-19-fase1-base-admin.md

## Fase 1 — Base + Admin
- [x] Scaffold Next.js + tokens de diseño
- [x] Utilidades slug + formato COP
- [x] Firebase client/admin + tipos
- [x] Auth Google + claim admin
- [x] Reglas Firestore + tests emulador
- [x] Capa de datos + /api/revalidate
- [x] Shell admin + CRUD categorías + CRUD productos
- [x] Config tienda + scripts seed/set-admin

## Pendiente para usar el panel
- [ ] Crear proyecto Firebase + Auth Google + Firestore
- [ ] Copiar credenciales a .env.local
- [ ] `npx firebase deploy --only firestore:rules`
- [ ] Login en /admin/login, copiar UID, `npm run set:admin -- <uid>`
- [ ] `npm run seed:config`

## Fase 2 — Catálogo público SSG + SEO + carrito
- [x] Lecturas servidor con unstable_cache
- [x] Generadores metadata + JSON-LD (TDD)
- [x] sitemap.xml + robots.txt
- [x] Home ISR + schemas
- [x] Página categoría ISR
- [x] Página producto ISR + CTA WhatsApp + add to cart
- [x] Buscador /buscar + header
- [x] Carrito persistente + /carrito + footer
- [x] Placeholders contacto/reparaciones/preguntas
- [x] Cierre F2: seo integration tests + admin not-found + categoria index

## Fases siguientes
- [x] Fase 3 — Checkout WhatsApp + Worker /pedidos
  - [x] Helper armarmensajePedido + urlWhatsApp (TDD)
  - [x] API Route POST /api/pedidos (transacción stock+pedido)
  - [x] API Route POST /api/pedidos/[id]/cancelar (rep stock, admin only)
  - [x] Checkout page /checkout (form retiro/domicilio)
  - [x] Carrito → checkout (botón "Proceder al checkout")
  - [x] Panel admin /admin/pedidos (lista + detalle + estados)
  - [x] Firestore pedidos.ts (listar, obtener, actualizarEstado)
- [x] Fase 4 — Imágenes R2 + Worker presign
  - [x] @aws-sdk/client-s3 + s3-request-presigner instalados
  - [x] r2.ts: cliente S3 singleton + R2_BUCKET + R2_PUBLIC_URL
  - [x] API /api/imagenes/presign (POST, admin-only) — signed URL PUT
  - [x] API /api/imagenes/[key] (DELETE, admin-only) — borra de R2
  - [x] image-compress.ts: resize + WebP canvas API (1600px full, 600px thumb)
  - [x] useImageUpload hook: compress → presign → upload flow
  - [x] ImageUploader component: drag/drop, preview, reorder, alt, max 5
  - [x] ProductoForm: incluye ImageUploader, guarda imagenes[]
  - [x] validacion.ts + firestore/productos.ts: campo imagenes
  - [x] ProductDetail: galería con thumbnails laterales
  - [x] HeroProductCard + ProductCard: usan thumb para performance
- [x] Fase 5 — Pulido mobile + /contacto /reparaciones /preguntas + auditoría CWV/WCAG
  - [x] BottomTabBar — navegación mobile con 4 ítems
  - [x] Layout — BottomTabBar + body padding mobile
  - [x] SEO metadata — /contacto y /preguntas
  - [x] JSON-LD — ContactPoint + FAQPage
  - [x] Página /contacto — datos tienda + mapa + CTA WhatsApp
  - [x] Página /preguntas — 8 FAQ con schema FAQPage
  - [x] /reparaciones — servicios con precios + CTA WhatsApp prellenado
  - [x] Home — sección reparaciones banner CTA
  - [x] Footer — links a /contacto y /preguntas
  - [x] Verificación final — build OK (25 páginas) + auditoría WCAG

## Fase 7 — Core Web Vitals + SEO + PWA
- [x] T1 — Migración `<img>` → `<Image>` en storefront (HeroProductCard, ProductCard, ProductDetail)
- [x] T2 — Lighthouse baseline (documentado en `docs/superpowers/reports/2026-07-31-lighthouse-baseline.md`) — bloqueado por HTTP 500 → resuelto en T7
- [x] T3 — SEO enrichment: OG/Twitter metadata + sku en schema Product
- [x] T4 — Web Vitals analytics: hook useReportWebVitals + endpoint /api/vitals
- [x] T5 — PWA manifest + iconos placeholder + og-default.png
- [x] T6 — Lighthouse final + comparación con baseline (reporte `2026-07-31-lighthouse-final.md`) — métricas reales obtenidas
- [x] T7 — Fixes condicionales: `getDb()` lazy en `firebase.ts` + 4 módulos firestore — resuelve HTTP 500 y permite Lighthouse medir

### Hallazgos fuera del código (pendientes operatorios)
- [ ] Crear índice Firestore compuesto `categorias(activa ASC, orden ASC, __name__ ASC)`
- [ ] Crear índice Firestore compuesto `productos(activo ASC, destacado ASC, __name__ ASC)`
- [ ] Re-correr Lighthouse en producción (`npx next build && npx next start`) para diferenciar dev overhead

## Fase 3 (segunda iteración) — Variantes de producto
Spec: `docs/superpowers/specs/2026-07-31-fase3-variantes-design.md`
Plan: `docs/superpowers/plans/2026-07-31-fase3-variantes.md`
- [x] T1 — Tipos `VarianteProducto` + `validarVariante` (TDD)
- [x] T2 — CRUD Firestore variantes (`src/lib/firestore/variantes.ts`)
- [x] T3 — Función pública `obtenerVariantesPorProducto` con `unstable_cache`
- [x] T4 — API admin `/api/admin/variantes` (POST, GET, PUT, DELETE) + helper `verificarAdmin` compartido
- [x] T5 — `ProductoForm` admin con switch `tieneVariantes` + input `atributosDisponibles`
- [x] T6 — `ProductDetail` con selector de variantes (chips/selects) + galería reactiva + precio dinámico
- [x] T7 — `useCarrito` extendido con `varianteId` y `atributos` por item
- [x] T8 — `CarritoItem` muestra atributos entre paréntesis
- [x] T9 — `CheckoutForm` + `/api/pedidos` envían `varianteId` y `atributos`; stock descuenta de variante
- [x] T10 — `ProductCard` / `HeroProductCard` muestran "Desde $X" cuando hay variantes
- [x] T11 — Reglas Firestore colección `variantes` (público read, admin write) + tests
- [x] T12 — Verificación final: 146 tests pasan, tsc limpio, lint sin errores nuevos

### Pendientes operatorios Fase 3 (variantes)
- [x] Desplegar reglas Firestore actualizadas (`npm run deploy:firestore`)
- [x] Crear índice compuesto `variantes(productId ASC, activo ASC, precio ASC)` (`firestore.indexes.json`)

## Rediseño Premium v2
Spec: `docs/superpowers/specs/2026-07-31-rediseno-premium-v2-design.md` (pendiente)
Plan: `docs/superpowers/plans/2026-07-31-rediseno-premium-v2.md` (pendiente)
- [x] T1 — Tokens migrados (Inter Tight + Inter, primary `#1E4FA8`)
- [x] T2 — Hooks creados (`useScrollAnimation`, `useParallax`)
- [x] T3 — `<Icon>` con 13 SVGs
- [x] T4 — `AuthModal` + Header premium con glassmorphism + scroll listener + nav anchors
- [x] T5 — Home Page Rebuild (hero split, marcas, ofertas, beneficios)
- [x] T6 — ProductDetail premium (layout 2 cols, galería, CTAs, mobile sticky CTA)
