"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { LoginForm } from "@/components/layout/LoginForm";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeBtnRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Iniciar sesión"
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative rounded-cards bg-pure-white p-8 shadow-lg-2 max-w-[400px] w-[calc(100%-32px)]">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-chips text-steel-blue-gray hover:bg-canvas-frost"
        >
          <Icon name="x" size={20} />
        </button>

        <h2 className="font-inter-tight text-[24px] font-semibold tracking-[-0.03em] text-navy-deep">
          Iniciar sesión
        </h2>
        <p className="mt-1 text-[14px] text-steel-blue-gray">
          Accede con tu cuenta Google
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
