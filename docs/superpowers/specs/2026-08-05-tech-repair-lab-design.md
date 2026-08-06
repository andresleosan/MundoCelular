# Home Tech Repair Lab — Diseño Vision X

**Fecha:** 2026-08-05
**Estado:** aprobado por el operador para planificación
**Nivel:** 2
**Alcance:** evolución de la home sin migración de framework ni cambio de backend

## Contexto

Mundo Celular ya tiene una identidad visual diferenciada: `PhoneStack` como teléfono principal, un fondo tecnológico con las composiciones `Armado1.png`, `Desarmadom1.png` y `Desarmado1.png`, y una timeline GSAP que desmonta y vuelve a ensamblar el dispositivo.

La experiencia actual concentra la transición en el hero. Esta fase la convierte en el hilo conductor de la home, conectando catálogo, diagnóstico y reparaciones sin eliminar ni reemplazar los activos existentes.

## Objetivos

- Mantener el celular principal como protagonista visual.
- Mantener el efecto de desarme y rearme existente.
- Extender la narrativa a toda la home.
- Presentar Mundo Celular como laboratorio tecnológico y servicio técnico profesional.
- Mantener SEO, SSR/ISR, responsive, accesibilidad y rendimiento.
- Reutilizar GSAP, Framer Motion y los tokens actuales sin instalar Lenis ni otra librería.

## No objetivos

- No reemplazar el hero por un mockup o render externo.
- No rediseñar desde cero el storefront.
- No migrar el framework ni el modelo de datos.
- No implementar backend de Titan AI.
- No crear un diagnóstico real conectado a sensores o servicios externos.
- No crear un comparador de productos en esta fase.
- No modificar Firebase, Firestore, pedidos, autenticación ni reglas.

## Arquitectura

Se incorporará un contenedor cliente `TechLabNarrative` alrededor de la experiencia de la home, desde el hero hasta el CTA de reparaciones.

- `Hero` conserva sus assets, su `PhoneStack` y su responsabilidad visual principal.
- La timeline GSAP usa el límite del contenedor narrativo para distribuir el progreso en toda la experiencia.
- El progreso se expone con variables CSS y atributos `data-tech-phase`; no se actualizará estado React por cada evento de scroll.
- El scroll seguirá siendo nativo, sin scroll hijacking.
- El fondo del dispositivo permanece fijo mientras el contenido avanza.
- La composición desarmada existente será la fuente visual de las fases técnicas; los énfasis serán overlays, líneas y etiquetas, no renders inventados.

## Fases narrativas

1. `assembly`: dispositivo ensamblado y presentación.
2. `display`: separación y análisis de pantalla.
3. `battery`: énfasis de batería y energía.
4. `camera`: énfasis del sistema de cámaras.
5. `processor`: énfasis del procesador y rendimiento.
6. `board`: énfasis de placa principal y conexiones.
7. `reassembly`: salida de componentes y rearme completo.

Las fases de componentes se comunicarán con indicadores técnicos y copy contextual. La imagen explotada seguirá siendo la composición principal mientras las zonas relevantes sean señaladas.

## Componentes

### `TechLabNarrative`

Contenedor cliente que mide el progreso, coordina la timeline y expone la fase visual. No contiene lógica de catálogo ni datos de negocio.

### `TechLabPhaseIndicator`

Indicador visible de fase actual con `aria-current`. Mantiene una versión estática y legible cuando las animaciones están desactivadas.

### `TechLabCallouts`

Etiquetas de pantalla, batería, cámaras, procesador y placa. Sus posiciones deben responder a breakpoints y no bloquear botones ni texto.

### `TechCenterSection`

Evolución de `BeneficiosSection` hacia el Centro Tecnológico. Conserva los mensajes de confianza existentes y los reorganiza alrededor de diagnóstico, reparación, garantía, repuestos y atención.

### `DiagnosticPanel`

Checklist visual demostrativo con pantalla, cámara, batería, sensores, software y puerto de carga. El escaneo es una representación de interfaz y no una afirmación de diagnóstico real.

### `RepairJourney`

Timeline semántica de recepción, diagnóstico, presupuesto, reparación y entrega. Sus CTA reutilizan rutas y configuración actuales.

El tilt 3D avanzado de `ProductCard` no forma parte del primer corte narrativo para evitar mezclar dos objetivos de interacción.

## Sistema visual

- Se conserva la paleta navy/cian activa.
- Navy base y profundo forman la estructura y el contraste.
- Cian se reserva para glow, escaneo, líneas, estados y reflejos.
- Sora se usa en títulos y fases.
- Inter se usa en lectura y navegación.
- JetBrains Mono se usa en datos técnicos y códigos.
- Las tarjetas usan bordes finos, sombras profundas y reflejos controlados.
- Las líneas, nodos y coordenadas deben comunicar diagnóstico, no decoración gratuita.
- Se evitan bento genérico, glassmorphism total, gradientes excesivos y paneles falsos de IA.

## Responsive y accesibilidad

- Desktop conserva la composición cinematográfica completa.
- Mobile reduce la distancia total de scroll y prioriza la lectura.
- No se depende de hover para descubrir información.
- Se mantienen foco visible, HTML semántico y controles navegables por teclado.
- `prefers-reduced-motion` muestra contenido completo sin timeline, tilt ni escaneo animado.
- El significado de una fase no depende únicamente del color.

## Datos, errores y seguridad

- Productos y configuración continúan llegando desde los Server Components actuales.
- Las fases y el checklist son constantes locales.
- No se agregan endpoints ni escrituras Firestore.
- Si la lectura de productos falla, las secciones narrativas y de reparación siguen renderizando.
- No se introducen credenciales, datos personales ni integraciones externas.

## Verificación

### Tests automatizados

- Tests unitarios del mapeo progreso → fase.
- Tests de `TechCenterSection`, `DiagnosticPanel` y `RepairJourney`.
- Tests del hero para armado inicial, fases y rearme final.
- `npm test`.
- `npx tsc --noEmit`.
- `npm run lint`.
- `npm run build`.

### QA navegador

Validar en `1440x900`, `1024x768` y `390x844`:

- Teléfono armado al inicio.
- Fases intermedias durante el scroll.
- Rearme completo al final.
- Sin overflow horizontal.
- Sin errores de consola.
- CTA de reparaciones y WhatsApp funcionales.
- Fallback correcto con reduced motion.

### Rendimiento

- No instalar Lenis.
- No añadir un canvas permanente.
- Medir Lighthouse antes y después.
- Mantener Performance >= 90, SEO >= 95 y accesibilidad >= 95.

## Criterios de aceptación

- El `PhoneStack` existente sigue visible y es el protagonista del hero.
- Las tres composiciones existentes continúan siendo usadas por el desarme/rearme.
- La home comunica al menos las siete fases sin depender de un backend nuevo.
- Centro Tecnológico, Diagnóstico y Repair Journey se sienten conectados a la misma estructura visual.
- El final del recorrido deja el dispositivo completamente armado.
- La experiencia sigue siendo usable con reduced motion, teclado, touch y mobile.
- No se rompen rutas, metadata, JSON-LD, carrito, checkout ni autenticación.
- La suite, TypeScript, lint, build y QA navegador entregan evidencia antes de marcar la tarea aprobada.
