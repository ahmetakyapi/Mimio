"use client";

import { useEffect, useState } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
}

const ToastStore = {
  items: [] as ToastItem[],
  listeners: new Set<() => void>(),
};

export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const sync = () => setItems([...ToastStore.items]);
    ToastStore.listeners.add(sync);
    return () => { ToastStore.listeners.delete(sync); };
  }, []);
  return items;
}

export function showToast(message: string, type: ToastItem["type"] = "success") {
  const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  ToastStore.items = [...ToastStore.items, { id, message, type }];
  ToastStore.listeners.forEach(fn => fn());
  setTimeout(() => {
    ToastStore.items = ToastStore.items.filter(t => t.id !== id);
    ToastStore.listeners.forEach(fn => fn());
  }, 3800);
}

export function ToastContainer() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  const colors = { success: "#10b981", info: "#6366f1", warning: "#f59e0b" };
  const icons = { success: "✓", info: "ℹ", warning: "⚠" };
  return (
    <div
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-24 lg:bottom-6 lg:right-6 z-[99999] flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${colors[t.type]}ee, ${colors[t.type]}bb)`,
            boxShadow: `0 8px 32px ${colors[t.type]}55, 0 2px 8px rgba(0,0,0,0.3)`,
            backdropFilter: "blur(12px)",
            border: `1px solid ${colors[t.type]}44`,
            animation: "page-fade-in 0.3s ease both",
            minWidth: "180px",
          }}>
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0"
            style={{ background: "rgba(255,255,255,0.25)" }} aria-hidden="true">{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
