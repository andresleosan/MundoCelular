# Ajuste De Opacidad Del Celular Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mantener el celular desarmado visible al 30% al final de la animación sin dejar el celular inicial fijo sobre las secciones siguientes.

**Architecture:** La animación seguirá siendo una única timeline GSAP controlada por `ScrollTrigger` dentro de `Hero.tsx`. El estado ensamblado inicial volverá a desaparecer al terminar su transición y solo el estado desarmado final conservará `opacity: 0.3`; la capa intermedia y el resto de la interacción no se tocan.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, GSAP, ScrollTrigger, Vitest y Playwright MCP.

## Global Constraints

- Mantener `opacity: 0.3` únicamente en el estado desarmado final.
- No modificar `PhoneStack`, assets, layout, colores, blend modes ni duraciones.
- Mantener sin cambios el comportamiento de `prefers-reduced-motion`.
- La UI y los comentarios siguen las convenciones existentes del proyecto.

---

## File Map

- Modify: `src/components/storefront/Hero.tsx:48-63` — objetivos de opacidad de los estados inicial y final.
- Test: `tests/components/storefront/Hero.test.tsx` — captura los objetivos de opacidad de la timeline sin depender de otro test.
- Test manually: hero público en desktop y mobile mediante Playwright MCP.
- Verify: `npm test`, `npx tsc --noEmit` y `npm run build`.

### Task 1: Conservar Visible El Estado Desarmado Final

**Files:**
- Modify: `src/components/storefront/Hero.tsx:49,63`
- Modify: `tests/components/storefront/Hero.test.tsx`
- Test manually: página Home en `1440x900` y `390x844`

**Interfaces:**
- Consume: refs `armadoRef`, `desarmadomRef` y `desarmadoRef` existentes.
- Produces: la misma timeline GSAP, con `armadoRef` terminando en `opacity: 0` y `desarmadoRef` terminando en `opacity: 0.3`.

- [x] **Step 1: Conservar el inicial y elevar solo el estado final**

En `src/components/storefront/Hero.tsx`, conservar el objetivo del teléfono inicial:

```ts
.to(armadoRef.current, { opacity: 0, scale: 1.07, duration: 0.35 }, 0)
```

Y cambiar únicamente el objetivo final:

```ts
.to(desarmadoRef.current, { opacity: 0, duration: 0.3 }, 0.7);
```

por:

```ts
.to(desarmadoRef.current, { opacity: 0.3, duration: 0.3 }, 0.7);
```

No cambiar los `fromTo` de `desarmadomRef`, escalas, duraciones ni dependencias del efecto.

- [x] **Step 2: Ejecutar las verificaciones automatizadas**

Run:

```powershell
npm test
npx tsc --noEmit
npm run build
```

Expected: los tres comandos terminan correctamente; el lint del build puede conservar los 11 warnings preexistentes.

- [x] **Step 3: Verificar visualmente los extremos**

Con el servidor local disponible, abrir Home en `1440x900` y `390x844`. En la consola del navegador, comprobar el progreso de la sección y las opacidades:

```js
const hero = document.querySelector('[aria-label="Bienvenida a Mundo Celular"]');
const images = [...hero.querySelectorAll('img')];
window.scrollTo(0, 0);
images.map((image) => getComputedStyle(image).opacity);
```

Después desplazar hasta el final de la sección Hero y repetir la lectura. El ensamblado debe desaparecer después de la transición y el desarmado debe conservar presencia visual, sin errores de consola ni overflow horizontal en ambos viewports.

- [x] **Step 4: Revisar el diff y crear el commit**

Run:

```powershell
git diff --check
git diff -- src/components/storefront/Hero.tsx
git add src/components/storefront/Hero.tsx
git commit -m "fix(hero): evitar celular inicial fijo"
```

Expected: el estado final contiene `armadoRef` en `opacity: 0` y `desarmadoRef` en `opacity: 0.3`; el diff de la corrección contiene únicamente el cambio necesario para evitar la capa inicial fija.
