"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Icon, type IconName } from "@/components/ui/Icon";

interface Beneficio {
  icon: IconName;
  titulo: string;
  descripcion: string;
}

const BENEFICIOS: Beneficio[] = [
  { icon: "shield-check", titulo: "Equipos originales", descripcion: "productos 100% originales con respaldo de garantía directa del fabricante." },
  { icon: "truck", titulo: "Envíos rápidos", descripcion: "despachamos el mismo día en Medellín y al día siguiente en el resto del país." },
  { icon: "badge-check", titulo: "Garantía real", descripcion: "12 meses cubriendo defectos de fábrica, no fallos por uso." },
  { icon: "message-circle", titulo: "Soporte 24/7", descripcion: "atención por WhatsApp antes y después de tu compra." },
  { icon: "credit-card", titulo: "Pagos seguros", descripcion: "sin manejo de tarjetas en línea — pagas al recibir." },
  { icon: "user", titulo: "Atención personalizada", descripcion: "te ayudamos a elegir el equipo ideal según tu presupuesto." },
];

export function BeneficiosSection() {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section
      id="beneficios"
      ref={ref}
      className="mx-auto max-w-[1280px] px-4 py-16 sm:py-20"
      aria-label="Beneficios"
    >
      <div className="mb-12 text-center">
        <h2 className="font-sora text-[28px] font-semibold tracking-[-0.02em] text-fog-white sm:text-[40px]">
          ¿Por qué elegir MundoCelular?
        </h2>
        <p className="mx-auto mt-4 max-w-[600px] text-[16px] text-slate-muted sm:text-[18px]">
          Tu tienda de tecnología de confianza en Medellín
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {BENEFICIOS.map((b, i) => (
          <article
            key={b.titulo}
            className={`rounded-cards border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-glow-cyan/30 hover:shadow-sm sm:p-8 ${visible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-glow-cyan">
              <Icon name={b.icon} size={22} />
            </span>
            <h3 className="mt-4 font-sora text-[16px] font-semibold tracking-[-0.01em] text-fog-white sm:text-[18px]">
              {b.titulo}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-muted sm:text-[14px]">
              {b.descripcion}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}