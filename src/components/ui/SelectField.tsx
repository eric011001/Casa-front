"use client";

import { ReactNode, SelectHTMLAttributes } from "react";
import { useField } from "formik";

export function SelectField({
  label,
  name,
  id,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  children: ReactNode;
}) {
  const [field, meta] = useField(name);
  const showError = Boolean(meta.touched && meta.error);
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={fieldId}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <select
        {...field}
        {...props}
        id={fieldId}
        aria-invalid={showError}
        aria-describedby={showError ? `${fieldId}-error` : undefined}
        className={`rounded-lg border bg-transparent px-3 py-2 text-black outline-none focus:border-black/[.3] dark:text-zinc-50 dark:focus:border-white/[.3] ${
          showError
            ? "border-red-500 dark:border-red-500"
            : "border-black/[.08] dark:border-white/[.145]"
        } ${className}`}
      >
        {children}
      </select>
      {showError && (
        <p
          id={`${fieldId}-error`}
          className="text-xs text-red-600 dark:text-red-400"
        >
          {meta.error}
        </p>
      )}
    </div>
  );
}
