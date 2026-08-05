import { getAuth } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase-admin";
import { solicitarAdmin } from "@/lib/firestore/usuarios";
import { consumeAdminRequestRateLimit } from "@/lib/rate-limit/firestore";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const tokenMatch = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!tokenMatch) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  let token: Awaited<ReturnType<ReturnType<typeof getAuth>["verifyIdToken"]>>;

  try {
    token = await getAuth(getAdminApp()).verifyIdToken(tokenMatch[1]);
  } catch {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  if (token.admin === true) {
    return NextResponse.json(
      { success: false, error: "Esta cuenta ya tiene permisos de administrador." },
      { status: 409 },
    );
  }

  let rateLimit: Awaited<ReturnType<typeof consumeAdminRequestRateLimit>>;
  try {
    rateLimit = await consumeAdminRequestRateLimit(token.uid);
  } catch {
    console.error("[admin-request:rate-limit]");
    return NextResponse.json(
      { success: false, error: "Servicio temporalmente no disponible" },
      { status: 503 },
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Demasiadas solicitudes. Intenta de nuevo mas tarde." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }

  try {
    const status = await solicitarAdmin(token.uid, {
      email: token.email ?? "",
      displayName: token.name ?? "",
      photoURL: token.picture ?? "",
    });

    if (status === "already-pending") {
      return NextResponse.json(
        { success: false, error: "Tu solicitud de administrador ya esta pendiente." },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, status: "pending" }, { status: 201 });
  } catch {
    console.error("[admin-request:error]");
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
