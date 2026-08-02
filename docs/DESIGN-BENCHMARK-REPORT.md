# Mundo Celular — Design Benchmark Report

## Referencias Analizadas

| Referencia | URL | Patrones Extraídos |
|------------|-----|-------------------|
| **Next.js Ecommerce Starter (Epic Design Labs)** | github.com/Epic-Design-Labs/nextjs-ecommerce-starter | Arquitectura e-commerce completa, product listing, product detail, cart drawer, checkout flow, auth, account dashboard, brands, subcategories, search modal, announcement bar, recently viewed |
| **shadcn/ui** | ui.shadcn.com | Sidebar (collapsible, icon, floating variants), DataTable (TanStack Table v8), Dialog, Sheet, Form (React Hook Form + Zod), Breadcrumb, Command palette, Toast, Skeleton, Empty State |
| **Magic UI** | magicui.design | Animated Grid Pattern, Animated List, Typing Animation, Theme Toggler, Card hover effects, Background beams, Bento grids |
| **Aceternity UI** | ui.aceternity.com | Dashboard components, Grouped Sidebar (collapsible with nested groups), Bento Grids (dashboard layouts), Expandable Cards, Empty States, Stats cards, Feature sections |
| **shadcn.io Admin Blocks** | shadcn.io/blocks/sidebar-admin-panel | Admin panel sidebar with logo header, grouped navigation, user dropdown footer, role-based navigation, breadcrumb sync |

---

## Hallazgos Principales por Categoría

### 1. Layouts Administrativos

**Patrón Ganador: Sidebar Provider en Root Layout + Route Groups**
- `SidebarProvider` en `app/layout.tsx` (root) para persistir estado collapsed/expandido entre navegaciones
- Route groups: `(admin)` para layout con sidebar, `(store)` para layout público, `(auth)` para login
- Sidebar variants: `floating` (card-style con sombra), `sidebar` (flush), `inset` (con SidebarInset)
- Collapsible modes: `offcanvas` (mobile drawer), `icon` (icon-only), `none` (fixed)

**Estructura shadcn/ui Sidebar:**
```
SidebarProvider
├── Sidebar (variant="floating", collapsible="icon")
│   ├── SidebarHeader (logo + brand)
│   ├── SidebarContent (scrollable)
│   │   ├── SidebarGroup (Navigation)
│   │   │   ├── SidebarGroupLabel
│   │   │   ├── SidebarGroupContent
│   │   │   │   ├── SidebarMenu
│   │   │   │   │   ├── SidebarMenuItem (leaf)
│   │   │   │   │   ├── SidebarMenuItem (parent + Collapsible)
│   │   │   │   │   │   ├── CollapsibleTrigger
│   │   │   │   │   │   └── CollapsibleContent (SidebarMenuSub)
│   ├── SidebarFooter (user menu + settings)
├── SidebarInset (main content)
│   ├── Header (SidebarTrigger + Breadcrumb + UserMenu)
│   └── Main (children)
```

### 2. Dashboards & KPIs

**Patrones Aceternity UI + shadcn:**
- **Stats Cards**: Grid 4-column (1/2/4 responsive), cada card = icono + label + valor + trend (↑↓%)
- **Bento Grid Dashboard**: Asymmetric layout para combinar charts + stats + recent activity
- **Recharts integration**: Area chart (revenue), Bar chart (stock by category), Pie chart (orders by status)
- **Skeleton loaders**: Shimmer animation en cada card mientras carga data

### 3. Sidebars & Navigation

**shadcn/ui Sidebar (más robusto):**
- Config-driven: `navConfig` array en `lib/navigation.ts`
- Role-based filtering: `roles?: string[]` en cada nav item
- Active state: `usePathname()` + `isActive` prop en `SidebarMenuButton`
- Collapsible groups: `Collapsible` wrapper en `SidebarGroup`
- Keyboard navigation: Arrow keys, Enter, Escape (Radix UI)
- Persistence: `localStorage` para estado collapsed + grupos expandidos

