# Auditoria Local-Produccion Firebase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que el inventario escrito en Firestore por el administrador sea leido de forma verificable por Home, catalogo, busqueda y marcas en localhost y Vercel.

**Architecture:** Firebase Admin seguira siendo la fuente server-side para el storefront y Firebase Web SDK seguira siendo la fuente client-side para Auth y CRUD admin. Se validara el contrato de credenciales privadas, se instrumentaran las lecturas sin exponer secretos, se corregiran indices y se eliminara la invalidacion de cache rota por la combinacion actual de `firebase-admin`, `jwks-rsa` y `jose`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Firebase Web SDK 12, Firebase Admin 13.10.x, Firestore, Vercel, Vitest 4 y Playwright MCP.

## Global Constraints

- La coleccion canonica sera `productos`; no se creara una coleccion separada de marcas.
- `activo == true` sera la regla publica; el stock cero no ocultara el producto.
- `NEXT_PUBLIC_FIREBASE_*` se usara solo en el navegador; `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` se usaran solo en el servidor.
- No se imprimiran tokens, llaves privadas, documentos completos ni datos de clientes en logs.
- Home, catalogo, busqueda y marcas no usaran mocks ni arrays hardcodeados de inventario.
- El mapper publico no expondra `creadoEn`, `actualizadoEn` ni otros objetos Firestore a Client Components.
- Los errores de credenciales, permisos e indices se distinguiran y no se convertiran silenciosamente en una lista vacia.
- No se migraran las lecturas publicas al SDK cliente.
- No se agregaran dependencias nuevas; la unica modificacion de version permitida en esta tarea es fijar `firebase-admin` a la linea 13.10.x para evitar el fallo ESM de produccion.
- La validacion final de Vercel requiere un redeploy real posterior a la configuracion de variables.
- No se haran commits, pushes ni despliegues externos desde esta ejecucion sin una solicitud explicita del operador.
- La interfaz existente navy/cyan, las tipografias y los tokens de `src/app/globals.css` se conservan.

## Mapa De Archivos

### Configuracion y observabilidad

- Crear `src/lib/firebase-admin-config.ts`: contrato y validacion de las tres credenciales server-side, con estado seguro para diagnostico.
- Crear `src/lib/firestore/diagnostics.ts`: wrapper de lecturas Firestore que registra consulta, filtros, proyecto, cantidad, duracion y error sanitizado.
- Modificar `src/lib/firebase-admin.ts`: consumir el contrato de configuracion antes de inicializar Admin SDK.
- Modificar `src/lib/revalidate.ts`: verificar el status HTTP del endpoint de invalidacion y registrar fallos sin tokens.

### Firestore y API

- Modificar `src/lib/firestore/public.ts`: instrumentar consultas publicas y mantener el mapper allowlist.
- Modificar `src/app/api/buscar/route.ts`: devolver un error 503 controlado cuando Firestore no este disponible, sin filtrar detalles internos.
- Modificar `src/app/api/revalidate/route.ts`: aislar autenticacion, validacion de body e invalidacion; declarar runtime Node.js.
- Modificar `src/lib/api-auth.ts`: registrar codigo/mensaje sanitizado de fallos de verificacion sin registrar el bearer token.
- Modificar `package.json` y `package-lock.json`: fijar `firebase-admin` en `13.10.0`, cuya dependencia `jwks-rsa` usa `jose` CommonJS compatible con el runtime desplegado.
- Modificar `firestore.indexes.json`: declarar los indices requeridos por las consultas ordenadas publicas.

### Home y marcas

- Modificar `src/app/page.tsx`: consumir el resumen real de marcas y distinguir error de lectura de inventario vacio.
- Modificar `src/lib/storefront/brands.ts`: eliminar `completarMarcasParaHome` y cualquier lista de marcas sin inventario.
- Modificar `tests/lib/brands.test.ts`: exigir que el resumen solo contenga marcas presentes en productos activos.
- Modificar `tests/lib/home-sections.test.ts`: conservar limites y filtros de destacados/nuevos.

