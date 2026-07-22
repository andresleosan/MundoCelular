# Fase 3 — Checkout WhatsApp + Worker /pedidos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el flujo completo de pedido: checkout con formulario retiro/domicilio, Worker que crea el pedido en Firestore (recalculando precios y stock), apertura de WhatsApp con mensaje armado, y panel admin para gestionar estados.

**Architecture:** API route Next.js (`/api/pedidos`) como Worker (server-side con firebase-admin). Checkout page client-side que llama al Worker. Carrito persistente en Firestore (requiere sesión Google). Panel admin con estados de pedido.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind v4, firebase-admin 13, Vitest.

## Global Constraints

- **Spec de referencia:** `docs/superpowers/specs/2026-07-21-fase3-checkout-pedidos-design.md`
- **Regla de oro:** precio/stock NUNCA se confían del cliente — el servidor recalcula
- **Transacción atómica:** stock + pedido se crean juntos o no se crea ninguno
- **Idioma UI:** español (Colombia). Moneda: COP
- **Commits:** Conventional Commits en español
- **Cierre de tarea:** checklist de autocrítica del spec

---

### Task 1: Tipos y utilidades para pedidos

**Files:**
- Modify: `src/types/index.ts` (añadir tipos de pedido si faltan)
- Create: `src/lib/pedido.ts` (helper de mensaje WhatsApp)
- Test: `tests/lib/pedido.test.ts`

**Interfaces:**
- Produce: `armarMensajePedido(pedido, config): string`, `urlWhatsApp(numero, mensaje): string`

- [ ] **Step 1: Verificar tipos existentes**

`src/types/index.ts` ya tiene `Pedido` interface. Verificar que tenga los campos correctos según el spec. Añadir `ItemPedido` como tipo derivado si no existe.

- [ ] **Step 2: Test de armado de mensaje (falla)**

`tests/lib/pedido.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { armarmensajePedido } from "@/lib/pedido";

describe("armarMensajePedido", () => {
  it("arma texto con items, total COP y datos de entrega", () => {
    const msg = armarmensajePedido({
      items: [
        { productoId: "p1", nombre: "iPhone 13", precioUnitario: 1850000, cantidad: 1, subtotal: 1850000 },
        { productoId: "p2", nombre: "Case iPhone 13", precioUnitario: 40000, cantidad: 2, subtotal: 80000 },
      ],
      total: 1930000,
      entrega: { tipo: "domicilio", direccion: "Cra 45 #12-30, El Poblado" },
      clienteNombre: "Juan Pérez",
      pedidoId: "PED123",
    });
    expect(msg).toContain("iPhone 13");
    expect(msg).toContain("$ 1.930.000");
    expect(msg).toContain("Domicilio");
    expect(msg).toContain("Juan Pérez");
    expect(msg).toContain("PED123");
  });

  it("maneja retiro sin dirección", () => {
    const msg = armarmensajePedido({
      items: [{ productoId: "p1", nombre: "X", precioUnitario: 100000, cantidad: 1, subtotal: 100000 }],
      total: 100000,
      entrega: { tipo: "retiro" },
      clienteNombre: "Ana",
      pedidoId: "PED456",
    });
    expect(msg).toContain("Retiro en tienda");
    expect(msg).not.toContain("undefined");
  });
});
```

Run → FAIL.

- [ ] **Step 3: Implementar `src/lib/pedido.ts`**

```ts
import { formatearCOP } from "./format";
import type { Pedido } from "@/types";

type ItemPedido = Pedido["items"][number];

export function armarmensajePedido(pedido: {
  items: ItemPedido[];
  total: number;
  entrega: { tipo: "retiro" | "domicilio"; direccion?: string; barrio?: string };
  clienteNombre: string;
  pedidoId: string;
}): string {
  const lineas = pedido.items.map(
    (i) => `• ${i.nombre} — x${i.cantidad} — ${formatearCOP(i.subtotal)}`
  );
  const entrega = pedido.entrega.tipo === "domicilio"
    ? `Entrega: Domicilio — ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}`
    : "Entrega: Retiro en tienda";
  return [
    "Hola Mundo Celular, quiero comprar:",
    ...lineas,
    `Total: ${formatearCOP(pedido.total)}`,
    entrega,
    `Pedido #${pedido.pedidoId} — ${pedido.clienteNombre}`,
  ].join("\n");
}

