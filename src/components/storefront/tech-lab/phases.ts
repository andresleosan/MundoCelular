export type TechPhaseId =
  | "assembly"
  | "display"
  | "battery"
  | "camera"
  | "processor"
  | "board"
  | "reassembly";

export interface TechLabPhase {
  id: TechPhaseId;
  label: string;
  start: number;
  end: number;
}

export const TECH_LAB_PHASES: readonly TechLabPhase[] = [
  { id: "assembly", label: "Sistema ensamblado", start: 0, end: 0.1 },
  { id: "display", label: "Análisis de pantalla", start: 0.1, end: 0.24 },
  { id: "battery", label: "Energía y batería", start: 0.24, end: 0.38 },
  { id: "camera", label: "Sistema de cámaras", start: 0.38, end: 0.54 },
  { id: "processor", label: "Procesador y rendimiento", start: 0.54, end: 0.68 },
  { id: "board", label: "Placa principal", start: 0.68, end: 0.84 },
  { id: "reassembly", label: "Rearme completo", start: 0.84, end: 1 },
];

export function phaseFromProgress(progress: number): TechPhaseId {
  const clamped = Math.min(1, Math.max(0, progress));
  const phase = TECH_LAB_PHASES.find(
    ({ end }, index) => clamped < end || index === TECH_LAB_PHASES.length - 1,
  );

  return phase?.id ?? "assembly";
}

export function publishTechLabProgress(root: HTMLElement, progress: number): void {
  const clamped = Math.min(1, Math.max(0, progress));
  const phase = phaseFromProgress(clamped);
  const previousPhase = root.dataset.techPhase;

  root.style.setProperty("--tech-progress", String(clamped));
  root.dataset.techPhase = phase;

  if (previousPhase !== phase) {
    root.dispatchEvent(
      new CustomEvent("techlabphasechange", {
        detail: { phase },
      }),
    );
  }
}
