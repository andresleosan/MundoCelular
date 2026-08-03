"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarSlug } from "@/lib/slug";
import { crearCategoria, actualizarCategoria } from "@/lib/firestore/categorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5 rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {nombre && <p className="text-[12px] text-muted-foreground">/{generarSlug(nombre)}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (SEO)</Label>
        <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <Label htmlFor="orden">Orden</Label>
          <Input id="orden" type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className="w-24" />
        </div>
        <label className="flex items-center gap-2 pt-6 text-[14px]">
          <Checkbox checked={activa} onCheckedChange={(v) => setActiva(!!v)} />
          Activa
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
