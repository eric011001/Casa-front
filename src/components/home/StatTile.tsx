import { Skeleton } from "@/components/ui/Skeleton";

export function StatTile({
  label,
  value,
  hint,
  loading = false,
  showHintSkeleton = false,
}: {
  label: string;
  value?: string;
  hint?: string;
  loading?: boolean;
  showHintSkeleton?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-[#0a0a0a]">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {loading || value === undefined ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <p className="text-2xl font-semibold text-black dark:text-zinc-50">
          {value}
        </p>
      )}
      {hint ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : showHintSkeleton && loading ? (
        <Skeleton className="h-3 w-24" />
      ) : null}
    </div>
  );
}
