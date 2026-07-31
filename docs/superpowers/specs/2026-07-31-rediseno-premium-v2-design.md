# Rediseño Premium MundoCelular v2.0 · Spec de diseño

**Fecha:** 2026-07-31
**Alcance:** Transformación visual integral del storefront. Sin tocar backend, Firebase, Firestore, Auth, reglas, APIs, inventario, carrito, checkout ni lógica de negocio.
**Enfoque visual:** "Samsung + Linear híbrido" — blanco + gris claro + Primary `#1E4FA8` + accent `#2563EB`, glassmorphism en header, Inter Tight + Inter.
**Fuera de alcance:** Cualquier cambio a datos, reglas, auth, payloads de API o lógica de carrito/checkout. SEO y PWA existentes se mantienen (no se eliminan metadatos, schema, manifest ni web vitals).

---

## Decisiones del brainstorming

| Pregunta | Decisión |
|----------|----------|
| Alcance Home | **B (Ambicioso)** — estructura nueva completa: Hero + Marcas + Ofertas + Categorías + Destacados + Beneficios + Banner reparaciones |
| Tipografía | **C** — Inter Tight (títulos) + Inter (cuerpo). Reemplaza a Sora |
| Sección Marcas | **C** — wordmarks estilizados (texto), sin logos SVG/imagen |
| Ofertas | **B2** — Ofertas toma 3 primeros `destacado: true` en cards horizontales; Destacados muestra los restantes (sin duplicados) |
| Animaciones | **C (Máximo)** — fade-up + hover scale/translate + parallax Hero + transiciones página, respetando `prefers-reduced-motion` |
| Login | **B** — modal en Header (elimina /login, redirect a /) |
| Header sticky | **A** — scroll listener con useState |
| Tokens | **B** — alias: `--color-mundo-blue` cambia valor a `#1E4FA8`, agregar nuevos tokens `--color-primary`, etc. |
| Iconos | **Sin emojis** — SVG inline en toda la UI (marcas, beneficios, estado vacío, header) |

---

## 1. Sistema de tokens (`src/app/globals.css`)

### Colores nuevos (coexisten con alias existentes)

```css
/* Nuevos del brief */
--color-primary: #1E4FA8;
--color-primary-dark: #153C82;
--color-primary-light: #4D7AD6;
--color-accent: #2563EB;
--color-bg: #F8FAFC;
--color-surface: #FFFFFF;
--color-border: #E5E7EB;
--color-text: #1F2937;
--color-text-secondary: #6B7280;
--color-success: #16A34A;
--color-danger: #DC2626;

/* Alias existentes — mismo nombre, nuevo valor */
--color-mundo-blue: #1E4FA8;       /* antes #143b98 */
--color-canvas-frost: #F8FAFC;     /* antes #eef2f9 */
--color-pure-white: #FFFFFF;
--color-ink-navy: #1F2937;
--color-faint-border: #E5E7EB;     /* antes #e0e6f0 */
--color-steel-blue-gray: #6B7280;
```

**Mantener** (sin cambios): `--color-blue-wash`, `--color-abyss-navy`, `--color-slate-mist`, `--color-cool-frost`, `--color-mist-blue` — se usan en secciones oscuras (banner reparaciones).

### Tipografía

- Reemplazar `Sora` por `Inter_Tight` (pesos 500/600/700, variable `--font-inter-tight-css`) + `Inter` (pesos 300/400/500/600, variable `--font-inter-css`) en `src/app/layout.tsx` vía `next/font/google`.
- Mantener `JetBrains_Mono` (variable `--font-jetbrains-mono-css`) para precios y números.
- En `@theme`: eliminar `--font-sora` y agregar `--font-inter-tight` (títulos) + `--font-inter` (cuerpo). Buscar referencias `font-sora` con `grep` y reemplazar por `font-inter-tight` o `font-inter` según contexto (títulos vs cuerpo).

### Radius y sombras

Sin cambios en los radius. Sombras: mantener los 4 tokens `--shadow-sm`, `--shadow-sm-2`, `--shadow-lg`, `--shadow-lg-2` con sus mismas dimensiones, pero cambiar el color base de `rgba(10, 25, 48, ...)` a `rgba(30, 79, 168, ...)` para dar tinte azul.

---

## 2. Header premium (`src/components/layout/Header.tsx`)

### Estructura

