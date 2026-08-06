import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const DIAGNOSTIC_CHECKS = ["Pantalla", "Cámara", "Batería", "Sensores", "Software", "Puerto de carga"] as const;

export function DiagnosticPanel() {
  return (
    <section
      id="diagnostico"
      aria-label="Centro de Diagnóstico"
      className="mx-auto grid max-w-[1280px] gap-8 px-4 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
    >
      <div>
        <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.16em] text-glow-cyan">
          Escáner / Módulo 02
        </p>
        <h2 className="mt-3 font-sora text-[28px] font-semibold tracking-[-0.03em] text-fog-white sm:text-[40px]">
          Centro de Diagnóstico
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fog-white/65 sm:text-[17px]">
          Una revisión inicial ordena las señales del equipo antes de decidir el siguiente paso. El diagnóstico final lo realiza nuestro equipo técnico.
        </p>
        <Link
          href="/reparaciones"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-pills bg-glow-cyan px-6 text-[14px] font-semibold text-navy-deep transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-glow focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan/40"
        >
          Solicitar revisión
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-cards border border-fog-white/10 bg-navy-deep/70 p-5 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-glow-cyan/60 motion-safe:animate-tech-scan" />
        <div className="mb-5 flex items-center justify-between border-b border-fog-white/10 pb-4">
          <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.14em] text-fog-white/45">
            Estado del sistema
          </span>
          <span className="inline-flex items-center gap-2 font-jetbrains-mono text-[11px] text-glow-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-glow-cyan shadow-[0_0_8px_var(--color-glow-cyan)]" />
            Revisión inicial
          </span>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Puntos revisados">
          {DIAGNOSTIC_CHECKS.map((check, index) => (
            <li key={check} className="flex items-center gap-3 rounded-xl border border-fog-white/10 bg-fog-white/[0.03] px-3 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-glow-cyan/10 text-glow-cyan">
                <Icon name="check" size={15} />
              </span>
              <span className="min-w-0 flex-1 text-[14px] text-fog-white/85">{check}</span>
              <span className="font-jetbrains-mono text-[10px] text-fog-white/35">0{index + 1}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
