"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { getErrorMessage } from "@/lib/http-error";
import { EXPENSE_CATEGORY_OPTIONS } from "@/lib/expense-labels";
import type { ExpenseCategory } from "@/types/models";

export type ShoppingSessionCloseFormValues = {
  name: string;
  amount: string;
  category: ExpenseCategory;
};

const EMPTY_VALUES: ShoppingSessionCloseFormValues = {
  name: "",
  amount: "",
  category: "comida",
};

const schema = Yup.object({
  name: Yup.string().trim().required("El nombre del gasto es requerido"),
  amount: Yup.number()
    .typeError("Ingresa un monto válido")
    .positive("Debe ser mayor a 0")
    .required("El monto es requerido"),
  category: Yup.string().required("Selecciona una categoría"),
});

export function ShoppingSessionCloseModal({
  open,
  onClose,
  onSubmit,
  sessionName,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ShoppingSessionCloseFormValues) => Promise<void>;
  sessionName: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={`Cerrar sesión · ${sessionName}`}>
      <Formik
        initialValues={{ ...EMPTY_VALUES, name: sessionName }}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(getErrorMessage(err, "No se pudo cerrar la sesión."));
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Al cerrar la sesión se registrará un gasto con estos datos y los
              productos en el carrito pasarán a comprados.
            </p>
            <TextField label="Nombre del gasto" name="name" type="text" />
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
                Cerrar sesión
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
