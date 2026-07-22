import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

interface PedidoBody {
  items: Array<{ productoId: string; cantidad: number }>;
  entrega: { tipo: "retiro" | "domicilio"; direccion?: string; barrio?: string };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: "Token inv\u00e1lido" }, { status: 401 });
  }

  const body = (await req.json()) as PedidoBody;
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "items es obligatorio y no puede estar vac\u00edo" }, { status: 400 });
  }
  if (!body.entrega?.tipo || !["retiro", "domicilio"].includes(body.entrega.tipo)) {
    return NextResponse.json({ error: "entrega.tipo debe ser 'retiro' o 'domicilio'" }, { status: 400 });
  }
  if (body.entrega.tipo === "domicilio" && !body.entrega.direccion?.trim()) {
    return NextResponse.json({ error: "direcci\u00f3n es obligatoria para domicilio" }, { status: 400 });
  }

  const db = getAdminDb();

  try {
    const pedidoId = await db.runTransaction(async (tx) => {
      const refs = body.items.map((item) => db.collection("productos").doc(item.productoId));
      const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));

      const itemsPedido: Array<{
        productoId: string;
        nombre: string;
        precioUnitario: number;
        cantidad: number;
        subtotal: number;
      }> = [];
      let total = 0;

      for (let i = 0; i < body.items.length; i++) {
        const snap = snaps[i];
        const item = body.items[i];

        if (!snap.exists) {
          throw new Error(`Producto ${item.productoId} no encontrado`);
        }

        const prod = snap.data()!;
        if (!prod.activo) {
          throw new Error(`Producto ${prod.nombre} no est\u00e1 activo`);
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

        tx.update(refs[i], { stock: prod.stock - item.cantidad });
      }

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

    const configSnap = await db.doc("configuracion/tienda").get();
    const config = configSnap.data();
    const whatsapp = config?.whatsapp || "573113554021";

    const pedidoSnap = await db.doc(`pedidos/${pedidoId}`).get();
    const pedido = pedidoSnap.data()!;

    const lineas = pedido.items.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (i: any) => `\u2022 ${i.nombre} \u2014 x${i.cantidad} \u2014 $ ${(i.subtotal as number).toLocaleString("es-CO")}`
    );
    const entrega = pedido.entrega.tipo === "domicilio"
      ? `Entrega: Domicilio \u2014 ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}`
      : "Entrega: Retiro en tienda";
    const mensaje = [
      "Hola Mundo Celular, quiero comprar:",
      ...lineas,
      `Total: $ ${(pedido.total as number).toLocaleString("es-CO")}`,
      entrega,
      `Pedido #${pedidoId.slice(0, 8)} \u2014 ${decoded.name || decoded.email || "Cliente"}`,
    ].join("\n");

    return NextResponse.json({ pedidoId, mensaje, whatsapp });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al crear pedido";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
