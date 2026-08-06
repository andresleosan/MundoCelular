# Home Tech Repair Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la home existente en una narrativa Tech Repair Lab donde el teléfono actual se desarma, revela sus componentes y vuelve a ensamblarse, conectando catálogo, diagnóstico y reparaciones.

**Architecture:** Un contenedor cliente `TechLabNarrative` envolverá la experiencia de la home. `Hero` conservará el teléfono, los tres assets y GSAP, pero usará el límite del contenedor para distribuir el progreso. El progreso se comunicará con variables CSS, atributos `data-tech-phase` y eventos únicamente en los cambios de fase; los nuevos paneles serán principalmente estáticos y no agregarán backend.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, GSAP 3.15, Framer Motion ya instalado, Vitest 4, Testing Library, Playwright MCP cuando esté habilitado.

## Global Constraints

- Mantener `PhoneStack` como protagonista visual del hero.
- Mantener `Armado1.png`, `Desarmadom1.png` y `Desarmado1.png`.
- Mantener desarme y rearme GSAP; no reemplazarlo por un mockup, canvas permanente o render externo.
- Mantener scroll nativo; no instalar Lenis ni otra librería.
- No agregar endpoints, escrituras Firestore, migraciones, credenciales ni backend de Titan AI.
- Mantener SEO, SSR/ISR, JSON-LD, carrito, checkout, autenticación y rutas existentes.
- `prefers-reduced-motion` debe mostrar contenido completo sin timeline, tilt ni escaneo animado.
- Mobile no puede depender de hover y no puede presentar overflow horizontal.
- Usar tokens de `globals.css`; no multiplicar hex inline en componentes nuevos.
- Verificar con `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` y QA navegador.
- No hacer commits, despliegues ni mutaciones remotas sin solicitud explícita del operador.

## File Map

### Archivos nuevos

- `src/components/storefront/tech-lab/phases.ts`: tipos, fases, rangos y sincronización DOM del progreso.
- `src/components/storefront/tech-lab/TechLabNarrative.tsx`: wrapper cliente de la experiencia.
- `src/components/storefront/tech-lab/TechLabPhaseIndicator.tsx`: indicador accesible de fase.
- `src/components/storefront/tech-lab/TechLabCallouts.tsx`: etiquetas técnicas sobre la composición existente.
- `src/components/storefront/tech-lab/TechCenterSection.tsx`: Centro Tecnológico.
- `src/components/storefront/tech-lab/DiagnosticPanel.tsx`: checklist de diagnóstico demostrativo.
- `src/components/storefront/tech-lab/RepairJourney.tsx`: timeline semántica de reparación.
- `tests/components/storefront/tech-lab/phases.test.ts`: pruebas puras de fases y progreso.
- `tests/components/storefront/tech-lab/TechLabPhaseIndicator.test.tsx`: pruebas de estado accesible.
- `tests/components/storefront/tech-lab/TechCenterSection.test.tsx`: pruebas de contenido y roles.
- `tests/components/storefront/tech-lab/DiagnosticPanel.test.tsx`: pruebas de checklist y reduced motion.
- `tests/components/storefront/tech-lab/RepairJourney.test.tsx`: pruebas de pasos y CTA.

### Archivos existentes a modificar

- `src/components/storefront/Hero.tsx`: conectar la timeline al wrapper, publicar fase/progreso e incluir indicadores.
- `src/app/page.tsx`: envolver la home y sustituir beneficios por las secciones Tech Repair Lab.
- `src/app/globals.css`: agregar únicamente tokens/selectores de fase y motion necesarios.
- `tests/components/storefront/Hero.test.tsx`: cubrir el trigger narrativo y la publicación de rearme/fases.
- `tests/lib/home-sections.test.ts`: preservar contrato de composición de la home.

---

### Task 1: Modelo De Fases Y Wrapper Narrativo

**Files:**
- Create: `src/components/storefront/tech-lab/phases.ts`
- Create: `src/components/storefront/tech-lab/TechLabNarrative.tsx`
- Create: `tests/components/storefront/tech-lab/phases.test.ts`

