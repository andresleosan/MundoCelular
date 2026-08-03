# Auditoría Admin-Firestore-Home-Marcas

**Fecha:** 2026-08-03  
**Estado:** `revisión`  
**Implementador:** Task 5, sin commit

## Resultado

La verificación automatizada final es verde: 187/187 pruebas, TypeScript sin errores, lint sin errores y build Turbopack exitoso. Los tres fallos del baseline que seguían abiertos eran expectativas obsoletas de `ProductoForm`; GSAP/jsdom ya no falla después de Task 4. Se corrigieron solo las consultas de test para usar los roles accesibles reales. También se corrigió el `any` preexistente de `scripts/create-test-users.ts` con `unknown` y un type guard mínimo.

La auditoría permanece en `revisión` únicamente por el CRUD Admin-Firestore autenticado y los pendientes operativos. La QA pública/responsive ya fue ejecutada. No se ingresaron credenciales de producción, no se hicieron escrituras ni despliegues Firebase y no se desplegaron índices.

## Diagnóstico Confirmado

La causa original de HTTP 500 en Home era que el mapper público propagaba documentos completos de Firestore, incluidos `creadoEn` y `actualizadoEn` como `Timestamp`. Esos objetos no son serializables en la frontera Server Component -> Client Component.

El estado actual usa un mapper allowlist en `src/lib/firestore/public.ts`: solo entrega datos planos del catálogo y sanea objetos anidados. La lectura pública de Home usa `listarProductosActivos()`, filtra `activo == true` y ordena por `creadoEn DESC` en servidor sin depender del índice compuesto todavía no desplegado.

Durante la QA se confirmó una regresión visual introducida al limpiar el Hero: se habían eliminado la capa `fixed` y las tres imágenes del teléfono (`Armado1.png`, `Desarmadom1.png`, `Desarmado1.png`). Se restauró la animación GSAP con `ScrollTrigger`, confinada al recorrido del Hero y su transición hacia Marcas, con respeto a `prefers-reduced-motion`. También se recuperó la presentación de seis marcas conocidas en Home; las marcas sin inventario activo se muestran como tarjetas no enlazables y las que sí tienen productos conservan su ruta SEO y contador.

Las tres fallas de `ProductoForm` no eran fallas de negocio:

- `SelectContent` usa portal y sus opciones solo existen después de abrir el `role="combobox"`.
- Base UI expone el control de variantes como `role="checkbox"` con nombre accesible `Tiene variantes`.
- `getByLabelText` encontraba el texto del label y el input oculto interno; no era una consulta única del control renderizado.

## Flujo Verificado En Código

```text
ProductoForm
  -> validarProducto
  -> crearProducto / actualizarProducto
  -> productos/{id}
  -> avisarRevalidacion(["productos"])
  -> listarProductosActivos()
  -> Home / búsqueda / categoría / marca / producto
```

La colección canónica es `productos`; no se creó una colección de marcas ni un inventario alterno.

### Campos persistidos

`crearProducto` y `actualizarProducto` persisten `nombre`, `descripcion`, `precio`, `stock`, `categoriaId`, `marca`, `specs`, `activo`, `destacado`, `imagenes`, `tieneVariantes`, `atributosDisponibles` y `slug`. Firestore agrega `creadoEn` y `actualizadoEn` como metadatos internos. Los timestamps no cruzan hacia Client Components.

### Reglas de publicación

- `activo == true`: regla de visibilidad pública para Home, catálogo, búsqueda y marcas.
- `destacado == true`: sección `Productos destacados`, con límite de seis.
- `activo == true && destacado == false`: sección `Nuevos productos`, con límite de ocho y orden de creación recibido.
- `stock`: no oculta productos; stock cero sigue siendo visible y contable.
- `marca`: se normaliza para agrupar y filtrar `Apple`, ` apple ` y `APPLE` de forma consistente; las marcas cuentan solo productos activos.

El índice recomendado `productos(activo ASCENDING, creadoEn DESCENDING)` está declarado en `firestore.indexes.json`. Su despliegue queda pendiente y no se ejecutó; Home funciona sin bloquearse porque ordena los activos después de leerlos.

## Cambios De Task 5 Y QA Posterior

- `tests/components/ProductoForm.test.tsx`: abre el combobox antes de consultar `option` y consulta los switches por `role="checkbox"` y nombre accesible.
- `scripts/create-test-users.ts`: `catch (e: unknown)`, type guard para `code` y manejo seguro del mensaje; la rama `auth/email-already-exists` conserva el comportamiento previo.
- `tasks.md`: nueva sección `Auditoría Admin-Firestore-Home-Marcas` en estado `revisión`.
- Este reporte y `.superpowers/sdd/2026-08-03-auditoria-admin-firestore-home-marcas/task-5-report.md`.
- `src/components/storefront/Hero.tsx`: restaurada la capa fija de despiece con prueba de regresión en `tests/components/storefront/Hero.test.tsx`.
- `src/lib/storefront/brands.ts`, `src/app/page.tsx` y `src/components/storefront/MarcasSection.tsx`: seis marcas visibles en Home, enlaces solo para marcas con inventario activo y prueba de `completarMarcasParaHome`.
- `src/lib/firestore/public.ts`: mapper allowlist para variantes públicas, con prueba contra timestamps y estructuras anidadas.
- `tests/setup.ts`: polyfill mínimo de `matchMedia` para probar GSAP en jsdom.