**Desktop (1024px+):**
`[LOGO]  [Nav: Categorías | Marcas | Ofertas | Sobre nosotros]  [Buscar ≤400px]  [🛒] [👤]`

**Mobile (< 768px):**
`[LOGO]  [🛒] [👤]  [☰]` — hamburger abre panel con nav + buscador.

### Nav links (ancla a secciones del Home)

- "Categorías" → `/#categorias`
- "Marcas" → `/#marcas`
- "Ofertas" → `/#ofertas`
- "Sobre nosotros" → `/contacto`

(Links nuevos: anchor-scroll en Home. Funciona con ISR.)

### Scroll listener (estado `scrolled: boolean`)

```tsx
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

### Estados visuales

| Estado | Fondo | Blur | Border-bottom | Sombra |
|--------|-------|------|---------------|--------|
| Inicial (scrollY ≤ 20) | `rgba(255,255,255,0.7)` | `blur(12px)` | transparent | ninguna |
| Scrolled (scrollY > 20) | `rgba(255,255,255,0.85)` | `blur(20px)` | `1px solid var(--color-border)` | `--shadow-sm` |

Transición: `300ms ease-out` en `background-color`, `backdrop-filter`, `border-color`, `box-shadow`.

### Modal de login (reemplaza `/login`)

- Trigger: botón "Iniciar sesión" o avatar en Header.
- Modal reusable `<AuthModal open onClose />` — extrae el contenido de `LoginForm` actual.
- Overlay: `rgba(31, 41, 55, 0.6)` + `backdrop-blur(8px)`.
- Card: max-width 400px, fondo `--color-surface`, radius 24px, padding 32px, `--shadow-lg-2` (define app).
- Contenido: Inter Tight 24px "Iniciar sesión" + subtítulo + botón Google Sign-in (reutiliza `signInWithPopup`).
- Cierre: clic en overlay, tecla Esc, botón X.
- `/login` se elimina; visitar `/login` → `redirect("/")` y se abre el modal automáticamente.

### Avatar / Mi cuenta

- Si hay sesión: avatar con inicial del displayName en círculo `--color-primary` + dropdown con "Panel admin" / "Cerrar sesión".
- Si no: icono user SVG 22px. Click abre modal login.

---

## 3. Home (`src/app/page.tsx`) — estructura nueva

Orden de secciones (top → bottom):

1. **Hero** — 100vh, split texto/imagen
2. **Marcas** — grid 6/3/2 de wordmarks estilizados
3. **Ofertas destacadas** — cards horizontales (3 primeros `destacado: true`)
4. **Categorías** — pills rediseñadas
5. **Destacados** — grid 4/2/2 (restantes, sin los 3 de Ofertas)
6. **Banner reparaciones** — card horizontal rediseñada
7. **Beneficios** — grid 6/3/2 de tarjetas con SVG

Cada sección tiene `id` para anchor scroll: `#marcas`, `#ofertas`, `#categorias`, `#destacados`, `#beneficios`.

### Hero (`src/components/storefront/Hero.tsx`)

**Layout desktop:** grid 2 cols, `gap-12`, padding 64px horizontal. Mobile: stack (imagen abajo).

**Contenido texto (izq):**
- Título: "La mejor tecnología, al mejor precio." — Inter Tight 64px desktop / 40px mobile, peso 700, `tracking-[-0.04em]`, `--color-text`.
- Subtítulo: "Smartphones, accesorios y equipos originales con garantía real y respaldo en Medellín." — 18px, peso 400, `--color-text-secondary`, max-width 520px.
- CTA primario "Comprar ahora": link a `#ofertas`, fondo `--color-primary`, texto blanco, radius 12px, padding 16px 32px, peso 600.
- CTA secundario "Ver catálogo": link a `#categorias`, fondo blanco, border `1px solid var(--color-border)`, texto `--color-text`. Hover: border `--color-primary`.
- Trust badges: 3 elementos en fila (gap-6, 14px `--color-text-secondary`), cada uno con **SVG inline 16px** + texto:
  - `shield-check` + "Envío gratis"
  - `truck` + "Garantía 12 meses"
  - `message-circle` + "Soporte WhatsApp"
  - **Sin emojis.**

