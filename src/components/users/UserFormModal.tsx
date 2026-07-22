"use client";

import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { rolesApi } from "@/services/roles.api";
import { getErrorMessage } from "@/lib/http-error";

type RoleOption = { _id: string; name: string };

export type UserFormValues = {
  nombre: string;
  apellido: string;
  correo: string;
  role: string;
};

const schema = Yup.object({
  nombre: Yup.string().trim().required("El nombre es requerido"),
  apellido: Yup.string().trim().required("El apellido es requerido"),
  correo: Yup.string()
    .trim()
    .email("Ingresa un correo válido")
    .required("El correo es requerido"),
  role: Yup.string().required("Selecciona un rol"),
});

function UserFormFields({
  isEdit,
  onClose,
  onSubmit,
  initialValues,
}: {
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  initialValues?: UserFormValues;
}) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesError, setRolesError] = useState("");
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    rolesApi
      .list()
      .then((data) => {
        if (!cancelled) setRoles(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRolesError(
            getErrorMessage(err, "No se pudieron cargar los roles disponibles.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Formik
      initialValues={
        initialValues ?? { nombre: "", apellido: "", correo: "", role: "" }
      }
      validationSchema={schema}
      onSubmit={async (values, helpers) => {
        try {
          await onSubmit(values);
          setTimeout(onClose, 0);
        } catch (err) {
          toast.error(getErrorMessage(err, "No se pudo guardar el usuario."));
          helpers.setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-4">
          <TextField label="Nombre" name="nombre" type="text" />
          <TextField label="Apellido" name="apellido" type="text" />
          <TextField label="Correo" name="correo" type="email" />

          {rolesError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {rolesError}
            </p>
          ) : (
            <SelectField label="Rol" name="role" disabled={rolesLoading}>
              <option value="">
                {rolesLoading ? "Cargando roles..." : "Selecciona un rol"}
              </option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </SelectField>
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
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!isEdit && Boolean(rolesError)}
            >
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export function UserFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  initialValues?: UserFormValues;
}) {
  const isEdit = Boolean(initialValues);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
    >
      {open && (
        <UserFormFields
          isEdit={isEdit}
          onClose={onClose}
          onSubmit={onSubmit}
          initialValues={initialValues}
        />
      )}
    </Modal>
  );
}
