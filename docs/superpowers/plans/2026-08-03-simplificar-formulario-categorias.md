# Simplificar formulario de categorías — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar el campo manual "Orden" del formulario de categorías y asignar el orden automáticamente (max + 1) al crear, conservando `orden` en Firestore para compatibilidad total.

**Architecture:** Se mantiene el campo `orden: number` en el modelo `Categoria` y en las queries (`orderBy("orden")`), tal cual están hoy. Los únicos cambios son: (1) `crearCategoria` calcula `max(orden) + 1` internamente, (2) `actualizarCategoria` deja de recibir/guardar `orden`, (3) el formulario y la tabla del admin dejan de mostrar/editar `orden`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Firebase Firestore (client SDK v12), Vitest 4 + jsdom.

## Global Constraints

- Windows PowerShell 5.1, sin WSL. Nunca usar comandos bash.
- `Categoria.orden: number` NO se elimina de `src/types/index.ts` (compatibilidad con docs existentes e índice Firestore).
- NO tocar `src/lib/firestore/public.ts` ni `firestore.indexes.json` (índice compuesto `activa + orden` sigue siendo necesario).
- Los tests existentes con fixtures `orden: 1` deben seguir pasando sin modificación.
- UI y mensajes en español (Colombia). Sin emojis. Sin comentarios en código.
- Verificación: `npx tsc --noEmit`, `npm run lint`, `npm test`.

---

### Task 1: Auto-incremento del orden en la capa de datos

**Files:**
- Modify: `src/lib/firestore/categorias.ts`
- Test: `tests/lib/firestore-categorias.test.ts` (nuevo)

**Interfaces:**
- Consumes: `CategoriaInput` actual de `src/lib/firestore/categorias.ts`; `validarCategoria` de `src/lib/validacion.ts`; `generarSlug`/`esSlugReservado`/`asegurarSlugUnico` de `src/lib/slug.ts`; `avisarRevalidacion` de `src/lib/revalidate.ts`; `getDb` de `src/lib/firebase.ts`.
- Produces:
  - `CategoriaInput = { nombre: string; descripcion: string; activa: boolean }` (sin `orden`)
  - `crearCategoria(input: CategoriaInput): Promise<string>` — guarda el doc con `orden` auto-asignado (empieza en 1, luego max + 1)
  - `actualizarCategoria(id: string, input: CategoriaInput): Promise<void>` — nunca escribe `orden`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/firestore-categorias.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn(async () => ({ id: "cat-nueva" }));
const mockUpdateDoc = vi.fn(async () => {});
const mockGetDb = vi.fn(() => ({}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ path: "categorias" })),
  query: vi.fn(() => ({})),
  orderBy: vi.fn((f: string, dir?: string) => ({ fieldPath: f, directionStr: dir })),
  limit: vi.fn((n: number) => ({ n })),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: vi.fn(async () => {}),
  doc: vi.fn(() => ({ path: "categorias/x" })),
  where: vi.fn(() => ({})),
}));

vi.mock("@/lib/firebase", () => ({
  getDb: () => mockGetDb(),
  auth: null,
}));

vi.mock("@/lib/revalidate", () => ({
  avisarRevalidacion: vi.fn(async () => {}),
}));

import { crearCategoria, actualizarCategoria } from "@/lib/firestore/categorias";

const input = { nombre: "Accesorios", descripcion: "Todo en accesorios", activa: true };

describe("crearCategoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocs.mockResolvedValue({ docs: [], empty: true });
  });

  it("asigna orden 1 cuando no hay categorías", async () => {
    await crearCategoria(input);
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orden: 1 })
    );
  });

  it("asigna max(orden) + 1 cuando existen categorías", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [], empty: true })
      .mockResolvedValueOnce({ docs: [{ data: () => ({ orden: 5 }) }], empty: false });
    await crearCategoria(input);
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orden: 6 })
    );
  });
});

