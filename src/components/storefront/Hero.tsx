"use client";

import Image from "next/image";
import Link from "next/link";
import { useParallax } from "@/hooks/useParallax";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Icon } from "@/components/ui/Icon";
import type { ConfigTienda, Producto } from "@/types";

export function Hero({ config, productoDestacado }: { config: ConfigTienda; productoDestacado?: Producto | null }) {
  const parallax = useParallax(0.15);
  const { ref, visible } = useScrollAnimation<HTMLDivElement>();

  const trustBadges = [
    { icon: "shield-check" as const, text: "Envío gratis" },
    { icon: "truck" as const, text: "Garantía 12 meses" },
    { icon: "message-circle" as const, text: "Soporte WhatsApp" },
  ];

  const imagenUrl = productoDestacado?.imagenes?.[0]?.url ?? productoDestacado?.imagenes?.[0]?.thumb ?? null;
  const imagenAlt = productoDestacado?.imagenes?.[0]?.alt ?? "Mundo Celular";

  return (
    <section
      ref={ref}
      className="relative flex min-h-[88vh] items-center overflow-hidden py-20 sm:min-h-[92vh]"
      aria-label="Bienvenida a Mundo Celular"
    >
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className={`text-center lg:text-left ${visible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="mb-4 inline-flex items-center gap-2 rounded-chips border border-faint-border bg-pure-white/70 px-3 py-1.5 text-[12px] font-medium text-text-secondary backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
            Tienda de confianza en {config.ciudad}
          </p>

          <h1 className="font-inter-tight text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-text sm:text-[48px] lg:text-[60px]">
            La mejor tecnología,
            <br className="hidden sm:block" /> al mejor precio.
          </h1>

          <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-relaxed text-text-secondary sm:text-[18px] lg:mx-0">
            Smartphones, accesorios y equipos originales con garantía real y respaldo en {config.ciudad}.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="#ofertas"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-7 text-[14px] font-semibold text-pure-white shadow-sm-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(30,79,168,0.3)]"
            >
              Comprar ahora
            </Link>
            <Link
              href="#categorias"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-faint-border bg-pure-white px-7 text-[14px] font-semibold text-text transition-all duration-200 hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(30,79,168,0.3)]"
            >
              Ver catálogo
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[13px] text-text-secondary lg:justify-start">
            {trustBadges.map((b) => (
              <li key={b.text} className="flex items-center gap-2">
                <Icon name={b.icon} size={16} className="text-primary" />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-primary-light/20 blur-[80px]"
            style={{ borderRadius: "50%" }}
          />
          <div
            style={{ transform: `translateY(${parallax}px)` }}
            className="relative aspect-square w-full overflow-hidden rounded-cards border border-faint-border bg-canvas-frost shadow-lg-2"
          >
            {imagenUrl ? (
              <Image
                src={imagenUrl}
                alt={imagenAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className={`h-full w-full object-cover ${visible ? "animate-scale-in" : "opacity-0"}`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-inter-tight text-[18px] font-semibold text-text-secondary">
                  Mundo Celular
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Link
        href="#ofertas"
        aria-label="Ver ofertas"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-text-secondary lg:block"
      >
        <Icon name="chevron-down" size={28} className="motion-reduce:animate-none" />
      </Link>
    </section>
  );
}
