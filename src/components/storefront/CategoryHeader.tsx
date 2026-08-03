export function CategoryHeader({
  nombre,
  descripcion,
}: {
  nombre: string;
  descripcion?: string;
}) {
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-fog-white">
        {nombre}
      </h1>
      {descripcion && (
        <p className="mt-3 max-w-prose text-[16px] tracking-[-0.02em] text-fog-white/70">
          {descripcion}
        </p>
      )}
    </div>
  );
}
