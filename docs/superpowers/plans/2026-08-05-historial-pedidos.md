# Historial de Pedidos del Cliente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que cada cliente autenticado consulte y detalle sus pedidos, mientras se centraliza el WhatsApp operativo en `573147757223`.

**Architecture:** La pagina cliente consulta Firestore directamente, limitada por `clienteUid`, paginada con cursor de documento y protegida por las reglas existentes. Un modulo de configuracion compartido provee el unico fallback de tienda para componentes cliente, paginas server, rutas API y scripts, evitando numeros de WhatsApp divergentes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Firebase Auth, Firestore Web SDK, Firebase Admin SDK, Vitest, Testing Library y Firebase Emulator.

## Global Constraints

- El numero canonico interno es `573147757223`; en enlaces se usa `https://wa.me/573147757223` y en texto humano `+57 314 775 7223`.
- No modificar planes, reportes ni especificaciones historicas que conservan evidencia del numero previo.
- La pagina muestra todos los estados, no permite alterar pedidos y nunca renderiza UID, email o telefono del cliente.
- La lista carga 10 pedidos por pagina con `where("clienteUid", "==", uid)`, `orderBy("creadoEn", "desc")` y cursor `startAfter`.
- Mantener las reglas de propietario/admin y cubrirlas con el emulador antes de cualquier despliegue.
- No ejecutar `npm run deploy:indexes`, ni actualizar `configuracion/tienda` remota, sin confirmacion explicita del operador despues de la QA local.
- La UI conserva los tokens navy existentes y funciona en desktop y mobile.

---

## Estructura de archivos

- Crear `src/lib/config-tienda.ts`: default publico unico de `ConfigTienda` y numero WhatsApp canonico.
- Crear `scripts/update-whatsapp.ts`: actualizacion dirigida de solo `configuracion/tienda.whatsapp` para ejecutar tras autorizacion.
- Crear `tests/lib/config-tienda.test.ts`: regresion del numero, formato y campos del default.
- Modificar `src/components/auth/ConfigProvider.tsx`, `src/components/layout/Footer.tsx`, `src/app/page.tsx`, `src/app/contacto/page.tsx`, `src/app/reparaciones/page.tsx`, `src/app/api/pedidos/route.ts`, `scripts/seed-config.ts` y `src/types/index.ts`: consumir el default compartido o reflejar el numero canonico.
- Modificar fixtures y expectativas activas en `tests/` que representan `ConfigTienda` o enlaces `wa.me`.
- Modificar `src/lib/firestore/pedidos.ts`: exponer la consulta paginada de pedidos del cliente, separada de las funciones admin existentes.
- Crear `tests/lib/firestore-pedidos.test.ts`: contrato de la consulta paginada y su cursor.
- Modificar `firestore.indexes.json` y `tests/rules/firestore.rules.test.ts`: declarar el indice de historial y probar consultas de propietario, tercero y admin.
- Crear `src/components/cuenta/HistorialPedidos.tsx` y `src/app/cuenta/pedidos/page.tsx`: experiencia de lista, detalle, carga, error, vacio y carga incremental.
- Crear `tests/components/cuenta/HistorialPedidos.test.tsx` y modificar `tests/components/layout/Header.test.tsx` (o crearlo si no existe): cobertura de UI y acceso desde el menu.
- Modificar `src/components/layout/Header.tsx`, `tasks.md` y `docs/seguimiento-proyecto.md`: navegacion y seguimiento de evidencia.

### Task 1: Centralizar la configuracion activa de WhatsApp

