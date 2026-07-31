# Fase 3 — Variantes de producto · Plan de implementación

**Fecha:** 2026-07-31
**Estrategia:** TDD por tarea. Cada tarea: test primero → implementación → verificación.

---

## T1 — Tipos + validador de variantes (TDD)

### Tests primero (`tests/lib/validacion.test.ts`)
- `validarVariante` acepta variante válida con 2 atributos
- `validarVariante` rechaza sin atributos
- `validarVariante` rechaza más de 10 atributos
- `validarVariante` rechaza precio no entero o <= 0
- `validarVariante` rechaza stock negativo
- `validarVariante` rechaza clave o valor vacío en atributos

### Implementación
1. **`src/types/index.ts`** — Añadir `VarianteProducto`, extender `Producto` con `tieneVariantes?: boolean` y `atributosDisponibles?: string[]`
2. **`src/lib/validacion.ts`** — Añadir `VarianteInput` interface y `validarVariante(input: VarianteInput): string[]`

### Verificación
- `npx vitest run tests/lib/validacion.test.ts` — 6 tests nuevos pasan
- `npx tsc --noEmit` — sin errores

---

## T2 — CRUD Firestore de variantes (TDD)

### Tests primero (`tests/lib/firestore-variantes.test.ts`)
- `crearVariante` retorna ID y guarda en Firestore con campos correctos
- `listarVariantesPorProducto` retorna variantes del producto ordenadas por precio
- `actualizarVariante` modifica los campos correctos
- `eliminarVariante` borra el documento

### Implementación
1. **`src/lib/firestore/variantes.ts`** (nuevo) — CRUD client-side:
   - `crearVariante(input: VarianteInput): Promise<string>`
   - `actualizarVariante(id: string, input: Partial<VarianteInput>): Promise<void>`
   - `eliminarVariante(id: string): Promise<void>`
   - `listarVariantesPorProducto(productId: string): Promise<VarianteProducto[]>`

### Verificación
- `npx vitest run tests/lib/firestore-variantes.test.ts` — tests pasan (mock de Firestore)
- `npx tsc --noEmit` — sin errores

---

## T3 — Función pública `obtenerVariantesPorProducto` (TDD)

### Tests primero (`tests/lib/firestore-public.test.ts`)
- Añadir test para `obtenerVariantesPorProducto` retorna array de variantes activas
- Añadir test para producto sin variantes retorna array vacío

### Implementación
1. **`src/lib/firestore/public.ts`** — Añadir `obtenerVariantesPorProducto(productId: string)` con `unstable_cache` (tag: `variantes`)
2. Extender `toProducto` para incluir `tieneVariantes` y `atributosDisponibles` si aplica (o hacer función separada `conInfoVariantes`)

### Verificación
- `npx vitest run tests/lib/firestore-public.test.ts` — tests pasan
- `npx tsc --noEmit` — sin errores

---

## T4 — API admin de variantes (TDD)

### Tests primero (`tests/api/admin-variantes.test.ts`)
- `POST /api/admin/variantes` crea variante y retorna `{ id }`
- `GET /api/admin/variantes?productoId=XX` retorna variantes del producto
- `PUT /api/admin/variantes/[id]` actualiza variante
- `DELETE /api/admin/variantes/[id]` elimina variante
- Endpoints retornan 401 sin token válido

### Implementación
1. **`src/app/api/admin/variantes/route.ts`** (nuevo) — CRUD admin-only
2. **`src/app/api/admin/variantes/[id]/route.ts`** (nuevo) — PUT + DELETE por id

### Verificación
- `npx vitest run tests/api/` — tests pasan
- `npx tsc --noEmit` — sin errores

---

## T5 — ProductoForm con sección de variantes (TDD)

### Tests primero (`tests/components/ProductoForm.test.tsx`)
- Renderiza switch "¿Este producto tiene variantes?"
- Al activar switch, muestra input de tags para atributos
- Al agregar tag "Color, Capacidad", se guarda `atributosDisponibles`
- Muestra tabla de variantes con columnas dinámicas
- Botón "Agregar variante" abre modal con campos dinámicos
- Modal valida precio entero positivo y stock >= 0
- Eliminar variante de la tabla funciona

