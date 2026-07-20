# Fase 1 — Base + Panel Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar funcionando la base de Mundo Celular: app Next.js con el sistema de diseño aplicado, login Google con rol admin (custom claim), CRUD de categorías y productos (sin imágenes aún), reglas Firestore verificadas con tests, y seed de `configuracion/tienda` con los datos reales.

**Architecture:** Next.js 15 App Router (`src/`), Tailwind v4 con tokens exactos del DESIGN doc, Firebase client SDK para el panel admin (componentes cliente), firebase-admin para rutas de servidor. Validación de datos en funciones puras testeadas con Vitest; reglas Firestore testeadas con el emulador. Sin worktree: repo greenfield sin trabajo paralelo, se trabaja en `master`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, firebase 11, firebase-admin 13, Vitest 3, @firebase/rules-unit-testing, tsx (scripts).

## Global Constraints

- **Spec de referencia:** `docs/superpowers/specs/2026-07-19-mundocelular-mvp-design.md`
- **Tokens de diseño:** valores exactos de `docs/DESIGN-mundocelular.md` (sección Quick Start) — nunca valores inventados. Color de acento `#143b98` SOLO en botón WhatsApp, wordmark y submit del buscador.
- **Idioma UI:** español (Colombia). Moneda: COP entero, formato `$ 1.850.000` vía `formatearCOP`.
- **Sin Firebase Storage.** Sin pasarela de pago.
- **Prerequisitos de entorno:** Node 20+, npm. Para tests de reglas: Java 17+ (emulador Firestore) y `firebase-tools`.
- **Convención de commits:** Conventional Commits en español (`feat:`, `test:`, `chore:`...). Los pasos "Commit" solo se ejecutan si el operador lo autorizó al iniciar la ejecución.
- **Estructura:** código de la app en `src/`, tests en `tests/` (espejo), scripts en `scripts/`.
- **Cierre de tarea:** antes de marcar una tarea como lista, aplicar el checklist de autocrítica del spec (sección 10) en lo que aplique a esa tarea.

---

### Task 1: Scaffold Next.js + tokens del sistema de diseño

**Files:**
- Create: `package.json` (vía create-next-app), `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `vitest.config.ts`, `tests/setup.ts`

**Interfaces:**
- Produces: app Next.js corriendo con alias `@/*` → `src/`; `npm test` configurado; tokens de diseño disponibles como utilidades Tailwind (`bg-canvas-frost`, `text-ink-navy`, `font-sora`, `font-jetbrains-mono`, `rounded-cards`, `shadow-sm-2`, etc.).

- [ ] **Step 1: Crear la app**

```bash
npx create-next-app@15 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack --yes
```

Si create-next-app se queja de archivos existentes (`BRIEF.md`, `tasks.md`, `docs/`), no los borres: CNA solo conflicta con archivos propios del scaffold. Si bloquea, mueve temporalmente `BRIEF.md`/`tasks.md` a `docs/`, ejecuta, y devuélvelos.

- [ ] **Step 2: Instalar dependencias de test**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Configurar Vitest**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

`tests/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

En `package.json` → scripts: `"test": "vitest run"`.

- [ ] **Step 4: Tokens de diseño**

Reemplazar `src/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-canvas-frost: #eef2f9;
  --color-pure-white: #ffffff;
  --color-ink-navy: #0a1930;
  --color-faint-border: #e0e6f0;
  --color-steel-blue-gray: #5b6b85;
  --color-cool-frost: #c7d0de;
  --color-mist-blue: #a8b8d0;
  --color-mundo-blue: #143b98;
  --color-blue-wash: #c3d4f7;
  --color-abyss-navy: #0f1f3d;
  --color-slate-mist: #3d4f70;

  /* Typography */
  --font-sora: var(--font-sora-css), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-jetbrains-mono: var(--font-jetbrains-mono-css), ui-monospace, "SF Mono", monospace;

  /* Border Radius */
  --radius-cards: 28px;
  --radius-chips: 9999px;
  --radius-pills: 20px;

  /* Shadows */
  --shadow-sm: rgba(10, 25, 48, 0.06) 0px 2px 8px 0px;
  --shadow-sm-2: rgba(10, 25, 48, 0.1) 0px 4px 6px -1px, rgba(10, 25, 48, 0.1) 0px 2px 4px -2px;
  --shadow-lg: rgba(10, 25, 48, 0.12) 0px 4px 24px 0px;
  --shadow-lg-2: rgba(20, 59, 152, 0.34) 0px 4px 24px 0px;
}

body {
  background-color: var(--color-canvas-frost);
  color: var(--color-ink-navy);
  font-family: var(--font-sora);
}
```

- [ ] **Step 5: Layout raíz con fuentes y metadata base**

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sora-css" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono-css" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Mundo Celular | Tecnología en Medellín", template: "%s | Mundo Celular" },
  description: "Celulares, accesorios, consolas y tecnología en Medellín. Compra por WhatsApp. También reparamos celulares.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${sora.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Home placeholder (smoke test del sistema de diseño)**

`src/app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center gap-6 px-6">
      <h1 className="font-sora text-[20px] font-semibold tracking-[-0.03em] text-mundo-blue">
        MUNDO CELULAR
      </h1>
      <p className="text-[16px] tracking-[-0.02em] text-ink-navy">
        Tienda en construcción. Muy pronto: celulares, accesorios y tecnología en Medellín.
      </p>
      <span className="rounded-cards bg-pure-white px-6 py-4 font-jetbrains-mono text-[14px] text-steel-blue-gray shadow-sm-2">
        $ 1.850.000
      </span>
    </main>
  );
}
```

- [ ] **Step 7: Verificar build y test runner**

```bash
npm run build
npm test
```
Expected: build OK; vitest corre con 0 tests ("No test files found" es aceptable, exit 0 con `--passWithNoTests` si fuera necesario).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + Tailwind v4 con tokens del sistema de diseño"
```

---

### Task 2: Utilidades base — slug y formato COP (TDD)

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/format.ts`
- Test: `tests/lib/slug.test.ts`, `tests/lib/format.test.ts`

**Interfaces:**
- Produces:
  - `generarSlug(nombre: string): string`
  - `esSlugReservado(slug: string): boolean`
  - `asegurarSlugUnico(base: string, existentes: string[]): string`
  - `SLUGS_RESERVADOS: string[]`
  - `formatearCOP(valor: number): string`

- [ ] **Step 1: Test de slugs (falla)**

`tests/lib/slug.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generarSlug, esSlugReservado, asegurarSlugUnico, SLUGS_RESERVADOS } from "@/lib/slug";

describe("generarSlug", () => {
  it("convierte nombre a slug", () => {
    expect(generarSlug("iPhone 13 Pro Max")).toBe("iphone-13-pro-max");
  });
  it("elimina tildes y caracteres especiales", () => {
    expect(generarSlug("Electrodomésticos & Más!")).toBe("electrodomesticos-mas");
  });
  it("colapsa guiones y espacios múltiples", () => {
    expect(generarSlug("  Bafle   JBL -- Go ")).toBe("bafle-jbl-go");
  });
  it("retorna vacío si no hay caracteres válidos", () => {
    expect(generarSlug("!!!")).toBe("");
  });
});

