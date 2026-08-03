# Auditoria Admin-Firestore-Home y Marcas

**Estado:** Aprobada por el operador

**Fecha:** 2026-08-03

## Objetivo

Restablecer el flujo publico de productos creados desde `/admin/productos`, convertir las marcas en una vista derivada del inventario activo y reorganizar Home para priorizar la venta de productos.

## Diagnostico confirmado

### Causa raiz de que Home no renderice productos

`src/lib/firestore/public.ts` convierte documentos de Firestore con un spread completo:

```ts
{ id: snap.id, ...(snap.data() as Omit<Producto, "id">) }
```

Los documentos creados por el admin incluyen `creadoEn` y `actualizadoEn` como `Timestamp`. Home pasa esos objetos a `OfertasSection`, `ProductCard` y otros Client Components. Next.js no puede serializar esos objetos en la frontera Server Component -> Client Component y devuelve:

```text
Only plain objects, and a few built-ins, can be passed to Client Components from Server Components.
```

El fallo se reproduce en `http://localhost:3000/` con HTTP 500 cuando existe un producto activo destacado.

### Problemas adicionales encontrados

1. Home solo consulta `activo == true && destacado == true`, por lo que un producto activo no destacado no tiene una sección publica de novedades.
2. `MarcasSection` usa un array fijo de Apple, Samsung, Xiaomi, Motorola, Honor y Redmi; no lee inventario ni cuenta productos.
3. El filtro por marca no existe.
4. La tarjeta de producto construye `/${categoriaSlug}/${producto.slug}`, pero la ruta real es `/producto/[slug]`.
5. `CategoryPill` construye `/${slug}`, pero la ruta real es `/categoria/[slug]`.
6. La capa de imagen GSAP en `Hero` usa `position: fixed` y un `ScrollTrigger` cuyo final alcanza el scroll total; por eso el celular invade marcas, productos, beneficios y footer.
7. El orden actual coloca reparaciones antes de beneficios y mantiene “Compra por categoría” dentro de Home.
8. `ProductoForm` envía `tieneVariantes` y `atributosDisponibles`, pero `crearProducto` y `actualizarProducto` no los persisten explícitamente.
9. La configuración de índices declara `activo + destacado + __name__`, mientras algunas consultas también ordenan por `nombre`; las consultas nuevas deben tener un contrato de ordenamiento e índice verificable.

## Alcance aprobado

### Incluido

- Contrato publico plano para productos.
- Regla de publicación: `activo == true`; el stock no oculta un producto.
- Home con marcas, destacados y nuevos provenientes de Firestore.
- Ruta SEO `/marca/[slug]` con productos activos filtrados por marca.
- Búsqueda por texto y marca, siempre sobre productos activos.
- Corrección de rutas de producto y categoría.
- Reordenamiento del Home y reubicación de reparaciones.
- Confinamiento del efecto del celular al Hero.
- Ajustes de densidad, espaciado y responsive sin cambiar la identidad navy/cyan.
- Pruebas unitarias, integración, build/typecheck y QA con navegador.

### Fuera de alcance

- Crear una colección Firestore de marcas.
- Listener realtime desde el navegador.
- Gateway de pago.
- Cambiar el modelo de categorías o el checkout.
- Reemplazar la identidad visual existente.

## Arquitectura aprobada

### Flujo Admin -> Firestore -> publico

```text
ProductoForm
  -> validarProducto
  -> crearProducto / actualizarProducto
  -> productos/{id}
       nombre
       slug
       descripcion
       precio
       stock
       categoriaId
       marca
       specs
       imagenes
       activo
       destacado
       tieneVariantes
       atributosDisponibles
       creadoEn / actualizadoEn (internos)
  -> POST /api/revalidate { tags: ["productos"] }
  -> listarProductosActivos()
  -> Home / busqueda / categoria / marca
```

La coleccion canonica sera siempre `productos`. No se creara una segunda fuente de inventario.

### Contrato publico

El mapper de `src/lib/firestore/public.ts` debe construir un `Producto` mediante allowlist. Debe devolver solo campos usados por el storefront:

- `id`
- `nombre`
- `slug`
- `descripcion`
- `precio`
- `stock`
- `categoriaId`
- `marca`
- `specs`
- `imagenes`
- `activo`
- `destacado`
- `tieneVariantes`
- `atributosDisponibles`

No deben cruzar la frontera hacia Client Components `creadoEn`, `actualizadoEn` ni otros campos Firestore no declarados. El tipo `Producto` seguira representando datos publicos, no el documento crudo de persistencia.

### Productos activos

La capa publica tendra una lectura cacheada `listarProductosActivos()` con tag `productos`. La lectura debe ordenar los documentos por `creadoEn` descendente para que los primeros sean los nuevos. Se declarara en `firestore.indexes.json` el indice `activo ASC, creadoEn DESC` y se documentara su despliegue.

Los derivados del Home son:

- `destacados`: productos activos con `destacado === true`, limitados a seis.
- `nuevos`: productos activos con `destacado === false`, limitados a ocho y ordenados por fecha de creacion.
- `marcas`: resumen generado exclusivamente desde productos activos; un producto con stock cero sigue contando.

Un producto activo recien creado aparece en una de las dos grillas: destacados si fue marcado como destacado, o nuevos en caso contrario. El catalogo y la busqueda no tienen este limite visual y deben incluir todos los productos activos.

### Marcas

Se agregara una utilidad pura para producir:

```ts
type MarcaResumen = {
  nombre: string;
  slug: string;
  cantidad: number;
};
```

Reglas:

- Ignorar marcas vacias.
- Recortar espacios.
- Agrupar sin diferenciar mayusculas y minusculas.
- Conservar una etiqueta visible estable.
- Generar `slug` con `generarSlug`.
- Contar solo productos cuyo `activo` sea `true`.

`MarcasSection` recibira `MarcaResumen[]` serializable y renderizara enlaces a `/marca/[slug]`. No tendra array de marcas ni logos simulados.

### Ruta de marca

`src/app/marca/[slug]/page.tsx` sera un Server Component que:

1. Obtiene productos activos desde la capa publica.
2. Agrupa y localiza la marca por slug.
3. Devuelve `notFound()` si no hay marca activa.
4. Renderiza titulo, contador, descripcion corta y productos filtrados.
5. Genera metadata/canonical con la marca.

El filtro debe comparar la marca normalizada, evitando que `Apple`, ` apple ` y `APPLE` creen resultados inconsistentes. Solo se mostraran productos activos.

### Busqueda y catalogo

- `/api/buscar` seguira siendo la entrada de busqueda.
- `q` y `marca` se validaran como strings acotados antes de filtrar.
- La busqueda cubrira nombre, marca y valores de specs.
- La busqueda nunca devolvera productos inactivos.
- Las paginas `/categoria/[slug]` conservaran su consulta `activo == true`.
- `ProductCard` enlazara a `/producto/[slug]`.
- Los enlaces de categoria usaran `/categoria/[slug]`.

## Home aprobado

El JSX final tendra este orden:

1. `Hero`
2. `MarcasSection`
3. `Productos destacados`
4. `Nuevos productos`
5. `BeneficiosSection`
6. CTA secundario `¿Necesitas reparar tu celular?`
7. Footer global del layout

Se eliminara de Home:

- La seccion “Compra por categoria”.
- `CategoryGrid` dentro de Home.
- El `SearchInput` incrustado en esa seccion.
- Arrays hardcodeados de productos o marcas.

El catalogo continuara disponible en `/categoria` y la busqueda desde Header y mobile navigation.

## Sistema visual aprobado

Se conserva la identidad definida en `docs/DESIGN-mundocelular.md` y los tokens de `src/app/globals.css`:

- Fondo: navy profundo para mantener continuidad con el Hero y el Footer.
- Superficie: navy elevado para tarjetas y bloques.
- Acento: cyan reservado para acciones y estados interactivos existentes.
- Display: Sora.
- UI/cuerpo: Inter e Inter Tight donde ya esta establecido.
- Precios y datos comparables: JetBrains Mono.

Decisiones especificas de esta tarea:

- Espaciado vertical compacto, evitando secciones sobredimensionadas.
- Grids de productos: 2 columnas mobile, 3 tablet, 4 desktop.
- Grids de marcas: 2 columnas mobile, 3 tablet, 6 desktop.
- Tarjetas de marca con nombre, contador y foco visible.
- Animacion de entrada solo local a cada seccion; nunca un elemento fixed que atraviese el documento.
- `Hero` mantiene `overflow-hidden`; el telefono se renderiza unicamente dentro de su caja.
- `prefers-reduced-motion`, teclado y contraste se conservan como requisitos.

## Revalidacion y errores

- `crearProducto`, `actualizarProducto` y `eliminarProducto` invalidaran `productos` despues de persistir.
- Las lecturas publicas de Home, marca, categoria, producto y busqueda usaran tags coherentes.
- La revalidacion seguira siendo best-effort, pero los datos persistidos no se consideraran publicos si `activo` es falso.
- Si una lectura publica falla, Home renderizara estado vacio seguro y no datos mock.
- Los errores de API devolveran estados HTTP explicitos y no filtraran credenciales ni detalles internos.

## Verificacion de aceptacion

### Automatizada

- Test del mapper: un documento con Timestamp produce un `Producto` sin objetos no serializables.
- Test de validacion/persistencia del formulario: `activo`, `destacado`, imagenes y variantes se envian y guardan.
- Test de resumen de marcas: activos agrupados y contador correcto; inactivos excluidos.
- Test de destacados y nuevos: filtros y limites correctos.
- Test de busqueda por texto y marca.
- Test de ruta de marca: producto activo incluido, inactivo excluido, marca inexistente en 404.
- Test de rutas de enlaces `/producto` y `/categoria`.
- `npm test`.
- `npx tsc --noEmit`.
- `npm run lint`.
- `npm run build` si el entorno Firebase permite el build completo.

### Navegador

Crear desde `/admin/productos`:

```text
Nombre: iPhone 17 Pro Max
Marca: Apple
Categoria: Celulares
Precio: entero COP valido
Stock: mayor que cero
Imagen: al menos una
Destacado: activado
Activo: activado
```

Comprobar:

- Home responde sin 500.
- El producto aparece en Productos destacados.
- El producto aparece en busqueda por nombre y por Apple.
- El producto aparece en su categoria.
- Apple muestra el contador incrementado.
- `/marca/apple` muestra unicamente productos Apple activos.
- Los enlaces abren las rutas reales.
- La navegacion funciona a 1440px, 1024px y 390px sin overflow horizontal.
- El celular no aparece fuera del Hero.

## Criterio de terminado

La tarea queda terminada cuando el flujo admin -> Firestore -> Home esta cubierto por pruebas, el Home deja de fallar con productos reales, la marca y sus conteos derivan de activos, el CTA de reparaciones esta debajo de beneficios, el telefono queda contenido en Hero y la validacion de navegador entrega evidencia en las tres dimensiones solicitadas.