**Interfaces:**
- Produces `TechPhaseId`, `TECH_LAB_PHASES`, `phaseFromProgress(progress: number): TechPhaseId` y `publishTechLabProgress(root: HTMLElement, progress: number): void`.
- `TechLabNarrative` consumes `children: React.ReactNode` y produce un `<div data-tech-lab-narrative data-tech-phase="assembly">`.

- [ ] **Step 1: Escribir pruebas puras que fallen**

```ts
import { describe, expect, it } from "vitest";
import { phaseFromProgress, publishTechLabProgress } from "@/components/storefront/tech-lab/phases";

describe("phaseFromProgress", () => {
  it("mantiene assembly al inicio y reassembly al final", () => {
    expect(phaseFromProgress(0)).toBe("assembly");
    expect(phaseFromProgress(1)).toBe("reassembly");
  });

  it("clampa valores fuera del rango", () => {
    expect(phaseFromProgress(-1)).toBe("assembly");
    expect(phaseFromProgress(2)).toBe("reassembly");
  });
});

it("publica el progreso sin actualizar estado React", () => {
  const root = document.createElement("div");
  publishTechLabProgress(root, 0.5);
  expect(root.dataset.techPhase).toBe("camera");
  expect(root.style.getPropertyValue("--tech-progress")).toBe("0.5");
});
```

- [ ] **Step 2: Ejecutar las pruebas para verificar que fallan**

Run: `npx vitest run tests/components/storefront/tech-lab/phases.test.ts`

Expected: FAIL porque el módulo y sus funciones aún no existen.

- [ ] **Step 3: Implementar el modelo mínimo**

Definir exactamente estos siete rangos ordenados: `assembly` `0.00..0.10`, `display` `0.10..0.24`, `battery` `0.24..0.38`, `camera` `0.38..0.54`, `processor` `0.54..0.68`, `board` `0.68..0.84` y `reassembly` `0.84..1.00`. `phaseFromProgress` debe hacer clamp a `0..1`. `publishTechLabProgress` debe escribir `--tech-progress`, actualizar `data-tech-phase` y emitir `techlabphasechange` solo cuando la fase cambie.

- [ ] **Step 4: Implementar el wrapper**

Crear `TechLabNarrative` con una referencia al elemento raíz y `data-tech-phase="assembly"`. El wrapper no debe usar Firebase, `useState` para progreso ni escuchar scroll por separado.

- [ ] **Step 5: Ejecutar la prueba enfocada**

Run: `npx vitest run tests/components/storefront/tech-lab/phases.test.ts`

Expected: PASS.

### Task 2: Integración GSAP, Indicador Y Callouts

**Files:**
- Modify: `src/components/storefront/Hero.tsx`
- Modify: `tests/components/storefront/Hero.test.tsx`
- Create: `src/components/storefront/tech-lab/TechLabPhaseIndicator.tsx`
- Create: `src/components/storefront/tech-lab/TechLabCallouts.tsx`
- Create: `tests/components/storefront/tech-lab/TechLabPhaseIndicator.test.tsx`

**Interfaces:**
- `Hero` encuentra el ancestro `[data-tech-lab-narrative]` desde su sección y llama `publishTechLabProgress` desde `ScrollTrigger.onUpdate`.
- `TechLabPhaseIndicator` consume `TECH_LAB_PHASES` y escucha `techlabphasechange`; actualiza estado solo cuando cambia la fase.
- `TechLabCallouts` renderiza las cinco etiquetas técnicas y usa `data-tech-phase` del ancestro para visibilidad CSS.

- [ ] **Step 1: Extender el mock GSAP y escribir pruebas que fallen**

Agregar `eventCallback` al timeline falso y probar que el hero conserva las tres imágenes, busca el wrapper narrativo y publica el rearme final sin alterar los ocho movimientos existentes.

```ts
expect(timelineTo).toHaveBeenCalledWith(
  expect.objectContaining({ getAttribute: expect.any(Function) }),
  expect.objectContaining({ opacity: 1, scale: 1, duration: 0.2 }),
  0.8,
);
```

Para `TechLabPhaseIndicator`, verificar que `assembly` tiene `aria-current="step"` al montar y que el evento `techlabphasechange` cambia el atributo a `camera`.

- [ ] **Step 2: Ejecutar pruebas enfocadas para verificar que fallan**

