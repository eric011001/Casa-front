"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getErrorMessage } from "@/lib/http-error";

export type CreditInterestFormValues = {
  rate: string;
  amount: string;
};

const EMPTY_VALUES: CreditInterestFormValues = { rate: "", amount: "" };

const schema = Yup.object({
  rate: Yup.number().typeError("Ingresa un porcentaje válido").min(0),
  amount: Yup.number().typeError("Ingresa un monto válido").positive(),
});

export function CreditInterestModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreditInterestFormValues) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Aplicar interés">
      <Formik
        initialValues={EMPTY_VALUES}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(
              getErrorMessage(err, "No se pudo aplicar el interés.")
            );
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Indica una tasa (% sobre la deuda actual) o un monto fijo. Si
              das ambos, se usa el monto.
            </p>

            <TextField
              label="Tasa (%, opcional)"
              name="rate"
              type="number"
              min="0"
              step="0.01"
            />
            <TextField
              label="Monto fijo (opcional)"
              name="amount"
              type="number"
              min="0"
              step="0.01"
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
                Aplicar
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
