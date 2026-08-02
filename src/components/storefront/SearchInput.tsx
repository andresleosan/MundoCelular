"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function SearchInput() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`); }}
      className="flex items-center gap-2 rounded-pills border border-fog-white/10 bg-fog-white/5 px-3 py-1.5 transition-all duration-200 focus-within:border-glow-cyan/50 focus-within:bg-fog-white/10"
    >
      <Icon name="search" size={18} className="text-fog-white/50" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar celulares, accesorios, consolas…"
        aria-label="Buscar productos"
        className="w-full bg-transparent px-2 py-1.5 text-[14px] text-fog-white outline-none placeholder:text-fog-white/40"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-glow-cyan text-navy-deep transition-all hover:-translate-y-0.5 hover:shadow-cyan-glow"
      >
        <Icon name="arrow-right" size={16} />
      </button>
    </form>
  );
}