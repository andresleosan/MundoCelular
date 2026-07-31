"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import type { Producto, Categoria, VarianteProducto } from "@/types";

const WHATSAPP_NUMERO = "573113554021";

export function ProductDetail({
  producto,
  categoria,
  variantes = [],
}: {
  producto: Producto;
  categoria: Categoria | null;
  variantes?: VarianteProducto[];
}) {
  const [imgActiva, setImgActiva] = useState(0);
  const [selecciones, setSelecciones] = useState<Record<string, string>>({});

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
  const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        {imagenes.length > 1 && (
          <div className="flex gap-2 sm:flex-col">
            {imagenes.map((img, i) => (
              <button
                key={i}
                onClick={() => setImgActiva(i)}
                className={`relative h-16 w-16 overflow-hidden rounded-[12px] border-2 transition ${
                  i === imgActiva ? "border-mundo-blue" : "border-faint-border"
                }`}
              >
                <Image
                  src={img.thumb || img.url}
                  alt={img.alt}
                  fill
                  sizes="64px"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 rounded-2xl bg-canvas-frost aspect-square overflow-hidden">
          {imagenes.length > 0 ? (
            <Image
              src={imagenes[imgActiva]?.url || ""}
              alt={imagenes[imgActiva]?.alt || producto.nombre}
              className="h-full w-full object-cover"
              width={800}
              height={800}
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-steel-blue-gray text-[14px]">
              Sin imagen
            </div>
          )}
        </div>
      </div>

      <div>
        {categoria && (
          <Link
            href={`/categoria/${categoria.slug}`}
            className="inline-block rounded-full bg-blue-wash px-2 py-0.5 text-[11px] font-medium text-steel-blue-gray mb-2"
          >
            {categoria.nombre}
          </Link>
        )}
        <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-gray-900">
          {producto.nombre}
        </h1>
        <p className="mt-2 font-jetbrains-mono text-[20px] text-gray-900">
          {formatearCOP(precioMostrar)}
        </p>
        {producto.marca && (
          <p className="mt-1 text-[12px] text-steel-blue-gray">
            Marca: {producto.marca}
          </p>
        )}
        {stockMostrar > 0 ? (
          <p className="mt-1 text-[12px] text-steel-blue-gray">
            Disponible: {stockMostrar}
          </p>
        ) : (
          <p className="mt-1 text-[12px] text-steel-blue-gray">Agotado</p>
        )}
      </div>

      {tieneVariantes && (producto.atributosDisponibles ?? []).length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm-2">
          {(producto.atributosDisponibles ?? []).map((attr) => (
            <div key={attr}>
              <label htmlFor={`attr-${attr}`} className="mb-1 block text-[12px] font-medium text-steel-blue-gray">
                {attr}
              </label>
              <select
                id={`attr-${attr}`}
                value={selecciones[attr] ?? ""}
                onChange={(e) => setSelecciones((prev) => ({ ...prev, [attr]: e.target.value }))}
                className="w-full rounded-chips border border-faint-border bg-pure-white px-3 py-2 text-[14px] text-ink-navy outline-none focus:border-mundo-blue"
              >
                <option value="">Seleccionar…</option>
                {(opcionesPorAtributo[attr] ?? []).map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {producto.descripcion && (
        <p className="text-[16px] tracking-[-0.02em] text-gray-900">
          {producto.descripcion}
        </p>
      )}

      {Object.keys(producto.specs).length > 0 && (
        <dl className="rounded-2xl bg-white p-4 shadow-sm-2">
          {Object.entries(producto.specs).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between border-b border-faint-border py-2 last:border-0"
            >
              <dt className="text-[12px] text-steel-blue-gray">{k}</dt>
              <dd className="font-jetbrains-mono text-[14px] text-gray-900">
                {v}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="sticky bottom-4 flex flex-wrap gap-3">
        {stockMostrar > 0 && (
          <AgregarAlCarrito
            producto={producto}
            variante={varianteSeleccionada ?? undefined}
          />
        )}
        <a
          href={urlWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
        >
          Comprar por WhatsApp
        </a>
      </div>
    </div>
  );
}