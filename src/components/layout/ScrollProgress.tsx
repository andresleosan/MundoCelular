"use client";

import { useEffect, useRef } from "react";

/**
 * Indicador de avance de lectura. Reemplaza a la scrollbar nativa
 * (oculta en globals.css) sin devolver la barra del navegador.
 */
export function ScrollProgress() {
  const barraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const pintar = () => {
      frame = 0;
      const barra = barraRef.current;
      if (!barra) return;
      const alcance = document.documentElement.scrollHeight - window.innerHeight;
      const avance = alcance > 8 ? window.scrollY / alcance : 0;
      barra.style.transform = `scaleX(${Math.min(1, Math.max(0, avance))})`;
    };

    const programar = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(pintar);
    };

    pintar();
    window.addEventListener("scroll", programar, { passive: true });
    window.addEventListener("resize", programar, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", programar);
      window.removeEventListener("resize", programar);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-scroll-progress
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]"
    >
      <div
        ref={barraRef}
        className="h-full origin-left bg-gradient-to-r from-glow-cyan/50 via-glow-cyan to-glow-cyan-soft shadow-[0_0_12px_rgba(0,212,255,0.45)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
