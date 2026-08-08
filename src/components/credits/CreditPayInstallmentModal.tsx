"use client";

import { Formik, Form, useField } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import { EXPENSE_CATEGORY_OPTIONS } from "@/lib/expense-labels";
import type { House } from "@/types/models";

export type CreditPayInstallmentFormValues = {
  generateExpense: boolean;
  houseId: string;
  category: string;
  name: string;
};

function CheckboxField({ label, name }: { label: string; name: string }) {
  const [field] = useField({ name, type: "checkbox" });
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
      <input
        type="checkbox"
        checked={field.checked}
        onChange={field.onChange}
        onBlur={field.onBlur}
        name={name}
        className="h-4 w-4 rounded border-black/[.2] dark:border-white/[.3]"
      />
      {label}
    </label>
  );
}

const schema = Yup.object({
  generateExpense: Yup.boolean(),
  houseId: Yup.string().when("generateExpense", {
    is: true,
    then: (s) => s.required("Selecciona una casa"),
  }),
  category: Yup.string(),
  name: Yup.string(),
});

export function CreditPayInstallmentModal({
  open,
  onClose,
  onSubmit,
  installmentNumber,
  installmentAmount,
  houses,
  defaultName,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreditPayInstallmentFormValues) => Promise<void>;
  installmentNumber: number;
  installmentAmount: number;
  houses: House[];
  defaultName: string;
}) {
  const emptyValues: CreditPayInstallmentFormValues = {
    generateExpense: false,
    houseId: houses[0]?._id ?? "",
    category: "otros",
    name: defaultName,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pagar cuota ${installmentNumber}`}
    >
      <Formik
        enableReinitialize
        initialValues={emptyValues}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            setTimeout(onClose, 0);
          } catch (err) {
            toast.error(getErrorMessage(err, "No se pudo pagar la cuota."));
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ values, isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Monto de la cuota:{" "}
              <span className="font-medium">
                {formatCurrency(installmentAmount)}
              </span>
            </p>

            <CheckboxField
              label="Registrar también como gasto de una casa"
              name="generateExpense"
            />

            {values.generateExpense && (
              <>
                <SelectField label="Casa" name="houseId">
                  {houses.length === 0 && <option value="">Sin casas</option>}
                  {houses.map((house) => (
                    <option key={house._id} value={house._id}>
                      {house.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Categoría" name="category">
                  {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectField>
                <TextField label="Nombre del gasto" name="name" type="text" />
              </>
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
                Pagar cuota
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
