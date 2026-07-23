"use client";

import { useEffect, useState } from "react";

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
    <div className="space-y-6">
      <div className="rounded-cards bg-pure-white p-6 shadow-sm-2">
        <h2 className="text-[16px] font-semibold text-ink-navy">Agregar administrador</h2>
        <form onSubmit={handleAsignar} className="mt-4 flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            required
            className="flex-1 rounded-chips border border-faint-border px-4 py-2 text-[14px] focus:border-mundo-blue focus:outline-none"
          />
          <button
            type="submit"
            disabled={cargando || !validarEmail(email)}
            className="rounded-chips bg-mundo-blue px-6 py-2 text-[14px] font-medium text-pure-white transition hover:opacity-90 disabled:opacity-50"
          >
            {cargando ? "Asignando…" : "Dar permiso"}
          </button>
        </form>
      </div>

      {mensaje && (
        <div className={`rounded-chips px-4 py-3 text-[14px] ${mensaje.tipo === "exito" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="rounded-cards bg-pure-white p-6 shadow-sm-2">
        <h2 className="text-[16px] font-semibold text-ink-navy">Administradores actuales</h2>
        {cargandoLista ? (
          <p className="mt-4 text-[14px] text-steel-blue-gray">Cargando…</p>
        ) : admins.length === 0 ? (
          <p className="mt-4 text-[14px] text-steel-blue-gray">No hay administradores registrados.</p>
        ) : (
          <ul className="mt-4 divide-y divide-faint-border">
            {admins.map((admin) => (
              <li key={admin.email} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${admin.pendiente ? "bg-yellow-500" : "bg-green-500"}`} />
                  <span className="text-[14px] text-ink-navy">{admin.email}</span>
                  {admin.pendiente && (
                    <span className="text-[12px] text-yellow-600">(pendiente)</span>
                  )}
                </div>
                <button
                  onClick={() => handleRevocar(admin.email)}
                  disabled={cargando}
                  className="text-[14px] text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
