"use client";

import { LoginForm } from "@/components/layout/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <h1 className="font-inter-tight text-[24px] font-semibold tracking-[-0.03em] text-text">
          Panel de administración
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Inicia sesión con tu cuenta de administrador
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
