"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/hooks/useCarrito";
import { useAuth } from "@/hooks/useAuth";
import { formatearCOP } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

export function CheckoutForm() {
  const { items, total, vaciar } = useCarrito();
  const { usuario } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [barrio, setBarrio] = useState("");
  const [ciudad, setCiudad] = useState("Medellín");
  const [observaciones, setObservaciones] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"retiro" | "domicilio">("retiro");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  if (!usuario) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-16 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-navy-surface/40">
          <Icon name="user" size={32} className="text-fog-white/70" />
        </span>
        <h1 className="mt-6 font-inter-tight text-[24px] font-semibold text-fog-white">
          Inicia sesión para continuar
        </h1>
        <p className="mt-3 text-[15px] text-fog-white/70">
          Necesitas iniciar sesión para confirmar tu pedido
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[12px] bg-glow-cyan px-6 text-[14px] font-semibold text-navy-deep transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Iniciar sesión
        </button>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-16 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-navy-surface/40">
          <Icon name="shopping-bag" size={32} className="text-fog-white/70" />
        </span>
        <h1 className="mt-6 font-inter-tight text-[24px] font-semibold text-fog-white">
          Tu carrito está vacío
        </h1>
        <p className="mt-3 text-[15px] text-fog-white/70">
          Agrega productos antes de continuar
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[12px] bg-glow-cyan px-6 text-[14px] font-semibold text-navy-deep transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Ver productos
        </Link>
      </main>
    );
  }

  async function confirmarPedido() {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!telefono.trim()) {
      setError("El teléfono es obligatorio");
      return;
    }
    if (tipoEntrega === "domicilio" && !direccion.trim()) {
      setError("La dirección es obligatoria para domicilio");
      return;
    }

    setProcesando(true);
    setError("");

    try {
      if (!usuario) throw new Error("Sesión no válida");
      const token = await usuario.getIdToken();
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            varianteId: i.varianteId,
            atributos: i.atributos,
          })),
          entrega: { tipo: tipoEntrega, direccion: direccion.trim() || undefined, barrio: barrio.trim() || undefined },
          clienteNombre: nombre.trim(),
          clienteTelefono: telefono.trim(),
          ciudad: ciudad.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear pedido");

      window.open(
        `https://wa.me/${data.whatsapp}?text=${encodeURIComponent(data.mensaje)}`,
        "_blank"
      );

      vaciar();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setProcesando(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:py-12">
      <h1 className="mb-8 font-inter-tight text-[28px] font-bold tracking-[-0.03em] text-fog-white sm:text-[32px]">
        Checkout
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Card Tu pedido */}
        <div className="flex-1 rounded-[24px] border border-fog-white/10 bg-navy-surface/40 p-6 sm:p-8">
          <h2 className="mb-6 font-inter-tight text-[18px] font-semibold text-fog-white">
            Tu pedido
          </h2>

          <ul className="space-y-4">
            {items.map((item) => {
              const attrs = item.atributos ? Object.values(item.atributos).join(" / ") : null;
              return (
                <li
                  key={`${item.productoId}__${item.varianteId ?? ""}`}
                  className="flex justify-between border-b border-fog-white/10 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-[14px] font-medium text-fog-white">{item.nombre}</p>
                    {attrs && (
                      <p className="mt-0.5 text-[12px] text-fog-white/70">{attrs}</p>
                    )}
                    <p className="mt-1 text-[12px] text-fog-white/70">x{item.cantidad}</p>
                  </div>
                  <span className="font-jetbrains-mono text-[14px] font-medium text-fog-white">
                    {formatearCOP(item.precio * item.cantidad)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 border-t border-fog-white/10 pt-4">
            <div className="flex justify-between text-[18px] font-bold text-fog-white">
              <span>Total</span>
              <span className="font-jetbrains-mono">{formatearCOP(total)}</span>
            </div>
          </div>
        </div>

        {/* Card Entrega */}
        <div className="lg:w-[400px] lg:flex-shrink-0">
          <div className="rounded-[24px] border border-fog-white/10 bg-navy-surface/40 p-6 sm:p-8">
            <h2 className="mb-6 font-inter-tight text-[18px] font-semibold text-fog-white">
              Datos de entrega
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="nombre" className="mb-1.5 block text-[13px] font-medium text-fog-white/70">
                  Nombre completo *
                </label>
                <input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-[12px] border border-fog-white/15 bg-navy-surface px-4 py-3 text-[14px] text-fog-white outline-none transition-all duration-200 focus:border-glow-cyan/60 focus:ring-4 focus:ring-glow-cyan/10"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="mb-1.5 block text-[13px] font-medium text-fog-white/70">
                  Teléfono *
                </label>
                <input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded-[12px] border border-fog-white/15 bg-navy-surface px-4 py-3 text-[14px] text-fog-white outline-none transition-all duration-200 focus:border-glow-cyan/60 focus:ring-4 focus:ring-glow-cyan/10"
                  placeholder="300 123 4567"
                />
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-fog-white/15 p-4 transition-all duration-200 hover:border-glow-cyan/40">
                  <input
                    type="radio"
                    name="entrega"
                    checked={tipoEntrega === "retiro"}
                    onChange={() => setTipoEntrega("retiro")}
                    className="h-5 w-5 accent-glow-cyan"
                  />
                  <div>
                    <p className="text-[14px] font-medium text-fog-white">Retiro en tienda</p>
                    <p className="text-[12px] text-fog-white/70">Gratis</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-fog-white/15 p-4 transition-all duration-200 hover:border-glow-cyan/40">
                  <input
                    type="radio"
                    name="entrega"
                    checked={tipoEntrega === "domicilio"}
                    onChange={() => setTipoEntrega("domicilio")}
                    className="h-5 w-5 accent-glow-cyan"
                  />
                  <div>
                    <p className="text-[14px] font-medium text-fog-white">Domicilio</p>
                    <p className="text-[12px] text-fog-white/70">Gratis</p>
                  </div>
                </label>
              </div>

              {tipoEntrega === "domicilio" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="direccion" className="mb-1.5 block text-[13px] font-medium text-fog-white/70">
                      Dirección *
                    </label>
                    <input
                      id="direccion"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full rounded-[12px] border border-fog-white/15 bg-navy-surface px-4 py-3 text-[14px] text-fog-white outline-none transition-all duration-200 focus:border-glow-cyan/60 focus:ring-4 focus:ring-glow-cyan/10"
                      placeholder="Cra 45 #12-30"
                    />
                  </div>
                  <div>
                    <label htmlFor="barrio" className="mb-1.5 block text-[13px] font-medium text-fog-white/70">
                      Barrio
                    </label>
                    <input
                      id="barrio"
                      value={barrio}
                      onChange={(e) => setBarrio(e.target.value)}
                      className="w-full rounded-[12px] border border-fog-white/15 bg-navy-surface px-4 py-3 text-[14px] text-fog-white outline-none transition-all duration-200 focus:border-glow-cyan/60 focus:ring-4 focus:ring-glow-cyan/10"
                      placeholder="El Poblado"
                    />
                  </div>
                  <div>
                    <label htmlFor="ciudad" className="mb-1.5 block text-[13px] font-medium text-fog-white/70">
                      Ciudad
                    </label>
                    <input
                      id="ciudad"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="w-full rounded-[12px] border border-fog-white/15 bg-navy-surface px-4 py-3 text-[14px] text-fog-white outline-none transition-all duration-200 focus:border-glow-cyan/60 focus:ring-4 focus:ring-glow-cyan/10"
                      placeholder="Medellín"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="observaciones" className="mb-1.5 block text-[13px] font-medium text-fog-white/70">
                  Observaciones
                </label>
                <textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full rounded-[12px] border border-fog-white/15 bg-navy-surface px-4 py-3 text-[14px] text-fog-white outline-none transition-all duration-200 focus:border-glow-cyan/60 focus:ring-4 focus:ring-glow-cyan/10 resize-none"
                  placeholder="Instrucciones especiales, referencias, etc."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-6 text-[14px] text-danger">{error}</p>
      )}

      <button
        onClick={confirmarPedido}
        disabled={procesando}
        className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-glow-cyan px-6 text-[14px] font-semibold text-navy-deep transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none sm:w-auto"
      >
        {procesando ? "Procesando…" : "Confirmar pedido"}
      </button>
    </main>
  );
}