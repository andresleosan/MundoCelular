"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConfig } from "@/components/auth/ConfigProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  listarPedidosCliente,
  type PaginaPedidosCliente,
} from "@/lib/firestore/pedidos";
import { formatearCOP } from "@/lib/format";
import type { Pedido } from "@/types";

function fechaPedido(valor: unknown): string {
  const fecha = valor instanceof Date
    ? valor
    : typeof valor === "object" && valor !== null && "toDate" in valor && typeof valor.toDate === "function"
      ? valor.toDate()
      : null;

  return fecha && !Number.isNaN(fecha.getTime())
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(fecha)
    : "Fecha no disponible";
}

function estadoLabel(estado: Pedido["estado"]): string {
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

function resumenProductos(pedido: Pedido): string {
  return pedido.items.map((item) => `${item.nombre} x${item.cantidad}`).join(", ");
}

export function HistorialPedidos() {
  const { usuario, cargando: cargandoSesion } = useAuth();
  const config = useConfig();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cursor, setCursor] = useState<PaginaPedidosCliente["cursor"]>(null);
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(false);
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    if (!usuario) {
      setPedidos([]);
      setCursor(null);
      setSeleccionado(null);
      return;
    }

    let activo = true;
    setCargando(true);
    setError(false);

    void listarPedidosCliente(usuario.uid)
      .then((pagina) => {
        if (!activo) return;
        setPedidos(pagina.pedidos);
        setCursor(pagina.cursor);
        setSeleccionado(null);
      })
      .catch(() => {
        if (activo) setError(true);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [reintento, usuario]);

  async function cargarMas() {
    if (!usuario || !cursor || cargandoMas) return;

    setCargandoMas(true);
    try {
      const pagina = await listarPedidosCliente(usuario.uid, cursor);
      setPedidos((actuales) => [...actuales, ...pagina.pedidos]);
      setCursor(pagina.cursor);
    } catch {
      setError(true);
    } finally {
      setCargandoMas(false);
    }
  }

  function prepararLogin() {
    localStorage.setItem("login-destino", "/cuenta/pedidos");
  }

  if (cargandoSesion) {
    return <main className="mx-auto max-w-[900px] px-4 py-14 text-fog-white/70">Cargando tu cuenta...</main>;
  }

  if (!usuario) {
    return (
      <main className="mx-auto max-w-[900px] px-4 py-14 text-center">
        <h1 className="font-inter-tight text-[28px] font-semibold tracking-[-0.03em] text-fog-white">Mis pedidos</h1>
        <p className="mt-3 text-[15px] text-fog-white/70">Inicia sesión para consultar tus compras.</p>
        <Link
          href="/login"
          onClick={prepararLogin}
          className="mt-6 inline-flex rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
        >
          Iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[900px] px-4 py-10 sm:py-14">
      <header className="max-w-[620px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-glow-cyan">Cuenta</p>
        <h1 className="mt-2 font-inter-tight text-[28px] font-semibold tracking-[-0.03em] text-fog-white sm:text-[34px]">Mis pedidos</h1>
        <p className="mt-3 text-[15px] text-fog-white/70">Consulta el estado y detalle de tus compras.</p>
      </header>

      {cargando && <p className="mt-8 text-[14px] text-fog-white/70">Cargando pedidos...</p>}

      {error && (
        <section className="mt-8 rounded-cards border border-fog-white/10 bg-navy-surface/40 p-6" role="alert">
          <p className="text-[15px] text-fog-white">No pudimos cargar tus pedidos.</p>
          <button
            type="button"
            onClick={() => setReintento((actual) => actual + 1)}
            className="mt-4 rounded-full border border-fog-white/20 px-4 py-2 text-[13px] font-semibold text-fog-white transition-colors hover:bg-fog-white/10"
          >
            Reintentar
          </button>
        </section>
      )}

      {!cargando && !error && pedidos.length === 0 && (
        <section className="mt-8 rounded-cards border border-fog-white/10 bg-navy-surface/40 p-6 text-center">
          <h2 className="font-inter-tight text-[20px] font-semibold text-fog-white">Todavía no tienes pedidos</h2>
          <p className="mt-2 text-[14px] text-fog-white/70">Cuando confirmes una compra, aparecerá aquí.</p>
          <Link href="/categoria" className="mt-5 inline-flex rounded-full border border-fog-white/20 px-4 py-2 text-[13px] font-semibold text-fog-white hover:bg-fog-white/10">
            Ver catálogo
          </Link>
        </section>
      )}

      {pedidos.length > 0 && (
        <div className="mt-8 grid gap-3">
          {pedidos.map((pedido) => {
            const idCorto = pedido.id.slice(0, 8);
            return (
              <button
                key={pedido.id}
                type="button"
                aria-label={`Pedido #${idCorto}`}
                onClick={() => setSeleccionado(pedido)}
                className="rounded-cards border border-fog-white/10 bg-navy-surface/40 p-5 text-left transition-colors hover:border-glow-cyan/50 hover:bg-navy-surface/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-jetbrains-mono text-[13px] text-fog-white">Pedido #{idCorto}</p>
                    <p className="mt-1 text-[12px] text-fog-white/60">{fechaPedido(pedido.creadoEn)}</p>
                  </div>
                  <span className="rounded-full bg-fog-white/10 px-3 py-1 text-[12px] font-medium text-fog-white">{estadoLabel(pedido.estado)}</span>
                </div>
                <p className="mt-4 truncate text-[14px] text-fog-white/75">{resumenProductos(pedido)}</p>
                <p className="mt-2 font-jetbrains-mono text-[15px] text-glow-cyan">{formatearCOP(pedido.total)}</p>
              </button>
            );
          })}
        </div>
      )}

      {cursor && !error && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={cargarMas}
            disabled={cargandoMas}
            className="rounded-full border border-fog-white/20 px-5 py-2.5 text-[14px] font-semibold text-fog-white transition-colors hover:bg-fog-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargandoMas ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      )}

      {seleccionado && (
        <section className="mt-8 rounded-cards border border-glow-cyan/30 bg-navy-deep p-6" aria-label={`Detalle del pedido ${seleccionado.id.slice(0, 8)}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-jetbrains-mono text-[13px] text-glow-cyan">Pedido #{seleccionado.id.slice(0, 8)}</p>
              <h2 className="mt-1 font-inter-tight text-[22px] font-semibold text-fog-white">Detalle de tu compra</h2>
            </div>
            <button type="button" onClick={() => setSeleccionado(null)} className="text-[13px] text-fog-white/70 hover:text-fog-white">
              Cerrar
            </button>
          </div>

          <ul className="mt-6 space-y-3">
            {seleccionado.items.map((item) => (
              <li key={`${item.productoId}-${item.varianteId ?? "base"}`} className="flex justify-between gap-4 text-[14px] text-fog-white/80">
                <span>{item.nombre} x{item.cantidad}{item.atributos ? ` (${Object.values(item.atributos).join(" / ")})` : ""}</span>
                <span className="font-jetbrains-mono shrink-0">{formatearCOP(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-fog-white/10 pt-5">
            <p className="text-[14px] text-fog-white">Entrega: {seleccionado.entrega.tipo === "domicilio" ? "Domicilio" : "Retiro en tienda"}</p>
            {seleccionado.entrega.tipo === "domicilio" && (
              <p className="mt-1 text-[13px] text-fog-white/70">
                {[seleccionado.entrega.direccion, seleccionado.entrega.barrio, seleccionado.ciudad].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="mt-4 font-jetbrains-mono text-[18px] text-glow-cyan">Total: {formatearCOP(seleccionado.total)}</p>
          </div>

          <a
            href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Hola Mundo Celular, necesito ayuda con el pedido #${seleccionado.id.slice(0, 8)}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-full bg-mundo-blue px-5 py-3 text-[14px] font-semibold text-white shadow-lg-2"
          >
            Abrir conversación en WhatsApp
          </a>
        </section>
      )}
    </main>
  );
}
