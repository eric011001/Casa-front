"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { expensesApi } from "@/services/expenses.api";
import { formatCurrency } from "@/lib/format";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { StatTile } from "./StatTile";
import type { ExpenseStats } from "@/types/models";

export function StatCards({ houseId }: { houseId: string }) {
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1">
      <StatTile
        label="Gastos pendientes"
        value={String(stats.general.pendingExpenses)}
        hint={`${stats.general.totalExpenses} en total`}
      />
      <StatTile
        label="Monto promedio"
        value={formatCurrency(stats.general.averageAmount)}
      />
      <StatTile
        label="Costo recurrente mensual"
        value={formatCurrency(stats.monthlyRecurringCost)}
        hint="Suscripciones y préstamos activos"
      />
      <StatTile
        label="Deuda de préstamos"
        value={formatCurrency(stats.loans.totalOutstandingDebt)}
        hint={`${stats.loans.count} préstamo${
          stats.loans.count === 1 ? "" : "s"
        }`}
      />
      <StatTile
        label="Gastos programados"
        value={String(stats.scheduled.active)}
        hint={`${stats.scheduled.total} en total`}
      />
    </div>
  );
}
