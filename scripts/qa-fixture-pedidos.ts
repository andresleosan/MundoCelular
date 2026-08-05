// Fixture efimero de pedidos para la cuenta QA de cliente.
// Uso: npx tsx scripts/qa-fixture-pedidos.ts create|cleanup
// No descuenta stock ni altera productos: solo crea/borra documentos en `pedidos`.
import { config } from "dotenv";
config({ path: ".env.local" });

import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "../src/lib/firebase-admin";

const CANTIDAD = 11;

async function main() {
  const modo = process.argv[2];
  if (!["create", "cleanup"].includes(modo)) {
    console.error("Uso: npx tsx scripts/qa-fixture-pedidos.ts create|cleanup");
    process.exit(1);
  }

  const email = process.env.QA_CLIENT_EMAIL;
  if (!email) {
    console.error("Falta QA_CLIENT_EMAIL en .env.local");
    process.exit(1);
  }

  const db = getAdminDb();
  const auth = getAuth();
  const usuario = await auth.getUserByEmail(email);
  const col = db.collection("pedidos");

  if (modo === "create") {
    const estados = ["pendiente", "contactado", "cerrado", "cancelado"] as const;
    const nombres = ["iPhone 17 Pro Max", "Samsung Galaxy S25", "AirPods Pro 2", "PlayStation 5"];
    const base = Date.now();
    for (let i = 0; i < CANTIDAD; i++) {
      const nombre = nombres[i % nombres.length];
      const precioUnitario = 500000 + i * 250000;
      await col.add({
        clienteUid: usuario.uid,
        clienteNombre: "Cliente QA",
        clienteEmail: email,
        items: [
          { productoId: "qa-fixture-prod", nombre, precioUnitario, cantidad: 1, subtotal: precioUnitario },
        ],
        total: precioUnitario,
        entrega: { tipo: "domicilio", direccion: "Calle QA 1", barrio: "Centro" },
        ciudad: "Medellín",
        estado: estados[i % estados.length],
        creadoEn: new Date(base - i * 60000),
        actualizadoEn: new Date(base - i * 60000),
      });
    }
    console.log(`Creados ${CANTIDAD} pedidos QA para ${email}`);
  } else {
    const snap = await col.where("clienteUid", "==", usuario.uid).get();
    let borrados = 0;
    for (const doc of snap.docs) {
      if (doc.data().clienteNombre === "Cliente QA") {
        await doc.ref.delete();
        borrados++;
      }
    }
    console.log(`Borrados ${borrados} pedidos QA de ${email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
