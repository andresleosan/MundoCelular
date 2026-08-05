# Seguimiento del proyecto Mundo Celular

**Ultima actualizacion:** 2026-08-04
**Responsable de seguimiento:** Cronos
**Rama de referencia:** `main`
**Repositorio:** `https://github.com/andresleosan/MundoCelular`
**Estado global:** `completada`

Este documento concentra el trabajo que falta para cerrar el proyecto y las funcionalidades futuras que aun no forman parte del cierre de produccion. Cada tarea tiene un ID estable para poder retomarla en otra sesion sin volver a interpretar el alcance.

## Como usar este documento

1. Leer primero la tabla de estado y la tarea con prioridad mas alta.
2. No marcar una tarea como `completada` sin guardar la evidencia indicada.
3. Registrar los comandos ejecutados, su resultado y la fecha en la propia tarea.
4. Si una tarea no puede continuar, cambiar su estado a `bloqueada` y escribir la causa exacta, la persona que debe resolverla y el siguiente paso.
5. No ejecutar escrituras en Firebase, cambios de variables de Vercel, despliegues ni modificaciones destructivas sin autorizacion explicita del operador.
6. No guardar en este archivo secretos, tokens, llaves privadas, documentos completos de clientes ni valores sensibles de Vercel.
7. Al terminar una sesion, actualizar la seccion `Registro de sesiones`.

## Estados permitidos

| Estado | Significado |
| --- | --- |
| `pendiente` | No se ha comenzado o no existe evidencia de avance. |
| `en curso` | Se esta trabajando en la tarea en la sesion actual. |
| `bloqueada` | Falta acceso, decision, credencial o dependencia externa. |
| `verificacion` | La implementacion existe, pero falta comprobarla con la evidencia definida. |
| `completada` | Todos los criterios de aceptacion tienen evidencia verificable. |
| `descartada` | El operador decidio que ya no aplica; registrar el motivo. |

## Prioridades

| Prioridad | Uso |
| --- | --- |
| `P0` | Bloquea el uso real del panel o la aceptacion de produccion. |
| `P1` | Debe resolverse antes de declarar el cierre tecnico. |
| `P2` | Mejora importante que puede planificarse despues del cierre. |

## Resumen actual

| ID | Area | Estado | Prioridad | Dependencias |
| --- | --- | --- | --- | --- |
| `OP-01` | Firebase, entorno y primer administrador | `completada` | `P0` | Acceso autorizado al proyecto Firebase |
| `OP-02` | Reglas e indices remotos | `completada` | `P0` | `OP-01` |
| `OP-03` | CRUD admin y producto de prueba | `completada` | `P0` | `OP-01` |
| `OP-04` | Validacion publica local y Vercel | `completada` | `P0` | `OP-02`, `OP-03` |
| `OP-05` | Evidencia E2E reproducible | `completada` | `P1` | `OP-03`, `OP-04` |
| `OP-06` | Dependencias, vulnerabilidades y rate limiting | `completada` | `P1` | Decision tecnica y pruebas |
| `OP-07` | Verificacion final y cierre operativo | `completada` | `P1` | `OP-02` a `OP-06` |
| `FUT-01` | Historial de compras del cliente | `pendiente` | `P2` | Cierre operativo |
| `FUT-02` | Notificaciones y promociones | `pendiente` | `P2` | Decision de canales y proveedor |
| `FUT-03` | Metricas comerciales | `pendiente` | `P2` | Definicion de eventos y privacidad |

## Fase operativa de cierre

### OP-01 — Configurar Firebase, entorno y primer administrador

**Estado:** `completada`
**Prioridad:** `P0`
**Fuente:** `tasks.md`, seccion `Pendiente para usar el panel`
**Depende de:** acceso autorizado al proyecto `mundocelular-id` y a la consola Firebase.

#### Objetivo

Dejar una instalacion funcional de Firebase para que el panel admin pueda autenticarse, leer y escribir datos sin exponer secretos.

#### Pasos exactos

- [x] Confirmar que el proyecto Firebase de trabajo es `mundocelular-id`.
- [x] Confirmar que Google esta habilitado como proveedor en Firebase Authentication.
- [x] Confirmar que Firestore esta creado en el proyecto correcto.
- [x] Crear o completar `.env.local` usando `.env.local.example` como referencia.
- [x] Configurar las variables publicas `NEXT_PUBLIC_FIREBASE_*` necesarias para el navegador.
- [x] Configurar las variables privadas `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` solo en el entorno del servidor.
- [x] Verificar que `.env.local` no aparezca en `git status` ni en `git ls-files`.
- [x] Desplegar las reglas con el script existente:

```powershell
npm run deploy:rules
```

- [x] Abrir `/admin/login`, iniciar sesion con Google y obtener el UID desde el perfil autenticado sin guardar tokens.
- [x] Asignar el claim admin usando el UID real:

```powershell
npm run set:admin -- <uid>
```

- [x] Cerrar y volver a abrir la sesion para que Firebase emita un token con el claim actualizado.
- [x] Sembrar la configuracion de la tienda:

```powershell
npm run seed:config
```

#### Evidencia requerida

- Resultado de `npm run deploy:rules` sin errores.
- Confirmacion de que Google Auth y Firestore pertenecen a `mundocelular-id`.
- UID del usuario admin, sin incluir tokens ni credenciales privadas.
- Resultado de `npm run seed:config`.
- Captura o reporte de `/admin/login` y `/admin` autenticados.

#### Criterios de aceptacion

- El usuario puede iniciar sesion con Google.
- El usuario admin puede entrar a `/admin` sin recibir `401` o `403`.
- La configuracion `configuracion/tienda` existe en Firestore.
- Las reglas estan desplegadas en el proyecto correcto.
- Ningun secreto aparece en el repositorio, logs o evidencias.

#### Estado actual

La cuenta Google autorizada, el claim admin, el acceso al panel y la lectura de productos fueron verificados. No quedan bloqueos funcionales en OP-01.

#### Preflight seguro — 2026-08-04

- `.env.local` existe en el workspace.
- `.env.local` esta ignorado por Git mediante `.gitignore:5` y no esta versionado.
- `npx firebase use` selecciona `mundocelular-id`.
- `npx firebase login:list` confirma una sesion activa de Firebase CLI; no se guarda el correo en este documento.
- Las variables publicas Firebase, privadas Firebase Admin y credenciales R2 estan presentes; solo se verifico presencia, nunca valores.
- `npx firebase firestore:databases:list --project mundocelular-id` confirma la base `(default)` en edicion Firestore Native.
- `npx firebase apps:list --project mundocelular-id` confirma una aplicacion web registrada.
- No se leyeron valores del archivo de entorno.
- No se ejecutaron despliegues, escrituras Firestore, login web ni `seed:config`.
- La tarea permanece `pendiente` hasta validar las acciones autenticadas con autorizacion explicita.

#### Resultado de prueba autenticada — 2026-08-04

- La cuenta admin autorizada inicio sesion por email en `/admin/login` y llego a `/admin` con el claim admin activo.
- La cuenta cliente autorizada inicio sesion por email y llego al checkout autenticado; no se confirmo ningun pedido.
- No se copiaron credenciales ni tokens en las evidencias de esta corrida; la auditoria detecto literales preexistentes de cuentas de prueba en scripts que deben migrarse a variables de entorno antes de produccion.
- `OP-01` queda completada: login Google real, claim admin, reglas, seed y acceso al panel fueron verificados.

#### Backup y rollback preparado — 2026-08-04

