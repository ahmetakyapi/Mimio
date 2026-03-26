"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly action?: {
    label: string;
    onClick: () => void;
  };
  readonly compact?: boolean;
}

/**
 * Reusable empty state component for lists, dashboards, etc.
 * Replaces inline empty state implementations across MimioApp.
 */
export function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 px-4" : "py-16 px-6"}`}>
      <div
        className={`${compact ? "w-12 h-12 mb-3" : "w-16 h-16 mb-4"} rounded-2xl flex items-center justify-center`}
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.15)",
        }}>
        <Icon size={compact ? 20 : 28} className="text-(--color-primary)" style={{ opacity: 0.7 }} />
      </div>
      <h4 className={`text-(--color-text-strong) font-bold m-0 mb-1 ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </h4>
      <p className={`text-(--color-text-soft) m-0 max-w-xs ${compact ? "text-xs" : "text-sm"}`}>
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all active:scale-95 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            color: "#fff",
            boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
          }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
