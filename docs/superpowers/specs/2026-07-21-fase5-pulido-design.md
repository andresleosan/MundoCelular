# Fase 5 — Pulido Mobile + Páginas Estáticas + Auditoría

**Fecha:** 2026-07-21
**Estado:** Aprobado por el operador
**Spec base:** `docs/superpowers/specs/2026-07-19-mundocelular-mvp-design.md` (§5, §6, §8, §9)

---

## 1. Alcance

Pulido final del MVP: navegación mobile, páginas `/contacto` y `/preguntas`, contenido completo de `/reparaciones`, sección de reparaciones en home, footer mejorado, y auditoría CWV/WCAG.

## 2. Decisiones

| # | Decisión | Elección | Razón |
|---|----------|----------|-------|
| 1 | Bottom tab bar | Inicio \| Categorías \| Carrito \| WhatsApp (4 ítems) | Práctico para ecommerce; WhatsApp como acceso directo |
| 2 | Estilo bottom bar | Iconos SVG inline + label texto, fixed bottom, oculto en sm+ | Sin dependencias; se oculta en desktop donde el header ya tiene todo |
| 3 | /contacto contenido | Datos de ConfigTienda + mapa estático (sin API key) + CTA WhatsApp | Reutiliza config existente; sin costo de API de mapas |
| 4 | /preguntas contenido | 6-8 preguntas hardcodeadas (garantía, envío, pago, reparación, devolución) | FAQ estático; no necesita CMS; schema FAQPage para SEO |
| 5 | /reparaciones contenido | Lista de servicios (pantalla, batería, software, etc.) + precios orientativos + CTA WhatsApp con mensaje prellenado | Expande la página actual minimal |
| 6 | Home sección reparaciones | Banner/CTA entre destacados y footer | Promoción transversal según spec MVP |
| 7 | Footer | Agregar links a /contacto y /preguntas; mantener estructura actual | Navegación completa desde cualquier página |

## 3. Componentes a crear/modificar

### 3.1 BottomTabBar (NUEVO)
- `src/components/layout/BottomTabBar.tsx`
- "use client", fixed bottom, solo visible en `< sm` (640px)
- 4 ítems: Inicio (home icon), Categorías (grid icon), Carrito (bag icon), WhatsApp (phone icon)
- WhatsApp abre `wa.me/573113554021` directamente
- Carrito muestra badge con cantidad del carrito
- Activo: estado de ruta actual con `usePathname()`
- Alturas: 64px fijo, safe-area padding bottom para iOS

### 3.2 Layout update
- `src/app/layout.tsx`: agregar `<BottomTabBar />` después del `<Footer />`
- Body padding-bottom: `pb-20 sm:pb-0` para compensar bottom bar en mobile

### 3.3 Header mobile update
- `src/components/layout/Header.tsx`: el hamburger menu existente se mantiene
- No se agregan links al header — la navegación principal mobile pasa al bottom bar
- El hamburger solo muestra la búsqueda

### 3.4 /contacto (NUEVO)
- `src/app/contacto/page.tsx`
- Server component, lee `obtenerConfigTiendaServidor()`
- Contenido:
  - H1: "Contacto"
  - Dirección completa (de ConfigTienda)
  - Horario (de ConfigTienda)
  - Botón WhatsApp con número
  - Links a redes sociales (Instagram, Facebook, TikTok)
  - Mapa estático con iframe de OpenStreetMap (sin API key, embed libre)
- SEO: `metadataContacto()` en metadata.ts, `jsonldContacto()` en jsonld.ts
- JSON-LD: `ContactPoint` + `LocalBusiness`

### 3.5 /preguntas (NUEVO)
- `src/app/preguntas/page.tsx`
- Server component, contenido estático
- 6-8 preguntas frecuentes:
  1. ¿Cómo compro? → Proceso de pedido por WhatsApp
  2. ¿Aceptan tarjeta? → Formas de pago (efectivo, transferencia, Nequi, Daviplata)
  3. ¿Hacen envíos? → Envío a Medellín y alrededores
  4. ¿Tienen garantía? → 12 meses en productos nuevos
  5. ¿Reparan celulares? → Sí, en /reparaciones
  6. ¿Puedo devolver un producto? → Política de devolución
  7. ¿Dónde están? → Dirección de ConfigTienda
  8. ¿Cuál es su horario? → Horario de ConfigTienda
