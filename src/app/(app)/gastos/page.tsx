"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { HouseSelector } from "@/components/houses/HouseSelector";
import {
  ExpenseFormModal,
  type ExpenseFormValues,
} from "@/components/expenses/ExpenseFormModal";
import { ExpenseDetailModal } from "@/components/expenses/ExpenseDetailModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { useMyHouses } from "@/hooks/useMyHouses";
import { expensesApi } from "@/services/expenses.api";
import { creditsApi } from "@/services/credits.api";
import { scheduledExpensesApi } from "@/services/scheduledExpenses.api";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import {
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_TYPE_LABELS,
} from "@/lib/expense-labels";
import { buildExpensePayload, expenseToFormValues } from "@/lib/expense-form";
import type {
  Credit,
  Expense,
  ExpenseCategory,
  House,
  PeriodResponse,
  ScheduledExpense,
} from "@/types/models";

type Granularity = "semanal" | "quincenal" | "mensual";
type PaidFilter = "" | "true" | "false" | "proyectado";

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "semanal", label: "Semana" },
  { value: "quincenal", label: "Quincena" },
  { value: "mensual", label: "Mes" },
];

type PeriodRow = {
  key: string;
  name: string;
  category: ExpenseCategory;
  type: string;
  amount: number;
  date: string;
  materialized: boolean;
  paid: boolean;
  expense: Expense | null;
};

