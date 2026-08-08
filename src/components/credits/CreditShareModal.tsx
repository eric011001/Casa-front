"use client";

import { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { UserMinus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { creditsApi } from "@/services/credits.api";
import { getErrorMessage } from "@/lib/http-error";
import type { Credit } from "@/types/models";

type ShareFormValues = { email: string };

const EMPTY_VALUES: ShareFormValues = { email: "" };

const schema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Ingresa un correo válido")
    .required("El correo es requerido"),
});

export function CreditShareModal({
  credit,
  onClose,
  onCreditChange,
}: {
  credit: Credit;
  onClose: () => void;
  onCreditChange: (credit: Credit) => void;
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleUnshare = async (userId: string) => {
    setRemovingId(userId);
    try {
      const updated = await creditsApi.unshare(credit._id, userId);
      onCreditChange(updated);
      toast.success("Se dejó de compartir el crédito con ese usuario");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo quitar el acceso."));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Compartir · ${credit.name}`}>
      <div className="flex flex-col gap-5">
        <Formik
          initialValues={EMPTY_VALUES}
          validationSchema={schema}
          onSubmit={async (values, helpers) => {
            try {
              const updated = await creditsApi.share(
                credit._id,
                values.email.trim()
              );
              onCreditChange(updated);
              toast.success("Crédito compartido correctamente");
              helpers.resetForm();
            } catch (err) {
              toast.error(
                getErrorMessage(err, "No se pudo compartir el crédito.")
              );
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-3">
              <TextField
                label="Correo del usuario"
                name="email"
                type="email"
                placeholder="usuario@correo.com"
              />
              <Button type="submit" loading={isSubmitting} className="self-end">
                Compartir
              </Button>
            </Form>
          )}
        </Formik>

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Compartido con
          </p>
          {credit.sharedWith.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Este crédito no se comparte con nadie.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {credit.sharedWith.map((userId) => (
                <li
                  key={userId}
                  className="flex items-center justify-between rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
                >
                  <span className="truncate text-zinc-600 dark:text-zinc-400">
                    {userId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUnshare(userId)}
                    disabled={removingId === userId}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-600/10 disabled:opacity-60 dark:text-red-400"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
