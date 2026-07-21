"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchInput } from "@/components/storefront/SearchInput";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-faint-border bg-pure-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3">
        <Link href="/" className="font-sora text-[16px] font-semibold tracking-[-0.015em] text-ink-navy">
          MUNDO CELULAR
        </Link>

        <div className="ml-auto hidden max-w-md flex-1 sm:block">
          <SearchInput />
        </div>

        <div className="flex items-center gap-3">
          <Link href="/carrito" aria-label="Carrito" className="text-ink-navy hover:text-mundo-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </Link>

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