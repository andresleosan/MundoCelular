import Link from "next/link";

export function CategoryPill({ nombre, slug, icono }: { nombre: string; slug: string; icono: React.ReactNode }) {
  return (
    <Link
      href={`/${slug}`}
      className="inline-flex items-center gap-2 rounded-chips border border-faint-border bg-pure-white px-3 py-1.5 text-[14px] text-ink-navy shadow-sm hover:shadow-sm-2"
    >
      <span className="text-mundo-blue">{icono}</span>
      {nombre}
    </Link>
  );
}
