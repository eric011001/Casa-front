"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/auth.api";
import {
  clearAuth,
  getPermissions,
  getToken,
  permissionsAreEqual,
  setPermissions,
} from "@/lib/auth-storage";
import { getErrorStatus } from "@/lib/http-error";

type GuardStatus = "checking" | "authorized" | "unauthorized";

export function useAuthGuard(requiredPermission?: string | string[]) {
  const router = useRouter();
  const [status, setStatus] = useState<GuardStatus>("checking");
  const [permissions, setLoadedPermissions] = useState<string[]>([]);

  const required = Array.isArray(requiredPermission)
    ? requiredPermission
    : requiredPermission
      ? [requiredPermission]
      : [];
  const requiredKey = required.join(",");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      let currentPermissions = getPermissions();

      try {
        const fresh = await authApi.me();
        if (!permissionsAreEqual(currentPermissions, fresh.permissions)) {
          setPermissions(fresh.permissions);
        }
        currentPermissions = fresh.permissions;
      } catch (error) {
        if (getErrorStatus(error) === 401) {
          clearAuth();
          router.replace("/login");
          return;
        }
      }

      if (cancelled) return;

      setLoadedPermissions(currentPermissions);
      setStatus(
        required.length > 0 &&
          !required.some((permission) => currentPermissions.includes(permission))
          ? "unauthorized"
          : "authorized"
      );
    };

    check();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredKey, router]);

  return { status, permissions };
}
