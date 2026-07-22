import type { Expense } from "@/types/models";
import type { ExpenseFormValues } from "@/components/expenses/ExpenseFormModal";

export function buildExpensePayload(values: ExpenseFormValues) {
  const payload: Record<string, unknown> = {
    type: values.type,
    name: values.name.trim(),
    amount: Number(values.amount),
    category: values.category,
    startDate: values.startDate,
  };

  if (values.type !== "unico") payload.frequency = values.frequency;
  if (values.type === "prestamo") payload.installments = Number(values.installments);

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
  };
}