### Entorno y evidencia

- Modificar `.env.local.example`: documentar todas las variables publicas y privadas usadas por el runtime.
- Modificar `src/lib/firebase.ts`: completar el objeto de configuracion client-side con bucket, sender ID y measurement ID cuando existan.
- Crear `tests/lib/firebase-admin-config.test.ts`.
- Crear `tests/lib/firestore-diagnostics.test.ts`.
- Crear `tests/api/revalidate.test.ts`.
- Crear `tests/lib/firestore-indexes.test.ts`.
- Crear `docs/superpowers/reports/2026-08-03-auditoria-local-produccion-firebase.md` con causa, evidencia, archivos y bloqueos externos.
- Modificar `tasks.md` para registrar el estado de esta auditoria.

---

### Task 1: Contrato Server-Side Y Diagnostico Seguro

**Files:**
- Create: `src/lib/firebase-admin-config.ts`
- Create: `src/lib/firestore/diagnostics.ts`
- Create: `tests/lib/firebase-admin-config.test.ts`
- Create: `tests/lib/firestore-diagnostics.test.ts`
- Modify: `src/lib/firebase-admin.ts`

**Interfaces:**
- `getFirebaseAdminConfig(): { projectId: string; clientEmail: string; privateKey: string }` devuelve credenciales normalizadas o lanza `FirebaseAdminConfigError` con `code === "firebase-admin/missing-config"` y la lista de variables faltantes.
- `getFirebaseAdminConfigStatus(): { projectId: string | null; clientEmailConfigured: boolean; privateKeyConfigured: boolean; missing: string[] }` no devuelve valores secretos.
- `ejecutarLecturaFirestore<T extends { docs: readonly unknown[] }>(metadata, operation): Promise<T>` devuelve el snapshot original y registra el resultado o el error.
- `metadata` tiene `{ nombre: string; coleccion: string; filtros: string[] }`.

- [ ] **Step 1: Escribir la prueba RED de credenciales ausentes**

Crear `tests/lib/firebase-admin-config.test.ts` con estas expectativas:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FirebaseAdminConfigError,
  getFirebaseAdminConfig,
  getFirebaseAdminConfigStatus,
} from "@/lib/firebase-admin-config";

describe("configuracion Firebase Admin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("expone las variables faltantes sin incluir valores secretos", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "admin@test.invalid");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----secreto");

    const status = getFirebaseAdminConfigStatus();

    expect(status).toEqual({
      projectId: null,
      clientEmailConfigured: true,
      privateKeyConfigured: true,
      missing: ["FIREBASE_PROJECT_ID"],
    });
    expect(JSON.stringify(status)).not.toContain("secreto");
    expect(() => getFirebaseAdminConfig()).toThrow(FirebaseAdminConfigError);
  });

  it("normaliza los saltos escapados de la llave cuando el contrato es valido", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "mundocelular-id");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "firebase-adminsdk@test.invalid");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "linea-1\\nlinea-2");

    expect(getFirebaseAdminConfig()).toEqual({
      projectId: "mundocelular-id",
      clientEmail: "firebase-adminsdk@test.invalid",
      privateKey: "linea-1\nlinea-2",
    });
  });
});
```

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/firebase-admin-config.test.ts`.

Esperado: falla porque el modulo y sus funciones aun no existen.

- [ ] **Step 3: Escribir la prueba RED del wrapper de lecturas**

