"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { getErrorMessage } from "@/lib/http-error";
import { EXPENSE_CATEGORY_OPTIONS, EXPENSE_TYPE_OPTIONS } from "@/lib/expense-labels";
import type { Credit, ExpenseCategory, ExpenseType } from "@/types/models";

export type ExpenseFormValues = {
  type: ExpenseType;
  name: string;
  amount: string;
  category: ExpenseCategory;
  startDate: string;
  frequency: "semanal" | "mensual" | "";
  installments: string;
  creditAccount: string;
};

const EMPTY_VALUES: ExpenseFormValues = {
  type: "unico",
  name: "",
  amount: "",
  category: "otros",
  startDate: "",
  frequency: "",
  installments: "",
  creditAccount: "",
};

const schema = Yup.object({
  type: Yup.string()
    .oneOf(["unico", "suscripcion", "prestamo"])
    .required("Selecciona un tipo"),
  name: Yup.string().trim().required("El nombre es requerido"),
  amount: Yup.number()
    .typeError("Ingresa un monto válido")
    .positive("Debe ser mayor a 0")
    .required("El monto es requerido"),
  category: Yup.string().required("Selecciona una categoría"),
  startDate: Yup.string().required("La fecha es requerida"),
  frequency: Yup.string().when("type", {
    is: (type: string) => type !== "unico",
    then: (s) =>
      s
        .oneOf(["semanal", "mensual"], "Selecciona una frecuencia")
        .required("Selecciona una frecuencia"),
    otherwise: (s) => s,
  }),
  installments: Yup.number().when("type", {
    is: "prestamo",
    then: (s) =>
      s
        .typeError("Ingresa un número válido")
        .integer("Debe ser un número entero")
        .min(1, "Debe ser al menos 1 cuota")
        .required("El número de cuotas es requerido"),
    otherwise: (s) => s,
  }),
});

export function ExpenseFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  credits,
  creditLocked = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  initialValues?: ExpenseFormValues;
  credits: Credit[];
  creditLocked?: boolean;
}) {
  const isEdit = Boolean(initialValues);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar gasto" : "Nuevo gasto"}
    >
      <Formik
        enableReinitialize
        initialValues={initialValues ?? EMPTY_VALUES}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(getErrorMessage(err, "No se pudo guardar el gasto."));
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values }) => (
          <Form className="flex flex-col gap-4">
            <SelectField label="Tipo" name="type" disabled={isEdit}>
              {EXPENSE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectField>

            <TextField label="Nombre" name="name" type="text" />
            <TextField
              label="Monto"
              name="amount"
              type="number"
              min="0"
              step="0.01"
            />

            <SelectField label="Categoría" name="category">
              {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectField>

            <TextField label="Fecha de inicio" name="startDate" type="date" />

            {values.type !== "unico" && (
              <SelectField label="Frecuencia" name="frequency">
                <option value="">Selecciona una frecuencia</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </SelectField>
            )}

            {values.type === "prestamo" && (
              <TextField
                label="Número de cuotas"
                name="installments"
                type="number"
                min="1"
                step="1"
              />
            )}

            <SelectField
              label="Tarjeta (opcional)"
              name="creditAccount"
              disabled={creditLocked}
            >
              <option value="">Sin tarjeta</option>
              {credits.map((credit) => (
                <option key={credit._id} value={credit._id}>
                  {credit.name}
                  {credit.bank ? ` · ${credit.bank}` : ""}
                </option>
              ))}
            </SelectField>
            {creditLocked && (
              <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Este gasto ya fue aplicado a una tarjeta y no se puede
                reasignar.
              </p>
            )}

            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isEdit ? "Guardar cambios" : "Crear gasto"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
