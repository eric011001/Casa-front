export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  unico: "Único",
  suscripcion: "Suscripción",
  prestamo: "Préstamo",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  comida: "Comida",
  transporte: "Transporte",
  renta: "Renta",
  servicios: "Servicios",
  entretenimiento: "Entretenimiento",
  salud: "Salud",
  educacion: "Educación",
  otros: "Otros",
};

export const EXPENSE_CATEGORY_OPTIONS = Object.entries(
  EXPENSE_CATEGORY_LABELS
).map(([value, label]) => ({ value, label }));
