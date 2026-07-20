export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center gap-6 px-6">
      <h1 className="font-sora text-[20px] font-semibold tracking-[-0.03em] text-mundo-blue">
        MUNDO CELULAR
      </h1>
      <p className="text-[16px] tracking-[-0.02em] text-ink-navy">
        Tienda en construcción. Muy pronto: celulares, accesorios y tecnología en Medellín.
      </p>
      <span className="rounded-cards bg-pure-white px-6 py-4 font-jetbrains-mono text-[14px] text-steel-blue-gray shadow-sm-2">
        $ 1.850.000
      </span>
    </main>
  );
}
