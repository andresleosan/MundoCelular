import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, R2_BUCKET } from "@/lib/r2";
import { getAdminApp } from "@/lib/firebase-admin";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: "Token inv\u00e1lido" }, { status: 401 });
  }

  if (decoded.admin !== true) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const body = (await req.json()) as { filename?: string; contentType?: string; size?: number };

  if (!body.filename || !body.contentType) {
    return NextResponse.json({ error: "filename y contentType requeridos" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(body.contentType)) {
    return NextResponse.json({ error: "Tipo no permitido. Usa jpeg, png o webp" }, { status: 400 });
  }

  if (body.size && body.size > MAX_SIZE) {
    return NextResponse.json({ error: "Archivo demasiado grande (m\u00e1ximo 5MB)" }, { status: 400 });
  }

  const ext = body.contentType === "image/png" ? "png" : "webp";
  const key = `productos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: body.contentType,
  });

  const client = getR2Client();
  const url = await getSignedUrl(client, command, { expiresIn: 600 });

  return NextResponse.json({ url, key });
}
