import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">
        404 — No encontrado
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Esta página del panel de administración no existe.
      </p>
      <Link href="/admin" className="mt-8">
        <Button>
          <Home className="size-4" />
          Volver al panel
        </Button>
      </Link>
    </div>
  );
}
