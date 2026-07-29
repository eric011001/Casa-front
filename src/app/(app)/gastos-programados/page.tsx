"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Banknote,
  History,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { HouseSelector } from "@/components/houses/HouseSelector";
import {
  ScheduledExpenseFormModal,
  type ScheduledExpenseFormValues,
} from "@/components/scheduled-expenses/ScheduledExpenseFormModal";
import { ScheduledExpenseOccurrencesModal } from "@/components/scheduled-expenses/ScheduledExpenseOccurrencesModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useMyHouses } from "@/hooks/useMyHouses";
import { scheduledExpensesApi } from "@/services/scheduledExpenses.api";
import { creditsApi } from "@/services/credits.api";
import { expensesApi } from "@/services/expenses.api";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import {
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/expense-labels";
import {
  EXPENSE_FREQUENCY_LABELS,
  SCHEDULED_EXPENSE_TYPE_LABELS,
} from "@/lib/scheduled-expense-labels";
import {
  buildScheduledExpensePayload,
  scheduledExpenseToFormValues,
} from "@/lib/scheduled-expense-form";
import type {
  Credit,
  ExpenseFrequency,
  House,
  PeriodResponse,
  ScheduledExpense,
} from "@/types/models";

const MONTHLY_MULTIPLIER: Record<ExpenseFrequency, number> = {
  semanal: 52 / 12,
  quincenal: 2,
  mensual: 1,
};

type NextPayment = { date: string; installmentNumber: number | null };

function addMonthsIso(iso: string, months: number) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1))
    .toISOString()
    .slice(0, 10);
}

function isScheduledExpenseGroup(
  expense: PeriodResponse["expenses"][number]["expense"],
): expense is ScheduledExpense {
  return "frequency" in expense;
}

function buildNextPaymentMap(periods: (PeriodResponse | null)[]) {
  const map = new Map<string, NextPayment>();
  const todayIso = new Date().toISOString().slice(0, 10);
  for (const period of periods) {
    if (!period) continue;
    for (const group of period.expenses) {
      if (!isScheduledExpenseGroup(group.expense)) continue;
      for (const occurrence of group.occurrences) {
        const dateIso = occurrence.date.slice(0, 10);
        if (dateIso < todayIso) continue;
        const existing = map.get(group.expense._id);
        if (!existing || dateIso < existing.date) {
          map.set(group.expense._id, {
            date: dateIso,
            installmentNumber: occurrence.installmentNumber,
          });
        }
      }
    }
  }
  return map;
}

function LoanProgress({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[.08] dark:bg-white/[.1]">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {paid} de {total} cuotas
      </p>
    </div>
  );
}

function ScheduledExpenseCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145] lg:flex-row lg:items-center lg:gap-6">
      <div className="flex items-start gap-3 lg:w-56 lg:shrink-0">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 lg:flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="lg:w-32 lg:shrink-0">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-1.5 h-4 w-20" />
      </div>
      <div className="flex items-center justify-between gap-3 lg:w-auto lg:shrink-0">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

