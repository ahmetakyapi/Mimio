"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: string | number;
  readonly trend?: { value: number; label: string };
  readonly accent?: string;
  readonly onClick?: () => void;
}

/**
 * Compact stat card for dashboard KPIs.
 * Works well on mobile (stacks in 2-col grid) and desktop (4-col).
 */
export function StatCard({ icon: Icon, label, value, trend, accent = "#6366f1", onClick }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="group relative flex flex-col gap-1.5 p-3 sm:p-4 rounded-2xl text-left border-none cursor-default transition-all"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-line)",
        cursor: onClick ? "pointer" : "default",
      }}
      aria-label={`${label}: ${value}`}>
      {/* Top row: icon + trend */}
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${accent}15`,
            border: `1px solid ${accent}25`,
          }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        {trend && (
          <div
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: isPositive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: isPositive ? "#10b981" : "#ef4444",
            }}>
            <TrendIcon size={10} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value */}
      <span className="text-xl sm:text-2xl font-extrabold text-(--color-text-strong) tabular-nums leading-none">
        {value}
      </span>

      {/* Label */}
      <span className="text-[11px] sm:text-xs text-(--color-text-soft) font-medium leading-tight">
        {label}
        {trend && (
          <span className="text-(--color-text-muted) ml-1">
            {trend.label}
          </span>
        )}
      </span>
    </button>
  );
}
