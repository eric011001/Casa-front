import type { Expense } from "@/types/models";
import type { ExpenseFormValues } from "@/components/expenses/ExpenseFormModal";

export function buildExpensePayload(values: ExpenseFormValues, isEdit = false) {
  const payload: Record<string, unknown> = {
    type: values.type,
    name: values.name.trim(),
    amount: Number(values.amount),
    category: values.category,
    startDate: values.startDate,
  };

  if (values.type !== "unico") payload.frequency = values.frequency;
  if (values.type === "prestamo") payload.installments = Number(values.installments);

  // En creación, un creditAccount vacío simplemente se omite. En edición, hay
  // que enviar explícitamente `null` para que el backend quite la referencia.
  if (values.creditAccount) {
    payload.creditAccount = values.creditAccount;
  } else if (isEdit) {
    payload.creditAccount = null;
  }

  return payload;
}

export function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    type: expense.type,
    name: expense.name,
    amount: String(expense.amount),
    category: expense.category,
    startDate: expense.startDate.slice(0, 10),
    frequency: expense.frequency ?? "",
    installments:
      expense.installments !== undefined ? String(expense.installments) : "",
    creditAccount:
      typeof expense.creditAccount === "string"
        ? expense.creditAccount
        : (expense.creditAccount?._id ?? ""),
  };
}
