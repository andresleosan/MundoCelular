# Baseline De Rendimiento — Home Tech Repair Lab

**Fecha:** 2026-08-05
**Build:** Next.js 16.3.0, `npm run build` + `npm run start -- -p 3102`
**Ruta:** `/`
**Herramienta:** Lighthouse 13.4.1, form factor mobile, viewport 412x823

## Medición

| Base | Performance | LCP | TBT | Main thread |
|---|---:|---:|---:|---:|
| `http://localhost:3102` | 74 | 7.74 s | 127 ms | 20.11 s |
| `https://mundocelular.vercel.app` | 74 | 7.56 s | 127 ms | 18.78 s |

La medición desktop local de esta implementación obtuvo Performance 95.

## Diagnóstico

- La producción pública y el build local presentan el mismo score mobile.
- Lighthouse reporta un listener persistente de Firestore durante la navegación.
- La carga incluye scripts de Google Auth y el entorno simulado móvil aumenta significativamente el costo de main thread.
- La implementación Vision X no agregó endpoints, dependencias ni una regresión medible frente a producción.

## Estado

El objetivo de Performance mobile >=90 permanece abierto como trabajo separado. No se bloquea esta conclusión atribuyendo el problema a los componentes Tech Repair Lab sin una medición controlada de una optimización específica.

## Iteraciones Controladas

Después del baseline se probaron optimizaciones aisladas sobre el cliente global:

| Cambio | Performance | LCP | TBT | Main thread | Observación |
|---|---:|---:|---:|---:|---|
| `ConfigProvider` difiere Firestore | 76 | 6.38 s | 138 ms | 19.70 s | Mejoró LCP frente a 7.74 s |
| `AuthProvider` difiere listener | 77 | 6.36 s | 91 ms | 16.76 s | Redujo trabajo de autenticación |
| GSAP/ScrollTrigger en carga idle | 77 | 6.21 s | 98 ms | 12.57 s | Redujo CPU; score sigue bajo |

Las tres mediciones locales reportaron el warning de Lighthouse de carga demasiado lenta y resultados potencialmente incompletos. Por eso sirven como evidencia direccional, no como aprobación del objetivo >=90. La carga de GSAP quedó fuera del bundle inicial y la autenticación/configuración conservan pruebas automatizadas.

## Iteración De Assets

Se migraron las tres capas visuales del Hero a `next/image` con `sizes` responsive y se difirieron las dos capas ocultas hasta preparar GSAP:

| Estado | Performance | LCP | TBT | Main thread | Transferencia |
|---|---:|---:|---:|---:|---:|
| Antes de assets responsive | 77 | 6.21 s | 98 ms | 12.57 s | 1.59 MiB |
| `next/image` + capas diferidas | 79 | 5.75 s | 86 ms | 9.55 s | 1.15 MiB |
| GSAP después de `load` + 1 s | 78 | 5.75 s | 108 ms | 9.77 s | 1.15 MiB |

La transferencia visual bajó de aproximadamente 1.63 MB a 1.02 MB en una corrida inicial; con la configuración extendida de Lighthouse la corrida comparable registró 1.15 MiB. El score >=90 sigue sin estar demostrado.

## Iteración LCP SSR y WebP

El estado ensamblado ahora se renderiza desde SSR para que el recurso LCP exista en el HTML inicial. Las tres capas conservan las imágenes originales en `public/` y usan derivados WebP optimizados en el Hero.

| Estado | Performance | LCP | Main thread | Transferencia | Warning Lighthouse |
|---|---:|---:|---:|---:|---|
| SSR del estado ensamblado, CPU 4x | 84 | 4.37 s | 9.50 s | 1.15 MiB | Sí |
| SSR + derivados WebP, CPU 4x | 78 | 5.49 s | 9.59 s | 1.02 MiB | Sí |
| SSR + derivados WebP, CPU 1x | 86 | 4.24 s | 2.54 s | 1.02 MiB | Sí |

El WebP reduce transferencia, pero la variación del entorno Lighthouse impide afirmar una mejora de score bajo CPU 4x. El objetivo >=90 permanece abierto.

## Medición Controlada Y LCP Directo

Con la misma configuración mobile y CPU 4x se ejecutaron tres corridas consecutivas antes de servir directamente el recurso LCP:

| Corrida | Performance | LCP | TBT | Main thread | Transferencia |
|---|---:|---:|---:|---:|---:|
| 1 | 85 | 4.34 s | 106 ms | 9.66 s | 1.04 MB |
| 2 | 82 | 4.37 s | 200 ms | 10.01 s | 1.04 MB |
| 3 | 85 | 4.30 s | 91 ms | 9.34 s | 1.04 MB |
| Mediana | **85** | **4.34 s** | **106 ms** | **9.66 s** | **1.04 MB** |

