"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductoForm } from "@/components/admin/ProductoForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";
import type { Categoria, Producto } from "@/types";

export default function EditarProducto() {
  const { id } = useParams<{ id: string }>();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [producto, setProducto] = useState<Producto | null>(null);

  useEffect(() => {
    listarCategorias().then(setCategorias);
    listarProductos().then((prods) => setProducto(prods.find((p) => p.id === id) ?? null));
  }, [id]);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Editar producto</h1>
        {producto ? <ProductoForm categorias={categorias} producto={producto} /> : <p className="text-[14px] text-steel-blue-gray">Cargando…</p>}
      </main>
    </>
  );
}
