# Mundo Celular — Spec de Diseño MVP (SEO First + Ecommerce First)

**Fecha:** 2026-07-19
**Estado:** Aprobado por el operador (pendiente revisión final del spec escrito)
**Fuentes:** `docs/documento-maestro-mundocelular.md`, `docs/DESIGN-mundocelular.md`, Prompt Maestro Cronos, Prompt Maestro SEO First + Ecommerce First

---

## 1. Visión y alcance

Ecommerce de tecnología (celulares, accesorios, consolas, bafles, electrodomésticos) donde:

- El dueño administra el catálogo desde un panel, sin tocar código.
- Los clientes inician sesión con Google, arman un carrito y compran por WhatsApp (sin pasarela de pago).
- Cada pedido queda registrado en Firestore **antes** de abrir WhatsApp.
- La plataforma nace con arquitectura **SEO First** para posicionar el catálogo en búsquedas geolocalizadas (Medellín, Antioquia, Colombia).

**Prioridad de decisiones (en orden):** SEO → Conversión → Rendimiento → Escalabilidad → UX → Diseño visual.

## 2. Decisiones tomadas (mini-ADRs)

| # | Decisión | Elección | Razón |
|---|----------|----------|-------|
| 1 | Manejo de stock | Descuento automático al confirmar pedido; devolución al cancelar desde panel admin | Evita overselling desde el día 1; costo extra mínimo |
| 2 | Imágenes por producto | Galería (1 a 5 imágenes), primera = portada | El detalle de producto en tecnología necesita varias vistas |
| 3 | Estructura de tienda | Tienda única; número de WhatsApp en `configuracion/tienda` (Firestore) | Cambiar el número nunca requiere redeploy |
| 4 | Entrega | Retiro en tienda **o** domicilio (dirección/barrio condicionales); moneda COP | El domicilio es canal de venta clave en retail colombiano |
| 5 | Backend custom (validación servidor) | **Un solo Cloudflare Worker**: `POST /pedidos` + `POST /imagenes/presign` | Un solo backend; todo en capa gratuita (Spark + Workers free); reutiliza validación de token |
| 6 | Framework frontend | **Next.js (App Router) + TypeScript + Tailwind v4** | Único camino que cumple nativamente SEO First: SSG/ISR, slugs, metadata por página, sitemap/robots por convención |
| 7 | Despliegue | Vercel (app Next.js) + Cloudflare (Worker + R2) | Vercel da SSR/ISR sin fricción; Cloudflare concentra imágenes y backend |

### Descartadas

- **Vite SPA + prerender:** el catálogo vive en Firestore y lo edita el admin; prerender estático exigiría rebuild completo por cada cambio de producto. Incompatible con SEO First.
- **Astro + islas React:** dos modelos mentales para admin/carrito; ecosistema menos estándar para este caso.
- **Cloud Functions para pedidos:** requiere plan Blaze (tarjeta); crearía un segundo backend junto al Worker.
- **Validación solo con reglas Firestore:** no expresa recálculo de totales ni lógica de pedido; postura de seguridad débil.

## 3. Arquitectura

```
VERCEL — Next.js App Router (TS + Tailwind v4)
├── INDEXABLE (SSG/ISR, servidor lee Firestore con Admin SDK)
│   ├── /                     home (hero, chips categoría, destacados)
│   ├── /[categoria]          grilla de categoría (paginación cursor)
│   ├── /[categoria]/[producto]  ficha de producto
│   ├── /contacto             dirección, horario, WhatsApp, redes
│   ├── /reparaciones         servicio técnico de celulares
│   ├── /preguntas            FAQ
│   ├── /sitemap.xml          estáticas + categorías + productos activos
│   └── /robots.txt           Allow / — Disallow /admin /carrito /checkout /api
├── NOINDEX (componentes cliente, SDK web Firebase)
│   ├── /admin/*              panel CRUD (categorías, productos, pedidos, config)
│   ├── /carrito  /checkout  /cuenta
│   └── /api/revalidate       regeneración bajo demanda (secret + tag)
│
FIREBASE
├── Auth (Google) + custom claim `admin: true`
└── Firestore (datos) — sin Firebase Storage

CLOUDFLARE
├── Worker (backend único)
│   ├── POST /pedidos            valida token, recalcula, descuenta stock, crea pedido
│   ├── POST /pedidos/:id/cancelar  repone stock (solo admin)
│   └── POST /imagenes/presign   valida token + claim admin, entrega URL firmada
└── R2 (imágenes) servidas por dominio propio (img.<dominio>) o r2.dev
```

