"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { HouseSelector } from "@/components/houses/HouseSelector";
import {
  ShoppingListItemFormModal,
  type ShoppingListItemFormValues,
} from "@/components/shopping-list/ShoppingListItemFormModal";
import { ShoppingSessionsModal } from "@/components/shopping-list/ShoppingSessionsModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { useMyHouses } from "@/hooks/useMyHouses";
import { shoppingListApi } from "@/services/shoppingList.api";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import { SHOPPING_LIST_ITEM_STATUS_LABELS } from "@/lib/shopping-list-labels";
import type { House, ShoppingListItem } from "@/types/models";

function creatorName(createdBy: ShoppingListItem["createdBy"]) {
  return typeof createdBy === "string"
    ? createdBy
    : `${createdBy.nombre} ${createdBy.apellido}`;
}

function sessionNameOf(session: ShoppingListItem["session"]) {
  if (!session) return null;
  return typeof session === "string" ? null : session.name;
}

function ShoppingListBoard({ houseId }: { houseId: string }) {
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    reload: reloadItems,
  } = useAsyncList<ShoppingListItem>(() => shoppingListApi.list(houseId));

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ShoppingListItem | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);

  const handleItemSubmit = async (values: ShoppingListItemFormValues) => {
    const payload = {
      name: values.name.trim(),
      quantity: Number(values.quantity),
      precio: values.precio ? Number(values.precio) : undefined,
    };
    if (editingItem) {
      await shoppingListApi.update(houseId, editingItem._id, payload);
      toast.success("Producto actualizado correctamente");
    } else {
      await shoppingListApi.create(houseId, payload);
      toast.success("Producto agregado a la lista");
    }
    reloadItems();
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      await shoppingListApi.remove(houseId, deletingItem._id);
      toast.success("Producto eliminado correctamente");
      setDeletingItem(null);
      reloadItems();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el producto."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Lista de compras
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setSessionsModalOpen(true)}
            >
              <ShoppingBag className="h-4 w-4" />
              Sesiones de compra
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingItem(null);
                setItemFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </div>
        </div>

        <DataTableShell
          loading={itemsLoading}
          error={itemsError}
          empty={items.length === 0}
          emptyMessage="No hay productos pendientes en la lista."
        >
          <div className="divide-y divide-black/[.06] dark:divide-white/[.08] sm:hidden">
            {items.map((item) => (
              <div key={item._id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-black dark:text-zinc-50">
                    {item.name}
                  </p>
                  {item.status === "pendiente" && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setItemFormOpen(true);
                        }}
                        aria-label="Editar producto"
                        title="Editar"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        aria-label="Eliminar producto"
                        title="Eliminar"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-600/10 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>Cantidad: {item.quantity}</span>
                  <span>
                    Precio:{" "}
                    {item.precio != null ? formatCurrency(item.precio) : "—"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-black/[.06] px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                    {SHOPPING_LIST_ITEM_STATUS_LABELS[item.status] ??
                      item.status}
                  </span>
                  {sessionNameOf(item.session) && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {sessionNameOf(item.session)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Creado por {creatorName(item.createdBy)}
                </p>
              </div>
            ))}
          </div>

          <table className="hidden w-full min-w-[560px] text-left text-sm sm:table">
            <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creado por</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {item.precio != null ? formatCurrency(item.precio) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-black/[.06] px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                      {SHOPPING_LIST_ITEM_STATUS_LABELS[item.status] ??
                        item.status}
                    </span>
                    {sessionNameOf(item.session) && (
                      <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {sessionNameOf(item.session)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {creatorName(item.createdBy)}
                  </td>
                  <td className="px-4 py-3">
                    {item.status === "pendiente" && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setItemFormOpen(true);
                          }}
                          aria-label="Editar producto"
                          title="Editar"
                          className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          aria-label="Eliminar producto"
                          title="Eliminar"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-600/10 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </div>

      <ShoppingListItemFormModal
        open={itemFormOpen}
        onClose={() => setItemFormOpen(false)}
        onSubmit={handleItemSubmit}
        initialValues={
          editingItem
            ? {
                name: editingItem.name,
                quantity: String(editingItem.quantity),
                precio:
                  editingItem.precio != null ? String(editingItem.precio) : "",
              }
            : undefined
        }
        houseId={houseId}
      />

      {sessionsModalOpen && (
        <ShoppingSessionsModal
          houseId={houseId}
          onClose={() => setSessionsModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Eliminar producto"
        description={`¿Seguro que quieres eliminar "${
          deletingItem?.name ?? ""
        }" de la lista?`}
        confirmLabel="Eliminar"
        danger
        loading={deleteLoading}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}

function ListaDeComprasContent() {
  const {
    houses,
    loading: housesLoading,
    error: housesError,
    reload: reloadHouses,
    selectedHouse,
    selectedId,
    selectHouse,
  } = useMyHouses();

  const handleJoined = (house: House) => {
    reloadHouses();
    selectHouse(house._id);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-10">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Lista de Compras
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Agrega productos, arma sesiones de compra y registra el gasto al
          terminar.
        </p>
      </div>

      <HouseSelector
        houses={houses}
        selectedId={selectedId}
        onSelect={selectHouse}
        onJoined={handleJoined}
      />

      {housesLoading ? (
        <LoadingBar />
      ) : housesError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {housesError}
        </p>
      ) : !selectedHouse ? (
        <p className="rounded-lg border border-black/[.08] px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
          Aún no perteneces a ninguna casa. Pide un código de acceso a un
          administrador y únete con el botón de arriba.
        </p>
      ) : (
        <ShoppingListBoard
          key={selectedHouse._id}
          houseId={selectedHouse._id}
        />
      )}
    </div>
  );
}

export default function ListaDeComprasPage() {
  return (
    <ProtectedRoute>
      <ListaDeComprasContent />
    </ProtectedRoute>
  );
}
