# Auditoría Admin-Firestore-Home-Marcas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que los productos activos creados desde `/admin/productos` lleguen de forma segura y automática a Home, destacados, novedades, catálogo, búsqueda y filtros dinámicos de marca.

**Architecture:** Firestore seguirá teniendo una única colección `productos`. La capa pública convertirá documentos crudos a productos planos mediante una allowlist; Home consumirá una lectura cacheada de productos activos y derivará destacados, nuevos y marcas. Las marcas tendrán rutas SSR indexables `/marca/[slug]`, mientras que el Home permanecerá SSR/ISR y el efecto del teléfono quedará contenido en Hero.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Firebase Admin 14, Firestore, Tailwind v4, Vitest 4, Testing Library y Playwright MCP.

## Global Constraints

- La colección canónica será `productos`; no se creará una colección separada de marcas.
- `activo == true` será la regla pública; el stock cero no ocultará el producto.
- Home, catálogo, búsqueda y marcas no usarán mocks ni arrays hardcodeados de inventario.
- El mapper público no expondrá `creadoEn`, `actualizadoEn` ni otros objetos Firestore a Client Components.
- Los enlaces de categorías usarán `/categoria/[slug]` y los de productos `/producto/[slug]`.
- El Home tendrá el orden Hero, Marcas destacadas, Productos destacados, Nuevos productos, Beneficios, CTA de reparaciones y Footer.
- La identidad navy/cyan, Sora, Inter/Inter Tight y JetBrains Mono existente se conserva.
- La UI debe funcionar en desktop, tablet y mobile, con foco visible y `prefers-reduced-motion` respetado.
- No se agregarán dependencias nuevas.
- No se harán commits durante la ejecución; los commits solo se crearán si el operador los solicita explícitamente.

## Mapa de archivos

### Datos y dominio

- Modificar `src/lib/validacion.ts` para que `ProductoInput` declare los campos de variantes que ya usa el formulario.
- Modificar `src/lib/firestore/productos.ts` para persistir todos los campos del formulario y mantener la revalidación `productos`.
- Modificar `src/lib/firestore/public.ts` para el mapper allowlist y `listarProductosActivos()`.
- Crear `src/lib/storefront/brands.ts` para normalización, resumen y filtro de marcas.
- Crear `src/lib/storefront/home.ts` para separar activos en destacados y nuevos.
- Modificar `firestore.indexes.json` con el índice de activos ordenados por `creadoEn`.

### Rutas y SEO

- Crear `src/app/marca/[slug]/page.tsx`.
- Modificar `src/app/api/buscar/route.ts` para aceptar marca y validar entrada.
- Modificar `src/app/buscar/Buscador.tsx` para conservar el contrato de resultados extendido.
- Modificar `src/lib/seo/metadata.ts` para canonicales reales y metadata de marca.
- Modificar `src/lib/seo/jsonld.ts` para URLs reales de categoría y producto.
- Modificar `src/app/sitemap.ts` para categorías, productos y marcas con sus rutas reales.

### Storefront

- Modificar `src/app/page.tsx` para consumir productos activos y el nuevo orden.
- Modificar `src/components/storefront/MarcasSection.tsx` para recibir `MarcaResumen[]`.
- Modificar `src/components/storefront/OfertasSection.tsx` para mostrar Productos destacados desde Firestore.
- Crear `src/components/storefront/NuevosProductosSection.tsx`.
- Modificar `src/components/storefront/ProductCard.tsx`, `ProductGrid.tsx` y `HeroProductCard.tsx` para enlaces y variantes correctos.
- Modificar `src/components/storefront/CategoryPill.tsx` y `src/components/layout/Header.tsx` para rutas y anchors reales.
- Modificar `src/components/storefront/Hero.tsx` para eliminar la capa fixed de GSAP.
- Eliminar `src/components/storefront/PhoneScrollReveal.tsx`, que quedó sin consumidores y contiene el efecto invasivo alternativo.

### Pruebas y documentación

