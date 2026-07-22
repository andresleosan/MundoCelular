import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

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
    decoded = await getAuth().verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: "Token inv\u00e1lido" }, { status: 401 });
  }

  if (decoded.admin !== true) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const db = getAdminDb();

  try {
    await db.runTransaction(async (tx) => {
      const pedidoRef = db.collection("pedidos").doc(id);
      const pedidoSnap = await tx.get(pedidoRef);

      if (!pedidoSnap.exists) {
        throw new Error("Pedido no encontrado");
      }

      const pedido = pedidoSnap.data()!;
      if (pedido.estado === "cancelado") {
        throw new Error("El pedido ya est\u00e1 cancelado");
      }

      for (const item of pedido.items) {
        const prodRef = db.collection("productos").doc(item.productoId);
        const prodSnap = await tx.get(prodRef);
        if (prodSnap.exists) {
          tx.update(prodRef, { stock: prodSnap.data()!.stock + item.cantidad });
        }
      }

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