### Implementación
1. **`src/components/admin/ProductoForm.tsx`** — Añadir:
   - Switch `tieneVariantes`
   - Input tags para `atributosDisponibles`
   - Tabla de variantes existente
   - Modal "Agregar/Editar variante" con campos dinámicos + ImageUploader
   - Estado local para variantes (`variantes: VarianteInput[]`)
   - Al guardar producto, persistir `tieneVariantes` y `atributosDisponibles`

### Verificación
- `npx vitest run tests/components/ProductoForm.test.tsx` — tests pasan
- `npx tsc --noEmit` — sin errores

---

## T6 — ProductDetail con selector de variantes (TDD)

### Tests primero (`tests/components/producto/ProductDetail.test.tsx`)
- Si `tieneVariantes = false`, renderiza producto normal (sin cambios)
- Si `tieneVariantes = true`, muestra dropdowns para cada atributo
- Cambiar atributo filtra opciones disponibles de otros atributos
- Al seleccionar variante, precio se actualiza
- Al seleccionar variante, stock muestra "Disponible: N" o "Agotado"
- Al seleccionar variante sin imágenes, usa imágenes del producto base
- Botón "Agregar al carrito" deshabilitado si variante agotada
- Botón WhatsApp incluye atributos en mensaje

### Implementación
1. **`src/components/producto/ProductDetail.tsx`** — Añadir:
   - Estado `varianteSeleccionada` + `selecciones` (mapa atributo→valor)
   - Dropdowns/chips dinámicos por `atributosDisponibles`
   - Lógica de filtrado cruzado de opciones disponibles
   - Galería reactiva (variante.imagenes || producto.imagenes)
   - Precio dinámico con `formatearCOP`
   - Stock dinámico
   - Deshabilitar botón carrito si stock 0
   - Mensaje WhatsApp con atributos

### Verificación
- `npx vitest run tests/components/producto/ProductDetail.test.tsx` — tests pasan
- `npx tsc --noEmit` — sin errores

---

## T7 — AgregarAlCarrito con varianteId (TDD)

### Tests primero (`tests/components/producto/AgregarAlCarrito.test.tsx`)
- Al agregar producto sin variantes, item del carrito no tiene `varianteId` ni `atributos`
- Al agregar producto con variante seleccionada, item tiene `varianteId` y `atributos`

### Implementación
1. **`src/components/producto/AgregarAlCarrito.tsx`** — Aceptar prop `varianteId?: string` y `atributos?: Record<string, string>`
2. **`src/hooks/useCarrito.ts`** — Extender `CartItemLocal` con `varianteId?: string` y `atributos?: Record<string, string>`. Actualizar `agregar` para aceptar y propagar estos campos.

### Verificación
- `npx vitest run tests/hooks/useCarrito.test.ts` — tests pasan
- `npx vitest run tests/components/producto/` — tests pasan
- `npx tsc --noEmit` — sin errores

---

## T8 — Carrito muestra atributos (TDD)

### Tests primero (`tests/components/carrito/CarritoItem.test.tsx`)
- Item con `atributos` muestra "Nombre (Color / Capacidad)"
- Item sin `atributos` muestra solo "Nombre"

### Implementación
1. **`src/components/carrito/CarritoItem.tsx`** — Añadir `atributos?: Record<string, string>` prop. Mostrar atributos entre paréntesis después del nombre.
2. **`src/components/carrito/CarritoResumen.tsx`** — Pasar `atributos` de item a CarritoItem.

### Verificación
- `npx vitest run tests/components/carrito/` — tests pasan
- `npx tsc --noEmit` — sin errores

---

## T9 — Checkout y API /api/pedidos con variantes (TDD)

