import Link from "next/link";

export function CategorySectionHeader({ titulo, verTodoSlug }: { titulo: string; verTodoSlug?: string }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <h2 className="font-inter-tight text-[24px] font-bold tracking-[-0.02em] text-text">{titulo}</h2>
      {verTodoSlug && (
        <Link
          href={`/${verTodoSlug}`}
          className="ml-auto text-[13px] font-medium text-primary transition-colors hover:text-primary-dark"
          aria-label={`Ver todos en ${titulo}`}
        >
          Ver todos →
        </Link>
      )}
    </div>
  );
}