"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { Modal } from "@/components/ui/Modal";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { scheduledExpensesApi } from "@/services/scheduledExpenses.api";
import { formatCurrency } from "@/lib/format";
import type { Expense, ScheduledExpense } from "@/types/models";

export function ScheduledExpenseOccurrencesModal({
  houseId,
  scheduledExpense,
  onClose,
}: {
  houseId: string;
  scheduledExpense: ScheduledExpense;
  onClose: () => void;
}) {
  const {
    data: occurrences,
    loading,
    error,
  } = useAsyncData<Expense[]>(() =>
    scheduledExpensesApi.occurrences(houseId, scheduledExpense._id)
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={`Historial de "${scheduledExpense.name}"`}
    >
      <DataTableShell
        loading={loading}
        error={error}
        empty={(occurrences?.length ?? 0) === 0}
        emptyMessage="Aún no se ha generado ningún periodo para este gasto programado."
      >
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Cuota</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
            {(occurrences ?? []).map((expense) => (
              <tr key={expense._id}>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {expense.installmentNumber ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {new Date(expense.date).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-4 py-3">
                  {expense.paid ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                      Pagado
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                      Pendiente
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
    </Modal>
  );
}
