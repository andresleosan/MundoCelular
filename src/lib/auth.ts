import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export async function loginConGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth);
}
