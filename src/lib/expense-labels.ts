import {
  Car,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Home,
  Package,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ExpenseCategory } from "@/types/models";

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  unico: "Único",
  suscripcion: "Suscripción",
  prestamo: "Préstamo",
  servicio: "Servicio",
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

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  comida: UtensilsCrossed,
  transporte: Car,
  renta: Home,
  servicios: Zap,
  entretenimiento: Clapperboard,
  salud: HeartPulse,
  educacion: GraduationCap,
  otros: Package,
};
