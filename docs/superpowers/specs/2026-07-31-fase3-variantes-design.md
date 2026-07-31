# Fase 3 — Variantes de producto · Spec de diseño

**Fecha:** 2026-07-31
**Alcance:** Variantes de producto con atributos combinables, precio y stock por variante, imágenes por variante.
**Fuera de alcance:** Roles múltiples, panel de métricas (se trabajarán en fases separadas).

---

## Modelo de datos

### Nueva colección: `variantes`

```ts
interface VarianteProducto {
  id: string;
  productId: string;       // FK → productos/id
  attributes: Record<string, string>;  // { "Color": "Negro", "Capacidad": "128GB" }
  precio: number;                  // COP entero
  stock: number;
  imagenes: ImagenProducto[];      // puede vaciarse (hereda del producto)
  active: boolean;                 // default true
}
```

### Cambio en Producto (mínimo)

Se añaden dos campos opcionales (retrocompatibles con datos existentes):

```ts
tieneVariantes?: boolean;              // false/undefined = producto sin variantes
atributosDisponibles?: string[];        // ej. ["Color", "Capacidad"]
```

### Restricciones

- Máx 10 atributos con nombres definidos por el admin (`atributosDisponibles`)
- Sin variantes (`tieneVariantes = false/undefined`): el producto funciona igual que hoy
- Con variantes (`tieneVariantes = true`): precio y stock del producto base se ignoran; se usa siempre el de la variante seleccionada

---

## Reglas Firestore

```
match /productos/{id} {
  allow read: if true;
  allow write: if esAdmin();
}

reserve /variantes/{id} {
  allow read: if true;
  allow write: if esAdmin();
}

```

### Índices compuestos requeridos

- `variantes(productId ASC, activo ASC, precio ASC)`

---

## Flujo del admin

### ProductoForm (modificado)

1. Nueva sección "Variante" debajo del formulario principal
2. Switch "¿Este producto tiene variantes?" → activa `tieneVariantes`
3. Input de tags para definir atributos: el admin escribe `Color, Capacidad` → se guarda como `atributosDisponibles: ["Color", "Capacidad"]`
4. Tabla de variantes con columnas dinámicas (según `atributosDisponibles`) + Precio + Stock + Acciones
5. Botón "Agregar variante" → modal con:
   - Campos dinámicos para cada atributo (texto libre)
   - Precio (COP entero)
   - Stock
   - ImageUploader (opcional, hereda del producto si se vacía)
6. Cada fila de la tabla tiene botones Editar/Eliminar

### Firestore Admin

- CRUD de variables en `src/lib/firestore/variantes.ts`:
  - `crearVariante(input: VarianteInput): Promise<string>`
  - `actualizarVariante(id, input): Promise<void>`
  - `eliminarVariante(id): Promise<void>`
  - `listarVariantesPorProducto(productId): Promise<VarianteProducto[]>`

### API endpoint

- `POST /api/admin/variantes` 
- `PUT /api/admin/variantes/[id]`
- `DELETE /api/admin/variantes/[id]`
- `GET /api/admin/variantes?productoId=XX` (admin‑only)

---

## Flujo del storefront

### ProductDetail

Cuando `tieneVariantes = true` y `atributosDisponibles` tiene valores:

1. **Selector de atributos:** Para cada atributo en `atributosDisponibles`, un dropdown o grupo de chips con las opciones disponibles (filtrando por las otras selecciones). Ej.:
   - Si Color=Negro filtra Capacidades solo a 128GB y 256GB
2. **Imagen reactiva:** La galería cambia a las im�genes de la variante seleccionada. Si la variante no tiene imágenes, usa las del producto base.
3. **Precio dinámico:** Actualiza al cambiar el selector (formateado en COP)
4. **Stock:** "Disponible: N" o "Agotado" por variante
5. **Botón carrito:** Se deshabilita si la variante está agotada. Guarda `varianteId` y `attributes` en el ítem del carrito

### Carrito (`ItemCarrito` extendido)

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| variantId | string | undefined | ID de la variante Firestore |
| attributes | Record<string, string) | undefined | Display-only en carrito (ej. "Negro / 128GB") |

`/carrito` muestra `{nombre} ({atributo1 / atributo2})` cuando hay variante.

### ProductCard / HeroProductCard

