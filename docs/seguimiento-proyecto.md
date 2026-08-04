# Seguimiento del proyecto Mundo Celular

**Ultima actualizacion:** 2026-08-04
**Responsable de seguimiento:** Cronos
**Rama de referencia:** `main`
**Repositorio:** `https://github.com/andresleosan/MundoCelular`
**Estado global:** `revision operativa`

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
| `OP-01` | Firebase, entorno y primer administrador | `pendiente` | `P0` | Acceso autorizado al proyecto Firebase |
| `OP-02` | Reglas e indices remotos | `pendiente` | `P0` | `OP-01` |
| `OP-03` | CRUD admin y producto de prueba | `bloqueada` | `P0` | `OP-01` |
| `OP-04` | Validacion publica local y Vercel | `bloqueada` | `P0` | `OP-02`, `OP-03` |
| `OP-05` | Evidencia E2E reproducible | `pendiente` | `P1` | `OP-03`, `OP-04` |
| `OP-06` | Dependencias, vulnerabilidades y rate limiting | `pendiente` | `P1` | Decision tecnica y pruebas |
| `OP-07` | Verificacion final y cierre operativo | `pendiente` | `P1` | `OP-02` a `OP-06` |
| `FUT-01` | Historial de compras del cliente | `pendiente` | `P2` | Cierre operativo |
| `FUT-02` | Notificaciones y promociones | `pendiente` | `P2` | Decision de canales y proveedor |
| `FUT-03` | Metricas comerciales | `pendiente` | `P2` | Definicion de eventos y privacidad |

## Fase operativa de cierre

### OP-01 — Configurar Firebase, entorno y primer administrador

**Estado:** `pendiente`
**Prioridad:** `P0`
**Fuente:** `tasks.md`, seccion `Pendiente para usar el panel`
**Depende de:** acceso autorizado al proyecto `mundocelular-id` y a la consola Firebase.

#### Objetivo

Dejar una instalacion funcional de Firebase para que el panel admin pueda autenticarse, leer y escribir datos sin exponer secretos.

#### Pasos exactos

- [ ] Confirmar que el proyecto Firebase de trabajo es `mundocelular-id`.
- [ ] Confirmar que Google esta habilitado como proveedor en Firebase Authentication.
- [ ] Confirmar que Firestore esta creado en el proyecto correcto.
- [ ] Crear o completar `.env.local` usando `.env.local.example` como referencia.
- [ ] Configurar las variables publicas `NEXT_PUBLIC_FIREBASE_*` necesarias para el navegador.
- [ ] Configurar las variables privadas `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` solo en el entorno del servidor.
- [ ] Verificar que `.env.local` no aparezca en `git status` ni en `git ls-files`.
- [ ] Desplegar las reglas con el script existente:

```powershell
npm run deploy:rules
```

- [ ] Abrir `/admin/login`, iniciar sesion con Google y obtener el UID desde el perfil autenticado sin guardar tokens.
- [ ] Asignar el claim admin usando el UID real:

```powershell
npm run set:admin -- <uid>
```

- [ ] Cerrar y volver a abrir la sesion para que Firebase emita un token con el claim actualizado.
- [ ] Sembrar la configuracion de la tienda:

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

#### Bloqueo actual

La documentacion indica que no existe una cuenta admin de pruebas autorizada para ejecutar escrituras reales. Esta tarea debe permanecer `bloqueada` si el operador no entrega acceso autorizado.

#### Preflight seguro — 2026-08-04

- `.env.local` existe en el workspace.
- `.env.local` esta ignorado por Git mediante `.gitignore:5` y no esta versionado.
- `npx firebase use` selecciona `mundocelular-id`.
- No se leyeron valores del archivo de entorno.
- No se ejecutaron despliegues, escrituras Firestore, login ni `seed:config`.
- La tarea permanece `pendiente` hasta validar las acciones autenticadas con autorizacion explicita.

---

### OP-02 — Confirmar y desplegar reglas e indices remotos

**Estado:** `pendiente`
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

---

### OP-03 — Ejecutar CRUD admin autenticado y crear producto de prueba

**Estado:** `bloqueada`
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

- [ ] Entrar a `/admin/productos` con la cuenta admin autorizada.
- [ ] Crear el producto usando los campos de la tabla anterior.
- [ ] Confirmar en la tabla admin que el producto aparece una sola vez.
- [ ] Abrir la edicion y confirmar que los valores persisten despues de recargar.
- [ ] Confirmar que se guardan los campos canonicos `activo` y `destacado`, no campos alternos como `active` o `featured`.
- [ ] Confirmar que la imagen se sube a R2 y se puede leer desde el storefront.
- [ ] Revisar en Firestore el documento creado sin copiar el documento completo a este repositorio.
- [ ] No borrar ni desactivar el producto hasta completar `OP-04`, porque es el fixture necesario para la validacion publica.

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

#### Bloqueo actual

Las auditorias indican que no se creo el producto de prueba porque aun no existe una cuenta admin autorizada para hacer escrituras.

---

### OP-04 — Validar catalogo publico local y Vercel

**Estado:** `bloqueada`
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

- [ ] Registrar el commit desplegado en cada dominio.
- [ ] Consultar cada ruta y registrar el status HTTP.
- [ ] Guardar la respuesta JSON de las rutas `/api/buscar` sin datos de clientes.
- [ ] Confirmar presencia del nombre del producto en el snapshot o HTML.
- [ ] Capturar errores de consola y errores de red del navegador.
- [ ] Repetir cada superficie en `1440x900`, `1024x768` y `390x844`.
- [ ] Ejecutar en cada viewport:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

