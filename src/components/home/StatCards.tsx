"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { expensesApi } from "@/services/expenses.api";
import { formatCurrency } from "@/lib/format";
import { StatTile } from "./StatTile";
import type { ExpenseStats } from "@/types/models";

export function StatCards({ houseId }: { houseId: string }) {
  const { data: stats, loading, error } = useAsyncData<ExpenseStats>(() =>
    expensesApi.stats(houseId)
  );

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1">
      <StatTile
        label="Gastos pendientes"
        value={stats ? String(stats.general.pendingExpenses) : undefined}
        hint={stats ? `${stats.general.totalExpenses} en total` : undefined}
        loading={loading}
        showHintSkeleton
      />
      <StatTile
        label="Monto promedio"
        value={stats ? formatCurrency(stats.general.averageAmount) : undefined}
        loading={loading}
      />
      <StatTile
        label="Costo recurrente mensual"
        value={
          stats ? formatCurrency(stats.monthlyRecurringCost) : undefined
        }
        hint="Suscripciones y préstamos activos"
        loading={loading}
      />
      <StatTile
        label="Deuda de préstamos"
        value={
          stats ? formatCurrency(stats.loans.totalOutstandingDebt) : undefined
        }
        hint={
          stats
            ? `${stats.loans.count} préstamo${stats.loans.count === 1 ? "" : "s"}`
            : undefined
        }
        loading={loading}
        showHintSkeleton
      />
      <StatTile
        label="Gastos programados"
        value={stats ? String(stats.scheduled.active) : undefined}
        hint={stats ? `${stats.scheduled.total} en total` : undefined}
        loading={loading}
        showHintSkeleton
      />
    </div>
  );
}
