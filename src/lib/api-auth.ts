import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function verificarAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    if (decoded.admin !== true) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
