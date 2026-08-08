"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getErrorMessage } from "@/lib/http-error";

export type CreditAdjustDebtFormValues = {
  delta: string;
  reason: string;
};

const EMPTY_VALUES: CreditAdjustDebtFormValues = { delta: "", reason: "" };

const schema = Yup.object({
  delta: Yup.number()
    .typeError("Ingresa un monto válido")
    .notOneOf([0], "El ajuste no puede ser 0")
    .required("El monto es requerido"),
  reason: Yup.string(),
});

export function CreditAdjustDebtModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreditAdjustDebtFormValues) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Ajustar deuda manualmente">
      <Formik
        initialValues={EMPTY_VALUES}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(getErrorMessage(err, "No se pudo ajustar la deuda."));
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Usa un monto positivo para subir la deuda (ej. una disposición
              adicional) o negativo para bajarla (ej. una corrección).
            </p>

            <TextField
              label="Monto del ajuste"
              name="delta"
              type="number"
              step="0.01"
            />
            <TextField label="Motivo (opcional)" name="reason" type="text" />

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
                Ajustar deuda
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
