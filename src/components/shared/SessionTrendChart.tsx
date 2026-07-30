"use client";

import { useMemo, useState } from "react";
import { GAME_LABELS, type PlatformGameKey, type RecentSessionEntry } from "@/lib/platform-data";
import { GAME_SCORE_SCALE, normalizeScore } from "@/lib/game-constants";

/**
 * Seans skorlarının zaman içindeki seyri.
 *
 * Terapistin rapor sayfasında sorduğu ilk soru "danışan ilerliyor mu?".
 * Bu yüzden eksen zamandır ve her nokta bir seanstır. Oyunların puan
 * ölçekleri farklı olduğu için değerler normalize skora (%) çevrilir —
 * aksi halde bir "Kart Eşle" seansı grafiği tek başına ezerdi.
 */

interface Props {
  readonly sessions: readonly RecentSessionEntry[];
  /** Kaç günlük pencere gösterilecek */
  readonly days?: number;
}

const WINDOWS = [
  { days: 14, label: "14 gün" },
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
] as const;

const DOMAIN_COLOR: Record<PlatformGameKey, string> = {
  memory: "var(--color-domain-memory)",
  pairs: "var(--color-domain-memory)",
  pulse: "var(--color-domain-motor)",
  route: "var(--color-domain-motor)",
  difference: "var(--color-domain-visual)",
  scan: "var(--color-domain-visual)",
  logic: "var(--color-domain-cognitive)",
};

