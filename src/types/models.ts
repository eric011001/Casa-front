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
  failed: boolean;
  failedAt: string | null;
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

export type DebtHistoryType =
  | "inicial"
  | "gasto"
  | "interes"
  | "pago_plan"
  | "reversion_pago";

export type DebtHistoryEntry = {
  date: string;
  type: DebtHistoryType;
  amount: number;
  balanceAfter: number;
  expense: string | null;
  plan: string | null;
};

export type Credit = {
  _id: string;
  user: string;
  name: string;
  bank?: string;
  currentDebt: number;
  limit: number;
  active: boolean;
  debtHistory: DebtHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type CreditPlanDurationUnit = "semana" | "quincena" | "mes" | "anio";
export type CreditPlanStatus = "activo" | "liquidado" | "cancelado";

export type CreditPlanInstallment = {
  number: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidAt: string | null;
  extra: boolean;
};

export type CreditPaymentPlan = {
  _id: string;
  credit: string;
  user: string;
  targetAmount: number;
  initialDebt: number;
  interestRate: number;
  durationUnit: CreditPlanDurationUnit;
  durationValue: number;
  frequency: ExpenseFrequency;
  totalInstallments: number;
  startDate: string;
  endDate: string;
  status: CreditPlanStatus;
  installments: CreditPlanInstallment[];
  createdAt: string;
  updatedAt: string;
};

export type CreditStats = {
  general: {
    totalDebt: number;
    totalLimit: number;
    activeCredits: number;
    availableCredit: number;
    overallUtilizationRate: number;
    highestDebtCard: { id: string; name: string; currentDebt: number } | null;
  };
  byCard: {
    id: string;
    name: string;
    bank?: string;
    currentDebt: number;
    limit: number;
    utilizationRate: number;
    netChange30Days: number;
    trend: "subiendo" | "bajando" | "estable";
    plan: {
      id: string;
      targetAmount: number;
      progressPercent: number;
      expectedPercent: number;
      onTrack: boolean;
      remainingToPay: number;
      remainingInstallments: number;
    } | null;
  }[];
  monthlySeries: { month: string; total: number }[];
  movementsLast30Days: Record<
    DebtHistoryType,
    { count: number; total: number }
  >;
  plans: {
    active: number;
    onTrack: number;
    behind: number;
    totalPaidViaPlans: number;
  };
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
    balanceSeries: { month: string; totalOutstandingDebt: number }[];
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

export type PeriodOccurrence = {
  date: string;
  installmentNumber: number | null;
  materialized: boolean;
};

export type PeriodExpenseGroup = {
  expense: Expense | ScheduledExpense;
  occurrences: PeriodOccurrence[];
};

export type PeriodResponse = {
  period: { from: string; to: string };
  total: number;
  expenses: PeriodExpenseGroup[];
};

export type ShoppingListItemStatus = "pendiente" | "en_carrito" | "comprado";
export type ShoppingSessionStatus = "activa" | "cerrada" | "cancelada";

export type ShoppingListItem = {
  _id: string;
  house: string;
  createdBy: { nombre: string; apellido: string; correo: string } | string;
  name: string;
  normalizedName: string;
  quantity: number;
  precio?: number;
  status: ShoppingListItemStatus;
  session:
    | string
    | { _id: string; name: string; status: ShoppingSessionStatus }
    | null;
  boughtAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingListAutocompleteResult = {
  name: string;
  count: number;
  precio?: number;
};

export type ShoppingSession = {
  _id: string;
  house: string;
  createdBy: { nombre: string; apellido: string; correo: string } | string;
  name: string;
  status: ShoppingSessionStatus;
  expense: string | Expense | null;
  closedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingSessionDetail = ShoppingSession & {
  items: ShoppingListItem[];
};

export type ShoppingSessionCloseResult = {
  session: ShoppingSession;
  expense: Expense;
};
