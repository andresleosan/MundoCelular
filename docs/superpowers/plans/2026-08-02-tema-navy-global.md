# Tema navy global + Fix deploy Vercel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir todo el sitio público al fondo navy `#001B5B` (excepto el panel admin) y resolver el incidente de deploy de Vercel (case-sensitivity de `skeleton.tsx`).

**Architecture:** Se voltean los tokens de color globales (shadcn `:root` + tokens custom `@theme`) a la paleta navy, el panel admin se aísla con un scope CSS que restaura los tokens claros, y se corrigen los pocos colores hardcodeados en páginas públicas. El fix de Vercel es un `git mv` del componente Skeleton a minúscula.

**Tech Stack:** Next.js 15 (App Router, Turbopack), Tailwind v4 (`@theme` en `globals.css`), shadcn tokens, git.

## Global Constraints

- Paleta: `#001B5B` (navy base) · `#00246E` (navy surface) · `#F5F7FB` (fog-white) · `#00D4FF` (glow-cyan) · `#8A93B3` (slate-muted)
- UI y commits en español (Colombia). Commits convencionales: `feat(f3): ...`, `fix(deploy): ...`
- No tocar las imágenes interactivas del hero (`Armado1.png`, `Desarmadom1.png`, `Desarmado1.png` en `src/components/storefront/Hero.tsx:88-118`)
- No tocar el contenido del panel admin (solo su aislamiento de tokens)
- Accent `mundo-blue` (`#001B5B`) solo en WhatsApp/wordmark/search submit — no expandir su uso
- Verificación antes de commit: `npx tsc --noEmit` (build completo lento, ~3min)
- PowerShell 5.1, sin bash

---

### Task 1: Fix deploy Vercel — renombrar Skeleton.tsx a minúscula

**Files:**
- Modify: `src/components/ui/Skeleton.tsx` → `src/components/ui/skeleton.tsx` (renombre en git)

**Interfaces:**
- Consumes: nada (7 archivos ya importan `@/components/ui/skeleton`)
- Produces: el import existente `@/components/ui/skeleton` resuelve en Linux/Vercel (case-sensitive)

- [ ] **Step 1: Verificar el estado actual en git**

```powershell
git ls-files src/components/ui/ | Select-String -Pattern "Skeleton|skeleton"
```

Expected: aparece `src/components/ui/Skeleton.tsx` (mayúscula). En disco existe `src/components/ui/skeleton.tsx` (minúscula, shadcn estándar).

- [ ] **Step 2: Comprobar que los contenidos coinciden (son el mismo componente)**

```powershell
Get-Content src\components\ui\Skeleton.tsx
Get-Content src\components\ui\skeleton.tsx
```

Expected: ambos definen `function Skeleton({ className, ...props }: React.ComponentProps<"div">)`. Si difieren, usar el contenido de `skeleton.tsx` (minúscula, el que está en disco y es el estándar shadcn con `animate-pulse`).

- [ ] **Step 3: Renombrar en git (delete + add, no `git mv` porque ambos archivos existen en disco)**

```powershell
git rm src/components/ui/Skeleton.tsx
git add src/components/ui/skeleton.tsx
```

- [ ] **Step 4: Verificar que el árbol de git solo tiene la versión minúscula**

```powershell
git ls-files src/components/ui/ | Select-String -Pattern "skeleton"
```

Expected: solo `src/components/ui/skeleton.tsx`.

- [ ] **Step 5: Typecheck rápido de los archivos importadores**

```powershell
npx tsc --noEmit
```

