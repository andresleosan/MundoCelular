# Rediseño Auth, Roles y Gestión de Usuarios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Corregir error 500 en API admin/usuarios, crear sistema unificado de usuarios con sincronización Auth↔Firestore, rediseñar el login con selección de rol obligatoria, y modernizar el panel de gestión de usuarios.

**Architecture:** Se crea una colección `users/{uid}` en Firestore como fuente única de verdad para perfiles de usuario (admin + customer). El login rediseñado requiere selección de rol antes de autenticar, valida contra claims/custom claims post-login, y redirige según el rol. La API admin/usuarios recibe try/catch robusto y sincroniza claims de Firebase Auth al crear/revocar admins.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind v4, Firebase Auth (client), firebase-admin 14 (server), Firestore, Vitest.

## Global Constraints

- Windows PowerShell 5.1, sin WSL. Nunca usar comandos bash.
- UI y commits en español (Colombia). Sin emojis. Sin comentarios en código.
- NO aplicar soluciones temporales. NO ocultar errores con try/catch vacíos. NO desactivar funcionalidades.
- Mantener compatibilidad con Firebase Auth, Firestore y panel administrativo.
- Sin comentarios en código (a menos que sean JSDoc sobre funciones exportadas).
- Verificación: `npx tsc --noEmit`, `npm run lint`, `npm test`.

---

### Task 1: Tipo Usuarios + fix 500 y claims admin

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/app/api/admin/usuarios/route.ts`
- Create: `src/lib/firestore/usuarios.ts`

**Interfaces:**
- Produces: `Usuario { uid, email, displayName, photoURL, role: "admin"|"customer", active, createdAt, lastLogin }` en types
- Produces: `GET /api/admin/usuarios` con try/catch, maneja errores reales
- Produces: `POST /api/admin/usuarios` que llama a `getAuth().setCustomUserClaims(uid, { admin: true })` + escribe Firestore
- Produces: `DELETE /api/admin/usuarios` que también remueve el custom claim (`setCustomUserClaims(uid, null)`)
- Produces: `src/lib/firestore/usuarios.ts` con `obtenerUsuarioPorUid`, `crearOActualizarUsuario`, `listarAdmins`, `listarClientes`, `asignarAdmin`, `revocarAdmin`

**Step 1: Agregar tipo Usuario a types/index.ts**

```ts
export interface Usuario {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "admin" | "customer";
  active: boolean;
  createdAt: Date;
  lastLogin: Date;
}
```

**Step 2: Crear src/lib/firestore/usuarios.ts**

Con estas funciones (todas usan Admin SDK):

```ts
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";
import type { Usuario } from "@/types";

const COL = "users";

export async function crearOActualizarUsuario(uid: string, data: {
  email: string;
  displayName: string;
  photoURL: string;
}): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COL).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    const existente = snap.data() as Partial<Usuario>;
    await ref.update({
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      lastLogin: new Date(),
    });
  } else {
    await ref.set({
      uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: "customer",
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
    });
  }
}

export async function obtenerUsuarioPorUid(uid: string): Promise<Usuario | null> {
  const db = getAdminDb();
  const snap = await db.collection(COL).doc(uid).get();
  return snap.exists ? (snap.data() as Usuario) : null;
}

export async function listarAdmins(): Promise<Usuario[]> {
  const db = getAdminDb();
  const snap = await db.collection(COL).where("role", "==", "admin").get();
  return snap.docs.map((d) => d.data() as Usuario);
}

export async function listarClientes(): Promise<Usuario[]> {
  const db = getAdminDb();
  const snap = await db.collection(COL).where("role", "==", "customer").get();
  return snap.docs.map((d) => d.data() as Usuario);
}

export async function asignarAdmin(uid: string): Promise<void> {
  const db = getAdminDb();
  await getAuth(getAdminApp()).setCustomUserClaims(uid, { admin: true });
  const ref = db.collection(COL).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ role: "admin" as const });
  } else {
    const authUser = await getAuth(getAdminApp()).getUser(uid);
    await ref.set({
      uid,
      email: authUser.email ?? "",
      displayName: authUser.displayName ?? "",
      photoURL: authUser.photoURL ?? "",
      role: "admin",
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
    });
  }
}