export function urlWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
```

Run: `npm test -- tests/lib/pedido.test.ts` → PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pedido.ts tests/lib/pedido.test.ts
git commit -m "feat: helper armarmensajePedido y urlWhatsApp con tests"
```

---

### Task 2: API Route `POST /api/pedidos` (Worker)

**Files:**
- Create: `src/app/api/pedidos/route.ts`
- Test: `tests/api/pedidos.test.ts`

**Interfaces:**
- Consume: `getAdminApp` (`@/lib/firebase-admin`), tipos `Pedido`
- Produce: endpoint que crea pedido en Firestore

- [ ] **Step 1: Implementar `src/app/api/pedidos/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";

interface PedidoBody {
  items: Array<{ productoId: string; cantidad: number }>;
  entrega: { tipo: "retiro" | "domicilio"; direccion?: string; barrio?: string };
}

export async function POST(req: NextRequest) {
  // 1. Verificar token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  let decoded;
  try {
    decoded = await getAuth(getAdminApp()).verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // 2. Parsear body
  const body = (await req.json()) as PedidoBody;
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "items es obligatorio y no puede estar vacío" }, { status: 400 });
  }
  if (!body.entrega?.tipo || !["retiro", "domicilio"].includes(body.entrega.tipo)) {
    return NextResponse.json({ error: "entrega.tipo debe ser 'retiro' o 'domicilio'" }, { status: 400 });
  }
  if (body.entrega.tipo === "domicilio" && !body.entrega.direccion?.trim()) {
    return NextResponse.json({ error: "dirección es obligatoria para domicilio" }, { status: 400 });
  }

  const db = getFirestore(getAdminApp());

  try {
    // 3. Transacción: leer productos, verificar stock, crear pedido
    const pedidoId = await db.runTransaction(async (tx) => {
      // Leer todos los productos
      const refs = body.items.map((item) => db.collection("productos").doc(item.productoId));
      const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));

      // Verificar existencia y stock
      const itemsPedido = [];
      let total = 0;

      for (let i = 0; i < body.items.length; i++) {
        const snap = snaps[i];
        const item = body.items[i];

        if (!snap.exists) {
          throw new Error(`Producto ${item.productoId} no encontrado`);
        }

        const prod = snap.data()!;
        if (!prod.activo) {
          throw new Error(`Producto ${prod.nombre} no está activo`);
        }
        if (prod.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${prod.nombre}: disponible ${prod.stock}, solicitado ${item.cantidad}`);
        }

        const subtotal = prod.precio * item.cantidad;
        total += subtotal;

        itemsPedido.push({
          productoId: item.productoId,
          nombre: prod.nombre,
          precioUnitario: prod.precio,
          cantidad: item.cantidad,
          subtotal,
        });

        // Descontar stock
        tx.update(refs[i], { stock: prod.stock - item.cantidad });
      }

      // Crear pedido
      const pedidoRef = db.collection("pedidos").doc();
      tx.set(pedidoRef, {
        clienteUid: decoded.uid,
        clienteNombre: decoded.name || decoded.email || "Cliente",
        clienteEmail: decoded.email || "",
        items: itemsPedido,
        total,
        entrega: body.entrega,
        estado: "pendiente",
        creadoEn: FieldValue.serverTimestamp(),
        actualizadoEn: FieldValue.serverTimestamp(),
      });

      return pedidoRef.id;
    });

    // 4. Obtener config de tienda para el mensaje
    const configSnap = await db.doc("configuracion/tienda").get();
    const config = configSnap.data();
    const whatsapp = config?.whatsapp || "573113554021";

    // 5. Armar mensaje
    const pedidoSnap = await db.doc(`pedidos/${pedidoId}`).get();
    const pedido = pedidoSnap.data()!;

    const lineas = pedido.items.map(
      (i: any) => `• ${i.nombre} — x${i.cantidad} — $ ${i.subtotal.toLocaleString("es-CO")}`
    );
    const entrega = pedido.entrega.tipo === "domicilio"
      ? `Entrega: Domicilio — ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}`
      : "Entrega: Retiro en tienda";
    const mensaje = [
      "Hola Mundo Celular, quiero comprar:",
      ...lineas,
      `Total: $ ${pedido.total.toLocaleString("es-CO")}`,
      entrega,
      `Pedido #${pedidoId.slice(0, 8)} — ${decoded.name || decoded.email || "Cliente"}`,
    ].join("\n");

    return NextResponse.json({ pedidoId, mensaje, whatsapp });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al crear pedido";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pedidos