**Flujo de revalidación:** admin guarda producto/categoría → el panel (cliente) llama `POST /api/revalidate` con tag → Next regenera las páginas afectadas en segundos. Respaldo: revalidación temporal de 1 hora.

## 4. Modelo de datos (Firestore)

### `categorias`
```ts
{ nombre: string; slug: string; descripcion: string; orden: number; activa: boolean }
```

### `productos`
```ts
{
  nombre: string; slug: string; descripcion: string;
  precio: number;            // COP, entero (sin decimales)
  stock: number;
  categoriaId: string;       // ref a categorias
  marca: string;             // "Apple", "Samsung", "Xiaomi", ...
  specs: Record<string, string>;  // { "Almacenamiento": "128GB", ... }
  imagenes: Array<{ url: string; thumb: string; alt: string }>; // máx 5
  activo: boolean; destacado: boolean;
  metaTitle?: string; metaDescription?: string;  // overrides opcionales
  creadoEn: Timestamp; actualizadoEn: Timestamp;
}
```

### `carritos/{uid}`
```ts
{ items: Array<{ productoId: string; cantidad: number }>; actualizadoEn: Timestamp }
```

### `pedidos`
```ts
{
  clienteUid: string; clienteNombre: string; clienteEmail: string;
  items: Array<{ productoId: string; nombre: string; precioUnitario: number; cantidad: number; subtotal: number }>;
  total: number;             // recalculado en servidor, nunca del cliente
  entrega: { tipo: 'retiro' | 'domicilio'; direccion?: string; barrio?: string };
  estado: 'pendiente' | 'contactado' | 'cerrado' | 'cancelado';
  creadoEn: Timestamp; actualizadoEn: Timestamp;
}
```

### `configuracion/tienda`
```ts
{
  nombre: string; whatsapp: string;          // formato internacional sin "+": "57XXXXXXXXXX"
  direccion: string; ciudad: string; departamento: string; pais: string;
  horario: string;
  redes: { instagram: string; facebook: string; tiktok: string };
}
```
**Valores reales iniciales** (editables por el admin):
`whatsapp: "573113554021"`, `direccion: "Cra 36 # 38 - 33, Barrio El Salvador"`, `ciudad: "Medellín"`, `departamento: "Antioquia"`, `pais: "Colombia"`.

**Reglas del modelo:**
- `slug` único por colección, generado del nombre (minúsculas, sin tildes, guiones). Colisión → sufijo `-2`, `-3`.
- Slugs reservados (bloqueados en CRUD): `admin`, `carrito`, `checkout`, `cuenta`, `contacto`, `reparaciones`, `preguntas`, `api`, `sitemap.xml`, `robots.txt`.
- Índices: `productos(categoriaId, activo)`, `productos(slug)`, `categorias(slug)`, `pedidos(clienteUid, creadoEn)`.

## 5. Flujo de pedido (regla de oro: el servidor valida)

