"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCarrito } from "@/hooks/useCarrito";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const WHATSAPP_LINK = "https://wa.me/573113554021";

const navItems = [
  { href: "/", label: "Inicio", icon: "home" as IconName },
  { href: "/#categorias", label: "Categorías", icon: "grid" as IconName },
  { href: "/carrito", label: "Carrito", icon: "shopping-bag" as IconName },
  { href: WHATSAPP_LINK, label: "WhatsApp", icon: "message-circle" as IconName, external: true },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const { items } = useCarrito();
  const totalItems = items.reduce((sum: number, item: { cantidad: number }) => sum + item.cantidad, 0);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-faint-border bg-surface/95 backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isExternal = "external" in item && item.external;
          const isActive = !isExternal && pathname === item.href;
          const showBadge = item.icon === "shopping-bag" && totalItems > 0;

          const content = (
            <span className="flex flex-col items-center gap-0.5">
              <span className="relative">
                <Icon
                  name={item.icon}
                  size={22}
                  className={isActive ? "text-primary" : "text-text-secondary"}
                />
                {showBadge && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-pure-white">
                    {totalItems}
                  </span>
                )}
              </span>
              <span className={`text-[10px] ${isActive ? "font-semibold text-primary" : "text-text-secondary"}`}>
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