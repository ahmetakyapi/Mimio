"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Calendar, Users, Gamepad2, Target, Clock, BarChart3 } from "lucide-react";
import type { RecentSessionEntry, PlatformGameKey } from "@/lib/platform-data";
import { GAME_LABELS } from "@/lib/platform-data";
import { formatDuration } from "@/lib/format-utils";

interface DashboardAnalyticsProps {
  sessions: RecentSessionEntry[];
  totalClients: number;
  totalGoals: number;
}

// ── Weekly summary card ──
export function WeeklySummaryCard({ sessions, totalClients }: DashboardAnalyticsProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = sessions.filter(s => new Date(s.playedAt) >= weekAgo);
    const lastWeek = sessions.filter(s => {
      const d = new Date(s.playedAt);
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const thisWeekAvg = thisWeek.length > 0 ? Math.round(thisWeek.reduce((s, x) => s + x.score, 0) / thisWeek.length) : 0;
    const lastWeekAvg = lastWeek.length > 0 ? Math.round(lastWeek.reduce((s, x) => s + x.score, 0) / lastWeek.length) : 0;
    const scoreDelta = lastWeekAvg > 0 ? Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100) : 0;

    const thisWeekClients = new Set(thisWeek.map(s => s.clientId).filter(Boolean)).size;
    const thisWeekDuration = thisWeek.reduce((s, x) => s + (x.durationSeconds ?? 0), 0);

    // Most played game this week
    const gameCounts: Record<string, number> = {};
    thisWeek.forEach(s => { gameCounts[s.gameKey] = (gameCounts[s.gameKey] ?? 0) + 1; });
    const topGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0];

    // Daily breakdown (last 7 days)
    const dailyCounts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      dailyCounts.push(thisWeek.filter(s => s.playedAt.startsWith(dateStr)).length);
    }
    const maxDaily = Math.max(...dailyCounts, 1);

    return {
      thisWeekCount: thisWeek.length,
      lastWeekCount: lastWeek.length,
      thisWeekAvg,
      scoreDelta,
      thisWeekClients,
      thisWeekDuration,
      topGame: topGame ? { key: topGame[0] as PlatformGameKey, count: topGame[1] } : null,
      dailyCounts,
      maxDaily,
    };
  }, [sessions]);

  const dayLabels = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
  const today = new Date().getDay(); // 0=Sun
  const reorderedLabels = [...Array(7)].map((_, i) => {
    const dayIndex = (today - 6 + i + 7) % 7;
    return dayLabels[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert JS day (0=Sun) to TR day
  });

  const sessionDelta = analytics.lastWeekCount > 0
    ? Math.round(((analytics.thisWeekCount - analytics.lastWeekCount) / analytics.lastWeekCount) * 100)
    : 0;

  return (
    <div className="rounded-2xl sm:rounded-3xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
      {/* Header gradient bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }} />

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
              <Calendar size={15} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Haftalık Özet</h3>
              <p className="text-[10px] text-(--color-text-muted) m-0">Son 7 gün</p>
            </div>
          </div>
          {sessionDelta !== 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{
              background: sessionDelta > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: sessionDelta > 0 ? "#10b981" : "#ef4444",
              border: `1px solid ${sessionDelta > 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}>
              {sessionDelta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {sessionDelta > 0 ? "+" : ""}{sessionDelta}%
            </div>
          )}
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { icon: Gamepad2, label: "Seans", value: analytics.thisWeekCount, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { icon: Users, label: "Aktif Danışan", value: analytics.thisWeekClients, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
            { icon: Target, label: "Ort. Skor", value: analytics.thisWeekAvg, color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
            { icon: Clock, label: "Toplam Süre", value: formatDuration(analytics.thisWeekDuration), color: "#10b981", bg: "rgba(16,185,129,0.08)" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg, border: `1px solid ${color}15` }}>
              <Icon size={14} className="mx-auto mb-1" style={{ color, opacity: 0.7 }} />
              <strong className="text-lg font-extrabold block tabular-nums" style={{ color }}>{value}</strong>
              <span className="text-[10px] text-(--color-text-muted) font-semibold">{label}</span>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        <div className="rounded-xl p-3" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line-soft)" }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-2">Günlük Dağılım</p>
          <div className="flex items-end justify-between gap-1" style={{ height: 48 }}>
            {analytics.dailyCounts.map((count, i) => {
              const height = Math.max(4, (count / analytics.maxDaily) * 44);
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md transition-all duration-500" style={{
                    height,
                    background: isToday
                      ? "linear-gradient(180deg, #6366f1, #8b5cf6)"
                      : count > 0 ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.04)",
                    boxShadow: isToday && count > 0 ? "0 2px 8px rgba(99,102,241,0.4)" : "none",
                  }} />
                  <span className={`text-[8px] font-bold ${isToday ? "text-(--color-primary)" : "text-(--color-text-muted)"}`}>
                    {reorderedLabels[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top game badge */}
        {analytics.topGame && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <BarChart3 size={12} style={{ color: "#818cf8" }} />
            <span className="text-xs text-(--color-text-soft)">
              En çok oynanan: <strong className="text-(--color-text-strong)">{GAME_LABELS[analytics.topGame.key]}</strong>
              <span className="text-(--color-text-muted)"> ({analytics.topGame.count} seans)</span>
            </span>
          </div>
        )}

        {/* Score trend indicator */}
        {analytics.scoreDelta !== 0 && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{
            background: analytics.scoreDelta > 0 ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${analytics.scoreDelta > 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}`,
          }}>
            {analytics.scoreDelta > 0 ? <TrendingUp size={12} style={{ color: "#10b981" }} /> : <TrendingDown size={12} style={{ color: "#ef4444" }} />}
            <span className="text-xs text-(--color-text-soft)">
              Skor ortalaması geçen haftaya göre{" "}
              <strong style={{ color: analytics.scoreDelta > 0 ? "#10b981" : "#ef4444" }}>
                %{Math.abs(analytics.scoreDelta)} {analytics.scoreDelta > 0 ? "arttı" : "düştü"}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Game distribution radar ──
interface GameRadarProps {
  sessions: RecentSessionEntry[];
}

export function GameDistributionChart({ sessions }: GameRadarProps) {
  const gameStats = useMemo(() => {
    const stats: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
    for (const s of sessions) {
      if (!stats[s.gameKey]) stats[s.gameKey] = { count: 0, avgScore: 0, totalScore: 0 };
      stats[s.gameKey].count++;
      stats[s.gameKey].totalScore += s.score;
    }
    for (const key of Object.keys(stats)) {
      stats[key].avgScore = Math.round(stats[key].totalScore / stats[key].count);
    }
    return stats;
  }, [sessions]);

  const GAME_COLORS: Record<string, string> = {
    memory: "#818cf8", pairs: "#34d399", pulse: "#f472b6",
    route: "#fb923c", difference: "#38bdf8", scan: "#a78bfa", logic: "#fbbf24",
  };

  const entries = Object.entries(gameStats).sort((a, b) => b[1].count - a[1].count);
  const maxCount = Math.max(...entries.map(e => e[1].count), 1);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
      <div className="p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-3">Oyun Dağılımı</p>
        <div className="space-y-2">
          {entries.map(([key, data]) => {
            const pct = Math.round((data.count / maxCount) * 100);
            const color = GAME_COLORS[key] ?? "#94a3b8";
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-bold text-(--color-text-soft) w-20 truncate">{GAME_LABELS[key as PlatformGameKey] ?? key}</span>
                <div className="flex-1 h-5 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(pct, 8)}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }}>
                    <span className="text-[9px] font-extrabold text-white/80">{data.count}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold tabular-nums w-10 text-right" style={{ color }}>ort. {data.avgScore}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Client activity overview ──
interface ClientActivityProps {
  sessions: RecentSessionEntry[];
  clientNames: Record<string, string>;
}

export function ClientActivityOverview({ sessions, clientNames }: ClientActivityProps) {
  const clientStats = useMemo(() => {
    const stats: Record<string, { sessions: number; lastPlayed: string; avgScore: number; totalScore: number }> = {};
    for (const s of sessions) {
      const cid = s.clientId ?? "unknown";
      if (!stats[cid]) stats[cid] = { sessions: 0, lastPlayed: "", avgScore: 0, totalScore: 0 };
      stats[cid].sessions++;
      stats[cid].totalScore += s.score;
      if (!stats[cid].lastPlayed || s.playedAt > stats[cid].lastPlayed) stats[cid].lastPlayed = s.playedAt;
    }
    for (const key of Object.keys(stats)) {
      stats[key].avgScore = Math.round(stats[key].totalScore / stats[key].sessions);
    }
    return Object.entries(stats)
      .map(([id, data]) => ({ id, name: clientNames[id] ?? "Danışan", ...data }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);
  }, [sessions, clientNames]);

  if (clientStats.length === 0) return null;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
      <div className="p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-3">En Aktif Danışanlar</p>
        <div className="space-y-2">
          {clientStats.map((client, i) => {
            const daysSince = client.lastPlayed ? Math.floor((Date.now() - new Date(client.lastPlayed).getTime()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div key={client.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "var(--color-surface-elevated)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b"][i]}, ${["#4f46e5","#7c3aed","#0891b2","#059669","#d97706"][i]})` }}>
                  {client.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-(--color-text-strong) m-0 truncate">{client.name}</p>
                  <p className="text-[10px] text-(--color-text-muted) m-0">{client.sessions} seans · ort. {client.avgScore}p</p>
                </div>
                {daysSince !== null && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{
                    background: daysSince === 0 ? "rgba(16,185,129,0.1)" : daysSince <= 3 ? "rgba(99,102,241,0.1)" : "rgba(245,158,11,0.1)",
                    color: daysSince === 0 ? "#10b981" : daysSince <= 3 ? "#818cf8" : "#f59e0b",
                  }}>
                    {daysSince === 0 ? "Bugün" : `${daysSince}g önce`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