**Imagen (der):**
- Aspect 1:1, ancho 480px desktop, full-width mobile.
- Contenido: `destacados[0].imagenes[0].url` (primer producto destacado).
- Fallback: placeholder gris `--color-bg` con texto "Mundo Celular" si no hay destacados.
- Blob decorativo: `radial-gradient` `--color-primary-light` con 20% opacidad, blur 80px, detrás de la imagen.

**Animaciones:**
- Título: fade-up 800ms, delay 100ms.
- Subtítulo: fade-up 1000ms, delay 200ms.
- CTAs: fade-up 1200ms, delay 300ms.
- Imagen: scale(0.95→1) + fade-in 1000ms, delay 200ms.
- Scroll indicator: SVG flecha animada (translateY 0→8px loop 1.5s), abajo-centro.
- Parallax imagen: `translateY(scrollY * 0.5)`, desktop only, deshabilitado con `prefers-reduced-motion: reduce`.

### Sección Marcas (nuevo componente `MarcasSection.tsx`)

- Título: "Las marcas que confían en nosotros" — Inter Tight 32px desktop / 24px mobile, peso 600, centrado.
- Subtítulo: "Equipos originales con respaldo directo" — 16px, `--color-text-secondary`, centrado.
- Grid: 6 cols desktop, 3 tablet, 2 mobile.
- Card marca: aspect 16:9, fondo `--color-surface`, border `1px solid var(--color-border)`, radius 16px.
- Contenido: wordmark Inter Tight 24px peso 600, color `--color-text-secondary`.
- Hover: color corporativo (Apple `#000`, Samsung `#1428A0`, Xiaomi `#FF6700`, Motorola `#5C5C5C`, Honor `#0000FF`, Realme `#FFC901`), border `--color-primary`, `scale(1.03)` 200ms ease-out.
- Marcas: array hardcodeado (no de Firestore — sin tocar backend).
- Animación entrada: cada card fade-up escalonado 50ms entre cards, 600ms, IntersectionObserver una vez.

### Ofertas destacadas (nuevo componente `OfertasSection.tsx`)

- Datos: `destacados.slice(0, 3)` de Firestore (campo `destacado: true`).
- Título: "Ofertas destacadas" — Inter Tight 32px, peso 600.
- Subtítulo: "La mejor tecnología al mejor precio" — 16px, `--color-text-secondary`.
- Grid: 3 cols desktop, 2 tablet, 1 mobile.
- Card (nueva, NO reutiliza HeroProductCard): aspect 4:5, fondo `--color-surface`, radius 24px, overflow hidden. Layout vertical (imagen arriba 60% + contenido abajo 40%). Distinta de HeroProductCard que es aspect 1:1 sin contenido de marca/CTA explícito.
  - Imagen: 60% alto card, object-cover.
  - Contenido: padding 24px — marca 12px uppercase `tracking-wide` `--color-text-secondary` + nombre Inter Tight 20px peso 600 + precio JetBrains Mono 24px peso 700 `--color-primary` + "Ver oferta →" link `--color-primary` 14px peso 500.
- Click card → `/producto/[slug]`.
- Hover: `translateY(-6px) scale(1.01)`, `--shadow-lg`, imagen `scale(1.05)`. 250ms ease-out.
- Animación entrada: fade-up IntersectionObserver.

### Categorías (rediseño de sección existente)

- Título: "Compra por categoría" — Inter Tight 32px, peso 600.
- Pills: flex-wrap, gap-3. Padding 16px 24px, fondo `--color-surface`, border `1px solid var(--color-border)`, radius 9999px, texto 14px peso 500.
- Reemplazar el glifo `<span>●</span>` actual del `CategoryPill` por SVG inline (4px dot `--color-primary` o icono de categoría según el tipo).
- Hover: fondo `--color-primary`, texto blanco, `translateY(-2px)`, `--shadow-sm-2`.
- Datos: `listarCategoriasPublic()` existente (sin tocar Firestore).

### Destacados (rediseño de sección existente)

- Datos: `destacados.slice(3)` — los restantes después de Ofertas.
- Título: "Más productos destacados" — Inter Tight 32px, peso 600.
- Si `slice(3)` es vacío, la sección no se renderiza.
- Grid: 4 cols desktop, 2 tablet, 2 mobile.
- Card: reutiliza `HeroProductCard` (aspect 1:1, imagen + nombre + precio) aplicando hover premium (translateY + scale + shadow). Esta card es más compacta que la de Ofertas, por eso se usa en el grid 4 cols.