**Aceternity Grouped Sidebar:**
- Main sidebar + nested expandable groups
- 300px expanded / 70px collapsed con Framer Motion
- Group expansion state persistido en localStorage
- Mobile: overlay drawer (Sheet)

### 4. Data Tables (Productos, Pedidos, Usuarios)

**shadcn/ui DataTable (TanStack Table v8):**
- Server-side pagination, sorting, filtering via URL searchParams
- Column visibility toggle (Command menu)
- Row selection + bulk actions (delete, export)
- Skeleton rows durante carga
- Empty state ilustrado cuando no hay datos
- Responsive: horizontal scroll en mobile, stacked cards en <640px

**Columnas típicas admin:**
| Productos | Pedidos | Usuarios |
|-----------|---------|----------|
| Imagen (thumb) | ID corto | Avatar |
| Nombre + SKU | Cliente | Nombre + Email |
| Categoría (badge) | Total (COP) | Rol (badge) |
| Precio + Stock | Estado (badge color) | Último login |
| Estado (activo/inactivo) | Fecha | Acciones |
| Acciones (editar/eliminar) | Acciones (ver/cambiar estado) | |

### 5. Formularios (Crear/Editar Producto, Categoría)

**React Hook Form + Zod + shadcn/ui Form:**
- `FormProvider` en layout de página
- `FormField` por cada input con `Controller`
- Validación en blur + submit
- Image uploader: drag-drop + preview + delete (R2 presigned URLs)
- Variant builder: dynamic fields (color + capacidad + precio + stock)
- SEO fields: meta title, description, slug (auto-generado)
- Submit: loading state + toast feedback

### 6. Gestión de Productos

**Next.js Ecommerce Starter patterns:**
- Product list: Server Component con searchParams para filtros
- Product detail: SSG + ISR (generateStaticParams + revalidate)
- Admin product table: DataTable con column filters
- Image gallery: thumbnails + lightbox (zoom)
- Variants: size/color matrix con stock por combinación
- Featured flag: badge en listado + hero en home

### 7. Gestión de Pedidos

**Patrón WhatsApp-first (Mundo Celular):**
- Estados: `pendiente` → `contactado` → `cerrado` / `cancelado`
- Admin actions: botones de transición de estado (no input libre)
- Stock rollback: solo al cancelar (confirm modal)
- Detail view: timeline de estados + info cliente + items + totales
- Filtro por estado + búsqueda por cliente/ID
- Export CSV opcional

### 8. Search & Filters

**Command Palette (Cmd+K):**
- shadcn/ui `Command` component
- Global search: productos + categorías + pedidos
- Keyboard shortcut: `cmd+k` / `ctrl+k`
- Recent searches + popular suggestions

**Faceted Filters (Product Listing):**
- Sidebar filters (desktop) / Sheet (mobile)
- Price range slider, category checkboxes, brand, stock status
- URL sync: `?category=celulares&minPrice=500000&maxPrice=2000000`
- Clear all filters button
- Results count: "Mostrando 12 de 45 productos"

### 9. Mobile Navigation

**Bottom Tab Bar (ya existe en Mundo Celular):**
- 4-5 items: Inicio, Catálogo, Carrito, Cuenta, (Reparaciones)
- Fixed bottom, 64px height, shadow up
- Active state: icon color cambio + background pill
- Hide on scroll down, show on scroll up (opcional)

**Admin Mobile:**
- Sidebar → Sheet (Drawer) desde header trigger
- Same nav config, different render
- DataTable → stacked cards en <640px

### 10. Empty States & Loading

**shadcn/ui + Aceternity patterns:**
- **Empty State**: Ilustración SVG + headline + descripción + CTA button
- **Skeleton**: Shimmer animation (ya en globals.css `.animate-shimmer`)
- **Error State**: Alert + retry button + link to support

