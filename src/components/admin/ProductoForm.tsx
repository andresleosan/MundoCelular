"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearProducto, actualizarProducto } from "@/lib/firestore/productos";
import { validarProducto } from "@/lib/validacion";
import { ImageUploader } from "./ImageUploader";
import type { Categoria, Producto, ImagenProducto } from "@/types";

export function ProductoForm({ categorias, producto }: { categorias: Categoria[]; producto?: Producto }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(producto?.precio?.toString() ?? "");
  const [stock, setStock] = useState(producto?.stock?.toString() ?? "0");
  const [categoriaId, setCategoriaId] = useState(producto?.categoriaId ?? "");
  const [marca, setMarca] = useState(producto?.marca ?? "");
  const [specsTexto, setSpecsTexto] = useState(
    producto ? Object.entries(producto.specs).map(([k, v]) => `${k}: ${v}`).join("\n") : ""
  );
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
  const [imagenes, setImagenes] = useState<ImagenProducto[]>(producto?.imagenes ?? []);
  const [tieneVariantes, setTieneVariantes] = useState(producto?.tieneVariantes ?? false);
  const [atributosTexto, setAtributosTexto] = useState(
    producto?.atributosDisponibles?.join(", ") ?? ""
  );
  const [errores, setErrores] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  function parsearSpecs(): Record<string, string> {
    const specs: Record<string, string> = {};
    for (const linea of specsTexto.split("\n")) {
      const idx = linea.indexOf(":");
      if (idx > 0) specs[linea.slice(0, idx).trim()] = linea.slice(idx + 1).trim();
    }
    return specs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const atributos = atributosTexto.split(",").map((s) => s.trim()).filter(Boolean);
    const input = {
      nombre, descripcion,
      precio: Number(precio),
      stock: Number(stock),
      categoriaId, marca,
      specs: parsearSpecs(),
      activo, destacado,
      imagenes,
      tieneVariantes,
      atributosDisponibles: atributos,
    };
    const errs = validarProducto(input);
    if (errs.length > 0) {
      setErrores(errs);
      return;
    }
    setGuardando(true);
    setErrores([]);
    try {
      if (producto) await actualizarProducto(producto.id, input);
      else await crearProducto(input);
      router.push("/admin/productos");
    } catch (err) {
      setErrores([err instanceof Error ? err.message : "Error al guardar"]);
      setGuardando(false);
    }
  }

  const inputClase =
    "w-full rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] text-ink-navy outline-none focus:border-mundo-blue";
  const labelClase = "mb-1 block text-[12px] font-medium text-steel-blue-gray";

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4 rounded-cards bg-pure-white p-6 shadow-sm-2">
      <div>
        <label htmlFor="nombre" className={labelClase}>Nombre</label>
        <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClase} />
      </div>
      <div>
        <label htmlFor="descripcion" className={labelClase}>Descripción</label>
        <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className={inputClase} />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="precio" className={labelClase}>Precio (COP, entero)</label>
          <input id="precio" type="number" min="1" step="1" value={precio} onChange={(e) => setPrecio(e.target.value)} className={`${inputClase} font-jetbrains-mono`} />
        </div>
        <div className="flex-1">
          <label htmlFor="stock" className={labelClase}>Stock</label>
          <input id="stock" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} className={`${inputClase} font-jetbrains-mono`} />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="categoria" className={labelClase}>Categoría</label>
          <select id="categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputClase}>
            <option value="">Seleccionar…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="marca" className={labelClase}>Marca</label>
          <input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} className={inputClase} placeholder="Apple, Samsung, Xiaomi…" />
        </div>
      </div>
      <div>
        <label htmlFor="specs" className={labelClase}>Specs (una por línea, formato &quot;Clave: Valor&quot;)</label>
        <textarea id="specs" value={specsTexto} onChange={(e) => setSpecsTexto(e.target.value)} rows={3} className={`${inputClase} font-jetbrains-mono text-[12px]`} placeholder={"Almacenamiento: 128GB\nRAM: 6GB"} />
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Activo</label>
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} /> Destacado</label>
        <label className="flex items-center gap-2 text-[14px]"><input id="tiene-variantes" type="checkbox" checked={tieneVariantes} onChange={(e) => setTieneVariantes(e.target.checked)} /> Tiene variantes</label>
      </div>

      {tieneVariantes && (
        <div>
          <label htmlFor="atributos-disponibles" className={labelClase}>Atributos disponibles (separados por coma)</label>
          <input id="atributos-disponibles" value={atributosTexto} onChange={(e) => setAtributosTexto(e.target.value)} className={inputClase} placeholder="Color, Capacidad" />
          <p className="mt-1 text-[11px] text-steel-blue-gray">Después de guardar el producto podrás crear variantes con estos atributos.</p>
        </div>
      )}
      {errores.length > 0 && (
        <ul className="text-[12px] text-mundo-blue">
          {errores.map((err) => <li key={err}>{err}</li>)}
        </ul>
      )}
      <ImageUploader imagenes={imagenes} onChange={setImagenes} />
      <button type="submit" disabled={guardando} className="rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2 disabled:opacity-50">
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
