"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: "danger" | "default";
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * Accessible confirmation dialog with focus trap.
 * Used for destructive actions like archive, delete, logout.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "İptal",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus trap: auto-focus confirm button on open
  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(4,8,18,0.8)", backdropFilter: "blur(4px)" }}
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden result-overlay-in"
        style={{
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-line-strong)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
        <div className="p-6">
          <h3
            id="confirm-dialog-title"
            className="text-(--color-text-strong) font-bold text-lg m-0 mb-2">
            {title}
          </h3>
          <p
            id="confirm-dialog-desc"
            className="text-(--color-text-soft) text-sm m-0 mb-6 leading-relaxed">
            {description}
          </p>
          <div className="flex gap-3">
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-all active:scale-95"
              style={{
                background: isDanger
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "#fff",
                boxShadow: isDanger
                  ? "0 4px 14px rgba(239,68,68,0.3)"
                  : "0 4px 14px rgba(99,102,241,0.3)",
              }}>
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
              style={{
                background: "var(--color-surface-elevated)",
                color: "var(--color-text-body)",
                border: "1px solid var(--color-line)",
              }}>
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
