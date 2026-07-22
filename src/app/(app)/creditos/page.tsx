"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  CreditFormModal,
  type CreditFormValues,
} from "@/components/credits/CreditFormModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { creditsApi } from "@/services/credits.api";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import type { Credit } from "@/types/models";

function creditToFormValues(credit: Credit): CreditFormValues {
  return {
    name: credit.name,
    bank: credit.bank ?? "",
    currentDebt: String(credit.currentDebt),
    limit: String(credit.limit),
  };
}

function buildCreditPayload(values: CreditFormValues, isEdit: boolean) {
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    limit: Number(values.limit),
  };
  if (values.bank.trim()) payload.bank = values.bank.trim();
  if (!isEdit) payload.currentDebt = Number(values.currentDebt || 0);
  return payload;
}

function CreditsContent() {
  const { items: credits, loading, error, reload } = useAsyncList<Credit>(
    creditsApi.list
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [deletingCredit, setDeletingCredit] = useState<Credit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSubmit = async (values: CreditFormValues) => {
    const payload = buildCreditPayload(values, Boolean(editingCredit));
    if (editingCredit) {
      await creditsApi.update(editingCredit._id, payload);
      toast.success("Tarjeta actualizada correctamente");
    } else {
      await creditsApi.create(payload);
      toast.success("Tarjeta creada correctamente");
    }
    reload();
  };

  const handleDelete = async () => {
    if (!deletingCredit) return;
    setDeleteLoading(true);
    try {
      await creditsApi.remove(deletingCredit._id);
      toast.success("Tarjeta eliminada correctamente");
      setDeletingCredit(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar la tarjeta."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Créditos
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Administra tus tarjetas de crédito y otros créditos personales.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCredit(null);
            setFormOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva tarjeta
        </Button>
      </div>

      <DataTableShell
        loading={loading}
        error={error}
        empty={credits.length === 0}
        emptyMessage="Aún no tienes tarjetas o créditos registrados."
      >
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Tarjeta</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Banco
              </th>
              <th className="px-4 py-3 font-medium">Deuda / Límite</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
            {credits.map((credit) => {
              const usage =
                credit.limit > 0
                  ? Math.min(credit.currentDebt / credit.limit, 1)
                  : 0;
              const usageColor =
                usage >= 0.9
                  ? "bg-red-500"
                  : usage >= 0.7
                    ? "bg-amber-500"
                    : "bg-green-500";

              return (
                <tr key={credit._id}>
                  <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 shrink-0 text-zinc-400" />
                      {credit.name}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                    {credit.bank || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {formatCurrency(credit.currentDebt)} de{" "}
                        {formatCurrency(credit.limit)}
                      </span>
                      <div className="h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.1]">
                        <div
                          className={`h-full rounded-full ${usageColor}`}
                          style={{ width: `${usage * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCredit(credit);
                          setFormOpen(true);
                        }}
                        aria-label="Editar tarjeta"
                        title="Editar"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCredit(credit)}
                        aria-label="Eliminar tarjeta"
                        title="Eliminar"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-600/10 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTableShell>

      <CreditFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={
          editingCredit ? creditToFormValues(editingCredit) : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(deletingCredit)}
        title="Eliminar tarjeta"
        description={`¿Seguro que quieres eliminar "${
          deletingCredit?.name ?? ""
        }"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCredit(null)}
      />
    </div>
  );
}

export default function CreditosPage() {
  return (
    <ProtectedRoute>
      <CreditsContent />
    </ProtectedRoute>
  );
}