function ScheduledExpenseCard({
  scheduledExpense,
  nextPayment,
  onViewHistory,
  onEdit,
  onToggleActive,
  onPayInAdvance,
  onDelete,
  togglingId,
  payingId,
}: {
  scheduledExpense: ScheduledExpense;
  nextPayment?: NextPayment;
  onViewHistory: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onPayInAdvance: () => void;
  onDelete: () => void;
  togglingId: string | null;
  payingId: string | null;
}) {
  const CategoryIcon = EXPENSE_CATEGORY_ICONS[scheduledExpense.category];
  const categoryLabel =
    EXPENSE_CATEGORY_LABELS[scheduledExpense.category] ??
    scheduledExpense.category;
  const isLoan = scheduledExpense.type === "prestamo";
  const loanFinished =
    isLoan &&
    scheduledExpense.installments != null &&
    scheduledExpense.lastGeneratedIndex >= scheduledExpense.installments;

  const actions: ActionMenuItem[] = [
    { label: "Ver historial", icon: History, onClick: onViewHistory },
    { label: "Editar", icon: Pencil, onClick: onEdit },
    {
      label: "Pagar por adelantado",
      icon: Banknote,
      disabled:
        !scheduledExpense.active ||
        loanFinished ||
        payingId === scheduledExpense._id,
      onClick: onPayInAdvance,
    },
    scheduledExpense.active
      ? {
          label: "Desactivar",
          icon: PowerOff,
          disabled: togglingId === scheduledExpense._id,
          onClick: onToggleActive,
        }
      : {
          label: "Activar",
          icon: Power,
          disabled: togglingId === scheduledExpense._id,
          onClick: onToggleActive,
        },
    { label: "Eliminar", icon: Trash2, danger: true, onClick: onDelete },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145] lg:flex-row lg:items-center lg:gap-6">
      <div className="flex items-start gap-3 lg:w-56 lg:shrink-0">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[.05] text-zinc-600 dark:bg-white/[.08] dark:text-zinc-300">
          <CategoryIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-bold text-black dark:text-zinc-50">
            {scheduledExpense.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {categoryLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 lg:flex-1">
        <p className="font-medium text-black dark:text-zinc-50">
          {formatCurrency(scheduledExpense.amount)}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {SCHEDULED_EXPENSE_TYPE_LABELS[scheduledExpense.type] ??
            scheduledExpense.type}
          {" · "}
          {EXPENSE_FREQUENCY_LABELS[scheduledExpense.frequency]}
          {isLoan && scheduledExpense.installments
            ? ` · ${scheduledExpense.installments} cuotas`
            : ""}
        </p>
        {isLoan && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Inicio:{" "}
            {new Date(scheduledExpense.startDate).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {isLoan && scheduledExpense.installments ? (
        <div className="lg:w-40 lg:shrink-0">
          <LoanProgress
            paid={scheduledExpense.lastGeneratedIndex}
            total={scheduledExpense.installments}
          />
        </div>
      ) : null}

      <div className="lg:w-32 lg:shrink-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Próximo pago</p>
        <p className="text-sm font-medium text-black dark:text-zinc-50">
          {nextPayment
            ? new Date(`${nextPayment.date}T00:00:00.000Z`).toLocaleDateString(
                "es-MX",
                { day: "2-digit", month: "short", timeZone: "UTC" },
              )
            : "—"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 lg:w-auto lg:shrink-0 lg:justify-end">
        {scheduledExpense.active ? (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
            Activo
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            Inactivo
          </span>
        )}
        <ActionMenu items={actions} />
      </div>
    </div>
  );
}

function ScheduledExpensesList({
  houseId,
  filters,
  credits,
}: {
  houseId: string;
  filters: { type: string; active: string };
  credits: Credit[];
}) {
  const apiFilters: Record<string, string> = {};
  if (filters.type) apiFilters.type = filters.type;
  if (filters.active) apiFilters.active = filters.active;

  const {
    items: scheduledExpenses,
    loading,
    error,
    reload,
  } = useAsyncList<ScheduledExpense>(() =>
    scheduledExpensesApi.list(houseId, apiFilters),
  );

  const { data: currentPeriod } = useAsyncData<PeriodResponse>(() =>
    expensesApi.period(houseId, { granularity: "mensual" }),
  );
  const { data: nextPeriod } = useAsyncData<PeriodResponse>(() =>
    expensesApi.period(houseId, {
      granularity: "mensual",
      date: addMonthsIso(new Date().toISOString().slice(0, 10), 1),
    }),
  );
  const nextPaymentByScheduledId = useMemo(
    () => buildNextPaymentMap([currentPeriod, nextPeriod]),
    [currentPeriod, nextPeriod],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ScheduledExpense | null>(
    null,
  );
  const [deletingExpense, setDeletingExpense] =
    useState<ScheduledExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ScheduledExpense | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const activeCount = scheduledExpenses.filter((se) => se.active).length;
  const inactiveCount = scheduledExpenses.length - activeCount;
  const monthlyRecurringCost = scheduledExpenses
    .filter((se) => se.active)
    .reduce((sum, se) => sum + se.amount * MONTHLY_MULTIPLIER[se.frequency], 0);
  const pendingLoanDebt = scheduledExpenses
    .filter((se) => se.type === "prestamo" && se.installments)
    .reduce(
      (sum, se) =>
        sum +
        Math.max(0, (se.installments ?? 0) - se.lastGeneratedIndex) * se.amount,
      0,
    );

  const handleSubmit = async (values: ScheduledExpenseFormValues) => {
    const payload = buildScheduledExpensePayload(
      values,
      Boolean(editingExpense),
    );
    if (editingExpense) {
      await scheduledExpensesApi.update(houseId, editingExpense._id, payload);
      toast.success("Gasto programado actualizado correctamente");
    } else {
      await scheduledExpensesApi.create(houseId, payload);
      toast.success("Gasto programado creado correctamente");
    }
    reload();
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    try {
      await scheduledExpensesApi.remove(houseId, deletingExpense._id);
      toast.success("Gasto programado eliminado correctamente");
      setDeletingExpense(null);
      reload();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "No se pudo eliminar el gasto programado."),
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (scheduledExpense: ScheduledExpense) => {
    setTogglingId(scheduledExpense._id);
    try {
      if (scheduledExpense.active) {
        await scheduledExpensesApi.deactivate(houseId, scheduledExpense._id);
        toast.success(`"${scheduledExpense.name}" desactivado`);
      } else {
        await scheduledExpensesApi.activate(houseId, scheduledExpense._id);
        toast.success(`"${scheduledExpense.name}" activado`);
      }
      reload();
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "No se pudo cambiar el estado del gasto programado.",
        ),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handlePayInAdvance = async (scheduledExpense: ScheduledExpense) => {
    setPayingId(scheduledExpense._id);
    try {
      await scheduledExpensesApi.payNextOccurrence(
        houseId,
        scheduledExpense._id,
      );
      toast.success(`"${scheduledExpense.name}" pagado por adelantado`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo pagar por adelantado."));
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingExpense(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo gasto programado
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Activos"
          value={String(activeCount)}
          tone="green"
          loading={loading}
        />
        <StatCard
          label="Inactivos"
          value={String(inactiveCount)}
          loading={loading}
        />
        <StatCard
          label="Costo recurrente mensual"
          value={formatCurrency(monthlyRecurringCost)}
          loading={loading}
        />
        <StatCard
          label="Deuda pendiente en préstamos"
          value={formatCurrency(pendingLoanDebt)}
          tone="amber"
          loading={loading}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ScheduledExpenseCardSkeleton key={index} />
          ))}
        </div>
      ) : scheduledExpenses.length === 0 ? (
        <p className="rounded-lg border border-black/[.08] px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
          No hay gastos programados registrados con estos filtros.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {scheduledExpenses.map((scheduledExpense) => (
            <ScheduledExpenseCard
              key={scheduledExpense._id}
              scheduledExpense={scheduledExpense}
              nextPayment={nextPaymentByScheduledId.get(scheduledExpense._id)}
              onViewHistory={() => setViewingExpense(scheduledExpense)}
              onEdit={() => {
                setEditingExpense(scheduledExpense);
                setFormOpen(true);
              }}
              onToggleActive={() => handleToggleActive(scheduledExpense)}
              onPayInAdvance={() => handlePayInAdvance(scheduledExpense)}
              onDelete={() => setDeletingExpense(scheduledExpense)}
              togglingId={togglingId}
              payingId={payingId}
            />
          ))}
        </div>
      )}

      <ScheduledExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={
          editingExpense
            ? scheduledExpenseToFormValues(editingExpense)
            : undefined
        }
        credits={credits}
      />

      <ConfirmDialog
        open={Boolean(deletingExpense)}
        title="Eliminar gasto programado"
        description={`¿Seguro que quieres eliminar "${
          deletingExpense?.name ?? ""
        }"? Los gastos ya generados no se eliminarán, pero se dejará de generar nuevos periodos.`}
        confirmLabel="Eliminar"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpense(null)}
      />

      {viewingExpense && (
        <ScheduledExpenseOccurrencesModal
          houseId={houseId}
          scheduledExpense={viewingExpense}
          onClose={() => setViewingExpense(null)}
        />
      )}
    </div>
  );
}

function GastosProgramadosContent() {
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

  const [filters, setFilters] = useState({ type: "", active: "" });

  const handleJoined = (house: House) => {
    reloadHouses();
    selectHouse(house._id);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-10">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Gastos Programados
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Administra las suscripciones, servicios y préstamos recurrentes de las
          casas a las que perteneces.
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
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value }))
              }
              className="w-full rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3] sm:w-auto"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(SCHEDULED_EXPENSE_TYPE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
            <select
              value={filters.active}
              onChange={(e) =>
                setFilters((f) => ({ ...f, active: e.target.value }))
              }
              className="w-full rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3] sm:w-auto"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <ScheduledExpensesList
            key={`${selectedHouse._id}:${filters.type}:${filters.active}`}
            houseId={selectedHouse._id}
            filters={filters}
            credits={credits}
          />
        </>
      )}
    </div>
  );
}

export default function GastosProgramadosPage() {
  return (
    <ProtectedRoute>
      <GastosProgramadosContent />
    </ProtectedRoute>
  );
}
