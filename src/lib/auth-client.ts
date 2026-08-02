import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export async function loginConGoogle(): Promise<void> {
  const credential = await signInWithPopup(auth, googleProvider);
  await credential.user.getIdToken(true);
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth);
}
