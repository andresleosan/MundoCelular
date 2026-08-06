"use client";

import { useRef, type ReactNode } from "react";

interface TechLabNarrativeProps {
  children: ReactNode;
}

export function TechLabNarrative({ children }: TechLabNarrativeProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} data-tech-lab-narrative data-tech-phase="assembly" className="relative">
      {children}
    </div>
  );
}
