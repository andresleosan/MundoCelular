import { auth } from "./firebase";

export async function avisarRevalidacion(tags: string[]): Promise<void> {
  if (!auth) return;
  const usuario = auth.currentUser;
  if (!usuario) return;
  const token = await usuario.getIdToken();
  await fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tags }),
  }).catch(() => {
    // La revalidación es best-effort: los datos ya quedaron en Firestore.
  });
}
