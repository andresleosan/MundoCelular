# Rate Limit Distribuido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el contador en memoria de `POST /api/auth/admin-request` por un rate limit transaccional y compartido entre instancias mediante Firestore Admin SDK.

**Architecture:** Un helper dedicado calcula una clave opaca con `sha256(uid)` y ejecuta una transaccion sobre `rateLimits/admin-request:<hash>`. La ruta verifica primero el token y el claim admin, llama al helper antes de persistir la solicitud y traduce sus resultados a `201`, `429` o `503` sin exponer detalles internos.

**Tech Stack:** Next.js 16.3 App Router, TypeScript 5, Firebase Admin 13.10.0, Firestore, Vitest 4.

## Global Constraints

- Mantener la politica actual: 5 solicitudes por UID en una ventana fija de 60 segundos.
- Usar una transaccion de Firestore con Firebase Admin; no agregar Redis, Durable Objects ni otro proveedor.
- Identificar el documento con `sha256(uid)` y no guardar el UID en la ruta del documento.
- Aplicar el limite despues de verificar el token y antes de escribir la solicitud de administrador.
- No aceptar UID, email ni limites desde el body de la solicitud.
- No cambiar las reglas publicas de Firestore.
- En un fallo del store distribuido aplicar fail-closed y responder `503` sin detalles internos.
- Una cuenta con `admin: true` no consume cuota y conserva la respuesta `409` existente.
- La sexta solicitud de una ventana responde `429` con `Retry-After` en segundos.
- No incluir UID completo, email, token ni body en logs.

---

### Task 1: Crear el store transaccional del rate limit

**Files:**
- Create: `src/lib/rate-limit/firestore.ts`
- Test: `tests/lib/rate-limit-firestore.test.ts`

**Interfaces:**
- Consumes: `getAdminDb()` de `@/lib/firebase-admin` y el UID ya verificado por Firebase Admin.
- Produces: `consumeAdminRequestRateLimit(uid: string): Promise<RateLimitResult>`.

El modulo debe exportar estos tipos y constantes:

```ts
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

export async function consumeAdminRequestRateLimit(uid: string): Promise<RateLimitResult>;
```

- [x] **Step 1: Escribir pruebas fallidas para la clave y el limite**

Mockear `@/lib/firebase-admin` para devolver un `mockDb` con `collection().doc()` y `runTransaction()`. Mockear `firebase-admin/firestore` con `Timestamp.fromMillis` para inspeccionar los datos sin conectar a Firebase.

Agregar pruebas con un reloj controlado:

```ts
it("crea una ventana nueva con una clave derivada del UID", async () => {
  vi.setSystemTime(new Date("2026-08-05T12:00:00.000Z"));
  transactionSnapshot = { exists: false, data: () => undefined };

  await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({ allowed: true });

  expect(mockCollection).toHaveBeenCalledWith("rateLimits");
  expect(mockDoc).toHaveBeenCalledWith("admin-request:46d97a6f8eb4ee98c548a871a26927e87fc491123a027e1200b58e6f3f825fd8");
  expect(mockTransaction.set).toHaveBeenCalledWith(
    mockRef,
    expect.objectContaining({
      count: 1,
      windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z"),
      expiresAt: expect.any(Object),
      updatedAt: expect.any(Object),
    }),
    { merge: true },
  );
});
```

La asercion usa el digest SHA-256 real de `uid-secreto` y debe comprobar que el ID no contiene el UID original.

Agregar tambien:

```ts
it("incrementa una ventana vigente mientras count es menor que cinco", async () => {
  vi.setSystemTime(new Date("2026-08-05T12:00:30.000Z"));
  transactionSnapshot = {
    exists: true,
    data: () => ({ count: 4, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
  };

  await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({ allowed: true });
  expect(mockTransaction.update).toHaveBeenCalledWith(mockRef, expect.objectContaining({ count: 5 }));
});

it("bloquea la sexta solicitud y calcula Retry-After", async () => {
  vi.setSystemTime(new Date("2026-08-05T12:00:30.500Z"));
  transactionSnapshot = {
    exists: true,
    data: () => ({ count: 5, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
  };

  await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({
    allowed: false,
    retryAfter: 30,
  });
  expect(mockTransaction.update).not.toHaveBeenCalled();
  expect(mockTransaction.set).not.toHaveBeenCalled();
});

it("reinicia la ventana expirada", async () => {
  vi.setSystemTime(new Date("2026-08-05T12:01:00.000Z"));
  transactionSnapshot = {
    exists: true,
    data: () => ({ count: 5, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
  };

  await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({ allowed: true });
  expect(mockTransaction.set).toHaveBeenCalledWith(mockRef, expect.objectContaining({ count: 1 }), { merge: true });
});

it("propaga el error del store para que la ruta aplique fail-closed", async () => {
  mockRunTransaction.mockRejectedValueOnce(new Error("firestore unavailable"));
  await expect(consumeAdminRequestRateLimit("uid-secreto")).rejects.toThrow("firestore unavailable");
});
```

