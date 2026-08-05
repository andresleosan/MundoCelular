import { config } from "dotenv";
config({ path: ".env.local" });

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "../src/lib/firebase-admin";

async function main() {
  const auth = getAuth(getAdminApp());
  const emails = [process.env.QA_ADMIN_EMAIL, process.env.QA_CLIENT_EMAIL].filter(Boolean) as string[];

  for (const email of emails) {
    const usuario = await auth.getUserByEmail(email);
    if (usuario.disabled) {
      await auth.updateUser(usuario.uid, { disabled: false });
      console.log(`Habilitada cuenta QA: ${email}`);
    } else {
      console.log(`Cuenta QA ya activa: ${email}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
