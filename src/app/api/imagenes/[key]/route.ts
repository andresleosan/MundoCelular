import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET } from "@/lib/r2";
import { getAdminApp } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

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

  const decodedKey = decodeURIComponent(key);

  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: decodedKey }));

  return NextResponse.json({ ok: true });
}