El mock de `runTransaction` debe ejecutar el callback con un objeto de transaccion que implemente `get`, `set` y `update`. La prueba de ventana vigente debe validar que `updatedAt` y `expiresAt` se actualizan, pero nunca guardar email, token o body.

- [x] **Step 2: Ejecutar solo la prueba nueva para confirmar que falla**

Run: `npx vitest run tests/lib/rate-limit-firestore.test.ts`

Expected: FAIL porque `src/lib/rate-limit/firestore.ts` aun no existe.

- [x] **Step 3: Implementar el helper minimo**

Usar `createHash` de `node:crypto`, `Timestamp` y `FieldValue` de `firebase-admin/firestore`, y `getAdminDb` de `@/lib/firebase-admin`.

La implementacion debe seguir este algoritmo:

```ts
const db = getAdminDb();
const ref = db
  .collection("rateLimits")
  .doc(`admin-request:${createHash("sha256").update(uid).digest("hex")}`);

return db.runTransaction(async (transaction) => {
  const now = Date.now();
  const snapshot = await transaction.get(ref);
  const current = snapshot.exists ? readRateLimitDocument(snapshot.data(), now) : null;
  const windowExpired = !current || now - current.windowStartedAt >= RATE_LIMIT_WINDOW_MS;

  if (windowExpired) {
    transaction.set(ref, {
      count: 1,
      windowStartedAt: now,
      expiresAt: Timestamp.fromMillis(now + RATE_LIMIT_WINDOW_MS),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { allowed: true };
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.windowStartedAt + RATE_LIMIT_WINDOW_MS - now) / 1000)),
    };
  }

  transaction.update(ref, {
    count: current.count + 1,
    expiresAt: Timestamp.fromMillis(current.windowStartedAt + RATE_LIMIT_WINDOW_MS),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { allowed: true };
});
```

Definir `RateLimitDocument` internamente con `count: number` y `windowStartedAt: number`. `readRateLimitDocument` debe lanzar `Invalid rate limit document` si faltan campos, si `count` no es un entero seguro entre 1 y `RATE_LIMIT_MAX`, si `windowStartedAt` no es finito o si apunta al futuro. No aceptar datos externos para esos campos ni loguear el UID si `runTransaction` falla.

- [x] **Step 4: Ejecutar las pruebas del helper**

Run: `npx vitest run tests/lib/rate-limit-firestore.test.ts`

Expected: PASS para ventana nueva, incremento, bloqueo, expiracion y propagacion de errores.

- [x] **Step 5: Ejecutar TypeScript y revisar el diff**

Run: `npx tsc --noEmit`

Expected: PASS sin errores. Revisar que el helper no importe dependencias cliente ni cambie reglas de Firestore.

- [x] **Step 6: Commit del store**

```powershell
git add tests/lib/rate-limit-firestore.test.ts src/lib/rate-limit/firestore.ts
git commit -m "feat(seguridad): agregar rate limit distribuido en Firestore"
```

---

### Task 2: Integrar el store en el endpoint de solicitudes admin

**Files:**
- Modify: `src/app/api/auth/admin-request/route.ts:1-74`
- Modify: `tests/api/admin-request.test.ts:1-126`

**Interfaces:**
- Consumes: `consumeAdminRequestRateLimit` y `RateLimitResult` de `@/lib/rate-limit/firestore`.
- Produces: el mismo contrato de autenticacion y solicitud pendiente, con respuestas `429` y `503` provenientes del store distribuido.

- [x] **Step 1: Mockear el helper y escribir pruebas de integracion fallidas**

Agregar al bloque `vi.hoisted` un mock `consumeAdminRequestRateLimit: vi.fn()`, registrar `vi.mock("@/lib/rate-limit/firestore", ...)` e incluir `consumeAdminRequestRateLimit.mockResolvedValue({ allowed: true })` en `beforeEach`.

Agregar pruebas:

```ts
it("devuelve 429 y no crea solicitud cuando el store bloquea", async () => {
  verifyIdToken.mockResolvedValueOnce({ uid: "rate-limit-user", admin: false });
  consumeAdminRequestRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 17 });

  const response = await POST(request());

  expect(response.status).toBe(429);
  expect(response.headers.get("Retry-After")).toBe("17");
  expect(solicitarAdmin).not.toHaveBeenCalled();
});

it("responde 503 sin detalles cuando el store distribuido falla", async () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  verifyIdToken.mockResolvedValueOnce({ uid: "store-error-user", admin: false });
  consumeAdminRequestRateLimit.mockRejectedValueOnce(new Error("secret firestore detail"));

  try {
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ success: false, error: "Servicio temporalmente no disponible" });
    expect(solicitarAdmin).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("secret firestore detail");
  } finally {
    errorSpy.mockRestore();
  }
});
```

