"use client";

import Link from "next/link";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { PhoneStack } from "@/components/storefront/PhoneStack";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { ConfigTienda, Producto } from "@/types";

interface HeroProps {
  config: ConfigTienda;
  productoDestacado?: Producto | null;
}

const trustBadges: { icon: IconName; text: string }[] = [
  { icon: "shield-check", text: "Garantía 12 meses" },
  { icon: "truck", text: "Envío gratis en Medellín" },
  { icon: "message-circle", text: "Soporte WhatsApp" },
];

export function Hero({ config }: HeroProps) {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section
      ref={ref}
      className="relative flex min-h-[88vh] items-center overflow-hidden bg-navy-base py-20 sm:min-h-[92vh]"
      aria-label="Bienvenida a Mundo Celular"
    >
      {/* Background depth: gradient mesh + radial glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy-base to-navy-surface opacity-90" />
        <div
          className="absolute -left-20 top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #00D4FF 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-10 bottom-10 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #0035A8 0%, transparent 70%)" }}
        />
        {/* Noise texture overlay for premium feel */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* Copy column */}
        <div className={`text-center lg:text-left ${visible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="mb-5 inline-flex items-center gap-2 rounded-chips border border-glow-cyan/20 bg-glow-cyan/5 px-3 py-1.5 text-[12px] font-medium text-glow-cyan-soft backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-glow-cyan shadow-[0_0_8px_#00D4FF]" />
            Tienda de confianza en {config.ciudad}
          </p>

          <h1 className="font-sora text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-fog-white sm:text-[48px] lg:text-[60px]">
            La mejor tecnología,
            <br className="hidden sm:block" /> al mejor precio.
          </h1>

          <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-relaxed text-fog-white/70 sm:text-[18px] lg:mx-0">
            Smartphones, accesorios y equipos originales con garantía real y respaldo en {config.ciudad}.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="#ofertas"
              className="inline-flex h-12 items-center justify-center rounded-pills bg-glow-cyan px-7 text-[14px] font-semibold text-navy-deep shadow-cyan-glow transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-glow-hover focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan/40"
            >
              Comprar ahora
            </Link>
            <Link
              href="#categorias"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-fog-white/15 bg-fog-white/5 px-7 text-[14px] font-semibold text-fog-white backdrop-blur-sm transition-all duration-200 hover:border-glow-cyan/40 hover:bg-fog-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan/30"
            >
              Ver catálogo
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[13px] text-fog-white/70 lg:justify-start">
            {trustBadges.map((b) => (
              <li key={b.text} className="flex items-center gap-2">
                <Icon name={b.icon} size={16} className="text-glow-cyan" />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual column */}
        <div className={`flex justify-center ${visible ? "animate-scale-in" : "opacity-0"}`}>
          <PhoneStack />
        </div>
      </div>

      {/* Scroll indicator */}
      <Link
        href="#ofertas"
        aria-label="Ver ofertas"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-fog-white/40 lg:block motion-reduce:animate-none"
      >
        <Icon name="chevron-down" size={28} className="animate-bounce-down" />
      </Link>
    </section>
  );
}
