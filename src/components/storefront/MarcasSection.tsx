"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Marca {
  nombre: string;
  logo: string;
}

const MARCAS: Marca[] = [
  { nombre: "Apple", logo: "🍎" },
  { nombre: "Samsung", logo: "📱" },
  { nombre: "Xiaomi", logo: "📲" },
  { nombre: "Motorola", logo: "📱" },
  { nombre: "Honor", logo: "📱" },
  { nombre: "Redmi", logo: "📲" },
];

export function MarcasSection() {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section
      id="marcas"
      ref={ref}
      className="mx-auto max-w-[1280px] px-4 py-16 sm:py-20"
      aria-label="Marcas"
    >
      <div className="mb-10 text-center">
        <h2 className="font-sora text-[24px] font-semibold tracking-[-0.02em] text-fog-white sm:text-[32px]">
          Las marcas que distribuimos y reparamos
        </h2>
        <p className="mt-3 text-[15px] text-fog-white/70 sm:text-[16px]">
          Equipos originales con respaldo directo
        </p>
      </div>

      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {MARCAS.map((m, i) => (
          <div
            key={m.nombre}
            className={`group relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-cards border border-fog-white/10 bg-navy-surface/40 transition-all duration-300 hover:-translate-y-0.5 hover:border-glow-cyan/30 hover:shadow-cyan-glow ${visible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-glow-cyan/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative font-sora text-[18px] font-semibold tracking-[-0.01em] text-fog-white/80 transition-colors duration-300 group-hover:text-glow-cyan sm:text-[20px]">
              {m.nombre}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}