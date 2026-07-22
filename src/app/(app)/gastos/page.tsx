"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
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
  ExpenseFormModal,
  type ExpenseFormValues,
} from "@/components/expenses/ExpenseFormModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { useMyHouses } from "@/hooks/useMyHouses";
import { expensesApi } from "@/services/expenses.api";
import { creditsApi } from "@/services/credits.api";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_FREQUENCY_LABELS,
  EXPENSE_TYPE_LABELS,
} from "@/lib/expense-labels";
import { buildExpensePayload, expenseToFormValues } from "@/lib/expense-form";
import type { Credit, Expense, House } from "@/types/models";

function creditIdOf(creditAccount: Expense["creditAccount"]) {
  if (!creditAccount) return null;
  return typeof creditAccount === "string" ? creditAccount : creditAccount._id;
}

function creditNameOf(creditAccount: Expense["creditAccount"], credits: Credit[]) {
  const id = creditIdOf(creditAccount);
  if (!id) return null;
  if (typeof creditAccount === "object" && creditAccount) return creditAccount.name;
  return credits.find((c) => c._id === id)?.name ?? "Tarjeta";
}

function creatorName(createdBy: Expense["createdBy"]) {
  return typeof createdBy === "string"
    ? createdBy
    : `${createdBy.nombre} ${createdBy.apellido}`;
}

function ExpensesTable({
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

  const { items: expenses, loading, error, reload } = useAsyncList<Expense>(
    () => expensesApi.list(houseId, apiFilters)
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleSubmit = async (values: ExpenseFormValues) => {
    const payload = buildExpensePayload(values, Boolean(editingExpense));
    if (editingExpense) {
      await expensesApi.update(houseId, editingExpense._id, payload);
      toast.success("Gasto actualizado correctamente");
    } else {
      await expensesApi.create(houseId, payload);
      toast.success("Gasto creado correctamente");
    }
    reload();
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    try {
      await expensesApi.remove(houseId, deletingExpense._id);
      toast.success("Gasto eliminado correctamente");
      setDeletingExpense(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el gasto."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (expense: Expense) => {
    setTogglingId(expense._id);
    try {
      if (expense.active) {
        await expensesApi.deactivate(houseId, expense._id);
        toast.success(`"${expense.name}" desactivado`);
      } else {
        await expensesApi.activate(houseId, expense._id);
        toast.success(`"${expense.name}" activado`);
      }
      reload();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "No se pudo cambiar el estado del gasto.")
      );
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
      reload();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "No se pudo aplicar el gasto a la tarjeta.")
      );
    } finally {
      setApplyingId(null);
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
          Nuevo gasto
        </Button>
      </div>

      <DataTableShell
        loading={loading}
        error={error}
        empty={expenses.length === 0}
        emptyMessage="No hay gastos registrados con estos filtros."
      >
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Gasto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
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
            {expenses.map((expense) => (
              <tr key={expense._id}>
                <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                  {expense.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-4 py-3">
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {EXPENSE_TYPE_LABELS[expense.type] ?? expense.type}
                  </p>
                  {expense.type !== "unico" && expense.frequency && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {EXPENSE_FREQUENCY_LABELS[expense.frequency]}
                      {expense.type === "prestamo"
                        ? ` · ${expense.installments} cuotas`
                        : ""}
                    </p>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 md:table-cell">
                  {creatorName(expense.createdBy)}
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {expense.creditAccount ? (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {creditNameOf(expense.creditAccount, credits)}
                      </span>
                      {expense.appliedToCredit ? (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Aplicado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyToCredit(expense)}
                          disabled={applyingId === expense._id}
                          className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-black/[.1] disabled:opacity-50 dark:bg-white/[.08] dark:text-zinc-300"
                        >
                          Aplicar
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {expense.type === "unico" ? (
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      Registrado
                    </span>
                  ) : expense.active ? (
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
                      onClick={() => {
                        setEditingExpense(expense);
                        setFormOpen(true);
                      }}
                      aria-label="Editar gasto"
                      title="Editar"
                      className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {expense.type !== "unico" && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(expense)}
                        disabled={togglingId === expense._id}
                        aria-label={
                          expense.active ? "Desactivar gasto" : "Activar gasto"
                        }
                        title={expense.active ? "Desactivar" : "Activar"}
                        className={`rounded-lg p-2 disabled:opacity-50 ${
                          expense.active
                            ? "text-amber-600 hover:bg-amber-600/10 dark:text-amber-400"
                            : "text-green-600 hover:bg-green-600/10 dark:text-green-400"
                        }`}
                      >
                        {expense.active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingExpense(expense)}
                      aria-label="Eliminar gasto"
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

      <ExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={
          editingExpense ? expenseToFormValues(editingExpense) : undefined
        }
        credits={credits}
        creditLocked={Boolean(editingExpense?.appliedToCredit)}
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

  const [filters, setFilters] = useState({ type: "", active: "" });

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
          Administra los gastos de las casas a las que perteneces.
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
              {Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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

          <ExpensesTable
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

export default function GastosPage() {
  return (
    <ProtectedRoute>
      <GastosContent />
    </ProtectedRoute>
  );
}
