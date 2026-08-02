"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cerrarSesion } from "@/lib/auth-client";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useState } from "react";

const ENLACES: { href: string; etiqueta: string; icon: IconName }[] = [
  { href: "/admin", etiqueta: "Dashboard", icon: "home" },
  { href: "/admin/pedidos", etiqueta: "Pedidos", icon: "package" },
  { href: "/admin/productos", etiqueta: "Productos", icon: "shopping-bag" },
  { href: "/admin/categorias", etiqueta: "Categorías", icon: "grid" },
  { href: "/admin/usuarios", etiqueta: "Usuarios", icon: "users" },
  { href: "/admin/configuracion", etiqueta: "Configuración", icon: "zap" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function salir() {
    await cerrarSesion();
    router.replace("/");
  }

  const NavItem = ({ href, etiqueta, icon }: typeof ENLACES[0]) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setIsOpen(false)}
        className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
          active
            ? "bg-primary text-white shadow-md shadow-primary/20"
            : "text-steel-blue-gray hover:bg-canvas-frost hover:text-mundo-blue"
        }`}
      >
        <Icon
          name={icon}
          size={20}
          className={`${active ? "text-glow-cyan" : "text-steel-blue-gray group-hover:text-mundo-blue"}`}
        />
        <span className="text-[14px] font-medium">{etiqueta}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Trigger */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-faint-border bg-pure-white shadow-sm text-ink-navy"
        >
          <Icon name={isOpen ? "x" : "menu"} size={20} />
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-navy/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-faint-border bg-pure-white transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <Icon name="smartphone" size={20} />
            </div>
            <div>
              <p className="text-[14px] font-bold tracking-tight text-mundo-blue">MUNDO CELULAR</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-steel-blue-gray/60">Admin Panel</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {ENLACES.map((e) => (
              <NavItem key={e.href} {...e} />
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <button
              onClick={salir}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-steel-blue-gray transition-all hover:bg-danger/5 hover:text-danger"
            >
              <Icon name="x" size={20} />
              <span className="text-[14px] font-medium">Cerrar sesión</span>
            </button>
            
            <Link 
              href="/" 
              className="mt-4 flex items-center gap-3 rounded-xl bg-canvas-frost px-4 py-3 text-mundo-blue transition-all hover:bg-primary hover:text-white"
            >
              <Icon name="arrow-left" size={20} />
              <span className="text-[14px] font-medium">Volver a la tienda</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