- Modificar `tests/lib/firestore-public.test.ts`.
- Crear `tests/lib/firestore-productos.test.ts`.
- Crear `tests/lib/brands.test.ts` y `tests/lib/home-sections.test.ts`.
- Modificar `tests/lib/seo-metadata.test.ts` y `tests/lib/seo-jsonld.test.ts`.
- Crear `tests/api/buscar.test.ts`.
- Crear `tests/components/storefront/MarcasSection.test.tsx`, `NuevosProductosSection.test.tsx` y `ProductCard.test.tsx`.
- Modificar `tasks.md` con el estado de la auditoría.
- Crear `docs/superpowers/reports/2026-08-03-auditoria-admin-firestore-home-marcas.md` con evidencia final.

---

### Task 1: Contrato público y persistencia admin

**Files:**
- Modify: `tests/lib/firestore-public.test.ts`
- Create: `tests/lib/firestore-productos.test.ts`
- Modify: `src/lib/firestore/public.ts`
- Modify: `src/lib/firestore/productos.ts`
- Modify: `src/lib/validacion.ts`

**Interfaces:**
- Produces `listarProductosActivos(): Promise<Producto[]>`.
- `ProductoInput` tendrá `tieneVariantes?: boolean` y `atributosDisponibles?: string[]`.
- El resultado de todas las lecturas públicas de productos no contendrá `creadoEn` ni `actualizadoEn`.

- [ ] **Step 1: Escribir la prueba que reproduce el error de serialización**

En `tests/lib/firestore-public.test.ts`, importar `listarProductosActivos` y agregar un caso con metadatos tipo Timestamp:

```ts
it("expone productos planos sin timestamps internos de Firestore", async () => {
  mockGetFn.mockResolvedValue({
    docs: [makeDocData("p1", {
      ...mockProductoData,
      creadoEn: { toMillis: () => 20 },
      actualizadoEn: { toMillis: () => 21 },
    })],
    empty: false,
  });

  const productos = await listarProductosActivos();

  expect(productos[0]).toMatchObject({ id: "p1", nombre: "iPhone 13", activo: true });
  expect(productos[0]).not.toHaveProperty("creadoEn");
  expect(productos[0]).not.toHaveProperty("actualizadoEn");
});
```

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/firestore-public.test.ts`.

Esperado: falla porque `listarProductosActivos` todavía no existe o porque el spread actual conserva `creadoEn` y `actualizadoEn`.

- [ ] **Step 3: Implementar el mapper allowlist y la consulta activa**

En `src/lib/firestore/public.ts`, reemplazar el spread de `toProducto` por una construcción explícita con estos campos: `id`, `nombre`, `slug`, `descripcion`, `precio`, `stock`, `categoriaId`, `marca`, `specs`, `imagenes`, `activo`, `destacado`, `tieneVariantes` y `atributosDisponibles`. Usar valores seguros para campos opcionales: `[]` para arrays ausentes, `{}` para `specs` ausentes, `false` para booleanos ausentes y `""` para strings ausentes.

Agregar la lectura cacheada:

```ts
export const listarProductosActivos = unstable_cache(
  async (): Promise<Producto[]> => {
    const db = getAdminDb();
    const snap = await db
      .collection("productos")
      .where("activo", "==", true)
      .orderBy("creadoEn", "desc")
      .get();
    return snap.docs.map(toProducto);
  },
  ["productos-activos"],
  { tags: ["productos"] },
);
```

Usar el mismo `toProducto` en `listarProductosCategoria`, `getProductoPorSlug`, `getProductoPorId`, `getTodosLosProductos` y `listarDestacados`. Mantener sus filtros `activo == true` donde ya existan.

- [ ] **Step 4: Ejecutar la prueba y confirmar GREEN**

Ejecutar `npm test -- tests/lib/firestore-public.test.ts`.

Esperado: PASS, incluyendo la nueva prueba de ausencia de timestamps y las pruebas existentes de lecturas públicas.

- [ ] **Step 5: Escribir la prueba de persistencia de campos admin**

Crear `tests/lib/firestore-productos.test.ts` con mocks de `firebase/firestore`, `@/lib/firebase` y `@/lib/revalidate`. Capturar el payload de `addDoc` y comprobar que una entrada válida conserva publicación, imágenes y variantes:

```ts
it("persiste activo, destacado, imágenes y configuración de variantes", async () => {
  const input = {
    nombre: "iPhone 17 Pro Max",
    descripcion: "Equipo de prueba",
    precio: 6500000,
    stock: 3,
    categoriaId: "cat-celulares",
    marca: "Apple",
    specs: { Capacidad: "256GB" },
    activo: true,
    destacado: true,
    imagenes: [{ url: "https://img.test/full.webp", thumb: "https://img.test/thumb.webp", alt: "iPhone 17 Pro Max" }],
    tieneVariantes: true,
    atributosDisponibles: ["Color", "Capacidad"],
  };

  await crearProducto(input);

  expect(addDocMock).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      activo: true,
      destacado: true,
      imagenes: input.imagenes,
      tieneVariantes: true,
      atributosDisponibles: input.atributosDisponibles,
    }),
  );
});
```

- [ ] **Step 6: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/firestore-productos.test.ts`.

