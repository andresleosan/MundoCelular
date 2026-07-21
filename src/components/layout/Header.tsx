"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchInput } from "@/components/storefront/SearchInput";
import { CarritoContador } from "@/components/carrito/CarritoContador";

export function Header() {
  const [open, setOpen] = useState(false);

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
        </div>
      )}
    </header>
  );
}