Expected: sin errores (no debe haber errores relacionados con skeleton).

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "fix(deploy): renombrar Skeleton.tsx a minúscula para build en Vercel"
```

---

### Task 2: Tokens navy globales en `src/app/globals.css`

**Files:**
- Modify: `src/app/globals.css` (bloque `@theme` líneas 19-49 y `:root` líneas 263-298)

**Interfaces:**
- Consumes: nada (cambios de valores de variables existentes)
- Produces: tokens navy que las páginas públicas usan automáticamente; las clases `text-text`, `bg-surface`, `bg-canvas-frost`, `border-faint-border`, `text-steel-blue-gray`, `bg-bg`, `bg-pure-white` (mantiene), etc. ahora resuelven a la paleta oscura

- [ ] **Step 1: Voltear tokens custom del `@theme` (sección "Fondos y superficies", "Texto" y alias)**

Cambiar en el bloque `@theme`:

```css
  /* --- Fondos y superficies --- */
  --color-bg: #001B5B;
  --color-surface: #00246E;
  --color-surface-elevated: #00246E;
  --color-border-strong: rgba(255, 255, 255, 0.15);

  /* --- Texto --- */
  --color-text: #F5F7FB;
  --color-text-secondary: #8A93B3;
  --color-text-muted: #8A93B3;
```

Y en "Alias de compatibilidad":

```css
  --color-canvas-frost: #00246E;
  --color-pure-white: #FFFFFF;          /* sin cambio: texto sobre botones cyan */
  --color-ink-navy: #F5F7FB;            /* era #0A0F1F: texto oscuro sobre claro → claro sobre navy */
  --color-faint-border: rgba(255, 255, 255, 0.12);
  --color-steel-blue-gray: #8A93B3;
```

Y en "Alias antiguos":

```css
  --color-blue-wash: rgba(0, 212, 255, 0.10);   /* era #E0F4FF: fondo claro → tint cyan sutil */
  --color-mist-blue: #8A93B3;
```

NO cambiar: `--color-primary-dark`, `--color-primary-light`, `--color-accent-glow`, `--color-navy-*`, `--color-glow-cyan*`, `--color-fog-white`, `--color-coral-cta`, `--color-mundo-blue`, `--color-abyss-navy`, `--color-slate-mist`, `--color-cool-frost`.

- [ ] **Step 2: Voltear tokens shadcn en `:root`**

```css
:root {
  /* --- Mundo Celular light theme → navy theme --- */
  --background: #001B5B;
  --foreground: #F5F7FB;
  --card: #00246E;
  --card-foreground: #F5F7FB;
  --popover: #00246E;
  --popover-foreground: #F5F7FB;
  --primary: #001B5B;
  --primary-foreground: #FFFFFF;
  --secondary: #00246E;
  --secondary-foreground: #F5F7FB;
  --muted: #00246E;
  --muted-foreground: #8A93B3;
  --accent: #0035A8;
  --accent-foreground: #F5F7FB;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: rgba(255, 255, 255, 0.12);
  --input: rgba(255, 255, 255, 0.15);
  --ring: #00D4FF;
  /* chart-* y --radius sin cambios */
  --sidebar: #001B5B;
  --sidebar-foreground: #FFFFFF;
  --sidebar-primary: #00D4FF;
  --sidebar-primary-foreground: #001B5B;
  --sidebar-accent: #00246E;
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: rgba(255, 255, 255, 0.12);
  --sidebar-ring: #00D4FF;
}
```

- [ ] **Step 3: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: sin errores (solo CSS, no debería romper nada).

- [ ] **Step 4: Commit**

```powershell
git add src/app/globals.css
git commit -m "feat(f3): tokens navy globales para toda la página"
```

---

### Task 3: Aislar el panel admin con scope de tokens claros

**Files:**
- Modify: `src/app/globals.css` (agregar clase al final, después de `@layer base`)
- Modify: `src/app/admin/layout.tsx` (envolver con la clase)

**Interfaces:**
- Consumes: tokens navy de Task 2
- Produces: clase CSS `.admin-light-scope` que restaura los tokens claros para todo el árbol del admin

- [ ] **Step 1: Agregar la clase scope claro al final de `globals.css`**

```css
/* ============================================================
   PANEL ADMIN — scope claro
   Re-declara los tokens (shadcn + custom) a la paleta clara
   para que el admin se mantenga blanco aunque el sitio sea navy.
   ============================================================ */
