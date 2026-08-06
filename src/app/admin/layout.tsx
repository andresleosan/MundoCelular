import { AdminGuard } from "@/components/admin/AdminGuard";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { TooltipProvider } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <AdminGuard>
        <div className="admin-light-scope min-h-dvh">
          <SidebarProvider
            style={
              {
                "--sidebar-width": "16rem",
                "--sidebar-width-icon": "3rem",
              } as React.CSSProperties
            }
          >
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border/40 bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumbs />
                </div>
              </header>
              <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </AdminGuard>
    </TooltipProvider>
  );
}
