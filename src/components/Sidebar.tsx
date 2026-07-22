"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  House,
  LogOut,
  ShieldCheck,
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

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", permission: null, icon: Home },
  { label: "Usuarios", href: "/usuarios", permission: "users:read", icon: Users },
  {
    label: "Roles y Permisos",
    href: "/roles-permisos",
    permission: ["roles:read", "permissions:read"],
    icon: ShieldCheck,
  },
  { label: "Casas", href: "/casas", permission: "houses:read", icon: House },
  { label: "Gastos", href: "/gastos", permission: null, icon: Wallet },
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

  const permissions = getPermissions();
  const user = getCurrentUser();
  const items = NAV_ITEMS.filter((item) => canSee(item.permission, permissions));

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-black/[.08] bg-white p-3 transition-transform duration-200 dark:border-white/[.145] dark:bg-[#0a0a0a] md:static md:z-auto md:translate-x-0 md:transition-[width] ${
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
            {items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    collapsed ? "md:justify-center" : ""
                  } ${
                    active
                      ? "bg-foreground text-background"
                      : "text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.08]"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={collapsed ? "md:hidden" : ""}>
                    {item.label}
                  </span>
                </Link>
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
