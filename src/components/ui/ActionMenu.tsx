"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";

export type ActionMenuItem = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

const MENU_WIDTH = 208;

export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({
        top: rect.bottom + 4,
        left: Math.min(
          Math.max(8, rect.right - MENU_WIDTH),
          window.innerWidth - MENU_WIDTH - 8
        ),
      });
    };
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Más acciones"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-lg p-2 text-zinc-500 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: MENU_WIDTH,
            }}
            className="z-[70] overflow-hidden rounded-lg border border-black/[.08] bg-white py-1 shadow-lg dark:border-white/[.145] dark:bg-[#111]"
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                    item.danger
                      ? "text-red-600 hover:bg-red-600/10 dark:text-red-400"
                      : "text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.08]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
