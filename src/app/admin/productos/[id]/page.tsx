"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductoForm } from "@/components/admin/ProductoForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";
import type { Categoria, Producto } from "@/types";

type Estado = "cargando" | "no-encontrada" | "error" | "lista";

export default function EditarProducto() {
  const { id } = useParams<{ id: string }>();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    setEstado("cargando");
    listarCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]));
    listarProductos()
      .then((prods) => {
        const encontrado = prods.find((p) => p.id === id);
        if (encontrado) {
          setProducto(encontrado);
          setEstado("lista");
        } else {
          setEstado("no-encontrada");
        }
      })
      .catch(() => setEstado("error"));
  }, [id]);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Editar producto</h1>
        {estado === "lista" && producto ? (
          <ProductoForm categorias={categorias} producto={producto} />
        ) : estado === "cargando" ? (
          <p className="text-[14px] text-steel-blue-gray">Cargando…</p>
        ) : (
          <div className="rounded-cards bg-pure-white p-6 shadow-sm-2">
            <h2 className="mb-2 text-[16px] font-semibold">
              {estado === "no-encontrada" ? "Producto no encontrado" : "No se pudo cargar el producto"}
            </h2>
            <p className="mb-4 text-[14px] text-steel-blue-gray">
              {estado === "no-encontrada"
                ? "El producto que buscás no existe o fue eliminado."
                : "Ocurrió un error al cargar el producto. Intentá de nuevo más tarde."}
            </p>
            <Link href="/admin/productos" className="rounded-chips border border-faint-border px-3 py-1 text-[12px]">
              Volver a productos
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
