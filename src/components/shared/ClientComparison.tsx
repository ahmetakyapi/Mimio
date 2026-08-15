"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import type { ClientProfile, RecentSessionEntry, PlatformGameKey } from "@/lib/platform-data";
import { GAME_LABELS } from "@/lib/platform-data";
import { formatDuration } from "@/lib/format-utils";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ClientComparisonProps {
  clientA: ClientProfile;
  clientB: ClientProfile;
  sessions: RecentSessionEntry[];
  onClose: () => void;
}

interface ClientMetrics {
  totalSessions: number;
  avgScore: number;
  bestScore: number;
  totalDuration: number;
  avgDuration: number;
  gamesPlayed: Set<string>;
  gameScores: Record<string, { avg: number; best: number; count: number }>;
  trend: "improving" | "stable" | "declining";
}

function computeMetrics(sessions: RecentSessionEntry[]): ClientMetrics {
  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0 ? Math.round(sessions.reduce((s, x) => s + x.score, 0) / totalSessions) : 0;
  const bestScore = totalSessions > 0 ? Math.max(...sessions.map(s => s.score)) : 0;
  const totalDuration = sessions.reduce((s, x) => s + (x.durationSeconds ?? 0), 0);
  const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
  const gamesPlayed = new Set(sessions.map(s => s.gameKey));

  const gameScores: Record<string, { avg: number; best: number; count: number }> = {};
  for (const s of sessions) {
    if (!gameScores[s.gameKey]) gameScores[s.gameKey] = { avg: 0, best: 0, count: 0 };
    gameScores[s.gameKey].count++;
    gameScores[s.gameKey].best = Math.max(gameScores[s.gameKey].best, s.score);
  }
  for (const key of Object.keys(gameScores)) {
    const gameSessions = sessions.filter(s => s.gameKey === key);
    gameScores[key].avg = Math.round(gameSessions.reduce((s, x) => s + x.score, 0) / gameSessions.length);
  }

  // Trend: compare first half avg vs second half avg
  let trend: "improving" | "stable" | "declining" = "stable";
  if (totalSessions >= 4) {
    const sorted = [...sessions].sort((a, b) => a.playedAt.localeCompare(b.playedAt));
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half).reduce((s, x) => s + x.score, 0) / half;
    const secondHalf = sorted.slice(half).reduce((s, x) => s + x.score, 0) / (sorted.length - half);
    const pctChange = ((secondHalf - firstHalf) / Math.max(firstHalf, 1)) * 100;
    if (pctChange >= 10) trend = "improving";
    else if (pctChange <= -10) trend = "declining";
  }

  return { totalSessions, avgScore, bestScore, totalDuration, avgDuration, gamesPlayed, gameScores, trend };
}

/**
 * Karşılıklı ölçüm çubuğu. Ortadaki etiket *ölçümün adı* olmalı — önceki
 * sürüm oraya A danışanının adını basıyordu, dolayısıyla dört satırın
 * dördünde aynı isim görünüyor, hangi sayının ne olduğu hiç yazmıyordu.
 */
function CompareBar({ metric, valueA, valueB, unit, colorA, colorB }: {
  metric: string; valueA: number; valueB: number; unit?: string; colorA: string; colorB: string;
}) {
  const max = Math.max(valueA, valueB, 1);
  const pctA = (valueA / max) * 100;
  const pctB = (valueB / max) * 100;
  const winner = valueA > valueB ? "A" : valueA < valueB ? "B" : "tie";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="numeral" style={{ color: winner === "A" ? colorA : "var(--color-text-muted)" }}>{valueA}{unit}</span>
        <span className="text-(--color-text-muted) uppercase tracking-widest">{metric}</span>
        <span className="numeral" style={{ color: winner === "B" ? colorB : "var(--color-text-muted)" }}>{valueB}{unit}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 flex justify-end">
          <div className="h-full rounded-l-full transition-all duration-500" style={{ width: `${pctA}%`, background: colorA, opacity: winner === "A" ? 1 : 0.4 }} />
        </div>
        <div className="flex-1">
          <div className="h-full rounded-r-full transition-all duration-500" style={{ width: `${pctB}%`, background: colorB, opacity: winner === "B" ? 1 : 0.4 }} />
        </div>
      </div>
    </div>
  );
}

