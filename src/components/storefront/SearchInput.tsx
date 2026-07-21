"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchInput() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`); }}
      className="flex items-center gap-2 rounded-chips border border-faint-border bg-pure-white px-2 py-1"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar celulares, accesorios, consolas…"
        aria-label="Buscar productos"
        className="w-full bg-transparent px-3 py-2 text-[16px] text-ink-navy outline-none placeholder:text-steel-blue-gray"
      />
      <button type="submit" aria-label="Buscar" className="flex h-8 w-8 items-center justify-center rounded-chips bg-mundo-blue text-pure-white shadow-lg-2">
        →
      </button>
    </form>
  );
}