### Tests primero (`tests/lib/pedido.test.ts` y `tests/api/pedidos.test.ts`)
- Checkout envía `varianteId` y `atributos` en cada item del pedido
- API `/api/pedidos` descontando stock de `variantes/{varianteId}` no del producto base
- API rechaza si variante no encontrada o agotada
- Mensaje WhatsApp incluye atributos: "iPhone 13 (Negro / 128GB)"
- Producto sin variantes funciona igual que hoy

### Implementación
1. **`src/app/api/pedidos/route.ts`** — Extender `PedidoBody.items` con `varianteId?: string` y `atributos?: Record<string, string>`. En la transacción:
   - Si `varianteId`, leer de `variantes/{varianteId}` y descontar stock ahí
   - Si no, leer de `productos/{productoId}` y descontar stock ahí (comportamiento actual)
   - Incluir atributos en `itemsPedido` para el mensaje WhatsApp
2. **`src/components/checkout/CheckoutForm.tsx`** — Mostrar atributos en la lista del pedido si existen

### Verificación
- `npx vitest run tests/lib/pedido.test.ts` — tests pasan
- `npx vitest run tests/api/` — tests pasan
- `npx tsc --noEmit` — sin errores

---

## T10 — ProductCard y HeroProductCard "Desde $X" (TDD)

### Tests primero (`tests/components/storefront/ProductCard.test.tsx`, `HeroProductCard.test.tsx`)
- Producto sin variantes: muestra precio normal
- Producto con variantes: muestra "Desde $X" (precio mínimo entre variantes activas)

### Implementación
1. **`src/components/storefront/ProductCard.tsx`** — Aceptar prop `precioMinimo?: number`. Si `tieneVariantes`, mostrar "Desde $X" donde X es `precioMinimo`.
2. **`src/components/storefront/HeroProductCard.tsx`** — Mismo patrón.
3. **`src/lib/firestore/public.ts`** — Las funciones `listarProductosCategoria`, `listarDestacados`, etc. necesitan enriquecer productos con `precioMinimo` cuando `tieneVariantes`. Implementar helper `enriquecerConPrecioMinimo(productos, variantes)` o hacer consulta aparte.

### Verificación
- `npx vitest run tests/components/storefront/` — tests pasan
- `npx tsc --noEmit` — sin errores

---

## T11 — Reglas Firestore + índices para variantes (TDD)

### Tests primero (`tests/rules/firestore.rules.test.ts`)
- Añadir tests para colección `variantes`: read público, write solo admin

### Implementación
1. **`firestore.rules`** — Añadir bloque `match /variantes/{id}` con read público y write admin
2. **`firestore.indexes.json`** (si existe) o documentar índice compuesto `variantes(productId ASC, activo ASC, precio ASC)`

### Verificación
- `npm run test:rules` — tests pasan (requiere emulador)
- `npx tsc --noEmit` — sin errores

---

## T12 — Tests de integración y verificación final

### Tests
1. `npm test` — todos los tests pasan (117 + nuevos)
2. `npx tsc --noEmit` — sin errores de tipo
3. `npm run lint` — sin errores nuevos
4. `npm run build` — build exitoso

### Checklist final
- [ ] Colección `variantes` en Firestore con reglas correctas
- [ ] ProductoForm admin con sección de variantes funcional
- [ ] ProductDetail con selector de variantes y galería reactiva
- [ ] Carrito muestra atributos de variante
- [ ] Checkout envía varianteId y atributos
- [ ] API /api/pedidos descontando stock de variante
- [ ] ProductCard/HeroProductCard muestran "Desde $X"
- [ ] Mensaje WhatsApp incluye atributos
- [ ] Productos sin variantes funcionan como antes (retrocompatibilidad)

---

## Convenciones a seguir

- Commits convencionales: `feat(f3-t1): ...`, `feat(f3-t2): ...`, etc.
- UI y mensajes en español (Colombia)
- COP entero, locale `es-CO`
- Tokens Tailwind desde `@theme` en `globals.css`, no hex directo
- TDD: test primero, luego implementación
- Cada tarea debe pasar `npx tsc --noEmit` y `npm test` al final