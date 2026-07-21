import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reparaciones | Mundo Celular",
  description: "Reparación de celulares, tablets y consolas en Medellín.",
};

export default function ReparacionesPage() {
  return (
    <main className="mx-auto max-w-[800px] px-4 py-14 text-center">
      <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
        Reparaciones
      </h1>
      <p className="mt-4 text-[16px] text-steel-blue-gray">
        Reparamos celulares, tablets y consolas. Diagnóstico gratis.
      </p>
      <p className="mt-2 text-[14px] text-steel-blue-gray">
        Visítanos en Cra 36 # 38 - 33, Barrio El Salvador, Medellín
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="https://wa.me/573113554021"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
        >
          Consultar por WhatsApp
        </a>
        <Link
          href="/"
          className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] font-semibold text-gray-900 shadow-sm-2"
        >
          Ver productos
        </Link>
      </div>
    </main>
  );
}