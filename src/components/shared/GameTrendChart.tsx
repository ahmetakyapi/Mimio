"use client";

import { useMemo, useState } from "react";
import type { RecentSessionEntry, PlatformGameKey } from "@/lib/platform-data";
import { GAME_LABELS } from "@/lib/platform-data";
import { gameAccent } from "@/lib/game-constants";

/**
 * Oyun bazlı skor trendi — her oyun bir çizgi, her nokta o günün en yüksek
 * skoru.
 *
 * Bu grafik daha önce MimioApp'in içinde, "Skorlar" sekmesinin koşullu JSX'i
 * içindeki bir IIFE olarak duruyordu ve orada `useState` çağırıyordu. Sekme
 * değişince MimioApp'in kanca sayısı da değişiyor, React "Rendered more hooks
 * than during the previous render" hatasıyla tüm ekranı hata sınırına
 * düşürüyordu — yani Skorlar sekmesi hiç açılmıyordu. Kanca artık kendi
 * bileşeninde.
 *
 * İki şey daha düzeldi: eksen yazıları `rgba(255,255,255,…)` idi ve açık
 * temada görünmüyordu; çizgi renkleri de elle yazılmış bir tablodan geliyor,
 * "logic" oyununu hiç tanımıyordu.
 */

interface GameTrendChartProps {
  sessions: RecentSessionEntry[];
}

type SeriesPoint = { date: string; score: number; x: number; y: number };

const W = 420;
const H = 120;
const PAD_L = 22;
const PAD_R = 10;
const PAD_T = 10;
const PAD_B = 22;

export function GameTrendChart({ sessions }: GameTrendChartProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const model = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => (a.playedAt ?? "").localeCompare(b.playedAt ?? ""));
    const allDates = Array.from(new Set(sorted.map((s) => (s.playedAt ?? "").slice(0, 10)))).sort();
    if (allDates.length < 2) return null;

    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const maxV = Math.max(...sorted.map((s) => s.score), 1);
    const toX = (date: string) => PAD_L + (allDates.indexOf(date) / (allDates.length - 1)) * innerW;
    const toY = (score: number) => PAD_T + innerH - (score / maxV) * innerH;

    const series = Array.from(new Set(sorted.map((s) => s.gameKey)))
      .map((key) => {
        /* Aynı günde birden çok tur oynanmışsa o günün en iyisi alınır. */
        const byDate: Record<string, number> = {};
        for (const s of sorted.filter((x) => x.gameKey === key)) {
          const d = (s.playedAt ?? "").slice(0, 10);
          byDate[d] = Math.max(byDate[d] ?? 0, s.score);
        }
        const points: SeriesPoint[] = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, score]) => ({ date, score, x: toX(date), y: toY(score) }));
        return { key, color: gameAccent(key), points };
      })
      .filter((s) => s.points.length >= 1);

    return { allDates, maxV, innerH, series };
  }, [sessions]);

  if (!model) return null;
  const { allDates, maxV, innerH, series } = model;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: "1px solid var(--color-line)" }}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">Oyun Bazlı Skor Trendi</span>
        <div className="flex flex-wrap gap-1.5">
          {series.map((s) => {
            const on = activeGame === s.key;
            return (
              <button key={s.key} type="button"
                aria-pressed={on}
                className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md cursor-pointer transition-opacity"
                style={{
                  background: on ? `color-mix(in srgb, ${s.color} 14%, transparent)` : "transparent",
                  border: "1px solid var(--color-line)",
                  color: "var(--color-text-body)",
                  opacity: activeGame && !on ? 0.45 : 1,
                }}
                onClick={() => setActiveGame((v) => (v === s.key ? null : s.key))}>
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: s.color }} />
                {GAME_LABELS[s.key as PlatformGameKey] ?? s.key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "8rem" }} role="img"
          aria-label="Oyun bazlı günlük en yüksek skor eğrileri">
          {[0, 0.5, 1].map((frac) => {
            const y = PAD_T + innerH - frac * innerH;
            return (
              <g key={frac}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <text x={PAD_L - 5} y={y + 3} fontSize="8" fill="var(--color-text-disabled)" textAnchor="end">{Math.round(frac * maxV)}</text>
              </g>
            );
          })}

          {series.map((s) => {
            const fade = activeGame !== null && activeGame !== s.key;
            if (s.points.length < 2) {
              const p = s.points[0];
              return p ? <circle key={s.key} cx={p.x} cy={p.y} r="3.5" fill={s.color} opacity={fade ? 0.18 : 0.9} /> : null;
            }
            const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
            return (
              <g key={s.key} opacity={fade ? 0.18 : 1} style={{ transition: "opacity 0.2s" }}>
                <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {s.points.map((p) => (
                  <circle key={p.date} cx={p.x} cy={p.y} r="2.5" fill={s.color} stroke="var(--color-surface-strong)" strokeWidth="1.5">
                    <title>{`${GAME_LABELS[s.key as PlatformGameKey] ?? s.key} · ${p.date} · ${p.score}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}

          {[allDates[0], allDates[allDates.length - 1]].map((d, i) => (
            <text key={d} x={i === 0 ? PAD_L : W - PAD_R} y={H - 5} fontSize="8"
              fill="var(--color-text-disabled)" textAnchor={i === 0 ? "start" : "end"}>{d}</text>
          ))}
        </svg>
      </div>

      <p className="text-[11px] text-(--color-text-muted) px-4 pb-3.5 pt-1 m-0">
        Her oyun için günlük en yüksek skor. Etikete tıklayarak tek oyuna odaklanın.
      </p>
    </div>
  );
}
