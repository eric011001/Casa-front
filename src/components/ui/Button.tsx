"use client";

import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
  secondary:
    "border border-black/[.08] text-zinc-700 hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-white/[.08]",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost:
    "text-zinc-600 hover:bg-black/[.04] dark:text-zinc-400 dark:hover:bg-white/[.08]",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <Loader2
        aria-hidden="true"
        className={`h-4 w-4 animate-spin ${loading ? "" : "hidden"}`}
      />
      {children}
    </button>
  );
}