### Banner reparaciones (rediseño)

- Card horizontal radius 28px, padding 64px desktop / 32px mobile.
- Fondo: imagen de fondo (placeholder gradient `--color-abyss-navy` a `--color-primary-dark` si no hay imagen) + overlay degradado oscuro.
- Texto blanco, Inter Tight 28px "¿Necesitas reparar tu celular?" + subtítulo 16px + botón blanco "Ver servicios" → `/reparaciones`.
- Mantiene el `<Link href="/reparaciones">` existente.

### Beneficios (nuevo componente `BeneficiosSection.tsx`)

- Título: "¿Por qué elegir MundoCelular?" — Inter Tight 48px desktop / 32px mobile, peso 600, centrado.
- Subtítulo: "Tu tienda de tecnología de confianza en Medellín" — 18px, `--color-text-secondary`, max-width 600px, centrado.
- Grid: 4 cols desktop, 3 tablet, 2 mobile.
- 6 tarjetas: **Equipos originales** | **Envíos rápidos** | **Garantía real** | **Soporte 24/7** | **Pagos seguros** | **Atención personalizada**
- Card: padding 32px, fondo `--color-surface`, border `1px solid var(--color-border)`, radius 24px.
  - Icono SVG inline (stroke 1.5, 32px, color `--color-primary`):
    - Originales: shield-check
    - Envíos: truck
    - Garantía: badge-check
    - Soporte: message-circle
    - Pagos: credit-card + lock
    - Atención: user
  - Título: Inter Tight 18px peso 600 `--color-text`.
  - Descripción: 14px `--color-text-secondary`.
  - Hover: `translateY(-4px)`, `--shadow-sm`, border `--color-primary-light`. 200ms ease-out.
- Animación: cada card fade-up al entrar viewport, delay 100ms entre cards.

---

## 4. Página de producto (`src/components/producto/ProductDetail.tsx`)

### Layout desktop (2 cols)

Izquierda: galería (imagen principal aspect 1:1, radio 24px, fondo `--color-bg` + thumbnails 80x80 radio 12px). Hover en imagen principal: `scale(1.02)` 300ms.

Derecha: info panel (max-width 560px, sin card):
- Nombre Inter Tight 40px desktop / 28px mobile, peso 700.
- Marca 14px peso 500 `--color-text-secondary`, uppercase.
- Precio Inter Tight 36px peso 700 `--color-primary` (formato COP).
- Stock 14px `--color-success` (disponible) o `--color-danger` (agotado).
- Selector variantes (si `tieneVariantes`): label + select/dropdown.
- CTA primario "Agregar al carrito": fondo `--color-primary`, texto blanco, radius 12px, padding 16px. Hover: `translateY(-2px)` + `--shadow-lg`.
- CTA secundario "Comprar por WhatsApp": fondo blanco, border `--color-primary`. Hover: fondo `--color-primary-light`, texto blanco.
- Specs: `<dl>` con border-radius contenedor + separadores sutiles.

### Mobile sticky CTA

Barra fija `position: sticky; bottom: 0` con backdrop-blur, muestra precio + botón WhatsApp + botón carrito. Mantiene `pb-20` del body.

### Animaciones

- Fade-in página completa 300ms.
- Hover imagen (scale).
- Hover CTAs (translateY).

### Lógica sin cambios

- Recibe `variantes` prop de `obtenerVariantesPorProducto`.
- `AgregarAlCarrito` mantiene `variante?` prop.
- Mensaje WhatsApp incluye atributos si hay variante.

---

## 5. Carrito (`src/components/carrito/CarritoResumen.tsx` + `CarritoItem.tsx`)

### Layout desktop (2 cols)

Izquierda (flex-1): lista de items + "Seguir comprando" link abajo.
Derecha (320px fixed): card resumen sticky.

Mobile: stack vertical — lista primero, resumen sticky bottom.

### Item card

- Flex horizontal, padding 24px, fondo `--color-surface`, border `1px solid var(--color-border)`, radius 20px, gap-4.
- Imagen 80x80, radius 12px (left).
- Info: nombre + atributos (Negro / 128GB) + precio JetMono.
- Controles `-` / `+`: 40x40, radius 9999px, fondo `--color-bg`, hover `--color-primary` + texto blanco.
- Quitar: texto pequeño `--color-danger`, hover underline.

### Resumen