Crear `tests/lib/firestore-diagnostics.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { ejecutarLecturaFirestore } from "@/lib/firestore/diagnostics";

describe("diagnostico de lecturas Firestore", () => {
  it("registra consulta y cantidad sin registrar documentos", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const snapshot = { docs: [{ id: "p1", data: () => ({ nombre: "privado" }) }] };

    await expect(ejecutarLecturaFirestore(
      { nombre: "productos-activos", coleccion: "productos", filtros: ["activo == true"] },
      async () => snapshot,
    )).resolves.toBe(snapshot);

    expect(info).toHaveBeenCalledWith(
      "[firestore:read]",
      expect.objectContaining({
        nombre: "productos-activos",
        coleccion: "productos",
        filtros: ["activo == true"],
        count: 1,
      }),
    );
    expect(info.mock.calls.flat().join(" ")).not.toContain("privado");
    info.mockRestore();
  });

  it("registra codigo de error y vuelve a lanzar la excepcion", async () => {
    const error = Object.assign(new Error("The query requires an index"), {
      code: "failed-precondition",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(ejecutarLecturaFirestore(
      { nombre: "busqueda-productos", coleccion: "productos", filtros: ["activo == true", "orderBy nombre"] },
      async () => { throw error; },
    )).rejects.toBe(error);

    expect(errorSpy).toHaveBeenCalledWith(
      "[firestore:read:error]",
      expect.objectContaining({
        nombre: "busqueda-productos",
        code: "failed-precondition",
      }),
    );
    errorSpy.mockRestore();
  });
});
```

- [ ] **Step 4: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/firestore-diagnostics.test.ts`.

Esperado: falla porque `ejecutarLecturaFirestore` aun no existe.

- [ ] **Step 5: Implementar el contrato y el wrapper minimo**

En `src/lib/firebase-admin-config.ts`:

```ts
const REQUIRED = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"] as const;

export class FirebaseAdminConfigError extends Error {
  readonly code = "firebase-admin/missing-config";
  constructor(readonly missing: string[]) {
    super(`Faltan variables Firebase Admin: ${missing.join(", ")}`);
    this.name = "FirebaseAdminConfigError";
  }
}

export function getFirebaseAdminConfigStatus() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || null;
  const clientEmailConfigured = Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim());
  const privateKeyConfigured = Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim());
  const missing = REQUIRED.filter((name) => {
    if (name === "FIREBASE_PROJECT_ID") return !projectId;
    if (name === "FIREBASE_CLIENT_EMAIL") return !clientEmailConfigured;
    return !privateKeyConfigured;
  });
  return { projectId, clientEmailConfigured, privateKeyConfigured, missing };
}

export function getFirebaseAdminConfig() {
  const status = getFirebaseAdminConfigStatus();
  if (status.missing.length > 0) throw new FirebaseAdminConfigError(status.missing);
  return {
    projectId: status.projectId!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!.trim(),
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  };
}
```

En `src/lib/firestore/diagnostics.ts`, medir `Date.now()` antes y despues de `operation()`, extraer solo `error.code` y `error.message`, y registrar `projectId` desde `getFirebaseAdminConfigStatus()`. En tests no se deben imprimir documentos ni secretos.

Modificar `src/lib/firebase-admin.ts` para pasar el resultado de `getFirebaseAdminConfig()` a `cert()`. Si la configuracion es incompleta, registrar solo `getFirebaseAdminConfigStatus()` con `console.error("[firebase-admin:config]", status)` y volver a lanzar el `FirebaseAdminConfigError`.

- [ ] **Step 6: Ejecutar pruebas y confirmar GREEN**

Ejecutar `npm test -- tests/lib/firebase-admin-config.test.ts tests/lib/firestore-diagnostics.test.ts`.

Esperado: todos los casos pasan y los logs de prueba no contienen valores secretos ni documentos.

---

### Task 2: Consultas Publicas, Filtros E Indices

**Files:**
- Modify: `src/lib/firestore/public.ts`
- Modify: `src/app/api/buscar/route.ts`
- Modify: `tests/lib/firestore-public.test.ts`
- Create: `tests/lib/firestore-indexes.test.ts`
- Modify: `firestore.indexes.json`

**Interfaces:**
- Todas las lecturas publicas de productos seguiran devolviendo `Producto[]` plano.
- `listarTodosLosProductosActivos()` seguira devolviendo `Array<{ producto: Producto; categoriaSlug: string }>`.
- `GET /api/buscar` devolvera `{ resultados }` con `200`, `{ resultados: [] }` sin filtros, `400` para entradas fuera de limite y `503` si Firestore no esta disponible.

- [ ] **Step 1: Escribir la prueba RED de los indices requeridos**

Crear `tests/lib/firestore-indexes.test.ts` leyendo `firestore.indexes.json` con `readFileSync` y comprobar que `indexes` contiene exactamente estos conjuntos de campos para `collectionGroup: "productos"`:

```ts
const required = [
  [
    { fieldPath: "activo", order: "ASCENDING" },
    { fieldPath: "nombre", order: "ASCENDING" },
  ],
  [
    { fieldPath: "categoriaId", order: "ASCENDING" },
    { fieldPath: "activo", order: "ASCENDING" },
    { fieldPath: "nombre", order: "ASCENDING" },
  ],
  [
    { fieldPath: "activo", order: "ASCENDING" },
    { fieldPath: "destacado", order: "ASCENDING" },
    { fieldPath: "nombre", order: "ASCENDING" },
  ],
];

