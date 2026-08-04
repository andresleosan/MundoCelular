# Ajuste De Opacidad Del Celular Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mantener el celular visible al 30% de opacidad en los extremos de la animación de despiece del hero.

**Architecture:** La animación seguirá siendo una única timeline GSAP controlada por `ScrollTrigger` dentro de `Hero.tsx`. Solo se cambiarán los objetivos de opacidad del estado ensamblado inicial y del estado desarmado final; la capa intermedia y el resto de la interacción no se tocan.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, GSAP, ScrollTrigger, Vitest y Playwright MCP.

## Global Constraints

- Mantener la opacidad mínima de los extremos en `0.3`.
- No modificar `PhoneStack`, assets, layout, colores, blend modes ni duraciones.
- Mantener sin cambios el comportamiento de `prefers-reduced-motion`.
- La UI y los comentarios siguen las convenciones existentes del proyecto.

---

## File Map

- Modify: `src/components/storefront/Hero.tsx:48-63` — objetivos de opacidad de las dos capas extremas.
- Test manually: hero público en desktop y mobile mediante Playwright MCP.
- Verify: `npm test`, `npx tsc --noEmit` y `npm run build`.

### Task 1: Elevar La Opacidad De Los Extremos

**Files:**
- Modify: `src/components/storefront/Hero.tsx:49,63`
- Test manually: página Home en `1440x900` y `390x844`

**Interfaces:**
- Consume: refs `armadoRef`, `desarmadomRef` y `desarmadoRef` existentes.
- Produces: la misma timeline GSAP, con `armadoRef` y `desarmadoRef` nunca por debajo de `opacity: 0.3` en sus estados finales.

- [x] **Step 1: Cambiar únicamente los dos objetivos de opacidad**

En `src/components/storefront/Hero.tsx`, cambiar:

```ts
.to(armadoRef.current, { opacity: 0, scale: 1.07, duration: 0.35 }, 0)
```

por:

```ts
.to(armadoRef.current, { opacity: 0.3, scale: 1.07, duration: 0.35 }, 0)
```

Y cambiar:

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

Después desplazar hasta el final de la sección Hero y repetir la lectura. El ensamblado y el desarmado deben conservar presencia visual, sin errores de consola ni overflow horizontal en ambos viewports.

- [x] **Step 4: Revisar el diff y crear el commit**

Run:

```powershell
git diff --check
git diff -- src/components/storefront/Hero.tsx
git add src/components/storefront/Hero.tsx
git commit -m "fix(hero): mantener celular visible en extremos"
```

Expected: el diff contiene únicamente los dos cambios de `opacity` definidos en este plan.