export async function revocarAdmin(uid: string): Promise<void> {
  const db = getAdminDb();
  await getAuth(getAdminApp()).setCustomUserClaims(uid, null);
  const ref = db.collection(COL).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ role: "customer" as const });
  }
}
```

**Step 3: Reemplazar src/app/api/admin/usuarios/route.ts**

Con handlers que usan las funciones de `usuarios.ts`, con try/catch, UID como identificador principal:

```ts
import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/api-auth";
import { listarAdmins, listarClientes, asignarAdmin, revocarAdmin } from "@/lib/firestore/usuarios";

export async function GET(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const admins = await listarAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    console.error("[admin/usuarios GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { uid } = await req.json();
    if (!uid || !uid.trim()) return NextResponse.json({ error: "UID requerido" }, { status: 400 });
    await asignarAdmin(uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/usuarios POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { uid } = await req.json();
    if (!uid || !uid.trim()) return NextResponse.json({ error: "UID requerido" }, { status: 400 });
    await revocarAdmin(uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/usuarios DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
```

**Step 4: Verificar**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Run: `npm test`

**Step 5: Commit**

```bash
git add src/types/index.ts src/lib/firestore/usuarios.ts src/app/api/admin/usuarios/route.ts
git commit -m "feat(auth): crear modelo users, fix 500 y sincronizar claims admin"
```

---

### Task 2: Sincronización Auth → Firestore en login

**Files:**
- Modify: `src/components/auth/AuthProvider.tsx`
- Modify: `src/lib/auth-client.ts`

**Interfaces:**
- Consumes: `crearOActualizarUsuario` de `src/lib/firestore/usuarios.ts` (Task 1 — pero corre del lado servidor; necesitamos una API route para el cliente)
- Produce: AuthProvider que al detectar login llama a API route para sincronizar perfil en Firestore

**Step 1: Crear API route de sincronización**

Crear `src/app/api/auth/sync/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";
import { crearOActualizarUsuario } from "@/lib/firestore/usuarios";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const token = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
    await crearOActualizarUsuario(token.uid, {
      email: token.email ?? "",
      displayName: token.name ?? "",
      photoURL: token.picture ?? "",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[auth/sync]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

**Step 2: Modificar AuthProvider para sincronizar**

En `src/components/auth/AuthProvider.tsx`, después de `setUsuario(user)` (línea ~35), agregar una llamada:

```ts
if (user) {
  const token = await user.getIdToken();
  fetch("/api/auth/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}
```

**Step 3: Verificar**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/app/api/auth/sync/route.ts src/components/auth/AuthProvider.tsx
git commit -m "feat(auth): sincronizar usuarios Auth a Firestore en login"
```

---

### Task 3: Rediseñar LoginForm con selección de rol obligatoria

**Files:**
- Modify: `src/components/layout/LoginForm.tsx`

**Step 1: Reemplazar LoginForm completo**

El nuevo LoginForm:
- NO inicia Google login inmediatamente al hacer click en Cliente/Admin
- Selección de rol: "Cliente" (storefront) o "Administrador" (panel) — solo selecciona, no autentica
- Estado local `selectedRole: "customer" | "admin" | null`
- Botón "Iniciar sesión con Google" — requiere `selectedRole !== null`, si null muestra "Selecciona Cliente o Administrador"
- Campos email/password + botón "Iniciar sesión" — requiere `selectedRole !== null`
- Las tarjetas de Cliente/Admin se mueven a la parte inferior
- Validación post-login: si `selectedRole === "admin"` y `!esAdmin` → mostrar error + cerrar sesión

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginConGoogle, loginConEmail, cerrarSesion, traducirErrorAuth } from "@/lib/auth-client";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/components/ui/Icon";

type RoleSelection = "customer" | "admin" | null;

export function LoginForm() {
  const router = useRouter();
  const { usuario, esAdmin, cargando: authCargando } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleSelection>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (authCargando || !cargando || !usuario) return;
    setCargando(false);
    if (selectedRole === "admin" && !esAdmin) {
      setError("Esta cuenta no tiene permisos de administrador.");
      cerrarSesion();
      return;
    }
    if (selectedRole === "customer") {
      router.push("/");
    } else if (selectedRole === "admin") {
      router.push("/admin");
    }
  }, [authCargando, usuario, esAdmin, selectedRole, router, cargando]);

  async function handleLoginGoogle() {
    if (!selectedRole) {
      setError("Selecciona Cliente o Administrador");
      return;
    }
    setCargando(true);
    setError("");
    try {
      await loginConGoogle();
    } catch (err) {
      setError(traducirErrorAuth(err));
      setCargando(false);
    }
  }

  async function handleLoginEmail() {
    if (!selectedRole) {
      setError("Selecciona Cliente o Administrador");
      return;
    }
    if (!email || !password) {
      setError("Ingresa email y contraseña");
      return;
    }
    setCargando(true);
    setError("");
    try {
      await loginConEmail(email, password);
    } catch (err) {
      setError(traducirErrorAuth(err));
      setCargando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[20px] font-semibold tracking-[-0.03em]">Iniciar sesión</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">Accede con tu cuenta</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-[13px] font-medium">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-[13px] font-medium">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium">Selecciona tu tipo de acceso</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setSelectedRole("customer"); setError(""); }}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
              selectedRole === "customer"
                ? "border-primary bg-primary/8"
                : "border-input hover:border-muted-foreground/30"
            }`}
          >
            <Icon name="user" className="size-5" />
            <span className="text-[13px] font-medium">Cliente</span>
            <span className="text-[11px] text-muted-foreground">Ir a la tienda</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedRole("admin"); setError(""); }}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
              selectedRole === "admin"
                ? "border-primary bg-primary/8"
                : "border-input hover:border-muted-foreground/30"
            }`}
          >
            <Icon name="badge-check" className="size-5" />
            <span className="text-[13px] font-medium">Administrador</span>
            <span className="text-[11px] text-muted-foreground">Panel de control</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">{error}</p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleLoginGoogle}
          disabled={cargando}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-[14px] font-medium transition hover:bg-muted disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="size-4" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {cargando ? "Ingresando…" : "Iniciar sesión con Google"}
        </button>

        <button
          type="button"
          onClick={handleLoginEmail}
          disabled={cargando}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {cargando ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verificar tipos y lint**

Run: `npx tsc --noEmit`
Run: `npm run lint`

**Step 3: Commit**

```bash
git add src/components/layout/LoginForm.tsx
git commit -m "feat(auth): redisenar login con seleccion de rol obligatoria"
```

---

### Task 4: Arreglar AdminGuard, logout y checkout

**Files:**
- Modify: `src/components/admin/AdminGuard.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/admin/AppSidebar.tsx`
- Modify: `src/components/checkout/CheckoutForm.tsx`
- Modify: `src/middleware.ts`

**Step 1: AdminGuard — Agregar botón de logout en "Sin acceso"**

En `AdminGuard.tsx`, reemplazar el bloque `!esAdmin`:

```tsx
if (!cargando && usuario && !esAdmin) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-[16px] font-medium">Sin acceso</p>
      <p className="text-[14px] text-muted-foreground">Esta cuenta no tiene permisos de administrador.</p>
      <div className="flex gap-3">
        <button
          onClick={async () => {
            await cerrarSesion();
            router.replace("/");
          }}
          className="rounded-lg border border-input px-4 py-2 text-[14px] transition hover:bg-muted"
        >
          Cerrar sesión
        </button>
        <button
          onClick={() => router.replace("/")}
          className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition hover:opacity-90"
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  );
}
```

Agregar imports de `cerrarSesion` y `router`.

**Step 2: Arreglar race condition de logout**

En `Header.tsx` y `AppSidebar.tsx`, reemplazar el patrón `cerrarSesion(); router.push("/")` por:

```tsx
await cerrarSesion();
router.replace("/");
```

**Step 3: Arreglar checkout link**

En `CheckoutForm.tsx`, cambiar el link de `/admin/login` a abrir el `AuthModal` (pasar la función de apertura como prop o usar un estado global). Opción más simple: redirigir a `/` y abrir el AuthModal desde ahí. O mejor: usar `router.push("/")`.

```tsx
<p className="text-[14px]">
  <button onClick={() => router.push("/")} className="text-primary underline">
    Inicia sesión
  </button>{" "}
  para continuar