function buildRows(data: PeriodResponse | null): PeriodRow[] {
  if (!data) return [];
  const rows: PeriodRow[] = [];
  for (const group of data.expenses) {
    for (const occurrence of group.occurrences) {
      const expense = occurrence.materialized ? (group.expense as Expense) : null;
      rows.push({
        key: `${group.expense._id}-${occurrence.installmentNumber ?? "u"}-${occurrence.date}`,
        name: group.expense.name,
        category: group.expense.category,
        type: group.expense.type,
        amount: group.expense.amount,
        date: occurrence.date,
        materialized: occurrence.materialized,
        paid: expense ? expense.paid : false,
        expense,
      });
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

function shiftIsoDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatPeriodLabel(granularity: Granularity, fromIso: string, toIso: string) {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (granularity === "mensual") {
    const label = from.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const fmtShort = (d: Date) =>
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", timeZone: "UTC" });
  const fmtDay = (d: Date) => d.toLocaleDateString("es-MX", { day: "2-digit", timeZone: "UTC" });
  const sameMonth =
    from.getUTCMonth() === to.getUTCMonth() && from.getUTCFullYear() === to.getUTCFullYear();
  return `${sameMonth ? fmtDay(from) : fmtShort(from)} – ${fmtShort(to)}, ${to.getUTCFullYear()}`;
}

function creditIdOf(creditAccount: Expense["creditAccount"]) {
  if (!creditAccount) return null;
  return typeof creditAccount === "string" ? creditAccount : creditAccount._id;
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "amber";
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
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ row }: { row: PeriodRow }) {
  if (!row.materialized) {
    return (
      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        Próximo
      </span>
    );
  }
  if (row.paid) {
    return (
      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
        Pagado
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
      Pendiente
    </span>
  );
}

function CategoryLegend() {
  return (
    <details className="rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
        ¿Qué significa cada ícono de categoría?
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {EXPENSE_CATEGORY_OPTIONS.map((opt) => {
          const Icon = EXPENSE_CATEGORY_ICONS[opt.value as ExpenseCategory];
          return (
            <div
              key={opt.value}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {opt.label}
            </div>
          );
        })}
      </div>
    </details>
  );
}

function ExpensesTable({ houseId, credits }: { houseId: string; credits: Credit[] }) {
  const [granularity, setGranularity] = useState<Granularity>("mensual");
  const [anchorDate, setAnchorDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodData, setPeriodData] = useState<PeriodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cuando cambia houseId/granularity/anchorDate, hay que volver a mostrar el loading y
  // limpiar el error ANTES de que el effect de abajo dispare el fetch. Se hace en el cuerpo
  // del render (patrón "adjusting state when a prop changes") en vez de en el propio effect
  // para no encadenar un setState síncrono dentro de useEffect.
  const periodKey = `${houseId}:${granularity}:${anchorDate}`;
  const [loadedKey, setLoadedKey] = useState(periodKey);
  if (loadedKey !== periodKey) {
    setLoadedKey(periodKey);
    setLoading(true);
    setError("");
  }

  const { items: scheduledExpenses } = useAsyncList<ScheduledExpense>(() =>
    scheduledExpensesApi.list(houseId)
  );
  const scheduledExpenseNameById = useMemo(
    () => new Map(scheduledExpenses.map((se) => [se._id, se.name])),
    [scheduledExpenses]
  );

  const [filters, setFilters] = useState<{ type: string; paid: PaidFilter }>({
    type: "",
    paid: "",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    expensesApi
      .period(houseId, { granularity, date: anchorDate })
      .then((data: PeriodResponse) => {
        if (!cancelled) setPeriodData(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, "No se pudo cargar el periodo."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [houseId, granularity, anchorDate]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return expensesApi
      .period(houseId, { granularity, date: anchorDate })
      .then((data: PeriodResponse) => setPeriodData(data))
      .catch((err: unknown) =>
        setError(getErrorMessage(err, "No se pudo cargar el periodo."))
      )
      .finally(() => setLoading(false));
  }, [houseId, granularity, anchorDate]);

  const rows = useMemo(() => buildRows(periodData), [periodData]);

  const filteredRows = rows.filter((row) => {
    if (filters.type && row.type !== filters.type) return false;
    if (filters.paid === "true" && !row.paid) return false;
    if (filters.paid === "false" && (row.paid || !row.materialized)) return false;
    if (filters.paid === "proyectado" && row.materialized) return false;
    return true;
  });

  const totalPeriod = rows.reduce((sum, r) => sum + r.amount, 0);
  const paidTotal = rows.filter((r) => r.paid).reduce((sum, r) => sum + r.amount, 0);
  const pendingTotal = totalPeriod - paidTotal;
  const projectedCount = rows.filter((r) => !r.materialized).length;

  const goPrev = () => {
    if (!periodData) return;
    setAnchorDate(shiftIsoDate(periodData.period.from.slice(0, 10), -1));
  };
  const goNext = () => {
    if (!periodData) return;
    setAnchorDate(shiftIsoDate(periodData.period.to.slice(0, 10), 1));
  };
  const goToday = () => setAnchorDate(new Date().toISOString().slice(0, 10));

  const handleSubmit = async (values: ExpenseFormValues) => {
    const payload = buildExpensePayload(values, Boolean(editingExpense));
    if (editingExpense) {
      await expensesApi.update(houseId, editingExpense._id, payload);
      toast.success("Gasto actualizado correctamente");
    } else {
      await expensesApi.create(houseId, payload);
      toast.success("Gasto creado correctamente");
    }
    load();
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    try {
      await expensesApi.remove(houseId, deletingExpense._id);
      toast.success("Gasto eliminado correctamente");
      setDeletingExpense(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el gasto."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTogglePaid = async (expense: Expense) => {
    setTogglingId(expense._id);
    try {
      if (expense.paid) {
        await expensesApi.unpay(houseId, expense._id);
        toast.success(`"${expense.name}" marcado como pendiente`);
      } else {
        await expensesApi.pay(houseId, expense._id);
        toast.success(`"${expense.name}" marcado como pagado`);
      }
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo cambiar el estado del gasto."));
    } finally {
      setTogglingId(null);
    }
  };

  const handleApplyToCredit = async (expense: Expense) => {
    const creditId = creditIdOf(expense.creditAccount);
    if (!creditId) return;
    setApplyingId(expense._id);
    try {
      await creditsApi.applyExpense(creditId, expense._id);
      toast.success("Gasto aplicado a la tarjeta correctamente");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo aplicar el gasto a la tarjeta."));
    } finally {
      setApplyingId(null);
    }
  };

  const buildActions = (expense: Expense): ActionMenuItem[] => {
    const creditId = creditIdOf(expense.creditAccount);
    const items: ActionMenuItem[] = [
      { label: "Ver detalle completo", icon: Eye, onClick: () => setDetailExpense(expense) },
      {
        label: "Editar",
        icon: Pencil,
        onClick: () => {
          setEditingExpense(expense);
          setFormOpen(true);
        },
      },
      expense.paid
        ? {
            label: "Marcar como pendiente",
            icon: PowerOff,
            disabled: togglingId === expense._id,
            onClick: () => handleTogglePaid(expense),
          }
        : {
            label: "Marcar como pagado",
            icon: Power,
            disabled: togglingId === expense._id,
            onClick: () => handleTogglePaid(expense),
          },
    ];
    if (creditId && !expense.appliedToCredit) {
      items.push({
        label: "Aplicar a tarjeta",
        icon: CreditCard,
        disabled: applyingId === expense._id,
        onClick: () => handleApplyToCredit(expense),
      });
    }
    items.push({
      label: "Eliminar",
      icon: Trash2,
      danger: true,
      onClick: () => setDeletingExpense(expense),
    });
    return items;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-full bg-black/[.04] p-1 dark:bg-white/[.06]">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGranularity(opt.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                granularity === opt.value
                  ? "bg-foreground text-background"
                  : "text-zinc-600 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.1]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Periodo anterior"
            className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[11rem] text-center text-sm font-medium text-black dark:text-zinc-50">
            {periodData
              ? formatPeriodLabel(granularity, periodData.period.from, periodData.period.to)
              : "…"}
          </span>
          <button
            type="button"
            onClick={goNext}
            aria-label="Periodo siguiente"
            className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Button variant="secondary" onClick={goToday}>
            Hoy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total del periodo" value={formatCurrency(totalPeriod)} />
        <StatCard label="Pagado" value={formatCurrency(paidTotal)} tone="green" />
        <StatCard label="Por pagar" value={formatCurrency(pendingTotal)} tone="amber" />
        <StatCard label="Próximos (sin generar)" value={String(projectedCount)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="w-full rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3] sm:w-auto"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.paid}
            onChange={(e) =>
              setFilters((f) => ({ ...f, paid: e.target.value as PaidFilter }))
            }
            className="w-full rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3] sm:w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="true">Pagados</option>
            <option value="false">Pendientes</option>
            <option value="proyectado">Próximos (sin generar)</option>
          </select>
        </div>

        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingExpense(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo gasto
        </Button>
      </div>

      <DataTableShell
        loading={loading}
        error={error}
        empty={filteredRows.length === 0}
        emptyMessage="No hay gastos en este periodo con estos filtros."
      >
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Gasto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
            {filteredRows.map((row) => {
              const CategoryIcon = EXPENSE_CATEGORY_ICONS[row.category];
              const categoryLabel = EXPENSE_CATEGORY_LABELS[row.category] ?? row.category;
              return (
                <tr key={row.key}>
                  <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                    {row.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      title={categoryLabel}
                      aria-label={categoryLabel}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/[.05] text-zinc-600 dark:bg-white/[.08] dark:text-zinc-300"
                    >
                      <CategoryIcon className="h-4 w-4" />
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {new Date(row.date).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge row={row} />
                  </td>
                  <td className="px-4 py-3">
                    {row.expense ? (
                      <ActionMenu items={buildActions(row.expense)} />
                    ) : (
                      <span className="text-xs text-zinc-400">Automático</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTableShell>

      <CategoryLegend />

      <ExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editingExpense ? expenseToFormValues(editingExpense) : undefined}
        credits={credits}
        creditLocked={Boolean(editingExpense?.appliedToCredit)}
      />

      <ExpenseDetailModal
        open={Boolean(detailExpense)}
        onClose={() => setDetailExpense(null)}
        expense={detailExpense}
        credits={credits}
        scheduledExpenseName={
          detailExpense?.scheduledExpense
            ? scheduledExpenseNameById.get(detailExpense.scheduledExpense) ?? null
            : null
        }
      />

      <ConfirmDialog
        open={Boolean(deletingExpense)}
        title="Eliminar gasto"
        description={`¿Seguro que quieres eliminar "${
          deletingExpense?.name ?? ""
        }"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpense(null)}
      />
    </div>
  );
}

function GastosContent() {
  const {
    houses,
    loading: housesLoading,
    error: housesError,
    reload: reloadHouses,
    selectedHouse,
    selectedId,
    selectHouse,
  } = useMyHouses();

  const { items: credits } = useAsyncList<Credit>(creditsApi.list);

  const handleJoined = (house: House) => {
    reloadHouses();
    selectHouse(house._id);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-10">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Gastos
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Administra los gastos de las casas a las que perteneces, por semana,
          quincena o mes.
        </p>
      </div>

      <HouseSelector
        houses={houses}
        selectedId={selectedId}
        onSelect={selectHouse}
        onJoined={handleJoined}
      />

      {housesLoading ? (
        <LoadingBar />
      ) : housesError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {housesError}
        </p>
      ) : !selectedHouse ? (
        <p className="rounded-lg border border-black/[.08] px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
          Aún no perteneces a ninguna casa. Pide un código de acceso a un
          administrador y únete con el botón de arriba.
        </p>
      ) : (
        <ExpensesTable key={selectedHouse._id} houseId={selectedHouse._id} credits={credits} />
      )}
    </div>
  );
}

export default function GastosPage() {
  return (
    <ProtectedRoute>
      <GastosContent />
    </ProtectedRoute>
  );
}