for (const fields of required) {
  expect(indexes.indexes).toContainEqual({
    collectionGroup: "productos",
    queryScope: "COLLECTION",
    fields,
  });
}
```

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/firestore-indexes.test.ts`.

Esperado: falla porque los indices `activo + nombre`, `categoriaId + activo + nombre` y `activo + destacado + nombre` no estan todos declarados.

- [ ] **Step 3: Escribir la prueba RED de errores de busqueda**

En `tests/api/buscar.test.ts`, agregar:

```ts
it("devuelve 503 cuando la lectura publica de Firestore falla", async () => {
  listarTodosLosProductosActivos.mockRejectedValueOnce(
    Object.assign(new Error("FAILED_PRECONDITION"), { code: "failed-precondition" }),
  );

  const response = await GET(request("?q=iphone"));

  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: "El catalogo no esta disponible temporalmente.",
  });
});
```

- [ ] **Step 4: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/api/buscar.test.ts`.

Esperado: falla porque la excepcion de `listarTodosLosProductosActivos()` aun escapa como error 500.

- [ ] **Step 5: Instrumentar las lecturas y corregir sus contratos**

En `src/lib/firestore/public.ts`, envolver con `ejecutarLecturaFirestore` las consultas de:

```text
categorias-public
productos-categoria
productos-activos
producto-por-slug
producto-por-slug-directo
todos-productos-activos
destacados
variantes-por-producto
```

Cada metadata debe declarar la coleccion y filtros exactos. Mantener `toProducto` como allowlist; no volver al spread de `snap.data()`.

Conservar estas consultas e indices:

```ts
db.collection("productos")
  .where("activo", "==", true)
  .orderBy("nombre")
  .get();

db.collection("productos")
  .where("categoriaId", "==", categoriaId)
  .where("activo", "==", true)
  .orderBy("nombre")
  .get();

db.collection("productos")
  .where("activo", "==", true)
  .where("destacado", "==", true)
  .orderBy("nombre")
  .get();
```

En `src/app/api/buscar/route.ts`, rodear la lectura con `try/catch`; registrar solo `code` y mensaje sanitizado si falla y devolver el JSON 503 exacto de la prueba. No devolver el error de Firestore al cliente.

- [ ] **Step 6: Agregar los indices locales**

Modificar `firestore.indexes.json` sin eliminar indices existentes. Agregar los tres indices de la prueba y conservar los de categorias, variantes y el indice `activo + creadoEn` existente.

- [ ] **Step 7: Ejecutar pruebas y confirmar GREEN**

Ejecutar:

```powershell
npm test -- tests/lib/firestore-indexes.test.ts tests/lib/firestore-public.test.ts tests/api/buscar.test.ts
```

Esperado: pasan los contratos de filtros, mapper plano, diagnostico, indices y respuesta 503.

---

### Task 3: Revalidacion Compatible Con Vercel

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/api/revalidate/route.ts`
- Modify: `src/lib/api-auth.ts`
- Modify: `src/lib/revalidate.ts`
- Create: `tests/api/revalidate.test.ts`
- Modify: `tests/lib/firestore-productos.test.ts`

