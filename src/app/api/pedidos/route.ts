import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminApp, getAdminDb } from "@/lib/firebase-admin";
import { WHATSAPP_TIENDA } from "@/lib/config-tienda";

interface PedidoItemBody {
  productoId: string;
  cantidad: number;
  varianteId?: string;
  atributos?: Record<string, string>;
}

interface PedidoBody {
  items: PedidoItemBody[];
  entrega: { tipo: "retiro" | "domicilio"; direccion?: string; barrio?: string };
  clienteNombre?: string;
  clienteTelefono?: string;
  ciudad?: string;
  observaciones?: string;
}

interface ItemPedidoPersistido {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  varianteId?: string;
  atributos?: Record<string, string>;
}

export async function POST(req: NextRequest) {
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

  const db = getAdminDb();

  try {
    const pedidoId = await db.runTransaction(async (tx) => {
      const productoRefs = body.items.map((item) => db.collection("productos").doc(item.productoId));
      const varianteRefs = body.items.map((item) =>
        item.varianteId ? db.collection("variantes").doc(item.varianteId) : null
      );
      const [productoSnaps, varianteSnaps] = await Promise.all([
        Promise.all(productoRefs.map((ref) => tx.get(ref))),
        Promise.all(
          varianteRefs.map((ref) => (ref ? tx.get(ref) : Promise.resolve(null)))
        ),
      ]);

      const itemsPedido: ItemPedidoPersistido[] = [];
      let total = 0;

      for (let i = 0; i < body.items.length; i++) {
        const prodSnap = productoSnaps[i];
        const varSnap = varianteSnaps[i];
        const item = body.items[i];

        if (!prodSnap.exists) {
          throw new Error(`Producto ${item.productoId} no encontrado`);
        }

        const prod = prodSnap.data()!;
        if (!prod.activo) {
          throw new Error(`Producto ${prod.nombre} no está activo`);
        }

        let precio = prod.precio as number;
        let stockActual = prod.stock as number;
        let refActualizar = productoRefs[i];

        if (item.varianteId) {
          if (!varSnap || !varSnap.exists) {
            throw new Error(`Variante ${item.varianteId} no encontrada`);
          }
          const variante = varSnap.data()!;
          if (!variante.activo) {
            throw new Error(`Variante no está activa`);
          }
          precio = variante.precio as number;
          stockActual = variante.stock as number;
          refActualizar = varianteRefs[i]!;
        }

        if (stockActual < item.cantidad) {
          throw new Error(
            `Stock insuficiente para ${prod.nombre}: disponible ${stockActual}, solicitado ${item.cantidad}`
          );
        }

        const subtotal = precio * item.cantidad;
        total += subtotal;

        const atributos =
          item.atributos ??
          (varSnap?.exists ? (varSnap.data()!.attributes as Record<string, string>) : undefined);

        itemsPedido.push({
          productoId: item.productoId,
          nombre: prod.nombre,
          precioUnitario: precio,
          cantidad: item.cantidad,
          subtotal,
          varianteId: item.varianteId,
          atributos,
        });

        tx.update(refActualizar, { stock: stockActual - item.cantidad });
      }

      const pedidoRef = db.collection("pedidos").doc();
      tx.set(pedidoRef, {
        clienteUid: decoded.uid,
        clienteNombre: body.clienteNombre || decoded.name || decoded.email || "Cliente",
        clienteEmail: decoded.email || "",
        clienteTelefono: body.clienteTelefono || "",
        items: itemsPedido,
        total,
        entrega: body.entrega,
        ciudad: body.ciudad || "",
        observaciones: body.observaciones || "",
        estado: "pendiente",
        creadoEn: FieldValue.serverTimestamp(),
        actualizadoEn: FieldValue.serverTimestamp(),
      });

      return pedidoRef.id;
    });

    const configSnap = await db.doc("configuracion/tienda").get();
    const config = configSnap.data();
    const whatsapp = config?.whatsapp || WHATSAPP_TIENDA;

    const pedidoSnap = await db.doc(`pedidos/${pedidoId}`).get();
    const pedido = pedidoSnap.data()!;
    const items = pedido.items as ItemPedidoPersistido[];

    const lineas = items.map((i) => {
      const attrs = i.atributos ? ` (${Object.values(i.atributos).join(" / ")})` : "";
      return `• ${i.nombre}${attrs} — x${i.cantidad} — $ ${i.subtotal.toLocaleString("es-CO")}`;
    });
    const entrega =
      pedido.entrega.tipo === "domicilio"
        ? `Entrega: Domicilio — ${pedido.entrega.direccion}${pedido.entrega.barrio ? `, ${pedido.entrega.barrio}` : ""}${pedido.ciudad ? ` (${pedido.ciudad})` : ""}`
        : "Entrega: Retiro en tienda";
    const clienteLine = [
      `Cliente: ${pedido.clienteNombre}`,
      pedido.clienteTelefono ? `Teléfono: ${pedido.clienteTelefono}` : "",
      pedido.observaciones ? `Obs: ${pedido.observaciones}` : "",
    ].filter(Boolean).join("\n");
    const mensaje = [
      "Hola Mundo Celular, quiero comprar:",
      ...lineas,
      `Total: $ ${(pedido.total as number).toLocaleString("es-CO")}`,
      entrega,
      clienteLine,
      `Pedido #${pedidoId.slice(0, 8)}`,
    ].join("\n");

    return NextResponse.json({ pedidoId, mensaje, whatsapp });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al crear pedido";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
