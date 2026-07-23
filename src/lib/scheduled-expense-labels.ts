export const SCHEDULED_EXPENSE_TYPE_LABELS: Record<string, string> = {
  suscripcion: "Suscripción",
  prestamo: "Préstamo",
  servicio: "Servicio",
};

export const EXPENSE_FREQUENCY_LABELS: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export const SCHEDULED_EXPENSE_TYPE_OPTIONS = Object.entries(
  SCHEDULED_EXPENSE_TYPE_LABELS
).map(([value, label]) => ({ value, label }));
