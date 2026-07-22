# AGENTS.md — Mundo Celular

E-commerce de tecnología (celulares, accesorios, consolas) en Medellín, Colombia. Pedidos vía WhatsApp, sin gateway de pago.

## Stack

- Next.js 15 (App Router, Turbopack), React 19, TypeScript 5, Tailwind v4
- Firebase 12 (client) + firebase-admin 14 (server): Auth Google, Firestore
- Cloudflare R2 para imágenes (S3 API)
- Vitest 4 para tests, jsdom, `@testing-library/react`
- Windows PowerShell 5.1 (sin WSL/bash nativo)

## Comandos

```powershell
npm run dev              # next dev --turbopack (localhost:3000)
npm run build            # next build --turbopack
npm run lint            # eslint
npm test                # vitest run --passWithNoTests
npm run test:rules      # vitest run --config vitest.rules.config.ts (Firestore rules, requiere emulador)
npm run seed:config     # tsx scripts/seed-config.ts
npm run set:admin -- <uid>  # tsx scripts/set-admin.ts
```

**Verificación antes de commit:** `npx tsc --noEmit` (TypeScript check). El build completo es lento (~3min en drive de red).

## Convenciones

- **Idioma:** UI y commits en español (Colombia). Commits convencionales: `feat(f5-t1): ...`, `fix(f3): ...`
- **Moneda:** COP entero (sin decimales), locale `es-CO`
- **Accent color:** `#143b98` (`mundo-blue`) SOLO en botón WhatsApp, wordmark y search submit. No usar en otros componentes.
- **Tokens de diseño:** Definidos en `src/app/globals.css` bajo `@theme`. Usar classes de Tailwind (`text-mundo-blue`, `rounded-cards`, etc.), no hex directo.
- **Rutas:** `@/*` → `src/*` (alias en tsconfig)
- **Fuentes:** Sora (body) y JetBrains Mono (código) vía `next/font/google` con CSS variables

## Arquitectura

```
src/
  app/
    layout.tsx          # Root layout: Header + AuthProvider + Footer + BottomTabBar
    page.tsx            # Home: Hero + categorías + destacados + reparaciones banner
    api/                # API routes (POST /pedidos, /imagenes/presign, /buscar, etc.)
    admin/              # Panel admin (CRUD productos/categorías/pedidos/config)
    [categoria]/        # Páginas de categoría (SSG + ISR)
    [producto]/         # Páginas de producto (SSG + ISR)
    contacto/           # Datos tienda + mapa + CTA WhatsApp
    preguntas/          # 8 FAQ con <details>/<summary> + FAQPage schema
    reparaciones/       # Servicios con precios + CTA WhatsApp
    carrito/            # Carrito persistente (localStorage)
    checkout/           # Formulario → WhatsApp
    buscar/             # Búsqueda full-text
  components/
    layout/             # Header, Footer, BottomTabBar (mobile-only, hidden sm:)
    storefront/         # Hero, ProductCard, CategoryPill, SearchInput
    admin/              # ImageUploader, ProductoForm, etc.
    producto/           # ProductDetail (galería con thumbnails)
    seo/                # JsonLd component
    auth/               # AuthProvider
  hooks/                # useCarrito (localStorage), useAuth, useImageUpload
  lib/
    firestore/          # Capa de datos: productos, categorias, pedidos, config, public.ts
    seo/                # metadata.ts + jsonld.ts (generadores por página)
    r2.ts               # Cliente S3 para Cloudflare R2
    image-compress.ts   # Resize + WebP via canvas API (client-side)
    format.ts           # formatearCOP, slugify
    validacion.ts       # Zod schemas (ProductoInput, PedidoInput)
    firebase.ts         # Firebase client init (degrada auth a null sin API key)
    firebase-admin.ts   # Firebase Admin init (verifica token en API routes)
  types/index.ts        # Categoria, Producto, ImagenProducto, Pedido, ConfigTienda
```

## Seguridad

- `.env.local` gitignored. Nunca commitear credenciales.
- API routes verifican Firebase ID token (`firebase-admin.ts`). Admin endpoints check claim `admin: true`.
- `FIREBASE_PRIVATE_KEY` usa formato `\n`-escaped en una línea.
- R2 credentials: S3 Access Key + Secret Key (diferentes del API token de Cloudflare).

## Datos

- **Productos:** `imagenes[]` con `{url, thumb, alt}` — subidas a R2 via presigned URLs.
- **Config tienda:** `configuracion/tienda` en Firestore. Valores default hardcodeados como fallback.
- **Carrito:** localStorage (`mundocelular-carrito`), no persiste entre dispositivos.
- **Pedidos:** Firestore colección `pedidos`, estados: pendiente → contactado → cerrado/cancelado.

## Gotchas

- **Drive de red lento:** El warning "Slow filesystem" es normal. Builds tardan ~3min.
- **WSL2 no disponible:** No usar bash scripts, usar PowerShell.
- **No hay Firebase Storage:** Las imágenes van a Cloudflare R2.
- **No hay gateway de pago:** El checkout redirige a WhatsApp con el pedido armado.
- **BottomTabBar:** Solo visible en mobile (`sm:hidden`), body tiene `pb-20 sm:pb-0`.
- **ISR:** Home y categorías revalidan cada 3600s. Productos se revalidan bajo demanda.
