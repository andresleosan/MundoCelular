"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Marca {
  nombre: string;
  color: string;
}

const MARCAS: Marca[] = [
  { nombre: "Apple", color: "#000000" },
  { nombre: "Samsung", color: "#1428A0" },
  { nombre: "Xiaomi", color: "#FF6700" },
  { nombre: "Motorola", color: "#5C5C5C" },
  { nombre: "Honor", color: "#1E4FA8" },
  { nombre: "Realme", color: "#FFC901" },
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
        <h2 className="font-inter-tight text-[24px] font-semibold tracking-[-0.02em] text-text sm:text-[32px]">
          Las marcas que confían en nosotros
        </h2>
        <p className="mt-3 text-[15px] text-text-secondary sm:text-[16px]">
          Equipos originales con respaldo directo
        </p>
      </div>

      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {MARCAS.map((m, i) => (
          <div
            key={m.nombre}
            className={`group flex aspect-[16/9] items-center justify-center rounded-2xl border border-faint-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-sm ${visible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span
              className="font-inter-tight text-[18px] font-semibold tracking-[-0.01em] text-text-secondary transition-colors duration-200 group-hover:text-[color:var(--brand-color)] sm:text-[20px]"
              style={{ ["--brand-color" as string]: m.color }}
            >
              {m.nombre}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
