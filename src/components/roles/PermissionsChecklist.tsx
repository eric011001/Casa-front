"use client";

import { useMemo, useState } from "react";
import { useField } from "formik";

type Permission = { _id: string; name: string; description?: string };

export function PermissionsChecklist({
  name,
  permissions,
}: {
  name: string;
  permissions: Permission[];
}) {
  const [field, , helpers] = useField<string[]>(name);
  const [filter, setFilter] = useState("");

  const grouped = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const filtered = term
      ? permissions.filter(
          (permission) =>
            permission.name.toLowerCase().includes(term) ||
            permission.description?.toLowerCase().includes(term)
        )
      : permissions;

    const groups = new Map<string, Permission[]>();
    filtered.forEach((permission) => {
      const [group] = permission.name.split(":");
      const key = group || "otros";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(permission);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions, filter]);

  const toggle = (id: string) => {
    const next = field.value.includes(id)
      ? field.value.filter((value) => value !== id)
      : [...field.value, id];
    helpers.setValue(next);
  };

  const toggleGroup = (items: Permission[]) => {
    const ids = items.map((permission) => permission._id);
    const allSelected = ids.every((id) => field.value.includes(id));
    const next = allSelected
      ? field.value.filter((id) => !ids.includes(id))
      : Array.from(new Set([...field.value, ...ids]));
    helpers.setValue(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Permisos ({field.value.length} seleccionados)
      </label>
      <input
        type="text"
        placeholder="Buscar permiso..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3]"
      />
      <div className="flex max-h-64 flex-col gap-3 overflow-y-auto rounded-lg border border-black/[.08] p-3 dark:border-white/[.145]">
        {grouped.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No se encontraron permisos.
          </p>
        )}
        {grouped.map(([group, items]) => {
          const allSelected = items.every((permission) =>
            field.value.includes(permission._id)
          );
          return (
          <div key={group} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {group}
              </p>
              <button
                type="button"
                onClick={() => toggleGroup(items)}
                className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-300"
              >
                {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
              </button>
            </div>
            {items.map((permission) => (
              <label
                key={permission._id}
                className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
              >
                <input
                  type="checkbox"
                  checked={field.value.includes(permission._id)}
                  onChange={() => toggle(permission._id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/[.2] accent-black dark:accent-white"
                />
                <span>
                  <span className="block text-black dark:text-zinc-50">
                    {permission.name}
                  </span>
                  {permission.description && (
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {permission.description}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          );
        })}
      </div>
    </div>
  );
}