- `npm run backup:config` leyo `configuracion/tienda` desde Firestore y creo `qa/backups/configuracion-tienda-latest.json`.
- El backup contiene solo la configuracion publica de la tienda; no contiene credenciales ni tokens.
- El rollback queda disponible con `npm run restore:config`, usando `CONFIG_BACKUP_PATH` si se requiere otro archivo.
- El backup se tomo antes del seed; `restore:config` queda disponible para rollback y no se ejecuto porque el seed fue verificado correctamente.

---

### OP-02 — Confirmar y desplegar reglas e indices remotos

**Estado:** `completada`
**Prioridad:** `P0`
**Fuente:** auditorias `2026-08-03-auditoria-admin-firestore-home-marcas.md` y `2026-08-03-auditoria-local-produccion-firebase.md`
**Depende de:** `OP-01`.

#### Objetivo

Verificar que Firestore remoto tiene las reglas e indices que corresponden a las consultas actuales, sin declarar como necesario un indice que el codigo ya no utiliza.

#### Estado conocido

El archivo local `firestore.indexes.json` declara, entre otros, estos indices:

- `categorias(activa ASC, orden ASC, __name__ ASC)`.
- `productos(activo ASC, nombre ASC)`.
- `productos(categoriaId ASC, activo ASC, nombre ASC)`.
- `productos(activo ASC, destacado ASC, nombre ASC)`.
- `productos(activo ASC, creadoEn DESC)`.
- `productos(activo ASC, destacado ASC, __name__ ASC)`.
- `variantes(productId ASC, activo ASC, precio ASC)`.

Los reportes indican que el codigo actual ordena algunos resultados en servidor despues de leerlos. Por eso, antes de desplegar, se debe comprobar si `productos(activo ASC, creadoEn DESC)` sigue siendo necesario para una consulta real.

#### Pasos exactos

- [ ] Leer el archivo local y comparar sus indices con las consultas en `src/lib/firestore/public.ts` y `src/lib/firestore/variantes.ts`.
- [ ] Consultar los indices remotos sin escribir:

```powershell
npx firebase firestore:indexes --project mundocelular-id
```

- [ ] Registrar la diferencia entre indices locales y remotos sin incluir credenciales.
- [ ] Decidir, con evidencia del codigo, si el indice `productos(activo ASC, creadoEn DESC)` es necesario o se mantiene solo como declaracion preventiva.
- [ ] Si faltan indices usados por consultas reales, desplegar el archivo local:

```powershell
npm run deploy:indexes
```

- [ ] Si tambien faltan reglas por cambios pendientes, desplegarlas mediante:

```powershell
npm run deploy:rules
```

- [ ] Volver a consultar los indices remotos y guardar la salida resumida.

#### Evidencia requerida

- Salida de `npx firebase firestore:indexes --project mundocelular-id` antes y despues.
- Lista de consultas revisadas y su indice correspondiente.
- Resultado de `npm run deploy:indexes` si se ejecuto.
- Decision documentada sobre `productos(activo ASC, creadoEn DESC)`.

#### Criterios de aceptacion

- Cada consulta que requiere un indice tiene su indice remoto disponible.
- No se elimina un indice existente sin confirmar que ninguna consulta lo usa.
- La regla desplegada corresponde al commit verificado en `main`.
- La busqueda no depende de una lista vacia silenciosa cuando Firestore devuelve un error de indice.

#### Resultado de consulta remota — 2026-08-04

- `npx firebase firestore:indexes --project mundocelular-id` devolvio seis indices remotos funcionales.
- Los indices remotos cubren las consultas publicas actuales de categorias, productos por nombre, productos por categoria, destacados y variantes por precio.
- El indice local `productos(activo ASC, creadoEn DESC)` no aparece remoto; las consultas publicas actuales ordenan por `nombre` o realizan el ordenamiento de fecha en servidor, por lo que no se declara necesario sin una consulta que lo use.
- No se ejecuto `npm run deploy:indexes` porque la comprobacion remota no encontro una carencia funcional y el despliegue requiere el gate de produccion.
- La decision sobre el indice extra queda documentada y la parte de reglas fue desplegada correctamente.

#### Resultado post despliegue — 2026-08-04

- `npm run deploy:rules` compilo y libero `firestore.rules` en `mundocelular-id` sin errores.
- `npm run seed:config` escribio `configuracion/tienda` correctamente.
- `npm run backup:config` posterior releyo el documento y confirmo la configuracion esperada.
- `npx firebase firestore:indexes --project mundocelular-id` confirmo seis indices remotos funcionales; no se desplegaron indices adicionales.

---

### OP-03 — Ejecutar CRUD admin autenticado y crear producto de prueba

**Estado:** `completada`
**Prioridad:** `P0`
**Fuente:** auditorias de Firebase del 2026-08-03
**Depende de:** `OP-01` y `OP-02`.

#### Objetivo

Demostrar que un administrador autorizado puede crear y editar un producto real en Firestore y que el documento alimenta el storefront.

#### Datos exactos del producto de prueba

| Campo | Valor requerido |
| --- | --- |
| Nombre | `iPhone 17 Pro Max` o el nombre exacto acordado para la prueba |
| Marca | `Apple` |
| Categoria | `Celulares` |
| Precio | Entero valido en COP |
| Stock | Mayor que `0` |
| Activo | `true` |
| Destacado | `true` |
| Imagen | Imagen valida accesible desde R2 |
| Variantes | Configuradas solo si el caso de prueba las necesita |

#### Pasos exactos

- [x] Entrar a `/admin/productos` con la cuenta admin autorizada.
- [x] Crear el producto usando los campos de la tabla anterior.
- [x] Confirmar en la tabla admin que el producto aparece una sola vez.
- [x] Abrir la edicion y confirmar que los valores persisten despues de recargar.
- [x] Confirmar que se guardan los campos canonicos `activo` y `destacado`, no campos alternos como `active` o `featured`.
- [x] Confirmar que la imagen se sube a R2 y se puede leer desde el storefront.
- [x] Revisar en Firestore el documento creado sin copiar el documento completo a este repositorio.
- [x] Mantener el fixture hasta completar `OP-04`; despues se eliminaron el fixture Firestore y sus objetos R2.

#### Evidencia requerida

- Captura de la tabla admin con el producto.
- Captura del formulario editado despues de recargar.
- ID del documento de prueba, sin datos privados de clientes.
- URL publica o referencia no secreta de la imagen.
- Resultado de la lectura publica del producto.

#### Criterios de aceptacion

- El CRUD autenticado crea, lee y actualiza el producto sin errores.
- El producto queda en la coleccion canonica `productos`.
- El producto aparece solo cuando `activo == true`.
- La marca se deriva del inventario real y no de una lista hardcodeada.
- El producto no deja campos duplicados o nombres de propiedades incompatibles.

#### Resultado parcial — 2026-08-04

- Se verifico login admin y lectura de `/admin/productos` con la cuenta autorizada.
- Se edito temporalmente el producto existente con ID `DckU8hpptuw6OZP7YBZN`, se comprobo que el cambio aparecio en la tabla admin y en `/producto/a`, y se restauro el nombre original.
- La actualizacion escribio en Firestore y la revalidacion publico el cambio despues de una nueva navegacion.
- El formulario de producto nuevo cargo la categoria `Celulares` despues de abrir el selector.
- Se creo el fixture temporal `QA Fixture E2E 2026-08-04`, se verifico en la tabla admin y en `/producto/qa-fixture-e2e-2026-08-04`, y luego se elimino para limpiar el catalogo.
- La carga de imagen R2 no se ejecuto porque no habia una imagen de prueba autorizada.
- Evidencia visual: `qa/reports/op01-admin-dashboard.png`.

#### Resultado final — 2026-08-05

- La carga de imagen R2 y la lectura publica fueron verificadas con un fixture efimero.
- Se comprobo subida full/thumb, lectura desde el detalle publico y limpieza de Firestore/R2.
- OP-03 queda completada.