.admin-light-scope {
  --background: #FFFFFF;
  --foreground: #0A0F1F;
  --card: #FFFFFF;
  --card-foreground: #0A0F1F;
  --popover: #FFFFFF;
  --popover-foreground: #0A0F1F;
  --secondary: #FAFAFA;
  --secondary-foreground: #0A0F1F;
  --muted: #FAFAFA;
  --muted-foreground: #5A6478;
  --accent: #E0F4FF;
  --accent-foreground: #001B5B;
  --border: #E8E8E8;
  --input: #E8E8E8;
  --color-bg: #FFFFFF;
  --color-surface: #FAFAFA;
  --color-surface-elevated: #FFFFFF;
  --color-text: #0A0F1F;
  --color-text-secondary: #5A6478;
  --color-text-muted: #8A93A8;
  --color-canvas-frost: #FAFAFA;
  --color-faint-border: #E8E8E8;
  --color-steel-blue-gray: #5A6478;
  --color-blue-wash: #E0F4FF;
  --color-mist-blue: #8A93B3;
  --color-ink-navy: #0A0F1F;
  --color-border-strong: #D0D0D0;
}
```

- [ ] **Step 2: Envolver el contenido del admin con la clase**

En `src/app/admin/layout.tsx`, envolver el `SidebarProvider` con un `<div className="admin-light-scope">`:

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="admin-light-scope min-h-dvh">
        <SidebarProvider
          style={
            {
              "--sidebar-width": "16rem",
              "--sidebar-width-icon": "3rem",
            } as React.CSSProperties
          }
        >
          {/* resto sin cambios */}
        </SidebarProvider>
      </div>
    </AdminGuard>
  );
}
```

Cerrar el `</div>` después de `</SidebarProvider>`. No cambiar nada más.

- [ ] **Step 3: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Commit**

```powershell
git add src/app/globals.css src/app/admin/layout.tsx
git commit -m "feat(admin): aislar panel admin con scope de tokens claros"
```

---

### Task 4: Páginas públicas con colores hardcodeados (I)

**Files:**
- Modify: `src/app/reparaciones/page.tsx`
- Modify: `src/app/contacto/page.tsx`
- Modify: `src/app/preguntas/page.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/buscar/Buscador.tsx`

**Interfaces:**
- Consumes: tokens navy de Task 2
- Produces: páginas legibles sobre navy (texto claro, superficies navy-surface, bordes fog-white/10)

- [ ] **Step 1: `reparaciones/page.tsx` — reemplazar clases**

- `text-gray-900` (h1 línea 49, h2 línea 57, h3 línea 62) → `text-fog-white`
- `text-steel-blue-gray` (líneas 52, 63, 74, 75) → `text-fog-white/70`
- `bg-white` (línea 60) → `bg-navy-surface/40`
- `bg-blue-wash` + `text-mundo-blue` (línea 65) → `bg-glow-cyan/10` + `text-glow-cyan`
- `bg-canvas-frost` (línea 73) → `bg-navy-surface/40`
- Botón secundario (líneas 87-92): `border-faint-border bg-white ... text-gray-900` → `border-fog-white/15 bg-navy-surface/40 ... text-fog-white`
- Botón WhatsApp (línea 83, `bg-mundo-blue`): sin cambio

- [ ] **Step 2: `contacto/page.tsx` — reemplazar clases**

- `text-gray-900` (líneas 34, 40, 45, 50, 63, 85) → `text-fog-white`
- `text-steel-blue-gray` (líneas 41, 46) → `text-fog-white/70`
- Redes sociales (líneas 66-78): `border-faint-border bg-white ... text-ink-navy hover:bg-canvas-frost` → `border-fog-white/15 bg-navy-surface/40 ... text-fog-white hover:bg-navy-surface/60`
- Mapa (línea 86): `border-faint-border` → `border-fog-white/15`
- Botón WhatsApp (línea 55, `bg-mundo-blue`): sin cambio

- [ ] **Step 3: `preguntas/page.tsx` — reemplazar clases**

- `text-gray-900` (líneas 73, 80) → `text-fog-white`
- `bg-white` (línea 79) → `bg-navy-surface/40`
- `marker:text-steel-blue-gray` (línea 80) → `marker:text-fog-white/70`
- `text-steel-blue-gray` (línea 83) → `text-fog-white/70`

- [ ] **Step 4: `not-found.tsx` — reemplazar clases**

