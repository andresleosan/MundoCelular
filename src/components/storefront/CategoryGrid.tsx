"use client";

import { useState, useEffect } from "react";
import { CategoryCard } from "@/components/storefront/CategoryCard";
import type { Categoria } from "@/types";

interface CategoryGridProps {
  categorias: Categoria[];
}

export function CategoryGrid({ categorias }: CategoryGridProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (categorias.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {categorias.map((c, i) => (
        <CategoryCard key={c.id} categoria={c} index={i} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}