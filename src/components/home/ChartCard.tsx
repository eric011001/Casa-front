import { ReactNode } from "react";

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-[#0a0a0a] sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}
