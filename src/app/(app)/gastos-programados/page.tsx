"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  History,
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
import { HouseSelector } from "@/components/houses/HouseSelector";
import {
  ScheduledExpenseFormModal,
  type ScheduledExpenseFormValues,
} from "@/components/scheduled-expenses/ScheduledExpenseFormModal";
import { ScheduledExpenseOccurrencesModal } from "@/components/scheduled-expenses/ScheduledExpenseOccurrencesModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { useMyHouses } from "@/hooks/useMyHouses";
import { scheduledExpensesApi } from "@/services/scheduledExpenses.api";
import { creditsApi } from "@/services/credits.api";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/expense-labels";
import {
  EXPENSE_FREQUENCY_LABELS,
  SCHEDULED_EXPENSE_TYPE_LABELS,
} from "@/lib/scheduled-expense-labels";
import {
  buildScheduledExpensePayload,
  scheduledExpenseToFormValues,
} from "@/lib/scheduled-expense-form";
import type { Credit, House, ScheduledExpense } from "@/types/models";

function creditIdOf(creditAccount: ScheduledExpense["creditAccount"]) {
  if (!creditAccount) return null;
  return typeof creditAccount === "string" ? creditAccount : creditAccount._id;
}

function creditNameOf(
  creditAccount: ScheduledExpense["creditAccount"],
  credits: Credit[]
) {
  const id = creditIdOf(creditAccount);
  if (!id) return null;
  if (typeof creditAccount === "object" && creditAccount) return creditAccount.name;
  return credits.find((c) => c._id === id)?.name ?? "Tarjeta";
}

function creatorName(createdBy: ScheduledExpense["createdBy"]) {
  return typeof createdBy === "string"
    ? createdBy
    : `${createdBy.nombre} ${createdBy.apellido}`;
}

function ScheduledExpensesTable({
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
    scheduledExpensesApi.list(houseId, apiFilters)
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ScheduledExpense | null>(
    null
  );
  const [deletingExpense, setDeletingExpense] = useState<ScheduledExpense | null>(
    null
  );
  const [viewingExpense, setViewingExpense] = useState<ScheduledExpense | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleSubmit = async (values: ScheduledExpenseFormValues) => {
    const payload = buildScheduledExpensePayload(
      values,
      Boolean(editingExpense)
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
        getErrorMessage(err, "No se pudo eliminar el gasto programado.")
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
        getErrorMessage(err, "No se pudo cambiar el estado del gasto programado.")
      );
    } finally {
      setTogglingId(null);
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

      <DataTableShell
        loading={loading}
        error={error}
        empty={scheduledExpenses.length === 0}
        emptyMessage="No hay gastos programados registrados con estos filtros."
      >
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Inicio
              </th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                Creado por
              </th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">
                Tarjeta
              </th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
            {scheduledExpenses.map((scheduledExpense) => (
              <tr key={scheduledExpense._id}>
                <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                  {scheduledExpense.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {EXPENSE_CATEGORY_LABELS[scheduledExpense.category] ??
                    scheduledExpense.category}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(scheduledExpense.amount)}
                </td>
                <td className="px-4 py-3">
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {SCHEDULED_EXPENSE_TYPE_LABELS[scheduledExpense.type] ??
                      scheduledExpense.type}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {EXPENSE_FREQUENCY_LABELS[scheduledExpense.frequency]}
                    {scheduledExpense.type === "prestamo"
                      ? ` · ${scheduledExpense.installments} cuotas`
                      : ""}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                  {new Date(scheduledExpense.startDate).toLocaleDateString(
                    "es-MX",
                    { day: "2-digit", month: "short", year: "numeric" }
                  )}
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 md:table-cell">
                  {creatorName(scheduledExpense.createdBy)}
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {scheduledExpense.creditAccount ? (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {creditNameOf(scheduledExpense.creditAccount, credits)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {scheduledExpense.active ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                      Activo
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingExpense(scheduledExpense)}
                      aria-label="Ver historial"
                      title="Ver historial"
                      className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpense(scheduledExpense);
                        setFormOpen(true);
                      }}
                      aria-label="Editar gasto programado"
                      title="Editar"
                      className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(scheduledExpense)}
                      disabled={togglingId === scheduledExpense._id}
                      aria-label={
                        scheduledExpense.active ? "Desactivar" : "Activar"
                      }
                      title={scheduledExpense.active ? "Desactivar" : "Activar"}
                      className={`rounded-lg p-2 disabled:opacity-50 ${
                        scheduledExpense.active
                          ? "text-amber-600 hover:bg-amber-600/10 dark:text-amber-400"
                          : "text-green-600 hover:bg-green-600/10 dark:text-green-400"
                      }`}
                    >
                      {scheduledExpense.active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingExpense(scheduledExpense)}
                      aria-label="Eliminar gasto programado"
                      title="Eliminar"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-600/10 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>

      <ScheduledExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={
          editingExpense ? scheduledExpenseToFormValues(editingExpense) : undefined
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
          Administra las suscripciones y préstamos recurrentes de las casas a
          las que perteneces.
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
                )
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

          <ScheduledExpensesTable
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
