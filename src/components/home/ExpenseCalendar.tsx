"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { expensesApi } from "@/services/expenses.api";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "./ChartCard";
import type { Expense, PeriodResponse } from "@/types/models";

function shiftIsoDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type DayStatus = "pagado" | "pendiente" | "no_pagado" | "proyectado";

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
  no_pagado: "No pagado",
  proyectado: "Proyectado",
};

const STATUS_DOT_CLASSES: Record<DayStatus, string> = {
  pagado: "bg-green-500",
  pendiente: "bg-amber-500",
  no_pagado: "bg-red-500",
  proyectado: "bg-zinc-400 dark:bg-zinc-500",
};

const pad = (n: number) => String(n).padStart(2, "0");

function isScheduledExpense(
  expense: PeriodResponse["expenses"][number]["expense"],
): expense is Exclude<PeriodResponse["expenses"][number]["expense"], Expense> {
  return "frequency" in expense;
}

export function ExpenseCalendar({ houseId }: { houseId: string }) {
  const [anchorDate, setAnchorDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [data, setData] = useState<PeriodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cuando cambia houseId/anchorDate, hay que volver a mostrar el loading y limpiar el
  // error ANTES de que el effect de abajo dispare el fetch. Se hace en el cuerpo del
  // render (patrón "adjusting state when a prop changes") en vez de en el propio effect
  // para no encadenar un setState síncrono dentro de useEffect.
  const anchorKey = `${houseId}:${anchorDate}`;
  const [loadedKey, setLoadedKey] = useState(anchorKey);
  if (loadedKey !== anchorKey) {
    setLoadedKey(anchorKey);
    setLoading(true);
    setError("");
  }

  useEffect(() => {
    let cancelled = false;
    expensesApi
      .period(houseId, { granularity: "mensual", date: anchorDate })
      .then((result: PeriodResponse) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(getErrorMessage(err, "No se pudo cargar el calendario."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [houseId, anchorDate]);

  const goPrev = () => {
    if (!data) return;
    setAnchorDate(shiftIsoDate(data.period.from.slice(0, 10), -1));
  };
  const goNext = () => {
    if (!data) return;
    setAnchorDate(shiftIsoDate(data.period.to.slice(0, 10), 1));
  };
  const goToday = () => setAnchorDate(new Date().toISOString().slice(0, 10));

  const calendar = useMemo(() => {
    // El marco del mes (días, encabezado) se deriva de anchorDate para que se muestre de
    // inmediato al cambiar de mes; los gastos (itemsByDay) llegan después con el fetch. Si
    // `data` todavía corresponde al mes anterior, sus fechas no calzan con las dateKey de
    // este mes y simplemente no se muestran, sin necesidad de limpiar `data` explícitamente.
    const reference = new Date(`${anchorDate}T00:00:00.000Z`);
    const year = reference.getUTCFullYear();
    const month = reference.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const firstWeekday =
      (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;

    const itemsByDay = new Map<string, DayItem[]>();
    if (data) {
      for (const group of data.expenses) {
        const scheduled = isScheduledExpense(group.expense);
        for (const occurrence of group.occurrences) {
          const dayKey = occurrence.date.slice(0, 10);
          const status: DayStatus = !occurrence.materialized
            ? "proyectado"
            : scheduled
              ? "pendiente"
              : (group.expense as Expense).failed
                ? "no_pagado"
                : (group.expense as Expense).paid
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
  }, [anchorDate, data]);

  const { weeks, itemsByDay, monthLabel, todayKey, year, month } = calendar;

  return (
    <ChartCard
      title="Calendario de gastos"
      subtitle={`${monthLabel[0]?.toUpperCase()}${monthLabel.slice(1)} · realizados y previstos`}
      headerRight={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Mes anterior"
            className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Mes siguiente"
            className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={goToday}
          >
            Hoy
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : (
        <div className="relative">
          <div
            className={
              loading
                ? "pointer-events-none opacity-40 transition-opacity"
                : "transition-opacity"
            }
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
                  const dayTotal = items.reduce(
                    (sum, item) => sum + item.amount,
                    0,
                  );
                  const isToday = dateKey === todayKey;
                  const dominantStatus: DayStatus | null = items.some(
                    (item) => item.status === "no_pagado",
                  )
                    ? "no_pagado"
                    : items.some((item) => item.status === "pendiente")
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
                              dominantStatus
                                ? STATUS_DOT_CLASSES[dominantStatus]
                                : ""
                            }`}
                          />
                          {formatCurrency(dayTotal)}
                        </span>
                      )}

                      {items.length > 0 && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-black/[.08] bg-white p-3 text-left opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 dark:border-white/[.145] dark:bg-[#111]">
                          <p className="mb-2 text-xs font-semibold text-black dark:text-zinc-50">
                            {new Date(
                              Date.UTC(year, month, day),
                            ).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "long",
                              timeZone: "UTC",
                            })}
                          </p>
                          <ul className="flex flex-col gap-2">
                            {items.map((item) => (
                              <li
                                key={item.key}
                                className="flex flex-col gap-0.5"
                              >
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
                }),
              )}
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500 dark:text-zinc-400" />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Cargando…
              </span>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}
