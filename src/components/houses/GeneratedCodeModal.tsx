"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function GeneratedCodeModal({
  open,
  onClose,
  houseName,
  code,
}: {
  open: boolean;
  onClose: () => void;
  houseName: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el código");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Código de acceso generado">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Comparte este código con quienes quieras invitar a <strong>{houseName}</strong>.
        Es reutilizable y no expira, pero si lo vuelves a generar, el anterior deja de
        funcionar (quienes ya se unieron no se ven afectados).
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-black/[.08] bg-zinc-50 px-4 py-3 font-mono text-lg tracking-widest dark:border-white/[.145] dark:bg-white/[.04]">
        <span className="select-all break-all">{code}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar código"
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