Si `tieneVariantes = true`:
- Precio mostrado: "Desde $X COP" (precio **mínimo**) entre todas las variantes activas)
- Sin acceso directo a la variante (el selector está en la página de producto)

### Checkout WhatsApp

Mensaje formateado:
```
Hola Mundo Celular, quiero pedir...

• iPhone 13 (Negro / 128GB / Especial) — 1 x $1.850.000
• AirPod Pro — 1 x $850.000

CS Total: $2.700.000
```

### API /api/pedidos

- Recibe `varianteId` en cada línea del pedido
- Descuenta stock de `variantes/{id}`, no del producto base
- Si no encuentra la variante o está agotada, rechaza el pedido

### Search y listados públicos

- Sin cambios en la lógica de búsqueda (la búsqueda es sobre nombre/descripción del producto)
- Sin cambios en sitemap/SEO (no indexiamo-variantes)

---

## Validación

### VarianteInput (Zod / zod)

```ts
const schemas = z.object({
  productId: z.string(),
  attributes: z.record(z.string()).min(1).max(10),
  precio: z.number().int().positive(),
  stock: z.number().int().min(0),
  imagenes: z.array(tipo ImagenProducto).default([]),
});
```

- Atributos: claves y valores string no vacíos
- Máximos 10 atributos (coincide con `atributosDisponibles` del producto)
- Precio: COP entero > 0, stock >= 0
- Imágenes: máximo 5, hereda del producto si vacío

---

## Archivos del plan

| Archivo | Cambio | Descripción |
|---------|--------|-------------|
| `src/types/index.ts` | MOD | Añadir `VarianteProducto`, `tieneVariantes`, `atributosDisponibles` |
| `src/lib/validacion.ts` | MOD | Validator `validarVariante` |
| `src/lib/firestore/variantes.ts` | **NEW** | CRUD client‑side de variantes |
| `src/lib/firestore/public.ts` | MOD | Función `obtenerVariantesPorProducto` |
| `firestore.rules` | MOD | Colección `variantes` |
| `src/components/admin/ProductoForm.tsx` | MOD | Sección variantes + modal |
| `src/components/producto/ProductDetail.tsx` | MOD | Selector de variantes |
| `src/components/producto/CarritoItem.tsx` | MOD | Mostrar atributos |
| `src/lib/formato-mensaje-pedido.ts` | MOD | Incluir atributos en mensaje |
| `src/app/api/admin/variantes/route.ts` | **NEW** | API de admin para variantes |
| `src/components/storefront/ProductCard.tsx` | MOD | "Desde $X" |
| `src/components/storefront/HeroProductCard.tsx` | MOD | "El mínimo $X" |
| `src/app/[categoria]/[producto]/page.tsx` | MOD | Generar metadata con variantes (OG) |
| `tests/ lib/validacion.test.ts` | MOD | Tests de variantes  ( TDD ) |
| `tests/lib/format.test.ts` | MOD | Test mensaje con atributos |

---

## Casos de error y border cases

1. **Producto tiene variantes pero admin las borró todas**: El storefront renderiza como "no está disponible" y deshabilitaro.
2. **Producto tiene variantes con stock 0**: El cliente ve todas como agotadas y no puede agregar al carrito.
3. **Variante eliminó después de agregar al carrito**: Cuando el cliente va al checkout del, se valida antes del pedido con stock actual de la variante.
4. **Migración "inversa":** Admin marca `tieneVariantes = false` de vuelta a true. Las variantes ya creadas se mantienen en la colección. El storefront vuelve a usar el precio y stock del producto base.
5. **Imágenes heredadas:** Si la variante tiene `imagenes: []`, se usan las del producto base en la galería del storefront.

---

## Convenciones

- `productId` con el nombre interno (camelCase en Firestore) — el modelo de datos del proyecto ya usa camelCase para campos internos en el SDK de admin, aunque la API REST de`.json` use snake_Case
- Se aplica la mismbre naming del proyecto: nueva colección `variantes` (plural, singular _errestore_ no tiene diccionario automático de pluralización)
- La UI y commits en español (Colombia), commits convencionales: `feat(f3): ...`
- Tokens definidos en `globals.css`; usar clases Tailwind; no hex directo excepto en componentes recién creados que usen el color de diseño del bootstrap generico no mapeado como`bg-blue-wash`