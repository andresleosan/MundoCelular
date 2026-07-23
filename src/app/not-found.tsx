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
      <h1 className="text-[64px] font-semibold tracking-[-0.03em] text-gray-900">404</h1>
      <p className="text-[18px] text-steel-blue-gray">Página no encontrada</p>
      <Link
        href="/"
        className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] font-semibold text-gray-900 shadow-sm-2"
      >
        Volver al inicio
      </Link>
    </main>
  );
}