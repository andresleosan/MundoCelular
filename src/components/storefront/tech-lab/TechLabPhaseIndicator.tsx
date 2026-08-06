"use client";

import { useEffect, useRef, useState } from "react";
import { TECH_LAB_PHASES, type TechPhaseId } from "@/components/storefront/tech-lab/phases";

function isTechPhaseId(value: unknown): value is TechPhaseId {
  return TECH_LAB_PHASES.some((phase) => phase.id === value);
}

export function TechLabPhaseIndicator() {
  const ref = useRef<HTMLOListElement>(null);
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

  return (
    <ol ref={ref} aria-label="Fases del dispositivo" className="flex flex-wrap justify-center gap-2">
      {TECH_LAB_PHASES.map((phase) => (
        <li key={phase.id}>
          <span
            aria-current={currentPhase === phase.id ? "step" : undefined}
            className={`rounded-chips border px-3 py-1.5 font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] transition-colors duration-300 ${
              currentPhase === phase.id
                ? "border-glow-cyan/50 bg-glow-cyan/10 text-glow-cyan"
                : "border-fog-white/10 text-fog-white/45"
            }`}
          >
            {phase.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
