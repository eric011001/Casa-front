"use client";

import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextareaField } from "@/components/ui/TextareaField";
import { PermissionsChecklist } from "./PermissionsChecklist";
import { permissionsApi } from "@/services/permissions.api";
import { getErrorMessage } from "@/lib/http-error";

type PermissionOption = { _id: string; name: string; description?: string };

export type RoleFormValues = {
  name: string;
  description: string;
  permissions: string[];
};

const schema = Yup.object({
  name: Yup.string().trim().required("El nombre es requerido"),
  description: Yup.string().trim().max(300, "Máximo 300 caracteres"),
  permissions: Yup.array().of(Yup.string().required()).default([]),
});

function RoleFormFields({
  isEdit,
  onClose,
  onSubmit,
  initialValues,
}: {
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
  initialValues?: RoleFormValues;
}) {
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [permissionsError, setPermissionsError] = useState("");
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    permissionsApi
      .list()
      .then((data) => {
        if (!cancelled) setPermissions(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPermissionsError(
            getErrorMessage(err, "No se pudieron cargar los permisos disponibles.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPermissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Formik
      initialValues={
        initialValues ?? { name: "", description: "", permissions: [] }
      }
      validationSchema={schema}
      onSubmit={async (values, helpers) => {
        try {
          await onSubmit(values);
          setTimeout(onClose, 0);
        } catch (err) {
          toast.error(getErrorMessage(err, "No se pudo guardar el rol."));
          helpers.setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-4">
          <TextField label="Nombre" name="name" type="text" />
          <TextareaField label="Descripción" name="description" rows={2} />

          {permissionsError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {permissionsError}
            </p>
          ) : permissionsLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Cargando permisos...
            </p>
          ) : (
            <PermissionsChecklist name="permissions" permissions={permissions} />
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
              {isEdit ? "Guardar cambios" : "Crear rol"}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export function RoleFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
  initialValues?: RoleFormValues;
}) {
  const isEdit = Boolean(initialValues);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar rol" : "Nuevo rol"}
    >
      {open && (
        <RoleFormFields
          isEdit={isEdit}
          onClose={onClose}
          onSubmit={onSubmit}
          initialValues={initialValues}
        />
      )}
    </Modal>
  );
}
