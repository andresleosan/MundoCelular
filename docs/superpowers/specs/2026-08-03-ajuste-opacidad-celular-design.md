# Ajuste De Opacidad Del Celular En El Hero

**Fecha:** 2026-08-03
**Estado:** aprobado para implementación

## Contexto

La animación de despiece del hero vive en `src/components/storefront/Hero.tsx` y usa una timeline de GSAP controlada por `ScrollTrigger`. Actualmente el teléfono ensamblado termina en `opacity: 0` al inicio de la timeline y el teléfono desarmado termina en `opacity: 0` al final. Esto hace que ambos estados se perciban demasiado desvanecidos en los extremos del recorrido.

## Diseño

Modificar los objetivos de opacidad de los estados extremos, conservando la salida del estado inicial:

- El teléfono ensamblado (`armadoRef`) debe pasar de `1` a `0` después de la transición para no quedar como una capa fija sobre las secciones siguientes.
- El teléfono desarmado (`desarmadoRef`) debe pasar de `1` a `0.3` en el cierre.
- La capa intermedia (`desarmadomRef`), escalas, duraciones, posiciones, assets y `prefers-reduced-motion` permanecen sin cambios.

La opacidad mínima queda expresada directamente en la timeline para que el comportamiento siga ligado al progreso del scroll y no requiera estado adicional ni estilos globales.

## Alcance

Incluye:

- Ajuste del objetivo de `opacity` del estado final en `Hero.tsx` y regresión explícita del estado inicial a `0`.
- Verificación de TypeScript, tests y build.
- Revisión visual del hero en desktop y mobile mediante navegador.

No incluye:

- Cambios en `PhoneStack`.
- Cambios de assets, layout, colores o blend modes.
- Rediseño de la transición central.

## Criterios De Aceptación

- El estado ensamblado inicia visible y desaparece después de la transición, sin permanecer fijo sobre el resto de la página.
- El estado desarmado conserva al menos `0.3` de opacidad al llegar al final.
- La transición central mantiene su comportamiento actual.
- Con `prefers-reduced-motion`, el comportamiento existente no cambia.
- `npm test`, `npx tsc --noEmit` y `npm run build` terminan correctamente.