describe("esSlugReservado", () => {
  it("detecta slugs reservados", () => {
    expect(esSlugReservado("admin")).toBe(true);
    expect(esSlugReservado("reparaciones")).toBe(true);
    expect(esSlugReservado("celulares")).toBe(false);
  });
  it("la lista incluye todas las rutas del sistema", () => {
    for (const s of ["admin", "carrito", "checkout", "cuenta", "contacto", "reparaciones", "preguntas", "api"]) {
      expect(SLUGS_RESERVADOS).toContain(s);
    }
  });
});

describe("asegurarSlugUnico", () => {
  it("devuelve el base si no existe", () => {
    expect(asegurarSlugUnico("celulares", ["accesorios"])).toBe("celulares");
  });
  it("agrega sufijo numérico en colisión", () => {
    expect(asegurarSlugUnico("celulares", ["celulares", "celulares-2"])).toBe("celulares-3");
  });
});
```

Run: `npm test -- tests/lib/slug.test.ts` → Expected: FAIL (módulo no existe).

- [ ] **Step 2: Implementar `src/lib/slug.ts`**

```ts
export const SLUGS_RESERVADOS = [
  "admin", "carrito", "checkout", "cuenta", "contacto",
  "reparaciones", "preguntas", "api", "sitemap.xml", "robots.txt",
];

export function generarSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function esSlugReservado(slug: string): boolean {
  return SLUGS_RESERVADOS.includes(slug);
}

export function asegurarSlugUnico(base: string, existentes: string[]): string {
  if (!existentes.includes(base)) return base;
  let i = 2;
  while (existentes.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
```

Run: `npm test -- tests/lib/slug.test.ts` → Expected: PASS (9 tests).

- [ ] **Step 3: Test de formato COP (falla)**

`tests/lib/format.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { formatearCOP } from "@/lib/format";

describe("formatearCOP", () => {
  it("formatea enteros con separador de miles y sin decimales", () => {
    expect(formatearCOP(1850000).replace(/ /g, " ")).toBe("$ 1.850.000");
  });
  it("formatea cero", () => {
    expect(formatearCOP(0).replace(/ /g, " ")).toBe("$ 0");
  });
});
```

Run: `npm test -- tests/lib/format.test.ts` → Expected: FAIL.

- [ ] **Step 4: Implementar `src/lib/format.ts`**

```ts
const formato = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearCOP(valor: number): string {
  return formato.format(valor);
}
```

Run: `npm test -- tests/lib/format.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib tests/lib
git commit -m "feat: utilidades generarSlug/asegurarSlugUnico y formatearCOP con tests"
```

---

### Task 3: Tipos + Firebase client y Admin SDK

**Files:**
- Create: `src/types/index.ts`, `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`, `.env.local.example`, `.gitignore` (modificar si CNA no cubrió `.env*`)

**Interfaces:**
- Produces: tipos `Categoria`, `Producto`, `ItemCarrito`, `Pedido`, `ConfigTienda`; `db`, `auth`, `googleProvider` (cliente); `getAdminApp(): App`, `getAdminDb(): Firestore` (servidor).

- [ ] **Step 1: Tipos del dominio**

`src/types/index.ts`:
```ts
export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  orden: number;
  activa: boolean;
}

export interface ImagenProducto {
  url: string;
  thumb: string;
  alt: string;
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;          // COP entero
  stock: number;
  categoriaId: string;
  marca: string;
  specs: Record<string, string>;
  imagenes: ImagenProducto[];
  activo: boolean;
  destacado: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ItemCarrito {
  productoId: string;
  cantidad: number;
}

export interface Pedido {
  id: string;
  clienteUid: string;
  clienteNombre: string;
  clienteEmail: string;
  items: Array<{ productoId: string; nombre: string; precioUnitario: number; cantidad: number; subtotal: number }>;
  total: number;
  entrega: { tipo: "retiro" | "domicilio"; direccion?: string; barrio?: string };
  estado: "pendiente" | "contactado" | "cerrado" | "cancelado";
  creadoEn: unknown; // Timestamp
}

export interface ConfigTienda {
  nombre: string;
  whatsapp: string;   // "573113554021"
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  horario: string;
  redes: { instagram: string; facebook: string; tiktok: string };
}
```

- [ ] **Step 2: Cliente Firebase**

`src/lib/firebase.ts`:
```ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

- [ ] **Step 3: Admin SDK (solo servidor)**

`src/lib/firebase-admin.ts`:
```ts
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export function getAdminApp(): App {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getApps()[0];
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
```

- [ ] **Step 4: Template de entorno**

`.env.local.example`:
```bash
# Firebase (cliente — públicas por diseño)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (servidor — SECRETAS, nunca commit)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Sitio
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Verificar que `.gitignore` incluya `.env*`; si no, agregarlo.

- [ ] **Step 5: Instalar SDKs y verificar compilación**

```bash
npm i firebase firebase-admin
npm run build
```
Expected: build OK.

- [ ] **Step 6: Commit**

```bash
git add src/types src/lib .env.local.example .gitignore package.json package-lock.json
git commit -m "feat: tipos del dominio y setup Firebase client + Admin SDK"
```

---

### Task 4: Auth con Google + rol admin

**Files:**
- Create: `src/lib/auth.ts`, `src/components/auth/AuthProvider.tsx`, `src/hooks/useAuth.ts`, `src/components/auth/BotonGoogle.tsx`, `src/app/admin/login/page.tsx`
- Test: `tests/lib/auth-claims.test.ts`

**Interfaces:**
- Consumes: `auth`, `googleProvider` de `@/lib/firebase`.
- Produces: `loginConGoogle(): Promise<void>`, `cerrarSesion(): Promise<void>`, `<AuthProvider>`, `useAuth(): { usuario: User | null; esAdmin: boolean; cargando: boolean }`, `esClaimAdmin(claims: Record<string, unknown>): boolean`.

- [ ] **Step 1: Test de interpretación de claims (falla)**

`tests/lib/auth-claims.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { esClaimAdmin } from "@/lib/auth-claims";

describe("esClaimAdmin", () => {
  it("true solo cuando el claim admin es true", () => {
    expect(esClaimAdmin({ admin: true })).toBe(true);
    expect(esClaimAdmin({ admin: false })).toBe(false);
    expect(esClaimAdmin({})).toBe(false);
    expect(esClaimAdmin({ admin: "true" })).toBe(false);
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implementar claims + acciones de auth**

`src/lib/auth-claims.ts`:
```ts
export function esClaimAdmin(claims: Record<string, unknown>): boolean {
  return claims.admin === true;
}
```

`src/lib/auth.ts`:
```ts
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export async function loginConGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth);
}
```

Run: `npm test -- tests/lib/auth-claims.test.ts` → PASS.

- [ ] **Step 3: Provider y hook**

`src/components/auth/AuthProvider.tsx`:
```tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
    return onIdTokenChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        const token = await user.getIdTokenResult();
        setEsAdmin(esClaimAdmin(token.claims));
      } else {
        setEsAdmin(false);
      }
      setCargando(false);
    });
  }, []);

  return <AuthContext.Provider value={{ usuario, esAdmin, cargando }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
```

`src/hooks/useAuth.ts`:
```ts
export { useAuthContext as useAuth } from "@/components/auth/AuthProvider";
```

- [ ] **Step 4: Botón Google + página de login admin**

`src/components/auth/BotonGoogle.tsx`:
```tsx
"use client";

import { useState } from "react";
import { loginConGoogle } from "@/lib/auth";

export function BotonGoogle() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setCargando(true);
    setError("");
    try {
      await loginConGoogle();
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={cargando}
        className="rounded-chips bg-pure-white px-6 py-3 text-[14px] font-medium text-ink-navy shadow-sm-2 transition hover:shadow-lg disabled:opacity-50"
      >
        {cargando ? "Ingresando…" : "Ingresar con Google"}
      </button>
      {error && <p className="text-[12px] text-mundo-blue">{error}</p>}
    </div>
  );
}
```

`src/app/admin/login/page.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { BotonGoogle } from "@/components/auth/BotonGoogle";

export default function LoginAdmin() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && usuario) router.replace("/admin");
  }, [cargando, usuario, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-mundo-blue">MUNDO CELULAR</h1>
      <p className="text-[14px] text-steel-blue-gray">Panel de administración</p>
      <BotonGoogle />
    </main>
  );
}
```

Montar `<AuthProvider>` en `src/app/layout.tsx` envolviendo `{children}` (importar desde `@/components/auth/AuthProvider`).

- [ ] **Step 5: Verificar**

```bash
npm test && npm run build
```
Expected: tests PASS, build OK.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat: auth con Google, AuthProvider con claim admin y login de panel"
```

---

### Task 5: Reglas Firestore + tests con emulador

**Files:**
- Create: `firestore.rules`, `firebase.json`
- Test: `tests/rules/firestore.rules.test.ts`

**Interfaces:**
- Produces: reglas desplegables (`firebase deploy --only firestore:rules`) que implementan la sección 7 del spec.

- [ ] **Step 0: Prerequisitos**

```bash
java -version          # debe existir Java 17+ (emulador)
npm i -D @firebase/rules-unit-testing firebase-tools
npx firebase login     # si no está logueado
```

- [ ] **Step 1: Escribir las reglas**

`firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function esAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    match /productos/{id} {
      allow read: if true;
      allow write: if esAdmin();
    }

    match /categorias/{id} {
      allow read: if true;
      allow write: if esAdmin();
    }

    match /configuracion/{id} {
      allow read: if true;
      allow write: if esAdmin();
    }

    match /carritos/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /pedidos/{id} {
      allow read: if request.auth != null
        && (esAdmin() || resource.data.clienteUid == request.auth.uid);
      allow create: if false; // solo el Worker (Admin SDK) crea pedidos
      allow update: if esAdmin()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['estado', 'actualizadoEn']);
      allow delete: if false;
    }
  }
}
```

`firebase.json`:
```json
{
  "firestore": { "rules": "firestore.rules" },
  "emulators": {
    "firestore": { "port": 8080 },
    "ui": { "enabled": true }
  }
}
```

- [ ] **Step 2: Tests de reglas**

`tests/rules/firestore.rules.test.ts`:
```ts
// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it } from "vitest";
import { initializeTestEnvironment, assertSucceeds, assertFails, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-mundocelular",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

afterAll(async () => { await testEnv.cleanup(); });

describe("productos", () => {
  it("lectura pública, escritura denegada sin auth", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "productos/p1"), { nombre: "iPhone 13", precio: 100 });
    });
    await assertSucceeds(getDoc(doc(anon, "productos/p1")));
    await assertFails(setDoc(doc(anon, "productos/p2"), { nombre: "X" }));
  });

  it("cliente normal NO puede escribir precio/stock; admin sí", async () => {
    const cliente = testEnv.authenticatedContext("u1").firestore();
    await assertFails(setDoc(doc(cliente, "productos/p3"), { nombre: "X", precio: 1 }));
    const admin = testEnv.authenticatedContext("a1", { admin: true }).firestore();
    await assertSucceeds(setDoc(doc(admin, "productos/p3"), { nombre: "X", precio: 1, stock: 5 }));
  });
});

