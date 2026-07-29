"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { expensesApi } from "@/services/expenses.api";
import { formatCurrency } from "@/lib/format";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { ChartCard } from "./ChartCard";
import type { ExpenseStats } from "@/types/models";

export function UpcomingExpensesList({ houseId }: { houseId: string }) {
  const { data: stats, loading, error } = useAsyncData<ExpenseStats>(() =>
    expensesApi.stats(houseId)
  );

  if (loading) return <LoadingBar />;

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }

  if (!stats) return null;

  return (
    <ChartCard title="Próximos 30 días">
      {stats.upcoming30Days.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No hay gastos próximos en los siguientes 30 días.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {stats.upcoming30Days.slice(0, 8).map((item, index) => (
            <li
              key={`${item.expenseId}-${index}`}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  {item.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(item.date).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {item.installmentNumber
                    ? ` · cuota ${item.installmentNumber}`
                    : ""}
                  {!item.materialized ? " · proyectado" : ""}
                </p>
              </div>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatCurrency(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