Los cambios de Tasks 1-4 verificados incluyen las superficies de persistencia y mapper público, derivación de marcas y Home, búsqueda y ruta `/marca/[slug]`, SEO/sitemap, índice, tarjetas y navegación. La corrección posterior de QA modifica el JSX de Home solo para conservar la presentación de marcas y restaura el fondo animado del Hero solicitado por el operador.

## Comandos Automatizados

| Comando | Resultado inicial | Resultado final |
| --- | --- | --- |
| `npm test` | 30 archivos: 180/183; 3 fallos en `ProductoForm.test.tsx` | 31 archivos, 187/187 PASS |
| `npm test -- tests/components/ProductoForm.test.tsx` | No ejecutado antes del cambio | 1 archivo, 4/4 PASS |
| `npx tsc --noEmit` | PASS, sin salida | PASS, sin salida |
| `npm run lint` | 1 error `no-explicit-any` y 8 warnings | 0 errores y 11 warnings |
| `npm run build` | PASS; warnings de `<img>` y dependencia de `useEffect` | PASS; 27 rutas generadas |
| `git diff --check` | N/A antes de documentación | Sin errores de whitespace; solo avisos LF/CRLF de Windows |

El chequeo final `git status --short` mostró los cambios esperados de Tasks 1-4, los archivos de Task 5, el plan/spec aprobados y un artefacto `.playwright-mcp` preexistente. `git diff --stat` reportó 29 archivos tracked, 454 inserciones y 454 eliminaciones; los archivos nuevos no aparecen en esa estadística. No se revirtieron cambios ajenos.

Warnings que permanecen: variables no usadas en `qa/test-login.mjs` y `qa/verify-pasos-6-11.mjs`, `<img>` en `src/app/admin/productos/page.tsx`, las tres imágenes intencionalmente no optimizadas del efecto GSAP en `Hero.tsx` y dependencia faltante de `options` en `src/hooks/useScrollAnimation.ts`. No son errores de compilación.

## Seguridad Y Dependencias

- No se leyeron archivos de secretos ni se ejecutó `scripts/create-test-users.ts`.
- `git ls-files -- .env .env.*` solo mostró `.env.local.example`; `.gitignore` excluye `.env*`, credenciales y llaves.
- `npm audit` reportó 40 vulnerabilidades transitorias: 6 low, 19 moderate, 10 high y 5 critical.
- `npm audit --omit=dev --audit-level=high` reportó 16 vulnerabilidades: 9 moderate y 7 high, incluyendo avisos de Next.js, PostCSS, sharp, undici y fast-uri.
- No se ejecutó `npm audit fix` porque varias propuestas usan `--force` o cambian versiones fuera del rango. Queda como tarea separada de dependencias.
- `scripts/create-test-users.ts` conserva credenciales explícitas de usuarios de prueba preexistentes; no se usaron para esta auditoría ni representan credenciales de producción. Si el script se expone fuera de un entorno de prueba, debe migrarse a variables de entorno en una tarea separada.

## QA De Navegador

La validación se ejecutó con Playwright MCP contra `http://localhost:3000` usando el build de producción. No se usaron credenciales ni se hicieron escrituras en Firestore.

Rutas públicas verificadas en `1440x900`, `1024x768` y `390x844`:

- `/`
- `/buscar?q=iPhone%2017%20Pro%20Max`
- `/buscar?marca=Apple`
- `/categoria/celulares`
- `/marca/apple`
- `/producto/iphone-17-pro-max`
- `/admin/login` y `/admin/productos` cargan; no se ejecutó creación/actualización porque no se proporcionaron credenciales de prueba autorizadas.

Resultado: 30/30 combinaciones de rutas públicas y viewport devolvieron `200`, sin overflow horizontal ni errores de consola. Home mostró las seis tarjetas de marca y las tres imágenes del teléfono cargaron como `position: fixed`; sus opacidades cambiaron por etapas al recorrer `0`, `1000`, `1500`, `2200` y `2700` px. `/categoria/celulares` devolvió `404` en un servidor dev contaminado por un build concurrente, pero devolvió `200` después de reconstruir y ejecutar `next start` limpio en `3000`. Se generaron capturas locales de Home/Marcas, no versionadas.

## Concerns Y Bloqueos

1. El CRUD Admin-Firestore autenticado no se ejecutó porque no hay credenciales de prueba autorizadas en esta sesión; la existencia y lectura del producto `iPhone 17 Pro Max` sí fue verificada públicamente.
2. El índice compuesto está declarado, pero no desplegado. Requiere permisos y un proyecto Firebase autorizado; no se ejecutó `npm run deploy:indexes`.
3. Las vulnerabilidades de dependencias requieren una decisión y actualización separadas; no se cambió el lockfile.
4. El endpoint público de búsqueda conserva la lectura de productos activos por solicitud y no tiene rate limiting; es un concern operativo heredado de Task 3.
