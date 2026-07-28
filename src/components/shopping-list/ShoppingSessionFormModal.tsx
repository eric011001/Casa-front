"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getErrorMessage } from "@/lib/http-error";

export type ShoppingSessionFormValues = {
  name: string;
};

const schema = Yup.object({
  name: Yup.string().trim().required("El nombre del lugar es requerido"),
});

export function ShoppingSessionFormModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ShoppingSessionFormValues) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Nueva sesión de compra">
      <Formik
        initialValues={{ name: "" }}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(
              getErrorMessage(err, "No se pudo crear la sesión de compra.")
            );
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <TextField
              label="Lugar donde vas a comprar"
              name="name"
              type="text"
              placeholder="Ej. Walmart Insurgentes"
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
                Iniciar sesión
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
