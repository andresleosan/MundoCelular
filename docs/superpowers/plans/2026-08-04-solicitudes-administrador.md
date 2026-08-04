# Solicitudes de administrador Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar solicitudes de acceso administrativo y permitir aprobarlas o rechazarlas desde `/admin/usuarios`.

**Architecture:** `users/{uid}` sigue siendo la fuente unica de perfiles. La solicitud se representa con `adminRequestStatus` y `adminRequestedAt`; el usuario no cambia a admin hasta la aprobacion. Un endpoint autenticado sin privilegios crea la solicitud, mientras los endpoints administrativos listan y resuelven solicitudes usando Admin SDK y custom claims.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Firebase Auth, Firebase Admin SDK, Firestore, Vitest 4, Testing Library.

## Global Constraints

- Mantener `users/{uid}` como fuente unica de perfiles; no reactivar `usuarios/{email}`.
- Las solicitudes pendientes no cambian `role` ni el custom claim.
- Toda ruta valida el token y valida el cuerpo antes de ejecutar mutaciones en Firebase; los UIDs tienen maximo 128 caracteres.
- Los endpoints no exponen mensajes internos de Firebase al cliente.
- UI y mensajes en espanol de Colombia.
- No se requieren migraciones destructivas ni indices nuevos.
- `POST /api/auth/admin-request` usa un rate limit fijo en memoria de 5 intentos por UID cada 60 segundos; un limite distribuido requiere un store externo.
- Ejecutar `npx tsc --noEmit`, `npm run lint` y `npm test` al finalizar.

## Mapa de archivos

- Modify: `src/types/index.ts` agrega los campos opcionales de solicitud.
- Modify: `src/lib/firestore/usuarios.ts` crea, lista, aprueba y rechaza solicitudes.
- Modify: `src/app/api/admin/usuarios/route.ts` devuelve solicitudes y resuelve acciones administrativas.
- Create: `src/app/api/auth/admin-request/route.ts` registra solicitudes de usuarios autenticados.
- Modify: `src/components/layout/LoginForm.tsx` solicita acceso cuando el login administrativo no tiene permisos.
- Modify: `src/components/admin/AdminUsuarios.tsx` muestra y acciona solicitudes pendientes.
- Modify: `tests/lib/firestore-usuarios.test.ts` cubre el ciclo de vida de solicitudes.
- Create: `tests/api/admin-request.test.ts` cubre autenticacion y respuestas del endpoint publico.
- Modify: `tests/api/admin-usuarios.test.ts` cubre listado, aprobacion, rechazo y validacion del endpoint admin.
- Create: `tests/components/admin-usuarios.test.tsx` cubre acciones visibles de la seccion de solicitudes.

---

### Task 1: Modelo y capa Firestore

**Files:**
- Modify: `src/types/index.ts:87-96`
- Modify: `src/lib/firestore/usuarios.ts:7-84`
- Modify: `tests/lib/firestore-usuarios.test.ts`

**Interfaces:**
- Produce `Usuario.adminRequestStatus?: "pending" | "approved" | "rejected"`.
- Produce `Usuario.adminRequestedAt?: Date`.
- Produce `listarSolicitudesAdmin(): Promise<Usuario[]>`.
- Produce `solicitarAdmin(uid: string, data: { email: string; displayName: string; photoURL: string }): Promise<"created" | "already-pending">`.
- Produce `rechazarSolicitudAdmin(uid: string): Promise<void>`.
- Produce `aprobarSolicitudAdmin(uid: string): Promise<void>` y solo resuelve solicitudes `pending`.
- `asignarAdmin(uid)` conserva su firma y marca la solicitud como `approved`.
- Las deduplicaciones y resoluciones condicionales usan transacciones; la aprobacion y la asignacion persisten primero el perfil y despues agregan el claim, sin locks distribuidos ni compensacion. Si Auth falla, el perfil admin queda aprobado sin acceso efectivo y puede reintentarse manualmente por UID.

- [ ] **Step 1: Escribir pruebas fallidas del modelo**

Agregar al test existente:

