"use client";

import type { ReactNode } from "react";

export type ArenaCueState = "idle" | "watch" | "act" | "correct" | "wrong" | "done";

export interface ArenaStat {
  /** Kısa büyük harf etiket — "SERİ", "TUR", "SKOR" */
  readonly label: string;
  readonly value: string | number;
  /** Vurgulu gösterim (oyunun ana metriği) */
  readonly tone?: "default" | "accent";
  /** Dar ekranda gizlenebilir */
  readonly optional?: boolean;
}

export interface GameArenaProps {
  /** Oyun adı — "Sıra Hafızası" */
  readonly name: string;
  /** Beceri alanı — "Çalışma belleği" */
  readonly kicker: string;
  /** Oyunun vurgu rengi */
  readonly accent: string;
  /** Sağ üstteki canlı sayaçlar */
  readonly stats: readonly ArenaStat[];
  /** Tur ilerlemesi; verilirse ray altında ince bant çizilir */
  readonly progress?: { readonly current: number; readonly total: number };
  /** Ekrandaki en büyük metin: "şimdi ne yapmalıyım?" */
  readonly cue: string;
  /** Yönergeyi bir cümlede açan yardımcı satır */
  readonly cueNote?: string;
  readonly cueState?: ArenaCueState;
  /** Oyun tahtası */
  readonly children: ReactNode;
  /** Geniş tahtalar (4 sütun ızgara, kart destesi) için */
  readonly boardSize?: "default" | "wide";
  /** Alt çubuktaki birincil eylem */
  readonly primaryAction: { readonly label: string; readonly onClick: () => void; readonly disabled?: boolean };
  /** İsteğe bağlı ikincil eylem */
  readonly secondaryAction?: { readonly label: string; readonly onClick: () => void; readonly disabled?: boolean };
  /** Klavye kısayolu ipucu */
  readonly hint?: string;
  /** Sonuç ekranı gibi tam kaplayan katmanlar */
  readonly overlay?: ReactNode;
}

export function GameArena({
  name,
  kicker,
  accent,
  stats,
  progress,
  cue,
  cueNote,
  cueState = "idle",
  children,
  boardSize = "default",
  primaryAction,
  secondaryAction,
  hint,
  overlay,
}: GameArenaProps) {
  const progressPct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  return (
    <section
      className="arena"
      style={{ ["--arena-accent" as string]: accent }}
      aria-label={`${name} oyun alanı`}
    >
      {overlay}

      <header className="arena-rail">
        <div className="arena-rail-title">
          <span className="arena-rail-name">{name}</span>
          <span className="arena-rail-kicker">{kicker}</span>
        </div>
        <div className="arena-stats">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="arena-stat"
              data-tone={stat.tone ?? "default"}
              data-optional={stat.optional ? "true" : undefined}
            >
              <span className="arena-stat-label">{stat.label}</span>
              <span className="arena-stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      </header>

      {progress && progress.total > 0 && (
        <div
          className="arena-progress"
          role="progressbar"
          aria-valuenow={progress.current}
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-label={`Tur ${progress.current} / ${progress.total}`}
        >
          <div className="arena-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      <div className="arena-cue" data-state={cueState}>
        <p className="arena-cue-title" aria-live="polite">{cue}</p>
        {cueNote && <p className="arena-cue-note">{cueNote}</p>}
      </div>

      <div className="arena-board">
        <div className="arena-board-inner" data-size={boardSize}>{children}</div>
      </div>

      <footer className="arena-actions">
        <button
          type="button"
          className="arena-btn arena-btn-primary"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          {primaryAction.label}
        </button>
        {secondaryAction && (
          <button
            type="button"
            className="arena-btn arena-btn-ghost"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.label}
          </button>
        )}
        {hint && <span className="arena-actions-end arena-hint">{hint}</span>}
      </footer>
    </section>
  );
}
