"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCarrito } from "@/hooks/useCarrito";

const WHATSAPP_LINK = "https://wa.me/573113554021";

const navItems = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/#categorias", label: "Categorías", icon: "grid" },
  { href: "/carrito", label: "Carrito", icon: "bag" },
  { href: WHATSAPP_LINK, label: "WhatsApp", icon: "phone", external: true },
] as const;

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#143b98" : "#5b6b85"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconGrid({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#143b98" : "#5b6b85"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconBag({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#143b98" : "#5b6b85"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconPhone({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#143b98" : "#5b6b85"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

const icons = { home: IconHome, grid: IconGrid, bag: IconBag, phone: IconPhone };

export function BottomTabBar() {
  const pathname = usePathname();
  const { items } = useCarrito();
  const totalItems = items.reduce((sum: number, item: { cantidad: number }) => sum + item.cantidad, 0);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-faint-border bg-pure-white sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isExternal = "external" in item && item.external;
          const isActive = !isExternal && pathname === item.href;
          const Icon = icons[item.icon];
          const showBadge = item.icon === "bag" && totalItems > 0;

          const content = (
            <span className="flex flex-col items-center gap-0.5">
              <span className="relative">
                <Icon active={isActive} />
                {showBadge && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-mundo-blue text-[9px] font-bold text-pure-white">
                    {totalItems}
                  </span>
                )}
              </span>
              <span className={`text-[10px] ${isActive ? "font-semibold text-mundo-blue" : "text-steel-blue-gray"}`}>
                {item.label}
              </span>
            </span>
          );

          if (isExternal) {
            return (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                {content}
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href} aria-label={item.label} aria-current={isActive ? "page" : undefined}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
