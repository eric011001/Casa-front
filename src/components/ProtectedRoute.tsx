"use client";

import { ReactNode } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export function ProtectedRoute({
  requiredPermission,
  children,
}: {
  requiredPermission?: string | string[];
  children: ReactNode;
}) {
  const { status } = useAuthGuard(requiredPermission);

  if (status === "checking") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No tienes permiso para ver esta pantalla.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