**Interfaces:**
- `POST /api/revalidate` conserva `401` sin bearer, `403` para no-admin, `400` para tags invalidos y `200` con `{ revalidado: true, tags }` para admin valido.
- Un fallo interno de `revalidateTag` devuelve `500` con `{ error: "No se pudo invalidar el cache." }`.
- `avisarRevalidacion(tags)` no expone tokens y registra `{ status }` si recibe una respuesta no-2xx.

- [ ] **Step 1: Escribir la prueba RED de la ruta**

Crear `tests/api/revalidate.test.ts` con estos mocks y helpers, ademas de los casos indicados:

```ts
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/revalidate/route";

const { verifyIdToken, revalidateTag } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({ verifyIdToken })),
}));
vi.mock("@/lib/firebase-admin", () => ({ getAdminApp: vi.fn(() => ({})) }));
vi.mock("next/cache", () => ({ revalidateTag }));

describe("POST /api/revalidate", () => {

function validAdminRequest() {
  return new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    headers: { authorization: "Bearer token-de-prueba", "content-type": "application/json" },
    body: JSON.stringify({ tags: ["productos"] }),
  });
}

it("rechaza una solicitud sin bearer", async () => {
  const response = await POST(new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    body: JSON.stringify({ tags: ["productos"] }),
  }));
  expect(response.status).toBe(401);
});

it("revalida tags permitidos para un admin", async () => {
  verifyIdToken.mockResolvedValue({ admin: true });
  const response = await POST(new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    headers: { authorization: "Bearer token-de-prueba", "content-type": "application/json" },
    body: JSON.stringify({ tags: ["productos", "categorias"] }),
  }));
  expect(response.status).toBe(200);
  expect(revalidateTag).toHaveBeenCalledWith("productos");
  expect(revalidateTag).toHaveBeenCalledWith("categorias");
});

it("devuelve 500 cuando revalidateTag falla", async () => {
  verifyIdToken.mockResolvedValue({ admin: true });
  revalidateTag.mockImplementationOnce(() => { throw new Error("cache unavailable"); });
  const response = await POST(validAdminRequest());
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "No se pudo invalidar el cache." });
});
});
```

Agregar un caso para JSON invalido y otro para tag fuera de `productos`, `categorias`, `config`.

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/api/revalidate.test.ts`.

Esperado: falla porque la ruta actual no separa los errores de parseo, verificacion e invalidacion y no tiene la respuesta 500 definida.

- [ ] **Step 3: Fijar la dependencia incompatible y el runtime**

Ejecutar:

```powershell
npm install firebase-admin@13.10.0
```

Verificar que `npm ls firebase-admin jwks-rsa jose` muestre `firebase-admin@13.10.0`, `jwks-rsa@3.x` y `jose@4.x`. No agregar overrides manuales.

En `src/app/api/revalidate/route.ts`, agregar `export const runtime = "nodejs";` y mantener la importacion de Admin Auth sobre la version fijada. Separar las etapas:

1. validar header bearer;
2. verificar token y devolver `401` en error de identidad;
3. parsear body y validar tags, devolviendo `400`;
4. ejecutar `revalidateTag` dentro de un bloque que devuelva `500` sin detalles internos.

En `src/lib/api-auth.ts`, registrar solo `{ code, message }` sanitizados en el `catch` de `verifyIdToken`; nunca registrar `authHeader`.

- [ ] **Step 4: Comprobar que el cliente detecta la invalidacion fallida**

Modificar `src/lib/revalidate.ts`:

```ts
const response = await fetch("/api/revalidate", { ... });
if (!response.ok) {
  console.error("[revalidate:request-error]", { status: response.status });
}
```

Mantener el comportamiento best-effort para no declarar fallido un producto que ya fue escrito en Firestore. En `tests/lib/firestore-productos.test.ts`, mockear `fetch` con `status: 500` y verificar que `crearProducto` termina despues de persistir y que se registra el status sin token.

- [ ] **Step 5: Ejecutar pruebas y smoke test del bundle**

Ejecutar:

```powershell
npm test -- tests/api/revalidate.test.ts tests/lib/firestore-productos.test.ts
npm run build
npm run start -- -p 3101
```

Con el servidor en `3101`, ejecutar en otra consola:

```powershell
Invoke-WebRequest -Uri "http://localhost:3101/api/revalidate" -Method Post -SkipHttpErrorCheck | Select-Object StatusCode
```

Esperado: `401`, no `500` por `ERR_REQUIRE_ESM`. Detener el servidor despues de la prueba.

- [ ] **Step 6: Ejecutar la prueba y confirmar GREEN**

Ejecutar `npm test -- tests/api/revalidate.test.ts tests/lib/firestore-productos.test.ts`.

Esperado: todas las respuestas y la comprobacion de status pasan, sin secretos en consola.

---

### Task 4: Marcas Derivadas Y Home No Silencioso

**Files:**
- Modify: `src/lib/storefront/brands.ts`
- Modify: `src/app/page.tsx`
- Modify: `tests/lib/brands.test.ts`
- Modify: `tests/lib/home-sections.test.ts`
- Modify: `tests/components/storefront/MarcasSection.test.tsx`

**Interfaces:**
- `resumirMarcas(productos: Producto[]): MarcaResumen[]` es la unica entrada para marcas del Home.
- `filtrarProductosPorMarca(productos, slug)` devuelve solo productos activos de la marca normalizada.
- `completarMarcasParaHome` deja de existir.

- [ ] **Step 1: Escribir la prueba RED contra marcas sin inventario**

En `tests/lib/brands.test.ts`, reemplazar la suite de `completarMarcasParaHome` por:

```ts
it("no crea marcas sin productos activos", () => {
  expect(resumirMarcas([
    producto({ id: "apple", marca: "Apple", activo: true }),
    producto({ id: "samsung", marca: "Samsung", activo: false }),
  ])).toEqual([
    { nombre: "Apple", slug: "apple", cantidad: 1 },
  ]);
});
```

Agregar una comprobacion de que una marca activa con `stock: 0` conserva `cantidad: 1`.

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/brands.test.ts`.