Esperado: falla porque `ProductoInput` no declara los campos de variantes y los servicios no los incluyen en el payload.

- [ ] **Step 7: Implementar el contrato de entrada y guardar todos los campos**

Extender `ProductoInput` en `src/lib/validacion.ts` con `tieneVariantes?: boolean` y `atributosDisponibles?: string[]`. En `crearProducto` y `actualizarProducto`, guardar `tieneVariantes: input.tieneVariantes ?? false` y `atributosDisponibles: input.atributosDisponibles ?? []` junto a los campos actuales. No eliminar `avisarRevalidacion(["productos"])`.

- [ ] **Step 8: Ejecutar pruebas de datos**

Ejecutar `npm test -- tests/lib/firestore-public.test.ts tests/lib/firestore-productos.test.ts tests/lib/validacion.test.ts`.

Esperado: PASS sin regresiones en validación, lectura pública o persistencia.

---

### Task 2: Derivación de marcas y secciones Home

**Files:**
- Create: `src/lib/storefront/brands.ts`
- Create: `src/lib/storefront/home.ts`
- Create: `tests/lib/brands.test.ts`
- Create: `tests/lib/home-sections.test.ts`

**Interfaces:**
- `normalizarMarca(marca: string): string` devuelve una marca recortada, con espacios internos colapsados y en minúsculas.
- `resumirMarcas(productos: Producto[]): MarcaResumen[]` devuelve `{ nombre, slug, cantidad }[]` ordenado por nombre.
- `filtrarProductosPorMarca(productos: Producto[], marcaSlug: string): Producto[]` devuelve únicamente coincidencias activas y normalizadas.
- `separarProductosHome(productos: Producto[]): { destacados: Producto[]; nuevos: Producto[] }` limita destacados a 6 y nuevos a 8.

- [ ] **Step 1: Escribir la prueba RED del resumen de marcas**

Crear `tests/lib/brands.test.ts` con tres productos Apple, uno con `" apple "`, uno Samsung y uno inactivo. Esperar dos Apple activos, un Samsung y ningún producto inactivo:

```ts
it("agrupa marcas activas sin distinguir mayúsculas ni espacios", () => {
  const resumen = resumirMarcas([
    producto({ id: "a1", marca: "Apple", activo: true }),
    producto({ id: "a2", marca: " apple ", activo: true }),
    producto({ id: "s1", marca: "Samsung", activo: true }),
    producto({ id: "a3", marca: "Apple", activo: false }),
  ]);

  expect(resumen).toEqual([
    { nombre: "Apple", slug: "apple", cantidad: 2 },
    { nombre: "Samsung", slug: "samsung", cantidad: 1 },
  ]);
});
```

