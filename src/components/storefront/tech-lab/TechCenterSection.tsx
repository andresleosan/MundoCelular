import { Icon, type IconName } from "@/components/ui/Icon";

interface TechService {
  icon: IconName;
  title: string;
  description: string;
}

const TECH_SERVICES: readonly TechService[] = [
  {
    icon: "shield-check",
    title: "Diagnóstico profesional",
    description: "Revisamos el equipo antes de intervenirlo y explicamos qué encontramos.",
  },
  {
    icon: "badge-check",
    title: "Reparación certificada",
    description: "Trabajamos con procesos claros y una reparación documentada.",
  },
  {
    icon: "shield-check",
    title: "Garantía real",
    description: "Te acompañamos después de la entrega con respaldo sobre el servicio.",
  },
  {
    icon: "smartphone",
    title: "Repuestos originales",
    description: "Priorizamos componentes compatibles y trazables para cada equipo.",
  },
  {
    icon: "users",
    title: "Atención especializada",
    description: "Recibes orientación directa para comprar, reparar y cuidar tu dispositivo.",
  },
];

export function TechCenterSection() {
  return (
    <section
      id="centro-tecnologico"
      aria-label="Centro Tecnológico Mundo Celular"
      className="mx-auto max-w-[1280px] px-4 py-16 sm:py-20"
    >
      <div className="mb-10 max-w-2xl">
        <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.16em] text-glow-cyan">
          Mundo Celular / Centro 01
        </p>
        <h2 className="mt-3 font-sora text-[28px] font-semibold tracking-[-0.03em] text-fog-white sm:text-[40px]">
          Centro Tecnológico Mundo Celular
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-fog-white/65 sm:text-[17px]">
          La tecnología se entiende mejor cuando se revisa con método, se explica con claridad y se entrega con respaldo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TECH_SERVICES.map((service, index) => (
          <article
            key={service.title}
            className="group rounded-cards border border-fog-white/10 bg-navy-surface/35 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-glow-cyan/30 hover:shadow-cyan-glow"
          >
            <div className="flex items-center justify-between">
              <span className="font-jetbrains-mono text-[10px] tracking-[0.12em] text-fog-white/35">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-glow-cyan/10 text-glow-cyan transition-colors group-hover:bg-glow-cyan/15">
                <Icon name={service.icon} size={20} />
              </span>
            </div>
            <h3 className="mt-6 font-sora text-[16px] font-semibold tracking-[-0.015em] text-fog-white">
              {service.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-fog-white/55">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
