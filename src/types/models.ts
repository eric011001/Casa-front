export type User = {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
};

export type House = {
  _id: string;
  name: string;
  active: boolean;
  code?: string;
  members: (User | string)[];
  createdAt: string;
  updatedAt: string;
};

export type ExpenseType = "unico" | "suscripcion" | "prestamo";
export type ExpenseFrequency = "semanal" | "mensual";
export type ExpenseCategory =
  | "comida"
  | "transporte"
  | "renta"
  | "servicios"
  | "entretenimiento"
  | "salud"
  | "educacion"
  | "otros";

export type Expense = {
  _id: string;
  house: string;
  createdBy: { nombre: string; apellido: string; correo: string } | string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  frequency?: ExpenseFrequency;
  installments?: number;
  startDate: string;
  active: boolean;
  creditAccount?: string | Credit | null;
  appliedToCredit?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Credit = {
  _id: string;
  user: string;
  name: string;
  bank?: string;
  currentDebt: number;
  limit: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseStats = {
  general: {
    totalExpenses: number;
    activeExpenses: number;
    inactiveExpenses: number;
    averageAmount: number;
    highestExpense: { id: string; name: string; amount: number } | null;
  };
  byType: Record<string, { count: number; total: number }>;
  byCategory: Record<string, { count: number; total: number }>;
  byFrequency: Record<string, { count: number; total: number }>;
  monthlyRecurringCost: number;
  loans: {
    count: number;
    totalOutstandingDebt: number;
    details: {
      id: string;
      name: string;
      amount: number;
      installments: number;
      elapsedInstallments: number;
      remainingInstallments: number;
      estimatedRemainingBalance: number;
      settled: boolean;
    }[];
  };
  upcoming30Days: {
    expenseId: string;
    name: string;
    amount: number;
    type: string;
    date: string;
    installmentNumber: number | null;
  }[];
  monthlySeries: { month: string; total: number }[];
  byMember: {
    user: { id: string; nombre: string; apellido: string } | null;
    count: number;
    total: number;
  }[];
};
