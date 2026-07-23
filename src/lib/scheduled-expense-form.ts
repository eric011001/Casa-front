import type { ScheduledExpense } from "@/types/models";
import type { ScheduledExpenseFormValues } from "@/components/scheduled-expenses/ScheduledExpenseFormModal";

export function buildScheduledExpensePayload(
  values: ScheduledExpenseFormValues,
  isEdit = false
) {
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    amount: Number(values.amount),
    category: values.category,
    startDate: values.startDate,
    frequency: values.frequency,
  };

  if (!isEdit) payload.type = values.type;
  if (values.type === "prestamo") {
    payload.installments = Number(values.installments);
  }

  // En creación, un creditAccount vacío simplemente se omite. En edición, hay
  // que enviar explícitamente `null` para que el backend quite la referencia.
  if (values.creditAccount) {
    payload.creditAccount = values.creditAccount;
  } else if (isEdit) {
    payload.creditAccount = null;
  }

  return payload;
}

export function scheduledExpenseToFormValues(
  scheduledExpense: ScheduledExpense
): ScheduledExpenseFormValues {
  return {
    type: scheduledExpense.type,
    name: scheduledExpense.name,
    amount: String(scheduledExpense.amount),
    category: scheduledExpense.category,
    startDate: scheduledExpense.startDate.slice(0, 10),
    frequency: scheduledExpense.frequency,
    installments:
      scheduledExpense.installments !== undefined
        ? String(scheduledExpense.installments)
        : "",
    creditAccount:
      typeof scheduledExpense.creditAccount === "string"
        ? scheduledExpense.creditAccount
        : (scheduledExpense.creditAccount?._id ?? ""),
  };
}