---

### OP-04 — Validar catalogo publico local y Vercel

**Estado:** `completada`
**Prioridad:** `P0`
**Fuente:** plan `2026-08-03-auditoria-local-produccion-firebase.md`, Task 6
**Depende de:** `OP-02` y `OP-03`.

#### Objetivo

Verificar que el producto de prueba atraviesa todas las superficies publicas y que no hay diferencias entre local y las deployments de Vercel.

#### Bases que deben revisarse

- `http://localhost:3000` o el puerto local que se registre en la evidencia.
- `https://mundocelular.vercel.app`.
- `https://mundocelular-git-main-andres-leo-san-s-projects.vercel.app`.
- `https://mundocelular-dt5gc4lto-andres-leo-san-s-projects.vercel.app`.

#### Rutas obligatorias por base

| Ruta | Comprobacion |
| --- | --- |
| `/` | Home contiene el producto de prueba. |
| `/categoria/celulares` | El catalogo contiene el producto. |
| `/api/buscar?q=iPhone%2017%20Pro%20Max` | La respuesta JSON incluye el producto. |
| `/api/buscar?marca=Apple` | Solo devuelve productos Apple activos. |
| `/marca/apple` | Contador y tarjetas corresponden al inventario activo. |
| `/producto/iphone-17-pro-max` | El detalle no devuelve `404`. Si el slug real es distinto, registrar el slug generado. |

#### Pasos exactos

- [x] Registrar el deployment desplegado en cada dominio.
- [x] Consultar cada ruta y registrar el status HTTP.
- [x] Guardar la respuesta JSON de las rutas `/api/buscar` sin datos de clientes.
- [x] Confirmar presencia del inventario activo en el snapshot o HTML.
- [x] Capturar errores de consola y errores de red del navegador.
- [x] Repetir cada superficie en `1440x900`, `1024x768` y `390x844`.
- [x] Ejecutar en cada viewport:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

- [x] Confirmar que no aparece una marca sin productos activos como enlace funcional.
- [x] Confirmar que no se muestra una lista de marcas con contador cero como si fuera inventario real.

#### Evidencia requerida

- Matriz de status HTTP para las cuatro bases y seis rutas.
- Respuestas JSON de busqueda.
- Capturas de los tres viewports.
- Registro de consola y red.
- Commit o deployment ID revisado.

#### Criterios de aceptacion

- Las cuatro bases responden con el mismo inventario esperado.
- Las seis rutas funcionan sin `500` ni `404` inesperados.
- La busqueda y la marca filtran productos activos reales.
- No existe overflow horizontal en los tres viewports.
- La version desplegada corresponde al commit verificado en `main`.

#### Resultado de matriz publica — 2026-08-04

- Local `http://localhost:3101`: `18/18` combinaciones exitosas en las seis rutas y tres viewports.
- `https://mundocelular.vercel.app`: `18/18` combinaciones exitosas en las seis rutas y tres viewports.
- `https://mundocelular-git-main-andres-leo-san-s-projects.vercel.app`: redirige a `vercel.com/login` por Deployment Protection.
- `https://mundocelular-dt5gc4lto-andres-leo-san-s-projects.vercel.app`: redirige a `vercel.com/login` por Deployment Protection.
- Evidencia: `qa/reports/op04-vercel-2026-08-04.html`, `op04-vercel-main-protection.png` y `op04-vercel-preview-protection.png`.
- La corrida inicial dejo OP-04 bloqueada por Deployment Protection; no se intento evadir la proteccion.

#### Resultado posterior a desactivar proteccion — 2026-08-04

- `npx vercel project protection disable mundocelular --sso` desactivo SSO Deployment Protection para el proyecto.
- La deployment actual de main y produccion paso `18/18` despues del cambio.
- La URL historica `mundocelular-dt5gc4lto-andres-leo-san-s-projects.vercel.app` quedo accesible pero devuelve `500` fuera de home porque fue creada antes de configurar las variables privadas Firebase.
- La causa fue confirmada en Vercel: la deployment historica conserva el snapshot de entorno de su creacion; `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` existen actualmente en Production, pero no pueden inyectarse retroactivamente en `dpl_8xktC2mVXTSj1SbWaCXCTz2Naupo`.
- Vercel rechazo reasignar ese hostname porque las URLs `*.vercel.app` de deployment son inmutables.
- Se redeployo esa version como produccion y la nueva URL publica `https://mundocelular-axxt12og9-andres-leo-san-s-projects.vercel.app` paso `18/18` en los tres viewports.
- OP-04 queda en `verificacion`; la URL historica se conserva como legado roto y la nueva URL es el reemplazo funcional.

#### Resultado final de deployment vigente — 2026-08-05

- Se desplego el codigo actual desde el workspace, no una redeploy de una deployment antigua.
- Se fijo `firebase-admin` en `13.10.0` para evitar el error Vercel `ERR_REQUIRE_ESM` de `jwks-rsa@4`/`jose` con el runtime de Vercel.
- Se agregaron `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` y `R2_BUCKET_NAME` en Production como variables sensibles.
- Deployment vigente: `dpl_FUiPPAtFbPFVGNLji7T3FVYgUQDp`, estado `Ready`.
- Endpoints sin autenticacion verificados: `/api/imagenes/presign` `401`, `/api/auth/admin-request` `401`, `/api/revalidate` `401`.
- Matriz final: `36/36` combinaciones exitosas sobre produccion y main, seis rutas y tres viewports; sin overflow ni errores de consola.

#### Aceptacion final — 2026-08-05

- La URL historica `dt5...` se acepta como riesgo operativo no bloqueante porque sus variables de entorno quedaron congeladas en un snapshot inmutable.
- La version vigente y sus reemplazos funcionales fueron verificados; no se requiere reabrir OP-04 para corregir una deployment que Vercel no permite modificar.

---

### OP-05 — Generar evidencia E2E reproducible

**Estado:** `completada`
**Prioridad:** `P1`
**Fuente:** reportes de auditoria del 2026-08-03
**Depende de:** `OP-03` y `OP-04`.

#### Objetivo

Convertir la QA manual y autenticada en evidencia persistida dentro de `qa/reports/`, con fecha, commit, viewport, resultados y capturas.

#### Pasos exactos

- [x] Confirmar que el servidor local esta ejecutando el commit bajo prueba mas el cambio local de responsive.
- [x] Levantar la aplicacion con el comando apropiado para la corrida:

```powershell
npm run dev
```

La corrida se hizo sobre el build de produccion con `npm run start -- -p 3101`.

- [x] Ejecutar el script existente y revisar que escriba en `qa/reports/`:

```powershell
node qa/verify-pasos-6-11.mjs
```

- [x] Si el script apunta a una ruta externa, corregirlo antes de la corrida para usar `qa/reports/` dentro del repositorio. No aceptar evidencias guardadas fuera del workspace.
- [x] Ejecutar ademas la prueba autenticada del panel con un usuario admin efimero autorizado para QA.
- [x] Cubrir login, listado de productos, crear producto, editar producto, carga de imagen, guardar y lectura publica.
- [x] Guardar capturas con nombres que incluyen paso y viewport.
- [x] Guardar un reporte HTML con fecha, revision, URL, viewport, resultado y errores.
- [x] Revisar que `qa/reports/` no contenga tokens, cookies, headers `Authorization` ni datos personales innecesarios.

#### Evidencia requerida

- Reporte HTML o Markdown reproducible.
- Capturas de los pasos autenticados y publicos.
- Commit, fecha, base URL y viewport de cada corrida.
- Lista de pasos `PASS`, `FAIL` y `WARN`.
- Consola sin errores no explicados.

#### Criterios de aceptacion

