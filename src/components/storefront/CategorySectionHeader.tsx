import Link from "next/link";

export function CategorySectionHeader({ titulo, verTodoSlug }: { titulo: string; verTodoSlug?: string }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-ink-navy">{titulo}</h2>
      {verTodoSlug && (
        <Link href={`/${verTodoSlug}`} className="ml-auto text-[12px] text-mundo-blue" aria-label={`Ver todos en ${titulo}`}>
          Ver todos →
        </Link>
      )}
    </div>
  );
}
