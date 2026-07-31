"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Ban, CheckCircle2, Plus, X } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { HouseSelector } from "@/components/houses/HouseSelector";
import {
  ShoppingSessionCloseModal,
  type ShoppingSessionCloseFormValues,
} from "@/components/shopping-list/ShoppingSessionCloseModal";
import {
  ShoppingListItemFormModal,
  type ShoppingListItemFormValues,
} from "@/components/shopping-list/ShoppingListItemFormModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { useMyHouses } from "@/hooks/useMyHouses";
import { shoppingListApi } from "@/services/shoppingList.api";
import { shoppingSessionsApi } from "@/services/shoppingSessions.api";
import { getErrorMessage } from "@/lib/http-error";
import { formatCurrency } from "@/lib/format";
import { SHOPPING_SESSION_STATUS_LABELS } from "@/lib/shopping-list-labels";
import type { House, ShoppingListItem, ShoppingSessionDetail } from "@/types/models";

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SessionManageBoard({
  houseId,
  sessionId,
}: {
  houseId: string;
  sessionId: string;
}) {
  const router = useRouter();

  const [detail, setDetail] = useState<ShoppingSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [newProductOpen, setNewProductOpen] = useState(false);

  const { items: allItems, reload: reloadItems } = useAsyncList<ShoppingListItem>(
    () => shoppingListApi.list(houseId),
  );
  const pendingItems = allItems.filter((item) => item.status === "pendiente");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    shoppingSessionsApi
      .getById(houseId, sessionId)
      .then((data: ShoppingSessionDetail) => setDetail(data))
      .catch((err: unknown) =>
        setError(getErrorMessage(err, "No se pudo cargar la sesión.")),
      )
      .finally(() => setLoading(false));
  }, [houseId, sessionId]);

  useEffect(() => {
    let cancelled = false;
    shoppingSessionsApi
      .getById(houseId, sessionId)
      .then((data: ShoppingSessionDetail) => {
        if (cancelled) return;
        setDetail(data);
        setError("");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(err, "No se pudo cargar la sesión."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [houseId, sessionId]);

  const handleAddItem = async (itemId: string, precio?: string) => {
    setAddingId(itemId);
    try {
      const trimmed = precio?.trim();
      const payload = trimmed ? { precio: Number(trimmed) } : {};
      await shoppingSessionsApi.addItem(houseId, sessionId, itemId, payload);
      load();
      reloadItems();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "No se pudo agregar el producto al carrito."),
      );
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      await shoppingSessionsApi.removeItem(houseId, sessionId, itemId);
      load();
      reloadItems();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "No se pudo quitar el producto del carrito."),
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleClose = async (values: ShoppingSessionCloseFormValues) => {
    const payload = {
      name: values.name.trim(),
      amount: Number(values.amount),
      category: values.category,
    };
    await shoppingSessionsApi.close(houseId, sessionId, payload);
    toast.success("Sesión cerrada y gasto registrado");
    load();
    reloadItems();
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await shoppingSessionsApi.cancel(houseId, sessionId);
      toast.success("Sesión cancelada");
      setCancelOpen(false);
      load();
      reloadItems();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo cancelar la sesión."));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleNewProduct = async (values: ShoppingListItemFormValues) => {
    const precio = values.precio ? Number(values.precio) : undefined;
    const created: ShoppingListItem = await shoppingListApi.create(houseId, {
      name: values.name.trim(),
      quantity: Number(values.quantity),
      precio,
    });
    await shoppingSessionsApi.addItem(
      houseId,
      sessionId,
      created._id,
      precio != null ? { precio } : {},
    );
    toast.success("Producto agregado a la lista y a la sesión");
    load();
    reloadItems();
  };

  const session = detail;
  const isActive = session?.status === "activa";
  const cartItems = session?.items.filter((i) => i.status === "en_carrito") ?? [];
  const boughtItems = session?.items.filter((i) => i.status === "comprado") ?? [];
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.precio ?? 0) * item.quantity,
    0,
  );
  const cartHasMissingPrice = cartItems.some((item) => item.precio == null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => router.push("/lista-de-compras")}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a lista de compras
        </button>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          {session ? `Sesión · ${session.name}` : "Sesión de compra"}
        </h1>
      </div>

      <div className="h-1">{loading && <LoadingBar />}</div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {session && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-black/[.06] px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
              {SHOPPING_SESSION_STATUS_LABELS[session.status] ?? session.status}
            </span>
            {isActive && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={() => setCloseOpen(true)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            )}
          </div>

          {typeof session.expense === "object" && session.expense && (
            <div className="rounded-lg border border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Gasto registrado
              </p>
              <p className="font-medium text-black dark:text-zinc-50">
                {session.expense.name} · {formatCurrency(session.expense.amount)}
              </p>
            </div>
          )}

          {isActive && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Carrito
                  </p>
                  <p className="text-sm font-medium text-black dark:text-zinc-50">
                    {cartHasMissingPrice ? "Aprox. " : ""}
                    {formatCurrency(cartTotal)}
                  </p>
                </div>
                {cartItems.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Aún no has agregado productos al carrito.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {cartItems.map((item) => (
                      <li
                        key={item._id}
                        className="flex items-center justify-between rounded-lg border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {item.name}{" "}
                          <span className="text-zinc-400">×{item.quantity}</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {item.precio != null
                              ? formatCurrency(item.precio * item.quantity)
                              : "Sin precio"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={removingId === item._id}
                            aria-label="Quitar del carrito"
                            title="Quitar del carrito"
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-600/10 disabled:opacity-50 dark:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Agregar productos pendientes
                  </p>
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() => setNewProductOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Producto nuevo
                  </Button>
                </div>
                {pendingItems.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No hay productos pendientes en la lista.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {pendingItems.map((item) => (
                      <li
                        key={item._id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {item.name}{" "}
                          <span className="text-zinc-400">×{item.quantity}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {item.precio != null ? (
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {formatCurrency(item.precio)}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Precio"
                              aria-label={`Precio de ${item.name}`}
                              value={priceDrafts[item._id] ?? ""}
                              onChange={(e) =>
                                setPriceDrafts((prev) => ({
                                  ...prev,
                                  [item._id]: e.target.value,
                                }))
                              }
                              className="w-20 rounded-lg border border-black/[.08] bg-transparent px-2 py-1 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3]"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleAddItem(item._id, priceDrafts[item._id])
                            }
                            disabled={addingId === item._id}
                            aria-label="Agregar al carrito"
                            title="Agregar al carrito"
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-600/10 disabled:opacity-50 dark:text-green-400"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {!isActive && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {session.status === "cerrada" ? "Productos comprados" : "Productos"}
              </p>
              {boughtItems.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No hay productos ligados a esta sesión.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {boughtItems.map((item) => (
                    <li
                      key={item._id}
                      className="flex items-center justify-between rounded-lg border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {item.name}{" "}
                        <span className="text-zinc-400">×{item.quantity}</span>
                      </span>
                      {item.boughtAt && (
                        <span className="text-xs text-zinc-400">
                          {formatDateTime(item.boughtAt)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {session && (
        <ShoppingSessionCloseModal
          open={closeOpen}
          onClose={() => setCloseOpen(false)}
          onSubmit={handleClose}
          sessionName={session.name}
        />
      )}

      <ShoppingListItemFormModal
        open={newProductOpen}
        onClose={() => setNewProductOpen(false)}
        onSubmit={handleNewProduct}
        houseId={houseId}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar sesión"
        description="¿Seguro que quieres cancelar esta sesión? No se generará ningún gasto y los productos en el carrito volverán a la lista pendiente."
        confirmLabel="Cancelar sesión"
        danger
        loading={cancelLoading}
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}

function SesionCompraContent() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

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
        <SessionManageBoard
          key={`${selectedHouse._id}:${sessionId}`}
          houseId={selectedHouse._id}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}

export default function SesionCompraPage() {
  return (
    <ProtectedRoute>
      <SesionCompraContent />
    </ProtectedRoute>
  );
}
