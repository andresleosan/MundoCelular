# Mundo Celular — Style Reference
> Catálogo tecnológico flotante sobre lienzo blanco, con acento azul profundo

**Theme:** light

Mundo Celular corre sobre un lienzo blanco casi idéntico en espíritu al modelo de descubrimiento de Shop, pero reconstruido enteramente en tonos de azul oscuro: la marca no toma prestado un solo acento de color, sino que construye toda su jerarquía (fondo, texto, bordes, superficies) a partir de una misma familia de azules, del más pálido al más profundo, rematada en blanco puro. Los productos flotan en tarjetas muy redondeadas (28px), controles en píldora, y un cuerpo compacto de 16px con tracking ajustado. El único color verdaderamente saturado del sistema es **Mundo Blue** (#143b98) — vive en el wordmark, el botón "Comprar por WhatsApp" y el submit del buscador. Todo lo demás desciende de esa misma tonalidad: azules casi negros para texto, azules grisáceos para superficies secundarias, azules muy pálidos para el canvas. El resultado se lee tecnológico y confiable sin depender de negro puro en ningún punto del sistema.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Canvas Frost | `#eef2f9` | `--color-canvas-frost` | Fondo de página y superficie secundaria detrás de tarjetas elevadas |
| Pure White | `#ffffff` | `--color-pure-white` | Superficie principal de tarjetas, inputs, píldoras y paneles admin |
| Ink Navy | `#0a1930` | `--color-ink-navy` | Texto principal, encabezados, íconos — reemplaza al negro puro por un azul casi negro |
| Faint Border | `#e0e6f0` | `--color-faint-border` | Divisores finos en tarjetas, bordes de inputs y píldoras |
| Steel Blue-Gray | `#5b6b85` | `--color-steel-blue-gray` | Texto secundario, etiquetas de navegación, specs de producto |
| Cool Frost | `#c7d0de` | `--color-cool-frost` | Placeholders, estados deshabilitados, íconos inactivos |
| Mist Blue | `#a8b8d0` | `--color-mist-blue` | Tintes de superficie para tarjetas secundarias y fondos de sección |
| Mundo Blue | `#143b98` | `--color-mundo-blue` | Botón "Comprar por WhatsApp", wordmark, submit del buscador — el único acento saturado |
| Blue Wash | `#c3d4f7` | `--color-blue-wash` | Halo translúcido detrás del botón de acento, extiende el brillo sin cambiar el matiz |
| Abyss Navy | `#0f1f3d` | `--color-abyss-navy` | Tarjetas de producto en modo oscuro, overlays profundos sobre fotografía |
| Slate Mist | `#3d4f70` | `--color-slate-mist` | Gris-azulado desaturado para fondos de fotografía de producto, no es token de UI activo |

## Tokens — Typography

### Sora — Tipografía primaria en todos los tamaños, cuerpo y encabezados. Sora Regular a 16px/-0.02em es el caballo de batalla para cuerpo, botones y etiquetas. Sora SemiBold a 20px/-0.03em cubre los encabezados de sección; Sora Medium a 11–12px maneja micro-etiquetas y specs cortas. La jerarquía se construye con grado y tracking, no con contraste de negrita — el mismo principio que el sistema de referencia, aplicado con una tipografía de carácter más técnico, coherente con el rubro. · `--font-sora`
- **Substitute:** Inter, system-ui, -apple-system
- **Weights:** 400, 500, 600
- **Sizes:** 9px, 11px, 12px, 14px, 16px, 20px
- **Line height:** 1.10–1.38
- **Letter spacing:** -0.03em a 20px, -0.02em a 16px, -0.015em a 14px, -0.01em a 12px, -0.005em a 9px

### JetBrains Mono — Reservada para precios, specs técnicas (RAM, almacenamiento, potencia) y códigos de producto. Un guiño deliberado al rubro: los datos técnicos se leen como ficha de especificaciones, no como texto de marketing · `--font-jetbrains-mono`
- **Substitute:** ui-monospace, "SF Mono", monospace
- **Weights:** 400, 500
- **Sizes:** 12px, 14px, 16px
- **Line height:** 1.25–1.40
- **Letter spacing:** 0em
- **Role:** Precios, specs (ej. "128GB", "Bluetooth 5.3"), SKU y códigos de pedido — cualquier dato que el cliente compare entre productos

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 11px | 1.33 | -0.005em | `--text-caption` |
| body-sm | 12px | 1.33 | -0.01em | `--text-body-sm` |
| body | 14px | 1.33 | -0.015em | `--text-body` |
| body-lg | 16px | 1.33 | -0.02em | `--text-body-lg` |
| price | 16px | 1.25 | 0em | `--text-price` (JetBrains Mono) |

## Tokens — Spacing & Shapes

**Density:** compact

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 6 | 6px | `--spacing-6` |
| 8 | 8px | `--spacing-8` |
| 10 | 10px | `--spacing-10` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |

### Border Radius

| Element | Value |
|---------|-------|
| cards | 28px |
| chips | 9999px |
| pills | 20px |
| inputs | 9999px |
| search | 9999px |
| buttons | 9999px |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| sm | `rgba(10, 25, 48, 0.06) 0px 2px 8px 0px` | `--shadow-sm` |
| sm-2 | `rgba(10, 25, 48, 0.1) 0px 4px 6px -1px, rgba(10, 25, 48, 0.1) 0px 2px 4px -2px` | `--shadow-sm-2` |
| lg | `rgba(10, 25, 48, 0.12) 0px 4px 24px 0px` | `--shadow-lg` |
| lg-2 (acento) | `rgba(20, 59, 152, 0.34) 0px 4px 24px 0px` | `--shadow-lg-2` |

### Layout

- **Page max-width:** 1200px
- **Section gap:** 64px
- **Card padding:** 0px
- **Element gap:** 12px

## Components

### Botón "Comprar por WhatsApp" (elemento firma)
**Role:** Acción de checkout — el elemento distintivo de toda la marca

Píldora a 9999px, fondo Mundo Blue (#143b98), texto blanco 14px Sora SemiBold, ícono de WhatsApp a la izquierda a 18px en blanco. Sombra tintada con el propio acento: `0 4px 24px rgba(20,59,152,0.34)`. Es el único elemento del sistema con fondo de color saturado — todo lo demás es blanco o azul-neutro, así que este botón siempre gana la atención visual. Aparece fijo al fondo del carrito y como CTA principal en cada tarjeta de producto en vista rápida.

### Hero Product Card
**Role:** Tarjeta destacada flotante sobre el wordmark

Superficie blanca, radio 28px, sombra dual suave (`--shadow-sm-2`). Imagen del producto 1:1 con radio interno 20px, nombre del producto en 14px Sora SemiBold sobre Ink Navy, y precio en 14px JetBrains Mono debajo. Cero padding interno; la imagen llega hasta el borde redondeado.

### Category Pill
**Role:** Chip de acceso rápido a categoría (Celulares, Accesorios, Consolas, Bafles, Electrodomésticos)

Píldora a 9999px, fondo blanco, borde 1px Faint Border, sombra `--shadow-sm`. Ícono de 16px en Mundo Blue a la izquierda, etiqueta 14px Sora Regular en Ink Navy a la derecha. Padding 6px vertical, 12px horizontal.

### Search Input con Submit en Mundo Blue
**Role:** Control principal de navegación y descubrimiento

Contenedor píldora a 9999px, fondo blanco, borde 1px Ink Navy al 10% de opacidad, padding 4px vertical / 20px horizontal izquierdo. A la derecha, botón circular de submit de 48px en Mundo Blue con flecha blanca, sombra `--shadow-lg-2`. Placeholder en 16px Sora Regular sobre Steel Blue-Gray.

### Product Image Tile
**Role:** Tarjeta de grilla de categoría con etiqueta superpuesta

Imagen a sangre completa, sin padding interno, radio 0px en contexto de grilla. Etiqueta semi-transparente blanca en la esquina inferior izquierda con el nombre del producto en 14px Sora SemiBold, radio 12px, padding interno 12px.

### Category Section Header
**Role:** Título de sección con chevron

Alineado a la izquierda, 20px Sora SemiBold a -0.03em en Ink Navy, seguido de chevron 16px en Mundo Blue (no Ink Navy — un pequeño guiño de color que invita al scroll). Margen inferior 24px antes de la grilla de 2 o 4 columnas.

### Sidebar Nav Rail (desktop) / Bottom Tab Bar (mobile)
**Role:** Navegación persistente

Desktop: columna vertical angosta (~64px), fondo blanco, sin borde. Cada ítem es un ícono de 24px en Ink Navy centrado en un área táctil de 48px; el estado activo llena el contenedor con Canvas Frost a radio 20px, y el ícono activo cambia a Mundo Blue.
Mobile: la misma lógica se aplana en una barra inferior fija de 64px de alto, fondo blanco, sombra `--shadow-sm` hacia arriba, con los mismos 4-5 íconos y el mismo tratamiento de estado activo. Dado que el tráfico de Mundo Celular es mayormente móvil, esta es la variante principal a construir primero.

### Variant Swatch (color/capacidad)
**Role:** Selector de variante dentro de la ficha de producto

Fila de círculos de 32px con borde 1px Faint Border; la variante seleccionada gana un anillo exterior de 2px en Mundo Blue con 2px de separación. Debajo, la capacidad/color en 12px JetBrains Mono sobre Steel Blue-Gray.

### Price Badge
**Role:** Precio destacado en tarjeta de producto

12–14px JetBrains Mono Medium en Ink Navy, sin símbolo de moneda decorativo — solo "$" + número con separador de miles. Si hay descuento, el precio anterior se tacha en Cool Frost a 12px, y el precio final se resalta en Mundo Blue.

### Cookie / Aviso de Privacidad Button
**Role:** Botón de acción en banner de aviso

Píldora 9999px, fondo blanco, borde 1px Faint Border. Texto 12px Sora SemiBold en Ink Navy, centrado. Padding 6px vertical, 16px horizontal. Sombra `--shadow-sm`.

### Historial de pedidos del cliente
**Role:** Seguimiento personal de compras desde la cuenta.

Lista vertical de tarjetas navy con radio de tarjeta, separada de las tablas administrativas. Cada pedido combina codigo y total en JetBrains Mono, fecha y productos en texto secundario, y una capsula de estado sobria. El detalle se abre bajo la lista para mantener el contexto; el unico fondo saturado es el CTA de WhatsApp en Mundo Blue. En mobile conserva una sola columna, areas tactiles completas y foco visible.

## Do's and Don'ts

### Do
- Construir toda la paleta como derivados de un mismo azul — del Canvas Frost más pálido al Abyss Navy más oscuro — nunca introducir un gris neutro sin matiz azul
- Reservar Mundo Blue (#143b98) exclusivamente para el botón de WhatsApp, el wordmark y el submit del buscador — es el único acento saturado y debe permanecer singular
- Usar JetBrains Mono para todo dato comparable (precio, specs, capacidad) — refuerza que esta es una tienda de tecnología, no solo de moda
- Emparejar cada tarjeta elevada con la sombra dual suave — nunca una sombra dura de una sola capa
- Mantener 64px de respiro vertical entre secciones mayores para que el catálogo se sienta explorable
- Teñir la sombra del botón de acento con el propio Mundo Blue para reforzar el color en la elevación misma

### Don't
- No agregar un segundo color saturado — el sistema es monocromático en azul, un segundo acento lo aplanaría
- No usar esquinas rectas en tarjetas, botones o inputs — 0px de radio se reserva solo para bordes de imagen
- No usar negro puro en ningún punto — incluso el texto "negro" es Ink Navy, un azul casi negro
- No usar pesos bold (700+) — la jerarquía se construye con grado y tracking, no con contraste de peso
- No mezclar JetBrains Mono en texto conversacional — solo en precios, specs y códigos
- No romper la convención de píldora 9999px en controles que van en línea con texto (buscador, chips, botones de cookie)

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#eef2f9` | Fondo de página — visible en bordes y detrás del rail/bottom bar |
| 1 | Surface | `#ffffff` | Superficie principal de tarjetas, inputs, píldoras, nav y buscador |
| 2 | Elevated Card | `#ffffff` | Tarjetas hero y fichas de producto — mismo blanco, elevado con sombra dual |
| 3 | Accent Product Image | `#0f1f3d` | Fotografía de producto oscura que lee como "modo oscuro" dentro del lienzo claro |

## Elevation

- **Hero Product Card:** `rgba(10,25,48,0.1) 0px 4px 6px -1px, rgba(10,25,48,0.1) 0px 2px 4px -2px`
- **Botón WhatsApp / Search Submit:** `rgba(20,59,152,0.34) 0px 4px 24px 0px`
- **Category Pill:** `rgba(10,25,48,0.06) 0px 2px 8px 0px`
- **Bottom Tab Bar:** `rgba(10,25,48,0.08) 0px -2px 12px 0px`

## Imagery

La fotografía de producto domina: recortes 1:1 sobre blanco para celulares y accesorios, e imágenes de estilo de vida para consolas y bafles con fondos en Slate Mist (nunca fondos de color saturado). Las imágenes cargan su propio color — la UI se mantiene en la familia de azules para que el producto sea la variedad visual. Íconos mono en Ink Navy, salvo el ícono de categoría en cada chip, que puede usar el color nativo de la marca del producto cuando aplique (ej. logo de consola). Sin ilustraciones, sin 3D, sin gradientes sobre fotografía de producto.

## Layout

Ancho máximo 1200px centrado sobre lienzo Canvas Frost, con rail lateral de 64px en desktop y bottom tab bar en mobile. El hero es una franja de ancho completo con tarjetas de producto flotando sobre el wordmark en Mundo Blue, buscador en píldora justo debajo. Los chips de categoría (Celulares, Accesorios, Consolas, Bafles, Electrodomésticos) van en una fila centrada bajo el buscador. Las secciones de contenido siguen como franjas con encabezado + grilla de 2 o 4 columnas. Ritmo vertical generoso: 64px entre secciones mayores. El botón "Comprar por WhatsApp" flota fijo en la parte inferior de la pantalla de carrito, siempre visible.

## Logo y Marca

El isotipo real de Mundo Celular combina un globo terráqueo (mitad izquierda) con un smartphone que muestra dos engranajes en pantalla (mitad derecha), ambos en el azul de marca `#143b98` sobre fondo blanco, contenidos en un círculo con borde azul. Debajo, el wordmark "MUNDO CELULAR" en mayúsculas, mismo azul, tipografía condensada bold.

**Reglas de uso:**
- El logo solo funciona sobre fondo blanco o Canvas Frost — nunca sobre fondos oscuros ni directamente sobre fotografía sin una placa blanca detrás.
- No recolorear el ícono: el globo y el smartphone siempre van en `#143b98` sólido, sin gradientes ni variantes.
- Espacio de resguardo mínimo alrededor del logo: al menos el ancho del propio círculo.
- El wordmark tipográfico del sistema digital (Sora SemiBold en `#143b98`) es una interpretación para interfaz — no reemplaza al isotipo, que se reserva para ícono de app, favicon y bloque de marca en el footer.

**Redes sociales** (para footer y bloque "Síguenos"):
- Instagram: [@mundo_celular_75](https://www.instagram.com/mundo_celular_75/)
- Facebook: [Mundo Celular](https://www.facebook.com/Mundo.Celular.01)
- TikTok: [@mundocelular75](https://www.tiktok.com/@mundocelular75)

## Agent Prompt Guide

Quick Color Reference:
- Background: `#eef2f9` (canvas), `#ffffff` (surface)
- Text: `#0a1930` (primario), `#5b6b85` (secundario)
- Border: `#e0e6f0` (hairline)
- Accent: `#143b98` (Mundo Blue — wordmark + botón WhatsApp + submit)
- Shadow tint: `rgba(20,59,152,0.34)` solo para elementos de acento
- Acción primaria: `#143b98` (fondo lleno)

Example Component Prompts:

1. Crear el botón "Comprar por WhatsApp": píldora 9999px, fondo `#143b98`, texto blanco 14px Sora SemiBold, ícono WhatsApp 18px blanco a la izquierda, sombra `0 4px 24px rgba(20,59,152,0.34)`, padding 12px vertical / 24px horizontal, fijo al fondo del carrito con `position: sticky`.

2. Crear una tarjeta de producto: radio 28px, fondo `#ffffff`, sombra dual (`rgba(10,25,48,0.1) 0 4px 6px -1px` + `rgba(10,25,48,0.1) 0 2px 4px -2px`). Imagen 1:1 con radio interno 20px llenando el borde. Debajo: nombre en 14px Sora SemiBold `#0a1930`, precio en 14px JetBrains Mono `#143b98`. Sin padding, sin borde.

3. Crear un chip de categoría: píldora 9999px, fondo `#ffffff`, borde 1px `#e0e6f0`, sombra `rgba(10,25,48,0.06) 0 2px 8px`. Ícono 16px en `#143b98` a la izquierda, etiqueta 14px Sora Regular `#0a1930` a la derecha, padding 6px vertical / 12px horizontal.

4. Crear el bottom tab bar mobile: barra fija de 64px de alto, fondo `#ffffff`, sombra hacia arriba `rgba(10,25,48,0.08) 0px -2px 12px 0px`. 4-5 íconos de 24px en `#0a1930`, estado activo en `#143b98` con fondo `#eef2f9` a radio 20px detrás del ícono.

## Typography Hierarchy Rules

Sora construye toda su jerarquía a través de tres grados (Regular, Medium, SemiBold) y tracking negativo — nunca por contraste de peso puro. Los tamaños de encabezado usan tracking más ajustado (-0.03em a 20px), mientras que las micro-etiquetas relajan a -0.005em. JetBrains Mono queda reservada exclusivamente para datos comparables (precio, specs, capacidad) — nunca para títulos ni cuerpo de texto conversacional. El cuerpo de 16px es Sora Regular, los subtítulos de 14px son Sora SemiBold, y los metadatos de 12px son Sora Medium.

## Product Card Composition

Las tarjetas son primero-imagen: la foto define la identidad visual de la tarjeta, y el tipo (Sora) es una etiqueta de apoyo debajo. El radio de la tarjeta (28px) siempre es mayor que el radio interno de la imagen (20px) por ~8px, creando un marco blanco sutil incluso sobre fotos de producto con fondo blanco. Nunca recortar la imagen al radio exacto de la tarjeta — el radio interno de 20px provee un borde blanco visible que separa el producto del borde de la tarjeta.

## Similar Brands

- **Coolblue** — Tienda de electrónica con marca 100% construida sobre un azul profundo y blanco, sin segundo acento
- **Best Buy** — Retail de tecnología con azul como color de marca dominante sobre fondo blanco
- **Samsung.com** — Fotografía de producto grande en tarjetas redondeadas con azul como acento de acción
- **PayPal** — Sistema achromático con un solo azul saturado reservado para botones de acción
- **Movistar** — Telecom regional con azul profundo como identidad, relevante para el contexto colombiano

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-canvas-frost: #eef2f9;
  --color-pure-white: #ffffff;
  --color-ink-navy: #0a1930;
  --color-faint-border: #e0e6f0;
  --color-steel-blue-gray: #5b6b85;
  --color-cool-frost: #c7d0de;
  --color-mist-blue: #a8b8d0;
  --color-mundo-blue: #143b98;
  --color-blue-wash: #c3d4f7;
  --color-abyss-navy: #0f1f3d;
  --color-slate-mist: #3d4f70;

  /* Typography — Font Families */
  --font-sora: 'Sora', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-jetbrains-mono: 'JetBrains Mono', ui-monospace, "SF Mono", monospace;

  /* Typography — Scale */
  --text-caption: 11px;
  --leading-caption: 1.33;
  --text-body-sm: 12px;
  --leading-body-sm: 1.33;
  --text-body: 14px;
  --leading-body: 1.33;
  --text-body-lg: 16px;
  --leading-body-lg: 1.33;
  --text-price: 16px;
  --leading-price: 1.25;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-6: 6px;
  --spacing-8: 8px;
  --spacing-10: 10px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 64px;
  --card-padding: 0px;
  --element-gap: 12px;

  /* Border Radius */
  --radius-cards: 28px;
  --radius-chips: 9999px;
  --radius-pills: 20px;
  --radius-inputs: 9999px;
  --radius-search: 9999px;
  --radius-buttons: 9999px;

  /* Shadows */
  --shadow-sm: rgba(10, 25, 48, 0.06) 0px 2px 8px 0px;
  --shadow-sm-2: rgba(10, 25, 48, 0.1) 0px 4px 6px -1px, rgba(10, 25, 48, 0.1) 0px 2px 4px -2px;
  --shadow-lg: rgba(10, 25, 48, 0.12) 0px 4px 24px 0px;
  --shadow-lg-2: rgba(20, 59, 152, 0.34) 0px 4px 24px 0px;

  /* Surfaces */
  --surface-canvas: #eef2f9;
  --surface-surface: #ffffff;
  --surface-elevated-card: #ffffff;
  --surface-accent-product-image: #0f1f3d;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-canvas-frost: #eef2f9;
  --color-pure-white: #ffffff;
  --color-ink-navy: #0a1930;
  --color-faint-border: #e0e6f0;
  --color-steel-blue-gray: #5b6b85;
  --color-cool-frost: #c7d0de;
  --color-mist-blue: #a8b8d0;
  --color-mundo-blue: #143b98;
  --color-blue-wash: #c3d4f7;
  --color-abyss-navy: #0f1f3d;
  --color-slate-mist: #3d4f70;

  /* Typography */
  --font-sora: 'Sora', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-jetbrains-mono: 'JetBrains Mono', ui-monospace, "SF Mono", monospace;

  /* Typography — Scale */
  --text-caption: 11px;
  --leading-caption: 1.33;
  --text-body-sm: 12px;
  --leading-body-sm: 1.33;
  --text-body: 14px;
  --leading-body: 1.33;
  --text-body-lg: 16px;
  --leading-body-lg: 1.33;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-6: 6px;
  --spacing-8: 8px;
  --spacing-10: 10px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;

  /* Border Radius */
  --radius-cards: 28px;
  --radius-chips: 9999px;
  --radius-pills: 20px;

  /* Shadows */
  --shadow-sm: rgba(10, 25, 48, 0.06) 0px 2px 8px 0px;
  --shadow-sm-2: rgba(10, 25, 48, 0.1) 0px 4px 6px -1px, rgba(10, 25, 48, 0.1) 0px 2px 4px -2px;
  --shadow-lg: rgba(10, 25, 48, 0.12) 0px 4px 24px 0px;
  --shadow-lg-2: rgba(20, 59, 152, 0.34) 0px 4px 24px 0px;
}
```