Agregar también una prueba de `filtrarProductosPorMarca` que confirme que `/marca/apple` no incluye Samsung ni productos inactivos.

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/brands.test.ts`.

Esperado: falla porque `src/lib/storefront/brands.ts` y sus funciones no existen.

- [ ] **Step 3: Implementar las funciones de marca**

Crear `MarcaResumen`, `normalizarMarca`, `resumirMarcas` y `filtrarProductosPorMarca`. Usar `generarSlug` para el slug, `Map` para agrupar y `localeCompare` para ordenar. Ignorar marcas vacías. `filtrarProductosPorMarca` debe comprobar `producto.activo === true` aunque su caller ya haya usado una consulta activa.

- [ ] **Step 4: Ejecutar la prueba y confirmar GREEN**

Ejecutar `npm test -- tests/lib/brands.test.ts`.

Esperado: PASS con agrupación, conteo, slug y exclusión de inactivos.

- [ ] **Step 5: Escribir la prueba RED de separación Home**

Crear `tests/lib/home-sections.test.ts` con productos ordenados del más reciente al más antiguo. Comprobar que destacados solo contiene `destacado: true`, nuevos solo contiene activos no destacados y que se respetan los límites 6/8:

```ts
it("separa destacados y nuevos desde productos activos", () => {
  const productos = [
    producto({ id: "p1", destacado: true }),
    producto({ id: "p2", destacado: false }),
  ];

  expect(separarProductosHome(productos)).toEqual({
    destacados: [productos[0]],
    nuevos: [productos[1]],
  });
});
```

- [ ] **Step 6: Ejecutar la prueba y confirmar RED**

Ejecutar `npm test -- tests/lib/home-sections.test.ts`.

Esperado: falla porque `separarProductosHome` no existe.

- [ ] **Step 7: Implementar la derivación Home**

Crear `separarProductosHome` suponiendo que recibe productos activos ordenados por `creadoEn`. Implementar `destacados = productos.filter((p) => p.destacado).slice(0, 6)` y `nuevos = productos.filter((p) => !p.destacado).slice(0, 8)`. No introducir fallback mock ni consultar Firestore desde esta utilidad.

- [ ] **Step 8: Ejecutar pruebas de dominio**

Ejecutar `npm test -- tests/lib/brands.test.ts tests/lib/home-sections.test.ts`.

Esperado: PASS.

---

### Task 3: Búsqueda, marca, SEO e índices

**Files:**
- Create: `src/app/marca/[slug]/page.tsx`
- Create: `tests/api/buscar.test.ts`
- Modify: `src/app/api/buscar/route.ts`
- Modify: `src/app/buscar/Buscador.tsx`
- Modify: `src/lib/seo/metadata.ts`
- Modify: `src/lib/seo/jsonld.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `tests/lib/seo-metadata.test.ts`
- Modify: `tests/lib/seo-jsonld.test.ts`
- Modify: `firestore.indexes.json`

**Interfaces:**
- `GET /api/buscar?q=<texto>&marca=<marca>` devuelve `{ resultados: Array<{ producto: Producto; categoriaSlug: string }> }`.
- Entradas con `q` de más de 100 caracteres o `marca` de más de 80 caracteres devuelven HTTP 400 y `{ error: string }`.
- `/marca/[slug]` usa `listarProductosActivos`, `resumirMarcas` y `filtrarProductosPorMarca`.
- `metadataMarca(nombre, slug, cantidad, config)` devuelve canonical `/marca/[slug]`.

- [ ] **Step 1: Cambiar primero las expectativas SEO para evidenciar las rutas incorrectas**

En `tests/lib/seo-metadata.test.ts`, cambiar las expectativas existentes a las rutas reales:

```ts
expect(metadataCategoria(cat, config).alternates?.canonical).toBe("/categoria/celulares");
expect(metadataProducto(prod, cat, config).alternates?.canonical).toBe("/producto/iphone-13");
```

En `tests/lib/seo-jsonld.test.ts`, cambiar URLs esperadas de `/${slug}` y `/${categoria}/${producto}` a `/categoria/${slug}` y `/producto/${producto}`. Agregar un test de metadata de marca con canonical `/marca/apple`.

- [ ] **Step 2: Ejecutar pruebas y confirmar RED**