```ts
it("crea una solicitud pendiente en un usuario existente", async () => {
  mockDocRef.get.mockResolvedValue({
    exists: true,
    data: () => ({ uid: "uid123", role: "customer" }),
  });

  await solicitarAdmin("uid123", {
    email: "persona@test.com",
    displayName: "Persona",
    photoURL: "",
  });

  expect(mockDocRef.set).toHaveBeenCalledWith(
    expect.objectContaining({
      adminRequestStatus: "pending",
      uid: "uid123",
      role: "customer",
    }),
    { merge: true },
  );
});

it("no duplica una solicitud pendiente", async () => {
  mockDocRef.get.mockResolvedValue({
    exists: true,
    data: () => ({ uid: "uid123", role: "customer", adminRequestStatus: "pending" }),
  });

  await expect(solicitarAdmin("uid123", {
    email: "persona@test.com",
    displayName: "Persona",
    photoURL: "",
  })).resolves.toBe("already-pending");
  expect(mockDocRef.set).not.toHaveBeenCalled();
});

it("aprueba la solicitud al asignar el admin", async () => {
  mockDocRef.get.mockResolvedValue({ exists: true });
  await asignarAdmin("uid123");
  expect(mockDocRef.update).toHaveBeenCalledWith({
    role: "admin",
    adminRequestStatus: "approved",
  });
});

it("rechaza una solicitud sin cambiar el rol", async () => {
  await rechazarSolicitudAdmin("uid123");
  expect(mockDocRef.update).toHaveBeenCalledWith({ adminRequestStatus: "rejected" });
});
```

Importar las funciones nuevas en el test. Las pruebas deben fallar porque las funciones o los campos aun no existen.

- [ ] **Step 2: Ejecutar las pruebas y confirmar RED**

Run: `npx vitest run tests/lib/firestore-usuarios.test.ts`

Expected: FAIL con funciones no exportadas o expectativas no satisfechas; no debe fallar por un error de sintaxis.

- [ ] **Step 3: Implementar el modelo minimo**

En `Usuario`, agregar los dos campos opcionales. En `usuarios.ts`:

```ts
export async function listarSolicitudesAdmin(): Promise<Usuario[]> {
  const snap = await getAdminDb()
    .collection(COL)
    .where("adminRequestStatus", "==", "pending")
    .get();
  return snap.docs.map((doc) => doc.data() as Usuario);
}
```

`solicitarAdmin` debe leer el documento, devolver `already-pending` si ya esta pendiente, y escribir con `{ merge: true }` los datos de perfil, `active: true`, `adminRequestStatus: "pending"` y `adminRequestedAt: new Date()`. No debe cambiar el `role` de un perfil existente. Si el documento no existe, tambien debe crear `uid`, `role: "customer"`, `createdAt` y `lastLogin`.

Actualizar `asignarAdmin` para persistir primero `role: "admin"` y `adminRequestStatus: "approved"`, preservando cualquier custom claim existente al agregar `admin: true` despues. Si Auth falla, no revertir el perfil. Agregar `rechazarSolicitudAdmin` con una actualizacion exclusiva de `adminRequestStatus`.

- [ ] **Step 4: Ejecutar las pruebas y confirmar GREEN**

Run: `npx vitest run tests/lib/firestore-usuarios.test.ts`

Expected: PASS, incluyendo las pruebas existentes de claims y roles.

---

### Task 2: Endpoint para crear solicitudes

**Files:**
- Create: `src/app/api/auth/admin-request/route.ts`
- Create: `tests/api/admin-request.test.ts`

**Interfaces:**
- Consume token Firebase `Authorization: Bearer <id-token>`.
- Produce `POST /api/auth/admin-request` con `201`, `401`, `409` o `500`.

- [ ] **Step 1: Escribir pruebas fallidas del contrato**

Crear un test con mocks de `firebase-admin/auth`, `@/lib/firebase-admin` y `@/lib/firestore/usuarios`:

```ts
it("registra una solicitud para un usuario autenticado sin claim admin", async () => {
  verifyIdToken.mockResolvedValue({
    uid: "uid123",
    email: "persona@test.com",
    name: "Persona",
    picture: "",
    admin: false,
  });
  solicitarAdmin.mockResolvedValue("created");

  const response = await POST(new NextRequest(
    "http://localhost/api/auth/admin-request",
    { method: "POST", headers: { Authorization: "Bearer token" } },
  ));

  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ success: true, status: "pending" });
  expect(solicitarAdmin).toHaveBeenCalledWith("uid123", {
    email: "persona@test.com",
    displayName: "Persona",
    photoURL: "",
  });
});

it("rechaza la solicitud si la cuenta ya es admin", async () => {
  verifyIdToken.mockResolvedValue({ uid: "uid123", admin: true });
  const response = await POST(new NextRequest("http://localhost/api/auth/admin-request", {
    method: "POST", headers: { Authorization: "Bearer token" },
  }));
  expect(response.status).toBe(409);
});
```

- [ ] **Step 2: Ejecutar las pruebas y confirmar RED**

Run: `npx vitest run tests/api/admin-request.test.ts`

Expected: FAIL porque la ruta aun no existe.