Actualizar la prueba existente de limite fijo para ejercitar el helper: resolver cinco veces `{ allowed: true }`, luego `{ allowed: false, retryAfter: 60 }`, y comprobar que solo la sexta respuesta es `429`.

- [x] **Step 2: Ejecutar solo la prueba de la ruta para confirmar que falla**

Run: `npx vitest run tests/api/admin-request.test.ts`

Expected: FAIL en las pruebas nuevas porque la ruta aun usa `requestWindows` en memoria y no consulta el helper.

- [x] **Step 3: Integrar el helper y eliminar el estado en memoria**

En `route.ts`:

1. Eliminar `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `requestWindows` y `consumirRateLimit`.
2. Importar `consumeAdminRequestRateLimit`.
3. Mantener la verificacion de token y el rechazo `409` antes del rate limit.
4. Reemplazar el bloque actual por:

```ts
  let rateLimit: Awaited<ReturnType<typeof consumeAdminRequestRateLimit>>;
  try {
    rateLimit = await consumeAdminRequestRateLimit(token.uid);
  } catch {
    console.error("[admin-request:rate-limit]");
    return NextResponse.json(
      { success: false, error: "Servicio temporalmente no disponible" },
      { status: 503 },
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Demasiadas solicitudes. Intenta de nuevo mas tarde." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }
```

El log debe ser constante y no incluir la excepcion, UID, email, token ni body. La llamada a `solicitarAdmin` debe permanecer despues del bloque del rate limit.

- [x] **Step 4: Ejecutar pruebas de la ruta**

Run: `npx vitest run tests/api/admin-request.test.ts`

Expected: PASS en autenticacion, cuenta admin, solicitud duplicada, error `500` existente, `429` y `503`.

- [x] **Step 5: Ejecutar la suite completa y verificaciones estaticas**

Run: `npm test`

Expected: PASS con todos los tests existentes y nuevos.

Run: `npx tsc --noEmit`

Expected: PASS sin errores TypeScript.

Run: `npm run lint`

Expected: 0 errores; conservar solo warnings ya existentes si aparecen.

- [x] **Step 6: Commit de la integracion**

```powershell
git add tests/api/admin-request.test.ts src/app/api/auth/admin-request/route.ts
git commit -m "fix(seguridad): conectar solicitudes admin al rate limit distribuido"
```

---

### Task 3: Verificacion de release y documentacion operativa

**Files:**
- Modify: `docs/seguimiento-proyecto.md` en la seccion de operaciones y pendientes.
- Modify: `tasks.md` solo si el checklist contiene la tarea equivalente de rate limit.

**Interfaces:**
- Consumes: commits de Tasks 1 y 2 y resultados de las pruebas.
- Produces: evidencia reproducible de validacion y estado actualizado sin marcar despliegue como exitoso antes de verificarlo.

- [x] **Step 1: Ejecutar el build de produccion**

Run: `npm run build`

Expected: build Next.js completado sin errores.

- [x] **Step 2: Verificar el endpoint protegido y el comportamiento de limite**

Ejecutar la prueba existente de QA que confirma `401` sin token y agregar la evidencia de `429`/`503` unitarios en `docs/seguimiento-proyecto.md`. No escribir tokens reales, UID completos ni emails en la documentacion.

- [x] **Step 3: Actualizar el seguimiento**

Registrar:

- helper transaccional en `rateLimits` con clave `admin-request:<sha256(uid)>`;
- cinco solicitudes permitidas y sexta bloqueada con `Retry-After`;
- fallo del store cerrado con `503`;
- `npm test`, TypeScript, lint y build ejecutados;
- pendiente de despliegue solo si Vercel no ha reconstruido la version.

- [x] **Step 4: Revisar seguridad y diff final**

Run: `git diff HEAD~2 --check`

Expected: sin errores de whitespace. Confirmar con busqueda que `requestWindows` y `consumirRateLimit` ya no existen, que no se agregaron secretos y que ninguna regla publica expone `rateLimits`.

- [x] **Step 5: Commit de la evidencia**

```powershell
git add docs/seguimiento-proyecto.md tasks.md
git commit -m "docs(ops): registrar validacion del rate limit distribuido"
```

- [ ] **Step 6: Publicar y verificar solo despues de la validacion local**

Run: `git push origin main`

Expected: push exitoso. Luego verificar el deployment generado en Vercel, consultar `/api/auth/admin-request` sin token para confirmar `401`, y registrar el identificador del deployment solo si la comprobacion final es exitosa.