1. Cliente confirma carrito → elige `retiro` o `domicilio` (+ dirección/barrio si domicilio).
2. Cliente → `POST /pedidos` al Worker: header `Authorization: Bearer <idToken Firebase>` + body `{ items: [{productoId, cantidad}], entrega }`.
3. Worker:
   a. Verifica el idToken (Firebase Auth).
   b. Lee los productos desde Firestore (REST API + service account).
   c. Recalcula precios y total; verifica stock suficiente de cada ítem.
   d. Transacción: descuenta stock + crea el pedido (precios congelados).
   e. Responde `{ pedidoId, mensaje }` (texto del pedido ya armado).
4. Cliente abre `https://wa.me/<whatsapp>?text=<encodeURIComponent(mensaje)>` **solo tras el OK** — el pedido ya existe en Firestore.
5. Admin gestiona estados en el panel. Al marcar `cancelado` se ofrece "devolver stock" → `POST /pedidos/:id/cancelar` (Worker repone unidades en transacción).

**Formato del mensaje WhatsApp** (texto plano, fácil de copiar por el vendedor):
```
Hola Mundo Celular, quiero comprar:
• iPhone 13 128GB — x1 — $1.850.000
• Case iPhone 13 — x2 — $80.000
Total: $1.930.000
Entrega: Domicilio — Cra 45 #12-30, El Poblado
Pedido #ABC123 — Juan Pérez
```

## 6. Arquitectura SEO por página

| Página | H1 único | JSON-LD | Conversión |
|---|---|---|---|
| `/` | marca + propuesta de valor | Organization, LocalBusiness, WebSite | chips de categoría, destacados, CTA WhatsApp |
| `/[categoria]` | nombre categoría | CollectionPage, BreadcrumbList | grilla + texto SEO bajo el título |
| `/[categoria]/[producto]` | nombre producto | Product, Offer, BreadcrumbList | galería, precio COP, specs (JetBrains Mono), CTA WhatsApp sticky + agregar al carrito |
| `/contacto` | contacto | LocalBusiness, ContactPoint | dirección, horario, botón WhatsApp, redes |
| `/reparaciones` | Reparación de celulares en Medellín | Service, LocalBusiness, BreadcrumbList | servicios (pantalla, batería, software…), CTA WhatsApp con mensaje prellenado de reparación |
| `/preguntas` | preguntas frecuentes | FAQPage | resuelve objeciones (garantía, entrega, pago) |

**Promoción de reparaciones (transversal):** el home incluye una sección destacada de servicio técnico que enlaza a `/reparaciones`; el footer enlaza la página desde todo el sitio. El CTA de reparaciones abre WhatsApp con mensaje prellenado distinto al de pedido: `"Hola Mundo Celular, necesito reparar mi celular: <marca/modelo — campo opcional>"`.

- **Metadata por plantilla:** title `"{Producto} | {Categoría} en Medellín | Mundo Celular"`; description auto (precio + disponibilidad); canonical; OG con imagen del producto; Twitter card. Overrides opcionales por producto (`metaTitle`/`metaDescription`).
- **Keywords sin canibalización:** home → "tienda de celulares/tecnología en Medellín"; categoría → "comprar {categoría} en Medellín"; producto → "{marca} {modelo} precio Colombia"; reparaciones → "reparación de celulares / servicio técnico de celulares en Medellín".
- **Imágenes:** compresión cliente a WebP antes de subir; dos tamaños (thumb 600px listados, full 1600px detalle); `width`/`height` fijos (CLS≈0); lazy loading; `alt` auto = `"{nombre} {marca}"`.
- **CWV (presupuestos):** LCP < 2.5s, CLS < 0.1, INP < 200ms. `next/font` (Sora + JetBrains Mono self-hosted), code splitting por ruta, admin en chunk separado, dependencias auditadas en Fase 5.
- **Accesibilidad WCAG AA:** contraste validado (Ink Navy sobre blanco/canvas), focus visible, aria labels en navegación/botones de ícono, navegación completa por teclado, 1 solo H1 por página.
- **Escalabilidad:** el modelo sirve de 10 a 10.000 productos (ISR por tag, paginación cursor, índices compuestos). Sin reseñas falsas: E-E-A-T con contenido real (reseñas quedan fuera del MVP).

