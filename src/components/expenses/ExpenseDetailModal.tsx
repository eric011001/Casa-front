"use client";

import { CreditCard } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import {
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_TYPE_LABELS,
} from "@/lib/expense-labels";
import type { Credit, Expense } from "@/types/models";

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function creatorName(createdBy: Expense["createdBy"]) {
  return typeof createdBy === "string"
    ? createdBy
    : `${createdBy.nombre} ${createdBy.apellido}`;
}

function creditNameOf(creditAccount: Expense["creditAccount"], credits: Credit[]) {
  if (!creditAccount) return null;
  if (typeof creditAccount === "object") return creditAccount.name;
  return credits.find((c) => c._id === creditAccount)?.name ?? "Tarjeta";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-black/[.06] py-2 last:border-0 dark:border-white/[.08]">
      <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-sm text-black dark:text-zinc-50">{children}</span>
    </div>
  );
}

export function ExpenseDetailModal({
  open,
  onClose,
  expense,
  credits,
  scheduledExpenseName,
}: {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
  credits: Credit[];
  scheduledExpenseName?: string | null;
}) {
  if (!expense) return null;

  const CategoryIcon = EXPENSE_CATEGORY_ICONS[expense.category];
  const creditName = creditNameOf(expense.creditAccount, credits);

  return (
    <Modal open={open} onClose={onClose} title={expense.name}>
      <div className="flex flex-col">
        <Row label="Monto">{formatCurrency(expense.amount)}</Row>

        <Row label="Estado">
          {expense.paid ? (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
              Pagado{expense.paidAt ? ` · ${formatDateTime(expense.paidAt)}` : ""}
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              Pendiente
            </span>
          )}
        </Row>

        <Row label="Fecha">{formatDateTime(expense.date)}</Row>

        <Row label="Categoría">
          <span className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            {EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}
          </span>
        </Row>

        <Row label="Tipo">
          {EXPENSE_TYPE_LABELS[expense.type] ?? expense.type}
          {expense.installmentNumber && ` · Cuota ${expense.installmentNumber}`}
        </Row>

        {expense.scheduledExpense && (
          <Row label="Origen">
            Generado automáticamente desde el gasto programado
            {scheduledExpenseName ? ` "${scheduledExpenseName}"` : ""}.
          </Row>
        )}

        {creditName && (
          <Row label="Tarjeta">
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              {creditName}
              {expense.appliedToCredit ? (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Aplicado a la deuda
                </span>
              ) : (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sin aplicar a la deuda
                </span>
              )}
            </span>
          </Row>
        )}

        <Row label="Creado por">{creatorName(expense.createdBy)}</Row>

        <Row label="Registrado el">{formatDateTime(expense.createdAt)}</Row>
      </div>
    </Modal>
  );
}
