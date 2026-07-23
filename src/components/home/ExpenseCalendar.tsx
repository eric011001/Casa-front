"use client";

import { useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { expensesApi } from "@/services/expenses.api";
import { formatCurrency } from "@/lib/format";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { ChartCard } from "./ChartCard";
import type { Expense, PeriodResponse } from "@/types/models";

type DayStatus = "pagado" | "pendiente" | "proyectado";

type DayItem = {
  key: string;
  name: string;
  amount: number;
  installmentNumber: number | null;
  status: DayStatus;
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_LABELS: Record<DayStatus, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  proyectado: "Proyectado",
};

const STATUS_DOT_CLASSES: Record<DayStatus, string> = {
  pagado: "bg-green-500",
  pendiente: "bg-amber-500",
  proyectado: "bg-zinc-400 dark:bg-zinc-500",
};

const pad = (n: number) => String(n).padStart(2, "0");

function isScheduledExpense(
  expense: PeriodResponse["expenses"][number]["expense"]
): expense is Exclude<PeriodResponse["expenses"][number]["expense"], Expense> {
  return "frequency" in expense;
}

export function ExpenseCalendar({ houseId }: { houseId: string }) {
  const { data, loading, error } = useAsyncData<PeriodResponse>(() =>
    expensesApi.period(houseId, { granularity: "mensual" })
  );

  const calendar = useMemo(() => {
    const reference = data ? new Date(data.period.from) : new Date();
    const year = reference.getUTCFullYear();
    const month = reference.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;

    const itemsByDay = new Map<string, DayItem[]>();
    if (data) {
      for (const group of data.expenses) {
        const scheduled = isScheduledExpense(group.expense);
        for (const occurrence of group.occurrences) {
          const dayKey = occurrence.date.slice(0, 10);
          const status: DayStatus = !occurrence.materialized
            ? "proyectado"
            : !scheduled && (group.expense as Expense).paid
              ? "pagado"
              : "pendiente";
          const list = itemsByDay.get(dayKey) ?? [];
          list.push({
            key: `${group.expense._id}-${occurrence.installmentNumber ?? "u"}-${dayKey}`,
            name: group.expense.name,
            amount: group.expense.amount,
            installmentNumber: occurrence.installmentNumber,
            status,
          });
          itemsByDay.set(dayKey, list);
        }
      }
    }

    const cells: (number | null)[] = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const monthLabel = reference.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    const todayKey = new Date().toISOString().slice(0, 10);

    return { weeks, itemsByDay, monthLabel, todayKey, year, month };
  }, [data]);

  if (loading) return <LoadingBar />;

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }

  const { weeks, itemsByDay, monthLabel, todayKey, year, month } = calendar;

  return (
    <ChartCard
      title="Calendario de gastos"
      subtitle={`${monthLabel[0]?.toUpperCase()}${monthLabel.slice(1)} · realizados y previstos`}
    >
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            if (day === null) {
              return <div key={`empty-${weekIndex}-${dayIndex}`} />;
            }

            const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
            const items = itemsByDay.get(dateKey) ?? [];
            const dayTotal = items.reduce((sum, item) => sum + item.amount, 0);
            const isToday = dateKey === todayKey;
            const dominantStatus: DayStatus | null = items.some(
              (item) => item.status === "pendiente"
            )
              ? "pendiente"
              : items.some((item) => item.status === "proyectado")
                ? "proyectado"
                : items.length
                  ? "pagado"
                  : null;

            return (
              <div
                key={dateKey}
                className={`group relative flex min-h-16 flex-col items-center gap-1 rounded-lg border p-1.5 text-xs ${
                  isToday
                    ? "border-black/30 dark:border-white/40"
                    : "border-black/[.06] dark:border-white/[.08]"
                }`}
              >
                <span
                  className={`font-medium ${
                    isToday
                      ? "text-black dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {day}
                </span>

                {items.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        dominantStatus ? STATUS_DOT_CLASSES[dominantStatus] : ""
                      }`}
                    />
                    {formatCurrency(dayTotal)}
                  </span>
                )}

                {items.length > 0 && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-black/[.08] bg-white p-3 text-left opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 dark:border-white/[.145] dark:bg-[#111]">
                    <p className="mb-2 text-xs font-semibold text-black dark:text-zinc-50">
                      {new Date(Date.UTC(year, month, day)).toLocaleDateString(
                        "es-MX",
                        { day: "2-digit", month: "long", timeZone: "UTC" }
                      )}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {items.map((item) => (
                        <li key={item.key} className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-black dark:text-zinc-50">
                              {item.name}
                            </span>
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES[item.status]}`}
                            />
                            {STATUS_LABELS[item.status]}
                            {item.installmentNumber
                              ? ` · cuota ${item.installmentNumber}`
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </ChartCard>
  );
}