**Files:**
- Create: `src/lib/config-tienda.ts`
- Create: `scripts/update-whatsapp.ts`
- Create: `tests/lib/config-tienda.test.ts`
- Modify: `src/components/auth/ConfigProvider.tsx:6-24`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/contacto/page.tsx`
- Modify: `src/app/reparaciones/page.tsx`
- Modify: `src/app/api/pedidos/route.ts:150-153`
- Modify: `scripts/seed-config.ts:4-23`
- Modify: `src/types/index.ts:76-85`
- Modify: `package.json:5-21`
- Modify: fixtures and assertions under `tests/` that contain `573113554021`

**Interfaces:**
- Produces: `WHATSAPP_TIENDA = "573147757223"`, `CONFIG_TIENDA_DEFAULT: ConfigTienda` and `formatearWhatsAppTienda(numero: string): string` from `@/lib/config-tienda`.
- Produces: `npm run update:whatsapp`, a manual Admin SDK operation that updates only `{ whatsapp: WHATSAPP_TIENDA }`.
- Consumes: `ConfigTienda` from `@/types` and `getAdminDb` from `@/lib/firebase-admin`.

- [ ] **Step 1: Write the failing configuration regression test**

```ts
import { describe, expect, it } from "vitest";
import {
  CONFIG_TIENDA_DEFAULT,
  WHATSAPP_TIENDA,
  formatearWhatsAppTienda,
} from "@/lib/config-tienda";