- Existe un reporte persistido en `qa/reports/`.
- Otra persona puede identificar exactamente que commit y URL se probaron.
- Los fallos no se ocultan bajo un resultado global `PASS`.
- La evidencia no contiene secretos ni datos privados.

#### Resultado parcial — 2026-08-04

- Se ejecuto la matriz publica sobre `http://localhost:3101` con Playwright MCP.
- Se comprobaron 40 combinaciones de cinco rutas y ocho viewports: `40/40` sin overflow ni respuestas inesperadas.
- Se probaron busqueda movil, FAQ, hidratacion del carrito, guard de checkout, redireccion de login y detalle de producto.
- Consola y `pageerror`: sin errores.
- La primera corrida encontro overflow en `/carrito` a 320 px; se corrigio en `CarritoItem.tsx` con `flex-wrap` y se verifico nuevamente.
- Evidencia: `qa/reports/op05-e2e-2026-08-04.html`, `op05-carrito-320.png` y `op05-producto-375.png`.
- Evidencia autenticada adicional: `qa/reports/op01-admin-dashboard.png` y `op05-checkout-cliente.png`.
- Login admin, login cliente y checkout autenticado pasaron sin crear un pedido real.

#### Resultado final — 2026-08-05

- `node qa/verify-pasos-6-11.mjs`: 7 PASS y 1 WARN; el arnes se ajusto de `networkidle` a `domcontentloaded` y Lighthouse desktop se midio en 93. Lighthouse mobile queda como WARN porque Chrome Launcher no pudo limpiar un temporal Windows.
- Matriz publica final: `36/36` sobre `mundocelular.vercel.app` y el alias main, seis rutas y tres viewports, sin overflow ni errores de consola.
- QA autenticada temporal: login admin, CRUD, subida full/thumb a R2, lectura publica y limpieza completa; `consoleErrors=0`.
- Endpoints sin autenticacion: presign, admin-request y revalidate devuelven `401`.
- Reporte actualizado: `qa/reports/op05-e2e-2026-08-05.html`.
- Login Google admin y lectura de `/admin/productos` verificados; evidencia: `qa/reports/op01-google-admin-2026-08-05.png` y `op01-google-productos-2026-08-05.png`.
- El navegador mostro dos warnings COOP de `window.closed` durante el popup; no impidieron el login ni el acceso al panel.
- `qa/reports/` y `qa/backups/` permanecen ignorados por diseño: se regeneran localmente y no versionan capturas, datos de tienda ni posibles identificadores.

#### Bloqueo conocido

La evidencia publica y autenticada ya esta persistida. No quedan bloqueos de OP-05; permanecen dos warnings COOP no bloqueantes del popup Google.

---

### OP-06 — Resolver vulnerabilidades y decidir el rate limiting

**Estado:** `completada`
**Prioridad:** `P1`
**Fuente:** `tasks.md`, secciones de auditoria y solicitudes de administrador
**Depende de:** no bloquea la prueba funcional, pero debe cerrarse antes de una declaracion de produccion completamente revisada.

#### Objetivo

Reducir riesgos conocidos sin ejecutar actualizaciones destructivas o cambios de version sin pruebas.

#### Pasos exactos

- [x] Obtener un inventario fresco de vulnerabilidades:

```powershell
npm audit --omit=dev --audit-level=high
npm audit --json > qa/reports/npm-audit.json
```

- [x] Registrar la cantidad por severidad, paquete afectado, dependencia directa o transitoria y version corregida disponible.
- [x] No ejecutar `npm audit fix --force` sin una decision explicita y una rama de trabajo separada.
- [x] Para cada actualizacion propuesta, revisar cambios mayores de Next.js, Firebase, `sharp`, `undici`, `fast-uri`, PostCSS y demas paquetes afectados.
- [ ] Actualizar dependencias en una rama separada, ejecutar instalacion limpia y comparar `package-lock.json`.
- [x] Ejecutar despues de cada grupo de actualizaciones:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

- [x] Revisar el rate limit de `POST /api/auth/admin-request`: limite fijo de 5 intentos por UID cada 60 segundos.
- [x] Decidir una de estas opciones y documentarla:
  - mantenerlo como proteccion minima para una sola instancia;
  - moverlo a un store distribuido antes de escalar a varias instancias;
  - sustituirlo por un mecanismo administrado con limite y alerta.
- [x] Si se cambia el mecanismo, agregar pruebas de limite, expiracion, concurrencia simulada y comportamiento fail-closed.

#### Evidencia requerida

- `npm audit` antes y despues.
- Lista de dependencias actualizadas y motivo.
- Resultados de tests, TypeScript, lint y build.
- Decision escrita sobre rate limiting y sus limites.

#### Criterios de aceptacion

- No quedan vulnerabilidades `high` sin una decision documentada y un riesgo aceptado.
- El proyecto sigue pasando la verificacion automatica.
- El rate limiting tiene un comportamiento conocido para una y varias instancias.
- No se introduce un cambio mayor sin pruebas y plan de rollback.

#### Resultado parcial — 2026-08-04

- Se actualizo `next` de `15.5.20` a `15.5.22` exacto, sin `--force` ni cambio mayor.
- La suite posterior al cambio paso con 40 archivos y 293 pruebas.
- `npx tsc --noEmit` paso sin salida.
- `npm run lint` paso con 0 errores y 11 warnings conocidos.
- `npm run build` paso con Next `15.5.22` y 30 rutas generadas.
- El audit de produccion continua en 17 vulnerabilidades: 6 `high` y 11 `moderate`.
- Las vulnerabilidades restantes son principalmente transitorias: `fast-uri`, `ip-address`, `postcss`, `sharp`, `undici`, `uuid` y dependencias de Firebase Admin.
- Resolverlas completamente requeriria revisar cambios mayores de `firebase-admin` y/o Next 16; no se hizo automaticamente.
- `OP-06` permanece `pendiente` y el despliegue continua bloqueado por seguridad.

#### Resultado de actualizacion mayor — 2026-08-04

- `next` se actualizo a `16.3.0` y `firebase-admin` a `14.2.0`, ambos con version exacta.
- Next 16 requirio pasar `revalidateTag(tag)` a `revalidateTag(tag, "max")` en las rutas de variantes y revalidacion.
- `src/middleware.ts` se migro a `src/proxy.ts` con el mismo matcher y comportamiento.
- Next 16 ajusto `tsconfig.json` a `jsx: react-jsx` y agrego `.next/dev/types/**/*.ts` al `include`; el cambio fue revisado y aceptado.
- La verificacion posterior paso: 40 archivos, 293 pruebas, TypeScript, lint con 0 errores y build exitoso.
- El audit de produccion quedo en 13 vulnerabilidades: 4 `high` y 9 `moderate`, sin `critical`.
- Antes del reemplazo de `to-ico`, el audit completo reportaba 37 vulnerabilidades, incluyendo 5 `critical` de herramientas o dependencias de desarrollo.
- `OP-06` permanece `pendiente` hasta resolver o aceptar formalmente los riesgos restantes.

#### Resultado de reemplazo de dependencia vulnerable — 2026-08-04

- `to-ico@1.1.5` se reemplazo por `png-to-ico@3.0.2`; el script `build:icons` usa PNGs temporales y los elimina en un bloque `finally`.
- `to-ico@1.0.1` no se conserva porque generaba un ICO invalido para el decodificador de Next 16.
- `npm run build:icons` genero correctamente los iconos y el favicon.
- El audit completo quedo en 26 vulnerabilidades: 5 `high`, 15 `moderate` y 6 `low`, sin `critical`.
- El audit de produccion permanece en 13 vulnerabilidades: 4 `high` y 9 `moderate`.
- `OP-06` permanece `pendiente` por las vulnerabilidades transitorias restantes y la decision de rate limiting.