git commit -m "feat: endpoint POST /api/pedidos con transacción stock+pedido"
```

---

### Task 3: API Route `POST /api/pedidos/[id]/cancelar`

**Files:**
- Create: `src/app/api/pedidos/[id]/cancelar/route.ts`

- [ ] **Step 1: Implementar `src/app/api/pedidos/[id]/cancelar/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (decoded.admin !== true) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const db = getFirestore(getAdminApp());

  try {
    await db.runTransaction(async (tx) => {
      const pedidoRef = db.collection("pedidos").doc(id);
      const pedidoSnap = await tx.get(pedidoRef);

      if (!pedidoSnap.exists) {
        throw new Error("Pedido no encontrado");
      }

      const pedido = pedidoSnap.data()!;
      if (pedido.estado === "cancelado") {
        throw new Error("El pedido ya está cancelado");
      }

      // Reponer stock
      for (const item of pedido.items) {
        const prodRef = db.collection("productos").doc(item.productoId);
        const prodSnap = await tx.get(prodRef);
        if (prodSnap.exists) {
          tx.update(prodRef, { stock: prodSnap.data()!.stock + item.cantidad });
        }
      }

      // Actualizar estado
      tx.update(pedidoRef, {
        estado: "cancelado",
        actualizadoEn: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cancelar pedido";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pedidos/[id]
git commit -m "feat: endpoint POST /api/pedidos/[id]/cancelar con rep stock"
```

---

### Task 4: Checkout page `/checkout`

**Files:**
- Create: `src/app/checkout/page.tsx`, `src/app/checkout/layout.tsx`
- Create: `src/components/checkout/CheckoutForm.tsx`

**Interfaces:**
- Consume: `useCarrito()`, `useAuth()`, `obtenerConfigTiendaServidor()`
- Produce: página de checkout con formulario retiro/domicilio

- [ ] **Step 1: Checkout layout (noindex)**

`src/app/checkout/layout.tsx`:
```tsx
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: true } };
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: CheckoutForm component**

`src/components/checkout/CheckoutForm.tsx`:
```tsx
"use client";

import { useState } from "react";
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
          Necesitas iniciar sesión para confirmar tu pedido.
        </p>
        <a href="/admin/login" className="mt-4 inline-block rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white">
          Iniciar sesión
        </a>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10 text-center">
        <h1 className="text-[20px] font-semibold">Checkout</h1>
        <p className="mt-4 text-[14px] text-steel-blue-gray">Tu carrito está vacío.</p>
        <a href="/" className="mt-4 inline-block rounded-chips border border-faint-border px-6 py-3 text-[14px]">
          Seguir comprando
        </a>
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

      // Abrir WhatsApp
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

      {/* Resumen del carrito */}
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

      {/* Formulario de entrega */}
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
              <label htmlFor="direccion" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Dirección *</label>
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
        {procesando ? "Procesando…" : "Confirmar pedido"}
      </button>
    </main>
  );
}
```

- [ ] **Step 3: Página checkout**

`src/app/checkout/page.tsx`:
```tsx
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirma tu pedido en Mundo Celular",
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
```

- [ ] **Step 4: Verificar build**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/checkout src/components/checkout
git commit -m "feat: pagina checkout con formulario retiro/domicilio y POST al Worker"
```

---

### Task 5: Integrar carrito → checkout (actualizar CarritoResumen)

**Files:**
- Modify: `src/components/carrito/CarritoResumen.tsx`

- [ ] **Step 1: Cambiar botón "Ordenar por WhatsApp" por "Proceder al checkout"**

En `src/components/carrito/CarritoResumen.tsx`, reemplazar el botón de WhatsApp directo por un link a `/checkout`.

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/components/carrito
git commit -m "feat: carrito redirige a /checkout en lugar de WhatsApp directo"
```

---

### Task 6: Panel admin `/admin/pedidos`

**Files:**
- Create: `src/app/admin/pedidos/page.tsx`, `src/app/admin/pedidos/[id]/page.tsx`
- Modify: `src/components/admin/AdminNav.tsx` (añadir enlace Pedidos)

**Interfaces:**
- Consume: `useAuth()`, firebase-admin SDK (lectura de pedidos)
- Produce: lista de pedidos + detalle con cambio de estado

- [ ] **Step 1: Añadir "Pedidos" al AdminNav**

En `src/components/admin/AdminNav.tsx`, añadir `{ href: "/admin/pedidos", etiqueta: "Pedidos" }` al array `ENLACES`.

- [ ] **Step 2: Capa de datos `src/lib/firestore/pedidos.ts`**

```ts
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where, type Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { Pedido } from "@/types";

export async function listarPedidos(estado?: string): Promise<Pedido[]> {
  let q;
  if (estado) {
    q = query(collection(db, "pedidos"), where("estado", "==", estado), orderBy("creadoEn", "desc"));
  } else {
    q = query(collection(db, "pedidos"), orderBy("creadoEn", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Pedido, "id">) }));
}

export async function obtenerPedido(id: string): Promise<Pedido | null> {
  const snap = await getDoc(doc(db, "pedidos", id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Pedido, "id">) }) : null;
}

export async function actualizarEstadoPedido(id: string, estado: Pedido["estado"]): Promise<void> {
  await updateDoc(doc(db, "pedidos", id), { estado, actualizadoEn: new Date() });
}
```

- [ ] **Step 3: Página lista de pedidos**

`src/app/admin/pedidos/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { listarPedidos, actualizarEstadoPedido } from "@/lib/firestore/pedidos";
import { formatearCOP } from "@/lib/format";
import type { Pedido } from "@/types";

const ESTADOS = ["", "pendiente", "contactado", "cerrado", "cancelado"] as const;

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");

  const cargar = () => listarPedidos(filtro || undefined).then(setPedidos).catch(() => setError("No se pudieron cargar"));
  useEffect(() => { cargar(); }, [filtro]);

  async function cambiarEstado(id: string, estado: Pedido["estado"]) {
    setError("");
    try {
      await actualizarEstadoPedido(id, estado);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Pedidos</h1>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-chips border border-faint-border px-3 py-2 text-[14px]">
            <option value="">Todos</option>
            {ESTADOS.filter(Boolean).map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        {error && <p className="mt-4 text-[12px] text-mundo-blue">{error}</p>}
        <ul className="mt-6 flex flex-col gap-3">
          {pedidos.map((p) => (
            <li key={p.id} className="rounded-cards bg-pure-white px-6 py-4 shadow-sm-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[14px] font-semibold">#{p.id.slice(0, 8)}</span>
                  <span className="ml-3 text-[12px] text-steel-blue-gray">{p.clienteNombre}</span>
                </div>
                <span className="font-jetbrains-mono text-[14px] text-mundo-blue">{formatearCOP(p.total)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <span className={`rounded-chips px-2 py-1 ${
                  p.estado === "pendiente" ? "bg-canvas-frost text-ink-navy" :
                  p.estado === "contactado" ? "bg-blue-wash text-mundo-blue" :
                  p.estado === "cerrado" ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                }`}>{p.estado}</span>
                <span className="text-steel-blue-gray">{p.entrega.tipo === "domicilio" ? "Domicilio" : "Retiro"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.estado === "pendiente" && (
                  <>
                    <button onClick={() => cambiarEstado(p.id, "contactado")} className="rounded-chips border border-faint-border px-3 py-1 text-[12px]">Marcar contactado</button>
                    <button onClick={() => { if (confirm("¿Cancelar pedido y devolver stock?")) cambiarEstado(p.id, "cancelado"); }} className="rounded-chips border border-red-300 px-3 py-1 text-[12px] text-red-600">Cancelar</button>
                  </>
                )}
                {p.estado === "contactado" && (
                  <>
                    <button onClick={() => cambiarEstado(p.id, "cerrado")} className="rounded-chips border border-green-300 px-3 py-1 text-[12px] text-green-600">Cerrar</button>
                    <button onClick={() => { if (confirm("¿Cancelar pedido y devolver stock?")) cambiarEstado(p.id, "cancelado"); }} className="rounded-chips border border-red-300 px-3 py-1 text-[12px] text-red-600">Cancelar</button>
                  </>
                )}
                <Link href={`/admin/pedidos/${p.id}`} className="ml-auto text-[12px] text-mundo-blue">Ver detalle →</Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
```

- [ ] **Step 4: Página detalle de pedido**

`src/app/admin/pedidos/[id]/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { obtenerPedido, actualizarEstadoPedido } from "@/lib/firestore/pedidos";
import { formatearCOP } from "@/lib/format";
import type { Pedido } from "@/types";

export default function DetallePedido() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerPedido(id).then((p) => {
      if (!p) setError("Pedido no encontrado");
      else setPedido(p);
    });
  }, [id]);

  async function cambiarEstado(estado: Pedido["estado"]) {
    setError("");
    try {
      await actualizarEstadoPedido(id, estado);
      const p = await obtenerPedido(id);
      if (p) setPedido(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (!pedido) return <><AdminNav /><main className="mx-auto max-w-[800px] px-4 py-10 text-steel-blue-gray">Cargando…</main></>;

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[800px] px-4 py-10">
        <button onClick={() => router.back()} className="text-[12px] text-mundo-blue mb-4">← Volver</button>
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Pedido #{id.slice(0, 8)}</h1>

        <div className="mt-6 rounded-cards bg-pure-white p-6 shadow-sm-2">
          <div className="flex justify-between text-[14px]">
            <span className="font-semibold">{pedido.clienteNombre}</span>
            <span className="text-steel-blue-gray">{pedido.clienteEmail}</span>
          </div>
          <p className="mt-1 text-[12px] text-steel-blue-gray">UID: {pedido.clienteUid}</p>

          <h2 className="mt-4 text-[14px] font-semibold text-steel-blue-gray">Items</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {pedido.items.map((item) => (
              <li key={item.productoId} className="flex justify-between text-[14px]">
                <span>{item.nombre} x{item.cantidad}</span>
                <span className="font-jetbrains-mono">{formatearCOP(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-faint-border pt-3 text-right">
            <span className="font-semibold">Total: </span>
            <span className="font-jetbrains-mono text-mundo-blue">{formatearCOP(pedido.total)}</span>
          </div>

          <h2 className="mt-4 text-[14px] font-semibold text-steel-blue-gray">Entrega</h2>
          <p className="mt-1 text-[14px]">
            {pedido.entrega.tipo === "domicilio"
              ? `Domicilio — ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}`
              : "Retiro en tienda"}
          </p>

          <h2 className="mt-4 text-[14px] font-semibold text-steel-blue-gray">Estado</h2>
          <p className="mt-1 text-[14px] font-semibold">{pedido.estado}</p>

          <div className="mt-4 flex gap-2">
            {pedido.estado === "pendiente" && (
              <>
                <button onClick={() => cambiarEstado("contactado")} className="rounded-chips bg-mundo-blue px-4 py-2 text-[12px] font-semibold text-pure-white">Marcar contactado</button>
                <button onClick={() => { if (confirm("¿Cancelar y devolver stock?")) cambiarEstado("cancelado"); }} className="rounded-chips border border-red-300 px-4 py-2 text-[12px] text-red-600">Cancelar y devolver stock</button>
              </>
            )}
            {pedido.estado === "contactado" && (
              <>
                <button onClick={() => cambiarEstado("cerrado")} className="rounded-chips bg-green-600 px-4 py-2 text-[12px] font-semibold text-pure-white">Marcar cerrado</button>
                <button onClick={() => { if (confirm("¿Cancelar y devolver stock?")) cambiarEstado("cancelado"); }} className="rounded-chips border border-red-300 px-4 py-2 text-[12px] text-red-600">Cancelar y devolver stock</button>
              </>
            )}
          </div>
        </div>

        {error && <p className="mt-4 text-[12px] text-mundo-blue">{error}</p>}
      </main>
    </>
  );
}
```

- [ ] **Step 5: Verificar build**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/pedidos src/components/admin/AdminNav.tsx src/lib/firestore/pedidos.ts
git commit -m "feat: panel admin pedidos con estados y cancelacion con rep stock"
```

---

### Task 7: Test de integración del flujo completo

**Files:**
- Test: `tests/api/pedidos-flow.test.ts`

- [ ] **Step 1: Test del flujo (mocks de Firebase)**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de firebase-admin
vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(async () => ({ uid: "u1", name: "Juan", email: "juan@test.com", admin: false })),
  })),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminApp: vi.fn(() => ({})),
}));

describe("Flujo de pedido — integración", () => {
  it("POST /api/pedidos rechaza sin token", async () => {
    const { POST } = await import("@/app/api/pedidos/route");
    const req = new Request("http://localhost/api/pedidos", {
      method: "POST",
      headers: {},
      body: JSON.stringify({ items: [], entrega: { tipo: "retiro" } }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("armarmensajePedido genera texto correcto", async () => {
    const { armarmensajePedido } = await import("@/lib/pedido");
    const msg = armarmensajePedido({
      items: [{ productoId: "p1", nombre: "iPhone 13", precioUnitario: 1850000, cantidad: 1, subtotal: 1850000 }],
      total: 1850000,
      entrega: { tipo: "retiro" },
      clienteNombre: "Juan",
      pedidoId: "test-123",
    });
    expect(msg).toContain("iPhone 13");
    expect(msg).toContain("1.850.000");
    expect(msg).toContain("Retiro en tienda");
  });
});
```

- [ ] **Step 2: Verificar**

```bash
npm test
```

- [ ] **Step 3: Commit**

```bash
git add tests/api tests/lib/pedido.test.ts
git commit -m "test: tests de integracion del flujo de pedido"
```

---

### Task 8: Verificación final

- [ ] **Step 1: Full typecheck + lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 2: Build verification**

```bash
npm run build
```

- [ ] **Step 3: Resumen de archivos creados/modificados**

Creados:
- `src/app/api/pedidos/route.ts`
- `src/app/api/pedidos/[id]/cancelar/route.ts`
- `src/app/checkout/page.tsx`
- `src/app/checkout/layout.tsx`
- `src/components/checkout/CheckoutForm.tsx`
- `src/lib/pedido.ts`
- `src/lib/firestore/pedidos.ts`
- `src/app/admin/pedidos/page.tsx`
- `src/app/admin/pedidos/[id]/page.tsx`
- `tests/lib/pedido.test.ts`

Modificados:
- `src/components/carrito/CarritoResumen.tsx` (botón → checkout)
- `src/components/admin/AdminNav.tsx` (añadir enlace Pedidos)
- `src/app/not-found.tsx` (404)
- `src/app/admin/not-found.tsx` (404 admin)
