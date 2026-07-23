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

export type ExpenseType = "unico" | "suscripcion" | "prestamo" | "servicio";
export type ScheduledExpenseType = "suscripcion" | "prestamo" | "servicio";
export type ExpenseFrequency = "semanal" | "quincenal" | "mensual";
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
  date: string;
  scheduledExpense: string | null;
  installmentNumber: number | null;
  paid: boolean;
  paidAt: string | null;
  creditAccount?: string | Credit | null;
  appliedToCredit?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledExpense = {
  _id: string;
  house: string;
  createdBy: { nombre: string; apellido: string; correo: string } | string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  type: ScheduledExpenseType;
  frequency: ExpenseFrequency;
  installments?: number;
  startDate: string;
  active: boolean;
  creditAccount?: string | Credit | null;
  lastGeneratedIndex: number;
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
    paidExpenses: number;
    pendingExpenses: number;
    averageAmount: number;
    highestExpense: { id: string; name: string; amount: number } | null;
  };
  byType: Record<string, { count: number; total: number }>;
  byCategory: Record<string, { count: number; total: number }>;
  scheduled: {
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, { count: number; total: number }>;
  };
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
      paidInstallments: number;
      pendingInstallments: number;
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
    materialized: boolean;
  }[];
  monthlySeries: { month: string; total: number }[];
  byMember: {
    user: { id: string; nombre: string; apellido: string } | null;
    count: number;
    total: number;
  }[];
};
