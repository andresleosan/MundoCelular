import { auth } from "./firebase";

export async function avisarRevalidacion(tags: string[]): Promise<void> {
  try {
    if (!auth) return;
    const usuario = auth.currentUser;
    if (!usuario) return;
    const token = await usuario.getIdToken();
    const response = await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tags }),
    });
    if (!response.ok) {
      console.error("[revalidate:request-error]", { status: response.status });
    }
  } catch {
    // La revalidación es best-effort: los datos ya quedaron en Firestore.
  }
}