- [ ] **Step 3: Implementar la ruta**

La ruta debe verificar que exista el header Bearer, validar el ID token con `getAuth(getAdminApp()).verifyIdToken`, devolver `409` si `decoded.admin === true`, llamar a `solicitarAdmin` y traducir `already-pending` a `409` con `{ success: false, error: "Tu solicitud de administrador ya esta pendiente." }`. Los errores no esperados deben registrarse sin incluir el token y responder `500` con un mensaje generico.

- [ ] **Step 4: Ejecutar las pruebas y confirmar GREEN**

Run: `npx vitest run tests/api/admin-request.test.ts`

Expected: PASS para autenticacion ausente, cuenta admin, solicitud duplicada y solicitud creada.

---

### Task 3: Endpoint administrativo para listar y resolver solicitudes

**Files:**
- Modify: `src/app/api/admin/usuarios/route.ts`
- Create: `tests/api/admin-usuarios.test.ts`

**Interfaces:**
- `GET` produce `{ success: true, data: { admins, solicitudes } }`.
- `POST` consume `{ uid: string, action?: "approve" }`; `approve` aprueba de forma condicional y sin action conserva la asignacion manual.
- `PATCH` consume `{ uid: string, action: "reject" }` y responde `{ success: true }`.
- POST/PATCH/DELETE responden `400` para JSON malformado, body no objeto, UID invalido o action distinta del contrato; una solicitud no pendiente responde `409`.
- GET serializa `Date` y `Timestamp` a ISO para la UI.

- [ ] **Step 1: Escribir pruebas fallidas**

Cubrir estos contratos:

```ts
it("GET devuelve admins y solicitudes pendientes", async () => {
  verificarAdmin.mockResolvedValue({ uid: "admin1", admin: true });
  listarAdmins.mockResolvedValue([{ uid: "a1", role: "admin" }]);
  listarSolicitudesAdmin.mockResolvedValue([{ uid: "u1", role: "customer", adminRequestStatus: "pending" }]);

  const response = await GET(new NextRequest("http://localhost/api/admin/usuarios"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    success: true,
    data: {
      admins: [{ uid: "a1", role: "admin" }],
      solicitudes: [{ uid: "u1", role: "customer", adminRequestStatus: "pending" }],
    },
  });
});

it("PATCH rechaza una solicitud valida", async () => {
  verificarAdmin.mockResolvedValue({ uid: "admin1", admin: true });
  const response = await PATCH(makeRequest({ uid: "u1", action: "reject" }));
  expect(response.status).toBe(200);
  expect(rechazarSolicitudAdmin).toHaveBeenCalledWith("u1");
});
```

Agregar casos de `401`, UID vacio, accion distinta de `reject` y error interno.

- [ ] **Step 2: Ejecutar pruebas y confirmar RED**

Run: `npx vitest run tests/api/admin-usuarios.test.ts`

Expected: FAIL porque GET no devuelve `solicitudes` y PATCH no existe.

- [ ] **Step 3: Implementar los contratos**

En GET ejecutar `listarAdmins` y `listarSolicitudesAdmin` en paralelo despues de `verificarAdmin`. Mantener `?role=customer` sin cambios para la pestaña de clientes. En POST reutilizar `asignarAdmin`, que ahora marca la solicitud como aprobada. En PATCH validar que el body sea un objeto, que `uid` sea una cadena no vacia y que `action === "reject"` antes de llamar a `rechazarSolicitudAdmin`.

- [ ] **Step 4: Ejecutar pruebas y confirmar GREEN**

Run: `npx vitest run tests/api/admin-usuarios.test.ts tests/lib/firestore-usuarios.test.ts`

Expected: PASS sin regresiones en el contrato anterior de admins/clientes.

---

### Task 4: Integrar la solicitud en el login

**Files:**
- Modify: `src/components/layout/LoginForm.tsx`
- Create: `tests/components/login-form.test.tsx`

**Interfaces:**
- Consume `POST /api/auth/admin-request` con el token del usuario autenticado.
- No cambia el flujo de login de clientes ni de administradores ya autorizados.

- [ ] **Step 1: Escribir prueba de regresion fallida**

Renderizar `LoginForm` con `useAuth` simulado como usuario autenticado, `esAdmin: false`, `cargando: false`; seleccionar `Administrador` y simular el login. Mockear `fetch` para verificar:

```ts
expect(fetch).toHaveBeenCalledWith("/api/auth/admin-request", expect.objectContaining({
  method: "POST",
  headers: { Authorization: "Bearer id-token" },
}));
expect(screen.getByText(/solicitud/i)).toBeInTheDocument();
```

