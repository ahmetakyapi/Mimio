"use client";

import { useMemo } from "react";
import type { RecentSessionEntry, PlatformGameKey } from "@/lib/platform-data";
import { GAME_LABELS } from "@/lib/platform-data";

interface ClientProgressRadarProps {
  sessions: RecentSessionEntry[];
  clientId: string;
}

// SVG Radar/Spider chart showing performance across all game types
export function ClientProgressRadar({ sessions, clientId }: ClientProgressRadarProps) {
  const data = useMemo(() => {
    const clientSessions = sessions.filter(s => s.clientId === clientId);
    const games: PlatformGameKey[] = ["memory", "pairs", "pulse", "route", "difference", "scan", "logic"];

    // Per-game stats
    const gameStats = games.map(key => {
      const gameSessions = clientSessions.filter(s => s.gameKey === key);
      const best = gameSessions.length > 0 ? Math.max(...gameSessions.map(s => s.score)) : 0;
      const avg = gameSessions.length > 0 ? Math.round(gameSessions.reduce((s, x) => s + x.score, 0) / gameSessions.length) : 0;
      const count = gameSessions.length;
      // Recent trend
      const recent3 = gameSessions.slice(0, 3);
      const recentAvg = recent3.length > 0 ? Math.round(recent3.reduce((s, x) => s + x.score, 0) / recent3.length) : 0;
      return { key, label: GAME_LABELS[key], best, avg, count, recentAvg };
    });

    // Normalize scores to 0-1 range for radar
    const maxScore = Math.max(...gameStats.map(g => g.best), 1);

    return { gameStats, maxScore, totalSessions: clientSessions.length };
  }, [sessions, clientId]);

  if (data.totalSessions === 0) return null;

  const { gameStats, maxScore } = data;
  const n = gameStats.length;
  const cx = 120;
  const cy = 120;
  const maxR = 90;

  // Calculate polygon points
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / maxScore) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid lines
  const levels = [0.25, 0.5, 0.75, 1];

  // Best score polygon
  const bestPolygon = gameStats.map((g, i) => {
    const p = getPoint(i, g.best);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Recent avg polygon
  const recentPolygon = gameStats.map((g, i) => {
    const p = getPoint(i, g.recentAvg);
    return `${p.x},${p.y}`;
  }).join(" ");

  const GAME_COLORS: Record<string, string> = {
    memory: "#818cf8", pairs: "#34d399", pulse: "#f472b6",
    route: "#fb923c", difference: "#38bdf8", scan: "#a78bfa", logic: "#fbbf24",
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-(--color-text-muted)">Beceri Haritası</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-3 h-1.5 rounded-full" style={{ background: "rgba(99,102,241,0.5)" }} />
              <span className="text-[9px] text-(--color-text-muted)">En iyi</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.5)" }} />
              <span className="text-[9px] text-(--color-text-muted)">Son 3 ort.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <svg viewBox="0 0 240 240" className="w-full max-w-[280px]" style={{ height: "auto" }}>
            {/* Grid circles */}
            {levels.map(level => {
              const r = level * maxR;
              const points = Array.from({ length: n }, (_, i) => {
                const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              }).join(" ");
              return (
                <polygon key={level} points={points} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              );
            })}

            {/* Axis lines */}
            {gameStats.map((_, i) => {
              const p = getPoint(i, maxScore);
              return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />;
            })}

            {/* Best score area */}
            <polygon points={bestPolygon} fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" strokeLinejoin="round" />

            {/* Recent avg area */}
            <polygon points={recentPolygon} fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4 2" />

            {/* Data points */}
            {gameStats.map((g, i) => {
              const pBest = getPoint(i, g.best);
              const pRecent = getPoint(i, g.recentAvg);
              return (
                <g key={g.key}>
                  <circle cx={pBest.x} cy={pBest.y} r="3" fill="#6366f1" stroke="var(--color-surface-strong)" strokeWidth="1.5" />
                  <circle cx={pRecent.x} cy={pRecent.y} r="2.5" fill="#10b981" stroke="var(--color-surface-strong)" strokeWidth="1" />
                </g>
              );
            })}

            {/* Labels */}
            {gameStats.map((g, i) => {
              const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
              const labelR = maxR + 22;
              const x = cx + labelR * Math.cos(angle);
              const y = cy + labelR * Math.sin(angle);
              const color = GAME_COLORS[g.key] ?? "#94a3b8";
              return (
                <g key={`label-${g.key}`}>
                  <text x={x} y={y - 4} textAnchor="middle" fontSize="8" fontWeight="700" fill={color}>
                    {g.label.split(" ")[0]}
                  </text>
                  <text x={x} y={y + 6} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.35)">
                    {g.count > 0 ? `${g.best}p` : "—"}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Stats grid below radar */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {gameStats.filter(g => g.count > 0).slice(0, 4).map(g => {
            const color = GAME_COLORS[g.key] ?? "#94a3b8";
            const trend = g.recentAvg > g.avg ? "up" : g.recentAvg < g.avg * 0.85 ? "down" : "stable";
            return (
              <div key={g.key} className="text-center rounded-lg p-1.5" style={{ background: `${color}08` }}>
                <strong className="text-sm font-extrabold tabular-nums block" style={{ color }}>{g.best}</strong>
                <span className="text-[8px] text-(--color-text-muted) block">{g.label.split(" ")[0]}</span>
                <span className="text-[8px] font-bold" style={{ color: trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#f59e0b" }}>
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
