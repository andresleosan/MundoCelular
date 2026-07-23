"use client";

import { useState, useRef } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { ImagenProducto } from "@/types";

interface ImageUploaderProps {
  imagenes: ImagenProducto[];
  onChange: (imagenes: ImagenProducto[]) => void;
  maximo?: number;
}

export function ImageUploader({ imagenes, onChange, maximo = 5 }: ImageUploaderProps) {
  const { subirImagen, subiendo, progreso } = useImageUpload();
  const [error, setError] = useState("");
  const [altTemp, setAltTemp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagenes.length >= maximo) {
      setError(`M\u00e1ximo ${maximo} im\u00e1genes`);
      return;
    }

    setError("");
    try {
      const result = await subirImagen(file, altTemp || file.name.replace(/\.\w+$/, ""));
      onChange([...imagenes, result]);
      setAltTemp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function eliminar(index: number) {
    const nuevas = imagenes.filter((_, i) => i !== index);
    onChange(nuevas);
  }

  function mover(from: number, to: number) {
    if (to < 0 || to >= imagenes.length) return;
    const nuevas = [...imagenes];
    const [item] = nuevas.splice(from, 1);
    nuevas.splice(to, 0, item);
    onChange(nuevas);
  }

  function actualizarAlt(index: number, alt: string) {
    const nuevas = imagenes.map((img, i) => i === index ? { ...img, alt } : img);
    onChange(nuevas);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="mb-1 block text-[12px] font-medium text-steel-blue-gray">
        Im\u00e1genes (m\u00e1ximo {maximo})
      </label>

      {imagenes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imagenes.map((img, i) => (
            <div key={i} className="relative rounded-cards border border-faint-border bg-pure-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, src es blob URL (no R2); no impacta CWV del storefront */}
              <img src={img.thumb} alt={img.alt} className="aspect-square w-full rounded-[12px] object-cover" />
              <input
                value={img.alt}
                onChange={(e) => actualizarAlt(i, e.target.value)}
                placeholder="Alt text"
                className="mt-1 w-full rounded-chips border border-faint-border px-2 py-1 text-[11px] outline-none focus:border-mundo-blue"
              />
              <div className="mt-1 flex gap-1">
                <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0} className="rounded-chips border border-faint-border px-2 py-0.5 text-[10px] disabled:opacity-30">\u2190</button>
                <button type="button" onClick={() => mover(i, i + 1)} disabled={i === imagenes.length - 1} className="rounded-chips border border-faint-border px-2 py-0.5 text-[10px] disabled:opacity-30">\u2192</button>
                <button type="button" onClick={() => eliminar(i)} className="ml-auto rounded-chips border border-red-300 px-2 py-0.5 text-[10px] text-red-600">\u00d7</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {imagenes.length < maximo && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
            id="image-upload"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={subiendo}
              className="rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[12px] text-ink-navy hover:bg-canvas-frost disabled:opacity-50"
            >
              {subiendo ? `Subiendo ${progreso}%...` : "Agregar imagen"}
            </button>
            <input
              value={altTemp}
              onChange={(e) => setAltTemp(e.target.value)}
              placeholder="Alt text (opcional)"
              className="flex-1 rounded-chips border border-faint-border bg-pure-white px-3 py-2 text-[12px] outline-none focus:border-mundo-blue"
            />
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-mundo-blue">{error}</p>}
    </div>
  );
}
