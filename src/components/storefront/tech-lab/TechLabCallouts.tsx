import type { TechPhaseId } from "@/components/storefront/tech-lab/phases";

const CALLOUTS: Array<{ phase: Exclude<TechPhaseId, "assembly" | "reassembly">; label: string; detail: string }> = [
  { phase: "display", label: "Pantalla", detail: "Capa de interacción" },
  { phase: "battery", label: "Batería", detail: "Reserva de energía" },
  { phase: "camera", label: "Cámaras", detail: "Sistema óptico" },
  { phase: "processor", label: "Procesador", detail: "Núcleo de rendimiento" },
  { phase: "board", label: "Placa principal", detail: "Conexiones del dispositivo" },
];

export function TechLabCallouts() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 hidden sm:block">
      {CALLOUTS.map((callout, index) => (
        <div
          key={callout.phase}
          data-tech-callout={callout.phase}
          className={`absolute ${index % 2 === 0 ? "left-0" : "right-0"} top-1/2 max-w-[150px] -translate-y-1/2 opacity-0 transition-all duration-500`}
        >
          <span className="block font-jetbrains-mono text-[10px] uppercase tracking-[0.12em] text-glow-cyan">
            {callout.label}
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-fog-white/55">{callout.detail}</span>
          <span className="mt-2 block h-px w-16 bg-glow-cyan/50" />
        </div>
      ))}
    </div>
  );
}
