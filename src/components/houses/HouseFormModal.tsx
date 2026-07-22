"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getErrorMessage } from "@/lib/http-error";

export type HouseFormValues = {
  name: string;
};

const schema = Yup.object({
  name: Yup.string().trim().required("El nombre es requerido"),
});

export function HouseFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: HouseFormValues) => Promise<void>;
  initialValues?: HouseFormValues;
}) {
  const isEdit = Boolean(initialValues);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Renombrar casa" : "Nueva casa"}
    >
      <Formik
        initialValues={initialValues ?? { name: "" }}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(getErrorMessage(err, "No se pudo guardar la casa."));
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <TextField label="Nombre" name="name" type="text" />
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
                {isEdit ? "Guardar cambios" : "Crear casa"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
