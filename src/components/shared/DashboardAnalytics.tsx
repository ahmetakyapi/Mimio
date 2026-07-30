"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Calendar, Users, Gamepad2, Target, Clock, BarChart3 } from "lucide-react";
import type { RecentSessionEntry, PlatformGameKey } from "@/lib/platform-data";
import { GAME_LABELS } from "@/lib/platform-data";
import { gameAccent } from "@/lib/game-constants";
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

    /* Günlük dağılım — son 7 gün.
       Önceki sürüm günü `toISOString().slice(0,10)` ile eşliyordu; bu UTC
       tarihi, `setDate` ise yerel tarih üretiyor. UTC+3'te gece yarısından
       sonraki seanslar bir önceki güne düşüyordu. Artık karşılaştırma yerel
       gün sınırlarıyla yapılıyor ve etiket de aynı Date nesnesinden gelir. */
    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (6 - i));
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return {
        label: start.toLocaleDateString("tr-TR", { weekday: "short" }),
        count: sessions.filter((s) => {
          const t = new Date(s.playedAt);
          return t >= start && t < end;
        }).length,
      };
    });
    const maxDaily = Math.max(...days.map((d) => d.count), 1);

    return {
      thisWeekCount: thisWeek.length,
      lastWeekCount: lastWeek.length,
      thisWeekAvg,
      scoreDelta,
      thisWeekClients,
      thisWeekDuration,
      topGame: topGame ? { key: topGame[0] as PlatformGameKey, count: topGame[1] } : null,
      days,
      maxDaily,
    };
  }, [sessions]);

  const sessionDelta = analytics.lastWeekCount > 0
    ? Math.round(((analytics.thisWeekCount - analytics.lastWeekCount) / analytics.lastWeekCount) * 100)
    : 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
      <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-(--color-text-muted)" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">Haftalık Özet</span>
        </div>
        {sessionDelta !== 0 ? (
          <span className="numeral flex items-center gap-1 text-[11px] font-bold"
            style={{ color: sessionDelta > 0 ? "var(--color-accent-green)" : "var(--color-accent-red)" }}>
            {sessionDelta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            %{Math.abs(sessionDelta)}
          </span>
        ) : (
          <span className="text-[10px] text-(--color-text-muted)">son 7 gün</span>
        )}
      </div>

      {/* Dört okuma — renkli kutular yerine kılcal ayraçlı ölçek.
          Ayraçlar `gap-px` + zemin rengiyle çiziliyor; iki sütuna sarınca
          da doğru kalır, elle border hesabı gerekmez. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "var(--color-line)" }}>
        {[
          { icon: Gamepad2, label: "Seans", value: String(analytics.thisWeekCount) },
          { icon: Users, label: "Aktif Danışan", value: String(analytics.thisWeekClients) },
          { icon: Target, label: "Ort. Skor", value: String(analytics.thisWeekAvg) },
          { icon: Clock, label: "Toplam Süre", value: formatDuration(analytics.thisWeekDuration) },
        ].map(({ icon: Icon, label, value }) => {
          /* `.numeral` (mono) yalnızca saf sayılara uygulanır. "70 dk 16 sn"
             gibi birim taşıyan değerler monoda harf aralığı yüzünden
             dağılıyor; onlar gövde yüzünde tabular rakamla dizilir. */
          const pureNumber = /^\d+$/.test(value);
          return (
            <div key={label} className="px-4 py-3.5" style={{ background: "var(--color-surface-strong)" }}>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">
                <Icon size={11} />
                {label}
              </span>
              <strong className={`block font-extrabold leading-none mt-2 text-(--color-text-strong) ${pureNumber ? "numeral text-2xl" : "tabular-nums text-lg"}`}>
                {value}
              </strong>
            </div>
          );
        })}
      </div>

      {/* Günlük dağılım — degradesiz, hâlesiz; bugünün sütunu mürekkep,
          diğerleri açık ton, boş günler kılcal taban çizgisi. */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--color-line)" }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) m-0 mb-3">Günlük Dağılım</p>
        <div className="flex items-end justify-between gap-1.5" style={{ height: 60 }}>
          {analytics.days.map((day, i) => {
            const isToday = i === analytics.days.length - 1;
            const height = day.count > 0 ? Math.max(6, (day.count / analytics.maxDaily) * 44) : 2;
            return (
              <div key={day.label + i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <span className="numeral text-[10px] text-(--color-text-muted)">{day.count > 0 ? day.count : ""}</span>
                <span className="w-full max-w-[3.5rem] rounded-[2px]"
                  style={{
                    height,
                    background: day.count === 0
                      ? "var(--color-line-strong)"
                      : isToday ? "var(--color-primary)" : "color-mix(in srgb, var(--color-primary) 32%, transparent)",
                  }} />
                <span className={`text-[10px] ${isToday ? "font-bold text-(--color-text-body)" : "text-(--color-text-muted)"}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {(analytics.topGame || analytics.scoreDelta !== 0) && (
        <div className="px-4 py-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--color-line)" }}>
          {analytics.topGame && (
            <span className="flex items-center gap-2 text-xs text-(--color-text-soft)">
              <BarChart3 size={12} className="text-(--color-text-muted) shrink-0" />
              En çok oynanan: <strong className="text-(--color-text-strong) font-semibold">{GAME_LABELS[analytics.topGame.key]}</strong>
              <span className="text-(--color-text-muted)">
                <span className="numeral">{analytics.topGame.count}</span> seans
              </span>
            </span>
          )}
          {analytics.scoreDelta !== 0 && (
            <span className="flex items-center gap-2 text-xs text-(--color-text-soft)">
              {analytics.scoreDelta > 0
                ? <TrendingUp size={12} className="shrink-0" style={{ color: "var(--color-accent-green)" }} />
                : <TrendingDown size={12} className="shrink-0" style={{ color: "var(--color-accent-red)" }} />}
              Skor ortalaması geçen haftaya göre{" "}
              <strong className="font-semibold" style={{ color: analytics.scoreDelta > 0 ? "var(--color-accent-green)" : "var(--color-accent-red)" }}>
                %{Math.abs(analytics.scoreDelta)} {analytics.scoreDelta > 0 ? "arttı" : "düştü"}
              </strong>
            </span>
          )}
        </div>
      )}
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

  const entries = Object.entries(gameStats).sort((a, b) => b[1].count - a[1].count);
  const maxCount = Math.max(...entries.map(e => e[1].count), 1);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">Oyun Dağılımı</span>
      </div>
      <div className="p-4 space-y-2.5">
        {entries.map(([key, data]) => {
          const pct = Math.round((data.count / maxCount) * 100);
          /* Renk oyunun beceri alanından gelir; elle yazılmış oyun-renk
             tablosu uygulamanın geri kalanıyla çelişiyordu. */
          const color = gameAccent(key);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs font-medium text-(--color-text-body) w-24 truncate shrink-0">
                {GAME_LABELS[key as PlatformGameKey] ?? key}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-elevated)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 4)}%`, background: color }} />
              </div>
              <span className="numeral text-[11px] font-bold text-(--color-text-strong) w-6 text-right shrink-0">{data.count}</span>
              <span className="numeral text-[11px] text-(--color-text-muted) w-16 text-right shrink-0">ort. {data.avgScore}</span>
            </div>
          );
        })}
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
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">En Aktif Danışanlar</span>
      </div>
      <div className="flex flex-col">
        {clientStats.map((client, i) => {
          const daysSince = client.lastPlayed ? Math.floor((Date.now() - new Date(client.lastPlayed).getTime()) / (1000 * 60 * 60 * 24)) : null;
          return (
            <div key={client.id} className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i > 0 ? "1px solid var(--color-line-soft)" : undefined }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                {client.name[0]?.toLocaleUpperCase("tr") ?? "?"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-(--color-text-strong) m-0 truncate">{client.name}</p>
                <p className="text-[11px] text-(--color-text-muted) m-0 mt-0.5">
                  <span className="numeral">{client.sessions}</span> seans · ort. <span className="numeral">{client.avgScore}</span> puan
                </p>
              </div>
              {daysSince !== null && (
                <span className="text-[11px] shrink-0"
                  style={{ color: daysSince <= 3 ? "var(--color-text-soft)" : "var(--color-signal)" }}>
                  {daysSince === 0 ? "Bugün" : `${daysSince} gün önce`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
