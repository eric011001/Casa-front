"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function GeneratedPasswordModal({
  open,
  onClose,
  correo,
  password,
}: {
  open: boolean;
  onClose: () => void;
  correo: string;
  password: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Contraseña copiada");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar la contraseña");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Contraseña temporal generada">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Comparte esta contraseña temporal con <strong>{correo}</strong>. Solo
        se muestra una vez — no podrás volver a consultarla después de cerrar
        esta ventana.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-black/[.08] bg-zinc-50 px-4 py-3 font-mono text-sm dark:border-white/[.145] dark:bg-white/[.04]">
        <span className="select-all break-all">{password}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar contraseña"
          className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.1]"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Entendido</Button>
      </div>
    </Modal>
  );
}
