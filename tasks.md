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
- [ ] Fase 3 — Checkout WhatsApp + Worker /pedidos
- [ ] Fase 4 — Imágenes R2 + Worker presign
- [ ] Fase 5 — Pulido mobile + /contacto /reparaciones /preguntas + auditoría CWV/WCAG
