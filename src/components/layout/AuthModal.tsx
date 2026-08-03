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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-light-scope relative w-[calc(100%-32px)] max-w-[520px] animate-modal-enter rounded-[28px] bg-white p-10 shadow-[0_30px_80px_rgba(0,0,0,0.18)] max-h-[95vh] overflow-y-auto">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-[#4B5A7D] transition-colors hover:bg-[#F0F3FA] hover:text-[#22335C]"
        >
          <Icon name="x" size={20} />
        </button>

        <h2 className="font-sora text-[36px] font-extrabold tracking-[-0.02em] text-[#081B4B] leading-tight">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-[15px] font-medium text-[#4B5A7D]">
          Accede con tu cuenta Google
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
