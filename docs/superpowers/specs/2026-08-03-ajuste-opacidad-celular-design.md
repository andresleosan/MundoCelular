# Ajuste De Opacidad Del Celular En El Hero

**Fecha:** 2026-08-03
**Estado:** aprobado para implementación

## Contexto

La animación de despiece del hero vive en `src/components/storefront/Hero.tsx` y usa una timeline de GSAP controlada por `ScrollTrigger`. Actualmente el teléfono ensamblado termina en `opacity: 0` al inicio de la timeline y el teléfono desarmado termina en `opacity: 0` al final. Esto hace que ambos estados se perciban demasiado desvanecidos en los extremos del recorrido.

## Diseño

Modificar únicamente los dos objetivos de opacidad de los estados extremos:

- El teléfono ensamblado (`armadoRef`) debe pasar de `1` a `0.3` en lugar de desaparecer completamente.
- El teléfono desarmado (`desarmadoRef`) debe pasar de `1` a `0.3` en el cierre.
- La capa intermedia (`desarmadomRef`), escalas, duraciones, posiciones, assets y `prefers-reduced-motion` permanecen sin cambios.

La opacidad mínima queda expresada directamente en la timeline para que el comportamiento siga ligado al progreso del scroll y no requiera estado adicional ni estilos globales.

## Alcance

Incluye:

- Ajuste de dos valores `opacity` en `Hero.tsx`.
- Verificación de TypeScript, tests y build.
- Revisión visual del hero en desktop y mobile mediante navegador.

No incluye:

- Cambios en `PhoneStack`.
- Cambios de assets, layout, colores o blend modes.
- Rediseño de la transición central.

## Criterios De Aceptación

- El estado ensamblado conserva al menos `0.3` de opacidad al avanzar desde el inicio.
- El estado desarmado conserva al menos `0.3` de opacidad al llegar al final.
- La transición central mantiene su comportamiento actual.
- Con `prefers-reduced-motion`, el comportamiento existente no cambia.
- `npm test`, `npx tsc --noEmit` y `npm run build` terminan correctamente.
