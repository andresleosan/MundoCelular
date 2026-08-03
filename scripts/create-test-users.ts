import { config } from "dotenv";
config({ path: ".env.local" });

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "../src/lib/firebase-admin";

function isAuthError(error: unknown): error is { code: string; message?: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string";
}

async function main() {
  const auth = getAuth(getAdminApp());

  const users = [
    { email: "admin@admin.com", password: "admin123", displayName: "Admin Test", admin: true },
    { email: "cliente@cliente.com", password: "cliente123", displayName: "Cliente Test", admin: false },
  ];

  for (const u of users) {
    try {
      const user = await auth.createUser({ email: u.email, password: u.password, displayName: u.displayName, emailVerified: true });
      console.log(`Created ${u.email} → UID: ${user.uid}`);
      if (u.admin) {
        await auth.setCustomUserClaims(user.uid, { admin: true });
        console.log(`  → admin claim set`);
      }
    } catch (e: unknown) {
      if (isAuthError(e) && e.code === "auth/email-already-exists") {
        const existing = await auth.getUserByEmail(u.email);
        console.log(`${u.email} already exists → UID: ${existing.uid}`);
        if (u.admin) {
          await auth.setCustomUserClaims(existing.uid, { admin: true });
          console.log(`  → admin claim re-set`);
        }
      } else {
        console.error(`Error with ${u.email}:`, e instanceof Error ? e.message : String(e));
      }
    }
  }

  console.log("\nDone. Users must sign out and sign back in for claims to take effect.");
}

main().catch((err) => { console.error(err); process.exit(1); });