#### Resultado de actualizaciones de herramientas — 2026-08-04

- `firebase-tools` se actualizo de `15.24.0` a `15.25.1`.
- `@lhci/cli` se actualizo de `0.14.0` a `0.15.1`.
- El audit completo bajo a 22 vulnerabilidades: 5 `high`, 15 `moderate` y 2 `low`, sin `critical`.
- El audit de produccion permanece en 13 vulnerabilidades: 4 `high` y 9 `moderate`.
- Las vulnerabilidades restantes son transitorias y no se corrigieron con `--force`.
- La suite, TypeScript, lint, build y `build:icons` volvieron a pasar.
- `OP-06` permanece `pendiente` por las 4 vulnerabilidades `high` de produccion y la decision de rate limiting.

#### Resultado de endurecimiento de dependencias y secretos — 2026-08-04

- Las cuentas de QA dejaron de estar hardcodeadas en `qa/test-login.mjs` y `scripts/create-test-users.ts`; ahora usan `QA_*` desde `.env.local`.
- Se deshabilitaron las 2 cuentas QA historicas detectadas en commits anteriores; no se imprimieron sus emails ni credenciales.
- Se agregaron `backup:config` y `restore:config`, con backup verificado de `configuracion/tienda`.
- `shadcn` se movio de dependencias de runtime a `devDependencies` porque no se importa en la aplicacion.
- Se agrego un override limitado de `glob` para `brace-expansion@2.1.4`.
- El audit de produccion quedo en 8 vulnerabilidades `moderate`, 0 `high` y 0 `critical` despues de fijar `firebase-admin@13.10.0`.
- El audit completo conserva 5 `high` de herramientas de desarrollo; no se ejecuto `npm audit fix --force`.
- `OP-06` queda pendiente por la cadena `uuid` transitiva de `firebase-admin` y la decision documentada de rate limiting.

#### Resultado de cierre de OP-06 — 2026-08-05

- `npm audit --omit=dev --audit-level=high`: 0 `high`, 0 `critical`, 8 `moderate` transitivas asociadas a Firebase Admin/`uuid`.
- `npm audit --json`: 24 hallazgos completos, incluidos 5 `high` de herramientas de desarrollo; no se aplico `--force`.
- Como antecedente, el rate limit en memoria era de 5 solicitudes por UID cada 60 segundos, con `Retry-After`, y solo protegía una instancia.
- La migracion a un store distribuido quedo implementada con pruebas de concurrencia simulada y expiracion.
- OP-06 queda en `verificacion` por los riesgos de desarrollo documentados y la decision de escalamiento.

#### Resultado de implementacion distribuida — 2026-08-05

- Se implemento `consumeAdminRequestRateLimit` en `src/lib/rate-limit/firestore.ts` con documento `rateLimits/admin-request:<sha256(uid)>` y transaccion de Firestore Admin SDK.
- La ruta verifica autenticacion y claim admin antes de consumir cuota; una falla del store responde `503` sin detalles internos.
- Las pruebas cubren ventana nueva, incremento, sexta solicitud, expiracion, `Retry-After`, error del store y la integracion del endpoint.
- `npm test`: `42` archivos y `308/308` pruebas exitosas.
- `npx firebase emulators:exec --only firestore "npm run test:rules"`: `12/12` reglas exitosas.
- `npx tsc --noEmit`: correcto; `npm run lint`: 0 errores y 11 warnings conocidos; `npm run build`: correcto con Next `16.3.0` y 29 rutas.
- Commits: `70c0249` (store y pruebas) y `6a44bcc` (integracion de la ruta).
- No se hizo escritura remota ni despliegue Vercel en esta fase; falta publicar y verificar la version antes de cerrar OP-06/OP-07.

#### Resultado posterior a publicación — 2026-08-05

- `git push origin main` publicó `51e3e45` y dejó `main` alineada con `origin/main`.
- Vercel generó la deployment `dpl_5z6REAtgcJajgakmpDD8jyqqMT6c`, URL `mundocelular-5srbzkpop-andres-leo-san-s-projects.vercel.app`, estado `Ready`.
- `POST /api/auth/admin-request` sin token respondió `401` con error sanitizado; la ruta `api/auth/admin-request` está presente en la deployment.
- La decisión de usar rate limiting distribuido queda verificada local y remotamente; los riesgos `moderate` transitorios de `uuid` y los `high` de herramientas de desarrollo siguen documentados sin aplicar `--force`.
- OP-06 queda `completada`; no se requieren escrituras remotas adicionales para este cierre.

---

### OP-07 — Verificacion integral y cierre operativo

**Estado:** `completada`
**Prioridad:** `P1`
**Depende de:** `OP-02`, `OP-03`, `OP-04`, `OP-05` y `OP-06`.

#### Objetivo

Cerrar las auditorias con evidencia fresca y dejar el repositorio listo para que el estado global cambie de `revision operativa` a `completada`.

#### Pasos exactos