Run: `npx vitest run tests/components/storefront/Hero.test.tsx tests/components/storefront/tech-lab/TechLabPhaseIndicator.test.tsx`

Expected: FAIL en el evento de fase y el nuevo indicador.

- [ ] **Step 3: Modificar la timeline sin reemplazarla**

En `Hero.tsx`, conservar las referencias y las ocho llamadas actuales. Resolver:

```ts
const narrativeRoot = ref.current?.closest<HTMLElement>("[data-tech-lab-narrative]") ?? ref.current;
```

Usar `narrativeRoot` como `ScrollTrigger.trigger`, terminar con `end: "bottom bottom"`, y publicar el progreso en `onUpdate`. Inicializar `assembly` y limpiar el contexto GSAP al desmontar.

- [ ] **Step 4: Implementar indicador y callouts**

El indicador debe usar botones o elementos no interactivos según el diseño final, texto visible y `aria-current`. Los callouts deben tener `pointer-events-none`, posiciones relativas al visual y una variante legible para mobile. No agregar SVG o imágenes nuevas.

- [ ] **Step 5: Agregar selectores de fase en CSS**

Agregar reglas acotadas a `[data-tech-lab-narrative]` para mostrar el callout de la fase activa y ocultar los demás. Respetar `@media (prefers-reduced-motion: reduce)` y no aplicar transformaciones a contenido que deba permanecer legible.

- [ ] **Step 6: Ejecutar pruebas enfocadas**

Run: `npx vitest run tests/components/storefront/Hero.test.tsx tests/components/storefront/tech-lab/TechLabPhaseIndicator.test.tsx`

Expected: PASS.

### Task 3: Centro Tecnológico

**Files:**
- Create: `src/components/storefront/tech-lab/TechCenterSection.tsx`
- Create: `tests/components/storefront/tech-lab/TechCenterSection.test.tsx`

**Interfaces:**
- `TechCenterSection` no recibe datos remotos y exporta un `<section id="centro-tecnologico" aria-label="Centro Tecnológico Mundo Celular">`.
- Debe exponer exactamente los cinco bloques aprobados: diagnóstico profesional, reparación certificada, garantía real, repuestos originales y atención especializada.

- [ ] **Step 1: Escribir la prueba de contenido y accesibilidad**

