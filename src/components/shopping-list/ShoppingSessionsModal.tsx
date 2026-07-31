"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { useAsyncList } from "@/hooks/useAsyncList";
import { shoppingSessionsApi } from "@/services/shoppingSessions.api";
import { SHOPPING_SESSION_STATUS_LABELS } from "@/lib/shopping-list-labels";
import {
  ShoppingSessionFormModal,
  type ShoppingSessionFormValues,
} from "./ShoppingSessionFormModal";
import type { ShoppingSession } from "@/types/models";

function creatorName(createdBy: ShoppingSession["createdBy"]) {
  return typeof createdBy === "string"
    ? createdBy
    : `${createdBy.nombre} ${createdBy.apellido}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ShoppingSessionsModal({
  onClose,
  houseId,
}: {
  onClose: () => void;
  houseId: string;
}) {
  const {
    items: sessions,
    loading,
    error,
    reload,
  } = useAsyncList<ShoppingSession>(() => shoppingSessionsApi.list(houseId));

  const [sessionFormOpen, setSessionFormOpen] = useState(false);

  const handleSessionSubmit = async (values: ShoppingSessionFormValues) => {
    await shoppingSessionsApi.create(houseId, { name: values.name.trim() });
    toast.success("Sesión de compra iniciada");
    reload();
  };

  return (
    <>
      <Modal open onClose={onClose} title="Sesiones de compra">
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setSessionFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva sesión
            </Button>
          </div>

          <DataTableShell
            loading={loading}
            error={error}
            empty={sessions.length === 0}
            emptyMessage="Aún no hay sesiones de compra registradas."
          >
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Lugar</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">
                    Creado por
                  </th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">
                    Fecha
                  </th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
                {sessions.map((session) => (
                  <tr key={session._id}>
                    <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                      {session.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-black/[.06] px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                        {SHOPPING_SESSION_STATUS_LABELS[session.status] ??
                          session.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                      {creatorName(session.createdBy)}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 md:table-cell">
                      {formatDate(session.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/lista-de-compras/sesiones/${session._id}`}
                        onClick={onClose}
                        className="inline-block rounded-full bg-black/[.06] px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-black/[.1] dark:bg-white/[.08] dark:text-zinc-300"
                      >
                        {session.status === "activa" ? "Gestionar" : "Ver"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableShell>
        </div>
      </Modal>

      <ShoppingSessionFormModal
        open={sessionFormOpen}
        onClose={() => setSessionFormOpen(false)}
        onSubmit={handleSessionSubmit}
      />
    </>
  );
}
