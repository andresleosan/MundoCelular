import { config } from "dotenv";
config({ path: ".env.local" });

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "../src/lib/firebase-admin";

function isAuthError(error: unknown): error is { code: string; message?: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string";
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

async function main() {
  const auth = getAuth(getAdminApp());

  const users = [
    { email: requiredEnv("QA_ADMIN_EMAIL"), password: requiredEnv("QA_ADMIN_PASSWORD"), displayName: "Admin Test", admin: true },
    { email: requiredEnv("QA_CLIENT_EMAIL"), password: requiredEnv("QA_CLIENT_PASSWORD"), displayName: "Cliente Test", admin: false },
  ];

  for (const u of users) {
    try {
      const user = await auth.createUser({ email: u.email, password: u.password, displayName: u.displayName, emailVerified: true });
      console.log(`Created QA user → UID: ${user.uid}`);
      if (u.admin) {
        await auth.setCustomUserClaims(user.uid, { admin: true });
        console.log(`  → admin claim set`);
      }
    } catch (e: unknown) {
      if (isAuthError(e) && e.code === "auth/email-already-exists") {
        const existing = await auth.getUserByEmail(u.email);
        console.log(`QA user already exists → UID: ${existing.uid}`);
        if (u.admin) {
          await auth.setCustomUserClaims(existing.uid, { admin: true });
          console.log(`  → admin claim re-set`);
        }
      } else {
        console.error("Error creating QA user:", e instanceof Error ? e.message : String(e));
      }
    }
  }

  console.log("\nDone. Users must sign out and sign back in for claims to take effect.");
}

main().catch((err) => { console.error(err); process.exit(1); });
