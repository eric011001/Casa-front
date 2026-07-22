"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleFormModal, type RoleFormValues } from "@/components/roles/RoleFormModal";
import {
  PermissionFormModal,
  type PermissionFormValues,
} from "@/components/permissions/PermissionFormModal";
import { useAsyncList } from "@/hooks/useAsyncList";
import { rolesApi } from "@/services/roles.api";
import { permissionsApi } from "@/services/permissions.api";
import { getPermissions } from "@/lib/auth-storage";
import { getErrorMessage } from "@/lib/http-error";

type Permission = { _id: string; name: string; description?: string };
type Role = {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[] | string[];
};

function permissionIds(permissions: Permission[] | string[]) {
  return permissions.map((permission) =>
    typeof permission === "string" ? permission : permission._id
  );
}

function RolesTab() {
  const { items: roles, loading, error, reload } = useAsyncList<Role>(
    rolesApi.list
  );
  const permissions = getPermissions();

  const canCreate = permissions.includes("roles:create");
  const canUpdate = permissions.includes("roles:update");
  const canDelete = permissions.includes("roles:delete");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSubmit = async (values: RoleFormValues) => {
    if (editingRole) {
      await rolesApi.update(editingRole._id, values);
      toast.success("Rol actualizado correctamente");
    } else {
      await rolesApi.create(values);
      toast.success("Rol creado correctamente");
    }
    reload();
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    try {
      await rolesApi.remove(deletingRole._id);
      toast.success("Rol eliminado correctamente");
      setDeletingRole(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el rol."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Define qué puede hacer cada rol dentro del sistema.
        </p>
        {canCreate && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingRole(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo rol
          </Button>
        )}
      </div>

      <DataTableShell
        loading={loading}
        error={error}
        empty={roles.length === 0}
        emptyMessage="Aún no hay roles creados."
      >
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                Descripción
              </th>
              <th className="px-4 py-3 font-medium">Permisos</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
            {roles.map((role) => (
              <tr key={role._id}>
                <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                  {role.name}
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 md:table-cell">
                  {role.description || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-black/[.06] px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                    {role.permissions.length} permiso
                    {role.permissions.length === 1 ? "" : "s"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRole(role);
                          setFormOpen(true);
                        }}
                        aria-label="Editar rol"
                        title="Editar"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingRole(role)}
                        aria-label="Eliminar rol"
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

      <RoleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={
          editingRole
            ? {
                name: editingRole.name,
                description: editingRole.description ?? "",
                permissions: permissionIds(editingRole.permissions),
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(deletingRole)}
        title="Eliminar rol"
        description={`¿Seguro que quieres eliminar el rol "${
          deletingRole?.name ?? ""
        }"? Los usuarios que lo tengan asignado quedarán sin ese rol.`}
        confirmLabel="Eliminar"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingRole(null)}
      />
    </div>
  );
}

function PermissionsTab() {
  const { items: perms, loading, error, reload } = useAsyncList<Permission>(
    permissionsApi.list
  );
  const permissions = getPermissions();

  const canCreate = permissions.includes("permissions:create");
  const canUpdate = permissions.includes("permissions:update");
  const canDelete = permissions.includes("permissions:delete");

  const [formOpen, setFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );
  const [deletingPermission, setDeletingPermission] =
    useState<Permission | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSubmit = async (values: PermissionFormValues) => {
    if (editingPermission) {
      await permissionsApi.update(editingPermission._id, values);
      toast.success("Permiso actualizado correctamente");
    } else {
      await permissionsApi.create(values);
      toast.success("Permiso creado correctamente");
    }
    reload();
  };

  const handleDelete = async () => {
    if (!deletingPermission) return;
    setDeleteLoading(true);
    try {
      await permissionsApi.remove(deletingPermission._id);
      toast.success("Permiso eliminado correctamente");
      setDeletingPermission(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el permiso."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Los permisos son los bloques que se asignan a cada rol.
        </p>
        {canCreate && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingPermission(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo permiso
          </Button>
        )}
      </div>

      <DataTableShell
        loading={loading}
        error={error}
        empty={perms.length === 0}
        emptyMessage="Aún no hay permisos creados."
      >
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-black/[.08] bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:bg-white/[.03] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Descripción
              </th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
            {perms.map((permission) => (
              <tr key={permission._id}>
                <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
                  {permission.name}
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                  {permission.description || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPermission(permission);
                          setFormOpen(true);
                        }}
                        aria-label="Editar permiso"
                        title="Editar"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingPermission(permission)}
                        aria-label="Eliminar permiso"
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

      <PermissionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={
          editingPermission
            ? {
                name: editingPermission.name,
                description: editingPermission.description ?? "",
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(deletingPermission)}
        title="Eliminar permiso"
        description={`¿Seguro que quieres eliminar el permiso "${
          deletingPermission?.name ?? ""
        }"? Se quitará de cualquier rol que lo tenga asignado.`}
        confirmLabel="Eliminar"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPermission(null)}
      />
    </div>
  );
}

function RolesPermisosContent() {
  const permissions = getPermissions();
  const canSeeRoles = permissions.includes("roles:read");
  const canSeePermissions = permissions.includes("permissions:read");

  const tabs = useMemo(() => {
    const list: { key: "roles" | "permisos"; label: string }[] = [];
    if (canSeeRoles) list.push({ key: "roles", label: "Roles" });
    if (canSeePermissions) list.push({ key: "permisos", label: "Permisos" });
    return list;
  }, [canSeeRoles, canSeePermissions]);

  const [activeTab, setActiveTab] = useState<"roles" | "permisos">(
    tabs[0]?.key ?? "roles"
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-10">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Roles y Permisos
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Controla qué puede hacer cada persona dentro del sistema.
        </p>
      </div>

      {tabs.length > 1 && (
        <div className="flex gap-1 border-b border-black/[.08] dark:border-white/[.145]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-foreground text-black dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "roles" && canSeeRoles && <RolesTab />}
      {activeTab === "permisos" && canSeePermissions && <PermissionsTab />}
    </div>
  );
}

export default function RolesPermisosPage() {
  return (
    <ProtectedRoute requiredPermission={["roles:read", "permissions:read"]}>
      <RolesPermisosContent />
    </ProtectedRoute>
  );
}