Ejecutar `npm test -- tests/lib/seo-metadata.test.ts tests/lib/seo-jsonld.test.ts`.

Esperado: fallan las expectativas nuevas porque los generadores todavía usan las rutas antiguas.

- [ ] **Step 3: Corregir metadata, JSON-LD y sitemap**

Modificar `metadataCategoria` para canonical y Open Graph `/categoria/${cat.slug}`. Modificar `metadataProducto` para canonical `/producto/${prod.slug}` incluso cuando tenga categoría. Agregar `metadataMarca` con título, descripción, canonical `/marca/${slug}` y robots indexable.

Modificar `jsonldCategoria` y `jsonldProducto` para que todos los `url` usen `/categoria/...` y `/producto/...`. En `sitemap.ts`, generar entradas de categoría con `/categoria/${c.slug}`, productos con `/producto/${p.producto}` y marcas desde `listarProductosActivos()` + `resumirMarcas()` con `/marca/${m.slug}`.

- [ ] **Step 4: Ejecutar pruebas SEO y confirmar GREEN**

Ejecutar `npm test -- tests/lib/seo-metadata.test.ts tests/lib/seo-jsonld.test.ts tests/lib/sitemap.test.ts`.

Esperado: PASS con canonicales y sitemap coherentes con las rutas reales.

- [ ] **Step 5: Escribir pruebas RED del contrato de búsqueda**

Crear `tests/api/buscar.test.ts` mockeando `listarTodosLosProductosActivos` con un Apple activo, un Samsung activo y un Apple inactivo. Cubrir:

```ts
it("filtra resultados por marca y solo devuelve activos", async () => {
  const response = await GET(new NextRequest("http://localhost:3000/api/buscar?marca=Apple"));
  expect(response.status).toBe(200);
  expect((await response.json()).resultados.map((r) => r.producto.marca)).toEqual(["Apple"]);
});

it("rechaza una query demasiado larga", async () => {
  const response = await GET(new NextRequest(`http://localhost:3000/api/buscar?q=${"x".repeat(101)}`));
  expect(response.status).toBe(400);
});
```

- [ ] **Step 6: Ejecutar pruebas y confirmar RED**

Ejecutar `npm test -- tests/api/buscar.test.ts`.

Esperado: falla el caso de marca o el de longitud porque la ruta actual solo lee `q` y no valida límites.

- [ ] **Step 7: Implementar búsqueda segura con marca**

En `src/app/api/buscar/route.ts`, leer `q` y `marca`, recortar, devolver HTTP 400 para los límites definidos y devolver `{ resultados: [] }` cuando ambos estén vacíos. Aplicar el filtro de marca con `filtrarProductosPorMarca` antes del filtro textual. Convertir valores de specs a string antes de llamar `toLowerCase`, limitar a 24 resultados y conservar `categoriaSlug` en la respuesta.

Actualizar `Buscador.tsx` para no asumir que existe una búsqueda textual cuando la respuesta viene filtrada por marca y para mostrar el estado vacío sin error.

- [ ] **Step 8: Ejecutar pruebas de búsqueda y confirmar GREEN**

Ejecutar `npm test -- tests/api/buscar.test.ts tests/lib/firestore-public.test.ts`.

Esperado: PASS.

- [ ] **Step 9: Escribir la ruta SSR de marca**

Crear `src/app/marca/[slug]/page.tsx` con `revalidate = 3600`, `generateStaticParams` a partir de `resumirMarcas(await listarProductosActivos())`, `generateMetadata` con `metadataMarca` y una página que:

1. Obtenga los activos.
2. Encuentre el `MarcaResumen` por slug.
3. Llame `notFound()` si no existe.
4. Filtre con `filtrarProductosPorMarca`.
5. Renderice un solo H1, contador y `ProductGrid`.

- [ ] **Step 10: Agregar el índice de Firestore y verificar contrato**

Agregar a `firestore.indexes.json` el índice de colección `productos` con `activo ASCENDING` y `creadoEn DESCENDING`. No borrar los índices existentes. Registrar en el reporte que su despliegue operativo se realiza con `npm run deploy:indexes` y requiere permisos Firebase, sin ejecutarlo automáticamente contra producción.

- [ ] **Step 11: Ejecutar pruebas de rutas y tipos**

Ejecutar `npm test -- tests/api/buscar.test.ts tests/lib/seo-metadata.test.ts tests/lib/seo-jsonld.test.ts tests/lib/sitemap.test.ts` y luego `npx tsc --noEmit`.

Esperado: PASS y TypeScript sin errores.

---

### Task 4: Home, tarjetas, marcas y confinamiento del Hero

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/storefront/MarcasSection.tsx`
- Modify: `src/components/storefront/OfertasSection.tsx`
- Create: `src/components/storefront/NuevosProductosSection.tsx`
- Modify: `src/components/storefront/ProductCard.tsx`
- Modify: `src/components/storefront/ProductGrid.tsx`
- Modify: `src/components/storefront/HeroProductCard.tsx`
- Modify: `src/components/storefront/CategoryPill.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/storefront/Hero.tsx`
- Delete: `src/components/storefront/PhoneScrollReveal.tsx`
- Create: `tests/components/storefront/MarcasSection.test.tsx`
- Create: `tests/components/storefront/NuevosProductosSection.test.tsx`
- Create: `tests/components/storefront/ProductCard.test.tsx`