function startOfDay(value: string | number | Date): number {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function SessionTrendChart({ sessions, days: initialDays = 30 }: Props) {
  const [windowDays, setWindowDays] = useState<number>(initialDays);
  const [hovered, setHovered] = useState<number | null>(null);

  const model = useMemo(() => {
    const cutoff = startOfDay(Date.now()) - (windowDays - 1) * 86400000;
    const inWindow = sessions
      .filter((s) => new Date(s.playedAt).getTime() >= cutoff)
      .slice()
      .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());

    const points = inWindow.map((s) => ({
      session: s,
      time: new Date(s.playedAt).getTime(),
      value: normalizeScore(s.gameKey, s.score) * 100,
    }));

    /* Günlük ortalamadan hareketli eğilim çizgisi — tek tek seanslardaki
       dalgalanma yerine yönü gösterir. */
    const byDay = new Map<number, number[]>();
    for (const p of points) {
      const key = startOfDay(p.time);
      const list = byDay.get(key) ?? [];
      list.push(p.value);
      byDay.set(key, list);
    }
    const daily = Array.from(byDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([time, values]: [number, number[]]) => ({
        time,
        value: values.reduce((total: number, v: number) => total + v, 0) / values.length,
      }));

    /* En küçük kareler ile doğrusal eğilim */
    let slopePerWeek = 0;
    if (daily.length >= 3) {
      const n = daily.length;
      const xs = daily.map((d) => (d.time - daily[0].time) / 86400000);
      const ys = daily.map((d) => d.value);
      const meanX = xs.reduce((t, v) => t + v, 0) / n;
      const meanY = ys.reduce((t, v) => t + v, 0) / n;
      const num = xs.reduce((t, x, i) => t + (x - meanX) * (ys[i] - meanY), 0);
      const den = xs.reduce((t, x) => t + (x - meanX) ** 2, 0);
      slopePerWeek = den === 0 ? 0 : (num / den) * 7;
    }

    return { points, daily, slopePerWeek, cutoff, sessionCount: inWindow.length };
  }, [sessions, windowDays]);

  const { points, daily, slopePerWeek, cutoff, sessionCount } = model;

  const W = 100;
  const H = 42;
  const now = startOfDay(Date.now());
  const span = Math.max(1, now - cutoff);
  const xOf = (time: number) => ((startOfDay(time) - cutoff) / span) * W;
  const yOf = (value: number) => H - (value / 100) * H;

  const trendLabel =
    daily.length < 3
      ? "Eğilim için en az 3 farklı günde seans gerekir"
      : slopePerWeek > 2
        ? `Haftada ortalama +${slopePerWeek.toFixed(1)} puan — yükseliyor`
        : slopePerWeek < -2
          ? `Haftada ortalama ${slopePerWeek.toFixed(1)} puan — düşüyor`
          : "Sabit seyrediyor";
  const trendColor =
    daily.length < 3 ? "var(--color-text-muted)"
      : slopePerWeek > 2 ? "var(--color-accent-green)"
        : slopePerWeek < -2 ? "var(--color-accent-amber)"
          : "var(--color-text-soft)";

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-(--color-line)">
        <div>
          <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Seans skoru eğilimi</h3>
          <p className="text-xs text-(--color-text-muted) m-0 mt-0.5">
            Her nokta bir seans. Skorlar oyunun kendi ölçeğine göre yüzdeye çevrildi.
          </p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}>
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              type="button"
              onClick={() => setWindowDays(w.days)}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer border-none transition-colors"
              style={{
                background: windowDays === w.days ? "var(--color-primary)" : "transparent",
                color: windowDays === w.days ? "#fff" : "var(--color-text-soft)",
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {sessionCount === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-(--color-text-muted) m-0">
            Bu aralıkta seans kaydı yok. Daha geniş bir pencere seçin veya yeni bir seans oynatın.
          </p>
        </div>
      ) : (
        <>
          <div className="px-5 pt-4 pl-11">
            {/* Yükseklik sabit: grafik geniş ekranda gereksiz uzamasın.
                Çizgi SVG ile (yatayda esner), noktalar HTML ile (daire kalır)
                çizilir — preserveAspectRatio="none" daireleri elipse çevirirdi. */}
            <div className="relative w-full h-40 sm:h-48">
              {/* Yatay kılavuzlar + yüzde etiketleri */}
              {[100, 75, 50, 25, 0].map((v) => (
                <div
                  key={v}
                  className="absolute inset-x-0 flex items-center"
                  style={{ top: `${100 - v}%` }}
                  aria-hidden="true"
                >
                  <span className="absolute right-full pr-2 -translate-y-1/2 text-[10px] text-(--color-text-muted) numeral">
                    {v}
                  </span>
                  <span
                    className="w-full"
                    style={{
                      height: 1,
                      background: v === 0 ? "var(--color-line-strong)" : "var(--color-line)",
                    }}
                  />
                </div>
              ))}

              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
                role="img"
                aria-label={`Son ${windowDays} günde ${sessionCount} seansın skor eğilimi. ${trendLabel}.`}
              >
                {daily.length > 1 && (
                  <polyline
                    points={daily.map((d) => `${xOf(d.time)},${yOf(d.value)}`).join(" ")}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity={0.9}
                  />
                )}
              </svg>

              {/* Tek tek seanslar — daire kalsın diye HTML katmanında */}
              {points.map((p, i) => (
                <button
                  key={`${p.session.id}-${i}`}
                  type="button"
                  className="absolute rounded-full border-2 cursor-pointer p-0 transition-transform"
                  style={{
                    left: `${xOf(p.time)}%`,
                    top: `${(yOf(p.value) / H) * 100}%`,
                    width: 9,
                    height: 9,
                    transform: `translate(-50%, -50%) scale(${hovered === i ? 1.5 : 1})`,
                    background: DOMAIN_COLOR[p.session.gameKey] ?? "var(--color-primary)",
                    borderColor: "var(--color-page-bg)",
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${p.session.clientName}, ${GAME_LABELS[p.session.gameKey]}, ${p.session.score} puan`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 mt-3 border-t border-(--color-line)">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: trendColor }} />
              <span className="text-xs font-semibold" style={{ color: trendColor }}>{trendLabel}</span>
            </div>
            <span className="text-xs text-(--color-text-muted)">
              <span className="numeral font-bold text-(--color-text-body)">{sessionCount}</span> seans ·{" "}
              <span className="numeral font-bold text-(--color-text-body)">{daily.length}</span> farklı gün
            </span>
          </div>

          {hovered !== null && points[hovered] && (
            <div className="px-5 pb-4 -mt-1">
              <p className="text-xs text-(--color-text-soft) m-0">
                {new Date(points[hovered].session.playedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} ·{" "}
                <strong className="text-(--color-text-strong)">{points[hovered].session.clientName}</strong> ·{" "}
                {GAME_LABELS[points[hovered].session.gameKey]}:{" "}
                <strong className="numeral text-(--color-text-strong)">{points[hovered].session.score}</strong>{" "}
                {GAME_SCORE_SCALE[points[hovered].session.gameKey]?.unit} (%{Math.round(points[hovered].value)})
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