- [ ] Confirmar que no aparece una marca sin productos activos como enlace funcional.
- [ ] Confirmar que no se muestra una lista de marcas con contador cero como si fuera inventario real.

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

---

### OP-05 — Generar evidencia E2E reproducible

**Estado:** `pendiente`
**Prioridad:** `P1`
**Fuente:** reportes de auditoria del 2026-08-03
**Depende de:** `OP-03` y `OP-04`.

#### Objetivo

Convertir la QA manual y autenticada en evidencia persistida dentro de `qa/reports/`, con fecha, commit, viewport, resultados y capturas.

#### Pasos exactos

- [ ] Confirmar que el servidor local esta ejecutando el commit bajo prueba.
- [ ] Levantar la aplicacion con el comando apropiado para la corrida:

```powershell
npm run dev
```

- [ ] Ejecutar el script existente y revisar que escriba en `qa/reports/`:

```powershell
node qa/verify-pasos-6-11.mjs
```

- [ ] Si el script apunta a una ruta externa, corregirlo antes de la corrida para usar `qa/reports/` dentro del repositorio. No aceptar evidencias guardadas fuera del workspace.
- [ ] Ejecutar ademas la prueba autenticada del panel con Playwright MCP usando la cuenta de pruebas autorizada.
- [ ] Cubrir login, listado de productos, crear producto, editar producto, carga de imagen, guardar y lectura publica.
- [ ] Guardar capturas con nombres que incluyan paso y viewport, por ejemplo `op03-admin-producto-1440x900.png`.
- [ ] Guardar un resumen en Markdown o JSON con fecha, commit, URL, viewport, resultado y errores.
- [ ] Revisar que `qa/reports/` no contenga tokens, cookies, headers `Authorization` ni datos personales innecesarios.

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

#### Bloqueo conocido

Los reportes actuales indican que `qa/reports/` no existe como evidencia persistida de la auditoria y que las capturas existentes son sueltas, sin manifest ni matriz completa.

---

### OP-06 — Resolver vulnerabilidades y decidir el rate limiting

**Estado:** `pendiente`
**Prioridad:** `P1`
**Fuente:** `tasks.md`, secciones de auditoria y solicitudes de administrador
**Depende de:** no bloquea la prueba funcional, pero debe cerrarse antes de una declaracion de produccion completamente revisada.

#### Objetivo

Reducir riesgos conocidos sin ejecutar actualizaciones destructivas o cambios de version sin pruebas.

#### Pasos exactos

- [ ] Obtener un inventario fresco de vulnerabilidades:

```powershell
npm audit --omit=dev --audit-level=high
npm audit --json > qa/reports/npm-audit.json
```

- [ ] Registrar la cantidad por severidad, paquete afectado, dependencia directa o transitoria y version corregida disponible.
- [ ] No ejecutar `npm audit fix --force` sin una decision explicita y una rama de trabajo separada.
- [ ] Para cada actualizacion propuesta, revisar cambios mayores de Next.js, Firebase, `sharp`, `undici`, `fast-uri`, PostCSS y demas paquetes afectados.
- [ ] Actualizar dependencias en una rama separada, ejecutar instalacion limpia y comparar `package-lock.json`.
- [ ] Ejecutar despues de cada grupo de actualizaciones:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

- [ ] Revisar el rate limit actual de `POST /api/auth/admin-request`: limite fijo de 5 intentos por UID cada 60 segundos en memoria.
- [ ] Decidir una de estas opciones y documentarla:
  - mantenerlo como proteccion minima para una sola instancia;
  - moverlo a un store distribuido antes de escalar a varias instancias;
  - sustituirlo por un mecanismo administrado con limite y alerta.
- [ ] Si se cambia el mecanismo, agregar pruebas de limite, expiracion, concurrencia y comportamiento despues de reinicio.

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

---

### OP-07 — Verificacion integral y cierre operativo

**Estado:** `pendiente`
**Prioridad:** `P1`
**Depende de:** `OP-02`, `OP-03`, `OP-04`, `OP-05` y `OP-06`.

#### Objetivo

Cerrar las auditorias con evidencia fresca y dejar el repositorio listo para que el estado global cambie de `revision operativa` a `completada`.

#### Pasos exactos

- [ ] Confirmar que no hay bloqueos `P0` abiertos.
- [ ] Ejecutar en este orden desde la raiz del repositorio:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short --branch
```

- [ ] Registrar el numero exacto de tests, errores de lint, warnings conocidos y rutas generadas por el build.
- [ ] Revisar logs y codigo modificado para evitar secretos:

```powershell
rg "FIREBASE_PRIVATE_KEY|Authorization|Bearer|console\.(log|info|error)" src tests
```

- [ ] Confirmar que los warnings restantes estan documentados y no son fallos de datos, seguridad o compilacion.
- [ ] Actualizar `tasks.md` solo con estados respaldados por evidencia.
- [ ] Actualizar los reportes de auditoria con los deployment IDs, indices, producto de prueba, QA y bloqueos restantes.
- [ ] Actualizar la tabla de este documento y la seccion `Registro de sesiones`.
- [ ] Antes de cualquier despliegue adicional, ejecutar el checklist de despliegue y obtener autorizacion explicita del operador.

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

## Funcionalidades futuras

Estas tareas no bloquean el cierre operativo. No deben comenzar mientras existan bloqueos `P0`, salvo autorizacion expresa del operador.

### FUT-01 — Historial de compras del cliente

**Estado:** `pendiente`
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
