import { getAuth } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase-admin";
import { solicitarAdmin } from "@/lib/firestore/usuarios";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

function consumirRateLimit(uid: string): number | null {
  const now = Date.now();
  const current = requestWindows.get(uid);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    requestWindows.set(uid, { startedAt: now, count: 1 });
    return null;
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return Math.max(1, Math.ceil((current.startedAt + RATE_LIMIT_WINDOW_MS - now) / 1000));
  }
  current.count += 1;
  return null;
}

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

  const retryAfter = consumirRateLimit(token.uid);
  if (retryAfter !== null) {
    return NextResponse.json(
      { success: false, error: "Demasiadas solicitudes. Intenta de nuevo mas tarde." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
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