---

## Componentes Recomendados para Mundo Celular

### Admin Panel (Nuevos / Mejorados)

| Componente | Fuente | Adaptación Mundo Celular |
|------------|--------|-------------------------|
| `AdminSidebar` | shadcn/ui Sidebar + Aceternity Grouped | Collapsible icon mode, grouped nav (Catálogo, Pedidos, Config), user footer, brand colors |
| `AdminHeader` | shadcn/ui blocks | SidebarTrigger, Breadcrumb, Search (Cmd+K), UserMenu, Notifications |
| `AdminLayout` | Route group `(admin)` | Provider en root, layout.tsx con Sidebar + Header + Main |
| `DataTable` | shadcn/ui DataTable | Productos, Pedidos, Categorías, Usuarios - server-side via searchParams |
| `StatCard` | Aceternity Stats | KPIs dashboard: 4 cards con icon + valor + trend |
| `ProductForm` | shadcn Form + R2 uploader | Mejorado: drag-drop multi-imagen, variant builder, SEO fields |
| `CategoryForm` | shadcn Form | Simple: nombre, slug, activa, orden, icono |
| `OrderDetail` | Custom | Timeline estados, info cliente, items, acciones estado |
| `UserTable` | DataTable | Email, rol, último login, acciones |
| `SettingsForm` | shadcn Form | Config tienda: nombre, ciudad, WhatsApp, redes, colores |

### Storefront (Mejoras)

| Componente | Fuente | Adaptación |
|------------|--------|------------|
| `ProductListing` | Next.js Ecommerce | Server Component, searchParams filters, Suspense + Skeleton |
| `ProductDetail` | Next.js Ecommerce | Gallery con thumbnails, variant selector, sticky add-to-cart |
| `CartDrawer` | Next.js Ecommerce | Slide-over Sheet, quantity controls, WhatsApp CTA sticky |
| `CheckoutForm` | Custom | Form → WhatsApp message generation |
| `SearchModal` | Next.js Ecommerce + shadcn Command | Cmd+K, instant results, keyboard nav |
| `CategoryNav` | Custom | Pills horizontales + dropdown mobile |

---

## Design DNA Adaptado a Mundo Celular

### Paleta (desde DESIGN-mundocelular.md)
| Rol | Color | Token | Uso |
|-----|-------|-------|-----|
| Canvas (bg) | `#eef2f9` | `--color-canvas-frost` | Page background |
| Surface | `#ffffff` | `--color-pure-white` | Cards, inputs, modals |
| Primary Text | `#0a1930` | `--color-ink-navy` | Headings, body |
| Secondary Text | `#5b6b85` | `--color-steel-blue-gray` | Meta, labels |
| Border | `#e0e6f0` | `--color-faint-border` | Dividers, input borders |
| **Accent (SOLO)** | `#143b98` | `--color-mundo-blue` | WhatsApp button, wordmark, search submit, active states |
| Success | `#16a34a` | `--color-success` | Estado "cerrado", stock OK |
| Warning | `#f59e0b` | `--color-warning` | Estado "contactado", low stock |
| Danger | `#dc2626` | `--color-danger` | Estado "cancelado", delete actions |

### Tipografía
- **Display/Headlines**: Sora (600/700/800) - tracking negativo
- **Body/UI**: Inter (300-600) - 16px base
- **Prices/Specs**: JetBrains Mono (400/500) - 14-16px
- **Code**: JetBrains Mono

### Radius & Shadows (ya en globals.css)
- Cards: 20px (`--radius-cards`)
- Chips/Pills/Inputs/Buttons: 9999px (`--radius-chips`)
- Shadows: elevation scale con cyan tint en hover (`--shadow-cyan-glow`)

