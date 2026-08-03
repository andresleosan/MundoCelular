"use client";

import { usePathname, useRouter } from "next/navigation";
import { cerrarSesion } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Grid3X3,
  Users,
  LogOut,
  ArrowLeft,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Pedidos", url: "/admin/pedidos", icon: Package },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { title: "Productos", url: "/admin/productos", icon: ShoppingBag },
      { title: "Categorías", url: "/admin/categorias", icon: Grid3X3 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Usuarios", url: "/admin/usuarios", icon: Users },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await cerrarSesion();
    router.replace("/");
  }

  const isActive = (url: string) =>
    url === "/admin" ? pathname === "/admin" : pathname.startsWith(url);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => router.push("/admin")}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Smartphone className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-[13px]">
                  MUNDO CELULAR
                </span>
                <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
                  Admin Panel
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.url)}
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={salir}
              tooltip="Cerrar sesión"
              className="text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-400/10"
            >
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => router.push("/")}
              tooltip="Volver a la tienda"
            >
              <ArrowLeft className="size-4" />
              <span>Volver a la tienda</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
