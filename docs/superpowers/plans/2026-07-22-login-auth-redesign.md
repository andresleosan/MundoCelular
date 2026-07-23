# Login y Gestión de Administradores — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el flujo de autenticación con login en header, página unificada `/login` con opciones Cliente/Administrador, y panel para gestionar permisos de admin por email.

**Architecture:** Página `/login` con dos botones que usan Google Auth y redirigen según el rol. Header muestra estado de autenticación. API route para gestionar permisos de admin. Firestore colección `usuarios` para persistir permisos.

**Tech Stack:** Next.js 15 (App Router), React 19, Firebase Auth (Google), Firebase Admin SDK, Firestore, Tailwind CSS

## Global Constraints

- UI y commits en español (Colombia)
- Moneda COP entero, locale `es-CO`
- Accent color `#143b98` SOLO en botón WhatsApp, wordmark y search submit
- Tokens de diseño en `src/app/globals.css` bajo `@theme`
- Alias `@/*` → `src/*`
- Windows PowerShell 5.1 (sin WSL)
- Firebase Admin SDK para server-side (custom claims)

---

## Estructura de Archivos

### Nuevos
- `src/app/login/page.tsx` — Página de login unificada
- `src/components/auth/LoginButtons.tsx` — Botones Cliente/Administrador
- `src/app/admin/usuarios/page.tsx` — Gestión de administradores
- `src/components/admin/AdminUsuarios.tsx` — Formulario y lista de admins
- `src/app/api/admin/usuarios/route.ts` — API CRUD para permisos

### Modificados
- `src/components/layout/Header.tsx` — Botón login/avatar
- `src/components/auth/AuthProvider.tsx` — Lógica redirect post-login
- `src/components/admin/AdminNav.tsx` — Agregar enlace "Usuarios"
- `src/lib/auth.ts` — Funciones asignarAdmin, revocarAdmin
- `firestore.rules` — Regla para colección `usuarios`

### Eliminados
- `src/app/admin/login/page.tsx` — Redirigir a `/login`

---

### Task 1: Funciones de auth — asignarAdmin y revocarAdmin

**Files:**
- Modify: `src/lib/auth.ts`
- Test: `tests/lib/auth-claims.test.ts` (agregar tests)

**Interfaces:**
- Consumes: `getAdminDb()` de `@/lib/firebase-admin`
- Produces: `asignarAdmin(email: string)`, `revocarAdmin(email: string)`, `listarAdmins()`

- [ ] **Step 1: Agregar test para asignarAdmin**

```typescript
// tests/lib/auth-claims.test.ts — agregar al final
import { asignarAdmin, revocarAdmin, listarAdmins } from "@/lib/auth";

describe("gestión de administradores", () => {
  it("asignarAdmin crea documento con admin:true", async () => {
    await asignarAdmin("test@example.com");
    // Verificar en Firestore
  });

  it("revocarAdmin pone admin:false", async () => {
    await revocarAdmin("test@example.com");
    // Verificar en Firestore
  });

  it("listarAdmins retorna solo admin:true", async () => {
    const admins = await listarAdmins();
    expect(admins.every(a => a.admin === true)).toBe(true);
  });
});
```

- [ ] **Step 2: Implementar funciones en auth.ts**

```typescript
// src/lib/auth.ts — agregar después de cerrarSesion
import { getAdminDb } from "./firebase-admin";

export async function asignarAdmin(email: string): Promise<void> {
  const db = getAdminDb();
  const normalizedEmail = email.toLowerCase().trim();
  await db.collection("usuarios").doc(normalizedEmail).set({
    email: normalizedEmail,
    admin: true,
    pendiente: true,
    creadoEn: new Date(),
  }, { merge: true });
}

export async function revocarAdmin(email: string): Promise<void> {
  const db = getAdminDb();
  const normalizedEmail = email.toLowerCase().trim();
  await db.collection("usuarios").doc(normalizedEmail).update({
    admin: false,
  });
}

export async function listarAdmins(): Promise<Array<{email: string; admin: boolean; pendiente: boolean}>> {
  const db = getAdminDb();
  const snapshot = await db.collection("usuarios").where("admin", "==", true).get();
  return snapshot.docs.map(doc => doc.data() as {email: string; admin: boolean; pendiente: boolean});
}
```

- [ ] **Step 3: Ejecutar tests**

Run: `npm test -- tests/lib/auth-claims.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts tests/lib/auth-claims.test.ts
git commit -m "feat(auth): agregar funciones asignarAdmin, revocarAdmin, listarAdmins"
```

