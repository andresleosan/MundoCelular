"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cerrarSesion } from "@/lib/auth-client";
import { SearchInput } from "@/components/storefront/SearchInput";
import { CarritoContador } from "@/components/carrito/CarritoContador";
import { AuthModal } from "@/components/layout/AuthModal";
import { Icon } from "@/components/ui/Icon";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { usuario, esAdmin } = useAuth();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await cerrarSesion();
    setUserMenuOpen(false);
    router.push("/");
  }

  function inicial(nombre: string | null | undefined): string {
    if (!nombre) return "?";
    return nombre.trim().charAt(0).toUpperCase();
  }

  const navLinks = [
    { href: "/#categorias", label: "Categorías" },
    { href: "/#marcas", label: "Marcas" },
    { href: "/#ofertas", label: "Ofertas" },
    { href: "/contacto", label: "Sobre nosotros" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ease-out ${
          scrolled
            ? "border-b border-faint-border/60 bg-pure-white/80 backdrop-blur-2xl shadow-sm"
            : "border-b border-transparent bg-transparent backdrop-blur-none"
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center gap-6 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Mundo Celular - Inicio"
          >
            <Image
              src="/icons/logo-header.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
            <span className="font-inter-tight text-[18px] font-bold tracking-[-0.02em] text-primary">
              MUNDO CELULAR
            </span>
          </Link>

          <nav className="hidden gap-6 lg:flex" aria-label="Navegación principal">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[14px] font-medium text-text transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden max-w-md flex-1 sm:block">
            <SearchInput />
          </div>

          <div className="flex items-center gap-3">
            <CarritoContador />

            <div className="relative" ref={userMenuRef}>
              {usuario ? (
                <>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-label="Menú de usuario"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-pure-white">
                      {inicial(usuario.displayName)}
                    </span>
                    <Icon name="chevron-down" size={16} className="hidden text-steel-blue-gray sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-cards border border-faint-border bg-pure-white py-2 shadow-lg" role="menu">
                      <div className="border-b border-faint-border px-4 py-2 text-[12px] text-steel-blue-gray">
                        {usuario.displayName || usuario.email}
                      </div>
                      {esAdmin && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => { router.push("/admin"); setUserMenuOpen(false); }}
                          className="w-full px-4 py-2 text-left text-[14px] text-text hover:bg-canvas-frost"
                        >
                          Panel admin
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-[14px] text-text hover:bg-canvas-frost"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-canvas-frost"
                  aria-label="Iniciar sesión"
                >
                  <Icon name="user" size={20} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-canvas-frost lg:hidden"
              aria-label="Menú"
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? "x" : "menu"} size={22} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-faint-border bg-pure-white/95 backdrop-blur-lg lg:hidden">
            <nav className="mx-auto flex max-w-[1280px] flex-col gap-1 px-4 py-4" aria-label="Navegación móvil">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-chips px-3 py-2 text-[15px] font-medium text-text hover:bg-canvas-frost"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 sm:hidden">
                <SearchInput />
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