Esperado: falla porque la prueba aun importa la funcion hardcodeada y el Home conserva el fallback de seis marcas.

- [ ] **Step 3: Eliminar la fuente hardcodeada**

En `src/lib/storefront/brands.ts`, eliminar `MARCAS_VISIBLES_HOME` y `completarMarcasParaHome`. En `src/app/page.tsx`, cambiar:

```ts
const marcas = completarMarcasParaHome(resumirMarcas(productos));
```

por:

```ts
const marcas = resumirMarcas(productos);
```

Si `safeFetchProductos()` falla, devolver un resultado discriminado `{ productos: [], error: true }` y renderizar un estado visible y no interactivo con el texto `El catalogo no esta disponible temporalmente.`. Si la consulta fue exitosa y no hay productos, conservar el Home sin secciones de inventario.

- [ ] **Step 4: Ejecutar pruebas y confirmar GREEN**

Ejecutar:

```powershell
npm test -- tests/lib/brands.test.ts tests/lib/home-sections.test.ts tests/components/storefront/MarcasSection.test.tsx
```

Esperado: solo se renderizan marcas presentes en inventario activo y los limites de Home siguen siendo 6 destacados y 8 nuevos.

---

### Task 5: Contrato De Entorno Y Documentacion Operativa

**Files:**
- Modify: `.env.local.example`
- Modify: `src/lib/firebase.ts`
- Create: `tests/lib/firebase-client-config.test.ts`

**Interfaces:**
- El ejemplo de entorno lista todas las variables publicas Firebase, las tres privadas Admin y `NEXT_PUBLIC_SITE_URL`.
- El objeto `firebaseConfig` mantiene `apiKey`, `authDomain`, `projectId`, `appId` y agrega `storageBucket`, `messagingSenderId` y `measurementId` como valores publicos opcionales.

- [ ] **Step 1: Escribir la prueba RED de nombres de configuracion**