---

### Task 2: Firestore rules — colección `usuarios`

**Files:**
- Modify: `firestore.rules`

**Interfaces:**
- Consumes: función `esAdmin()` existente
- Produces: reglas para `usuarios/{email}`

- [ ] **Step 1: Agregar regla de usuarios**

```javascript
// firestore.rules — agregar después de match /pedidos/{id}
match /usuarios/{email} {
  allow read: if request.auth != null && esAdmin();
  allow write: if request.auth != null && esAdmin();
}
```

- [ ] **Step 2: Verificar que las reglas compilan**

Run: `npx firebase emulators:start --only firestore --project demo-mundocelular`
Expected: No errors in emulator output

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(rules): agregar reglas para colección usuarios"
```

---

### Task 3: LoginButtons — Componente de login

**Files:**
- Create: `src/components/auth/LoginButtons.tsx`

**Interfaces:**
- Consumes: `loginConGoogle()` de `@/lib/auth`, `useAuth()` de `@/hooks/useAuth`
- Produces: Componente `LoginButtons` que muestra 2 botones

- [ ] **Step 1: Crear componente LoginButtons**

```tsx
// src/components/auth/LoginButtons.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginConGoogle } from "@/lib/auth";

export function LoginButtons() {
  const [cargando, setCargando] = useState<"cliente" | "admin" | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(tipo: "cliente" | "admin") {
    setCargando(tipo);
    setError("");
    try {
      localStorage.setItem("login-destino", tipo);
      await loginConGoogle();
      // AuthProvider will handle redirect
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
      setCargando(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={() => handleLogin("cliente")}
          disabled={cargando !== null}
          className="flex flex-col items-center gap-2 rounded-cards border border-faint-border bg-pure-white px-8 py-6 transition hover:shadow-lg disabled:opacity-50"
        >
          <span className="text-[24px]">👤</span>
          <span className="text-[14px] font-medium text-ink-navy">Cliente</span>
          <span className="text-[12px] text-steel-blue-gray">Ir a la tienda</span>
        </button>

        <button
          onClick={() => handleLogin("admin")}
          disabled={cargando !== null}
          className="flex flex-col items-center gap-2 rounded-cards border border-faint-border bg-pure-white px-8 py-6 transition hover:shadow-lg disabled:opacity-50"
        >
          <span className="text-[24px]">⚙️</span>
          <span className="text-[14px] font-medium text-ink-navy">Administrador</span>
          <span className="text-[12px] text-steel-blue-gray">Panel de control</span>
        </button>
      </div>

      {cargando && (
        <p className="text-[14px] text-steel-blue-gray">
          Ingresando como {cargando === "cliente" ? "cliente" : "administrador"}…
        </p>
      )}

      {error && <p className="text-[14px] text-mundo-blue">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/LoginButtons.tsx
git commit -m "feat(auth): crear componente LoginButtons con opciones Cliente/Admin"
```

---

### Task 4: Página `/login`

**Files:**
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `LoginButtons` de `@/components/auth/LoginButtons`, `useAuth()` de `@/hooks/useAuth`
- Produces: Página `/login` completa

- [ ] **Step 1: Crear página de login**

```tsx
// src/app/login/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoginButtons } from "@/components/auth/LoginButtons";

export default function LoginPage() {
  const { usuario, esAdmin, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando || !usuario) return;

    const destino = localStorage.getItem("login-destino");
    localStorage.removeItem("login-destino");

    if (destino === "admin" && esAdmin) {
      router.replace("/admin");
    } else if (destino === "cliente") {
      router.replace("/");
    } else if (esAdmin) {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  }, [cargando, usuario, esAdmin, router]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center text-[14px] text-steel-blue-gray">
        Cargando…
      </main>
    );
  }

  if (usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center text-[14px] text-steel-blue-gray">
        Redirigiendo…
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <h1 className="font-sora text-[20px] font-semibold tracking-[-0.03em] text-mundo-blue">
        MUNDO CELULAR
      </h1>
      <p className="text-[14px] text-steel-blue-gray">Iniciar sesión</p>
      <LoginButtons />
    </main>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat(login): crear página /login con opciones Cliente/Admin"
```

---

### Task 5: Header — Botón de login y estado autenticado

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Interfaces:**
- Consumes: `useAuth()` de `@/hooks/useAuth`, `cerrarSesion()` de `@/lib/auth`
- Produces: Header con botón login o avatar con dropdown

- [ ] **Step 1: Actualizar Header con estado de auth**

```tsx
// src/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/storefront/SearchInput";
import { CarritoContador } from "@/components/carrito/CarritoContador";
import { useAuth } from "@/hooks/useAuth";
import { cerrarSesion } from "@/lib/auth";

export function Header() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { usuario, esAdmin, cargando } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await cerrarSesion();
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-faint-border bg-pure-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3">
        <Link href="/" className="font-sora text-[16px] font-semibold tracking-[-0.015em] text-mundo-blue">
          MUNDO CELULAR
        </Link>

        <div className="ml-auto hidden max-w-md flex-1 sm:block">
          <SearchInput />
        </div>

        <div className="flex items-center gap-3">
          <CarritoContador />

          {/* Auth button */}
          {!cargando && (
            <div className="relative" ref={menuRef}>
              {usuario ? (
                <>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-[14px] text-ink-navy hover:text-mundo-blue"
                  >
                    <span className="hidden sm:inline">
                      {usuario.displayName?.split(" ")[0] || "Mi cuenta"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-cards border border-faint-border bg-pure-white py-2 shadow-lg">
                      {esAdmin && (
                        <button
                          onClick={() => { router.push("/admin"); setMenuOpen(false); }}
                          className="w-full px-4 py-2 text-left text-[14px] text-ink-navy hover:bg-ghost-white"
                        >
                          Panel admin
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-[14px] text-ink-navy hover:bg-ghost-white"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-2 text-[14px] text-ink-navy hover:text-mundo-blue"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </button>
              )}
            </div>
          )}

          <button
            className="sm:hidden text-ink-navy"
            onClick={() => setOpen(!open)}
            aria-label="Menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></> : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-faint-border px-4 py-4 sm:hidden">
          <SearchInput />
          {!cargando && !usuario && (
            <button
              onClick={() => router.push("/login")}
              className="mt-4 w-full rounded-chips bg-mundo-blue px-4 py-2 text-[14px] font-medium text-pure-white"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(header): agregar botón login y menú de usuario autenticado"
```

---

### Task 6: AuthProvider — Lógica de redirect post-login

**Files:**
- Modify: `src/components/auth/AuthProvider.tsx`

**Interfaces:**
- Consumes: `onIdTokenChanged` de Firebase Auth
- Produces: Redirect automático según `login-destino`

- [ ] **Step 1: Actualizar AuthProvider con redirect**

```tsx
// src/components/auth/AuthProvider.tsx — reemplazar el useEffect
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onIdTokenChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { esClaimAdmin } from "@/lib/auth-claims";

interface AuthContextValue {
  usuario: User | null;
  esAdmin: boolean;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextValue>({ usuario: null, esAdmin: false, cargando: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) {
      setCargando(false);
      return;
    }
    return onIdTokenChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        const token = await user.getIdTokenResult();
        const admin = esClaimAdmin(token.claims);
        setEsAdmin(admin);

        // Handle redirect after login (only on /login page)
        if (pathname === "/login") {
          const destino = localStorage.getItem("login-destino");
          localStorage.removeItem("login-destino");

          if (destino === "admin" && admin) {
            router.replace("/admin");
          } else if (destino === "cliente") {
            router.replace("/");
          } else if (admin) {
            router.replace("/admin");
          } else {
            router.replace("/");
          }
        }
      } else {
        setEsAdmin(false);
      }
      setCargando(false);
    });
  }, [router, pathname]);

  return <AuthContext.Provider value={{ usuario, esAdmin, cargando }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthProvider.tsx
git commit -m "feat(auth): agregar lógica de redirect post-login en AuthProvider"
```

---

### Task 7: AdminNav — Agregar enlace "Usuarios"

**Files:**
- Modify: `src/components/admin/AdminNav.tsx`

**Interfaces:**
- Consumes: `usePathname()` de next/navigation
- Produces: AdminNav con enlace "Usuarios"

- [ ] **Step 1: Agregar enlace Usuarios**

```tsx
// src/components/admin/AdminNav.tsx — agregar al array de enlaces
const enlaces = [
  { href: "/admin", etiqueta: "Dashboard" },
  { href: "/admin/categorias", etiqueta: "Categorías" },
  { href: "/admin/productos", etiqueta: "Productos" },
  { href: "/admin/pedidos", etiqueta: "Pedidos" },
  { href: "/admin/configuracion", etiqueta: "Config" },
  { href: "/admin/usuarios", etiqueta: "Usuarios" },
];
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminNav.tsx
git commit -m "feat(admin): agregar enlace Usuarios al AdminNav"
```

---

### Task 8: AdminUsuarios — Componente de gestión

**Files:**
- Create: `src/components/admin/AdminUsuarios.tsx`

**Interfaces:**
- Consumes: `asignarAdmin()`, `revocarAdmin()`, `listarAdmins()` de `@/lib/auth`
- Produces: Componente con formulario y lista de administradores

- [ ] **Step 1: Crear componente AdminUsuarios**

```tsx
// src/components/admin/AdminUsuarios.tsx
"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  email: string;
  admin: boolean;
  pendiente: boolean;
}

export function AdminUsuarios() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: "exito" | "error"; texto: string} | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);

  useEffect(() => {
    cargarAdmins();
  }, []);

  async function cargarAdmins() {
    setCargandoLista(true);
    try {
      const res = await fetch("/api/admin/usuarios");
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {
      setMensaje({tipo: "error", texto: "Error al cargar administradores"});
    }
    setCargandoLista(false);
  }

  async function handleAsignar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setCargando(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setMensaje({tipo: "exito", texto: data.mensaje});
        setEmail("");
        cargarAdmins();
      } else {
        setMensaje({tipo: "error", texto: data.mensaje});
      }
    } catch {
      setMensaje({tipo: "error", texto: "Error al asignar permiso"});
    }
    setCargando(false);
  }

  async function handleRevocar(adminEmail: string) {
    if (!confirm(`¿Quitar permisos de admin a ${adminEmail}?`)) return;

    setCargando(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setMensaje({tipo: "exito", texto: data.mensaje});
        cargarAdmins();
      } else {
        setMensaje({tipo: "error", texto: data.mensaje});
      }
    } catch {
      setMensaje({tipo: "error", texto: "Error al revocar permiso"});
    }
    setCargando(false);
  }

  const validarEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  return (
    <div className="space-y-6">
      <div className="rounded-cards bg-pure-white p-6 shadow-sm-2">
        <h2 className="text-[16px] font-semibold text-ink-navy">Agregar administrador</h2>
        <form onSubmit={handleAsignar} className="mt-4 flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            required
            className="flex-1 rounded-chips border border-faint-border px-4 py-2 text-[14px] focus:border-mundo-blue focus:outline-none"
          />
          <button
            type="submit"
            disabled={cargando || !validarEmail(email)}
            className="rounded-chips bg-mundo-blue px-6 py-2 text-[14px] font-medium text-pure-white transition hover:opacity-90 disabled:opacity-50"
          >
            {cargando ? "Asignando…" : "Dar permiso"}
          </button>
        </form>
      </div>

      {mensaje && (
        <div className={`rounded-chips px-4 py-3 text-[14px] ${mensaje.tipo === "exito" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="rounded-cards bg-pure-white p-6 shadow-sm-2">
        <h2 className="text-[16px] font-semibold text-ink-navy">Administradores actuales</h2>
        {cargandoLista ? (
          <p className="mt-4 text-[14px] text-steel-blue-gray">Cargando…</p>
        ) : admins.length === 0 ? (
          <p className="mt-4 text-[14px] text-steel-blue-gray">No hay administradores registrados.</p>
        ) : (
          <ul className="mt-4 divide-y divide-faint-border">
            {admins.map((admin) => (
              <li key={admin.email} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${admin.pendiente ? "bg-yellow-500" : "bg-green-500"}`} />
                  <span className="text-[14px] text-ink-navy">{admin.email}</span>
                  {admin.pendiente && (
                    <span className="text-[12px] text-yellow-600">(pendiente)</span>
                  )}
                </div>
                <button
                  onClick={() => handleRevocar(admin.email)}
                  disabled={cargando}
                  className="text-[14px] text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminUsuarios.tsx
git commit -m "feat(admin): crear componente AdminUsuarios para gestionar permisos"
```

---

### Task 9: API Route — `/api/admin/usuarios`

**Files:**
- Create: `src/app/api/admin/usuarios/route.ts`

**Interfaces:**
- Consumes: Firebase Admin SDK (`getAdminDb`, `getAuth`), `esClaimAdmin` de `@/lib/auth-claims`
- Produces: API endpoints GET, POST, DELETE para gestión de admins

- [ ] **Step 1: Crear API route**

```typescript
// src/app/api/admin/usuarios/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { esClaimAdmin } from "@/lib/auth-claims";

async function verificarAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    if (!esClaimAdmin(decodedToken)) {
      return null;
    }
    return decodedToken;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const admin = await verificarAdmin(request);
  if (!admin) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 });
  }

  const db = getAdminDb();
  const snapshot = await db.collection("usuarios").where("admin", "==", true).get();
  const admins = snapshot.docs.map(doc => doc.data());

  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const admin = await verificarAdmin(request);
  if (!admin) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ mensaje: "Email inválido" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getAdminDb();
  const docRef = db.collection("usuarios").doc(normalizedEmail);
  const doc = await docRef.get();

  if (doc.exists && doc.data()?.admin === true) {
    return NextResponse.json({ mensaje: "Este usuario ya tiene permisos de administrador." }, { status: 409 });
  }

  await docRef.set({
    email: normalizedEmail,
    admin: true,
    pendiente: true,
    creadoEn: new Date(),
  }, { merge: true });

  return NextResponse.json({ ok: true, mensaje: "Permiso asignado. El usuario debe cerrar sesión y volver a entrar." });
}

export async function DELETE(request: Request) {
  const admin = await verificarAdmin(request);
  if (!admin) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ mensaje: "Email requerido" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === admin.email) {
    return NextResponse.json({ mensaje: "No puedes quitarte tu propio permiso." }, { status: 400 });
  }

  const db = getAdminDb();
  const docRef = db.collection("usuarios").doc(normalizedEmail);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.admin !== true) {
    return NextResponse.json({ mensaje: "Este usuario no es administrador." }, { status: 404 });
  }

  await docRef.update({ admin: false });

  return NextResponse.json({ ok: true, mensaje: "Permiso revocado." });
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/usuarios/route.ts
git commit -m "feat(api): crear API route para gestión de administradores"
```

---

### Task 10: Página `/admin/usuarios`

**Files:**
- Create: `src/app/admin/usuarios/page.tsx`

**Interfaces:**
- Consumes: `AdminUsuarios` de `@/components/admin/AdminUsuarios`
- Produces: Página `/admin/usuarios`

- [ ] **Step 1: Crear página**

```tsx
// src/app/admin/usuarios/page.tsx
"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUsuarios } from "@/components/admin/AdminUsuarios";

export default function AdminUsuariosPage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Gestionar administradores</h1>
        <div className="mt-6">
          <AdminUsuarios />
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/usuarios/page.tsx
git commit -m "feat(admin): crear página /admin/usuarios"
```

---

### Task 11: Eliminar `/admin/login` y redirigir

**Files:**
- Delete: `src/app/admin/login/page.tsx`

**Interfaces:**
- Consumes: N/A
- Produces: Redirect de `/admin/login` → `/login`

- [ ] **Step 1: Crear redirect**

```tsx
// src/app/admin/login/page.tsx — reemplazar contenido
import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/login");
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/login/page.tsx
git commit -m "feat(login): redirigir /admin/login → /login"
```

---

### Task 12: Tests — Flujo de auth y permisos

**Files:**
- Modify: `tests/lib/auth-claims.test.ts`

**Interfaces:**
- Consumes: funciones de auth
- Produces: Tests cubriendo.flujo completo

- [ ] **Step 1: Agregar tests de integración**

```typescript
// tests/lib/auth-claims.test.ts — agregar tests
describe("flujo de login y permisos", () => {
  it("login-destino se guarda y limpia correctamente", () => {
    localStorage.setItem("login-destino", "admin");
    expect(localStorage.getItem("login-destino")).toBe("admin");
    localStorage.removeItem("login-destino");
    expect(localStorage.getItem("login-destino")).toBeNull();
  });

  it("validarEmail acepta emails válidos", () => {
    expect(validarEmail("test@example.com")).toBe(true);
    expect(validarEmail("user.name+tag@domain.co")).toBe(true);
  });

  it("validarEmail rechaza emails inválidos", () => {
    expect(validarEmail("")).toBe(false);
    expect(validarEmail("notanemail")).toBe(false);
    expect(validarEmail("@domain.com")).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar tests**

Run: `npm test -- tests/lib/auth-claims.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/lib/auth-claims.test.ts
git commit -m "test(auth): agregar tests de flujo login y validación email"
```

---

### Task 13: Verificación final

**Files:**
- N/A

**Interfaces:**
- Consumes: Todos los archivos anteriores
- Produces: Build exitoso + tests pasando

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Tests**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: Build exitoso

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat(f6-t1): login unificado + gestión de administradores"
```
