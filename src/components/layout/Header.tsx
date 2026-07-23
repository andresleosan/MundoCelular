"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/storefront/SearchInput";
import { CarritoContador } from "@/components/carrito/CarritoContador";
import { useAuth } from "@/hooks/useAuth";
import { cerrarSesion } from "@/lib/auth-client";

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