- `text-gray-900` (línea 14) → `text-fog-white`
- `text-steel-blue-gray` (línea 15) → `text-fog-white/70`
- Botón (líneas 16-20): `border-faint-border bg-white ... text-gray-900` → `border-fog-white/15 bg-navy-surface/40 ... text-fog-white`

- [ ] **Step 5: `buscar/Buscador.tsx` — reemplazar clases**

- `text-gray-900` (línea 22) → `text-fog-white`
- `text-steel-blue-gray` (líneas 24, 26) → `text-fog-white/70`

- [ ] **Step 6: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 7: Commit**

```powershell
git add src/app/reparaciones/page.tsx src/app/contacto/page.tsx src/app/preguntas/page.tsx src/app/not-found.tsx src/app/buscar/Buscador.tsx
git commit -m "feat(f3): tema navy en reparaciones, contacto, preguntas, 404 y buscar"
```

---

### Task 5: ProductCard default, CategoryHeader y breadcrumbs

**Files:**
- Modify: `src/components/storefront/ProductCard.tsx` (variante `default`)
- Modify: `src/components/storefront/CategoryHeader.tsx`
- Modify: `src/app/categoria/[slug]/page.tsx` (breadcrumb)
- Modify: `src/app/producto/[slug]/page.tsx` (breadcrumb)

**Interfaces:**
- Consumes: tokens navy de Task 2
- Produces: cards de categoría y breadcrumbs legibles sobre navy

- [ ] **Step 1: `ProductCard.tsx` — variante `default` a estilo navy**

En `containerClasses`:

```ts
default:
  "group relative block overflow-hidden rounded-cards bg-navy-surface/40 border border-fog-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-glow-cyan/30",
```

En `bgClass` (línea 71): las tres variantes deben quedar `bg-navy-surface/20`. Simplificar la línea a:

```ts
const bgClass = "bg-navy-surface/20";
```

En la sección Info:
- Chip categoría (líneas 150-154): `bg-accent/10 ... text-primary` → `bg-glow-cyan/10 ... text-glow-cyan`
- Título (línea 169): `text-text` → `text-fog-white`
- Precio (línea 178): `text-primary` → `text-glow-cyan-soft`
- Icono sin imagen (línea 91): `text-text-muted/40` → `text-fog-white/30`
- Botón wishlist (línea 114): `bg-pure-white/80 text-text hover:bg-pure-white` → `bg-fog-white/80 text-navy-deep hover:bg-fog-white` (fondo claro con texto navy)
- Quick-add (línea 131): `bg-primary text-pure-white hover:bg-primary-light` → `bg-glow-cyan text-navy-deep hover:bg-glow-cyan-soft` (consistente con el resto del sitio)

- [ ] **Step 2: `CategoryHeader.tsx`**

- `text-ink-navy` (línea 10) → `text-fog-white`
- `text-steel-blue-gray` (línea 14) → `text-fog-white/70`

- [ ] **Step 3: Breadcrumbs de categoría y producto**

En `src/app/categoria/[slug]/page.tsx` (líneas 56-61):
- `text-steel-blue-gray` → `text-fog-white/60`
- `hover:text-ink-navy` → `hover:text-glow-cyan`

En `src/app/producto/[slug]/page.tsx` (líneas 42-46):
- `text-steel-blue-gray` → `text-fog-white/60`

- [ ] **Step 4: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```powershell
git add src/components/storefront/ProductCard.tsx src/components/storefront/CategoryHeader.tsx src/app/categoria/[slug]/page.tsx src/app/producto/[slug]/page.tsx
git commit -m "feat(f3): cards y breadcrumbs en tema navy"
```

---

### Task 6: ProductDetail en tema navy

**Files:**
- Modify: `src/components/producto/ProductDetail.tsx`

**Interfaces:**
- Consumes: tokens navy de Task 2
- Produces: página de producto legible sobre navy

- [ ] **Step 1: Reemplazar clases en `ProductDetail.tsx`**

