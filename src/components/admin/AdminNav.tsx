"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cerrarSesion } from "@/lib/auth";

const ENLACES = [
  { href: "/admin", etiqueta: "Inicio" },
  { href: "/admin/categorias", etiqueta: "Categorías" },
  { href: "/admin/productos", etiqueta: "Productos" },
  { href: "/admin/pedidos", etiqueta: "Pedidos" },
  { href: "/admin/configuracion", etiqueta: "Configuración" },
  { href: "/admin/usuarios", etiqueta: "Usuarios" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await cerrarSesion();
    router.replace("/login");
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
