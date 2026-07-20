"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarSlug } from "@/lib/slug";
import { crearCategoria, actualizarCategoria } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export function CategoriaForm({ categoria }: { categoria?: Categoria }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? "");
  const [orden, setOrden] = useState(categoria?.orden ?? 0);
  const [activa, setActiva] = useState(categoria?.activa ?? true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      if (categoria) await actualizarCategoria(categoria.id, { nombre, descripcion, orden, activa });
      else await crearCategoria({ nombre, descripcion, orden, activa });
      router.push("/admin/categorias");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setGuardando(false);
    }
  }

  const inputClase =
    "w-full rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] text-ink-navy outline-none focus:border-mundo-blue";

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4 rounded-cards bg-pure-white p-6 shadow-sm-2">
      <div>
        <label htmlFor="nombre" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Nombre</label>
        <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClase} />
        {nombre && <p className="mt-1 font-jetbrains-mono text-[12px] text-steel-blue-gray">/{generarSlug(nombre)}</p>}
      </div>
      <div>
        <label htmlFor="descripcion" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Descripción (SEO)</label>
        <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className={inputClase} />
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label htmlFor="orden" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Orden</label>
          <input id="orden" type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className={`${inputClase} w-24`} />
        </div>
        <label className="mt-5 flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} /> Activa
        </label>
      </div>
      {error && <p className="text-[12px] text-mundo-blue">{error}</p>}
      <button type="submit" disabled={guardando} className="rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2 disabled:opacity-50">
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
