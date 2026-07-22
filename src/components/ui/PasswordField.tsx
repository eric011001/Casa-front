"use client";

import { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  id,
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          className={`w-full rounded-lg border border-black/[.08] bg-transparent px-3 py-2 pr-10 text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3] ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          tabIndex={-1}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
