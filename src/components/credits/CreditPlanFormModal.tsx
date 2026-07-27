"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import { CREDIT_PLAN_DURATION_UNIT_OPTIONS } from "@/lib/credit-plan-labels";
import type { CreditPlanDurationUnit } from "@/types/models";

export type CreditPlanFormValues = {
  targetAmount: string;
  durationUnit: CreditPlanDurationUnit | "";
  durationValue: string;
  interestRate: string;
  startDate: string;
};

const EMPTY_VALUES: CreditPlanFormValues = {
  targetAmount: "0",
  durationUnit: "",
  durationValue: "",
  interestRate: "",
  startDate: "",
};

function buildSchema(currentDebt: number) {
  return Yup.object({
    targetAmount: Yup.number()
      .typeError("Ingresa un monto válido")
      .min(0, "No puede ser negativa")
      .test(
        "less-than-debt",
        "Debe ser menor a la deuda actual",
        (value) => value === undefined || value < currentDebt
      ),
    durationUnit: Yup.string()
      .oneOf(["semana", "quincena", "mes", "anio"], "Selecciona una unidad")
      .required("Selecciona una unidad"),
    durationValue: Yup.number()
      .typeError("Ingresa un número válido")
      .integer("Debe ser un número entero")
      .positive("Debe ser mayor a 0")
      .required("La duración es requerida"),
    interestRate: Yup.number()
      .typeError("Ingresa un porcentaje válido")
      .min(0, "No puede ser negativa"),
    startDate: Yup.string(),
  });
}

export function CreditPlanFormModal({
  open,
  onClose,
  onSubmit,
  currentDebt,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreditPlanFormValues) => Promise<void>;
  currentDebt: number;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Nuevo plan de pago">
      <Formik
        enableReinitialize
        initialValues={EMPTY_VALUES}
        validationSchema={buildSchema(currentDebt)}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(
              getErrorMessage(err, "No se pudo crear el plan de pago.")
            );
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Deuda actual:{" "}
              <span className="font-medium">
                {formatCurrency(currentDebt)}
              </span>
            </p>

            <TextField
              label="Meta a alcanzar"
              name="targetAmount"
              type="number"
              min="0"
              step="0.01"
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Número de cuotas"
                name="durationValue"
                type="number"
                min="1"
                step="1"
              />
              <SelectField label="Unidad" name="durationUnit">
                <option value="">Selecciona</option>
                {CREDIT_PLAN_DURATION_UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <TextField
              label="Tasa de interés (opcional, %)"
              name="interestRate"
              type="number"
              min="0"
              step="0.01"
            />

            <TextField
              label="Fecha de inicio (opcional)"
              name="startDate"
              type="date"
            />

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
                Crear plan
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
