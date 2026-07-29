export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-black/[.08] dark:bg-white/[.1] ${className}`}
    />
  );
}