- Card sticky desktop, padding 32px, radius 24px, `--shadow-sm-2`.
- Filas: Subtotal / Envío (Gratis) / Total (separador arriba, 20px peso 700).
- CTA "Proceder al checkout": full width, fondo `--color-primary`, texto blanco, radius 12px, peso 600. Hover: `translateY(-2px)` + `--shadow-lg`.
- "Vaciar carrito": texto `--color-text-secondary`, hover `--color-danger`.

### Estado vacío

- SVG shopping bag 64px `--color-text-secondary` centrado.
- Título "Tu carrito está vacío" Inter Tight 24px peso 600.
- Subtítulo "Explora nuestro catálogo" 16px `--color-text-secondary`.
- CTA "Ver productos" → `/` (link, fondo `--color-primary`).

### Lógica sin cambios

- Mantiene `useCarrito` con `varianteId` y `atributos`.
- `carrito/page.tsx` sigue SSG con metadata.

---

## 6. Checkout (`src/components/checkout/CheckoutForm.tsx`)

### Layout desktop (2 cols)

Izquierda: card "Tu pedido".
Derecha: card "Entrega".
CTA "Confirmar pedido": full-width mobile, ancho fijo desktop, debajo de las cards.

Mobile: stack vertical — pedido primero, entrega después, CTA full-width abajo.

### Card "Tu pedido"

- Fondo `--color-surface`, border `1px solid var(--color-border)`, radius 24px, padding 32px.
- Header "Tu pedido" 18px peso 600.
- Items: nombre + atributos (Negro / 128GB) + cantidad + precio alineados.
- Total: separador `1px solid var(--color-border)` arriba, fila destacada 20px peso 700.

### Card "Entrega"

- Mismo estilo que "Tu pedido".
- Radio buttons rediseñados: 20px, accent `--color-primary`, padding 16px.
- Input dirección: radius 12px, border `1px solid var(--color-border)`, focus border `--color-primary` + `box-shadow: 0 0 0 4px rgba(30,79,168,0.1)`. Padding 12px 16px.
- Label "Dirección" 14px peso 500.
- Label "Barrio" (sin "(opcional)"): 14px peso 500.
- Inputs usan Inter, no JetBrains Mono.

### CTA "Confirmar pedido"

- Fondo `--color-primary`, texto blanco, radius 12px, peso 600, padding 16px.
- Hover: `translateY(-2px)` + `--shadow-lg`.
- Disabled: opacity 0.5.

### Errores

- Texto 14px `--color-danger`, margin-top 8px.

### Estado no autenticado

- Mensaje centrado "Necesitas iniciar sesión para confirmar tu pedido" Inter Tight 20px.
- CTA "Iniciar sesión" abre `<AuthModal>` (no redirige a /login).

### Lógica sin cambios

- Mantiene POST `/api/pedidos` con `varianteId` y `atributos` en cada item.
- Sin cambios en payload ni flujo.

---

## 7. Animaciones y microinteracciones

### Sistema de animaciones con IntersectionObserver

Crear hook `src/hooks/useScrollAnimation.ts`:

```ts
export function useScrollAnimation<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true); // Sin animación, visible inmediatamente
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
```

Variantes (clases utilitarias en `globals.css`):
- `animate-fade-up` — `opacity:0 → 1`, `translateY(24px) → 0`, 600ms ease-out.
- `animate-fade-in` — `opacity:0 → 1`, 500ms.
- `animate-scale-in` — `scale(0.95) → 1`, 600ms.
- `animate-slide-left` — `translateX(-24px) → 0` + fade.
- `animate-slide-right` — `translateX(24px) → 0` + fade.

### Microinteracciones globales

| Elemento | Hover | Activo |
|----------|-------|--------|
| Botones primarios | `translateY(-2px)` + `--shadow-lg` 200ms | `scale(0.98)` 100ms |
| Cards de producto | `translateY(-6px) scale(1.01)` + `--shadow-lg` 250ms | — |
| Inputs | border `--color-primary` + ring 4px `rgba(30,79,168,0.1)` | — |
| Links nav | color `--color-primary` 200ms | — |
| Images en cards | `scale(1.05)` 250ms | — |

### Parallax Hero

- Hook `useParallax()` que aplica `translateY(scrollY * 0.5)` a la imagen del Hero solo en desktop y si `prefers-reduced-motion` no está activo.

---