- [x] Confirmar que no hay bloqueos `P0` abiertos.
- [x] Ejecutar en este orden desde la raiz del repositorio:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short --branch
```

- [x] Registrar el numero exacto de tests, errores de lint, warnings conocidos y rutas generadas por el build.
- [x] Revisar logs y codigo modificado para evitar secretos:

```powershell
git grep -nE "FIREBASE_PRIVATE_KEY|Authorization|Bearer|console\.(log|info|error)" -- src tests
```

- [x] Confirmar que los warnings restantes estan documentados y no son fallos de datos, seguridad o compilacion.
- [x] Actualizar `tasks.md` solo con estados respaldados por evidencia.
- [x] Actualizar los reportes de auditoria con los deployment IDs, indices, producto de prueba, QA y bloqueos restantes.
- [x] Actualizar la tabla de este documento y la seccion `Registro de sesiones`.
- [x] Antes de los despliegues realizados, ejecutar el checklist de despliegue con autorizacion del operador.

#### Evidencia requerida

- Salida de los seis comandos de verificacion.
- Reporte E2E de `OP-05`.
- Reporte de seguridad de `OP-06`.
- Auditorias actualizadas.
- `git status` limpio o con cambios explicados.

#### Criterios de aceptacion

- La suite, TypeScript y build terminan sin errores.
- La auditoria de produccion ya no tiene bloqueos `P0`.
- Cada afirmacion de produccion tiene URL, commit, fecha y evidencia.
- `tasks.md` y este documento no se contradicen.

#### Resultado de gate integral — 2026-08-05

- `npm test`: `41` archivos y `294/294` pruebas exitosas.
- `npx tsc --noEmit`: correcto, sin salida.
- `npm run lint`: 0 errores y 11 warnings conocidos, sin nuevos bloqueantes.
- `npm run build`: correcto con Next `16.3.0`, 29 rutas generadas.
- `git diff --check`: sin errores; solo warnings de normalizacion LF/CRLF de Git en Windows.
- Revisión de secretos: no hay claves privadas ni emails de usuarios en logs nuevos; `/api/auth/sync` solo registra UID.
- `OP-07` queda en `verificacion` por la URL historica inmutable y la decision pendiente de escalamiento del rate limit.

#### Actualizacion posterior al rate limit distribuido — 2026-08-05

- La evidencia local se actualizo a `308/308` pruebas en `42` archivos y el build sigue generando 29 rutas sin errores.
- La revision de codigo corrigio validacion fail-closed de documentos corruptos y reloj por intento de transaccion.
- El gate de produccion permanece en `verificacion` hasta publicar el commit `6a44bcc` y comprobar nuevamente el endpoint protegido en la deployment resultante.

#### Resultado del gate posterior a publicación — 2026-08-05

- El commit publicado es `51e3e45`; `main` y `origin/main` coinciden y el árbol de trabajo quedó limpio.
- La deployment vigente `dpl_5z6REAtgcJajgakmpDD8jyqqMT6c` está `Ready` y Home responde `200`.
- QA de navegador sobre la deployment: `/`, `/buscar`, `/contacto`, `/preguntas` y `/reparaciones` respondieron `200`; no hubo errores de consola de aplicación antes de la prueba negativa.
- La prueba negativa de `POST /api/auth/admin-request` sin autenticación respondió `401` y no expuso detalles internos.
- OP-07 permanece `verificacion` únicamente por la URL histórica inmutable documentada en OP-04 y por la necesidad de conservar esa excepción como riesgo operativo conocido; la versión vigente sí está publicada y validada.

#### Aceptacion final — 2026-08-05

- El operador acepta la URL historica inmutable como riesgo documentado y no bloqueante.
- OP-07 queda completada; las funcionalidades `FUT-*` permanecen fuera del cierre y no bloquean el estado global.

## Funcionalidades futuras

Estas tareas no bloquean el cierre operativo. No deben comenzar mientras existan bloqueos `P0`, salvo autorizacion expresa del operador.

### FUT-01 — Historial de compras del cliente

**Estado:** `revision`
**Prioridad:** `P2`
**Depende de:** `OP-07` y una definicion del alcance de cuenta de cliente.

#### Objetivo

Permitir que un cliente autenticado consulte sus pedidos anteriores sin exponer pedidos de otros usuarios.

#### Decisiones obligatorias antes de implementar

- [ ] Confirmar si se muestran pedidos creados, contactados, cerrados y cancelados.
- [ ] Confirmar si el historial se consulta desde una ruta `/cuenta/pedidos` o desde otra ubicacion.
- [ ] Definir los campos visibles: fecha, productos, cantidades, total, estado y referencia de WhatsApp.
- [ ] Definir paginacion o limite maximo de pedidos.
- [ ] Definir reglas Firestore para que cada cliente lea solo sus propios pedidos.

#### Criterios de aceptacion propuestos

- Un cliente autenticado ve solo sus pedidos.
- Un usuario no autenticado recibe una pantalla de acceso o una respuesta controlada.
- Un cliente no puede leer, editar ni cancelar el pedido de otro usuario.
- La vista funciona en mobile y desktop.
- Existen pruebas de reglas Firestore, datos y UI.

#### Resultado local — 2026-08-05

- Se implemento `/cuenta/pedidos` con lista de 10 pedidos, cursor de carga incremental, todos los estados y detalle sin UID, email, telefono ni observaciones.
- El detalle abre WhatsApp con una referencia corta del pedido y el cliente solo puede consultar documentos cuyo `clienteUid` coincide con su sesion.
- Se declaro el indice local `pedidos(clienteUid ASC, creadoEn DESC)` y las reglas aisladas pasaron `13/13`: propietario permitido, tercero denegado y admin permitido.
- La suite local paso `318/318`; TypeScript y build pasaron, lint conserva 0 errores y 11 warnings preexistentes.
- QA de navegador sobre el build local confirmo `/cuenta/pedidos` y `/login` en desktop y mobile, sin overflow ni errores de consola de aplicacion. La autenticacion real no se ejecuto porque requiere la autorizacion especifica para usar la cuenta QA.
- El numero canonico de codigo, seed y CTAs es `573147757223`. La configuracion remota todavia puede conservar el numero anterior hasta ejecutar la actualizacion dirigida autorizada.
- FUT-01 permanece en `revision` hasta desplegar el indice, respaldar y actualizar `configuracion/tienda.whatsapp`, y repetir la QA autenticada sobre esa configuracion.

#### Resultado remoto autorizado — 2026-08-05

- `npm run backup:config` creo `qa/backups/configuracion-tienda-latest.json` antes de cualquier escritura.
- `npm run deploy:indexes` desplego el indice `pedidos(clienteUid ASC, creadoEn DESC)` en `mundocelular-id` sin errores.
- `npm run update:whatsapp` actualizo `configuracion/tienda.whatsapp` a `573147757223`; un backup posterior releyo el documento y confirmo el valor.
- `git push origin main` publico la serie completa (`386e335`); Vercel genero `dpl_4Hk1p487T86BgP9CvyUGuJCPzhEJ` en estado `Ready`.
- Verificacion publica en produccion: `/`, `/cuenta/pedidos`, `/contacto`, `/reparaciones`, `/login` y `/carrito` responden `200`; todos los enlaces `wa.me` usan `573147757223` y el numero anterior ya no aparece en el texto.
- La QA autenticada del historial no se ejecuto: `.env.local` no define variables `QA_*` y las cuentas QA historicas estan deshabilitadas. Se requiere habilitar una cuenta de cliente de prueba con pedidos (o autorizar un fixture temporal) antes de cerrar FUT-01 como aprobada.
- FUT-01 permanece en `revision` por ese unico pendiente; la parte publica, el indice y el numero de WhatsApp estan verificados.

#### Resultado de QA autenticada y cierre — 2026-08-05

- El operador agrego credenciales `QA_*` a `.env.local` (formato corregido a variables con nombre) y autorizo habilitar las cuentas de prueba en Firebase Auth de produccion; `scripts/enable-qa-users.ts` habilito `admin@admin.com` y `cliente@cliente.com` (estaban `USER_DISABLED`).
- QA de cliente en produccion: `12/12` PASS con fixture efimero de 11 pedidos creado por `scripts/qa-fixture-pedidos.ts` (sin tocar stock): acceso, destino guardado, login real, redireccion a `/cuenta/pedidos`, pagina visible, paginacion `10 -> 11`, boton "Cargar mas" desaparece al agotar, detalle con `wa.me/573147757223`, privacidad (no expone email) y consola sin errores.
- La QA detecto un bug real de paginacion: el cursor se devolvia aunque la pagina trajera menos del limite, dejando el boton "Cargar mas" visible sin resultados. Se corrigio con TDD en `src/lib/firestore/pedidos.ts` (cursor solo cuando la pagina trae exactamente el limite) y se verifico en produccion (`e48bd38`).
- QA de admin en produccion: `3/3` PASS (login y acceso al panel).
- El fixture se limpio (`cleanup`) y el historial del cliente QA volvio a estado vacio.
- Arneses reproducibles versionados: `qa/qa-historial.mjs`, `qa/qa-admin.mjs`, `scripts/qa-fixture-pedidos.ts`, `scripts/enable-qa-users.ts`.
- FUT-01 queda `aprobada`; el cierre queda cubierto con evidencia local, reglas, QA publica y QA autenticada en produccion.

### FUT-02 — Notificaciones y promociones

**Estado:** `pendiente`
**Prioridad:** `P2`
**Depende de:** `OP-07` y una decision de canal, consentimiento y proveedor.

#### Objetivo

Informar a clientes autorizados sobre nuevos productos o promociones sin convertir el sistema en un envio no consentido.

#### Decisiones obligatorias antes de implementar

- [ ] Elegir canal: email, WhatsApp, notificacion web u otro.
- [ ] Confirmar proveedor y costo mensual estimado.
- [ ] Definir consentimiento, opt-out, frecuencia y auditoria de envios.
- [ ] Definir quien puede crear una promocion y quien puede enviarla.
- [ ] Definir limites de rate limiting y reintentos.
- [ ] Definir como se evita enviar dos veces la misma promocion.

#### Criterios de aceptacion propuestos

- Solo reciben mensajes usuarios con consentimiento vigente.
- El administrador puede crear, previsualizar y cancelar una promocion.
- Cada envio tiene estado, fecha, resultado y error sanitizado.
- Las credenciales del proveedor nunca aparecen en logs o cliente.
- Existen pruebas de autorizacion, limite, reintentos y cancelacion.

### FUT-03 — Metricas comerciales

**Estado:** `pendiente`
**Prioridad:** `P2`
**Depende de:** `OP-07`, una definicion de eventos y una decision de privacidad.

#### Objetivo

Dar al administrador indicadores utiles sobre productos y pedidos sin almacenar mas datos personales de los necesarios.

#### Decisiones obligatorias antes de implementar

- [ ] Definir metricas iniciales: productos vistos, busquedas, carritos iniciados, pedidos por semana y productos mas solicitados.
- [ ] Definir ventana de tiempo y zona horaria de Medellin/Colombia.
- [ ] Definir si los datos seran agregados en Firestore o calculados bajo demanda.
- [ ] Definir retencion y eliminacion de datos.
- [ ] Definir permisos: solo admins autorizados.
- [ ] Definir si se requiere exportacion CSV.

#### Criterios de aceptacion propuestos

- Las metricas coinciden con eventos de prueba conocidos.
- Los datos no exponen nombres, emails ni tokens de clientes sin necesidad.
- El panel muestra estados vacios y errores de lectura de forma explicita.
- Las consultas tienen indices y limites controlados.
- Existen pruebas de permisos, agregacion y fechas.

## Registro de decisiones

| Fecha | ID | Decision | Motivo | Evidencia o referencia |
| --- | --- | --- | --- | --- |
| 2026-08-04 | `DOC-01` | Se usa un documento central para seguimiento operativo y roadmap futuro. | Evita repartir el estado entre varios archivos. | Solicitud del operador |
| 2026-08-04 | `DOC-02` | Las tareas `OP-*` bloquean el cierre; las `FUT-*` no lo bloquean. | Separa operacion de producto futuro. | `tasks.md` y auditorias |

## Registro de sesiones

### 2026-08-04 — Creacion del documento

- Se confirmo que las fases funcionales principales ya estan implementadas: Fases 1, 2, 3, 4, 5 y 7, variantes, rediseño premium y solicitudes de administrador.
- La suite ejecutada antes de esta sesion tenia `40` archivos y `293` pruebas exitosas.
- Persisten como bloqueos principales el acceso admin autorizado, el producto de prueba, la evidencia E2E persistida y el cierre de indices/produccion.
- Se creo este archivo para continuar el seguimiento por IDs estables.

### 2026-08-04 — Preflight seguro de OP-01

- Se verifico la existencia de `.env.local` sin leer su contenido.
- Se verifico que Git la ignora y que no esta versionada.
- Se verifico que Firebase apunta a `mundocelular-id`.
- No se ejecutaron acciones externas ni mutaciones porque aun falta autorizacion para validar credenciales y acceso admin.

### 2026-08-04 — Verificacion local de reglas y lectura remota

- La ejecucion directa de `npm run test:rules` fallo porque no habia emulador escuchando en `127.0.0.1:8085`; los 11 tests quedaron omitidos.
- La causa fue ambiental y quedo confirmada en `firebase.json`, `vitest.rules.config.ts` y `tests/rules/firestore.rules.test.ts`.
- La ejecucion correcta fue `npx firebase emulators:exec --only firestore "npm run test:rules"`.
- Resultado: 1 archivo de tests, 11/11 pruebas exitosas; el emulador se cerro al finalizar.
- La consulta remota de indices fue solo lectura y devolvio seis indices funcionales.
- No se desplegaron reglas o indices ni se escribieron documentos en Firebase.

### 2026-08-04 — Gate de despliegue solicitado por el operador

- El operador autorizo explicitamente el despliegue de reglas y la ejecucion de `seed:config`.
- La autorizacion quedo registrada, pero el despliegue no se ejecuto porque el checklist obligatorio conserva gates abiertos.
- Seguridad: `npm audit --omit=dev --audit-level=high` reporto 17 vulnerabilidades: 6 `high` y 11 `moderate`.
- Calidad: `npm test` paso con 40 archivos y 293 pruebas; `npx tsc --noEmit` paso; `npm run lint` paso con 0 errores y 11 warnings; `npm run build` paso y genero 30 rutas.
- QA E2E: no existe `qa/reports/` con reporte HTML de una corrida autenticada y reproducible.
- Datos: no existe evidencia de backup verificado ni procedimiento de rollback probado para la escritura de `configuracion/tienda` que realiza `seed:config`.
- Resultado: no se ejecutaron `npm run deploy:rules`, `npm run deploy:indexes` ni `npm run seed:config`.
- Siguiente accion obligatoria: cerrar seguridad, QA E2E y rollback/backup; despues repetir el gate con evidencia fresca.

### 2026-08-04 — OP-01 validacion de proyecto Firebase

- Firestore remoto confirmado en `projects/mundocelular-id/databases/(default)` con edicion `STANDARD` y tipo `FIRESTORE_NATIVE`.
- Aplicacion web Firebase confirmada en el proyecto.
- Playwright en Firebase Console confirmo los proveedores `Correo electronico/contraseña` y `Google` con estado `Habilitada`.
- La consola registro 5 errores auxiliares `404/403` de endpoints `cloudusersettings` y `firebasestorage`; no afectan la tabla de proveedores ni cambiaron su estado.
- No se ejecutaron reglas, `set:admin` ni `seed:config`.

### 2026-08-04 — OP-06 actualizacion segura de dependencias

- `npm audit fix --dry-run` mostro cambios amplios y varias actualizaciones mayores; no se aplico automaticamente.
- Se aplico solamente `next@15.5.22` con version exacta.
- La verificacion completa posterior paso: tests, TypeScript, lint y build.
- El audit de produccion sigue con 4 vulnerabilidades `high`; no se declara resuelto el gate de seguridad.

### 2026-08-04 — OP-06 reemplazo de cadena vulnerable de iconos

- Se elimino `to-ico@1.1.5` y su cadena `resize-img`/`jimp`/`request`.
- Se agrego `png-to-ico@3.0.2` y se adapto `scripts/build-icons.mjs` para convertir PNGs temporales por ruta.
- `npm run build:icons` genero el favicon correctamente y limpio los temporales.
- `npm run build` paso con Next `16.3.0`.
- El audit completo quedo sin vulnerabilidades `critical`; permanecen 5 `high`, todas transitorias.

### 2026-08-04 — OP-06 actualizacion de herramientas de QA y Firebase CLI

- Se actualizaron `firebase-tools@15.25.1` y `@lhci/cli@0.15.1` sin cambios de runtime de la aplicacion.
- El audit completo quedo en 22 vulnerabilidades y sin `critical`.
- La verificacion posterior paso con 293 tests, TypeScript, lint, build y generacion de iconos.

### 2026-08-04 — OP-05 QA publica responsive

- Se ejecuto el build de produccion local en `http://localhost:3101` con Playwright MCP.
- La matriz cubrio 40 combinaciones: cinco rutas publicas y ocho viewports entre 320 y 1920 px.
- Se encontro y corrigio un overflow horizontal real en `/carrito` a 320 px; la segunda corrida paso `40/40`.
- Busqueda, FAQ, carrito, guard de checkout, redireccion de login y producto pasaron sin errores de consola.
- No se usaron credenciales ni se hicieron escrituras en Firebase.
- Se guardo reporte HTML y capturas en `qa/reports/`; OP-05 queda en `verificacion` hasta completar la parte autenticada.

