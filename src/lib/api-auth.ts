import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";

export async function verificarAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    // getAdminApp() inicializa la app si aún no existe (evita app/no-app en cold start)
    const decoded = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
    if (decoded.admin !== true) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
