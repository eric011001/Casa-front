"use client";

import { ReactNode } from "react";
import { LoadingBar } from "./LoadingBar";

export function DataTableShell({
  loading,
  error,
  empty,
  emptyMessage = "No hay registros.",
  children,
}: {
  loading: boolean;
  error?: string;
  empty: boolean;
  emptyMessage?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-1">{loading && <LoadingBar />}</div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : empty && !loading ? (
        <p className="rounded-lg border border-black/[.08] px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
          {children}
        </div>
      )}
    </div>
  );
}
