# Simplificar formulario de categorías — Design

Fecha: 2026-08-03

## Problema

El formulario de categorías (`CategoriaForm`) expone un campo manual "Orden"
que obliga al administrador a escribir números sin aportar valor. Para una
tienda con un solo administrador, el orden puede calcularse automáticamente.

## Decisiones

1. **Estrategia de automatización: auto-incremento (max + 1).** Se conserva el
   campo `orden: number` en Firestore (compatibilidad total: sin migración de
   datos, índice `activa + orden` intacto, storefront sin cambios). El orden se
   asigna al crear la categoría; editar nunca modifica `orden`.
2. **La columna "Orden" se elimina de la tabla de `/admin/categorias`**, ya que
   el admin ya no gestiona el orden.

## Cambios

### `src/components/admin/CategoriaForm.tsx`

- Eliminar el estado `orden`, el label "Orden", el input numérico y el
  argumento `orden` en las llamadas a `crearCategoria`/`actualizarCategoria`.
- El checkbox "Activa" pasa a ocupar su propio bloque.

### `src/lib/firestore/categorias.ts`

- `CategoriaInput` pasa a `{ nombre, descripcion, activa }` (sin `orden`).
- `crearCategoria`: consulta el mayor `orden` existente con
  `orderBy("orden", "desc").limit(1)` y asigna `max + 1` al crear el doc
  (empieza en 1 si la colección está vacía).
- `actualizarCategoria`: guarda solo `{ nombre, descripcion, activa }`; nunca
  toca `orden`.
- `listarCategorias` no cambia (sigue `orderBy("orden")`).

### `src/app/admin/categorias/page.tsx`

- Eliminar la columna "Orden".

## Sin cambios (compatibilidad)

- `src/types/index.ts`: `orden` permanece en `Categoria`.
- `src/lib/firestore/public.ts`: query pública del storefront.
- `firestore.indexes.json`: índice `activa + orden`.
- Tests existentes con fixtures `orden: 1`.

## Nota de concurrencia

Dos admins creando categorías simultáneamente podrían recibir el mismo
`orden`. Aceptado para esta tienda (1 admin); no se implementa locking.

## Verificación

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (suite existente)
