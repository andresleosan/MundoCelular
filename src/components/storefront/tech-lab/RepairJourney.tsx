import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const REPAIR_STEPS = [
  { title: "Recepción", description: "Recibimos tu equipo y escuchamos qué está pasando." },
  { title: "Diagnóstico", description: "Revisamos las señales del dispositivo y sus componentes." },
  { title: "Presupuesto", description: "Te explicamos el trabajo antes de iniciar la reparación." },
  { title: "Reparación", description: "Intervenimos el equipo con un proceso claro y cuidadoso." },
  { title: "Entrega", description: "Probamos el resultado y te devolvemos tu equipo listo." },
] as const;

export function RepairJourney() {
  return (
    <section
      id="proceso-reparacion"
      aria-label="Proceso de reparación"
      className="mx-auto max-w-[1280px] px-4 py-16 sm:py-20"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.16em] text-glow-cyan">
            Repair Journey / Módulo 03
          </p>
          <h2 className="mt-3 font-sora text-[28px] font-semibold tracking-[-0.03em] text-fog-white sm:text-[40px]">
            Del diagnóstico a la entrega
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-fog-white/65 sm:text-[17px]">
            Cada reparación sigue una ruta explicable para que siempre sepas qué sucede con tu equipo.
          </p>
        </div>
        <Link
          href="/reparaciones"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-pills border border-fog-white/15 bg-fog-white/5 px-5 text-[14px] font-semibold text-fog-white transition-all duration-200 hover:border-glow-cyan/40 hover:bg-glow-cyan/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan/30"
        >
          Ver servicios
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>

      <ol className="mt-10 grid gap-3 md:grid-cols-5">
        {REPAIR_STEPS.map((step, index) => (
          <li key={step.title} className="relative rounded-cards border border-fog-white/10 bg-navy-surface/30 p-5">
            <div className="flex items-center justify-between">
              <span className="font-jetbrains-mono text-[11px] tracking-[0.12em] text-glow-cyan">0{index + 1}</span>
              {index < REPAIR_STEPS.length - 1 && (
                <span aria-hidden="true" className="hidden h-px w-8 bg-glow-cyan/30 md:block" />
              )}
            </div>
            <h3 className="mt-7 font-sora text-[17px] font-semibold tracking-[-0.015em] text-fog-white">{step.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-fog-white/55">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
