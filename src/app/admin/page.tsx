"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";

export default function AdminInicio() {
  const [totales, setTotales] = useState<{ categorias: number; productos: number; activos: number } | null>(null);

  useEffect(() => {
    Promise.all([listarCategorias(), listarProductos()]).then(([cats, prods]) => {
      setTotales({ categorias: cats.length, productos: prods.length, activos: prods.filter((p) => p.activo).length });
    });
  }, []);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Panel de administración</h1>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Categorías", valor: totales?.categorias },
            { etiqueta: "Productos", valor: totales?.productos },
            { etiqueta: "Productos activos", valor: totales?.activos },
          ].map((c) => (
            <div key={c.etiqueta} className="rounded-cards bg-pure-white p-6 shadow-sm-2">
              <p className="text-[12px] font-medium text-steel-blue-gray">{c.etiqueta}</p>
              <p className="mt-2 font-jetbrains-mono text-[16px]">{c.valor ?? "…"}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