```tsx
it("presenta los cinco servicios del Centro Tecnológico", () => {
  render(<TechCenterSection />);
  expect(screen.getByRole("region", { name: "Centro Tecnológico Mundo Celular" })).toBeInTheDocument();
  for (const label of [
    "Diagnóstico profesional",
    "Reparación certificada",
    "Garantía real",
    "Repuestos originales",
    "Atención especializada",
  ]) {
    expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
  }
});
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Run: `npx vitest run tests/components/storefront/tech-lab/TechCenterSection.test.tsx`

Expected: FAIL porque el componente aún no existe.

- [ ] **Step 3: Implementar el componente**

Usar un arreglo local tipado con los cinco bloques, `Icon` para iconos SVG existentes y la jerarquía navy/cian. Mantener copy factual; no afirmar certificaciones o repuestos que no estén respaldados por el contenido actual sin señalarlos como propuesta de copy.

- [ ] **Step 4: Ejecutar la prueba**

Run: `npx vitest run tests/components/storefront/tech-lab/TechCenterSection.test.tsx`

Expected: PASS.

### Task 4: Centro De Diagnóstico

**Files:**
- Create: `src/components/storefront/tech-lab/DiagnosticPanel.tsx`
- Create: `tests/components/storefront/tech-lab/DiagnosticPanel.test.tsx`

**Interfaces:**
- `DiagnosticPanel` exporta una sección con el encabezado `Centro de Diagnóstico` y seis checks: pantalla, cámara, batería, sensores, software y puerto de carga.
- No recibe props ni llama APIs en esta fase.

- [ ] **Step 1: Escribir pruebas que fallen**

```tsx
it("muestra los seis puntos y explica el alcance de la revisión", () => {
  render(<DiagnosticPanel />);
  expect(screen.getByRole("region", { name: "Centro de Diagnóstico" })).toBeInTheDocument();
  for (const label of ["Pantalla", "Cámara", "Batería", "Sensores", "Software", "Puerto de carga"]) {
    expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
  }
  expect(screen.getByText(/revisión inicial/i)).toBeInTheDocument();
  expect(screen.queryByText(/✅/)).toBeNull();
});
```

- [ ] **Step 2: Ejecutar prueba enfocada**

Run: `npx vitest run tests/components/storefront/tech-lab/DiagnosticPanel.test.tsx`

Expected: FAIL porque el componente aún no existe.

- [ ] **Step 3: Implementar el panel**

Renderizar la lista con `Icon name="check"`, un estado inicial completo y una línea de escaneo decorativa. La línea debe estar oculta o estática con reduced motion. El CTA debe enlazar a `/reparaciones` y no prometer un diagnóstico automático real.

- [ ] **Step 4: Ejecutar prueba enfocada**

Run: `npx vitest run tests/components/storefront/tech-lab/DiagnosticPanel.test.tsx`

Expected: PASS.

### Task 5: Repair Journey

**Files:**
- Create: `src/components/storefront/tech-lab/RepairJourney.tsx`
- Create: `tests/components/storefront/tech-lab/RepairJourney.test.tsx`

**Interfaces:**
- `RepairJourney` exporta una sección `aria-label="Proceso de reparación"`.
- Renderiza en orden: recepción, diagnóstico, presupuesto, reparación y entrega.
- Incluye un CTA a `/contacto` o `/reparaciones` sin crear una ruta nueva.

- [ ] **Step 1: Escribir prueba de orden y enlace**

```tsx
it("muestra las cinco etapas en orden y un CTA existente", () => {
  render(<RepairJourney />);
  const region = screen.getByRole("region", { name: "Proceso de reparación" });
  expect(region.textContent).toMatch(/Recepción.*Diagnóstico.*Presupuesto.*Reparación.*Entrega/s);
  expect(screen.getByRole("link", { name: /ver servicios/i })).toHaveAttribute("href", "/reparaciones");
});
```

- [ ] **Step 2: Ejecutar prueba para verificar que falla**

Run: `npx vitest run tests/components/storefront/tech-lab/RepairJourney.test.tsx`

Expected: FAIL porque el componente aún no existe.

- [ ] **Step 3: Implementar timeline semántica**

Usar `<ol>` para las etapas, títulos claros, conectores CSS no esenciales y un CTA con la misma convención de botones de la home. La lectura debe funcionar aunque se eliminen conectores y animaciones.

- [ ] **Step 4: Ejecutar prueba enfocada**

Run: `npx vitest run tests/components/storefront/tech-lab/RepairJourney.test.tsx`

Expected: PASS.

### Task 6: Composición De La Home Y Tokens

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/lib/home-sections.test.ts`

**Interfaces:**
- `Home` conserva `JsonLd`, `Hero`, lecturas de productos, marcas, ofertas y nuevos productos.
- La home renderiza `TechLabNarrative` desde `Hero` hasta el CTA de reparaciones.
- `BeneficiosSection` deja de ser la sección principal de beneficios; `TechCenterSection`, `DiagnosticPanel` y `RepairJourney` pasan a formar parte de la narrativa.

- [ ] **Step 1: Extender prueba de composición**

Verificar que el render de la home sigue incluyendo hero, catálogo, marcas, Centro Tecnológico, diagnóstico, journey y reparaciones, y que el fallback `errorProductos` no impide las secciones estáticas.

- [ ] **Step 2: Ejecutar prueba para verificar que falla**

Run: `npx vitest run tests/lib/home-sections.test.ts`

Expected: FAIL hasta que la composición se actualice.

- [ ] **Step 3: Integrar el wrapper sin cambiar el fetch**

En `page.tsx`, envolver las secciones existentes y nuevas con `TechLabNarrative`. No mover `safeFetchConfig`, `safeFetchProductos`, metadata ni JSON-LD. Mantener el CTA de reparaciones y sus enlaces actuales.

- [ ] **Step 4: Añadir solo los tokens necesarios**

En `globals.css`, agregar selectores de fase, estilos de callout y estados de escaneo bajo nombres de laboratorio. Reutilizar `navy-base`, `navy-deep`, `glow-cyan`, `fog-white` y `slate-muted` antes de introducir cualquier color nuevo.