Exportar `firebaseConfig` desde `src/lib/firebase.ts` y crear `tests/lib/firebase-client-config.test.ts` con mocks de `firebase/app`, `firebase/auth` y `firebase/firestore`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("firebase/app", () => ({
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(() => ({})),
}));
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => null),
  GoogleAuthProvider: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({ getFirestore: vi.fn(() => ({})) }));

describe("configuracion Firebase del cliente", () => {
it("mapea las variables publicas Firebase al config del cliente", async () => {
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "public-key");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "mundocelular-id.firebaseapp.com");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "mundocelular-id");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "mundocelular-id.firebasestorage.app");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "123");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "app-id");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-TEST");

  const { firebaseConfig } = await import("@/lib/firebase");

  expect(firebaseConfig).toMatchObject({
    apiKey: "public-key",
    authDomain: "mundocelular-id.firebaseapp.com",
    projectId: "mundocelular-id",
    storageBucket: "mundocelular-id.firebasestorage.app",
    messagingSenderId: "123",
    appId: "app-id",
    measurementId: "G-TEST",
  });
});
});
```

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/firebase-client-config.test.ts`.

Esperado: falla porque `firebaseConfig` no esta exportado y los campos adicionales no existen.

- [ ] **Step 3: Completar la documentacion de entorno sin secretos**

En `.env.local.example`, documentar:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

En `src/lib/firebase.ts`, agregar los tres campos publicos al objeto existente y exportarlo para la prueba. No agregar valores por defecto que puedan apuntar a otro proyecto.

- [ ] **Step 4: Ejecutar prueba y typecheck**

Ejecutar:

```powershell
npm test -- tests/lib/firebase-client-config.test.ts
npx tsc --noEmit
```

Esperado: PASS y TypeScript sin errores.

---

### Task 6: Configuracion Externa, Producto De Prueba Y Validacion Vercel

**Files:**
- Create: `docs/superpowers/reports/2026-08-03-auditoria-local-produccion-firebase.md`
- Modify: `tasks.md`
- QA evidence: `qa/reports/` y capturas locales no versionadas

**Interfaces:**
- La configuracion de Vercel se verifica por presencia y alcance, no imprimiendo valores.
- El producto de prueba se crea solo con una cuenta admin autorizada.
- Los indices se despliegan al mismo proyecto `mundocelular-id` y se comprueba su estado antes de declarar verde la busqueda.

- [ ] **Step 1: Verificar el contrato externo antes de redeploy**

En Vercel Production deben existir, ademas de las variables publicas:

```text
FIREBASE_PROJECT_ID=mundocelular-id
FIREBASE_CLIENT_EMAIL=<service-account-email del proyecto mundocelular-id>
FIREBASE_PRIVATE_KEY=<private key del mismo service account>
```

No mostrar el email completo ni la llave en la salida. Confirmar en el dashboard que las variables esten asignadas a `Production`, no solo `Preview` o `Development`.

- [ ] **Step 2: Desplegar reglas e indices con el proyecto correcto**

Solo con credenciales Firebase autorizadas, ejecutar:

```powershell
npm run deploy:indexes
```

El resultado esperado debe mencionar el proyecto `mundocelular-id` y terminar sin `FAILED_PRECONDITION`. No desplegar reglas si `firestore.rules` no cambio en esta auditoria.

- [ ] **Step 3: Redeployar Vercel despues de las variables**

Crear un nuevo deployment de `main` desde Vercel. Registrar deployment ID y commit, y comprobar que el build use el mismo commit que `git rev-parse HEAD`.

- [ ] **Step 4: Crear el producto de prueba con Playwright MCP**

Con una cuenta admin de pruebas autorizada, crear desde `/admin/productos`:

```text
iPhone 17 Pro Max / Apple / activo=true / destacado=true
```

Usar categoria `Celulares`, precio COP valido, stock positivo y una imagen valida. Confirmar en la tabla admin que el documento se escribio y que el formulario no dejo campos `active` o `featured` alternos.

- [ ] **Step 5: Verificar las cuatro superficies en local y Vercel**

