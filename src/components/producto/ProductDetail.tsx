"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import { useConfig } from "@/components/auth/ConfigProvider";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import type { Producto, Categoria, VarianteProducto } from "@/types";

export function ProductDetail({
  producto,
  categoria,
  variantes = [],
}: {
  producto: Producto;
  categoria: Categoria | null;
  variantes?: VarianteProducto[];
}) {
  const config = useConfig();
  const [imgActiva, setImgActiva] = useState(0);
  const [selecciones, setSelecciones] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const tieneVariantes = Boolean(producto.tieneVariantes) && variantes.length > 0;

  const varianteSeleccionada = useMemo(() => {
    if (!tieneVariantes) return null;
    return variantes.find((v) =>
      Object.entries(selecciones).every(([attr, val]) => v.attributes[attr] === val)
    ) ?? null;
  }, [tieneVariantes, variantes, selecciones]);

  const opcionesPorAtributo = useMemo(() => {
    if (!tieneVariantes) return {} as Record<string, string[]>;
    const atributos = producto.atributosDisponibles ?? [];
    const out: Record<string, string[]> = {};
    for (const attr of atributos) {
      out[attr] = [...new Set(variantes.map((v) => v.attributes[attr]).filter(Boolean))];
    }
    return out;
  }, [tieneVariantes, variantes, producto.atributosDisponibles]);

  const imagenes =
    (varianteSeleccionada?.imagenes && varianteSeleccionada.imagenes.length > 0)
      ? varianteSeleccionada.imagenes
      : (producto.imagenes ?? []);

  const precioMostrar = varianteSeleccionada?.precio ?? producto.precio;
  const stockMostrar = varianteSeleccionada?.stock ?? producto.stock;

  const atributosTexto = Object.values(selecciones).join(" / ");
  const mensajeWhatsApp = atributosTexto
    ? `Hola, me interesa ${producto.nombre} (${atributosTexto})`
    : `Hola, me interesa ${producto.nombre}`;
  const urlWhatsApp = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Galería */}
        <div className="flex flex-col gap-3 lg:flex-1">
          <div className="relative aspect-square w-full overflow-hidden rounded-cards border border-fog-white/15 bg-navy-surface/20">
            {imagenes.length > 0 ? (
              <Image
                src={imagenes[imgActiva]?.url || ""}
                alt={imagenes[imgActiva]?.alt || producto.nombre}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-text-secondary">
                Sin imagen
              </div>
            )}
          </div>

          {imagenes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgActiva(i)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-cards-sm border-2 transition-all duration-200 ${
                    i === imgActiva
                      ? "border-glow-cyan"
                      : "border-fog-white/15 hover:border-glow-cyan/50"
                  }`}
                >
                  <Image
                    src={img.thumb || img.url}
                    alt={img.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-6 lg:w-[560px] lg:flex-shrink-0">
          {categoria && (
            <Link
              href={`/categoria/${categoria.slug}`}
              className="inline-block w-fit rounded-chips bg-glow-cyan/10 px-3 py-1 text-[12px] font-medium text-glow-cyan"
            >
              {categoria.nombre}
            </Link>
          )}

          <div>
            {producto.marca && (
              <p className="text-[12px] font-semibold uppercase tracking-widest text-glow-cyan">
                Marca: {producto.marca}
              </p>
            )}
            <h1 className="font-inter-tight text-[28px] font-bold tracking-[-0.03em] text-fog-white sm:text-[40px]">
              {producto.nombre}
            </h1>
          </div>

          <p className="font-inter-tight text-[32px] font-bold text-glow-cyan sm:text-[36px]">
            {formatearCOP(precioMostrar)}
          </p>

          {stockMostrar > 0 ? (
            <p className="text-[14px] font-medium text-success">
              Disponible: {stockMostrar}
            </p>
          ) : (
            <Badge variant="danger">Agotado</Badge>
          )}

          {tieneVariantes && (producto.atributosDisponibles ?? []).length > 0 && (
            <div className="flex flex-col gap-3 rounded-cards border border-fog-white/10 bg-navy-surface/40 p-4">
              {(producto.atributosDisponibles ?? []).map((attr) => (
                <div key={attr}>
                  <label
                    htmlFor={`attr-${attr}`}
                    className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-fog-white/70"
                  >
                    {attr}
                  </label>
                  <select
                    id={`attr-${attr}`}
                    value={selecciones[attr] ?? ""}
                    onChange={(e) =>
                      setSelecciones((prev) => ({ ...prev, [attr]: e.target.value }))
                    }
                    className="w-full rounded-pills border border-fog-white/15 bg-navy-surface px-4 py-3 text-[14px] text-fog-white outline-none transition-all duration-200 focus:border-glow-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.2)]"
                  >
                    <option value="">Seleccionar…</option>
                    {(opcionesPorAtributo[attr] ?? []).map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {producto.descripcion && (
            <p className="text-[16px] leading-relaxed text-fog-white">
              {producto.descripcion}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {stockMostrar > 0 && (
              <div className="premium-button-wrapper">
                <AgregarAlCarrito
                  producto={producto}
                  variante={varianteSeleccionada ?? undefined}
                />
              </div>
            )}
            <a
              href={urlWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-pills border-2 border-glow-cyan bg-fog-white px-6 text-[14px] font-semibold text-navy-deep transition-all duration-200 hover:bg-glow-cyan hover:text-navy-deep hover:shadow-cyan-glow focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan/40"
            >
              <Icon name="message-circle" size={18} className="mr-2" />
              Comprar por WhatsApp
            </a>
          </div>

          {Object.keys(producto.specs).length > 0 && (
            <div className="rounded-cards border border-fog-white/10 bg-navy-surface/40 p-4">
              <h3 className="mb-3 font-inter-tight text-[16px] font-semibold text-fog-white">
                Especificaciones
              </h3>
              <dl className="space-y-2">
                {Object.entries(producto.specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between border-b border-fog-white/10 py-2 last:border-0"
                  >
                    <dt className="text-[13px] text-fog-white/70">{k}</dt>
                    <dd className="font-jetbrains-mono text-[14px] font-medium text-fog-white">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-fog-white/15 bg-navy-base/95 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[12px] text-fog-white/70">Precio</p>
              <p className="font-inter-tight text-[18px] font-bold text-glow-cyan">
                {formatearCOP(precioMostrar)}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={urlWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-pills bg-glow-cyan px-4 text-[13px] font-semibold text-navy-deep"
              >
                WhatsApp
              </a>
              {stockMostrar > 0 && (
                <div className="premium-button-wrapper">
                  <AgregarAlCarrito
                    producto={producto}
                    variante={varianteSeleccionada ?? undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}