### Motion (ya en globals.css)
- Ease-out-quart: `cubic-bezier(0.25, 1, 0.5, 1)`
- Ease-out-expo: `cubic-bezier(0.16, 1, 0.3, 1)`
- Spring: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Animations: fade-up, scale-in, slide-up, shimmer, float-chip, glow-pulse

---

## Qué Evitar Explícitamente (Anti-Patterns)

1. **No segundo acento saturado** - Solo Mundo Blue (#143b98) para acciones primarias
2. **No esquinas rectas** - 0px solo para bordes de imagen
3. **No negro puro** - Ink Navy (#0a1930) para todo texto "negro"
4. **No font-weight 700+** - Jerarquía por tracking + grade (400/500/600)
5. **No JetBrains Mono en texto conversacional** - Solo precios, specs, códigos
6. **No romper píldora 9999px** en controles inline
7. **No sombras duras de una capa** - Siempre dual shadow suave
8. **No layouts >1200px** - Max-width centrado

---

## Plan de Implementación Priorizado

### Fase 1: Admin Shell (Fundación)
1. `AdminSidebar` con shadcn/ui Sidebar (collapsible, grouped, role-based)
2. `AdminHeader` con SidebarTrigger, Breadcrumb, UserMenu, Cmd+K Search
3. `AdminLayout` en route group `(admin)` con Provider en root
4. Migrar `AdminNav` actual → nueva sidebar

### Fase 2: Dashboard & Data Tables
1. `StatCard` ×4 para KPIs (categorías, productos, pedidos, ingresos)
2. `DataTable` genérico (TanStack Table v8) + columnas por entidad
3. `ProductTable`, `OrderTable`, `CategoryTable`, `UserTable`
4. Skeleton rows + Empty states ilustrados

### Fase 3: Forms & CRUD
1. `ProductForm` mejorado: multi-image drag-drop, variant builder, SEO
2. `CategoryForm`: simple + icon picker
3. `OrderDetail`: timeline + state transitions + stock rollback modal
3. `SettingsForm`: config tienda (nombre, WhatsApp, ciudad, redes, colores)

### Fase 4: Storefront Polish
1. `ProductListing` Server Component con filtros URL-sync
2. `ProductDetail` con gallery + variant selector + sticky CTA
3. `CartDrawer` Sheet + WhatsApp CTA
4. `SearchModal` Cmd+K global

### Fase 5: Motion & Polish
1. Framer Motion para sidebar transitions, page transitions
2. Magic UI patterns: AnimatedGridPattern en hero, TypingAnimation en search
3. Aceternity Bento Grid para dashboard
4. Skeleton shimmer en todos los data fetches

---

## Razones de Selección

| Decisión | Razón |
|----------|-------|
| **shadcn/ui Sidebar** | Accesible (Radix), composable, collapsible modes, keyboard nav, theming, TypeScript-first |
| **TanStack Table v8** | Headless, server-side ready, column visibility, sorting, filtering, pagination, virtualization |
| **React Hook Form + Zod** | Performant, minimal re-renders, schema validation, TypeScript inference |
| **Route Groups (Next.js)** | Layout isolation, no URL pollution, persistent sidebar state |
| **Server Components + searchParams** | SEO-friendly, shareable filtered views, no client hydration para listados |
| **Framer Motion (selectivo)** | Sidebar width animation, page transitions, micro-interactions - no todo animado |
| **Design tokens en globals.css** | Single source of truth, Tailwind v4 @theme, no hex en componentes |

---

## Próximos Pasos

1. **Crear spec detallado** (`docs/superpowers/specs/YYYY-MM-DD-admin-panel-redesign.md`)
2. **Instalar dependencias**: `@radix-ui/react-collapsible`, `@tanstack/react-table`, `framer-motion`, `lucide-react`
3. **Implementar AdminSidebar + AdminLayout** (Fase 1)
4. **Verificar con Playwright MCP** tras cada componente mayor
5. **Iterar visual vs referencias** hasta calidad Shopify/Stripe/Vercel