describe("carritos", () => {
  it("solo el dueño lee/escribe su carrito", async () => {
    const u1 = testEnv.authenticatedContext("u1").firestore();
    const u2 = testEnv.authenticatedContext("u2").firestore();
    await assertSucceeds(setDoc(doc(u1, "carritos/u1"), { items: [] }));
    await assertFails(getDoc(doc(u2, "carritos/u1")));
    await assertFails(setDoc(doc(u2, "carritos/u1"), { items: [] }));
  });
});

describe("pedidos", () => {
  it("ningún cliente puede crear pedidos directamente", async () => {
    const u1 = testEnv.authenticatedContext("u1").firestore();
    await assertFails(setDoc(doc(u1, "pedidos/ped1"), { clienteUid: "u1", total: 100 }));
  });

  it("el dueño lee su pedido; otro cliente no", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "pedidos/ped1"), { clienteUid: "u1", total: 100, estado: "pendiente" });
    });
    const u1 = testEnv.authenticatedContext("u1").firestore();
    const u2 = testEnv.authenticatedContext("u2").firestore();
    await assertSucceeds(getDoc(doc(u1, "pedidos/ped1")));
    await assertFails(getDoc(doc(u2, "pedidos/ped1")));
  });

  it("admin solo puede cambiar estado/actualizadoEn, no el total", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "pedidos/ped2"), { clienteUid: "u1", total: 100, estado: "pendiente" });
    });
    const admin = testEnv.authenticatedContext("a1", { admin: true }).firestore();
    await assertSucceeds(updateDoc(doc(admin, "pedidos/ped2"), { estado: "contactado" }));
    await assertFails(updateDoc(doc(admin, "pedidos/ped2"), { total: 1 }));
  });
});
```

- [ ] **Step 3: Correr tests contra el emulador**

```bash
npx firebase emulators:exec --only firestore "npm test"
```
Expected: PASS (6 tests de reglas + todos los anteriores).

- [ ] **Step 4: Commit**

```bash
git add firestore.rules firebase.json tests/rules package.json package-lock.json
git commit -m "feat: reglas Firestore por rol con tests de emulador"
```

---

### Task 6: Validaciones + capa de datos admin (categorías, productos, config)

**Files:**
- Create: `src/lib/validacion.ts`, `src/lib/revalidate.ts`, `src/lib/firestore/categorias.ts`, `src/lib/firestore/productos.ts`, `src/lib/firestore/config.ts`
- Test: `tests/lib/validacion.test.ts`

**Interfaces:**
- Consumes: `generarSlug`, `esSlugReservado`, `asegurarSlugUnico` (`@/lib/slug`); `db` (`@/lib/firebase`); tipos de `@/types`.
- Produces:
  - `validarCategoria(input: { nombre: string }): string[]`
  - `validarProducto(input: ProductoInput): string[]` donde `ProductoInput = { nombre: string; descripcion: string; precio: number; stock: number; categoriaId: string; marca: string; specs: Record<string,string>; activo: boolean; destacado: boolean }`
  - `avisarRevalidacion(tags: string[]): Promise<void>`
  - `listarCategorias(): Promise<Categoria[]>`, `crearCategoria(input): Promise<string>`, `actualizarCategoria(id, input): Promise<void>`, `eliminarCategoria(id): Promise<void>` (falla si tiene productos)
  - `listarProductos(): Promise<Producto[]>`, `crearProducto(input): Promise<string>`, `actualizarProducto(id, input): Promise<void>`, `eliminarProducto(id): Promise<void>`
  - `obtenerConfigTienda(): Promise<ConfigTienda | null>`, `guardarConfigTienda(config): Promise<void>`

- [ ] **Step 1: Tests de validación (falla)**

`tests/lib/validacion.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validarCategoria, validarProducto, type ProductoInput } from "@/lib/validacion";

