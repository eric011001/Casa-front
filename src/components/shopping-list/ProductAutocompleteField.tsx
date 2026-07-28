"use client";

import { useEffect, useRef, useState } from "react";
import { useField, useFormikContext } from "formik";
import { shoppingListApi } from "@/services/shoppingList.api";
import type { ShoppingListAutocompleteResult } from "@/types/models";

export function ProductAutocompleteField({
  label,
  name,
  houseId,
  placeholder,
  onSelect,
}: {
  label: string;
  name: string;
  houseId: string;
  placeholder?: string;
  onSelect?: (suggestion: ShoppingListAutocompleteResult) => void;
}) {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext();
  const [suggestions, setSuggestions] = useState<
    ShoppingListAutocompleteResult[]
  >([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const showError = Boolean(meta.touched && meta.error);
  const fieldId = name;

  useEffect(() => {
    const q = field.value.trim();
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!q) {
        if (!cancelled) setSuggestions([]);
        return;
      }
      shoppingListApi
        .autocomplete(houseId, q)
        .then((results: ShoppingListAutocompleteResult[]) => {
          if (!cancelled) setSuggestions(results);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [field.value, houseId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label
        htmlFor={fieldId}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        {...field}
        id={fieldId}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        aria-invalid={showError}
        aria-describedby={showError ? `${fieldId}-error` : undefined}
        className={`rounded-lg border bg-transparent px-3 py-2 text-black outline-none focus:border-black/[.3] dark:text-zinc-50 dark:focus:border-white/[.3] ${
          showError
            ? "border-red-500 dark:border-red-500"
            : "border-black/[.08] dark:border-white/[.145]"
        }`}
      />
      {showError && (
        <p
          id={`${fieldId}-error`}
          className="text-xs text-red-600 dark:text-red-400"
        >
          {meta.error}
        </p>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-black/[.08] bg-white py-1 shadow-lg dark:border-white/[.145] dark:bg-[#0a0a0a]">
          {suggestions.map((s) => (
            <li key={s.name}>
              <button
                type="button"
                onClick={() => {
                  setFieldValue(name, s.name);
                  setOpen(false);
                  onSelect?.(s);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.08]"
              >
                <span className="truncate">{s.name}</span>
                <span className="shrink-0 text-xs text-zinc-400">
                  ×{s.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