- Galería (línea 72): `border-faint-border bg-bg` → `border-fog-white/15 bg-navy-surface/20`
- Thumbnails (líneas 95-99): `border-faint-border` (2 veces) → `border-fog-white/15`
- Título (línea 131): `text-text` → `text-fog-white`
- Panel variantes (línea 149): `border-faint-border bg-surface` → `border-fog-white/10 bg-navy-surface/40`
- Label variantes (línea 154): `text-text-secondary` → `text-fog-white/70`
- Select (línea 164): `border-faint-border bg-pure-white px-4 py-3 text-[14px] text-text` → `border-fog-white/15 bg-navy-surface px-4 py-3 text-[14px] text-fog-white`
- Descripción (línea 179): `text-text` → `text-fog-white`
- Botón WhatsApp (línea 197): `bg-pure-white px-6 ... text-primary` → `bg-fog-white px-6 ... text-navy-deep` (fondo claro, texto navy — mantiene contraste sobre navy)
- Especificaciones (línea 205): `border-faint-border bg-surface` → `border-fog-white/10 bg-navy-surface/40`
- Título specs (línea 206): `text-text` → `text-fog-white`
- Fila specs (línea 213): `border-faint-border` → `border-fog-white/10`
- dt specs (línea 215): `text-text-secondary` → `text-fog-white/70`
- dd specs (línea 216): `text-text` → `text-fog-white`
- Sticky mobile (línea 229): `border-faint-border bg-surface/95` → `border-fog-white/15 bg-navy-base/95`
- Label sticky (línea 232): `text-text-secondary` → `text-fog-white/70`

- [ ] **Step 2: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add src/components/producto/ProductDetail.tsx
git commit -m "feat(f3): detalle de producto en tema navy"
```

---

### Task 7: Carrito en tema navy

**Files:**
- Modify: `src/components/carrito/CarritoItem.tsx`
- Modify: `src/components/carrito/CarritoResumen.tsx`
- Modify: `src/components/carrito/CarritoContador.tsx`

**Interfaces:**
- Consumes: tokens navy de Task 2
- Produces: página de carrito y contador legibles sobre navy

- [ ] **Step 1: `CarritoItem.tsx`**

- Card (línea 34): `border-faint-border bg-surface` → `border-fog-white/10 bg-navy-surface/40`
- Imagen (línea 36): `bg-canvas-frost` → `bg-navy-surface/20`
- Nombre (línea 55): `text-text` → `text-fog-white`
- Atributos (línea 59): `text-text-secondary` → `text-fog-white/70`
- Precio (línea 66): `text-text` → `text-fog-white`
- Controles cantidad (línea 72): `bg-bg` → `bg-navy-base`
- Botones − / + (líneas 75, 85): `text-text` → `text-fog-white` (el `hover:bg-glow-cyan hover:text-navy-deep` se mantiene)
- Cantidad (línea 80): `text-text` → `text-fog-white`
- Icono sin imagen (línea 47): `text-text-secondary` → `text-fog-white/70`

- [ ] **Step 2: `CarritoResumen.tsx`**

- Título vacío (línea 18): `text-text` → `text-fog-white`
- Sub (línea 21): `text-text-secondary` → `text-fog-white/70`
- Card resumen (línea 61): `border-faint-border bg-surface` → `border-fog-white/10 bg-navy-surface/40`
- Título resumen (línea 62): `text-text` → `text-fog-white`
- Subtotal/Envío (líneas 67, 71): `text-text` → `text-fog-white`
- Separador (línea 77): `border-faint-border` → `border-fog-white/10`
- Total (línea 79): `text-text` → `text-fog-white`
- Vaciar (línea 94): `text-text-secondary` → `text-fog-white/70`

- [ ] **Step 3: `CarritoContador.tsx`**

- Icono (línea 15): `text-text ... hover:bg-canvas-frost` → `text-fog-white ... hover:bg-glow-cyan/10`

- [ ] **Step 4: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```powershell
git add src/components/carrito/
git commit -m "feat(f3): carrito en tema navy"
```

---

### Task 8: Checkout en tema navy

**Files:**
- Modify: `src/components/checkout/CheckoutForm.tsx`

**Interfaces:**
- Consumes: tokens navy de Task 2
- Produces: página de checkout legible sobre navy (formularios oscuros)

- [ ] **Step 1: Reemplazar clases en `CheckoutForm.tsx`**

Pantallas de guard (sin sesión / carrito vacío):
- `bg-bg` (líneas 29, 51): `bg-navy-surface/40`
- `text-text-secondary` (líneas 30, 52, 35, 57): `text-fog-white/70`
- `text-text` (líneas 32, 54): `text-fog-white`
- Botones `bg-primary text-pure-white` (líneas 39-42, 60-63): sin cambio (primary sigue navy sobre... en navy el botón primary se confunde con el fondo. Cambiar a `bg-glow-cyan text-navy-deep` para contraste) — cambiar en ambos.

Pantalla principal:
- Título (línea 129): `text-text` → `text-fog-white`
- Card Tu pedido (línea 135): `border-faint-border bg-surface` → `border-fog-white/10 bg-navy-surface/40`
- Título card (línea 136): `text-text` → `text-fog-white`
- Item nombre (línea 149): `text-text` → `text-fog-white`
- Item atributos/cantidad (líneas 151, 153): `text-text-secondary` → `text-fog-white/70`
- Item precio (línea 155): `text-text` → `text-fog-white`
- Separadores (líneas 146, 163): `border-faint-border` → `border-fog-white/10`
- Total (línea 164): `text-text` → `text-fog-white`
- Card Entrega (línea 173): `border-faint-border bg-surface` → `border-fog-white/10 bg-navy-surface/40`
- Título (línea 174): `text-text` → `text-fog-white`
- Labels (líneas 180, 193, 238, 250, 262, 277): `text-text-secondary` → `text-fog-white/70`
- Inputs/textarea (líneas 187, 200, 245, 257, 269, 285): `border-faint-border bg-pure-white ... text-text` → `border-fog-white/15 bg-navy-surface ... text-fog-white`
- Radio labels (líneas 206, 220): `border-faint-border ... hover:border-primary-light` → `border-fog-white/15 ... hover:border-glow-cyan/40`
- Radio texto (líneas 215, 227): `text-text` → `text-fog-white`
- Radio sub (líneas 216, 228): `text-text-secondary` → `text-fog-white/70`
- Botón confirmar (línea 301): `bg-primary ... text-pure-white` → `bg-glow-cyan ... text-navy-deep`

- [ ] **Step 2: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add src/components/checkout/CheckoutForm.tsx
git commit -m "feat(f3): checkout en tema navy"
```

