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

  const [tipoEntrega, setTipoEntrega] = useState<"retiro" | "domicilio">("retiro");
  const [direccion, setDireccion] = useState("");
  const [barrio, setBarrio] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  if (!usuario) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-16 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-bg">
          <Icon name="user" size={32} className="text-text-secondary" />
        </span>
        <h1 className="mt-6 font-inter-tight text-[24px] font-semibold text-text">
          Inicia sesión para continuar
        </h1>
        <p className="mt-3 text-[15px] text-text-secondary">
          Necesitas iniciar sesión para confirmar tu pedido
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[12px] bg-primary px-6 text-[14px] font-semibold text-pure-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Iniciar sesión
        </Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-16 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-bg">
          <Icon name="shopping-bag" size={32} className="text-text-secondary" />
        </span>
        <h1 className="mt-6 font-inter-tight text-[24px] font-semibold text-text">
          Tu carrito está vacío
        </h1>
        <p className="mt-3 text-[15px] text-text-secondary">
          Agrega productos antes de continuar
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[12px] bg-primary px-6 text-[14px] font-semibold text-pure-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Ver productos
        </Link>
      </main>
    );
  }

  async function confirmarPedido() {
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
      <h1 className="mb-8 font-inter-tight text-[28px] font-bold tracking-[-0.03em] text-text sm:text-[32px]">
        Checkout
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Card Tu pedido */}
        <div className="flex-1 rounded-[24px] border border-faint-border bg-surface p-6 sm:p-8">
          <h2 className="mb-6 font-inter-tight text-[18px] font-semibold text-text">
            Tu pedido
          </h2>

          <ul className="space-y-4">
            {items.map((item) => {
              const attrs = item.atributos ? Object.values(item.atributos).join(" / ") : null;
              return (
                <li
                  key={`${item.productoId}__${item.varianteId ?? ""}`}
                  className="flex justify-between border-b border-faint-border pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-[14px] font-medium text-text">{item.nombre}</p>
                    {attrs && (
                      <p className="mt-0.5 text-[12px] text-text-secondary">{attrs}</p>
                    )}
                    <p className="mt-1 text-[12px] text-text-secondary">x{item.cantidad}</p>
                  </div>
                  <span className="font-jetbrains-mono text-[14px] font-medium text-text">
                    {formatearCOP(item.precio * item.cantidad)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 border-t border-faint-border pt-4">
            <div className="flex justify-between text-[18px] font-bold text-text">
              <span>Total</span>
              <span className="font-jetbrains-mono">{formatearCOP(total)}</span>
            </div>
          </div>
        </div>

        {/* Card Entrega */}
        <div className="lg:w-[400px] lg:flex-shrink-0">
          <div className="rounded-[24px] border border-faint-border bg-surface p-6 sm:p-8">
            <h2 className="mb-6 font-inter-tight text-[18px] font-semibold text-text">
              Entrega
            </h2>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-faint-border p-4 transition-all duration-200 hover:border-primary-light">
                <input
                  type="radio"
                  name="entrega"
                  checked={tipoEntrega === "retiro"}
                  onChange={() => setTipoEntrega("retiro")}
                  className="h-5 w-5 accent-primary"
                />
                <div>
                  <p className="text-[14px] font-medium text-text">Retiro en tienda</p>
                  <p className="text-[12px] text-text-secondary">Gratis</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-faint-border p-4 transition-all duration-200 hover:border-primary-light">
                <input
                  type="radio"
                  name="entrega"
                  checked={tipoEntrega === "domicilio"}
                  onChange={() => setTipoEntrega("domicilio")}
                  className="h-5 w-5 accent-primary"
                />
                <div>
                  <p className="text-[14px] font-medium text-text">Domicilio</p>
                  <p className="text-[12px] text-text-secondary">Gratis</p>
                </div>
              </label>
            </div>

            {tipoEntrega === "domicilio" && (
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="direccion" className="mb-1.5 block text-[13px] font-medium text-text-secondary">
                    Dirección *
                  </label>
                  <input
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full rounded-[12px] border border-faint-border bg-pure-white px-4 py-3 text-[14px] text-text outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Cra 45 #12-30"
                  />
                </div>
                <div>
                  <label htmlFor="barrio" className="mb-1.5 block text-[13px] font-medium text-text-secondary">
                    Barrio
                  </label>
                  <input
                    id="barrio"
                    value={barrio}
                    onChange={(e) => setBarrio(e.target.value)}
                    className="w-full rounded-[12px] border border-faint-border bg-pure-white px-4 py-3 text-[14px] text-text outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="El Poblado"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-6 text-[14px] text-danger">{error}</p>
      )}

      <button
        onClick={confirmarPedido}
        disabled={procesando}
        className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-primary px-6 text-[14px] font-semibold text-pure-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none sm:w-auto"
      >
        {procesando ? "Procesando…" : "Confirmar pedido"}
      </button>
    </main>
  );
}