**Interfaces:**
- `MarcasSection({ marcas }: { marcas: MarcaResumen[] })`.
- `OfertasSection({ productos }: { productos: Producto[] })`.
- `NuevosProductosSection({ productos }: { productos: Producto[] })`.
- `ProductGrid({ productos, categoriaNombre?, variant? })` where `variant` is `default | compact | featured`.
- Product links use `/producto/${producto.slug}` independently of category.

- [ ] **Step 1: Escribir pruebas RED de marca, novedades y enlaces**

Crear `tests/components/storefront/MarcasSection.test.tsx`:

```tsx
it("renderiza solo las marcas recibidas y enlaza al filtro SEO", () => {
  render(<MarcasSection marcas={[{ nombre: "Apple", slug: "apple", cantidad: 8 }]} />);
  expect(screen.getByRole("link", { name: /Apple.*8/i })).toHaveAttribute("href", "/marca/apple");
  expect(screen.queryByText("Samsung")).not.toBeInTheDocument();
});
```

Crear `tests/components/storefront/NuevosProductosSection.test.tsx` y comprobar que muestra el título `Nuevos productos` y el nombre de cada producto recibido. Crear `tests/components/storefront/ProductCard.test.tsx` y comprobar que una tarjeta apunta a `/producto/iphone-17-pro-max`, no a `/${categoria}/${producto}`.

- [ ] **Step 2: Ejecutar pruebas y confirmar RED**

Ejecutar `npm test -- tests/components/storefront/MarcasSection.test.tsx tests/components/storefront/NuevosProductosSection.test.tsx tests/components/storefront/ProductCard.test.tsx`.

Esperado: falla porque la sección de marcas no recibe datos, no existe la sección de novedades y ProductCard construye una URL distinta.

- [ ] **Step 3: Implementar componentes de marcas y productos**

Modificar `MarcasSection` para eliminar el array estático y recibir `MarcaResumen[]`. Renderizar cada marca como `<Link href={`/marca/${marca.slug}`}>` con nombre y contador accesible, usando solo tokens Tailwind existentes.

Modificar `OfertasSection` para recibir solo productos, cambiar el título a `Productos destacados`, eliminar la dependencia de categorías y mantener cards `featured` en grid responsive.

Crear `NuevosProductosSection` con `ProductGrid variant="compact"`, título `Nuevos productos`, retorno `null` para lista vacía y el mismo patrón de animación local.

Modificar `ProductGrid` para aceptar `variant` opcional. Modificar `ProductCard` para que `href` sea `/producto/${producto.slug}` y cambiar el badge siempre verdadero actual (`producto.precio > 0`) por un badge que solo aparezca cuando `producto.destacado` sea true.

