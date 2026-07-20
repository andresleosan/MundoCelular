import { config } from "dotenv";
config({ path: ".env.local" });

import { getAdminDb } from "../src/lib/firebase-admin";

async function main() {
  const db = getAdminDb();
  await db.collection("configuracion").doc("tienda").set({
    nombre: "Mundo Celular",
    whatsapp: "573113554021",
    direccion: "Cra 36 # 38 - 33, Barrio El Salvador",
    ciudad: "Medellín",
    departamento: "Antioquia",
    pais: "Colombia",
    horario: "",
    redes: {
      instagram: "https://www.instagram.com/mundo_celular_75/",
      facebook: "https://www.facebook.com/Mundo.Celular.01",
      tiktok: "https://www.tiktok.com/@mundocelular75",
    },
  });
  console.log("configuracion/tienda creada");
}

main().catch((err) => { console.error(err); process.exit(1); });
