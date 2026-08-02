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
      className="flex items-center gap-2 rounded-chips border border-white/10 bg-white/5 px-2 py-1 transition-colors focus-within:border-glow-cyan"
    >
      <Icon name="search" size={18} className="ml-2 text-slate-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar celulares, accesorios, consolas…"
        aria-label="Buscar productos"
        className="w-full bg-transparent px-2 py-2 text-[14px] text-fog-white outline-none placeholder:text-slate-muted"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="flex h-8 w-8 items-center justify-center rounded-chips bg-glow-cyan text-navy-base transition-all hover:-translate-y-0.5 hover:shadow-sm-2"
      >
        <Icon name="arrow-right" size={16} />
      </button>
    </form>
  );
}