import { Skeleton } from "./Skeleton";

export function StatCard({
  label,
  value,
  tone = "default",
  loading = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "amber";
  loading?: boolean;
}) {
  const toneClass =
    tone === "green"
      ? "text-green-700 dark:text-green-400"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-400"
        : "text-black dark:text-zinc-50";
  return (
    <div className="rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1.5 h-6 w-24" />
      ) : (
        <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
      )}
    </div>
  );
}