## 7. Seguridad

**Reglas Firestore:**
- `productos`, `categorias`, `configuracion`: lectura pública; escritura solo con custom claim `admin`.
- `carritos`: solo el dueño (`request.auth.uid == uid`).
- `pedidos`: lectura si dueño o admin; **creación y escritura de items/total/precios denegada a clientes** (solo Worker con service account, que bypasea reglas); admin puede actualizar `estado`.

**Worker:** verifica idToken en todos los endpoints; `/imagenes/presign` y `/pedidos/:id/cancelar` exigen además claim `admin`; CORS restringido al dominio de la app; validación de tipo (jpeg/png/webp) y tamaño máximo (5 MB) de imagen.

**Secretos:** service account en env de Vercel y en `wrangler secret`; nunca en el repo. Claves `NEXT_PUBLIC_*` de Firebase son públicas por diseño.

## 8. Sistema de diseño

Se implementan los tokens exactos de `docs/DESIGN-mundocelular.md` vía `@theme` de Tailwind v4: paleta azul monocromática (`#eef2f9`→`#0f1f3d`), acento único Mundo Blue `#143b98` (botón WhatsApp, wordmark, submit buscador), Sora para texto, JetBrains Mono solo para precios/specs/códigos, radio 28px tarjetas / 9999px píldoras, sombras duales suaves, rail lateral 64px desktop / bottom tab bar 64px mobile (mobile primero).

## 9. Fases de construcción

1. **Fase 1 — Base + Admin:** scaffold Next.js, tokens de diseño, Auth Google, custom claim admin, CRUD categorías/productos (con slugs), reglas Firestore. Productos sin imagen aún (placeholder).
2. **Fase 2 — Catálogo + Carrito:** home/categoría/producto en SSG/ISR, metadata, sitemap, robots, schemas base, carrito persistente.
3. **Fase 3 — Checkout:** Worker `POST /pedidos`, checkout retiro/domicilio, mensaje WhatsApp, panel de pedidos con estados.
4. **Fase 4 — Imágenes:** Worker presign, R2, compresión WebP cliente, galería (máx 5), alt/width/height.
5. **Fase 5 — Pulido:** bottom tab bar mobile, páginas `/contacto`, `/reparaciones` y `/preguntas`, sección de reparaciones en home, FAQ schema, auditoría CWV + WCAG, reporte final.

## 10. Criterios de aceptación (checklist de autocrítica por funcionalidad)

- [ ] Precio y stock validados del lado del servidor, nunca del cliente.
- [ ] Componentes usan tokens exactos del sistema de diseño (radios, colores, tipografía).
- [ ] Reglas Firestore bloquean escritura de precio/stock a no-admins.
- [ ] Mensaje WhatsApp codificado con `encodeURIComponent`.
- [ ] Pedido registrado en Firestore antes de abrir WhatsApp.
- [ ] Toda subida de imagen pasa por el Worker de validación, sin excepciones.
- [ ] 1 solo H1 por página; slugs limpios; metadata única por página indexable.
- [ ] El servicio de reparaciones se promociona en home y tiene página propia `/reparaciones` con CTA WhatsApp.
- [ ] LCP < 2.5s, CLS < 0.1, INP < 200ms en páginas de catálogo.

## 11. Entregable obligatorio por tarea

Cada tarea cerrada reporta: cambios realizados, archivos modificados, impacto SEO, impacto performance, impacto conversión, riesgos detectados, próximos pasos, y scores estimados (SEO / Performance / Conversión / Arquitectura, 0–100).

## 12. Fuera de alcance del MVP (YAGNI)

- Variantes con precio diferenciado, roles múltiples de admin, historial de compras del cliente, notificaciones, métricas, reseñas, multi-tienda, pasarela de pago.
