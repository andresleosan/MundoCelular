"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { eliminarProducto, listarProductos } from "@/lib/firestore/productos";
import { formatearCOP } from "@/lib/format";
import type { Producto } from "@/types";

export default function ProductosAdmin() {
  const [productos, setProductos] = useState<Producto[]>([]);

  const cargar = () => listarProductos().then(setProductos);
  useEffect(() => { cargar(); }, []);

  async function eliminar(id: string) {
    await eliminarProducto(id);
    await cargar();
  }

  return (
    <main className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Productos</h1>
          <Link href="/admin/productos/nueva" className="rounded-chips bg-mundo-blue px-4 py-2 text-[14px] font-semibold text-pure-white shadow-lg-2">
            Nuevo producto
          </Link>
        </div>
        <ul className="mt-6 flex flex-col gap-3">
          {productos.map((p) => (
            <li key={p.id} className="flex items-center gap-4 rounded-cards bg-pure-white px-6 py-4 shadow-sm-2">
              <div>
                <p className="text-[14px] font-semibold">{p.nombre} {p.destacado && <span className="ml-1 rounded-chips bg-canvas-frost px-2 py-0.5 text-[11px] text-mundo-blue">destacado</span>}</p>
                <p className="font-jetbrains-mono text-[12px] text-steel-blue-gray">
                  {formatearCOP(p.precio)} · stock {p.stock} · /{p.slug}
                </p>
              </div>
              {!p.activo && <span className="rounded-chips bg-canvas-frost px-2 py-1 text-[11px] text-steel-blue-gray">inactivo</span>}
              <span className="ml-auto flex gap-2">
                <Link href={`/admin/productos/${p.id}`} className="rounded-chips border border-faint-border px-3 py-1 text-[12px]">Editar</Link>
                <button onClick={() => eliminar(p.id)} className="rounded-chips border border-faint-border px-3 py-1 text-[12px] text-steel-blue-gray">Eliminar</button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
