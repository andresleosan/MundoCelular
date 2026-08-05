import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

interface RateLimitDocument {
  count: number;
  windowStartedAt: number;
}

function readRateLimitDocument(data: FirebaseFirestore.DocumentData | undefined): RateLimitDocument | null {
  if (typeof data?.count !== "number" || typeof data.windowStartedAt !== "number") {
    return null;
  }

  return { count: data.count, windowStartedAt: data.windowStartedAt };
}

export async function consumeAdminRequestRateLimit(uid: string): Promise<RateLimitResult> {
  const now = Date.now();
  const db = getAdminDb();
  const uidHash = createHash("sha256").update(uid).digest("hex");
  const ref = db.collection("rateLimits").doc(`admin-request:${uidHash}`);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists ? readRateLimitDocument(snapshot.data()) : null;
    const windowExpired = !current || now - current.windowStartedAt >= RATE_LIMIT_WINDOW_MS;

    if (windowExpired) {
      transaction.set(
        ref,
        {
          count: 1,
          windowStartedAt: now,
          expiresAt: Timestamp.fromMillis(now + RATE_LIMIT_WINDOW_MS),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { allowed: true };
    }

    if (current.count >= RATE_LIMIT_MAX) {
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((current.windowStartedAt + RATE_LIMIT_WINDOW_MS - now) / 1000)),
      };
    }

    transaction.update(ref, {
      count: current.count + 1,
      expiresAt: Timestamp.fromMillis(current.windowStartedAt + RATE_LIMIT_WINDOW_MS),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { allowed: true };
  });
}
