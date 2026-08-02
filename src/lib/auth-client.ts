import { signInWithPopup, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export async function loginConGoogle(): Promise<void> {
  const credential = await signInWithPopup(auth, googleProvider);
  await credential.user.getIdToken(true);
}

export async function loginConEmail(email: string, password: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await credential.user.getIdToken(true);
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth);
}
