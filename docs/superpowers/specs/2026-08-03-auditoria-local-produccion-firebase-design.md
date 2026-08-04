# Auditoria Local-Produccion Firebase

**Estado:** Aprobada por el operador

**Fecha:** 2026-08-03

## Objetivo

Identificar y corregir la diferencia entre el inventario visible en localhost y el inventario ausente en Vercel, manteniendo una unica fuente de datos (`productos`) y verificando el flujo completo despues de un redeploy real.

## Evidencia inicial

- `https://mundocelular.vercel.app/` responde `200`, pero el HTML no contiene productos destacados ni nuevos.
- `https://mundocelular.vercel.app/categoria` responde `200` con el estado de error de categorias.
- `https://mundocelular.vercel.app/api/buscar?q=iPhone%2017%20Pro%20Max` responde `500` sin cuerpo.
- Los logs de Vercel muestran `/` y `/categoria` como `PRERENDER` o `HIT`, por lo que una excepcion de lectura puede quedar convertida en HTML vacio y cacheado.
- Los logs de Vercel muestran `POST /api/revalidate` con `500` por `firebase-admin/auth`, `jose` y `jwks-rsa` incompatibles con el modulo CommonJS generado.
- El codigo publico server-side usa `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` mediante `getAdminDb()`. Las variables `NEXT_PUBLIC_FIREBASE_*` no reemplazan esas credenciales.
- `.env.local` contiene las tres variables privadas y usa el proyecto `mundocelular-id`. La lista entregada para Vercel solo confirma variables publicas, por lo que la presencia y el alcance Production de las credenciales privadas deben verificarse sin imprimir valores.

Estas observaciones son evidencia de capas distintas. No se asumira que una sola falla explica todos los sintomas hasta comprobar cada frontera.

## Diagnostico aprobado

### Fuentes y limites

```text
ProductoForm
  -> Firebase Web SDK (cliente/admin)
  -> productos/{id}
  -> invalidacion de cache
  -> Firebase Admin SDK (servidor)
  -> mapper plano
  -> Home / categoria / busqueda / marca
```

- `productos` es la coleccion canonica.
- `NEXT_PUBLIC_FIREBASE_*` se usa en navegador para Auth y CRUD.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` se usan solo en servidor.
- Todas las lecturas publicas filtran `activo == true`.
- `destacado` solo separa secciones de Home.
- `stock` no oculta productos publicos.
- Las marcas se derivan de productos activos y no usan una lista de inventario hardcodeada.
- El mapper publico no expone timestamps ni objetos internos de Firestore a Client Components.

### Observabilidad

Las lecturas server-side tendran diagnostico seguro con:

- nombre estable de la consulta;
- coleccion y filtros exactos;
- cantidad de documentos;
- duracion;
- codigo y mensaje sanitizado del error;
- proyecto Firebase y presencia de credenciales, nunca sus valores.

No se registraran tokens, llaves privadas, documentos completos ni datos de clientes.

Los errores se distinguiran como:

- `permission-denied`: reglas o identidad;
- `failed-precondition`: indice faltante;
- `unauthenticated` o `invalid-credential`: configuracion Admin;
- respuesta vacia: datos o filtros.

### Consultas e indices

Se compararan todas las consultas contra `firestore.indexes.json` y contra los indices realmente desplegados:

- productos activos;
- productos activos ordenados por nombre;
- productos por categoria, activo y nombre;
- productos activos destacados ordenados por nombre;
- variantes por producto, activo y precio.

Una entrada declarada en el archivo local no se considerara desplegada hasta validarla en Firestore.

### Cache y revalidacion

- La persistencia debe terminar antes de intentar invalidar cache.
- El cliente de revalidacion debe comprobar el status HTTP de `/api/revalidate` y registrar fallos.
- El error ESM de `firebase-admin/auth` se reproducira en la ruta y en el build antes de escoger una correccion.
- Se aplicara una sola correccion compatible con el runtime de Vercel, sin ocultar el error mediante un `try/catch` global.
- ISR se conservara solo si la invalidacion queda verificada. Si no, se evaluara render dinamico solo para las lecturas afectadas y se documentara el impacto.

## Alcance

### Incluido

- Auditoria de configuracion local, Vercel y Firebase Admin.
- Instrumentacion segura de lecturas publicas y revalidacion.
- Correccion del contrato de entorno server-side.
- Correccion de consultas e indices requeridos.
- Correccion del runtime de autenticacion de revalidacion.
- Derivacion de marcas desde inventario activo.
- Tests de regresion para Home, catalogo, busqueda, marca, cache y errores.
- Validacion local, build, TypeScript, lint y navegador.
- Evidencia post-redeploy en los dominios de Vercel entregados.

### Fuera de alcance

- Migrar lecturas publicas al SDK cliente.
- Crear una coleccion separada de marcas.
- Imprimir o copiar secretos de Vercel/Firebase.
- Escribir datos de produccion sin autorizacion explicita.
- Declarar Vercel resuelto sin redeploy y evidencia posterior.

## Criterios de aceptacion

Producto de prueba:

```text
Nombre: iPhone 17 Pro Max
Marca: Apple
Activo: true
Destacado: true
```

Debe cumplir:

- Home muestra el producto en Productos destacados.
- Catalogo muestra el producto en su categoria.
- Busqueda por nombre devuelve el producto.
- Filtro por Apple devuelve el producto y excluye inactivos.
- La marca Apple muestra el conteo derivado del inventario activo.
- Un producto inactivo no aparece en ninguna lectura publica.
- No aparecen errores de serializacion, hydration o Firestore en consola.
- Localhost y los tres dominios Vercel entregan el mismo resultado funcional.
- La respuesta de `/api/revalidate` es exitosa despues de un cambio admin.
- Las paginas no quedan vacias por un error silencioso.

## Verificacion requerida

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

La validacion de navegador cubrira `1440x900`, `1024x768` y `390x844`, con consola y red inspeccionadas. Se documentaran los archivos modificados, los indices desplegados, la configuracion externa pendiente y cualquier bloqueo que impida la comprobacion final en Vercel.
