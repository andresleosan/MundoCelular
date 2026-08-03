"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import type { Producto } from "@/types";

interface Resultado { producto: Producto; categoriaSlug: string; }

export function Buscador() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const marca = params.get("marca") ?? "";
  const [resultados, setResultados] = useState<Resultado[] | null>(null);

  useEffect(() => {
    const filtros = new URLSearchParams();
    if (q.trim()) filtros.set("q", q.trim());
    if (marca.trim()) filtros.set("marca", marca.trim());
    if (!filtros.size) { setResultados([]); return; }

    setResultados(null);
    fetch(`/api/buscar?${filtros.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo buscar");
        return r.json();
      })
      .then((d) => setResultados(d.resultados ?? []))
      .catch(() => setResultados([]));
  }, [q, marca]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-fog-white">
        {marca ? `Productos de ${marca}` : `Resultados para "${q}"`}
      </h1>
      {resultados === null ? (
        <p className="mt-6 text-[14px] text-fog-white/70">Buscando…</p>
      ) : resultados.length === 0 ? (
        <p className="mt-6 text-[14px] text-fog-white/70">No encontramos productos. Prueba con otra palabra o escríbenos por WhatsApp.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {resultados.map((r) => <HeroProductCard key={r.producto.id} producto={r.producto} categoriaSlug={r.categoriaSlug} />)}
        </div>
      )}
    </main>
  );
}
