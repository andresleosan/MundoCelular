"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import type { Producto } from "@/types";

interface Resultado { producto: Producto; categoriaSlug: string; }

export function Buscador() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [resultados, setResultados] = useState<Resultado[] | null>(null);

  useEffect(() => {
    if (!q.trim()) { setResultados([]); return; }
    fetch(`/api/buscar?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d) => setResultados(d.resultados ?? [])).catch(() => setResultados([]));
  }, [q]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-fog-white">Resultados para &ldquo;{q}&rdquo;</h1>
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