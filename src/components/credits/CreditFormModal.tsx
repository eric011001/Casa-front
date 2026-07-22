"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getErrorMessage } from "@/lib/http-error";

export type CreditFormValues = {
  name: string;
  bank: string;
  currentDebt: string;
  limit: string;
};

const EMPTY_VALUES: CreditFormValues = {
  name: "",
  bank: "",
  currentDebt: "0",
  limit: "",
};

const schema = Yup.object({
  name: Yup.string().trim().required("El nombre es requerido"),
  bank: Yup.string(),
  currentDebt: Yup.number()
    .typeError("Ingresa un monto válido")
    .min(0, "No puede ser negativa"),
  limit: Yup.number()
    .typeError("Ingresa un monto válido")
    .positive("Debe ser mayor a 0")
    .required("El límite es requerido")
    .test(
      "min-current-debt",
      "El límite no puede ser menor a la deuda actual",
      function (value) {
        const { currentDebt } = this.parent;
        if (value === undefined || currentDebt === undefined || currentDebt === "")
          return true;
        return Number(value) >= Number(currentDebt);
      }
    ),
});

export function CreditFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreditFormValues) => Promise<void>;
  initialValues?: CreditFormValues;
}) {
  const isEdit = Boolean(initialValues);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar tarjeta" : "Nueva tarjeta"}
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
            toast.error(getErrorMessage(err, "No se pudo guardar la tarjeta."));
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <TextField label="Nombre" name="name" type="text" />
            <TextField label="Banco" name="bank" type="text" />

            {!isEdit && (
              <TextField
                label="Deuda actual"
                name="currentDebt"
                type="number"
                min="0"
                step="0.01"
              />
            )}

            <TextField
              label="Límite de crédito"
              name="limit"
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
                {isEdit ? "Guardar cambios" : "Crear tarjeta"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
