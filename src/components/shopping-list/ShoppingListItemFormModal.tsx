"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ProductAutocompleteField } from "./ProductAutocompleteField";
import { getErrorMessage } from "@/lib/http-error";

export type ShoppingListItemFormValues = {
  name: string;
  quantity: string;
};

const EMPTY_VALUES: ShoppingListItemFormValues = {
  name: "",
  quantity: "1",
};

const schema = Yup.object({
  name: Yup.string().trim().required("El nombre es requerido"),
  quantity: Yup.number()
    .typeError("Ingresa una cantidad válida")
    .positive("Debe ser mayor a 0")
    .required("La cantidad es requerida"),
});

export function ShoppingListItemFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  houseId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ShoppingListItemFormValues) => Promise<void>;
  initialValues?: ShoppingListItemFormValues;
  houseId: string;
}) {
  const isEdit = Boolean(initialValues);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar producto" : "Nuevo producto"}
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
            toast.error(
              getErrorMessage(err, "No se pudo guardar el producto.")
            );
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <ProductAutocompleteField
              label="Producto"
              name="name"
              houseId={houseId}
              placeholder="Ej. Leche"
            />
            <TextField
              label="Cantidad"
              name="quantity"
              type="number"
              min="0"
              step="1"
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
                {isEdit ? "Guardar cambios" : "Agregar producto"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