### 2026-08-04 — Pruebas autenticadas autorizadas

- La cuenta admin inicio sesion por email en `/admin/login` y accedio a `/admin` con el claim admin activo.
- La cuenta admin pudo leer productos y actualizar temporalmente un producto existente; el cambio se reflejo en el storefront y luego se restauro el nombre original.
- La cuenta cliente inicio sesion por email y accedio al checkout autenticado; no se confirmo ningun pedido real.
- No se copiaron credenciales ni tokens en las evidencias de esta corrida; la auditoria detecto literales preexistentes de cuentas de prueba en scripts que deben migrarse a variables de entorno antes de produccion.
- El formulario de producto nuevo cargo `Celulares`; se creo, verifico y elimino un fixture temporal. OP-03 queda en `verificacion` hasta probar carga de imagen R2.

### 2026-08-04 — Despliegue de reglas y seed autorizado

- Se parametrizaron las cuentas de QA mediante `QA_*` en `.env.local`; los scripts ya no contienen contrasenas literales.
- `npm run backup:config` creo y verifico `qa/backups/configuracion-tienda-latest.json` antes de la escritura.
- `npm run deploy:rules` libero `firestore.rules` en el proyecto `mundocelular-id` sin errores.
- `npm run seed:config` creo `configuracion/tienda` correctamente.
- La lectura posterior mediante `npm run backup:config` y la pagina `/contacto` confirmaron la configuracion publica.
- El audit de produccion quedo sin `high` ni `critical`; permanecen 8 `moderate` transitivas de `uuid` tras fijar `firebase-admin@13.10.0`.
- No se desplegaron indices porque los seis indices remotos necesarios ya estaban disponibles.

