"use client";

import type { LucideIcon } from "lucide-react";

interface GameCardProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly accent: string;
  readonly bestScore?: number;
  readonly plays?: number;
  readonly onClick: () => void;
  readonly compact?: boolean;
}

/**
 * Game selection card with score badge and category indicator.
 * Responsive: compact on mobile, expanded on desktop.
 */
export function GameCard({
  icon: Icon,
  title,
  description,
  category,
  accent,
  bestScore,
  plays,
  onClick,
  compact,
}: GameCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex ${compact ? "flex-row items-center gap-3 p-3" : "flex-col gap-2 p-4"} rounded-2xl text-left border-none cursor-pointer transition-all active:scale-[0.98] hover:-translate-y-0.5`}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-line)",
      }}
      aria-label={`${title} oyununu başlat`}>
      {/* Icon */}
      <div
        className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
        style={{
          background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
          border: `1px solid ${accent}30`,
        }}>
        <Icon size={compact ? 18 : 22} style={{ color: accent }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-bold text-(--color-text-strong) ${compact ? "text-sm" : "text-base"} truncate`}>
            {title}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              background: `${accent}12`,
              color: accent,
              border: `1px solid ${accent}20`,
            }}>
            {category}
          </span>
        </div>
        <p className={`text-(--color-text-soft) m-0 leading-snug ${compact ? "text-xs line-clamp-1" : "text-xs line-clamp-2"}`}>
          {description}
        </p>
      </div>

      {/* Score badge */}
      {bestScore !== undefined && bestScore > 0 && (
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-sm font-extrabold tabular-nums" style={{ color: accent }}>
            {bestScore}
          </span>
          {plays !== undefined && plays > 0 && (
            <span className="text-[9px] text-(--color-text-muted) font-medium">
              {plays}x
            </span>
          )}
        </div>
      )}
    </button>
  );
}