Después se sirvió `Armado1.webp` directamente, sin `/_next/image`. La corrida disponible obtuvo Performance 84, LCP 4.35 s y redujo la duración de carga del recurso LCP de aproximadamente 3.07 s a 2.58 s. La segunda corrida no pudo completarse por `Session closed` y `EPERM` de Chrome, por lo que no se adopta como nueva mediana.

## Auth Bajo Demanda

La Home pública dejó de activar Firebase Auth automáticamente. `AuthProvider` expone `activarAuth()` y solo se invoca desde Header, LoginForm, Checkout, cuenta y `AdminGuard`. En tres corridas controladas posteriores:

| Corrida | Performance | LCP | TBT | Main thread | Transferencia | Iframe Auth |
|---|---:|---:|---:|---:|---:|---|
| 1 | 83 | 4.27 s | 173 ms | 8.85 s | 926 KB | No |
| 2 | 84 | 4.34 s | 119 ms | 8.78 s | 927 KB | No |
| 3 | 79 | 5.49 s | 82 ms | 8.80 s | 927 KB | No |
| Mediana | **83** | **4.34 s** | **119 ms** | **8.80 s** | **927 KB** | **No** |

El cambio reduce aproximadamente 114 KB y 0.86 s de main thread frente a la mediana anterior. `authActiva` evita que rutas protegidas redirijan antes de resolver la sesión.

## Split Firebase Y Tooltip Admin

Se completó la separación del grafo cliente:

- `firebase/auth` y `firebase/firestore` pasan a imports dinámicos.
- `AuthProvider` carga Auth solo después de `activarAuth()`.
- `ConfigProvider` carga Firestore solo al leer configuración.
- `TooltipProvider` salió del layout global y quedó limitado al layout admin.

Tres corridas posteriores, con CPU 4x y sin warnings de Lighthouse:

| Corrida | Performance | LCP | TBT | Main thread | Transferencia |
|---|---:|---:|---:|---:|---:|
| 1 | 87 | 4.03 s | 32 ms | 0.69 s | 502 KB |
| 2 | 87 | 4.10 s | 58 ms | 1.12 s | 502 KB |
| 3 | 87 | 4.01 s | 23 ms | 0.82 s | 503 KB |
| Mediana | **87** | **4.03 s** | **32 ms** | **0.82 s** | **502 KB** |

La Home pública no solicita Auth, Firestore ni el iframe de Google Auth. El objetivo >=90 permanece abierto, pero el bundle inicial ya no contiene esas dependencias globales.

## Fuentes

Se retiró `Geist` del layout porque `font-sans` ya apunta explícitamente a Inter en `globals.css`. La Home pasó de solicitar cinco fuentes a tres. Una corrida posterior observó 838 KB totales y tres archivos WOFF2, pero mostró nuevamente el warning de Lighthouse; no reemplaza la mediana estable anterior.

## Variante Mobile Del LCP

`Armado1.webp` ahora usa un `<picture>` con `Armado1-mobile.webp` para viewport mobile. Las dos corridas válidas posteriores registraron Performance 88 y LCP aproximado de 3.81 s; el recurso mobile pasó de 25 KB a 16.5 KB tras reducirlo a 384 px. Las corridas posteriores siguen sujetas al warning de Chrome, por lo que el objetivo >=90 continúa abierto sin declararlo alcanzado.

También se retiró el peso Inter 300, no utilizado por ninguna clase del código. Una corrida posterior con la variante final observó Performance 88 y LCP 3.73 s, sin evidencia suficiente para cambiar la mediana estable ni cerrar el objetivo >=90.

## Control Posterior — 2026-08-06

Se verificó una optimización adicional enfocada en el trabajo de carga inicial:

- `ConfigProvider` ya no abre Firestore en `/`; mantiene el fallback y carga la configuración remota solo en rutas que la consumen.
- GSAP y las capas ocultas del Hero se inicializan únicamente después del primer scroll.
- Corrida controlada mobile con viewport 412x823, CPU 4x y red 10 Mbps: Performance `77`, LCP `1.79 s`, TBT `1.05 s`, Speed Index `1.92 s`.
- Esta corrida no mostró `Firestore/Listen`, pero Lighthouse terminó con el error conocido de Chrome `EPERM` al limpiar el perfil temporal. No reemplaza las mediciones estables previas ni cierra el objetivo `>=90`.
