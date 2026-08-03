# Design — Tema navy global + Fix deploy Vercel (skeleton)

**Fecha:** 2026-08-02
**Proyecto:** Mundo Celular
**Estado:** Aprobado por el usuario

## Contexto

El usuario quiere que toda la página use el azul `#001B5B` (azul marino oscuro), extraído de la imagen `C:\Users\USER\Downloads\azul.png` (color dominante `#001B5B`). La home, header y footer ya son navy; las páginas restantes (categoría, producto, contacto, preguntas, reparaciones, carrito, checkout, buscar, not-found) siguen con fondo blanco.

Además, el deploy en Vercel falla: `Module not found: Can't resolve '@/components/ui/skeleton'` en 7 archivos del admin.

## Requisitos

- Fondo navy `#001B5B` en **toda la página** (todas las páginas públicas).
- El panel admin se mantiene claro (blanco).
- No interferir con las imágenes interactivas del fondo del hero (`Armado1.png`, `Desarmadom1.png`, `Desarmado1.png` en `src/components/storefront/Hero.tsx:88-118`) — ya funcionan con `mix-blend-mode: screen` sobre fondo navy, no se tocan.
- Resolver el incidente de deploy de Vercel.

## Parte 1 — Tema navy en tokens (`src/app/globals.css`)

Voltear `:root` a modo oscuro navy:

| Token | Valor actual | Nuevo valor |
|---|---|---|
| `--background` | `#FFFFFF` | `#001B5B` |
| `--foreground` | `#0A0F1F` | `#F5F7FB` |
| `--card` | `#FFFFFF` | `#00246E` |
| `--card-foreground` | `#0A0F1F` | `#F5F7FB` |
| `--popover` | `#FFFFFF` | `#00246E` |
| `--popover-foreground` | `#0A0F1F` | `#F5F7FB` |
| `--secondary` | `#FAFAFA` | `#00246E` |
| `--secondary-foreground` | `#0A0F1F` | `#F5F7FB` |
| `--muted` | `#FAFAFA` | `#00246E` |
| `--muted-foreground` | `#5A6478` | `#8A93B3` |
| `--accent` | `#E0F4FF` | `#0035A8` |
| `--accent-foreground` | `#001B5B` | `#F5F7FB` |
| `--border` | `#E8E8E8` | `rgba(255,255,255,0.12)` |
| `--input` | `#E8E8E8` | `rgba(255,255,255,0.15)` |
| `--sidebar` | ya navy | sin cambios |
| `--primary` | `#001B5B` | sin cambios |
| `--ring` | `#00D4FF` | sin cambios |

Las páginas públicas usan tokens shadcn (`bg-background`, `text-foreground`, `bg-card`, etc.), por lo que se adaptan automáticamente. Home/header/footer quedan igual (ya navy).

## Parte 2 — Aislamiento del panel admin

`src/app/admin/layout.tsx` envuelve su contenido con un scope que restaura los tokens claros (`--background: #FFFFFF`, `--foreground: #0A0F1F`, `--card: #FFFFFF`, etc.) para que el panel se mantenga claro. El admin NO se toca más allá de este aislamiento.

## Parte 3 — Ajustes puntuales por hardcodeos

Sitios con colores fijos que rompen sobre fondo navy (~10 sitios según grep):

- `src/app/reparaciones/page.tsx` — `bg-white`, `bg-canvas-frost`, `text-gray-900`, `border-faint-border`
- `src/app/contacto/page.tsx` — `bg-white`, `text-ink-navy`, `hover:bg-canvas-frost`
- `src/app/preguntas/page.tsx` — `bg-white`
- `src/app/not-found.tsx` — `bg-white`, `text-gray-900`
- `ProductCard` variante `default` (blanca) → usar el estilo navy (`bg-navy-surface/40`, `border-fog-white/10`, texto `text-fog-white`) ya existente en `compact`/`featured`
- Breadcrumbs y `CategoryHeader`, `SearchInput`, detalle de producto, carrito, checkout, buscar: texto `text-text`/`text-steel-blue-gray` → `text-fog-white`/`text-fog-white/70`

Los componentes afectados deben revisarse individualmente; cada página debe quedar legible sobre navy (texto claro, superficies `#00246E`, bordes `fog-white/10`).

## Parte 4 — Fix deploy Vercel (skeleton)

**Causa raíz:** problema de case-sensitivity. En git el archivo es `src/components/ui/Skeleton.tsx` (S mayúscula), pero los 7 archivos lo importan como `@/components/ui/skeleton` (minúscula). Windows es case-insensitive (por eso pasa localmente), pero Linux de Vercel es case-sensitive → module not found.

Archivos afectados:
- `src/app/admin/categorias/[id]/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/pedidos/[id]/page.tsx`
- `src/app/admin/productos/[id]/page.tsx`
- `src/components/admin/AdminUsuarios.tsx`
- `src/components/admin/DataTable.tsx`
- `src/components/ui/sidebar.tsx`

**Solución:** en git reemplazar `Skeleton.tsx` (mayúscula) por `skeleton.tsx` (minúscula, el archivo del shadcn estándar que ya existe en disco). `git rm src/components/ui/Skeleton.tsx` + `git add src/components/ui/skeleton.tsx`. Sin cambios de código.

## Fuera de alcance

- Panel admin (excepto aislamiento de tokens)
- Imágenes interactivas del hero (`Armado1.png`, `Desarmadom1.png`, `Desarmado1.png`)
- Página `/login` (solo redirige a `/`)

## Verificación

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build` local (debe pasar igual que ahora)
- El fix de Vercel se confirma al deployar: la estructura de archivos ya no depende del case-insensitive de Windows