- SEO: `metadataPreguntas()` en metadata.ts, `jsonldPreguntas()` en jsonld.ts
- JSON-LD: `FAQPage` con las preguntas/respuestas
- Datos de contacto leídos de `obtenerConfigTiendaServidor()` para dirección/horario dinámicos

### 3.6 /reparaciones update
- `src/app/reparaciones/page.tsx`: expandir contenido actual
- Servicios ofrecidos:
  - Cambio de pantalla: desde $XX.XXX
  - Cambio de batería: desde $XX.XXX
  - Reparación de software: desde $XX.XXX
  - Cambio de puerto de carga: desde $XX.XXX
  - Desbloqueo de celular: desde $XX.XXX
  - Diagnóstico: GRATIS
- CTA WhatsApp con mensaje prellenado: `"Hola Mundo Celular, necesito reparar mi celular"`
- Datos de ConfigTienda para dirección/horario
- Mantener JSON-LD Service existente

### 3.7 Home — sección reparaciones
- `src/app/page.tsx`: agregar sección antes del cierre del main
- Banner tipo card: "¿Necesitas reparar tu celular?" con descripción breve y CTA a /reparaciones
- Estilo: rounded-cards, fondo abyss-navy o pure-white con borde, texto white o ink-navy
- Solo visible si hay contenido (siempre, pero con datos de ConfigTienda)

### 3.8 Footer update
- `src/components/layout/Footer.tsx`: agregar links a /contacto y /preguntas en la columna "Enlaces"
- Mantener estructura de 3 columnas
- Agregar: Contacto, Preguntas frecuentes

## 4. SEO

| Página | title | description | JSON-LD |
|---|---|---|---|
| /contacto | Contacto \| Mundo Celular | Dirección, horario y contacto de Mundo Celular en Medellín | ContactPoint + LocalBusiness |
| /preguntas | Preguntas frecuentes \| Mundo Celular | Resolvemos tus dudas sobre compras, envíos, garantía y reparaciones | FAQPage |
| /reparaciones | (ya existe, sin cambios de metadata) | (ya existe) | Service (ya existe) |

## 5. CWV / WCAG

### CWV (presupuestos)
- LCP < 2.5s:首页 hero ya es LCP; bottom bar no lo afecta (fixed, no empuja contenido)
- CLS < 0.1: bottom bar tiene altura fija 64px con safe-area; no causa layout shift
- INP < 200ms: bottom bar usa `usePathname()` (lectura, no escritura); click handlers mínimos

### WCAG AA
- Bottom bar: `aria-label` en cada ícono, `aria-current="page"` en activo, contraste 4.5:1 mínimo
- /preguntas: `<details>/<summary>` para accordion, focus visible, contraste de texto
- /contacto: links con texto descriptivo, `rel="noopener noreferrer"` en externos
- Todos los H1 únicos por página
- Navegación por teclado completa (tab order lógico)

## 6. Fuera de alcance de Fase 5

- CMS para preguntas frecuentes (YAGNI)
- API de mapas con API key (usan embed OpenStreetMap gratuito)
- Animaciones de transición entre páginas
- Lazy loading de secciones del home
- Breadcrumb en páginas estáticas (no crítico para MVP)

## 7. Criterios de aceptación

- [ ] Bottom tab bar visible en mobile (< 640px), oculta en desktop
- [ ] 4 ítems funcionales: Inicio, Categorías, Carrito (con badge), WhatsApp
- [ ] /contacto muestra datos de ConfigTienda + mapa + CTA WhatsApp
- [ ] /preguntas tiene 6-8 FAQ con schema FAQPage
- [ ] /reparaciones lista servicios con precios orientativos
- [ ] Home tiene sección de reparaciones
- [ ] Footer enlaza /contacto y /preguntas
- [ ] 1 solo H1 por página
- [ ] LCP < 2.5s, CLS < 0.1 en páginas de catálogo
- [ ] Bottom bar tiene aria-labels y contraste AA