- [ ] **Step 4: Ejecutar pruebas de componentes y confirmar GREEN**

Ejecutar el mismo comando de pruebas de componentes.

Esperado: PASS, con enlaces de marca y producto correctos y sin marcas estáticas.

- [ ] **Step 5: Integrar las derivaciones en Home**

Modificar `src/app/page.tsx` para que solo consulte `safeFetchConfig()` y `listarProductosActivos()`. Derivar `destacados`, `nuevos` y `marcas` mediante `separarProductosHome` y `resumirMarcas`. El árbol final debe ser exactamente:

```tsx
<Hero config={config} />
<MarcasSection marcas={marcas} />
<OfertasSection productos={destacados} />
<NuevosProductosSection productos={nuevos} />
<BeneficiosSection />
<section aria-label="Reparaciones">
  <div className="mx-auto max-w-[1200px] px-4 py-12 sm:py-16">
    <div className="rounded-cards bg-navy-deep px-6 py-10 text-center text-fog-white sm:px-16">
      <h2>¿Necesitas reparar tu celular?</h2>
      <p>Servicio técnico profesional. Diagnóstico gratis y repuestos originales.</p>
      <Link href="/reparaciones">Ver servicios</Link>
    </div>
  </div>
</section>
```

Eliminar imports y JSX de `CategoryGrid`, `SearchInput` y `listarCategoriasPublic` del Home. Cambiar el CTA del Hero a `#destacados` y conservar el Footer global del layout.

- [ ] **Step 6: Limpiar el efecto invasivo del teléfono**

En `Hero.tsx`, eliminar imports de `useRef`, `useEffect`, `gsap` y `ScrollTrigger`, refs de imágenes, estado `reducedMotion` y la capa `fixed` con `Armado1.png`, `Desarmadom1.png` y `Desarmado1.png`. Mantener `PhoneStack` dentro de la columna visual y `overflow-hidden` en la sección Hero. Eliminar `PhoneScrollReveal.tsx` porque no tiene imports y contiene el patrón invasivo que ya no debe permanecer disponible.

- [ ] **Step 7: Corregir navegación y densidad**

En `Header.tsx`, usar `Catálogo -> /categoria`, `Marcas -> /#marcas` y `Destacados -> /#destacados`. En `CategoryPill.tsx`, construir `/categoria/${slug}`. Reducir padding de las secciones nuevas a la escala compacta aprobada y conservar grids 2/3/4 para productos y 2/3/6 para marcas. No usar hex directo nuevo.

- [ ] **Step 8: Ejecutar toda la suite de componentes y revisar el árbol Home**

Ejecutar `npm test -- tests/components tests/lib/home-sections.test.ts tests/lib/brands.test.ts`, luego `npx tsc --noEmit`.

Esperado: PASS y ningún uso de `Compra por categoría`, `MARCAS` ni `position: fixed` en el Hero storefront. Verificar con búsqueda:

```powershell
rg "Compra por categor|const MARCAS|fixed inset-0|PhoneScrollReveal" src
```

La única coincidencia aceptable de `fixed` será una superficie no relacionada con el teléfono, como navegación móvil o CTA de producto existente.

---

### Task 5: Verificación integral, QA responsive y evidencia

**Files:**
- Modify: `tasks.md`
- Create: `docs/superpowers/reports/2026-08-03-auditoria-admin-firestore-home-marcas.md`
- QA evidence: `qa/reports/` (no versionar capturas ni reportes generados)

**Interfaces:**
- La validación de navegador usa el usuario administrador de pruebas del entorno, nunca credenciales de producción ni credenciales escritas en el repositorio.
- El reporte final documenta comandos, resultados, rutas, viewport y cualquier bloqueo operativo.

- [ ] **Step 1: Ejecutar pruebas automatizadas completas**

Ejecutar, en este orden:

```powershell
npm test
npx tsc --noEmit
npm run lint
```

Esperado: las tres órdenes terminan sin fallos. Si aparece un fallo, volver al task que lo introdujo y corregirlo antes de continuar.