describe("actualizarCategoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no incluye orden en el update", async () => {
    await actualizarCategoria("c1", input);
    const payload = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("orden");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/firestore-categorias.test.ts`
Expected: FAIL — `crearCategoria` aún recibe `orden` en el input y no existe auto-incremento (TypeScript no compila el test: `input` no tiene `orden`).

- [ ] **Step 3: Implement auto-incremento**

In `src/lib/firestore/categorias.ts`:

Replace the `CategoriaInput` interface:

```ts
export interface CategoriaInput {
  nombre: string;
  descripcion: string;
  activa: boolean;
}
```

Add a private helper before `crearCategoria`:

```ts
async function obtenerProximoOrden(): Promise<number> {
  const db = getDb();
  const snap = await getDocs(query(collection(db, COL), orderBy("orden", "desc"), limit(1)));
  return snap.empty ? 1 : ((snap.docs[0].data().orden as number) ?? 0) + 1;
}
```

In `crearCategoria`, replace the `addDoc` line so the doc receives the auto-assigned order:

```ts
  const ref = await addDoc(collection(db, COL), {
    ...input,
    nombre: input.nombre.trim(),
    slug,
    orden: await obtenerProximoOrden(),
  });
```

`actualizarCategoria` needs no change: it spreads `input` (which no longer has `orden`), so `updateDoc` no longer writes the field.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/firestore-categorias.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add tests/lib/firestore-categorias.test.ts src/lib/firestore/categorias.ts
git commit -m "feat(categorias): asignar orden automaticamente al crear"
```

---

### Task 2: Quitar el campo Orden del formulario

**Files:**
- Modify: `src/components/admin/CategoriaForm.tsx`

**Interfaces:**
- Consumes: `CategoriaInput` sin `orden` (Task 1); `Categoria` de `@/types` (el tipo conserva `orden`, pero el form no lo usa).
- Produces: `CategoriaForm` sin el estado, label ni input "Orden"; las llamadas a `crearCategoria`/`actualizarCategoria` reciben `{ nombre, descripcion, activa }`.

- [ ] **Step 1: Implement**

In `src/components/admin/CategoriaForm.tsx`:

Delete line 18 (estado `orden`):

```tsx
  const [orden, setOrden] = useState(categoria?.orden ?? 0);
```

Replace the two submit calls (currently `{ nombre, descripcion, orden, activa }`) with:

```tsx
      if (categoria) await actualizarCategoria(categoria.id, { nombre, descripcion, activa });
      else await crearCategoria({ nombre, descripcion, activa });
```

Replace the `flex items-center gap-4` block (label "Orden" + input + checkbox) with a standalone checkbox:

```tsx
      <label className="flex items-center gap-2 text-[14px]">
        <Checkbox checked={activa} onCheckedChange={(v) => setActiva(!!v)} />
        Activa
      </label>
```

- [ ] **Step 2: Verify types and lint**

Run: `npx tsc --noEmit`
Expected: no errors

Run: `npm run lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/CategoriaForm.tsx
git commit -m "feat(categorias): quitar campo orden del formulario"
```

---

### Task 3: Quitar la columna Orden de la tabla admin

**Files:**
- Modify: `src/app/admin/categorias/page.tsx`

**Interfaces:**
- Consumes: `Categoria` de `@/types` (la columna se elimina; el resto de la tabla queda igual).
- Produces: `CategoriasAdmin` sin columna "Orden".

- [ ] **Step 1: Implement**

In `src/app/admin/categorias/page.tsx`, delete the whole column entry (currently lines 43-49):

```tsx
    {
      header: "Orden",
      className: "w-[80px]",
      cell: (c) => (
        <span className="text-[14px] text-muted-foreground">{c.orden}</span>
      ),
    },
```

- [ ] **Step 2: Verify types and lint**

Run: `npx tsc --noEmit`
Expected: no errors

Run: `npm run lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/categorias/page.tsx
git commit -m "feat(categorias): quitar columna orden de la tabla admin"
```

---

### Task 4: Suite completa de verificación

**Files:**
- None (verificación únicamente)

- [ ] **Step 1: Run full verification**

Run: `npx tsc --noEmit`
Expected: no errors

Run: `npm run lint`
Expected: no errors

Run: `npm test`
Expected: all tests pass (incluidos los existentes con fixtures `orden: 1`, que no se modificaron)

- [ ] **Step 2: Sanity check del flujo en el navegador (opcional)**

Con `npm run dev` en localhost:3000, revisar `/admin/categorias` (crear y editar categoría) y confirmar que:
- El formulario no muestra el campo "Orden".
- La tabla no muestra la columna "Orden".
- Las categorías nuevas aparecen al final de la lista.

- [ ] **Step 3: Commit final (si hubo cambios de sanity check)**

```bash
git status
git add -A
git commit -m "chore: verificación final tarea categorias"
```
