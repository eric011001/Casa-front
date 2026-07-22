"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextareaField } from "@/components/ui/TextareaField";
import { getErrorMessage } from "@/lib/http-error";

export type PermissionFormValues = {
  name: string;
  description: string;
};

const schema = Yup.object({
  name: Yup.string().trim().required("El nombre es requerido"),
  description: Yup.string().trim().max(300, "Máximo 300 caracteres"),
});

export function PermissionFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PermissionFormValues) => Promise<void>;
  initialValues?: PermissionFormValues;
}) {
  const isEdit = Boolean(initialValues);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar permiso" : "Nuevo permiso"}
    >
      <Formik
        enableReinitialize
        initialValues={initialValues ?? { name: "", description: "" }}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(getErrorMessage(err, "No se pudo guardar el permiso."));
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <TextField
              label="Nombre"
              name="name"
              type="text"
              placeholder="recurso:accion"
            />
            <TextareaField label="Descripción" name="description" rows={2} />

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
                {isEdit ? "Guardar cambios" : "Crear permiso"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
