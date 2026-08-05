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
- [x] Crear proyecto Firebase + Auth Google + Firestore
- [x] Copiar credenciales a .env.local
- [x] `npx firebase deploy --only firestore:rules`
- [x] Login en /admin/login, copiar UID, `npm run set:admin -- <uid>`
- [x] `npm run seed:config`

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
- [x] Crear índice Firestore compuesto `categorias(activa ASC, orden ASC, __name__ ASC)`
- [x] Crear índice Firestore compuesto `productos(activo ASC, destacado ASC, __name__ ASC)`
- [x] Re-correr Lighthouse en producción (`npx next build && npx next start`) para diferenciar dev overhead — reporte `docs/superpowers/reports/2026-08-01-lighthouse-produccion.md`: Performance 99-100, A11y 98-100, BP/SEO 100

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
- [x] T7 — Carrito premium (layout 2 cols, item cards, resumen sticky, estado vacío SVG)
- [x] T8 — Checkout premium (layout 2 cols, cards, radio redesign, inputs premium)

## Auditoría Admin-Firestore-Home-Marcas

**Estado: revisión**

- [x] Tasks 1-4 y correcciones QA verificadas con la suite completa: 187/187 pruebas pasan.
- [x] TypeScript y build Turbopack verificados.
- [x] Lint global sin errores; se corrigió el `any` preexistente de `scripts/create-test-users.ts` con `unknown` y type guard mínimo.
- [x] Expectativas obsoletas de `ProductoForm` actualizadas a roles accesibles reales, sin cambiar lógica de negocio.
- [x] QA pública en `localhost:3000` verificada en `1440x900`, `1024x768` y `390x844`: 30/30 rutas responden `200`, sin overflow ni errores de consola.
- [x] Fondo animado del teléfono y seis tarjetas de marcas restaurados y verificados durante el scroll.
- [x] Flujo CRUD Admin-Firestore autenticado verificado con fixture temporal y limpieza posterior.
- [x] Indices remotos verificados; no se requiere despliegue adicional para las consultas actuales.
- [x] Decision e implementacion de rate limiting distribuido antes de escalar a varias instancias.

Reporte: `docs/superpowers/reports/2026-08-03-auditoria-admin-firestore-home-marcas.md`

## Auditoria Local-Produccion Firebase

**Estado: `revision`**

