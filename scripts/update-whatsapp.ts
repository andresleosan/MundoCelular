import { config } from "dotenv";
config({ path: ".env.local" });

import { WHATSAPP_TIENDA } from "../src/lib/config-tienda";
import { getAdminDb } from "../src/lib/firebase-admin";

async function main() {
  await getAdminDb().collection("configuracion").doc("tienda").update({
    whatsapp: WHATSAPP_TIENDA,
  });
  console.log("WhatsApp de configuracion/tienda actualizado");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
