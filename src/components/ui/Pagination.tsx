"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/[.08]"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[6rem] text-center text-sm font-medium text-black dark:text-zinc-50">
        Página {page} de {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Página siguiente"
        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/[.08]"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