- [ ] **Step 5: Ejecutar prueba de composición**

Run: `npx vitest run tests/lib/home-sections.test.ts`

Expected: PASS.

### Task 7: Verificación Integral Y QA Visual

**Files:**
- Modify: `tasks.md`: agregar el bloque de Vision X con estado `en-progreso` y evidencia únicamente después de cada gate.
- Review: `src/components/storefront/Hero.tsx`, `src/app/page.tsx`, `src/app/globals.css` y todos los componentes `tech-lab`.

- [ ] **Step 1: Ejecutar suite automatizada**

Run: `npm test`

Expected: todos los archivos y pruebas pasan, incluyendo los nuevos tests de Tech Repair Lab.

- [ ] **Step 2: Ejecutar TypeScript**

Run: `npx tsc --noEmit`

Expected: salida vacía y código de salida 0.

- [ ] **Step 3: Ejecutar lint**

Run: `npm run lint`

Expected: 0 errores. Los warnings deben ser iguales o menores que los 11 conocidos; cualquier warning nuevo del hero o componentes nuevos se corrige antes de continuar.

- [ ] **Step 4: Ejecutar build**

Run: `npm run build`

Expected: build Turbopack exitoso y rutas existentes generadas sin errores.

- [ ] **Step 5: QA navegador responsive**

Con Playwright MCP habilitado o el arnés reproducible existente, verificar `1440x900`, `1024x768` y `390x844`. Registrar capturas solo en artefactos ignorados y comprobar inicio armado, fases intermedias, rearme final, CTA, reduced motion, consola sin errores y `scrollWidth <= innerWidth`.

- [ ] **Step 6: Medir Lighthouse**

Ejecutar Lighthouse sobre el build de producción local y comparar con `docs/superpowers/reports/2026-08-01-lighthouse-produccion.md`. No aprobar si Performance cae por debajo de 90, SEO por debajo de 95 o accesibilidad por debajo de 95 sin una decisión explícita del operador.

- [ ] **Step 7: Auditoría de seguridad del cambio**

Confirmar que no se agregaron endpoints, secretos, logs sensibles, escrituras Firestore ni dependencias nuevas. Ejecutar `npm audit --omit=dev --audit-level=high` y documentar cualquier variación sin aplicar `--force`.

- [ ] **Step 8: Registrar evidencia**

Agregar a `tasks.md` este bloque, reemplazando cada valor únicamente con la salida real de la corrida:

```md
## Vision X — Home Tech Repair Lab

**Estado:** revisión
**Spec:** `docs/superpowers/specs/2026-08-05-tech-repair-lab-design.md`
**Plan:** `docs/superpowers/plans/2026-08-05-tech-repair-lab.md`

- [x] Modelo de fases y wrapper narrativo.
- [x] Integración GSAP, indicador y callouts.
- [x] Centro Tecnológico, Diagnóstico y Repair Journey.
- [x] Composición de la home y tokens.
- [x] Tests: registrar comando y salida real de `npm test`.
- [x] TypeScript: registrar comando y salida real de `npx tsc --noEmit`.
- [x] Lint: registrar comando y salida real de `npm run lint`.
- [x] Build: registrar comando y salida real de `npm run build`.
- [x] QA navegador: registrar viewports, pasos y resultado real.
- [x] Lighthouse: registrar métricas reales y comparación con baseline.
- [x] Auditoría de seguridad del cambio: registrar checklist y resultado real.
```

Mantener la tarea en revisión hasta que seguridad, tests, build, QA navegador y rendimiento aplicable estén documentados.

## Self-Review Del Plan

- La preservación del hero y de los tres assets está cubierta en las restricciones, Task 2 y criterios de aceptación.
- Las siete fases están cubiertas por Task 1, Task 2 y QA de Task 7.
- Centro Tecnológico, Diagnóstico y Repair Journey tienen tareas y tests separados.
- No se agregan backend, migraciones ni dependencias nuevas.
- Responsive, reduced motion, accesibilidad, SEO y rendimiento tienen criterios explícitos.
- El plan no requiere commits ni despliegues automáticos.
