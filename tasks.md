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
