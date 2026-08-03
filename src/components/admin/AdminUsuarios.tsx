"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ShieldOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AdminState = { email: string; uid: string; displayName: string; photoURL: string; createdAt: string; lastLogin: string; active: boolean };
type ClienteState = { email: string; uid: string; displayName: string; photoURL: string; createdAt: string; lastLogin: string; active: boolean };
type TabType = "admins" | "clientes";

export function AdminUsuarios() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState<TabType>("admins");
  const [admins, setAdmins] = useState<AdminState[]>([]);
  const [clientes, setClientes] = useState<ClienteState[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [uidInput, setUidInput] = useState("");
  const [accionando, setAccionando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const headers = useCallback(async (): Promise<Record<string, string>> => {
    if (!usuario) return {};
    const token = await usuario.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [usuario]);

  const cargarAdmins = useCallback(async () => {
    try {
      const h = await headers();
      const res = await fetch("/api/admin/usuarios", { headers: h });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error del servidor");
      }
      const data = await res.json();
      setAdmins(data.admins || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar administradores");
    }
  }, [headers]);

  const cargarClientes = useCallback(async () => {
    try {
      const h = await headers();
      const res = await fetch("/api/admin/usuarios?role=customer", { headers: h });
      if (!res.ok) throw new Error("Error del servidor");
      const data = await res.json();
      setClientes(data.clientes || []);
    } catch {
      // silencioso en tab secundaria
    }
  }, [headers]);

  useEffect(() => {
    setCargando(true);
    Promise.all([cargarAdmins(), cargarClientes()]).finally(() => setCargando(false));
  }, [cargarAdmins, cargarClientes]);

  async function agregarAdmin() {
    if (!uidInput.trim()) return;
    setAccionando(true);
    setMensaje(null);
    try {
      const h = await headers();
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ uid: uidInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMensaje({ tipo: "success", texto: "Administrador agregado correctamente" });
      setUidInput("");
      await cargarAdmins();
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "Error al agregar" });
    } finally {
      setAccionando(false);
    }
  }

  async function removerAdmin(uid: string) {
    if (!confirm("¿Revocar permisos de administrador?")) return;
    setAccionando(true);
    setMensaje(null);
    try {
      const h = await headers();
      const res = await fetch("/api/admin/usuarios", {
        method: "DELETE",
        headers: h,
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMensaje({ tipo: "success", texto: "Administrador revocado" });
      await cargarAdmins();
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "Error al revocar" });
    } finally {
      setAccionando(false);
    }
  }

  const clientesFiltrados = clientes.filter((c) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return c.email.toLowerCase().includes(q) || c.displayName.toLowerCase().includes(q) || c.uid.toLowerCase().includes(q);
  });

  function formatDate(ts: string | undefined) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setTab("admins")}
          className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
            tab === "admins" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Administradores
        </button>
        <button
          onClick={() => setTab("clientes")}
          className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
            tab === "clientes" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Clientes
        </button>
      </div>

      {mensaje && (
        <div className={`rounded-lg border px-4 py-3 text-[13px] ${
          mensaje.tipo === "success" ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400" : "border-destructive/30 bg-destructive/5 text-destructive"
        }`}>
          {mensaje.texto}
        </div>
      )}

      {tab === "admins" && (
        <div className="flex gap-2">
          <Input
            placeholder="UID del usuario a convertir en admin"
            value={uidInput}
            onChange={(e) => setUidInput(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={agregarAdmin} disabled={accionando || !uidInput.trim()} size="sm">
            <Plus className="size-4" />
            Agregar admin
          </Button>
        </div>
      )}

      {tab === "clientes" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {error && tab === "admins" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">{error}</div>
      )}

      {cargando && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!cargando && tab === "admins" && admins.length === 0 && !error && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-[14px] font-medium">No hay administradores</p>
          <p className="text-[13px] text-muted-foreground">Agrega un administrador usando su UID.</p>
        </div>
      )}

      {!cargando && tab === "clientes" && clientesFiltrados.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-[14px] font-medium">No se encontraron clientes</p>
          <p className="text-[13px] text-muted-foreground">Los clientes aparecerán cuando inicien sesión.</p>
        </div>
      )}

      {!cargando && tab === "admins" && admins.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">UID</th>
                <th className="px-4 py-3 text-left font-medium">Creado</th>
                <th className="px-4 py-3 text-left font-medium">Último acceso</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.uid} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[12px] font-medium text-primary">
                        {a.displayName?.charAt(0)?.toUpperCase() || a.email?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{a.displayName || "—"}</p>
                        <p className="text-[12px] text-muted-foreground">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{a.uid.slice(0, 12)}&hellip;</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.lastLogin)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removerAdmin(a.uid)}>
                      <ShieldOff className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && tab === "clientes" && clientesFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">UID</th>
                <th className="px-4 py-3 text-left font-medium">Registro</th>
                <th className="px-4 py-3 text-left font-medium">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => (
                <tr key={c.uid} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[12px] font-medium">
                        {c.displayName?.charAt(0)?.toUpperCase() || c.email?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{c.displayName || "—"}</p>
                        <p className="text-[12px] text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{c.uid.slice(0, 12)}&hellip;</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.lastLogin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
