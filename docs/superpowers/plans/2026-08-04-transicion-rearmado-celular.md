# Transición De Rearmado Del Celular Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender la animación de scroll del hero para que el teléfono se desarme al avanzar y vuelva a armarse completamente en el último 30% del recorrido.

**Architecture:** Mantener la capa fija y la timeline GSAP existente en `Hero.tsx`. La secuencia usará las tres imágenes actuales y fases explícitas dentro de un rango normalizado de `0` a `1`: desarme hasta `0.5`, pausa breve del estado desarmado y rearme entre `0.7` y `1`. La prueba existente del hero verificará las llamadas de GSAP observables sin introducir una abstracción nueva.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, GSAP 3.15, ScrollTrigger, Vitest 4, Testing Library.

## Global Constraints

- Mantener la capa fija, el layout, los blend modes, los assets y el soporte para `prefers-reduced-motion`.
- No modificar `PhoneStack`, estilos globales, colores, contenido ni estructura del hero.
- La primera mitad debe conservar el desarme visual: armado → intermedio → desarmado.
- El último 30% debe mostrar el rearme: desarmado → intermedio → armado.
- Al final, `Armado1.png` debe quedar con opacidad `1` y escala `1`.
- No realizar ningún commit durante este trabajo.

---

### Task 1: Reversar la timeline del hero

**Files:**
- Modify: `tests/components/storefront/Hero.test.tsx:68-82` — actualizar la regresión de estados finales y añadir la comprobación del rearme.
- Modify: `src/components/storefront/Hero.tsx:48-63` — redistribuir la timeline para incluir el tramo inverso.

**Interfaces:**
- Consumes: refs existentes `armadoRef`, `desarmadomRef` y `desarmadoRef`, más el mock de timeline ya usado por `Hero.test.tsx`.
- Produces: una timeline con las mismas llamadas GSAP públicas y un estado final armado.

- [x] **Step 1: Escribir la prueba regresiva que inicialmente falla**

Actualizar el test existente para esperar que el estado desarmado salga completamente y que el armado vuelva a entrar al final:

```tsx
it("rearma el celular durante el último tramo de la transición", async () => {
  render(<Hero config={config} />);

  await waitFor(() => {
    const desarmadoCalls = timelineTo.mock.calls.filter(
      ([target]) => target?.getAttribute?.("src") === "/Desarmado1.png",
    );
    const armadoCalls = timelineTo.mock.calls.filter(
      ([target]) => target?.getAttribute?.("src") === "/Armado1.png",
    );

    expect(desarmadoCalls.some(([, vars, position]) =>
      vars?.opacity === 0 && vars?.scale === 1.07 && position === 0.5333333333333333,
    )).toBe(true);
    expect(armadoCalls.some(([, vars, position]) =>
      vars?.opacity === 1 && vars?.scale === 1 &&
      vars?.duration === 0.2 && position === 0.8,
    )).toBe(true);
  });
});
```

Conservar la prueba existente de entrada inicial y cambiar su expectativa de cierre para no exigir `opacity: 0.3` en el estado desarmado. El nuevo cierre esperado será `opacity: 0` en `Desarmado1.png` y `opacity: 1`/`scale: 1` en el `to` final de `Armado1.png`.

- [x] **Step 2: Ejecutar la prueba y confirmar el fallo correcto**

Run: `npx vitest run tests/components/storefront/Hero.test.tsx`

Expected: FAIL porque la timeline actual no contiene la salida final de `Desarmado1.png` ni el `to` final de `Armado1.png`.

- [x] **Step 3: Implementar la timeline mínima que satisface el comportamiento**

Reemplazar la cadena actual por fases normalizadas que cubran todo el recorrido:

```ts
timeline
  .to(armadoRef.current, { opacity: 0, scale: 1.07, duration: transitionDuration }, 0)
  .fromTo(
    desarmadomRef.current,
    { opacity: 0, scale: 0.93 },
    { opacity: 0.6, scale: 1, duration: transitionDuration },
    0,
  )
  .to(
    desarmadomRef.current,
    { opacity: 0, scale: 1.07, duration: transitionDuration },
    secondTransitionStart,
  )
  .fromTo(
    desarmadoRef.current,
    { opacity: 0, scale: 0.93 },
    { opacity: 1, scale: 1, duration: transitionDuration },
    secondTransitionStart,
  )
  .to(desarmadoRef.current, { opacity: 0, scale: 1.07, duration: transitionDuration }, reassemblyStart)
  .fromTo(
    desarmadomRef.current,
    { opacity: 0, scale: 0.93 },
    { opacity: 0.6, scale: 1, duration: transitionDuration },
    reassemblyStart,
  )
  .to(desarmadomRef.current, { opacity: 0, scale: 1.07, duration: transitionDuration }, finalAssemblyStart)
  .to(armadoRef.current, { opacity: 1, scale: 1, duration: transitionDuration }, finalAssemblyStart);
```

Definir `transitionDuration = 0.2`, `pauseDuration = (1 - transitionDuration * 4) / 3`, `secondTransitionStart = transitionDuration + pauseDuration`, `reassemblyStart = secondTransitionStart + transitionDuration + pauseDuration` y `finalAssemblyStart = reassemblyStart + transitionDuration + pauseDuration` junto a las constantes del componente. Así las cuatro transformaciones duran exactamente `20%` cada una y las tres pausas ocupan `6.6667%` cada una. La transición mantiene la opacidad intermedia existente (`0.6`), conserva la escala de salida `1.07` y deja el armado final en `opacity: 1`, `scale: 1`. No agregar estado React ni modificar el `ScrollTrigger` o el bloque de `reducedMotion`.

- [x] **Step 4: Ejecutar la prueba y confirmar el paso**

Run: `npx vitest run tests/components/storefront/Hero.test.tsx`

Expected: PASS, incluyendo la presencia de las tres imágenes, la salida del armado inicial, el cierre del desarmado y el rearme final.

- [x] **Step 5: Ejecutar la verificación estática y la suite completa**

Run: `npx tsc --noEmit`

Expected: exit code `0`.

Run: `npm test`

Expected: exit code `0` y ningún test fallido.

- [x] **Step 6: Revisar visualmente el recorrido de scroll**

Iniciar el servidor con `npm run dev`, abrir la home en desktop y mobile, y revisar que:

- El desarme ocurre de forma progresiva al bajar.
- El estado desarmado tiene una pausa breve antes de comenzar el rearme.
- El rearme inicia cerca del último 30% y termina con el celular armado.
- No aparecen saltos entre capas ni el teléfono queda invisible al final.
- Con `prefers-reduced-motion`, la capa animada por scroll no se monta.

No crear commit; dejar los cambios disponibles para revisión del usuario.
