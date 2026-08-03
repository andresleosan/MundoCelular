"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearProducto, actualizarProducto } from "@/lib/firestore/productos";
import { validarProducto } from "@/lib/validacion";
import { ImageUploader } from "./ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5 rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="precio">Precio (COP, entero)</Label>
          <Input id="precio" type="number" min="1" step="1" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label>Categoría</Label>
          <Select value={categoriaId || undefined} onValueChange={(v) => setCategoriaId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="marca">Marca</Label>
          <Input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Apple, Samsung, Xiaomi…" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specs">Specs (una por línea, formato &quot;Clave: Valor&quot;)</Label>
        <Textarea id="specs" value={specsTexto} onChange={(e) => setSpecsTexto(e.target.value)} rows={3} className="font-mono text-[13px]" placeholder={"Almacenamiento: 128GB\nRAM: 6GB"} />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-[14px]">
          <Checkbox checked={activo} onCheckedChange={(v) => setActivo(!!v)} />
          Activo
        </label>
        <label className="flex items-center gap-2 text-[14px]">
          <Checkbox checked={destacado} onCheckedChange={(v) => setDestacado(!!v)} />
          Destacado
        </label>
        <label className="flex items-center gap-2 text-[14px]">
          <Checkbox checked={tieneVariantes} onCheckedChange={(v) => setTieneVariantes(!!v)} />
          Tiene variantes
        </label>
      </div>

      {tieneVariantes && (
        <div className="space-y-2">
          <Label htmlFor="atributos-disponibles">Atributos disponibles (separados por coma)</Label>
          <Input id="atributos-disponibles" value={atributosTexto} onChange={(e) => setAtributosTexto(e.target.value)} placeholder="Color, Capacidad" />
          <p className="text-[11px] text-muted-foreground">Después de guardar el producto podrás crear variantes con estos atributos.</p>
        </div>
      )}

      {errores.length > 0 && (
        <ul className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
          {errores.map((err) => <li key={err}>{err}</li>)}
        </ul>
      )}

      <ImageUploader imagenes={imagenes} onChange={setImagenes} />

      <Button type="submit" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
