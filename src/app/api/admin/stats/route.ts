import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const db = getAdminDb();
    const [usersSnap, adminsSnap, customersSnap, pedidosSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("users").where("role", "==", "admin").get(),
      db.collection("users").where("role", "==", "customer").get(),
      db.collection("pedidos").get(),
    ]);
    const now = new Date();
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    let nuevosEsteMes = 0;
    usersSnap.docs.forEach((d) => {
      const ts = d.data().createdAt;
      if (ts && ts.toDate && ts.toDate() >= mesInicio) nuevosEsteMes++;
    });
    return NextResponse.json({
      totalUsuarios: usersSnap.size,
      totalAdmins: adminsSnap.size,
      totalClientes: customersSnap.size,
      nuevosEsteMes,
      totalPedidos: pedidosSnap.size,
    });
  } catch (error) {
    console.error("[admin/stats]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
