"use client";

import Link from "next/link";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { PhoneStack } from "@/components/storefront/PhoneStack";
import { Icon } from "@/components/ui/Icon";
import type { ConfigTienda } from "@/types";

export function Hero({ config }: { config: ConfigTienda; productoDestacado?: import("@/types").Producto | null }) {
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  const trustBadges = [
    { icon: "shield-check" as const, text: "Envío gratis" },
    { icon: "truck" as const, text: "Garantía 12 meses" },
    { icon: "message-circle" as const, text: "Soporte WhatsApp" },
  ];

  return (
    <section
      ref={ref}
      className="relative flex min-h-[88vh] items-center overflow-hidden bg-navy-base py-20 sm:min-h-[92vh]"
      aria-label="Bienvenida a Mundo Celular"
    >
      {/* Subtle gradient overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-glow-cyan/5"
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className={`text-center lg:text-left ${visible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="mb-4 inline-flex items-center gap-2 rounded-chips border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-muted backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
            Tienda de confianza en {config.ciudad}
          </p>

          <h1 className="font-sora text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-fog-white sm:text-[48px] lg:text-[60px]">
            La mejor tecnología,
            <br className="hidden sm:block" /> al mejor precio.
          </h1>

          <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-relaxed text-slate-muted sm:text-[18px] lg:mx-0">
            Smartphones, accesorios y equipos originales con garantía real y respaldo en {config.ciudad}.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="#ofertas"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-coral-cta px-7 text-[14px] font-semibold text-pure-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-coral-cta/30"
            >
              Comprar ahora
            </Link>
            <Link
              href="#categorias"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 text-[14px] font-semibold text-fog-white backdrop-blur-sm transition-all duration-200 hover:border-glow-cyan/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan/30"
            >
              Ver catálogo
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[13px] text-slate-muted lg:justify-start">
            {trustBadges.map((b) => (
              <li key={b.text} className="flex items-center gap-2">
                <Icon name={b.icon} size={16} className="text-glow-cyan" />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`flex justify-center ${visible ? "animate-scale-in" : "opacity-0"}`}>
          <PhoneStack />
        </div>
      </div>

      <Link
        href="#ofertas"
        aria-label="Ver ofertas"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-slate-muted lg:block"
      >
        <Icon name="chevron-down" size={28} className="motion-reduce:animate-none" />
      </Link>
    </section>
  );
}
