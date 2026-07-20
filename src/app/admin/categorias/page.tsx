"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { eliminarCategoria, listarCategorias } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState("");

  const cargar = () => listarCategorias().then(setCategorias).catch(() => setError("No se pudieron cargar"));
  useEffect(() => { cargar(); }, []);

  async function eliminar(id: string) {
    setError("");
    try {
      await eliminarCategoria(id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Categorías</h1>
          <Link href="/admin/categorias/nueva" className="rounded-chips bg-mundo-blue px-4 py-2 text-[14px] font-semibold text-pure-white shadow-lg-2">
            Nueva categoría
          </Link>
        </div>
        {error && <p className="mt-4 text-[12px] text-mundo-blue">{error}</p>}
        <ul className="mt-6 flex flex-col gap-3">
          {categorias.map((c) => (
            <li key={c.id} className="flex items-center gap-4 rounded-cards bg-pure-white px-6 py-4 shadow-sm-2">
              <span className="text-[14px] font-semibold">{c.nombre}</span>
              <span className="font-jetbrains-mono text-[12px] text-steel-blue-gray">/{c.slug}</span>
              {!c.activa && <span className="rounded-chips bg-canvas-frost px-2 py-1 text-[11px] text-steel-blue-gray">inactiva</span>}
              <span className="ml-auto flex gap-2">
                <Link href={`/admin/categorias/${c.id}`} className="rounded-chips border border-faint-border px-3 py-1 text-[12px]">Editar</Link>
                <button onClick={() => eliminar(c.id)} className="rounded-chips border border-faint-border px-3 py-1 text-[12px] text-steel-blue-gray">
                  Eliminar
                </button>
              </span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
