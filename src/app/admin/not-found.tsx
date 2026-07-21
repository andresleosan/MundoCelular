import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main className="mx-auto max-w-[600px] px-4 py-14 text-center">
      <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
        404 — No encontrado
      </h1>
      <p className="mt-4 text-[15px] text-steel-blue-gray">
        Esta página del panel de administración no existe.
      </p>
      <div className="mt-8">
        <Link
          href="/admin"
          className="rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
        >
          Volver al panel
        </Link>
      </div>
    </main>
  );
}