Para cada base URL (`http://localhost:3000`, `https://mundocelular.vercel.app`, `https://mundocelular-git-main-andres-leo-san-s-projects.vercel.app`, `https://mundocelular-dt5gc4lto-andres-leo-san-s-projects.vercel.app`) verificar:

```text
/                              -> Home incluye iPhone 17 Pro Max
/categoria/celulares           -> catalogo incluye iPhone 17 Pro Max
/api/buscar?q=iPhone%2017%20Pro%20Max -> resultados incluye el producto
/api/buscar?marca=Apple        -> solo productos Apple activos
/marca/apple                   -> contador y cards correctos
/producto/iphone-17-pro-max   -> detalle sin 404
```

Registrar status HTTP, respuesta JSON de busqueda, presencia del nombre en el snapshot y errores de consola. En Home, distinguir `productos.length === 0` por datos reales de un estado de error.

- [ ] **Step 6: Ejecutar la matriz responsive**

En cada URL publica, usar `1440x900`, `1024x768` y `390x844`; comprobar:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

Comprobar tambien que Apple solo tenga enlace cuando tenga productos activos y que no exista una lista de marcas con contador cero.

- [ ] **Step 7: Documentar evidencia y estado**

Crear el reporte con:

- causa raiz confirmada y evidencia de logs;
- diferencia entre variables publicas y privadas;
- coleccion, filtros y campos observados;
- indices declarados y estado de despliegue;
- error ESM antes/despues;
- respuestas local/Vercel;
- producto de prueba y rutas verificadas;
- todos los archivos modificados;
- bloqueos externos si no hubo acceso a Vercel/Firebase.

Agregar en `tasks.md` una seccion `Auditoria Local-Produccion Firebase` con estado `revision` hasta que exista evidencia post-redeploy.

---

### Task 7: Verificacion Integral Y Cierre

**Files:**
- Modify: `docs/superpowers/reports/2026-08-03-auditoria-local-produccion-firebase.md`
- Modify: `tasks.md`

- [ ] **Step 1: Ejecutar la suite completa**

Ejecutar en este orden:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Esperado: las cuatro ordenes terminan sin errores. Los warnings existentes deben quedar listados en el reporte, no confundirse con fallos de datos.

- [ ] **Step 2: Revisar seguridad de logs y secretos**

Buscar en el codigo modificado:

```powershell
rg "FIREBASE_PRIVATE_KEY|Authorization|Bearer|console\.(log|info|error)" src tests
```

Verificar manualmente que ningun log imprima el valor de una variable, el bearer token, `snap.data()` o el contenido de un documento.

- [ ] **Step 3: Revisar la diferencia final**

Ejecutar:

```powershell
git status --short
```

Revisar que el diff solo incluya los archivos de esta auditoria y la especificacion/plan aprobados. No revertir cambios ajenos.

- [ ] **Step 4: Dejar el reporte con el resultado honesto**

Marcar la tarea como terminada solo si el producto se ve en las cuatro superficies de los dominios Vercel despues del redeploy. Si falta configuracion o acceso externo, dejar el estado `revision` y enumerar exactamente el bloqueo, sin declarar exito.

## Self-Review Del Plan

- La causa probable de credenciales privadas ausentes tiene prueba de contrato y una verificacion externa sin imprimir secretos.
- La lectura server-side y el filtro `activo == true` se mantienen en una sola coleccion.
- Los indices usados por las consultas ordenadas tienen pruebas contra `firestore.indexes.json`.
- El error de busqueda `500` se convierte en un `503` controlado y queda registrado con codigo seguro.
- La incompatibilidad `firebase-admin/auth` se trata cambiando la linea incompatible y validando el bundle con `next start`, no con un `try/catch` superficial.
- La invalidacion verifica status y conserva el dato persistido aunque el cache falle.
- Las marcas no pueden inventar inventario con una lista fija.
- La matriz de aceptacion cubre Home, catalogo, busqueda, marca, detalle, los tres dominios alternos y tres viewports.
- El plan no incluye commits, pushes ni despliegues no solicitados.
- No quedan nombres de funciones sin definir ni pasos con `TBD`, `TODO` o implementacion abierta.