const productoValido: ProductoInput = {
  nombre: "iPhone 13 128GB",
  descripcion: "iPhone 13 en excelente estado",
  precio: 1850000,
  stock: 3,
  categoriaId: "cat1",
  marca: "Apple",
  specs: { Almacenamiento: "128GB" },
  activo: true,
  destacado: false,
};

describe("validarCategoria", () => {
  it("exige nombre", () => {
    expect(validarCategoria({ nombre: "" })).toContain("El nombre es obligatorio");
    expect(validarCategoria({ nombre: "Celulares" })).toHaveLength(0);
  });
});

describe("validarProducto", () => {
  it("acepta un producto válido", () => {
    expect(validarProducto(productoValido)).toHaveLength(0);
  });
  it("exige nombre y categoría", () => {
    const errores = validarProducto({ ...productoValido, nombre: " ", categoriaId: "" });
    expect(errores).toContain("El nombre es obligatorio");
    expect(errores).toContain("La categoría es obligatoria");
  });
  it("precio debe ser entero positivo (COP)", () => {
    expect(validarProducto({ ...productoValido, precio: 0 })).toContain("El precio debe ser un entero mayor que 0");
    expect(validarProducto({ ...productoValido, precio: 99.9 })).toContain("El precio debe ser un entero mayor que 0");
  });
  it("stock debe ser entero >= 0", () => {
    expect(validarProducto({ ...productoValido, stock: -1 })).toContain("El stock debe ser un entero mayor o igual a 0");
    expect(validarProducto({ ...productoValido, stock: 0 })).toHaveLength(0);
  });
});
```

Run: `npm test -- tests/lib/validacion.test.ts` → FAIL.

- [ ] **Step 2: Implementar `src/lib/validacion.ts`**

```ts
export interface ProductoInput {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId: string;
  marca: string;
  specs: Record<string, string>;
  activo: boolean;
  destacado: boolean;
}

export function validarCategoria(input: { nombre: string }): string[] {
  const errores: string[] = [];
  if (!input.nombre.trim()) errores.push("El nombre es obligatorio");
  return errores;
}

export function validarProducto(input: ProductoInput): string[] {
  const errores: string[] = [];
  if (!input.nombre.trim()) errores.push("El nombre es obligatorio");
  if (!input.categoriaId) errores.push("La categoría es obligatoria");
  if (!Number.isInteger(input.precio) || input.precio <= 0) {
    errores.push("El precio debe ser un entero mayor que 0");
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    errores.push("El stock debe ser un entero mayor o igual a 0");
  }
  return errores;
}
```

Run → PASS.

- [ ] **Step 3: Revalidación bajo demanda (cliente)**

`src/lib/revalidate.ts`:
```ts
import { auth } from "./firebase";

export async function avisarRevalidacion(tags: string[]): Promise<void> {
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
```

- [ ] **Step 4: Capa de datos**

`src/lib/firestore/categorias.ts`:
```ts
import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where, limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { asegurarSlugUnico, esSlugReservado, generarSlug } from "../slug";
import { validarCategoria } from "../validacion";
import { avisarRevalidacion } from "../revalidate";
import type { Categoria } from "@/types";

const COL = "categorias";

export interface CategoriaInput {
  nombre: string;
  descripcion: string;
  orden: number;
  activa: boolean;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy("orden")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Categoria, "id">) }));
}

async function slugsExistentes(): Promise<string[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => d.data().slug as string);
}

export async function crearCategoria(input: CategoriaInput): Promise<string> {
  const errores = validarCategoria(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  const base = generarSlug(input.nombre);
  if (!base) throw new Error("El nombre no genera una URL válida");
  if (esSlugReservado(base)) throw new Error("Ese nombre usa una URL reservada del sistema");
  const slug = asegurarSlugUnico(base, await slugsExistentes());
  const ref = await addDoc(collection(db, COL), { ...input, nombre: input.nombre.trim(), slug });
  await avisarRevalidacion(["categorias"]);
  return ref.id;
}

export async function actualizarCategoria(id: string, input: CategoriaInput): Promise<void> {
  const errores = validarCategoria(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  await updateDoc(doc(db, COL, id), { ...input, nombre: input.nombre.trim() });
  await avisarRevalidacion(["categorias"]);
}

export async function eliminarCategoria(id: string): Promise<void> {
  const productos = await getDocs(query(collection(db, "productos"), where("categoriaId", "==", id), limit(1)));
  if (!productos.empty) throw new Error("No se puede eliminar: la categoría tiene productos");
  await deleteDoc(doc(db, COL, id));
  await avisarRevalidacion(["categorias"]);
}
```

`src/lib/firestore/productos.ts`:
```ts
import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { asegurarSlugUnico, esSlugReservado, generarSlug } from "../slug";
import { validarProducto, type ProductoInput } from "../validacion";
import { avisarRevalidacion } from "../revalidate";
import type { Producto } from "@/types";

const COL = "productos";

export async function listarProductos(): Promise<Producto[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy("nombre")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Producto, "id">) }));
}

async function slugsExistentes(): Promise<string[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => d.data().slug as string);
}