- [x] Configuración Production de Vercel y variable pública R2 completadas sin imprimir secretos.
- [x] Post-redeploy público verificado: imagen R2, Home, búsqueda, categoría, marca y producto responden con inventario real.
- [x] Fix `firebase-admin@13.10.0` promovido y `/api/revalidate` verificado en Vercel: token inválido devuelve `401`.
- [x] Contrato de variables documentado sin imprimir valores; `.firebaserc` y Firebase CLI apuntan a `mundocelular-id`.
- [x] Nombres y targets de las variables privadas de Vercel verificados sin leer valores: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` estan en `Production`.
- [x] Índices remotos consultados en modo lectura; el índice `productos(activo ASC, creadoEn DESC)` no es requerido por el ordenamiento manual actual.
- [x] Evidencia de smoke HTTP y matriz pública registrada sin escrituras; la QA manual de esta sesión comprobó imagen y rutas de catálogo.
- [x] Suite local verificada: 222/222 tests, TypeScript y build sin errores; lint con 11 warnings y auditoria con 17 vulnerabilidades.
- [x] Producto de prueba, CRUD admin autorizado, Google OAuth real y reporte HTML E2E persistido verificados; queda documentada la URL historica inmutable.

Reporte: `docs/superpowers/reports/2026-08-03-auditoria-local-produccion-firebase.md`

## Solicitudes de administrador

**Estado: aprobada**

- [x] Registrar solicitudes desde el acceso de Administrador sin permisos.
- [x] Listar solicitudes pendientes en `/admin/usuarios`.
- [x] Aprobar o rechazar solicitudes y conservar claims personalizados.
- [x] Validar API, reglas Firestore, fechas serializadas y limite de solicitudes.
- [x] Verificar: 292/292 tests, 11/11 reglas, TypeScript, lint y build.
- [x] Actualizar solicitudes sin recargar el panel (refresco manual y cada 15 s).
- [x] Revisar y actualizar dependencias con vulnerabilidades reportadas por `npm audit`; los 5 `high` restantes pertenecen a herramientas de desarrollo y quedan documentados sin usar `--force`.
- [x] Migrar el limite de `POST /api/auth/admin-request` a Firestore transaccional: 5 solicitudes por UID cada 60 segundos, expiracion, `Retry-After` y fail-closed `503`.

### Cierre de publicación — 2026-08-05

- [x] Gate local posterior a la implementación: `308/308` pruebas, reglas `12/12`, TypeScript correcto, lint con 0 errores y build correcto con 29 rutas.
- [x] Auditoría runtime: 0 vulnerabilidades `high` y 0 `critical`; las 8 `moderate` transitorias de `uuid` quedan documentadas sin `npm audit fix --force`.
- [x] Publicar `main` en `origin/main` (`51e3e45`).
- [x] Verificar deployment Vercel `dpl_5z6REAtgcJajgakmpDD8jyqqMT6c` en estado `Ready`.
- [x] Verificar `POST /api/auth/admin-request` sin token: `401` y error sanitizado.
- [x] Aceptar la excepción histórica de la deployment inmutable `dt5...` como riesgo operativo no bloqueante.

### Estado de cierre operativo — 2026-08-05

- [x] OP-04 y OP-07 completadas con evidencia local, E2E y remota.
- [x] Estado global actualizado a `completada`.
- [x] Funcionalidades `FUT-*` quedan fuera del cierre y disponibles para una siguiente iteración.

Diseño: `docs/superpowers/specs/2026-08-04-solicitudes-administrador-design.md`
Plan: `docs/superpowers/plans/2026-08-04-solicitudes-administrador.md`
Diseño distribuido: `docs/superpowers/specs/2026-08-05-rate-limit-distribuido-design.md`
Plan distribuido: `docs/superpowers/plans/2026-08-05-rate-limit-distribuido.md`

## FUT-01 - Historial de pedidos del cliente

**Estado: revision**

- [x] Ruta `/cuenta/pedidos` con acceso por sesion, lista paginada, detalle privado y enlace a WhatsApp.
- [x] Reglas probadas: propietario y admin pueden consultar; otro cliente queda denegado.
- [x] Indice local declarado: `pedidos(clienteUid ASC, creadoEn DESC)`.
- [x] WhatsApp canonico actualizado en defaults, seed, CTAs y pruebas a `573147757223`.
- [x] QA local: `318/318` pruebas, reglas `13/13` en emulador aislado, TypeScript, lint sin errores, build con 30 rutas y navegador desktop/mobile sin overflow.
- [x] Flujo de login corregido: `/login` renderiza el formulario y el cliente vuelve a `/cuenta/pedidos` despues de autenticarse.
- [x] Desplegar el indice Firestore con autorizacion explicita del operador (`npm run deploy:indexes` exitoso en `mundocelular-id`).
- [x] Ejecutar `npm run backup:config` (antes y despues) y `npm run update:whatsapp` con autorizacion explicita del operador; el backup posterior confirma `573147757223` remoto.
- [x] Publicar `main` en `origin/main` (`386e335`) y verificar deployment Vercel `dpl_4Hk1p487T86BgP9CvyUGuJCPzhEJ` en estado `Ready`.
- [x] Verificar CTAs publicos en produccion: 6 rutas responden `200` y todos los enlaces `wa.me` usan `573147757223`; el numero anterior ya no aparece en el texto.
- [ ] QA autenticada con cuenta de cliente QA: no se ejecuto porque `.env.local` no define `QA_*` y las cuentas QA historicas estan deshabilitadas; requiere habilitar una cuenta de cliente de prueba con pedidos o autorizacion para crear un fixture.
