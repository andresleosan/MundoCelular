# Historial de pedidos del cliente

**Estado:** aprobado por el operador para especificacion
**Fecha:** 2026-08-05
**Alcance:** FUT-01 y actualizacion del numero activo de WhatsApp

## Objetivo

Permitir que cada cliente autenticado consulte sus propios pedidos desde `/cuenta/pedidos`, incluidos todos los estados, sin exponer datos de otros clientes. Corregir el numero de contacto activo de Mundo Celular a `573147757223` en todas las rutas y CTAs operativas.

## Alcance funcional

- El menu de usuario tendra el enlace "Mis pedidos" hacia `/cuenta/pedidos`.
- Un cliente autenticado vera primero los 10 pedidos mas recientes, ordenados por `creadoEn` descendente.
- "Cargar mas" recuperara el siguiente bloque de 10 pedidos usando el ultimo documento de la pagina anterior como cursor.
- Cada tarjeta mostrara fecha, resumen de productos, total COP y estado: pendiente, contactado, cerrado o cancelado.
- Al seleccionar una tarjeta se abrira el detalle en la misma ruta mediante un panel o vista de detalle accesible, sin una segunda URL publica de pedido.
- El detalle mostrara productos, cantidades, atributos de variantes, precio por item, total y entrega. No mostrara UID, email ni telefono del cliente.
- El detalle tendra un enlace a WhatsApp con el texto `Hola Mundo Celular, necesito ayuda con el pedido #<id-corto>`.
- Un visitante no autenticado vera una pantalla de acceso y, despues de iniciar sesion, regresara a `/cuenta/pedidos`.
- No se permitira editar, cancelar ni crear pedidos desde el historial.

## Datos y autorizacion

- Se reutiliza la coleccion `pedidos`; no hay coleccion duplicada ni migracion de documentos.
- La consulta cliente usa `where("clienteUid", "==", usuario.uid)`, `orderBy("creadoEn", "desc")`, `limit(10)` y `startAfter` para paginas posteriores.
- Las reglas actuales de `pedidos` ya autorizan lectura solo al propietario o a un admin. Se agregaran pruebas que demuestren que un cliente no puede consultar ni leer un pedido de otro UID.
- Se declara el indice compuesto `pedidos(clienteUid ASC, creadoEn DESC)` en `firestore.indexes.json`.
- Desplegar el indice en Firebase es una operacion remota y requiere confirmacion explicita del operador.

## Interfaz y estados

- La pagina conserva el lenguaje visual navy existente y funciona en mobile y desktop.
- Durante la resolucion de sesion muestra estado de carga, evitando una lectura antes de conocer el UID.
- Sin pedidos muestra un estado vacio con CTA al catalogo.
- Si la lectura falla, muestra un error controlado con accion para reintentar, sin revelar errores Firestore.
- Si no hay mas resultados, desaparece el boton "Cargar mas".
- El menu de usuario cierra al navegar a "Mis pedidos".

## WhatsApp activo

- El formato canonico interno sera `573147757223` sin signo `+`, compatible con `wa.me`; la presentacion humana conservara el formato `+57 314 775 7223`.
- Se extraera un unico default publico de configuracion para evitar los fallbacks duplicados actuales en componentes, paginas y rutas API.
- Se actualizaran los defaults, `scripts/seed-config.ts`, fixtures y expectativas de pruebas que representan configuracion operativa.
- Planes, especificaciones, reportes y otros documentos historicos conservan el numero usado en su evidencia original.
- La actualizacion del documento remoto `configuracion/tienda` se hara de forma dirigida, despues de backup y con confirmacion explicita del operador; no se hara durante desarrollo local.

## Alternativas descartadas

1. API server-side nueva para listar pedidos: duplica la autorizacion de Firebase Admin y agrega superficie de ataque sin necesidad, porque las reglas actuales ya limitan la lectura al propietario.
2. Coleccion duplicada por cliente: agrega sincronizacion y riesgo de inconsistencia sin beneficio proporcional al volumen actual.

## Pruebas y aceptacion

- Pruebas unitarias de consulta paginada: primer bloque, cursor, bloque siguiente y coleccion vacia.
- Pruebas de reglas Firestore: propietario permitido, otro cliente denegado, admin permitido.
- Pruebas de UI: carga, acceso no autenticado, estado vacio, lista, detalle, boton de cargar mas y enlace WhatsApp.
- Prueba de Header: enlace "Mis pedidos" visible solo con sesion activa.
- Pruebas de defaults/SEO/CTAs actualizadas al numero `573147757223`.
- Verificacion final: `npm test`, reglas con emulador, `npx tsc --noEmit`, `npm run lint`, `npm run build` y QA de navegador en desktop y mobile.

## Limites

- No incluye historial de pagos, facturas, notificaciones ni metricas.
- No altera el ciclo administrativo ni los estados de los pedidos.
- No despliega indice ni escribe configuracion en Firebase sin confirmacion explicita del operador.
