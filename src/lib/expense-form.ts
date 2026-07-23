import type { Expense } from "@/types/models";
import type { ExpenseFormValues } from "@/components/expenses/ExpenseFormModal";

export function buildExpensePayload(values: ExpenseFormValues, isEdit = false) {
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    amount: Number(values.amount),
    category: values.category,
    date: values.date,
  };

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
    name: expense.name,
    amount: String(expense.amount),
    category: expense.category,
    date: expense.date.slice(0, 10),
    creditAccount:
      typeof expense.creditAccount === "string"
        ? expense.creditAccount
        : (expense.creditAccount?._id ?? ""),
  };
}
