# Solicitudes de administrador

## Problema

La pantalla `/admin/usuarios` solo lista documentos de `users` cuyo `role` es
`admin`. El login no registra la intencion de acceso administrativo cuando una
cuenta aun no tiene permisos, por lo que no existe ningun dato que el panel
pueda mostrar. El modelo anterior `usuarios/{email}.pendiente` ya no es usado.

## Objetivo

Registrar automaticamente las solicitudes de usuarios autenticados que intentan
entrar como administradores y permitir que un administrador las apruebe o
rechace desde `/admin/usuarios`.

## Modelo de datos

Se conserva `users/{uid}` como fuente unica de perfiles. Se agregan campos
opcionales:

```ts
adminRequestStatus?: "pending" | "approved" | "rejected";
adminRequestedAt?: Date;
```

Una solicitud pendiente no cambia el `role`: el usuario sigue siendo
`customer` hasta que un administrador la apruebe. Al aprobarla, una transaccion
cambia atomicamente `role` a `admin` y marca la solicitud como `approved`; despues
se asigna el custom claim `admin: true`. Al rechazarla, se conserva el usuario
como `customer` y se marca como `rejected`.

No se requiere una migracion destructiva. Los perfiles existentes sin estos
campos siguen siendo validos.

### Rollback

El rollback consiste en retirar los campos `adminRequestStatus` y
`adminRequestedAt` de los documentos afectados y revertir el codigo de las
rutas y el componente. No se debe cambiar ni borrar `role` ni custom claims
como parte del rollback automatico.

## Flujo

1. El usuario inicia sesion y selecciona `Administrador`.
2. Si no posee el claim admin, el cliente llama a `POST /api/auth/admin-request`.
3. La ruta verifica el token, aplica un rate limit best-effort por UID, rechaza
   solicitudes duplicadas mediante una transaccion Firestore y registra el
   estado `pending` en `users/{uid}`.
4. El usuario ve un mensaje de solicitud enviada y se cierra su sesion.
5. `GET /api/admin/usuarios` devuelve administradores y solicitudes pendientes.
6. El administrador aprueba con `POST /api/admin/usuarios` o rechaza con
   `PATCH /api/admin/usuarios`.

## Contrato de API

### `POST /api/auth/admin-request`

- Auth: token Firebase valido; no requiere claim admin.
- Body: ninguno; identidad y perfil salen del token.
- `201`: `{ success: true, status: "pending" }`.
- `429`: limite best-effort excedido, con header `Retry-After`; el limite
  distribuido requiere un store externo.
- `409`: cuenta ya administradora o solicitud ya pendiente.
- `401`: token ausente o invalido.

### `GET /api/admin/usuarios`

- Auth: requiere claim `admin: true`.
- Respuesta: `{ success: true, data: { admins, solicitudes } }`; los campos de
  fecha (`createdAt`, `lastLogin`, `adminRequestedAt`) se serializan a ISO.
- `solicitudes` solo contiene perfiles con `adminRequestStatus == "pending"`.

### `POST /api/admin/usuarios`

- Auth: requiere claim `admin: true`.
- Body: `{ uid: string, action?: "approve" }`.
- Accion: con `action: "approve"` aprueba una solicitud `pending`; sin `action`
  conserva la asignacion manual.
- La entrada se recorta y valida antes de consultar Firebase Auth.
- Un UID vacio o de mas de 128 caracteres, un body no objeto o JSON invalido
  responde `400`.

### `PATCH /api/admin/usuarios`

- Auth: requiere claim `admin: true`.
- Body: `{ uid: string, action: "reject" }`.
- Accion: marcar la solicitud como rechazada sin cambiar el rol.
- Aprobar o rechazar una solicitud que ya no esta `pending` responde `409`.

## Interfaz

En la pestaña `Administradores` se agrega una seccion de solicitudes
pendientes antes de la lista de admins. Cada fila muestra nombre, email, fecha
de solicitud y acciones `Aprobar` y `Rechazar`. La lista se actualiza despues
de cada accion. La asignacion manual por UID permanece como respaldo.

## Seguridad y consistencia

La aprobacion y la asignacion persisten primero el perfil admin y despues
agregan el claim `admin: true`, preservando los claims existentes. Si Firebase
Auth falla, el perfil queda aprobado pero sin acceso efectivo y puede
reintentarse mediante la asignacion manual por UID; no se revierte el perfil.
`revocarAdmin` solo retira `admin` y conserva claims personalizados. En `users/{uid}`, el cliente
solo puede crear su propio perfil `customer` con campos permitidos; las
actualizaciones y borrados requieren `esAdmin()`.

## Pruebas

- `solicitarAdmin` crea una solicitud pendiente en el perfil existente.
- Una solicitud pendiente se devuelve en `GET /api/admin/usuarios`.
- Aprobar asigna claim, cambia el rol y limpia el estado pendiente.
- Rechazar conserva `customer` y cambia el estado a `rejected`.
- Una cuenta admin o una solicitud pendiente no puede crear otra solicitud.
- El login de un usuario sin permisos muestra el mensaje y no redirige al panel.
