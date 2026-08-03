import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Página no encontrada | Mundo Celular",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[800px] flex-col items-center gap-6 px-4 py-20 text-center">
      <h1 className="text-[64px] font-semibold tracking-[-0.03em] text-fog-white">404</h1>
      <p className="text-[18px] text-fog-white/70">Página no encontrada</p>
      <Link
        href="/"
        className="rounded-full border border-fog-white/15 bg-navy-surface/40 px-6 py-3 text-[14px] font-semibold text-fog-white shadow-sm-2"
      >
        Volver al inicio
      </Link>
    </main>
  );
}