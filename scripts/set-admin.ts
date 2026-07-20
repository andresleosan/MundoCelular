import { config } from "dotenv";
config({ path: ".env.local" });

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "../src/lib/firebase-admin";

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Uso: npm run set:admin -- <uid>");
    process.exit(1);
  }
  await getAuth(getAdminApp()).setCustomUserClaims(uid, { admin: true });
  console.log(`Claim admin asignado a ${uid}. El usuario debe cerrar sesión y volver a entrar.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