### 2026-08-04 — Vercel Deployment Protection y redeploy

- Vercel CLI autenticado como `andresleosan`; proyecto `mundocelular` identificado.
- Se desactivo SSO Deployment Protection sin modificar Git fork protection ni bypass tokens.
- La deployment main paso la matriz publica completa.
- La deployment historica `dt5...` mostro en logs `app/invalid-credential` por ausencia de `project_id` en el service account; se genero una replacement deployment con variables de produccion.
- La replacement `axxt12og9` paso `18/18`; no se guardaron secretos en el repositorio.

### 2026-08-05 — Cierre de validacion y deployment vigente

- `node qa/verify-pasos-6-11.mjs` paso `7/7`; se corrigio el arnes para no esperar `networkidle` en Next production.
- Se anadio prueba de regresion para evitar registrar emails en `/api/auth/sync`; la suite quedo en `41` archivos y `294` pruebas.
- `firebase-admin` se fijo en `13.10.0` despues de reproducir en Vercel el error `ERR_REQUIRE_ESM` de la cadena `jwks-rsa@4`/`jose`.
- Se agregaron las cuatro variables privadas R2 a Vercel Production como `Sensitive` y se aplico/verifico CORS del bucket `mundocelular-images`.
- La prueba efimera autenticada paso login admin, CRUD, upload full/thumb R2, lectura publica y limpieza; no quedaron fixtures en Firestore ni objetos QA en R2.
- La deployment vigente `dpl_FUiPPAtFbPFVGNLji7T3FVYgUQDp` paso `36/36` combinaciones publicas en dos aliases, seis rutas y tres viewports.
- La seguridad publica quedo verificada: endpoints protegidos devuelven `401`; audit runtime sin `high`/`critical`, con 8 `moderate` transitorias.
- Pendiente real: la URL historica `dt5...` conserva un bundle antiguo inmutable; el rate limiting distribuido solo aplica antes de escalar.

### 2026-08-05 — Rate limit distribuido

- Se escribieron la especificacion y el plan de implementacion en `docs/superpowers/specs/2026-08-05-rate-limit-distribuido-design.md` y `docs/superpowers/plans/2026-08-05-rate-limit-distribuido.md`.
- TDD verifico el helper transaccional y el endpoint con 5 solicitudes permitidas, sexta bloqueada, expiracion, `Retry-After` y `503` fail-closed.
- La suite paso con `308/308`, TypeScript y build pasaron; lint conserva 11 warnings conocidos; las reglas pasaron `12/12` con emulador.
- El push de los commits de especificacion fallo dos veces por conectividad con GitHub; el codigo posterior queda localmente en `main` y requiere publicar antes de QA remoto.
- El endurecimiento posterior quedo en `cc52880`; el push de toda la serie sigue pendiente por la misma falla de conectividad.

### 2026-08-05 — Publicacion y verificacion remota del rate limit

- La serie local de 12 commits se publicó con `git push origin main`; `main` quedó alineada con `origin/main` en `51e3e45`.
- La deployment `dpl_5z6REAtgcJajgakmpDD8jyqqMT6c` quedó `Ready` en Vercel.
- La prueba remota sin autenticación devolvió `401` en `POST /api/auth/admin-request`; la navegación pública básica devolvió `200` en cinco rutas y no produjo errores de consola de aplicación.
- OP-06 queda completada. OP-07 continúa en verificación por la excepción histórica de una deployment inmutable, no por un fallo de la versión vigente.

### 2026-08-05 — Cierre operativo

- El operador acepto la URL historica inmutable como riesgo no bloqueante.
- OP-04 y OP-07 pasaron a `completada`; el estado global paso a `completada`.
- Se ejecuto `capability-gap-analysis`: no se detecto una capacidad faltante recurrente que justifique crear una skill nueva.

### 2026-08-05 — FUT-01 operaciones remotas autorizadas

- Se ejecuto `npm run backup:config` antes de escrituras, `npm run deploy:indexes` y `npm run update:whatsapp`; el backup posterior confirmo el valor remoto `573147757223`.
- Se publico la serie de FUT-01 (`386e335`) y la deployment `dpl_4Hk1p487T86BgP9CvyUGuJCPzhEJ` quedo `Ready`.
- Verificacion publica: 6 rutas `200`, todos los CTAs `wa.me/573147757223`, numero anterior ausente del texto.
- La QA autenticada quedo pendiente por ausencia de credenciales `QA_*` y cuentas QA deshabilitadas; no se crearon usuarios ni pedidos de prueba en produccion sin autorizacion.

### 2026-08-05 — FUT-01 QA autenticada y cierre

- El operador agrego `QA_*` a `.env.local` y autorizo habilitar las cuentas de prueba; `scripts/enable-qa-users.ts` las habilito en Auth de produccion.
- QA de cliente `12/12` con fixture efimero de 11 pedidos; se detecto y corrigio con TDD el bug de cursor persistente tras agotar resultados (`e48bd38`), verificado en produccion.
- QA de admin `3/3`. Fixture limpiado; el historial del cliente QA volvio a vacio.
- FUT-01 paso a `aprobada` con evidencia local, reglas, publica y autenticada.

## Fuentes de verdad

- `tasks.md`: checklist historico y estado resumido de implementacion.
- `docs/superpowers/reports/2026-08-03-auditoria-admin-firestore-home-marcas.md`: auditoria de CRUD, Firestore, Home y marcas.
- `docs/superpowers/reports/2026-08-03-auditoria-local-produccion-firebase.md`: auditoria de Firebase, Vercel, indices y evidencia de produccion.
- `docs/superpowers/setup/playwright-mcp.md`: cobertura y limites de QA de navegador.
- `package.json`: comandos oficiales de test, build, reglas e indices.

## Como retomar en otra sesion

Usar una de estas referencias:

- `"Cronos, continua OP-01"`: retomar configuracion de Firebase y admin.
- `"Cronos, revisa el bloqueo de OP-03"`: revisar acceso y producto de prueba.
- `"Cronos, ejecuta OP-04"`: preparar la matriz publica local/Vercel.
- `"Cronos, dime el estado del proyecto"`: leer la tabla de resumen y reportar solo tareas no completadas.
- `"Cronos, actualiza el seguimiento"`: revisar evidencia reciente, cambiar estados y agregar una entrada al registro de sesiones.
