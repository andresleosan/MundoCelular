# Task 6 - Auditoria Local-Produccion Firebase

**Fecha:** 2026-08-03
**Estado:** `revision`
**Workspace auditado:** `F:\Proyectos\Mundo_Celular`

## Resumen De Estado

La Task 6 permanece en `revision`. La configuracion Production de Vercel ya fue completada y la deployment posterior corrigio la lectura publica del catalogo y la optimizacion de imagenes R2. El endpoint `/api/revalidate` continua fallando en la deployment actual por el arbol ESM de `firebase-admin@14.2.0`; el fix local fija `firebase-admin@13.10.0`, pero aun no se ha promovido.

No se hicieron escrituras Firestore ni se creo un producto de prueba. Las credenciales privadas no se imprimieron en logs ni reportes.

## Configuracion Externa

Se ejecuto en modo de lectura:

```powershell
npx vercel env ls production --project prj_1aTQZub6YuPWvTZM7xWOyKggs4kG --json
```

Resultado seguro:

- `FIREBASE_PROJECT_ID` existe con target `production`.
- `FIREBASE_CLIENT_EMAIL` existe con target `production`.
- `FIREBASE_PRIVATE_KEY` existe con target `production`.
- Las variables `NEXT_PUBLIC_FIREBASE_*` observadas tienen target `preview` y `production`.
- Vercel marco las variables como `sensitive`; no se imprimio ningun valor.

Esto confirma nombres y alcance, no confirma que `FIREBASE_PROJECT_ID` tenga el valor `mundocelular-id`, que el service account corresponda a ese proyecto ni que la llave sea valida. La deployment posterior se verifico por CLI y por smoke HTTP, pero los valores privados siguen sin leerse.

El workspace no contiene `.env`, `.env.local`, `.env.production` ni `.env.production.local`. No se leyeron valores secretos. `.firebaserc`, `firebase.json` y los scripts de deploy apuntan a `mundocelular-id`.

## Indices Y Datos

La coleccion canonica es `productos`. Las lecturas publicas conservan `activo == true`; `destacado == true` solo separa la seccion destacada y `stock` no oculta un producto activo. Las marcas se derivan de productos activos.

El archivo local declara, entre otros, estos indices:

- `categorias(activa ASC, orden ASC, __name__ ASC)`
- `productos(activo ASC, nombre ASC)`
- `productos(categoriaId ASC, activo ASC, nombre ASC)`
- `productos(activo ASC, destacado ASC, nombre ASC)`
- `productos(activo ASC, creadoEn DESC)`
- `productos(activo ASC, destacado ASC, __name__ ASC)`
- `variantes(productId ASC, activo ASC, precio ASC)`

Se consulto Firestore en modo de lectura:

```powershell
npx firebase firestore:indexes --project mundocelular-id
```

El resultado remoto contiene seis entradas funcionales y no muestra `productos(activo ASC, creadoEn DESC)`. No se ejecuto `npm run deploy:indexes`; por tanto el indice pendiente no se declara desplegado y la busqueda no se declara verde.

No se creo `iPhone 17 Pro Max`. Falta una cuenta admin de pruebas autorizada para escribir el documento con marca `Apple`, categoria `Celulares`, precio COP valido, stock positivo, imagen valida, `activo=true` y `destacado=true`.

## Causa Y Limites De Atribucion

El codigo server-side requiere `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` antes de inicializar Firebase Admin. El reporte previo comprobo que esas variables estaban ausentes en el workspace de esa sesion y que el build local emitia solo diagnostico seguro. La dependencia `firebase-admin@13.10.0` tambien termino el build local sin `ERR_REQUIRE_ESM` en la verificacion previa.

La evidencia historica de Vercel registro un `500` de `/api/revalidate` asociado al runtime ESM de `firebase-admin/auth`, `jose` y `jwks-rsa`. El build local posterior no mostro `ERR_REQUIRE_ESM`; esto prueba la correccion local del bundle, no su promocion a Vercel.

La ultima evidencia HTTP registrada antes de este fix fue:

| Ruta | Local registrado | `mundocelular.vercel.app` registrado | Aliases `main`/`deployment` registrados |
| --- | --- | --- | --- |
| `/` | Conexion rechazada | `200`, HTML cacheado sin el producto | Login Vercel por SSO |
| `/categoria/celulares` | Conexion rechazada | `500`, cuerpo vacio | HTML de login, no JSON |
| `/api/buscar?q=iPhone%2017%20Pro%20Max` | Conexion rechazada | `500`, cuerpo vacio | HTML de login, no JSON |
| `/api/buscar?marca=Apple` | Conexion rechazada | `500`, cuerpo vacio | HTML de login, no JSON |
| `/marca/apple` | Conexion rechazada | `500`, cuerpo vacio | Login Vercel por SSO |
| `/producto/iphone-17-pro-max` | Conexion rechazada | `500`, cuerpo vacio | Login Vercel por SSO |

Esos resultados son evidencia historica del reporte previo. Los logs actuales de la deployment `dpl_7QRiydC7Ghh37eLYCcJtk3JauUCV` atribuyen el `500` de `/api/revalidate` a `firebase-admin/auth` cargando `jose@6` desde `jwks-rsa@4` bajo CommonJS.

## Verificaciones Locales

- `npm test`: 36 archivos y 222 tests pasan.
- `npx tsc --noEmit`: pasa sin salida.
- `npm run lint`: 0 errores y 11 warnings ya documentados en scripts QA, imagenes y `useScrollAnimation`.
- `git diff --check`: pasa; Git solo informa avisos de conversion LF/CRLF de Windows.
- `npm run build`: pasa con Turbopack, genera 29 rutas y no muestra `ERR_REQUIRE_ESM`.
- `npm run start -- -p 3100` + `POST /api/revalidate` con bearer invalido: `401`, sin fallo de carga de `firebase-admin/auth`.
- `npm audit --omit=dev --audit-level=high`: 17 vulnerabilidades, 11 moderate y 6 high; permanece como pendiente separado.

## Evidencia Posterior A La Configuracion

- Deployment actual: `dpl_7QRiydC7Ghh37eLYCcJtk3JauUCV`, estado `READY`, alias `https://mundocelular.vercel.app`.
- La imagen R2 de `iPhone 17 Pro Max 256GB Blanco` carga con `naturalWidth=450`; `/_next/image` responde `200` y no hubo errores de consola en la corrida fresca.
- `GET /api/buscar?q=iPhone%2017%20Pro%20Max`: `200`, devuelve el producto.
- `GET /api/buscar?marca=Apple`: `200`, devuelve el producto.
- `/categoria/celulares`, `/marca/apple` y `/producto/iphone-17-pro-max-256gb`: `200`, contienen el producto.
- `POST /api/revalidate` con token inválido: `500`; el log de Vercel conserva el error `ERR_REQUIRE_ESM` de `firebase-admin/auth`.
- En local, el mismo smoke con el código corregido devuelve `401` para el token inválido.
- El checkout local ya resuelve `firebase-admin@13.10.0 -> jwks-rsa@3.2.2 -> jose@4.15.9`; el código corregido aún no tiene commit, push ni deployment.
- `npx firebase firestore:indexes --project mundocelular-id` muestra los índices remotos usados por las consultas públicas; el índice local `productos(activo ASC, creadoEn DESC)` no es necesario para la implementación actual porque `listarProductosActivos` ordena después de leer.
- La QA ejecutada por Playwright MCP se conserva como evidencia de esta sesión; todavía no existe un reporte HTML reproducible en `qa/reports/`.

## Evidencia QA Persistida

No se presenta la QA de Task 6 como reproducible. En el workspace auditado:

- No existe `qa/reports/`.
- No existe ningun archivo `*.log`, `*.har` o `*.trace.zip`.
- Existen los scripts `qa/verify-pasos-6-11.mjs` y `qa/test-login.mjs`, pero son scripts y no resultados de una corrida de Task 6.
- Existen estas cuatro capturas sueltas, sin manifest, commit, viewport completo ni identificador de corrida de Task 6: `qa-home-3000-marcas-phone.png`, `qa-home-3000-phone-restored.png`, `admin-login.png` y `admin-redirect.png`.
- `qa/verify-pasos-6-11.mjs` apunta su salida a `F:/Proyectos/Mundo_Celular/qa/reports`, fuera del workspace auditado; no se usa esa ruta externa como evidencia de esta Task 6.

Las capturas sueltas no demuestran el producto de prueba, las seis rutas en las cuatro bases, los tres viewports requeridos, la consola, la red ni la ausencia de errores. La aceptacion post-redeploy queda bloqueada.

## Gate Obligatorio De Rollback

Ninguna accion de rollback o mutacion de produccion se puede ejecutar hasta cumplir **ambas** precondiciones:

