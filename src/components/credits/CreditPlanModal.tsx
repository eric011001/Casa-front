"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Ban, CheckCircle2, Percent, Plus, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { creditsApi } from "@/services/credits.api";
import { useMyHouses } from "@/hooks/useMyHouses";
import { getErrorMessage, getErrorStatus } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import { CREDIT_PLAN_STATUS_LABELS } from "@/lib/credit-plan-labels";
import {
  CreditPlanFormModal,
  type CreditPlanFormValues,
} from "./CreditPlanFormModal";
import {
  CreditInterestModal,
  type CreditInterestFormValues,
} from "./CreditInterestModal";
import {
  CreditPayInstallmentModal,
  type CreditPayInstallmentFormValues,
} from "./CreditPayInstallmentModal";
import type {
  Credit,
  CreditPaymentPlan,
  CreditPlanInstallment,
} from "@/types/models";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CreditPlanModal({
  credit,
  onClose,
  onCreditChange,
}: {
  credit: Credit;
  onClose: () => void;
  onCreditChange: (credit: Credit) => void;
}) {
  const isOwner = credit.isOwner ?? true;
  const { houses } = useMyHouses();

  const [plan, setPlan] = useState<CreditPaymentPlan | null>(null);
  const [history, setHistory] = useState<CreditPaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [installmentLoading, setInstallmentLoading] = useState<number | null>(
    null
  );
  const [payingInstallment, setPayingInstallment] =
    useState<CreditPlanInstallment | null>(null);

  const fetchPlanAndHistory = useCallback(
    () =>
      Promise.all([
        creditsApi.getPlan(credit._id).catch((err) => {
          if (getErrorStatus(err) === 404) return null;
          throw err;
        }),
        creditsApi.getPlans(credit._id),
      ]),
    [credit._id]
  );

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetchPlanAndHistory()
      .then(([planData, historyData]) => {
        setPlan(planData);
        setHistory(historyData);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, "No se pudo cargar el plan de pago."));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchPlanAndHistory]);

  useEffect(() => {
    let cancelled = false;
    fetchPlanAndHistory()
      .then(([planData, historyData]) => {
        if (cancelled) return;
        setPlan(planData);
        setHistory(historyData);
        setError("");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(err, "No se pudo cargar el plan de pago."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPlanAndHistory]);

  const handleCreatePlan = async (values: CreditPlanFormValues) => {
    const payload: Record<string, unknown> = {
      durationUnit: values.durationUnit,
      durationValue: Number(values.durationValue),
    };
    if (values.targetAmount !== "")
      payload.targetAmount = Number(values.targetAmount);
    if (values.interestRate !== "")
      payload.interestRate = Number(values.interestRate);
    if (values.startDate.trim() !== "") payload.startDate = values.startDate;

    await creditsApi.createPlan(credit._id, payload);
    toast.success("Plan de pago creado correctamente");
    load();
  };

  const handleApplyInterest = async (values: CreditInterestFormValues) => {
    const payload: Record<string, unknown> = {};
    if (values.rate !== "") payload.rate = Number(values.rate);
    if (values.amount !== "") payload.amount = Number(values.amount);

    const result = await creditsApi.applyInterest(credit._id, payload);
    onCreditChange(result.credit);
    setPlan(result.plan);
    toast.success(`Interés de ${formatCurrency(result.interestAmount)} aplicado`);
  };

  const handleCancelPlan = async () => {
    setCancelLoading(true);
    try {
      await creditsApi.cancelPlan(credit._id);
      toast.success("Plan cancelado");
      setCancelOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo cancelar el plan."));
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePayInstallment = async (
    values: CreditPayInstallmentFormValues
  ) => {
    if (!payingInstallment) return;
    const number = payingInstallment.number;
    setInstallmentLoading(number);
    try {
      const options: Record<string, unknown> = {};
      if (values.generateExpense) {
        options.generateExpense = true;
        options.houseId = values.houseId;
        options.category = values.category;
        if (values.name.trim()) options.name = values.name.trim();
      }
      const result = await creditsApi.payInstallment(
        credit._id,
        number,
        options
      );
      onCreditChange(result.credit);
      setPlan(result.plan);
      toast.success(`Cuota ${number} pagada`);
    } finally {
      setInstallmentLoading(null);
    }
  };

  const handleUnpayInstallment = async (number: number) => {
    setInstallmentLoading(number);
    try {
      const result = await creditsApi.unpayInstallment(credit._id, number);
      onCreditChange(result.credit);
      setPlan(result.plan);
      toast.success(`Pago de la cuota ${number} revertido`);
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo revertir el pago."));
    } finally {
      setInstallmentLoading(null);
    }
  };

  return (
    <>
      <Modal open onClose={onClose} title={`Plan de pago · ${credit.name}`}>
        <div className="flex flex-col gap-4">
          <div className="h-1">{loading && <LoadingBar />}</div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {!loading && !error && !plan && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-black/[.08] px-4 py-8 text-center dark:border-white/[.145]">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Esta tarjeta no tiene un plan de pago activo.
              </p>
              {isOwner && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Crear plan de pago
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setInterestOpen(true)}
                  >
                    <Percent className="h-4 w-4" />
                    Aplicar interés
                  </Button>
                </div>
              )}
            </div>
          )}

          {plan && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Meta
                  </p>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {formatCurrency(plan.targetAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Vencimiento
                  </p>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {formatDate(plan.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Estado
                  </p>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {CREDIT_PLAN_STATUS_LABELS[plan.status]}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Interés
                  </p>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {plan.interestRate}%
                  </p>
                </div>
              </div>

              {plan.status === "activo" && isOwner && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setInterestOpen(true)}
                  >
                    <Percent className="h-4 w-4" />
                    Aplicar interés
                  </Button>
                  <Button variant="danger" onClick={() => setCancelOpen(true)}>
                    <Ban className="h-4 w-4" />
                    Cancelar plan
                  </Button>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">Cuota</th>
                      <th className="px-3 py-2 font-medium">Vence</th>
                      <th className="px-3 py-2 font-medium">Monto</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
                    {plan.installments.map((inst) => (
                      <tr key={inst.number}>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {inst.number}
                          {inst.extra ? " (extra)" : ""}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {formatDate(inst.dueDate)}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {formatCurrency(inst.amount)}
                        </td>
                        <td className="px-3 py-2">
                          {inst.paid ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                              Pagada
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {inst.paid ? (
                            <button
                              type="button"
                              onClick={() => handleUnpayInstallment(inst.number)}
                              disabled={installmentLoading === inst.number}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-black/[.06] disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-white/[.08]"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Revertir
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPayingInstallment(inst)}
                              disabled={installmentLoading === inst.number}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-600/10 disabled:opacity-60 dark:text-green-400"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {history.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="self-start text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
              >
                {showHistory ? "Ocultar historial" : "Ver historial de planes"}
              </button>
              {showHistory && (
                <ul className="flex flex-col gap-2 text-sm">
                  {history.map((p) => (
                    <li
                      key={p._id}
                      className="flex items-center justify-between rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {formatDate(p.startDate)} – {formatDate(p.endDate)}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {CREDIT_PLAN_STATUS_LABELS[p.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Modal>

      <CreditPlanFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreatePlan}
        currentDebt={credit.currentDebt}
      />

      <CreditInterestModal
        open={interestOpen}
        onClose={() => setInterestOpen(false)}
        onSubmit={handleApplyInterest}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar plan de pago"
        description='¿Seguro que quieres cancelar este plan? La deuda actual no se modifica.'
        confirmLabel="Cancelar plan"
        danger
        loading={cancelLoading}
        onConfirm={handleCancelPlan}
        onCancel={() => setCancelOpen(false)}
      />

      {payingInstallment && (
        <CreditPayInstallmentModal
          open
          onClose={() => setPayingInstallment(null)}
          onSubmit={handlePayInstallment}
          installmentNumber={payingInstallment.number}
          installmentAmount={payingInstallment.amount}
          houses={houses}
          defaultName={`Pago plan - ${credit.name}`}
        />
      )}
    </>
  );
}