- [ ] **Step 2: Verificar el build**

Ejecutar `npm run build` y esperar a que termine el build Turbopack completo. Registrar en el reporte el resultado exacto. Si el build falla por una credencial Firebase ausente, separar ese bloqueo de los fallos de código y conservar la salida como evidencia.

- [ ] **Step 3: Crear o verificar el producto de prueba en el navegador**

Con Playwright MCP, abrir `/admin/productos`, entrar al formulario de nuevo producto y usar un usuario admin de pruebas del entorno. Crear o actualizar `iPhone 17 Pro Max` con marca `Apple`, categoría `Celulares`, precio COP válido, stock positivo, imagen, `Activo` y `Destacado` activos. Esperar la redirección al listado y confirmar el producto en la tabla admin.

- [ ] **Step 4: Verificar el flujo público completo**

Con Playwright MCP, navegar y capturar evidencia de:

- `/`: Home sin HTTP 500, Apple con contador, producto en Productos destacados, Nuevos productos si corresponde, reparaciones debajo de beneficios.
- `/buscar?q=iPhone%2017%20Pro%20Max`: producto visible.
- `/buscar?marca=Apple`: solo productos Apple activos.
- `/categoria/celulares`: producto visible en catálogo.
- `/marca/apple`: título, contador y solo productos Apple activos.
- `/producto/iphone-17-pro-max`: ficha real sin 404.

Comprobar con `browser_console_messages` que no haya errores de serialización ni errores de página.

- [ ] **Step 5: Verificar responsive y confinamiento visual**

Usar `browser_resize` en 1440x900, 1024x768 y 390x844. En cada viewport comprobar:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

Tomar capturas de Home desktop, tablet y mobile. Verificar que las imágenes del teléfono solo estén dentro de la sección Hero y que no exista un elemento del teléfono con `position: fixed`.

- [ ] **Step 6: Verificar reduced motion y navegación**

Emular `prefers-reduced-motion: reduce`, recargar Home y confirmar que no se ejecutan transiciones invasivas. Navegar con teclado por marca Apple, tarjeta de producto y CTA de catálogo; comprobar foco visible y nombres accesibles.

- [ ] **Step 7: Registrar evidencia y estado de tareas**

Crear `docs/superpowers/reports/2026-08-03-auditoria-admin-firestore-home-marcas.md` con:

- diagnóstico confirmado y causa raíz;
- flujo Admin -> Firestore -> Home;
- colección y campos persistidos;
- filtros `activo`, `destacado`, stock y marca;
- archivos modificados;
- comandos automatizados y resultados;
- rutas verificadas;
- viewports verificados;
- capturas generadas;
- bloqueos externos, como despliegue pendiente del índice Firebase.

Agregar en `tasks.md` una sección `Auditoría Admin-Firestore-Home-Marcas` y dejarla en estado `revisión` hasta completar el ciclo de autocrítica.

- [ ] **Step 8: Ejecutar el chequeo final de cambios**

Ejecutar `git status --short`, `git diff --stat` y `git diff --check`. Revisar que solo estén los archivos de esta auditoría y la especificación/plan aprobados; no revertir ni modificar cambios ajenos.

## Self-review del plan

- La causa raíz del `Timestamp` se prueba antes de cambiar el mapper.
- La persistencia de `tieneVariantes` y `atributosDisponibles` se prueba antes de cambiar los servicios.
- Marcas, destacados y nuevos tienen funciones puras y tests independientes.
- Búsqueda, metadata, JSON-LD, sitemap y ruta `/marca/[slug]` usan las rutas reales.
- El índice `activo + creadoEn` está incluido explícitamente.
- Home elimina categoría hardcodeada y deriva todo el inventario desde `productos`.
- El efecto fixed del teléfono se elimina y se verifica por navegador.
- La matriz de aceptación cubre Home, destacados, búsqueda, catálogo, contador, filtro y responsive.
- No quedan placeholders de implementación ni decisiones condicionales sin resolver.
