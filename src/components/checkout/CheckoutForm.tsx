"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/hooks/useCarrito";
import { useAuth } from "@/hooks/useAuth";
import { formatearCOP } from "@/lib/format";

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
      <main className="mx-auto max-w-[600px] px-4 py-10 text-center">
        <h1 className="text-[20px] font-semibold">Checkout</h1>
        <p className="mt-4 text-[14px] text-steel-blue-gray">
          Necesitas iniciar sesi\u00f3n para confirmar tu pedido.
        </p>
        <a href="/admin/login" className="mt-4 inline-block rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white">
          Iniciar sesi\u00f3n
        </a>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10 text-center">
        <h1 className="text-[20px] font-semibold">Checkout</h1>
        <p className="mt-4 text-[14px] text-steel-blue-gray">Tu carrito est\u00e1 vac\u00edo.</p>
        <Link href="/" className="mt-4 inline-block rounded-chips border border-faint-border px-6 py-3 text-[14px]">
          Seguir comprando
        </Link>
      </main>
    );
  }

  async function confirmarPedido() {
    if (tipoEntrega === "domicilio" && !direccion.trim()) {
      setError("La direcci\u00f3n es obligatoria para domicilio");
      return;
    }

    setProcesando(true);
    setError("");

    try {
      if (!usuario) throw new Error("Sesi\u00f3n no v\u00e1lida");
      const token = await usuario.getIdToken();
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
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

  const inputClase = "w-full rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] text-ink-navy outline-none focus:border-mundo-blue";

  return (
    <main className="mx-auto max-w-[600px] px-4 py-10">
      <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Checkout</h1>

      <section className="mt-6 rounded-cards bg-pure-white p-6 shadow-sm-2">
        <h2 className="text-[14px] font-semibold text-steel-blue-gray">Tu pedido</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.productoId} className="flex justify-between text-[14px]">
              <span>{item.nombre} x{item.cantidad}</span>
              <span className="font-jetbrains-mono">{formatearCOP(item.precio * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-faint-border pt-3 text-right">
          <span className="text-[14px] font-semibold">Total: </span>
          <span className="font-jetbrains-mono text-[16px] text-mundo-blue">{formatearCOP(total)}</span>
        </div>
      </section>

      <section className="mt-6 rounded-cards bg-pure-white p-6 shadow-sm-2">
        <h2 className="text-[14px] font-semibold text-steel-blue-gray">Entrega</h2>
        <div className="mt-3 flex gap-4">
          <label className="flex items-center gap-2 text-[14px]">
            <input type="radio" name="entrega" checked={tipoEntrega === "retiro"} onChange={() => setTipoEntrega("retiro")} />
            Retiro en tienda
          </label>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="radio" name="entrega" checked={tipoEntrega === "domicilio"} onChange={() => setTipoEntrega("domicilio")} />
            Domicilio
          </label>
        </div>

        {tipoEntrega === "domicilio" && (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label htmlFor="direccion" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Direcci\u00f3n *</label>
              <input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} className={inputClase} placeholder="Cra 45 #12-30" />
            </div>
            <div>
              <label htmlFor="barrio" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Barrio (opcional)</label>
              <input id="barrio" value={barrio} onChange={(e) => setBarrio(e.target.value)} className={inputClase} placeholder="El Poblado" />
            </div>
          </div>
        )}
      </section>

      {error && <p className="mt-4 text-[12px] text-mundo-blue">{error}</p>}

      <button
        onClick={confirmarPedido}
        disabled={procesando}
        className="mt-6 w-full rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2 disabled:opacity-50"
      >
        {procesando ? "Procesando\u2026" : "Confirmar pedido"}
      </button>
    </main>
  );
}
