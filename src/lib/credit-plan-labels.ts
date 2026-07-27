export const CREDIT_PLAN_DURATION_UNIT_LABELS: Record<string, string> = {
  semana: "Semanas",
  quincena: "Quincenas",
  mes: "Meses",
  anio: "Años",
};

export const CREDIT_PLAN_DURATION_UNIT_OPTIONS = Object.entries(
  CREDIT_PLAN_DURATION_UNIT_LABELS
).map(([value, label]) => ({ value, label }));

export const CREDIT_PLAN_STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  liquidado: "Liquidado",
  cancelado: "Cancelado",
};

export const DEBT_HISTORY_TYPE_LABELS: Record<string, string> = {
  inicial: "Carga inicial",
  gasto: "Gasto aplicado",
  interes: "Interés",
  pago_plan: "Pago de plan",
  reversion_pago: "Reversión de pago",
};