## 8. Componentes nuevos a crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/storefront/MarcasSection.tsx` | Sección de marcas (wordmarks) |
| `src/components/storefront/OfertasSection.tsx` | Sección de ofertas (cards horizontales) |
| `src/components/storefront/BeneficiosSection.tsx` | Sección de beneficios (6 tarjetas SVG) |
| `src/components/layout/AuthModal.tsx` | Modal de login reusable (extrae `LoginForm`) |
| `src/components/layout/LoginForm.tsx` | Extrae lógica de sign-in del actual `/login` |
| `src/components/ui/Icon.tsx` | Set de íconos SVG inline (shield-check, truck, badge, message, card, user, bag, search, cart, menu, close, chevron-down, arrow) |
| `src/hooks/useScrollAnimation.ts` | Hook IntersectionObserver para fade-up |
| `src/hooks/useParallax.ts` | Hook parallax para Hero |

## 9. Componentes a modificar (sin tocar lógica)

| Archivo | Cambios |
|---------|---------|
| `src/app/globals.css` | Tokens nuevos, alias, animaciones, tipografía |
| `src/app/layout.tsx` | Reemplazar Sora por Inter_Tight + Inter |
| `src/app/page.tsx` | Reestructurar Home con secciones nuevas |
| `src/components/layout/Header.tsx` | Glassmorphism, scroll listener, nav links, AuthModal trigger, eliminar redirección /login |
| `src/components/layout/Footer.tsx` | Rediseño visual con nuevos tokens |
| `src/components/layout/BottomTabBar.tsx` | Rediseño visual, badges, active state |
| `src/components/storefront/Hero.tsx` | Layout split 100vh, animaciones, parallax, trust badges SVG |
| `src/components/storefront/ProductCard.tsx` | Hover premium, nuevos tokens |
| `src/components/storefront/HeroProductCard.tsx` | Hover premium, nuevos tokens |
| `src/components/storefront/CategoryPill.tsx` | Estilo premium (radius pill, hover fill) |
| `src/components/storefront/CategorySectionHeader.tsx` | Inter Tight, nuevos tokens |
| `src/components/storefront/SearchInput.tsx` | Estilo premium, icono SVG |
| `src/components/producto/ProductDetail.tsx` | Layout 2 cols, galería, CTAs premium, precios Inter Tight |
| `src/components/carrito/CarritoResumen.tsx` | Layout 2 cols, resumen sticky, estado vacío SVG |
| `src/components/carrito/CarritoItem.tsx` | Card horizontal rediseñada |
| `src/components/checkout/CheckoutForm.tsx` | Cards 2 cols, radio redesign, inputs premium, AuthModal en vez de /login |
| `src/app/carrito/page.tsx` | Sin cambios de lógica, opcional ajuste visual de padding |
| `src/app/checkout/page.tsx` | Sin cambios de lógica |

## 10. Archivos a eliminar

| Archivo | Motivo |
|---------|--------|
| `src/app/login/page.tsx` | Login se mueve a modal en Header. Redirect a `/`. |

**Nota:** Si hay imports a `/login` en otros archivos, se reemplazan por llamada a `<AuthModal open>`. Búsqueda previa con `grep` antes de eliminar.

---

## 11. Responsive design

Breakpoints Tailwind v4 por defecto:
- `sm` (640px) — tablet pequeño
- `md` (768px) — tablet
- `lg` (1024px) — desktop
- `xl` (1280px) — desktop grande

Validación en:
- 320px (iPhone SE 1)
- 375px (iPhone SE 3)
- 390px (iPhone 14)
- 414px (iPhone 14 Pro Max)
- 768px (iPad)
- 1024px (iPad Pro / laptop)
- 1440px (desktop)
- 1920px (full HD)

**Reglas clave:**
- Sin overflow horizontal en ningún breakpoint (`overflow-x-hidden` en body si necesario).
- Grid Home: padding vertical entre secciones 64px desktop / 32px mobile.
- Hero: min-height `100svh` (small viewport height para mobile browser chrome).
- Sticky bottom CTA en producto y carrito solo en mobile (`sm:hidden`).

---

## 12. Performance

- `next/font/google` genera self-hosted woff2, sin layout shift (CLS).
- SVG inline: cero requests de imágenes para iconos.
- Animaciones con `transform` y `opacity` (GPU), no `top/left/width`.
- `prefers-reduced-motion: reduce` deshabilita animaciones.
- IntersectionObserver con `disconnect()` después de disparar (no observe indefinidamente).
- Lighthouse Performance objetivo: > 90 (mobile).