describe("configuracion publica de tienda", () => {
  it("usa el WhatsApp canonico para enlaces y texto humano", () => {
    expect(WHATSAPP_TIENDA).toBe("573147757223");
    expect(CONFIG_TIENDA_DEFAULT.whatsapp).toBe(WHATSAPP_TIENDA);
    expect(formatearWhatsAppTienda(WHATSAPP_TIENDA)).toBe("+57 314 775 7223");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/lib/config-tienda.test.ts`

Expected: FAIL because `@/lib/config-tienda` does not exist.

- [ ] **Step 3: Implement the shared default and targeted update script**

```ts
// src/lib/config-tienda.ts
import type { ConfigTienda } from "@/types";

export const WHATSAPP_TIENDA = "573147757223";

export const CONFIG_TIENDA_DEFAULT: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: WHATSAPP_TIENDA,
  direccion: "",
  ciudad: "Medellin",
  departamento: "Antioquia",
  pais: "Colombia",
  horario: "",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

export function formatearWhatsAppTienda(numero: string): string {
  return numero.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "+$1 $2 $3 $4");
}
```

```ts
// scripts/update-whatsapp.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { WHATSAPP_TIENDA } from "../src/lib/config-tienda";
import { getAdminDb } from "../src/lib/firebase-admin";

async function main() {
  await getAdminDb().collection("configuracion").doc("tienda").update({
    whatsapp: WHATSAPP_TIENDA,
  });
  console.log("WhatsApp de configuracion/tienda actualizado");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Replace each active literal fallback with the imported constant/default. Keep `seed-config.ts` as the complete initial seed, but use `WHATSAPP_TIENDA`; add `"update:whatsapp": "tsx scripts/update-whatsapp.ts"` to `package.json`. Use `formatearWhatsAppTienda` in Footer. Update all active test fixtures and `wa.me` assertions to `573147757223`; do not alter historical docs.

- [ ] **Step 4: Run focused WhatsApp regressions**

Run: `npm test -- tests/lib/config-tienda.test.ts tests/lib/seo-jsonld.test.ts tests/lib/pedido.test.ts tests/components/producto/ProductDetail.test.tsx`

Expected: PASS and every tested active CTA uses `wa.me/573147757223`.

- [ ] **Step 5: Commit the configuration task**

```powershell
git add src/lib/config-tienda.ts scripts/update-whatsapp.ts src/components/auth/ConfigProvider.tsx src/components/layout/Footer.tsx src/app/page.tsx src/app/contacto/page.tsx src/app/reparaciones/page.tsx src/app/api/pedidos/route.ts scripts/seed-config.ts src/types/index.ts package.json tests
git commit -m "feat(fut-01): centralizar WhatsApp de tienda"
```

### Task 2: Consultar el historial paginado con reglas e indice

**Files:**
- Modify: `src/lib/firestore/pedidos.ts:1-26`
- Create: `tests/lib/firestore-pedidos.test.ts`
- Modify: `firestore.indexes.json:55-65`
- Modify: `tests/rules/firestore.rules.test.ts:1-89`

**Interfaces:**
- Produces: `const PEDIDOS_POR_PAGINA = 10` and `listarPedidosCliente(uid: string, cursor?: QueryDocumentSnapshot<DocumentData>): Promise<{ pedidos: Pedido[]; cursor: QueryDocumentSnapshot<DocumentData> | null }>` from `@/lib/firestore/pedidos`.
- Consumes: Firebase Web SDK `collection`, `where`, `orderBy`, `limit`, `startAfter`, `query` and `getDocs`.
- Produces: index `pedidos(clienteUid ASC, creadoEn DESC)`.

- [ ] **Step 1: Write failing tests for first page and cursor**

```ts
vi.mock("@/lib/firebase", () => ({ getDb: vi.fn(() => ({})) }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(), query: vi.fn(), where: vi.fn(), orderBy: vi.fn(),
  limit: vi.fn(), startAfter: vi.fn(), getDocs: vi.fn(),
  doc: vi.fn(), getDoc: vi.fn(), updateDoc: vi.fn(),
}));

it("consulta solo los pedidos del cliente y retorna un cursor", async () => {
  getDocs.mockResolvedValue({ docs: [snap("p2"), snap("p1")] });
  const result = await listarPedidosCliente("cliente-1");

  expect(where).toHaveBeenCalledWith("clienteUid", "==", "cliente-1");
  expect(orderBy).toHaveBeenCalledWith("creadoEn", "desc");
  expect(limit).toHaveBeenCalledWith(10);
  expect(result.pedidos.map((pedido) => pedido.id)).toEqual(["p2", "p1"]);
  expect(result.cursor).toEqual(expect.objectContaining({ id: "p1" }));
});

it("aplica startAfter al cargar la siguiente pagina", async () => {
  const cursor = snap("p1");
  getDocs.mockResolvedValue({ docs: [] });
  await listarPedidosCliente("cliente-1", cursor);
  expect(startAfter).toHaveBeenCalledWith(cursor);
});
```

- [ ] **Step 2: Run the library test to verify it fails**

Run: `npm test -- tests/lib/firestore-pedidos.test.ts`

Expected: FAIL because `listarPedidosCliente` and `PEDIDOS_POR_PAGINA` are not exported.

- [ ] **Step 3: Implement the paginated query**

```ts
export const PEDIDOS_POR_PAGINA = 10;

export async function listarPedidosCliente(
  clienteUid: string,
  cursor?: QueryDocumentSnapshot<DocumentData>,
): Promise<{ pedidos: Pedido[]; cursor: QueryDocumentSnapshot<DocumentData> | null }> {
  const restricciones = [
    where("clienteUid", "==", clienteUid),
    orderBy("creadoEn", "desc"),
    limit(PEDIDOS_POR_PAGINA),
  ];
  if (cursor) restricciones.push(startAfter(cursor));

  const snap = await getDocs(query(collection(getDb(), "pedidos"), ...restricciones));
  return {
    pedidos: snap.docs.map((documento) => ({ id: documento.id, ...(documento.data() as Omit<Pedido, "id">) })),
    cursor: snap.docs.at(-1) ?? null,
  };
}
```

Add the index after the existing `variantes` index. In the rules test seed two orders owned by `u1` and one by `u2`; assert that `getDocs(query(collection(u1, "pedidos"), where("clienteUid", "==", "u1"), orderBy("creadoEn", "desc")))` succeeds, the equivalent query for `u2` through `u1` fails, and the admin query succeeds.

- [ ] **Step 4: Run data and rule tests**

Run: `npm test -- tests/lib/firestore-pedidos.test.ts`

Expected: PASS.

Run: `npx firebase emulators:exec --only firestore "npm run test:rules"`

Expected: PASS, including the three query authorization cases.

- [ ] **Step 5: Commit the data task**

```powershell
git add src/lib/firestore/pedidos.ts firestore.indexes.json tests/lib/firestore-pedidos.test.ts tests/rules/firestore.rules.test.ts
git commit -m "feat(fut-01): listar pedidos propios paginados"
```

### Task 3: Construir la pagina Mis pedidos y el enlace de cuenta

**Files:**
- Create: `src/components/cuenta/HistorialPedidos.tsx`
- Create: `src/app/cuenta/pedidos/page.tsx`
- Create: `tests/components/cuenta/HistorialPedidos.test.tsx`
- Modify: `src/components/layout/Header.tsx:107-148`
- Create or Modify: `tests/components/layout/Header.test.tsx`

**Interfaces:**
- Consumes: `useAuth()` returning `{ usuario, cargando }`, `useConfig()` returning a `ConfigTienda`, and `listarPedidosCliente(uid, cursor)` from `@/lib/firestore/pedidos`.
- Produces: `<HistorialPedidos />`, rendered by `/cuenta/pedidos`.
- Produces: a menu item `role="menuitem"` labeled `Mis pedidos` with href `/cuenta/pedidos` only when `usuario` exists.

- [ ] **Step 1: Write failing UI tests**

```tsx
it("muestra los pedidos, abre el detalle y arma el enlace WhatsApp", async () => {
  mockUseAuth.mockReturnValue({ usuario: { uid: "u1" }, cargando: false, esAdmin: false });
  mockListarPedidosCliente.mockResolvedValue({ pedidos: [pedido], cursor: null });
  render(<HistorialPedidos />);

  expect(await screen.findByText("Pedido #ped-0001")).toBeDefined();
  await userEvent.click(screen.getByRole("button", { name: /pedido #ped-0001/i }));
  expect(screen.getByText("Entrega: Domicilio")).toBeDefined();
  expect(screen.getByRole("link", { name: /abrir conversacion/i }).getAttribute("href"))
    .toContain("https://wa.me/573147757223?text=");
});

it("muestra acceso para visitante y cargar mas cuando recibe cursor", async () => {
  mockUseAuth.mockReturnValue({ usuario: null, cargando: false, esAdmin: false });
  render(<HistorialPedidos />);
  expect(screen.getByRole("link", { name: /iniciar sesion/i }).getAttribute("href")).toBe("/login");
});
```

Add cases for loading auth, empty state with catalog CTA, error with retry, no email/UID/phone in detail, and a second `Cargar mas` response that appends items rather than replacing the first page. Add Header tests that authenticate a user, open the menu and assert the link exists; assert it is absent without session.

- [ ] **Step 2: Run the UI tests to verify they fail**

Run: `npm test -- tests/components/cuenta/HistorialPedidos.test.tsx tests/components/layout/Header.test.tsx`

Expected: FAIL because the account page/component and menu item do not exist.

- [ ] **Step 3: Implement the account route, component and menu link**

```tsx
// src/app/cuenta/pedidos/page.tsx
import { HistorialPedidos } from "@/components/cuenta/HistorialPedidos";

export default function PaginaMisPedidos() {
  return <HistorialPedidos />;
}
```

`HistorialPedidos` must be a client component. Wait for `cargando` before querying. When `usuario` is null, render a concise access state with `/login` and store `login-destino` as `/cuenta/pedidos` before navigation. On session, call `listarPedidosCliente(usuario.uid)` once; keep the returned cursor in state; append later pages only after clicking `Cargar mas`. Keep a selected `Pedido | null` in state and expose the selected card as a button with an accessible name containing `Pedido #${pedido.id.slice(0, 8)}`. Build the WhatsApp URL with `config.whatsapp` and `encodeURIComponent`.

In Header, use a `Link` with `role="menuitem"`, `href="/cuenta/pedidos"` and the current close-menu callback before the optional admin item. Do not show it to unauthenticated visitors.

- [ ] **Step 4: Run focused UI regressions**

Run: `npm test -- tests/components/cuenta/HistorialPedidos.test.tsx tests/components/layout/Header.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the UI task**

```powershell
git add src/app/cuenta/pedidos/page.tsx src/components/cuenta/HistorialPedidos.tsx src/components/layout/Header.tsx tests/components/cuenta/HistorialPedidos.test.tsx tests/components/layout/Header.test.tsx
git commit -m "feat(fut-01): mostrar historial de pedidos"
```

### Task 4: Ejecutar el ciclo de cierre y preparar las operaciones remotas

**Files:**
- Modify: `tasks.md`
- Modify: `docs/seguimiento-proyecto.md`

**Interfaces:**
- Consumes: todos los cambios de Tasks 1-3 y las evidencias de los comandos de verificacion.
- Produces: FUT-01 en `revision`, una lista de verificaciones realizadas y dos operaciones remotas pendientes de autorizacion.

- [ ] **Step 1: Run the complete local security and QA gate**

Run these commands in order:

```powershell
npm test
npx firebase emulators:exec --only firestore "npm run test:rules"
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git grep -nE "573113554021|FIREBASE_PRIVATE_KEY|Authorization: Bearer" -- src scripts tests
```

Expected: all tests pass; TypeScript and build succeed; lint has no errors; `git diff --check` is clean; the grep does not find the previous number in active source, scripts or tests, and does not reveal secrets.

- [ ] **Step 2: Execute browser QA against the local production build**

Run:

```powershell
npm run build
npm run start -- -p 3101
```

Using Playwright MCP at `1440x900` and `390x844`, verify `/cuenta/pedidos` shows the signed-out access state, then use the dedicated QA customer account to verify its own list, detail, WhatsApp link, `Cargar mas`, no horizontal overflow and no application console errors. Do not create or alter a real order.

- [ ] **Step 3: Update project tracking before the remote gate**

Record in `tasks.md` and `docs/seguimiento-proyecto.md`:

```markdown
- [x] FUT-01 local: tests, rules, TypeScript, lint, build and browser QA passed.
- [ ] Desplegar indice `pedidos(clienteUid ASC, creadoEn DESC)` con autorizacion del operador.
- [ ] Actualizar remotamente `configuracion/tienda.whatsapp` a `573147757223` con backup y autorizacion del operador.
```

Set FUT-01 to `revision`, never `aprobada`, until remote checks complete.

- [ ] **Step 4: Commit the local QA evidence**

```powershell
git add tasks.md docs/seguimiento-proyecto.md
git commit -m "docs(fut-01): registrar verificacion local"
```

- [ ] **Step 5: Request explicit operator authorization before remote writes**

Ask exactly for confirmation to run these two commands against `mundocelular-id`:

```powershell
npm run deploy:indexes
npm run backup:config
npm run update:whatsapp
```

Only after approval, run them in that order. Confirm the backup exists without printing its content, then query the public production site and verify every WhatsApp CTA resolves to `wa.me/573147757223`. Record the deployment/index status and config update result, then run the full local gate again if code changed. Commit and push the resulting evidence separately.

## Plan self-review

- Spec coverage: Tasks 1-3 cover canonical WhatsApp, account route, menu navigation, all status visibility, page size/cursor, selected detail, WhatsApp message, auth guard, private data omission, index and owner/admin rules. Task 4 covers local QA and guarded remote operations.
- Placeholder scan: no incomplete or deferred implementation instructions are present; each task contains files, interfaces, commands and concrete expected behavior.
- Type consistency: Task 2 exports `listarPedidosCliente` and `PEDIDOS_POR_PAGINA`; Task 3 consumes the same function with the `cursor` it returns. Task 1 exports `WHATSAPP_TIENDA` and its default, which Task 3 consumes through the existing `useConfig` contract.
