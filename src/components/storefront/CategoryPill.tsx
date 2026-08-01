import Link from "next/link";

export function CategoryPill({
  nombre,
  slug,
  icono,
}: {
  nombre: string;
  slug: string;
  icono?: React.ReactNode;
}) {
  return (
    <Link
      href={`/${slug}`}
      className="inline-flex items-center gap-2 rounded-chips border border-faint-border bg-surface px-5 py-2.5 text-[14px] font-medium text-text transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:border-primary hover:text-pure-white hover:shadow-sm-2"
    >
      {icono ?? (
        <span aria-hidden="true" className="flex h-1.5 w-1.5 rounded-full bg-primary transition-colors group-hover:bg-pure-white" />
      )}
      {nombre}
    </Link>
  );
}