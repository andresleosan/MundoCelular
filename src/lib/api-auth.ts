import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";

type AuthErrorDetails = {
  code?: unknown;
};

function sanitizarErrorAutenticacion(error: unknown) {
  const details = (typeof error === "object" && error !== null ? error : {}) as AuthErrorDetails;
  const code =
    typeof details.code === "string" && /^auth\/[a-z0-9-]+$/.test(details.code)
      ? details.code
      : "unknown";

  return { code, message: "No se pudo verificar el token." };
}

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
  } catch (error) {
    console.error("[api-auth:verify-error]", sanitizarErrorAutenticacion(error));
    return null;
  }
}