Agregar tambien el caso `409`, que debe mostrar el mensaje de solicitud ya pendiente.

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Run: `npx vitest run tests/components/login-form.test.tsx`

Expected: FAIL porque el login actual solo muestra "Esta cuenta no tiene permisos de administrador" y no llama al endpoint.

- [ ] **Step 3: Implementar la integracion**

En la rama `selectedRole === "admin" && !esAdmin`, obtener el ID token, llamar al endpoint, mostrar `Solicitud enviada. Un administrador revisara tu acceso.` para `201`, tratar `409` como informacion no fatal, y cerrar sesion despues de responder. Usar un `useRef` o una condicion equivalente para que el efecto no envie la misma solicitud dos veces durante cambios de estado de Auth.

- [ ] **Step 4: Ejecutar la prueba y confirmar GREEN**

Run: `npx vitest run tests/components/login-form.test.tsx`

Expected: PASS y ninguna llamada duplicada a `fetch`.

---

### Task 5: Mostrar y resolver solicitudes en el panel

**Files:**
- Modify: `src/components/admin/AdminUsuarios.tsx`
- Create: `tests/components/admin-usuarios.test.tsx`

**Interfaces:**
- Consume `data.solicitudes` desde GET.
- Produce botones `Aprobar` y `Rechazar` que llaman POST/PATCH y recargan la lista.

- [ ] **Step 1: Escribir prueba de UI fallida**

Mockear `useAuth`, `fetch` y `confirm`, devolver una solicitud pendiente en GET, y verificar:

```ts
expect(screen.getByText("Solicitudes pendientes")).toBeInTheDocument();
expect(screen.getByText("persona@test.com")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Aprobar" }));
expect(fetch).toHaveBeenCalledWith("/api/admin/usuarios", expect.objectContaining({
  method: "POST",
  body: JSON.stringify({ uid: "u1" }),
}));
```

Cubrir tambien el boton `Rechazar`, el estado vacio y el error de carga.

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Run: `npx vitest run tests/components/admin-usuarios.test.tsx`

Expected: FAIL porque el componente no tiene estado ni render de solicitudes.

- [ ] **Step 3: Implementar la UI**

Agregar `solicitudes` al estado, tipar `adminRequestStatus` y `adminRequestedAt`, asignar `data.data?.solicitudes || []` en `cargarAdmins`, y renderizar la seccion antes del input manual. Cada fila debe mostrar nombre, email, fecha y acciones. Aprobar reutiliza el POST existente; rechazar usa PATCH con `{ uid, action: "reject" }`. Despues de cada accion llamar a `cargarAdmins` y mostrar un mensaje en espanol. No eliminar la asignacion manual por UID.

- [ ] **Step 4: Ejecutar la prueba y confirmar GREEN**

Run: `npx vitest run tests/components/admin-usuarios.test.tsx`

Expected: PASS para lista, aprobacion, rechazo y estados vacios.

---

### Task 6: Reglas, autocrítica y verificación final

**Files:**
- Modify: `tests/rules/firestore.rules.test.ts` solo si se agrega una expectativa de acceso necesaria.
- Modify: `tasks.md` para registrar el estado en revision.

- [ ] **Step 1: Verificar que no se requieren reglas nuevas**

Confirmar que `users/{uid}` no se escribe desde el cliente: las nuevas escrituras pasan por Admin SDK. Mantener la regla existente que permite lectura del propio perfil y escritura administrativa.

- [ ] **Step 2: Ejecutar la suite enfocada**

Run: `npx vitest run tests/lib/firestore-usuarios.test.ts tests/api/admin-request.test.ts tests/api/admin-usuarios.test.ts tests/components/login-form.test.tsx tests/components/admin-usuarios.test.tsx`

Expected: PASS.

- [ ] **Step 3: Ejecutar verificaciones globales**

Run: `npx tsc --noEmit`

Run: `npm run lint`

Run: `npm test`

Expected: TypeScript sin errores, lint sin errores nuevos y suite completa aprobada.

- [ ] **Step 4: Revisar seguridad y regresiones**

Confirmar que el endpoint publico no acepta UID ni email desde el body, que las rutas administrativas mantienen `verificarAdmin`, que los errores no imprimen tokens y que un rechazo nunca cambia `role` ni custom claims.

- [ ] **Step 5: Actualizar estado del proyecto**

Agregar en `tasks.md` una entrada bajo una seccion de revision indicando que el flujo de solicitudes de administrador esta implementado y verificado. No modificar tareas historicas ni borrar el modelo legacy hasta confirmar que no hay datos operativos que migrar.
