import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-surface">
        <AdminNav />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
