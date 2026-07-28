"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  House,
  LogOut,
  Repeat,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { clearAuth, getCurrentUser, getPermissions } from "@/lib/auth-storage";

type NavItem = {
  label: string;
  href: string;
  permission: string | string[] | null;
  icon: LucideIcon;
};

type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

const NAV_TOP: NavItem[] = [
  { label: "Home", href: "/", permission: null, icon: Home },
];

const NAV_GROUPS: NavGroup[] = [
  {
    key: "administracion",
    label: "Administración",
    icon: Settings,
    items: [
      { label: "Usuarios", href: "/usuarios", permission: "users:read", icon: Users },
      {
        label: "Roles y Permisos",
        href: "/roles-permisos",
        permission: ["roles:read", "permissions:read"],
        icon: ShieldCheck,
      },
      { label: "Casas", href: "/casas", permission: "houses:read", icon: House },
    ],
  },
  {
    key: "gastos",
    label: "Gastos",
    icon: Wallet,
    items: [
      { label: "Gastos", href: "/gastos", permission: null, icon: Wallet },
      {
        label: "Gastos Programados",
        href: "/gastos-programados",
        permission: null,
        icon: Repeat,
      },
      { label: "Créditos", href: "/creditos", permission: null, icon: CreditCard },
    ],
  },
  {
    key: "carrito",
    label: "Carrito",
    icon: ShoppingCart,
    items: [
      {
        label: "Lista de Compras",
        href: "/lista-de-compras",
        permission: null,
        icon: ShoppingCart,
      },
    ],
  },
];

function canSee(permission: string | string[] | null, granted: string[]) {
  if (!permission) return true;
  if (Array.isArray(permission)) return permission.some((p) => granted.includes(p));
  return granted.includes(permission);
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const permissions = getPermissions();
  const user = getCurrentUser();
  const topItems = NAV_TOP.filter((item) => canSee(item.permission, permissions));
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item.permission, permissions)),
  })).filter((group) => group.items.length > 0);

  const isGroupOpen = (group: NavGroup) => {
    const isActive = group.items.some((item) => pathname === item.href);
    return openGroups[group.key] ?? isActive;
  };

  const toggleGroup = (group: NavGroup) => {
    setOpenGroups((prev) => ({ ...prev, [group.key]: !isGroupOpen(group) }));
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-foreground text-background"
        : "text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.08]"
    }`;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between overflow-y-auto border-r border-black/[.08] bg-white p-3 transition-transform duration-200 dark:border-white/[.145] dark:bg-[#0a0a0a] md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-64"}`}
      >
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <span
              className={`px-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 ${
                collapsed ? "md:hidden" : ""
              }`}
            >
              Menú
            </span>

            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Cerrar menú"
              className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.04] dark:text-zinc-400 dark:hover:bg-white/[.08] md:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              className="hidden rounded-lg p-2 text-zinc-500 hover:bg-black/[.04] dark:text-zinc-400 dark:hover:bg-white/[.08] md:block"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {topItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                  className={`${linkClass(active)} ${
                    collapsed ? "md:justify-center" : ""
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={collapsed ? "md:hidden" : ""}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {groups.map((group) => {
              const GroupIcon = group.icon;
              const groupActive = group.items.some(
                (item) => pathname === item.href
              );
              const open = isGroupOpen(group);

              return (
                <div key={group.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className={`w-full ${linkClass(false)} ${
                      collapsed ? "md:hidden" : ""
                    } ${groupActive ? "text-black dark:text-zinc-50" : ""}`}
                  >
                    <GroupIcon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`mt-1 flex flex-col gap-1 ${
                      open || collapsed ? "" : "hidden"
                    }`}
                  >
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onCloseMobile}
                          title={collapsed ? item.label : undefined}
                          className={`${linkClass(active)} pl-8 ${
                            collapsed ? "md:justify-center md:pl-3" : ""
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className={collapsed ? "md:hidden" : ""}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
          {user?.correo && (
            <p
              className={`truncate px-3 text-sm text-zinc-600 dark:text-zinc-400 ${
                collapsed ? "md:hidden" : ""
              }`}
            >
              {user.correo}
            </p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600/10 dark:text-red-400 ${
              collapsed ? "md:justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
