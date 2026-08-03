"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Circle } from "lucide-react";

interface AdminUser {
  email: string;
  admin: boolean;
  pendiente: boolean;
}

export function AdminUsuarios() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);

  useEffect(() => {
    cargarAdmins();
  }, []);

  async function cargarAdmins() {
    setCargandoLista(true);
    try {
      const res = await fetch("/api/admin/usuarios");
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {
      setMensaje({ tipo: "error", texto: "Error al cargar administradores" });
    }
    setCargandoLista(false);
  }

  async function handleAsignar(e: React.FormEvent) {
    e.preventDefault();
    if (!validarEmail(email)) return;
    setCargando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: "exito", texto: data.mensaje });
        setEmail("");
        cargarAdmins();
      } else {
        setMensaje({ tipo: "error", texto: data.error });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error al asignar permiso" });
    }
    setCargando(false);
  }

  async function handleRevocar(adminEmail: string) {
    if (!confirm(`¿Quitar permisos de admin a ${adminEmail}?`)) return;
    setCargando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: "exito", texto: data.mensaje });
        cargarAdmins();
      } else {
        setMensaje({ tipo: "error", texto: data.error });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error al revocar permiso" });
    }
    setCargando(false);
  }

  function validarEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Agregar administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAsignar} className="flex gap-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              required
              className="flex-1"
            />
            <Button type="submit" disabled={cargando || !validarEmail(email)}>
              <Plus className="size-4" />
              Dar permiso
            </Button>
          </form>
        </CardContent>
      </Card>

      {mensaje && (
        <div className={`rounded-lg border px-4 py-3 text-[14px] ${
          mensaje.tipo === "exito"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-destructive/30 bg-destructive/5 text-destructive"
        }`}>
          {mensaje.texto}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Administradores actuales</CardTitle>
        </CardHeader>
        <CardContent>
          {cargandoLista ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : admins.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[14px] text-muted-foreground">
                No hay administradores registrados.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {admins.map((admin) => (
                <li key={admin.email} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Circle
                      className={`size-2 fill-current ${
                        admin.pendiente ? "text-yellow-500" : "text-green-500"
                      }`}
                    />
                    <span className="text-[14px]">{admin.email}</span>
                    {admin.pendiente && (
                      <span className="text-[12px] text-yellow-600">(pendiente)</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevocar(admin.email)}
                    disabled={cargando}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
