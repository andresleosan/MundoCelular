import { getAuthClient, getGoogleProvider } from "./firebase";

async function requireAuth() {
  const auth = await getAuthClient();
  if (!auth) throw new Error("Firebase Auth no está configurado");
  return auth;
}

export async function loginConGoogle(): Promise<void> {
  const [{ signInWithPopup }, googleProvider] = await Promise.all([
    import("firebase/auth"),
    getGoogleProvider(),
  ]);
  const credential = await signInWithPopup(await requireAuth(), googleProvider);
  await credential.user.getIdToken(true);
}

export async function loginConEmail(email: string, password: string): Promise<void> {
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const credential = await signInWithEmailAndPassword(await requireAuth(), email, password);
  await credential.user.getIdToken(true);
}

export async function cerrarSesion(): Promise<void> {
  const { signOut } = await import("firebase/auth");
  await signOut(await requireAuth());
}

export function traducirErrorAuth(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? "";
  switch (code) {
    case "auth/user-not-found":
      return "No existe una cuenta con ese email.";
    case "auth/wrong-password":
      return "Contraseña incorrecta.";
    case "auth/invalid-credential":
    case "auth/invalid-email":
      return "Credenciales inválidas. Revisa email y contraseña.";
    case "auth/network-request-failed":
      return "Error de red. Revisa tu conexión e intenta de nuevo.";
    case "auth/too-many-requests":
      return "Demasiados intentos fallidos. Espera un momento y vuelve a intentar.";
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana de Google. Permite popups e intenta de nuevo.";
    case "auth/popup-closed-by-user":
      return "Ventana de Google cerrada antes de completar el acceso.";
    default:
      return "No se pudo iniciar sesión. Intenta de nuevo.";
  }
}
