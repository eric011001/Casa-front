"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserFormModal, type UserFormValues } from "@/components/users/UserFormModal";
import { GeneratedPasswordModal } from "@/components/users/GeneratedPasswordModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { usersApi } from "@/services/users.api";
import { getPermissions } from "@/lib/auth-storage";
import { getErrorMessage } from "@/lib/http-error";

type Role = { _id: string; name: string };
type User = {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  role: Role | string;
  lastPasswordResetAt: string | null;
};

function roleName(role: Role | string) {
  return typeof role === "string" ? role : role.name;
}

function roleId(role: Role | string) {
  return typeof role === "string" ? role : role._id;
}

function UsuariosContent() {
  const { items: users, loading, error, reload } = useAsyncList<User>(
    usersApi.list
  );
  const permissions = getPermissions();

  const canCreate = permissions.includes("users:create");
  const canUpdate = permissions.includes("users:update");
  const canDelete = permissions.includes("users:delete");
  const canResetPassword = permissions.includes("users:reset-password");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [generated, setGenerated] = useState<{
    correo: string;
    password: string;
  } | null>(null);

  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (editingUser) {
      await usersApi.update(editingUser._id, values);
      toast.success("Usuario actualizado correctamente");
    } else {
      const result = await usersApi.create(values);
      toast.success(result.message ?? "Usuario creado correctamente");
      setGenerated({
        correo: result.user.correo,
        password: result.generatedPassword,
      });
    }
    reload();
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await usersApi.remove(deletingUser._id);
      toast.success("Usuario eliminado correctamente");
      setDeletingUser(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el usuario."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingUser) return;
    setResetLoading(true);
    try {
      const result = await usersApi.resetPassword(resettingUser._id);
      toast.success(result.message ?? "Contraseña restablecida");
      setGenerated({
        correo: resettingUser.correo,
        password: result.generatedPassword,
      });
      setResettingUser(null);
    } catch (err) {
      toast.error(
        getErrorMessage(err, "No se pudo restablecer la contraseña.")
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Usuarios
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Administra las cuentas que pueden acceder al sistema.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        )}
      </div>

      <DataTableShell
        loading={loading}
        error={error}
        empty={users.length === 0}
        emptyMessage="Aún no hay usuarios registrados."
      >
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Estado
              </th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-black dark:text-zinc-50">
                    {user.nombre} {user.apellido}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user.correo}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-black/[.06] px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                    {roleName(user.role)}
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {user.lastPasswordResetAt ? (
                    <span className="text-xs text-green-700 dark:text-green-400">
                      Activo
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      Contraseña pendiente
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        aria-label="Editar usuario"
                        title="Editar"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canResetPassword && (
                      <button
                        type="button"
                        onClick={() => setResettingUser(user)}
                        aria-label="Restablecer contraseña"
                        title="Restablecer contraseña"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingUser(user)}
                        aria-label="Eliminar usuario"
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

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={
          editingUser
            ? {
                nombre: editingUser.nombre,
                apellido: editingUser.apellido,
                correo: editingUser.correo,
                role: roleId(editingUser.role),
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(deletingUser)}
        title="Eliminar usuario"
        description={`¿Seguro que quieres eliminar a ${deletingUser?.nombre ?? ""} ${
          deletingUser?.apellido ?? ""
        }? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingUser(null)}
      />

      <ConfirmDialog
        open={Boolean(resettingUser)}
        title="Restablecer contraseña"
        description={`Se generará una nueva contraseña temporal para ${
          resettingUser?.correo ?? ""
        }. Deberá usarla para volver a iniciar sesión.`}
        confirmLabel="Restablecer"
        loading={resetLoading}
        onConfirm={handleResetPassword}
        onCancel={() => setResettingUser(null)}
      />

      {generated && (
        <GeneratedPasswordModal
          open={Boolean(generated)}
          onClose={() => setGenerated(null)}
          correo={generated.correo}
          password={generated.password}
        />
      )}
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <ProtectedRoute requiredPermission="users:read">
      <UsuariosContent />
    </ProtectedRoute>
  );
}