---

### Task 9: Verificación final y revisión visual

**Files:**
- Ninguno (verificación)

**Interfaces:**
- Consumes: Tasks 1-8
- Produces: confirmación de que el sitio completo es navy y el deploy quedará resuelto

- [ ] **Step 1: Typecheck completo**

```powershell
npx tsc --noEmit
```

Expected: 0 errores.

- [ ] **Step 2: Lint**

```powershell
npm run lint
```

Expected: sin errores nuevos (solo clases CSS/Tailwind).

- [ ] **Step 3: Tests**

```powershell
npm test
```

Expected: todos pasan (incluye `tests/components/storefront/HeroProductCard.test.tsx`).

- [ ] **Step 4: Revisión visual de páginas públicas (dev server)**

```powershell
npm run dev
```

Revisar en el navegador (localhost:3000):
- `/` home — sigue navy, hero con animación del celular intacta
- `/celulares` (o cualquier categoría) — fondo navy, cards navy
- `/contacto`, `/preguntas`, `/reparaciones` — navy
- `/carrito`, `/checkout` — navy, formularios legibles
- `/buscar?q=iphone` — navy
- `/admin` — debe verse CLARO (blanco) como antes

- [ ] **Step 5: Verificar que el fix de skeleton quedó en git**

```powershell
git ls-files src/components/ui/ | Select-String -Pattern "skeleton"
```

Expected: solo `src/components/ui/skeleton.tsx` (minúscula). Esto garantiza que el próximo push a Vercel compila.

- [ ] **Step 6: Estado final y push**

```powershell
git status --short
git log --oneline -8
```

Expected: working tree limpio, commits de Tasks 1-8 presentes. Preguntar al usuario antes de hacer `git push` (para que Vercel re-deploye y se confirme el fix).