export function ClientComparison({ clientA, clientB, sessions, onClose }: ClientComparisonProps) {
  /* Modal açıkken arkadaki kabuk kaymasın. */
  useScrollLock(true);
  const metricsA = useMemo(() => computeMetrics(sessions.filter(s => s.clientId === clientA.id)), [sessions, clientA.id]);
  const metricsB = useMemo(() => computeMetrics(sessions.filter(s => s.clientId === clientB.id)), [sessions, clientB.id]);

  /* İki danışanı ayırt eden renkler paletten gelir. B kasten mercan değil
     mor: mercan bu sistemde "kritik/hata" anlamı taşıyor, bir danışanı
     kırmızıya boyamak yanlış bir yargı iması bırakıyordu. */
  const colorA = "var(--color-primary)";
  const colorB = "var(--color-accent-violet)";

  const allGames: PlatformGameKey[] = ["memory", "pairs", "pulse", "route", "difference", "scan", "logic"];
  const commonGames = allGames.filter(g => metricsA.gameScores[g] && metricsB.gameScores[g]);

  const trendIcons = { improving: TrendingUp, stable: Minus, declining: TrendingDown };
  const trendColors = { improving: "#12b886", stable: "#f59e0b", declining: "#d63d63" };
  const trendLabels = { improving: "Gelişiyor", stable: "Stabil", declining: "Düşüş" };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      {/* `85vh` iOS'ta adres çubuğu gizlenirken görünür alandan büyük çıkıyor
          ve modalın alt ucu ekranın dışında kalıyordu; `dvh` gerçek yüksekliği
          ölçer. Alt güvenli alan payı da modalın içine, kaydırmanın sonuna. */}
      <div className="w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain rounded-3xl border pb-[env(safe-area-inset-bottom)]" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", boxShadow: "0 0 80px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-3xl border-b" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${colorA}, ${colorB})` }} />
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Danışan Karşılaştırması</h3>
            <button type="button" onClick={onClose} aria-label="Kapat" className="w-8 h-8 rounded-xl flex items-center justify-center bg-(--color-surface) border-none cursor-pointer text-(--color-text-muted) hover:text-(--color-text-body)">
              <X size={15} />
            </button>
          </div>

          {/* Client headers */}
          <div className="px-4 pb-3 flex gap-4 max-sm:gap-2">
            {[
              { client: clientA, color: colorA, metrics: metricsA },
              { client: clientB, color: colorB, metrics: metricsB },
            ].map(({ client, color, metrics }) => {
              const TrendIcon = trendIcons[metrics.trend];
              return (
                <div key={client.id} className="flex-1 rounded-xl p-3" style={{ background: `color-mix(in srgb, ${color} 3%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 13%, transparent)` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, transparent))` }}>
                      {client.displayName[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-(--color-text-strong) m-0 truncate">{client.displayName}</p>
                      <p className="text-[10px] text-(--color-text-muted) m-0">{client.ageGroup ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon size={10} style={{ color: trendColors[metrics.trend] }} />
                    <span className="text-[10px] font-bold" style={{ color: trendColors[metrics.trend] }}>{trendLabels[metrics.trend]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison bars */}
        <div className="p-4 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0">Genel Karşılaştırma</p>

          <CompareBar metric="Seans" valueA={metricsA.totalSessions} valueB={metricsB.totalSessions} colorA={colorA} colorB={colorB} />
          <CompareBar metric="Ort. Skor" valueA={metricsA.avgScore} valueB={metricsB.avgScore} colorA={colorA} colorB={colorB} />
          <CompareBar metric="En İyi" valueA={metricsA.bestScore} valueB={metricsB.bestScore} colorA={colorA} colorB={colorB} />
          <CompareBar metric="Oyun Çeşidi" valueA={metricsA.gamesPlayed.size} valueB={metricsB.gamesPlayed.size} colorA={colorA} colorB={colorB} />

          {/* Per-game comparison */}
          {commonGames.length > 0 && (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mt-5">Oyun Bazlı</p>
              {commonGames.map(game => (
                <div key={game}>
                  <CompareBar
                    metric={GAME_LABELS[game]}
                    valueA={metricsA.gameScores[game]?.avg ?? 0}
                    valueB={metricsB.gameScores[game]?.avg ?? 0}
                    colorA={colorA}
                    colorB={colorB}
                  />
                </div>
              ))}
            </>
          )}

          {/* Summary */}
          <div className="rounded-xl p-3 mt-4" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-2">Özet</p>
            <div className="space-y-1.5">
              {metricsA.avgScore > metricsB.avgScore ? (
                <p className="text-xs text-(--color-text-soft) m-0">
                  <strong style={{ color: colorA }}>{clientA.displayName}</strong> ortalama skorda %{Math.round(((metricsA.avgScore - metricsB.avgScore) / Math.max(metricsB.avgScore, 1)) * 100)} daha yüksek.
                </p>
              ) : metricsB.avgScore > metricsA.avgScore ? (
                <p className="text-xs text-(--color-text-soft) m-0">
                  <strong style={{ color: colorB }}>{clientB.displayName}</strong> ortalama skorda %{Math.round(((metricsB.avgScore - metricsA.avgScore) / Math.max(metricsA.avgScore, 1)) * 100)} daha yüksek.
                </p>
              ) : (
                <p className="text-xs text-(--color-text-soft) m-0">Her iki danışanın ortalama skoru eşit.</p>
              )}
              {metricsA.totalSessions > metricsB.totalSessions * 1.5 && (
                <p className="text-xs text-(--color-text-soft) m-0">
                  <strong style={{ color: colorA }}>{clientA.displayName}</strong> çok daha fazla seans deneyimine sahip ({metricsA.totalSessions} vs {metricsB.totalSessions}).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
