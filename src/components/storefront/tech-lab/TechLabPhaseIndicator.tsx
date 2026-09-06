"use client";

import { useEffect, useRef, useState } from "react";
import { TECH_LAB_PHASES, type TechPhaseId } from "@/components/storefront/tech-lab/phases";

function isTechPhaseId(value: unknown): value is TechPhaseId {
  return TECH_LAB_PHASES.some((phase) => phase.id === value);
}

export function TechLabPhaseIndicator() {
  const ref = useRef<HTMLDivElement>(null);
  const [currentPhase, setCurrentPhase] = useState<TechPhaseId>("assembly");

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-tech-lab-narrative]");
    if (!root) return;

    const initialPhase = root.dataset.techPhase;
    if (isTechPhaseId(initialPhase)) setCurrentPhase(initialPhase);

    const handlePhaseChange = (event: Event) => {
      const phase = (event as CustomEvent<{ phase?: unknown }>).detail?.phase;
      if (isTechPhaseId(phase)) setCurrentPhase(phase);
    };

    root.addEventListener("techlabphasechange", handlePhaseChange);
    return () => root.removeEventListener("techlabphasechange", handlePhaseChange);
  }, []);

  const indiceActual = TECH_LAB_PHASES.findIndex((phase) => phase.id === currentPhase);
  const faseActual = TECH_LAB_PHASES[indiceActual] ?? TECH_LAB_PHASES[0];

  return (
    <div ref={ref} className="mb-7 flex flex-col items-center gap-2.5 lg:items-start">
      {/* Riel compacto: una barra por fase en vez de siete chips que rompen el titular */}
      <ol aria-label="Fases del dispositivo" className="flex items-center gap-1.5">
        {TECH_LAB_PHASES.map((phase, index) => {
          const activa = index === indiceActual;
          const recorrida = index < indiceActual;
          return (
            <li key={phase.id}>
              <span
                aria-current={activa ? "step" : undefined}
                className={`block h-[3px] rounded-full transition-all duration-500 ease-out ${
                  activa
                    ? "w-10 bg-glow-cyan shadow-[0_0_10px_rgba(0,212,255,0.6)]"
                    : recorrida
                      ? "w-5 bg-glow-cyan/45"
                      : "w-5 bg-fog-white/15"
                }`}
              >
                <span className="sr-only">{phase.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {/* El riel ya expone cada fase al lector de pantalla; esta etiqueta
          solo repite la fase activa para la vista. */}
      <p
        aria-hidden="true"
        className="font-jetbrains-mono text-[10px] uppercase tracking-[0.16em] text-glow-cyan-soft"
      >
        {faseActual.label}
      </p>
    </div>
  );
}