export async function crearProducto(input: ProductoInput): Promise<string> {
  const errores = validarProducto(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  const base = generarSlug(input.nombre);
  if (!base) throw new Error("El nombre no genera una URL válida");
  if (esSlugReservado(base)) throw new Error("Ese nombre usa una URL reservada del sistema");
  const slug = asegurarSlugUnico(base, await slugsExistentes());
  const ref = await addDoc(collection(db, COL), {
    ...input,
    nombre: input.nombre.trim(),
    slug,
    imagenes: [],
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  await avisarRevalidacion(["productos"]);
  return ref.id;
}

export async function actualizarProducto(id: string, input: ProductoInput): Promise<void> {
  const errores = validarProducto(input);
  if (errores.length > 0) throw new Error(errores.join(". "));
  await updateDoc(doc(db, COL, id), {
    ...input,
    nombre: input.nombre.trim(),
    actualizadoEn: serverTimestamp(),
  });
  await avisarRevalidacion(["productos"]);
}

export async function eliminarProducto(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
  await avisarRevalidacion(["productos"]);
}
```

`src/lib/firestore/config.ts`:
```ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { avisarRevalidacion } from "../revalidate";
import type { ConfigTienda } from "@/types";

const REF = () => doc(db, "configuracion", "tienda");

export async function obtenerConfigTienda(): Promise<ConfigTienda | null> {
  const snap = await getDoc(REF());
  return snap.exists() ? (snap.data() as ConfigTienda) : null;
}

export async function guardarConfigTienda(config: ConfigTienda): Promise<void> {
  await setDoc(REF(), config);
  await avisarRevalidacion(["config"]);
}
```

- [ ] **Step 5: Verificar**

```bash
npm test && npm run build
```
Expected: tests PASS, build OK (las funciones Firestore no se ejecutan en build, solo compilan).

- [ ] **Step 6: Commit**

```bash
git add src/lib tests/lib
git commit -m "feat: validaciones puras y capa de datos admin con slug único y revalidación"
```

---

### Task 7: Ruta /api/revalidate (segura, solo admin)

**Files:**
- Create: `src/app/api/revalidate/route.ts`

**Interfaces:**
- Consumes: `getAdminApp` (`@/lib/firebase-admin`), `avisarRevalidacion` (cliente, Task 6).
- Produces: `POST /api/revalidate` — header `Authorization: Bearer <idToken>`, body `{ tags: string[] }`. Solo admin; tags permitidos: `productos`, `categorias`, `config`.

- [ ] **Step 1: Implementar la ruta**

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";

const TAGS_PERMITIDOS = new Set(["productos", "categorias", "config"]);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
    if (decoded.admin !== true) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }
    const body = (await req.json()) as { tags?: unknown };
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string" || !TAGS_PERMITIDOS.has(t))) {
      return NextResponse.json({ error: "Tags inválidos" }, { status: 400 });
    }
    for (const tag of body.tags as string[]) revalidateTag(tag);
    return NextResponse.json({ revalidado: true, tags: body.tags });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: OK; la ruta aparece en el listado de rutas.

- [ ] **Step 3: Commit**

```bash
git add src/app/api
git commit -m "feat: endpoint /api/revalidate protegido por claim admin"
```

---

### Task 8: Shell del admin — guard, navegación y dashboard

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/components/admin/AdminGuard.tsx`, `src/components/admin/AdminNav.tsx`, `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `cerrarSesion()`, `listarCategorias()`, `listarProductos()`.
- Produces: `/admin/*` protegido (redirige a `/admin/login` sin sesión; mensaje "sin acceso" sin claim admin); metadata `noindex` en todo `/admin`.

- [ ] **Step 1: Layout con noindex + guard**

`src/app/admin/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { AdminGuard } from "@/components/admin/AdminGuard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
```

`src/components/admin/AdminGuard.tsx`:
```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { usuario, esAdmin, cargando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const esLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!cargando && !usuario && !esLogin) router.replace("/admin/login");
  }, [cargando, usuario, esLogin, router]);

  if (esLogin) return <>{children}</>;
  if (cargando || !usuario) {
    return <main className="flex min-h-screen items-center justify-center text-[14px] text-steel-blue-gray">Cargando…</main>;
  }
  if (!esAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Sin acceso</h1>
        <p className="text-[14px] text-steel-blue-gray">Esta cuenta no tiene permisos de administrador.</p>
      </main>
    );
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Navegación del admin**

`src/components/admin/AdminNav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cerrarSesion } from "@/lib/auth";

const ENLACES = [
  { href: "/admin", etiqueta: "Inicio" },
  { href: "/admin/categorias", etiqueta: "Categorías" },
  { href: "/admin/productos", etiqueta: "Productos" },
  { href: "/admin/configuracion", etiqueta: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await cerrarSesion();
    router.replace("/admin/login");
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 border-b border-faint-border bg-pure-white px-4 py-3">
      <span className="mr-4 text-[14px] font-semibold tracking-[-0.015em] text-mundo-blue">MUNDO CELULAR</span>
      {ENLACES.map((e) => (
        <Link
          key={e.href}
          href={e.href}
          className={`rounded-chips px-4 py-2 text-[14px] ${
            pathname === e.href ? "bg-canvas-frost font-semibold text-mundo-blue" : "text-ink-navy hover:bg-canvas-frost"
          }`}
        >
          {e.etiqueta}
        </Link>
      ))}
      <button onClick={salir} className="ml-auto rounded-chips px-4 py-2 text-[12px] text-steel-blue-gray hover:bg-canvas-frost">
        Cerrar sesión
      </button>
    </nav>
  );
}
```

- [ ] **Step 3: Dashboard**

`src/app/admin/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";

export default function AdminInicio() {
  const [totales, setTotales] = useState<{ categorias: number; productos: number; activos: number } | null>(null);

  useEffect(() => {
    Promise.all([listarCategorias(), listarProductos()]).then(([cats, prods]) => {
      setTotales({ categorias: cats.length, productos: prods.length, activos: prods.filter((p) => p.activo).length });
    });
  }, []);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Panel de administración</h1>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Categorías", valor: totales?.categorias },
            { etiqueta: "Productos", valor: totales?.productos },
            { etiqueta: "Productos activos", valor: totales?.activos },
          ].map((c) => (
            <div key={c.etiqueta} className="rounded-cards bg-pure-white p-6 shadow-sm-2">
              <p className="text-[12px] font-medium text-steel-blue-gray">{c.etiqueta}</p>
              <p className="mt-2 font-jetbrains-mono text-[16px]">{c.valor ?? "…"}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```
Expected: OK.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin src/components/admin
git commit -m "feat: shell del panel admin con guard por claim, navegación y dashboard"
```

---

### Task 9: CRUD de categorías (UI)

**Files:**
- Create: `src/app/admin/categorias/page.tsx`, `src/app/admin/categorias/nueva/page.tsx`, `src/app/admin/categorias/[id]/page.tsx`, `src/components/admin/CategoriaForm.tsx`
- Test: `tests/components/CategoriaForm.test.tsx`

**Interfaces:**
- Consumes: `listarCategorias`, `crearCategoria`, `actualizarCategoria`, `eliminarCategoria` (Task 6); `AdminNav`.
- Produces: rutas `/admin/categorias`, `/admin/categorias/nueva`, `/admin/categorias/[id]`.

- [ ] **Step 1: Test del formulario (falla)**

`tests/components/CategoriaForm.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoriaForm } from "@/components/admin/CategoriaForm";

vi.mock("@/lib/firestore/categorias", () => ({
  crearCategoria: vi.fn(),
  actualizarCategoria: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("CategoriaForm", () => {
  it("muestra error si el nombre está vacío", async () => {
    render(<CategoriaForm />);
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(await screen.findByText("El nombre es obligatorio")).toBeInTheDocument();
  });

  it("muestra vista previa del slug mientras se escribe", () => {
    render(<CategoriaForm />);
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Electrodomésticos" } });
    expect(screen.getByText(/electrodomesticos/)).toBeInTheDocument();
  });
});
```

Run: `npm test -- tests/components/CategoriaForm.test.tsx` → FAIL.

- [ ] **Step 2: Implementar el formulario**

`src/components/admin/CategoriaForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarSlug } from "@/lib/slug";
import { crearCategoria, actualizarCategoria } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export function CategoriaForm({ categoria }: { categoria?: Categoria }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? "");
  const [orden, setOrden] = useState(categoria?.orden ?? 0);
  const [activa, setActiva] = useState(categoria?.activa ?? true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      if (categoria) await actualizarCategoria(categoria.id, { nombre, descripcion, orden, activa });
      else await crearCategoria({ nombre, descripcion, orden, activa });
      router.push("/admin/categorias");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setGuardando(false);
    }
  }

  const inputClase =
    "w-full rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] text-ink-navy outline-none focus:border-mundo-blue";

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4 rounded-cards bg-pure-white p-6 shadow-sm-2">
      <div>
        <label htmlFor="nombre" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Nombre</label>
        <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClase} />
        {nombre && <p className="mt-1 font-jetbrains-mono text-[12px] text-steel-blue-gray">/{generarSlug(nombre)}</p>}
      </div>
      <div>
        <label htmlFor="descripcion" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Descripción (SEO)</label>
        <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className={inputClase} />
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label htmlFor="orden" className="mb-1 block text-[12px] font-medium text-steel-blue-gray">Orden</label>
          <input id="orden" type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className={`${inputClase} w-24`} />
        </div>
        <label className="mt-5 flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} /> Activa
        </label>
      </div>
      {error && <p className="text-[12px] text-mundo-blue">{error}</p>}
      <button type="submit" disabled={guardando} className="rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2 disabled:opacity-50">
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
```

Run: `npm test -- tests/components/CategoriaForm.test.tsx` → PASS.

- [ ] **Step 3: Páginas lista / nueva / editar**

`src/app/admin/categorias/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { eliminarCategoria, listarCategorias } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState("");

  const cargar = () => listarCategorias().then(setCategorias).catch(() => setError("No se pudieron cargar"));
  useEffect(() => { cargar(); }, []);

  async function eliminar(id: string) {
    setError("");
    try {
      await eliminarCategoria(id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Categorías</h1>
          <Link href="/admin/categorias/nueva" className="rounded-chips bg-mundo-blue px-4 py-2 text-[14px] font-semibold text-pure-white shadow-lg-2">
            Nueva categoría
          </Link>
        </div>
        {error && <p className="mt-4 text-[12px] text-mundo-blue">{error}</p>}
        <ul className="mt-6 flex flex-col gap-3">
          {categorias.map((c) => (
            <li key={c.id} className="flex items-center gap-4 rounded-cards bg-pure-white px-6 py-4 shadow-sm-2">
              <span className="text-[14px] font-semibold">{c.nombre}</span>
              <span className="font-jetbrains-mono text-[12px] text-steel-blue-gray">/{c.slug}</span>
              {!c.activa && <span className="rounded-chips bg-canvas-frost px-2 py-1 text-[11px] text-steel-blue-gray">inactiva</span>}
              <span className="ml-auto flex gap-2">
                <Link href={`/admin/categorias/${c.id}`} className="rounded-chips border border-faint-border px-3 py-1 text-[12px]">Editar</Link>
                <button onClick={() => eliminar(c.id)} className="rounded-chips border border-faint-border px-3 py-1 text-[12px] text-steel-blue-gray">
                  Eliminar
                </button>
              </span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
```

`src/app/admin/categorias/nueva/page.tsx`:
```tsx
"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { CategoriaForm } from "@/components/admin/CategoriaForm";

export default function NuevaCategoria() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Nueva categoría</h1>
        <CategoriaForm />
      </main>
    </>
  );
}
```

`src/app/admin/categorias/[id]/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { CategoriaForm } from "@/components/admin/CategoriaForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export default function EditarCategoria() {
  const { id } = useParams<{ id: string }>();
  const [categoria, setCategoria] = useState<Categoria | null>(null);

  useEffect(() => {
    listarCategorias().then((cats) => setCategoria(cats.find((c) => c.id === id) ?? null));
  }, [id]);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Editar categoría</h1>
        {categoria ? <CategoriaForm categoria={categoria} /> : <p className="text-[14px] text-steel-blue-gray">Cargando…</p>}
      </main>
    </>
  );
}
```

- [ ] **Step 4: Verificar**

```bash
npm test && npm run build
```
Expected: PASS + build OK.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/categorias src/components/admin/CategoriaForm.tsx tests/components
git commit -m "feat: CRUD de categorías con slug automático y tests de formulario"
```

---

### Task 10: CRUD de productos (UI, sin imágenes) + seed de configuración + cierre de Fase 1

**Files:**
- Create: `src/app/admin/productos/page.tsx`, `src/app/admin/productos/nueva/page.tsx`, `src/app/admin/productos/[id]/page.tsx`, `src/components/admin/ProductoForm.tsx`, `src/app/admin/configuracion/page.tsx`, `scripts/seed-config.ts`, `scripts/set-admin.ts`
- Test: `tests/components/ProductoForm.test.tsx`

**Interfaces:**
- Consumes: todo lo anterior. El select de categoría usa `listarCategorias()`.
- Produces: rutas `/admin/productos*`, `/admin/configuracion`; scripts `npm run seed:config` y `npm run set:admin -- <uid>`.

- [ ] **Step 1: Test del formulario (falla)**

`tests/components/ProductoForm.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductoForm } from "@/components/admin/ProductoForm";
import type { Categoria } from "@/types";

vi.mock("@/lib/firestore/productos", () => ({ crearProducto: vi.fn(), actualizarProducto: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const categorias: Categoria[] = [
  { id: "cat1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true },
];

describe("ProductoForm", () => {
  it("exige nombre, precio válido y categoría antes de guardar", async () => {
    render(<ProductoForm categorias={categorias} />);
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(await screen.findByText(/El nombre es obligatorio/)).toBeInTheDocument();
  });

  it("muestra las categorías disponibles en el select", () => {
    render(<ProductoForm categorias={categorias} />);
    expect(screen.getByRole("option", { name: "Celulares" })).toBeInTheDocument();
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implementar `ProductoForm`**

`src/components/admin/ProductoForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearProducto, actualizarProducto } from "@/lib/firestore/productos";
import { validarProducto } from "@/lib/validacion";
import type { Categoria, Producto } from "@/types";

export function ProductoForm({ categorias, producto }: { categorias: Categoria[]; producto?: Producto }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(producto?.precio?.toString() ?? "");
  const [stock, setStock] = useState(producto?.stock?.toString() ?? "0");
  const [categoriaId, setCategoriaId] = useState(producto?.categoriaId ?? "");
  const [marca, setMarca] = useState(producto?.marca ?? "");
  const [specsTexto, setSpecsTexto] = useState(
    producto ? Object.entries(producto.specs).map(([k, v]) => `${k}: ${v}`).join("\n") : ""
  );
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
  const [errores, setErrores] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  function parsearSpecs(): Record<string, string> {
    const specs: Record<string, string> = {};
    for (const linea of specsTexto.split("\n")) {
      const idx = linea.indexOf(":");
      if (idx > 0) specs[linea.slice(0, idx).trim()] = linea.slice(idx + 1).trim();
    }
    return specs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      nombre, descripcion,
      precio: Number(precio),
      stock: Number(stock),
      categoriaId, marca,
      specs: parsearSpecs(),
      activo, destacado,
    };
    const errs = validarProducto(input);
    if (errs.length > 0) {
      setErrores(errs);
      return;
    }
    setGuardando(true);
    setErrores([]);
    try {
      if (producto) await actualizarProducto(producto.id, input);
      else await crearProducto(input);
      router.push("/admin/productos");
    } catch (err) {
      setErrores([err instanceof Error ? err.message : "Error al guardar"]);
      setGuardando(false);
    }
  }

  const inputClase =
    "w-full rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] text-ink-navy outline-none focus:border-mundo-blue";
  const labelClase = "mb-1 block text-[12px] font-medium text-steel-blue-gray";

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4 rounded-cards bg-pure-white p-6 shadow-sm-2">
      <div>
        <label htmlFor="nombre" className={labelClase}>Nombre</label>
        <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClase} />
      </div>
      <div>
        <label htmlFor="descripcion" className={labelClase}>Descripción</label>
        <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className={inputClase} />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="precio" className={labelClase}>Precio (COP, entero)</label>
          <input id="precio" type="number" min="1" step="1" value={precio} onChange={(e) => setPrecio(e.target.value)} className={`${inputClase} font-jetbrains-mono`} />
        </div>
        <div className="flex-1">
          <label htmlFor="stock" className={labelClase}>Stock</label>
          <input id="stock" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} className={`${inputClase} font-jetbrains-mono`} />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="categoria" className={labelClase}>Categoría</label>
          <select id="categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputClase}>
            <option value="">Seleccionar…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="marca" className={labelClase}>Marca</label>
          <input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} className={inputClase} placeholder="Apple, Samsung, Xiaomi…" />
        </div>
      </div>
      <div>
        <label htmlFor="specs" className={labelClase}>Specs (una por línea, formato "Clave: Valor")</label>
        <textarea id="specs" value={specsTexto} onChange={(e) => setSpecsTexto(e.target.value)} rows={3} className={`${inputClase} font-jetbrains-mono text-[12px]`} placeholder={"Almacenamiento: 128GB\nRAM: 6GB"} />
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Activo</label>
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} /> Destacado</label>
      </div>
      {errores.length > 0 && (
        <ul className="text-[12px] text-mundo-blue">
          {errores.map((err) => <li key={err}>{err}</li>)}
        </ul>
      )}
      <button type="submit" disabled={guardando} className="rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2 disabled:opacity-50">
        {guardando ? "Guardando…" : "Guardar"}
      </button>
      <p className="text-[11px] text-steel-blue-gray">Las imágenes se agregan en la Fase 4 del proyecto.</p>
    </form>
  );
}
```

Run: `npm test -- tests/components/ProductoForm.test.tsx` → PASS.

- [ ] **Step 3: Páginas de productos**

`src/app/admin/productos/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { eliminarProducto, listarProductos } from "@/lib/firestore/productos";
import { formatearCOP } from "@/lib/format";
import type { Producto } from "@/types";

export default function ProductosAdmin() {
  const [productos, setProductos] = useState<Producto[]>([]);

  const cargar = () => listarProductos().then(setProductos);
  useEffect(() => { cargar(); }, []);

  async function eliminar(id: string) {
    await eliminarProducto(id);
    await cargar();
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">Productos</h1>
          <Link href="/admin/productos/nueva" className="rounded-chips bg-mundo-blue px-4 py-2 text-[14px] font-semibold text-pure-white shadow-lg-2">
            Nuevo producto
          </Link>
        </div>
        <ul className="mt-6 flex flex-col gap-3">
          {productos.map((p) => (
            <li key={p.id} className="flex items-center gap-4 rounded-cards bg-pure-white px-6 py-4 shadow-sm-2">
              <div>
                <p className="text-[14px] font-semibold">{p.nombre} {p.destacado && <span className="ml-1 rounded-chips bg-canvas-frost px-2 py-0.5 text-[11px] text-mundo-blue">destacado</span>}</p>
                <p className="font-jetbrains-mono text-[12px] text-steel-blue-gray">
                  {formatearCOP(p.precio)} · stock {p.stock} · /{p.slug}
                </p>
              </div>
              {!p.activo && <span className="rounded-chips bg-canvas-frost px-2 py-1 text-[11px] text-steel-blue-gray">inactivo</span>}
              <span className="ml-auto flex gap-2">
                <Link href={`/admin/productos/${p.id}`} className="rounded-chips border border-faint-border px-3 py-1 text-[12px]">Editar</Link>
                <button onClick={() => eliminar(p.id)} className="rounded-chips border border-faint-border px-3 py-1 text-[12px] text-steel-blue-gray">Eliminar</button>
              </span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
```

`src/app/admin/productos/nueva/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductoForm } from "@/components/admin/ProductoForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import type { Categoria } from "@/types";

export default function NuevoProducto() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  useEffect(() => { listarCategorias().then(setCategorias); }, []);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Nuevo producto</h1>
        <ProductoForm categorias={categorias} />
      </main>
    </>
  );
}
```

`src/app/admin/productos/[id]/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductoForm } from "@/components/admin/ProductoForm";
import { listarCategorias } from "@/lib/firestore/categorias";
import { listarProductos } from "@/lib/firestore/productos";
import type { Categoria, Producto } from "@/types";

export default function EditarProducto() {
  const { id } = useParams<{ id: string }>();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [producto, setProducto] = useState<Producto | null>(null);

  useEffect(() => {
    listarCategorias().then(setCategorias);
    listarProductos().then((prods) => setProducto(prods.find((p) => p.id === id) ?? null));
  }, [id]);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Editar producto</h1>
        {producto ? <ProductoForm categorias={categorias} producto={producto} /> : <p className="text-[14px] text-steel-blue-gray">Cargando…</p>}
      </main>
    </>
  );
}
```

- [ ] **Step 4: Página de configuración de la tienda**

`src/app/admin/configuracion/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { obtenerConfigTienda, guardarConfigTienda } from "@/lib/firestore/config";
import type { ConfigTienda } from "@/types";

const CONFIG_INICIAL: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: "573113554021",
  direccion: "Cra 36 # 38 - 33, Barrio El Salvador",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "Colombia",
  horario: "",
  redes: {
    instagram: "https://www.instagram.com/mundo_celular_75/",
    facebook: "https://www.facebook.com/Mundo.Celular.01",
    tiktok: "https://www.tiktok.com/@mundocelular75",
  },
};

export default function ConfiguracionAdmin() {
  const [config, setConfig] = useState<ConfigTienda>(CONFIG_INICIAL);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    obtenerConfigTienda().then((c) => { if (c) setConfig(c); });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await guardarConfigTienda(config);
    setMensaje("Configuración guardada");
    setTimeout(() => setMensaje(""), 3000);
  }

  const inputClase =
    "w-full rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] text-ink-navy outline-none focus:border-mundo-blue";
  const labelClase = "mb-1 block text-[12px] font-medium text-steel-blue-gray";

  function campo(id: keyof ConfigTienda, etiqueta: string) {
    return (
      <div key={id}>
        <label htmlFor={id} className={labelClase}>{etiqueta}</label>
        <input id={id} value={config[id] as string} onChange={(e) => setConfig({ ...config, [id]: e.target.value })} className={inputClase} />
      </div>
    );
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Configuración de la tienda</h1>
        <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4 rounded-cards bg-pure-white p-6 shadow-sm-2">
          {campo("nombre", "Nombre de la tienda")}
          {campo("whatsapp", "WhatsApp (formato 57XXXXXXXXXX)")}
          {campo("direccion", "Dirección")}
          {campo("ciudad", "Ciudad")}
          {campo("departamento", "Departamento")}
          {campo("pais", "País")}
          {campo("horario", "Horario de atención")}
          {mensaje && <p className="text-[12px] text-mundo-blue">{mensaje}</p>}
          <button type="submit" className="rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2">
            Guardar
          </button>
        </form>
      </main>
    </>
  );
}
```

- [ ] **Step 5: Scripts de seed y rol admin**

```bash
npm i -D tsx dotenv
```

`scripts/seed-config.ts`:
```ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { getAdminDb } from "../src/lib/firebase-admin";

async function main() {
  const db = getAdminDb();
  await db.collection("configuracion").doc("tienda").set({
    nombre: "Mundo Celular",
    whatsapp: "573113554021",
    direccion: "Cra 36 # 38 - 33, Barrio El Salvador",
    ciudad: "Medellín",
    departamento: "Antioquia",
    pais: "Colombia",
    horario: "",
    redes: {
      instagram: "https://www.instagram.com/mundo_celular_75/",
      facebook: "https://www.facebook.com/Mundo.Celular.01",
      tiktok: "https://www.tiktok.com/@mundocelular75",
    },
  });
  console.log("configuracion/tienda creada");
}

main().catch((err) => { console.error(err); process.exit(1); });
```

`scripts/set-admin.ts`:
```ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "../src/lib/firebase-admin";

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Uso: npm run set:admin -- <uid>");
    process.exit(1);
  }
  await getAuth(getAdminApp()).setCustomUserClaims(uid, { admin: true });
  console.log(`Claim admin asignado a ${uid}. El usuario debe cerrar sesión y volver a entrar.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

En `package.json` → scripts:
```json
"seed:config": "tsx scripts/seed-config.ts",
"set:admin": "tsx scripts/set-admin.ts"
```

- [ ] **Step 6: Actualizar `tasks.md`**

Reemplazar el contenido por el estado del proyecto:
```markdown
# Tareas — Mundo_Celular

Spec: docs/superpowers/specs/2026-07-19-mundocelular-mvp-design.md
Plan Fase 1: docs/superpowers/plans/2026-07-19-fase1-base-admin.md

## Fase 1 — Base + Admin
- [x] Scaffold Next.js + tokens de diseño
- [x] Utilidades slug + formato COP
- [x] Firebase client/admin + tipos
- [x] Auth Google + claim admin
- [x] Reglas Firestore + tests emulador
- [x] Capa de datos + /api/revalidate
- [x] Shell admin + CRUD categorías + CRUD productos
- [x] Config tienda + scripts seed/set-admin

## Pendiente para usar el panel
- [ ] Crear proyecto Firebase + Auth Google + Firestore
- [ ] Copiar credenciales a .env.local
- [ ] `npx firebase deploy --only firestore:rules`
- [ ] Login en /admin/login, copiar UID, `npm run set:admin -- <uid>`
- [ ] `npm run seed:config`

## Fases siguientes
- [ ] Fase 2 — Catálogo público SSG + SEO + carrito
- [ ] Fase 3 — Checkout WhatsApp + Worker /pedidos
- [ ] Fase 4 — Imágenes R2 + Worker presign
- [ ] Fase 5 — Pulido mobile + /contacto /reparaciones /preguntas + auditoría CWV/WCAG
```

- [ ] **Step 7: Verificación final de Fase 1**

```bash
npm test
npx firebase emulators:exec --only firestore "npm test -- tests/rules"
npm run build
```
Expected: todos los tests PASS (utilidades + validación + formularios + reglas), build de producción OK.

QA manual (con Firebase real configurado): login en `/admin/login` → asignar claim → crear 2 categorías → crear 3 productos → verificar slugs únicos → editar → eliminar categoría vacía (OK) y con productos (debe rechazar).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: CRUD productos, configuración de tienda y scripts de seed/admin — cierra Fase 1"
```

---

## Self-Review (ejecutado al escribir el plan)

**Spec coverage (Fase 1 del spec):** scaffold ✓ (T1), tokens ✓ (T1), Auth Google ✓ (T4), claim admin ✓ (T4, T10 script), CRUD categorías ✓ (T6+T9), CRUD productos con slugs ✓ (T6+T10), reglas Firestore ✓ (T5), config tienda con datos reales ✓ (T10), /api/revalidate ✓ (T7). Imágenes: fuera de Fase 1 por spec ✓ (placeholder documentado en ProductoForm).

**Placeholders:** ninguno; todo el código está completo.

**Type consistency:** `ProductoInput` (validacion.ts) es el mismo shape que usan `crearProducto`/`actualizarProducto` (productos.ts) y `ProductoForm` ✓; `avisarRevalidacion(tags: string[])` coincide con la ruta `{ tags }` ✓; tags `productos|categorias|config` idénticos en cliente, ruta y capa de datos ✓; `esClaimAdmin` usado por AuthProvider ✓; `CategoriaInput` consistente entre categorias.ts y CategoriaForm ✓.