---

## 13. Accesibilidad (WCAG AA)

- `aria-label` en botones de icono (menú, carrito, avatar, cerrar modal).
- `focus-visible:outline` con ring 4px `rgba(30,79,168,0.3)` en todos los interactivos.
- Contraste: `--color-text` (#1F2937) sobre `--color-bg` (#F8FAFC) = 14.8:1 (AAA). `--color-text-secondary` (#6B7280) sobre `#FFFFFF` = 4.6:1 (AA).
- Navegación teclado: focus trap dentro del `<AuthModal>` (primer foco en botón cerrar, TabContent loops).
- `prefers-reduced-motion`: animaciones deshabilitadas, contenido visible.

---

## 14. SEO (mantener y mejorar)

Actualmente:
- `metadata` por página (inicio, producto, categoría, etc.) — **se mantiene**.
- JSON-LD (Inicio, Producto, FAQPage, ContactPoint) — **se mantiene**.
- sitemap.xml, robots.txt — **se mantienen**.
- Open Graph + Twitter Cards (Fase 7) — **se mantienen**.

**Mejoras:**
- `id`s en secciones Home (`#marcas`, `#ofertas`) → anchor scroll + mejor crawling.
- `canonical` URLs en todas las páginas (verificar metadataBase en layout).

---

## 15. Reglas estrictas (constraints no negociables)

1. **NO tocar** Firebase, Firestore, Auth, reglas, APIs, inventario, carrito lógica, checkout lógica.
2. **NO modificar** payloads de `/api/pedidos`, `/api/admin/variantes`, etc.
3. **Mantener** metadata, JSON-LD, sitemap, robots, manifest, Web Vitals.
4. **Mantener** ISR (`revalidate = 3600`) en Home y categorías.
5. **Mantener** SSG en producto con `generateStaticParams`.
6. **Sin emojis** en ninguna parte de la UI.
7. **Sin dependencias nuevas** (salvo fuentes de `next/font/google` que ya son gratis).
8. **Sin imágenes externas** excepto las de productos (R2) y el placeholder del Hero (que puede ser el primer destacado o un fallback CSS).

---

## 16. Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| Eliminar `/login` rompe links externos o Google-indexed | Implementar `redirect("/")` en `/login/page.tsx`. Búsqueda `grep "/login"` antes de eliminar. |
| `prefers-reduced-motion` mal implementado causa layout roto | `useScrollAnimation` retorna `visible=true` inmediatamente si `prefers-reduced-motion` está activo. |
| Parallax afecta CWV (LCP/CLS) | Solo desktop, solo en Hero, `transform` (GPU). Validar con Lighthouse. |
| Eliminar Sora rompe referencias `--font-sora` | `globals.css` mantiene `--font-sora` como alias de Inter Tight (o reemplazo directo de variable CSS). |
| Modificar tokens cambia color en admin pages | Admin hereda tokens pero **no se rediseña su layout/estructura** (el brief solo cubre storefront). Los cambios de color/typografía se propagan, pero los componentes admin se mantienen funcionales. Validar visualmente que el admin sigue legible. |
| build roto por imports a `/login` | Búsqueda exhaustive y reemplazo antes de eliminar. |

---

## 17. Verificación post-implementación

1. `npx tsc --noEmit` — sin errores.
2. `npm run lint` — sin errores nuevos.
3. `npm test` — todos los tests pasan (no se agregan tests visuales, los existentes deben mantenerse).
4. `npm run build` — build exitoso (25+ páginas).
5. Verificar rutas: `/`, `/producto/[slug]`, `/categoria/[slug]`, `/carrito`, `/checkout`, `/contacto`, `/preguntas`, `/reparaciones`, `/admin/*`.
6. Login: modal abre desde Header, no redirige a `/login`.
7. Carrito: agregar/quitar/cambiar cantidad funcionan.
8. Checkout: enviar pedido vía WhatsApp funciona.
9. Responsive: sin overflow horizontal en 320, 375, 390, 414, 768, 1024, 1440, 1920px.
10. `prefers-reduced-motion`: animaciones deshabilitadas, contenido visible.
11. Lighthouse Performance > 90 (mobile).
