"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  HouseFormModal,
  type HouseFormValues,
} from "@/components/houses/HouseFormModal";
import { GeneratedCodeModal } from "@/components/houses/GeneratedCodeModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { housesApi } from "@/services/houses.api";
import { getPermissions } from "@/lib/auth-storage";
import { getErrorMessage } from "@/lib/http-error";
import type { House } from "@/types/models";

function memberCount(house: House) {
  return house.members.length;
}

function CasasContent() {
  const { items: houses, loading, error, reload } = useAsyncList<House>(
    housesApi.list
  );
  const permissions = getPermissions();

  const canCreate = permissions.includes("houses:create");
  const canUpdate = permissions.includes("houses:update");
  const canDelete = permissions.includes("houses:delete");
  const canActivate = permissions.includes("houses:activate");
  const canDeactivate = permissions.includes("houses:deactivate");
  const canGenerateCode = permissions.includes("houses:generate-code");

  const [formOpen, setFormOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [deletingHouse, setDeletingHouse] = useState<House | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<{
    houseName: string;
    code: string;
  } | null>(null);

  const handleSubmit = async (values: HouseFormValues) => {
    if (editingHouse) {
      await housesApi.update(editingHouse._id, values);
      toast.success("Casa actualizada correctamente");
    } else {
      await housesApi.create(values);
      toast.success("Casa creada correctamente");
    }
    reload();
  };

  const handleDelete = async () => {
    if (!deletingHouse) return;
    setDeleteLoading(true);
    try {
      await housesApi.remove(deletingHouse._id);
      toast.success("Casa eliminada correctamente");
      setDeletingHouse(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar la casa."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (house: House) => {
    setTogglingId(house._id);
    try {
      if (house.active) {
        await housesApi.deactivate(house._id);
        toast.success(`"${house.name}" desactivada`);
      } else {
        await housesApi.activate(house._id);
        toast.success(`"${house.name}" activada`);
      }
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo cambiar el estado de la casa."));
    } finally {
      setTogglingId(null);
    }
  };

  const handleGenerateCode = async (house: House) => {
    setGeneratingId(house._id);
    try {
      const result = await housesApi.generateCode(house._id);
      setGeneratedCode({ houseName: house.name, code: result.code });
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo generar el código."));
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Casas
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Administra las casas y sus códigos de acceso.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingHouse(null);
              setFormOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nueva casa
          </Button>
        )}
      </div>

      <DataTableShell
        loading={loading}
        error={error}
        empty={houses.length === 0}
        emptyMessage="Aún no hay casas creadas."
      >
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Miembros
              </th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
            {houses.map((house) => (
              <tr key={house._id}>
                <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                  {house.name}
                </td>
                <td className="px-4 py-3">
                  {house.active ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                      Activa
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      Inactiva
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                  {memberCount(house)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHouse(house);
                          setFormOpen(true);
                        }}
                        aria-label="Renombrar casa"
                        title="Renombrar"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canGenerateCode && (
                      <button
                        type="button"
                        onClick={() => handleGenerateCode(house)}
                        disabled={generatingId === house._id}
                        aria-label="Generar código de acceso"
                        title="Generar código"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/[.08]"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    )}
                    {house.active
                      ? canDeactivate && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(house)}
                            disabled={togglingId === house._id}
                            aria-label="Desactivar casa"
                            title="Desactivar"
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-600/10 disabled:opacity-50 dark:text-amber-400"
                          >
                            <PowerOff className="h-4 w-4" />
                          </button>
                        )
                      : canActivate && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(house)}
                            disabled={togglingId === house._id}
                            aria-label="Activar casa"
                            title="Activar"
                            className="rounded-lg p-2 text-green-600 hover:bg-green-600/10 disabled:opacity-50 dark:text-green-400"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingHouse(house)}
                        aria-label="Eliminar casa"
                        title="Eliminar"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-600/10 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>

      <HouseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editingHouse ? { name: editingHouse.name } : undefined}
      />

      <ConfirmDialog
        open={Boolean(deletingHouse)}
        title="Eliminar casa"
        description={`¿Seguro que quieres eliminar "${
          deletingHouse?.name ?? ""
        }"? Sus miembros perderán acceso a los gastos registrados ahí.`}
        confirmLabel="Eliminar"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingHouse(null)}
      />

      {generatedCode && (
        <GeneratedCodeModal
          open={Boolean(generatedCode)}
          onClose={() => setGeneratedCode(null)}
          houseName={generatedCode.houseName}
          code={generatedCode.code}
        />
      )}
    </div>
  );
}

export default function CasasPage() {
  return (
    <ProtectedRoute requiredPermission="houses:read">
      <CasasContent />
    </ProtectedRoute>
  );
}
