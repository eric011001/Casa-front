"use client";

import { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { housesApi } from "@/services/houses.api";
import { getErrorMessage } from "@/lib/http-error";
import type { House } from "@/types/models";

const joinSchema = Yup.object({
  code: Yup.string().trim().required("El código es requerido"),
});

export function HouseSelector({
  houses,
  selectedId,
  onSelect,
  onJoined,
}: {
  houses: House[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onJoined: (house: House) => void;
}) {
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {houses.length > 0 && (
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3] sm:w-auto"
        >
          {houses.map((house) => (
            <option key={house._id} value={house._id}>
              {house.name}
              {!house.active ? " (inactiva)" : ""}
            </option>
          ))}
        </select>
      )}
      <Button
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={() => setJoinOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        Unirme con código
      </Button>

      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Unirme a una casa"
      >
        <Formik
          initialValues={{ code: "" }}
          validationSchema={joinSchema}
          onSubmit={async (values, helpers) => {
            try {
              const house = await housesApi.join(values.code.trim());
              toast.success(`Te uniste a "${house.name}"`);
              onJoined(house);
              setTimeout(() => setJoinOpen(false), 0);
            } catch (err) {
              toast.error(getErrorMessage(err, "No se pudo unir a la casa."));
              helpers.setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-4">
              <TextField
                label="Código"
                name="code"
                type="text"
                placeholder="Ej. AB12CD"
              />
              <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setJoinOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Unirme
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
}