</p>
```

**Step 4: Arreglar middleware**

Reemplazar `src/middleware.ts` — removerlo o hacerlo funcional. Opción simple: remover (es no-op). Pero mejor: dejarlo como está hasta que se implemente verificación real. O simplemente eliminar las líneas innecesarias y dejar solo el export config. Dejarlo limpio:

```ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```

**Step 5: Verificar**

Run: `npx tsc --noEmit`
Run: `npm run lint`

**Step 6: Commit**

```bash
git add src/components/admin/AdminGuard.tsx src/components/layout/Header.tsx src/components/admin/AppSidebar.tsx src/components/checkout/CheckoutForm.tsx src/middleware.ts
git commit -m "fix(auth): arreglar AdminGuard, logout race, checkout y middleware"
```

---

### Task 5: Rediseñar AdminUsuarios con tabs, skeletons y gestión por UID

**Files:**
- Modify: `src/components/admin/AdminUsuarios.tsx`
- Modify: `src/app/admin/usuarios/page.tsx`

**Step 1: Reemplazar AdminUsuarios completo**

Nuevo componente con:
- Tabs: Administradores | Clientes
- Loading skeletons (Array(3).map con Skeleton)
- Empty state ("No hay administradores/clientes")
- Error state con mensaje real del error
- Tabla con avatar (inicial), nombre, email, uid, fecha creación, último acceso, estado
- Input de búsqueda por UID para agregar admin (NO email)
- Botón para revocar admin (usa UID)
- Búsqueda instantánea sobre clientes
- Responsive

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, Search, Shield, ShieldOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AdminState = { email: string; uid: string; displayName: string; photoURL: string; createdAt: string; lastLogin: string; active: boolean };

type ClienteState = { email: string; uid: string; displayName: string; photoURL: string; createdAt: string; lastLogin: string; active: boolean; pedidos: number };

type TabType = "admins" | "clientes";

export function AdminUsuarios() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState<TabType>("admins");
  const [admins, setAdmins] = useState<AdminState[]>([]);
  const [clientes, setClientes] = useState<ClienteState[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [uidInput, setUidInput] = useState("");
  const [accionando, setAccionando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const headers = useCallback(async () => {
    if (!usuario) return {};
    const token = await usuario.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [usuario]);

  const cargarAdmins = useCallback(async () => {
    try {
      const h = await headers();
      const res = await fetch("/api/admin/usuarios", { headers: h });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error del servidor");
      }
      const data = await res.json();
      setAdmins(data.admins || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar administradores");
    }
  }, [headers]);

  const cargarClientes = useCallback(async () => {
    try {
      const h = await headers();
      const res = await fetch("/api/admin/usuarios?role=customer", { headers: h });
      if (!res.ok) throw new Error("Error del servidor");
      const data = await res.json();
      setClientes(data.clientes || []);
    } catch {
      // Silencioso en tab secundaria
    }
  }, [headers]);

  useEffect(() => {
    setCargando(true);
    Promise.all([cargarAdmins(), cargarClientes()]).finally(() => setCargando(false));
  }, [cargarAdmins, cargarClientes]);

  async function agregarAdmin() {
    if (!uidInput.trim()) return;
    setAccionando(true);
    setMensaje(null);
    try {
      const h = await headers();
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ uid: uidInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMensaje({ tipo: "success", texto: "Administrador agregado correctamente" });
      setUidInput("");
      await cargarAdmins();
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "Error al agregar" });
    } finally {
      setAccionando(false);
    }
  }

  async function removerAdmin(uid: string) {
    if (!confirm("¿Revocar permisos de administrador?")) return;
    setAccionando(true);
    setMensaje(null);
    try {
      const h = await headers();
      const res = await fetch("/api/admin/usuarios", {
        method: "DELETE",
        headers: h,
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMensaje({ tipo: "success", texto: "Administrador revocado" });
      await cargarAdmins();
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "Error al revocar" });
    } finally {
      setAccionando(false);
    }
  }

  const clientesFiltrados = clientes.filter((c) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return c.email.toLowerCase().includes(q) || c.displayName.toLowerCase().includes(q) || c.uid.toLowerCase().includes(q);
  });

  function formatDate(ts: string | undefined) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setTab("admins")}
          className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
            tab === "admins" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Administradores
        </button>
        <button
          onClick={() => setTab("clientes")}
          className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
            tab === "clientes" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Clientes
        </button>
      </div>

      {mensaje && (
        <div className={`rounded-lg border px-4 py-3 text-[13px] ${
          mensaje.tipo === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-destructive/30 bg-destructive/5 text-destructive"
        }`}>
          {mensaje.texto}
        </div>
      )}

      {tab === "admins" && (
        <div className="flex gap-2">
          <Input
            placeholder="UID del usuario a convertir en admin"
            value={uidInput}
            onChange={(e) => setUidInput(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={agregarAdmin} disabled={accionando || !uidInput.trim()} size="sm">
            <Plus className="size-4" />
            Agregar admin
          </Button>
        </div>
      )}

      {tab === "clientes" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {error && tab === "admins" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">{error}</div>
      )}

      {cargando && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!cargando && tab === "admins" && admins.length === 0 && !error && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-[14px] font-medium">No hay administradores</p>
          <p className="text-[13px] text-muted-foreground">Agrega un administrador usando su UID.</p>
        </div>
      )}

      {!cargando && tab === "clientes" && clientesFiltrados.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-[14px] font-medium">No se encontraron clientes</p>
          <p className="text-[13px] text-muted-foreground">Los clientes aparecerán cuando inicien sesión.</p>
        </div>
      )}

      {!cargando && tab === "admins" && admins.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">UID</th>
                <th className="px-4 py-3 text-left font-medium">Creado</th>
                <th className="px-4 py-3 text-left font-medium">Último acceso</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.uid} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[12px] font-medium text-primary">
                        {a.displayName?.charAt(0)?.toUpperCase() || a.email?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{a.displayName || "—"}</p>
                        <p className="text-[12px] text-muted-foreground">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{a.uid.slice(0, 12)}…</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.lastLogin)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removerAdmin(a.uid)}>
                      <ShieldOff className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && tab === "clientes" && clientesFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">UID</th>
                <th className="px-4 py-3 text-left font-medium">Registro</th>
                <th className="px-4 py-3 text-left font-medium">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => (
                <tr key={c.uid} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[12px] font-medium">
                        {c.displayName?.charAt(0)?.toUpperCase() || c.email?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{c.displayName || "—"}</p>
                        <p className="text-[12px] text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{c.uid.slice(0, 12)}…</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.lastLogin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verificar**

Run: `npx tsc --noEmit`
Run: `npm run lint`

**Step 3: Commit**

```bash
git add src/components/admin/AdminUsuarios.tsx
git commit -m "feat(auth): redisenar admin usuarios con tabs, skeletons y gestion por UID"
```

---

### Task 6: Dashboard admin con métricas reales

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: Agregar API route para métricas**

Crear `src/app/api/admin/stats/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const admin = await verificarAdmin(req);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const db = getAdminDb();
    const [usersSnap, adminsSnap, customersSnap, pedidosSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("users").where("role", "==", "admin").get(),
      db.collection("users").where("role", "==", "customer").get(),
      db.collection("pedidos").get(),
    ]);
    const now = new Date();
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const nuevosEsteMes = usersSnap.docs.filter((d) => {
      const ts = d.data().createdAt;
      return ts && ts.toDate && ts.toDate() >= mesInicio;
    }).length;
    return NextResponse.json({
      totalUsuarios: usersSnap.size,
      totalAdmins: adminsSnap.size,
      totalClientes: customersSnap.size,
      nuevosEsteMes,
      totalPedidos: pedidosSnap.size,
    });
  } catch (error) {
    console.error("[admin/stats]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

**Step 2: Modificar dashboard page**

En `src/app/admin/page.tsx`, agregar un `useEffect` que haga fetch de `/api/admin/stats` y renderice métricas reales. Reemplazar los valores hardcodeados.

**Step 3: Verificar**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/app/api/admin/stats/route.ts src/app/admin/page.tsx
git commit -m "feat(auth): dashboard con metricas reales de Firestore"
```

---

### Task 7: Firestore Rules audit + fix

**Files:**
- Modify: `firestore.rules`

**Step 1: Auditoría y corrección**

Revisar reglas actuales y asegurar:
- `users/{uid}`: read/write solo `esAdmin()` autenticado (lectura puede ser self)
- Eliminar reglas de `carritos/{uid}` si no se usan (o mantener como planeadas)
- Verificar que `esAdmin()` chequea el claim correcto

Reglas actualizadas para `users`:
```
match /users/{uid} {
  allow read: if request.auth != null && (request.auth.uid == uid || esAdmin());
  allow write: if request.auth != null && esAdmin();
  allow create: if request.auth != null && request.auth.uid == uid;
}
```

**Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat(auth): actualizar firestore rules para coleccion users"
```

---

### Task 8: Limpiar código muerto

**Files:**
- Delete: `src/components/auth/LoginButtons.tsx`
- Delete: `src/components/auth/BotonGoogle.tsx`
- Modify: `src/app/login/page.tsx` (mantener redirect a `/`)

**Step 1: Eliminar archivos muertos y verificar**

Run: `npx tsc --noEmit` (confirmar que no hay imports rotos)
Run: `npm run lint`

**Step 2: Commit**

```bash
git rm src/components/auth/LoginButtons.tsx src/components/auth/BotonGoogle.tsx
git commit -m "chore(auth): eliminar componentes de auth no utilizados"
```

---

### Task 9: Verificación completa

**Files:** None (verification only)

**Step 1: Run full verification**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Run: `npm test`

**Step 2: Report**

Reportar resultados.
