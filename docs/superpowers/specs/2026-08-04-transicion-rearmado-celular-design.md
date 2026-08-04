# Transición De Rearmado Del Celular

**Fecha:** 2026-08-04  
**Estado:** aprobado por el usuario para implementación

## Contexto

El hero de la página principal muestra un teléfono fijo en el fondo y controla su transformación mediante una timeline GSAP vinculada al scroll. La secuencia actual usa tres imágenes: `Armado1.png`, `Desarmadom1.png` y `Desarmado1.png`. Actualmente la timeline solo recorre el desarme y termina con el teléfono desarmado.

## Diseño

Extender la timeline existente para que el recorrido completo del scroll sea una secuencia continua y reversible:

1. El teléfono armado desaparece gradualmente mientras escala levemente.
2. El estado intermedio aparece y luego sale.
3. El teléfono desarmado queda visible durante una pausa breve en el centro del recorrido.
4. En el último 30% del recorrido, el estado desarmado sale mientras reaparece el estado intermedio.
5. El estado intermedio sale mientras el teléfono armado reaparece hasta quedar completamente visible y a escala normal.

La entrada y la salida usarán la misma lógica visual invertida, evitando introducir assets, componentes o estados React nuevos.

## Alcance

Incluye:

- Modificar la timeline GSAP en `src/components/storefront/Hero.tsx`.
- Distribuir las fases de desarme y rearme a lo largo de todo el rango de `ScrollTrigger`.
- Mantener la capa fija, el layout, los blend modes, los assets y el soporte para `prefers-reduced-motion`.
- Verificar TypeScript, tests y comportamiento visual en desktop y mobile.

No incluye:

- Cambios en `PhoneStack`.
- Cambios de assets, estilos globales, colores o estructura del hero.
- Cambios en el contenido, navegación o demás secciones de la página.

## Criterios De Aceptación

- Al inicio del recorrido, el teléfono aparece completamente armado.
- La primera mitad del recorrido conserva el desarme actual: armado → intermedio → desarmado.
- El último 30% del recorrido muestra el rearme: desarmado → intermedio → armado.
- Al llegar al final del recorrido, `Armado1.png` queda visible con opacidad `1` y escala `1`.
- No hay saltos visibles entre las imágenes durante los cruces.
- Con `prefers-reduced-motion`, no se ejecuta la animación controlada por scroll.
- No se realiza ningún commit durante este trabajo.