1. Autorizacion explicita del operador, registrada para la accion, el entorno, el deployment o documento afectado y el momento de ejecucion.
2. `deploy-checklist` completado para esa accion: seguridad sin hallazgos criticos abiertos, pruebas aprobadas con evidencia verificable, rollback documentado, confirmacion explicita del operador y, por tratarse de una UI Nivel 2/3, reporte E2E verificable cuando la accion promocione una release.

La regla aplica antes de cada accion, no solo antes del primer paso:

- **Promover o reasignar un deployment:** requiere autorizacion del operador y `deploy-checklist` antes de cambiar el deployment activo. No se elimina el deployment conocido bueno.
- **Cambiar o restaurar variables:** requiere autorizacion del operador y `deploy-checklist` antes de modificar cualquier variable `Production` o redeployar. Los valores permanecen fuera de logs y reportes.
- **Escribir `activo=false`:** requiere autorizacion del operador y `deploy-checklist` antes de escribir el documento Firestore. Primero se verifica el ID y la ausencia de pedidos o referencias.
- **Retirar un indice:** requiere autorizacion del operador y `deploy-checklist` antes de retirar el indice. Primero se comprueba que ninguna consulta dependa de el y se conserva el manifiesto local.

Si falta cualquiera de las dos precondiciones, la accion se detiene. En esta ejecucion no se activo ningun rollback.

## Archivos

### Cambiados En Esta Iteracion

- `package.json` y `package-lock.json` fijan `firebase-admin@13.10.0`.
- `src/lib/firebase-admin-config.ts`, `src/lib/firebase-admin.ts` y `src/lib/firestore/diagnostics.ts` endurecen configuración y diagnóstico.
- `src/lib/firestore/public.ts`, `src/app/api/buscar/route.ts` y `src/app/api/revalidate/route.ts` corrigen lecturas, errores y revalidación.
- `src/app/page.tsx` y `src/lib/storefront/brands.ts` derivan marcas del inventario activo.
- `.env.local.example`, `firestore.indexes.json`, `tasks.md` y las pruebas/documentación asociadas actualizan el contrato.

### Archivos Ya Modificados Al Iniciar El Fix

Estos cambios estaban en el worktree antes de este fix y no se atribuyen a esta correccion:

- `.env.local.example`
- `firestore.indexes.json`
- `package-lock.json`
- `package.json`
- `src/app/api/buscar/route.ts`
- `src/app/api/revalidate/route.ts`
- `src/app/page.tsx`
- `src/lib/api-auth.ts`
- `src/lib/firebase-admin.ts`
- `src/lib/firebase.ts`
- `src/lib/firestore/public.ts`
- `src/lib/revalidate.ts`
- `src/lib/storefront/brands.ts`
- `tests/api/buscar.test.ts`
- `tests/components/storefront/MarcasSection.test.tsx`
- `tests/lib/brands.test.ts`
- `tests/lib/firestore-productos.test.ts`
- `tests/lib/firestore-public.test.ts`
- `tests/lib/home-sections.test.ts`
- `docs/superpowers/plans/2026-08-03-auditoria-local-produccion-firebase.md`
- `docs/superpowers/specs/2026-08-03-auditoria-local-produccion-firebase-design.md`
- `src/lib/firebase-admin-config.ts`
- `src/lib/firestore/diagnostics.ts`
- `tests/api/revalidate.test.ts`
- `tests/lib/firebase-admin-config.test.ts`
- `tests/lib/firebase-client-config.test.ts`
- `tests/lib/firestore-diagnostics.test.ts`
- `tests/lib/firestore-indexes.test.ts`

## Bloqueos

- Falta promover el fix `firebase-admin@13.10.0` y verificar que `/api/revalidate` devuelva `401` para un token inválido en producción.
- Los valores y la compatibilidad real de las variables privadas no se pueden comprobar sin exponer secretos; la lista de nombres no basta.
- No hay cuenta admin de pruebas autorizada ni producto de prueba creado mediante CRUD.
- No existe un reporte HTML E2E persistido en `qa/reports/`.
- El reporte de `npm audit --omit=dev` mantiene 17 vulnerabilidades: 11 moderate y 6 high; requiere decisión separada porque `npm audit fix --force` cambia Next y Firebase Admin fuera del alcance.
- La búsqueda pública lee el catálogo completo por solicitud y aún no tiene rate limiting.

La tarea permanece en `revision` hasta que un operador autorizado complete las acciones externas y aporte evidencia persistida de la corrida posterior.
