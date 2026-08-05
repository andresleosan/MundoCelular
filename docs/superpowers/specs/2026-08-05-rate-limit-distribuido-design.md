# Rate Limit Distribuido para Solicitudes de Administrador

**Estado:** Aprobado por el operador para especificacion
**Fecha:** 2026-08-05
**Alcance:** `POST /api/auth/admin-request`

## Contexto

El endpoint limita actualmente cinco solicitudes por UID durante 60 segundos usando un `Map` en memoria. Ese mecanismo funciona en una sola instancia, pero cada instancia de Vercel mantiene un contador distinto. El limite debe conservarse al ejecutar varias instancias sin agregar un proveedor externo.

## Decisiones

- Usar una transaccion de Firestore con Firebase Admin.
- Mantener la politica actual: 5 solicitudes por UID en una ventana fija de 60 segundos.
- Aplicar el limite despues de verificar el token y antes de escribir la solicitud de administrador.
- Identificar el documento con `sha256(uid)` para no guardar el UID en la ruta del documento.
- No aceptar UID, email ni limites desde el body de la solicitud.
- No cambiar las reglas publicas de Firestore: la coleccion sera usada solo por el servidor con Admin SDK.

## Modelo de Datos

Coleccion: `rateLimits`

Documento: `admin-request:<sha256(uid)>`

Campos:

| Campo | Tipo | Uso |
| --- | --- | --- |
| `count` | number | Solicitudes consumidas en la ventana actual. |
| `windowStartedAt` | number | Epoch en milisegundos del inicio de la ventana. |
| `expiresAt` | Timestamp | Fecha de expiracion para limpieza futura mediante TTL. |
| `updatedAt` | Timestamp | Ultima modificacion del contador. |

No se almacenan email, nombre, token ni contenido de la solicitud.

## Flujo

1. Verificar que exista un header Bearer.
2. Verificar el Firebase ID token con Firebase Admin.
3. Rechazar una cuenta que ya tenga `admin: true` con `409`, sin consumir cuota.
4. Ejecutar una transaccion sobre el documento calculado desde el UID.
5. Si el documento no existe o la ventana expiro, escribir `count: 1` y una nueva ventana.
6. Si `count < 5`, incrementar el contador atomico y permitir la solicitud.
7. Si `count >= 5`, no escribir y responder `429` con `Retry-After` en segundos.
8. Crear la solicitud de administrador solo despues de consumir cuota correctamente.

La transaccion permite que dos instancias concurrentes compitan sobre el mismo documento sin perder incrementos ni superar el limite permitido.

## Errores

| Situacion | Status | Respuesta |
| --- | --- | --- |
| Falta Bearer | `401` | `No autorizado` |
| Token invalido | `401` | `No autorizado` |
| Usuario ya admin | `409` | Mensaje existente |
| Limite alcanzado | `429` | Mensaje existente + `Retry-After` |
| Firestore no disponible | `503` | Error generico sin detalles internos |
| Solicitud duplicada | `409` | Mensaje existente de solicitud pendiente |

En un fallo del store distribuido se aplica fail-closed para no permitir un bypass del control de abuso.

## Seguridad

- La coleccion no se expone a clientes ni se agrega una regla de lectura publica.
- El UID usado para la clave proviene exclusivamente del token verificado.
- El log no incluye UID completo, email, token ni body.
- La entrada externa sigue validandose antes de cualquier escritura.

## Costos

Firestore ya es una dependencia de produccion. Cada solicitud permitida requiere una lectura y una escritura dentro de la transaccion; una solicitud bloqueada requiere la lectura de la transaccion. Al volumen actual de solicitudes administrativas, se espera permanencia dentro del uso bajo/free tier. Se debe activar una alerta de facturacion en Firebase antes de aumentar el trafico o habilitar mas rutas con el mismo mecanismo.

## Pruebas

- Mantener las pruebas actuales de `401`, token invalido, usuario admin, solicitud duplicada y `429`.
- Agregar pruebas de ventana expirada que permitan una nueva solicitud.
- Agregar pruebas de conteo exacto: cinco permitidas y la sexta bloqueada.
- Agregar prueba de error del store que devuelva `503`.
- Agregar prueba de concurrencia mediante el emulador o una transaccion simulada.
- Verificar que no se escriban email ni UID completo en logs.

## Rollback

1. Revertir el commit de implementacion para volver al `Map` en memoria.
2. Mantener la coleccion `rateLimits` sin uso; no es necesario borrar datos inmediatamente.
3. Si se requiere limpieza, borrar solo documentos de `rateLimits` con Admin SDK despues de confirmar que ninguna version activa los usa.
4. Verificar nuevamente `401`, `429`, `npm test`, TypeScript y build.

## Fuera de Alcance

- Redis, Cloudflare Durable Objects u otro proveedor externo.
- Rate limiting por IP o por email.
- Cambiar el limite de negocio de cinco solicitudes por minuto.
- Migrar otros endpoints hasta medir una necesidad real.
