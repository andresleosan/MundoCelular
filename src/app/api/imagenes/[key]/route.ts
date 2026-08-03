import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET } from "@/lib/r2";
import { getAdminApp } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
    } catch (e) {
      console.error("[api/imagenes/[key]] Token inválido:", e instanceof Error ? e.message : e);
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 });
    }

    if (decoded.admin !== true) {
      return NextResponse.json({ success: false, error: "Solo administradores" }, { status: 403 });
    }

    const decodedKey = decodeURIComponent(key);

    const client = getR2Client();
    await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: decodedKey }));

    console.log(`[api/imagenes/[key]] Eliminado key=${decodedKey} uid=${decoded.uid}`);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("[api/imagenes/[key]] Error eliminando imagen:", error);
    return NextResponse.json({ success: false, error: "Error al eliminar imagen" }, { status: 500 });
  }
}
