# Task 3: LoginButtons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a React component `LoginButtons` with two buttons for "Cliente" and "Administrador" login options.

**Architecture:** Client component using `loginConGoogle()` from Firebase Auth, storing login destination in localStorage for redirect after authentication.

**Tech Stack:** React 19, Next.js 15 (App Router), TypeScript, Tailwind CSS

## Global Constraints

- UI en español (Colombia)
- Accent color `#143b98` SOLO en botón WhatsApp, wordmark y search submit
- Tokens de diseño en `src/app/globals.css` bajo `@theme`
- Alias `@/*` → `src/*`
- Windows PowerShell 5.1 (sin WSL)

---

## Estructura de Archivos

### Nuevos
- `src/components/auth/LoginButtons.tsx` — Componente con botones Cliente/Administrador

### Dependencias
- `src/lib/auth.ts` — `loginConGoogle()` existente
- `src/hooks/useAuth.ts` — `useAuth()` existente (no se usa en componente, pero disponible)

---

### Task 3: LoginButtons — Componente de login

**Files:**
- Create: `src/components/auth/LoginButtons.tsx`

**Interfaces:**
- Consumes: `loginConGoogle()` de `@/lib/auth`
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