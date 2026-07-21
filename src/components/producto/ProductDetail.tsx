"use client";

import Image from "next/image";
import Link from "next/link";
import { formatearCOP } from "@/lib/format";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import type { Producto, Categoria } from "@/types";

const WHATSAPP_NUMERO = "573113554021";

export function ProductDetail({
  producto,
  categoria,
}: {
  producto: Producto;
  categoria: Categoria | null;
}) {
  const mensajeWhatsApp = `Hola, me interesa ${producto.nombre}`;
  const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-canvas-frost aspect-square overflow-hidden">
        {producto.imagenes[0]?.url ? (
          <Image
            src={producto.imagenes[0].url}
            alt={producto.imagenes[0].alt}
            className="h-full w-full object-cover"
            width={800}
            height={800}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-steel-blue-gray text-[14px]">
            Sin imagen
          </div>
        )}
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
          {formatearCOP(producto.precio)}
        </p>
        {producto.marca && (
          <p className="mt-1 text-[12px] text-steel-blue-gray">
            Marca: {producto.marca}
          </p>
        )}
        {producto.stock > 0 ? (
          <p className="mt-1 text-[12px] text-steel-blue-gray">
            Disponible: {producto.stock}
          </p>
        ) : (
          <p className="mt-1 text-[12px] text-steel-blue-gray">Agotado</p>
        )}
      </div>

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
        {producto.stock > 0 && <AgregarAlCarrito producto={producto} />}
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