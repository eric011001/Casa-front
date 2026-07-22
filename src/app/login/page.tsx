"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/auth.api";
import { setToken, setPermissions } from "@/lib/auth-storage";
import { getErrorMessage } from "@/lib/http-error";
import { PasswordField } from "@/components/ui/PasswordField";

type Step = "login" | "reset-password";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("login");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authApi.login(correo, password);

      if (data.requiresPasswordReset) {
        setInfo(data.message);
        setStep("reset-password");
        return;
      }

      setToken(data.token);
      setPermissions(data.permissions ?? []);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo iniciar sesión."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.resetPassword(correo, password, newPassword);
      setToken(data.token);
      setPermissions(data.permissions ?? []);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo actualizar la contraseña."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-8 font-sans dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-6 sm:p-8 dark:border-white/[.145] dark:bg-[#0a0a0a]">
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">
          {step === "login" ? "Iniciar sesión" : "Actualizar contraseña"}
        </h1>

        {info && step === "reset-password" && (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            {info}
          </p>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {step === "login" ? (
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="correo"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Correo
              </label>
              <input
                id="correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-black outline-none focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.3]"
              />
            </div>

            <PasswordField
              id="password"
              label="Contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
            <PasswordField
              id="newPassword"
              label="Nueva contraseña"
              required
              minLength={8}
              maxLength={72}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <PasswordField
              id="confirmNewPassword"
              label="Confirmar nueva contraseña"
              required
              minLength={8}
              maxLength={72}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
