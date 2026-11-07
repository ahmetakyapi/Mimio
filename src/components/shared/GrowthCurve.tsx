"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { RecentSessionEntry } from "@/lib/platform-data";
import { normalizeScore } from "@/lib/game-constants";
import { gameTitle, shortDate } from "@/lib/deniz-derive";
import { useReducedMotionSafe } from "@/components/motion/Reveal";

/*
 * Gelişim Eğrisi — danışan detayı ve ilerleme raporu aynı grafiği çizer.
 *
 * Hedef çizgisi kesikli: ölçülen değer değil, hedeflenen. Bu ayrım olmadan
 * grafik "ulaşıldı mı?" sorusunu cevaplamıyor.
 *
 * Okuyucu: grafiğin üstünde gezinen imleç en yakın seansı yakalar; dikey
 * kılavuz, büyüyen nokta ve tarih · oyun · skor ipucu belirir. Klavyeyle
 * ←/→ seanslar arasında gezer. Terapist "bu tepe hangi gündü?" sorusunu
 * tabloya inmeden cevaplar.
 *
 * Eğri ilk görünüşte soldan sağa bir kez çizilir; veri değişince yeniden
 * çizilmez (ölçülmüş veri her seferinde sıfırdan sayılmaz). Hareket
 * azaltmada çizim yok.
 *
 * viewBox kabın darlığına göre seçilir: kap 560px'in altındaysa viewBox
 * ölçülen piksel genişliğine eşitlenir (ölçek tam 1), punto 11px'e çıkar.
 */

const CURVE_H = 168;
const CURVE_W_DESKTOP = 560;
const CURVE_NARROW_MAX = CURVE_W_DESKTOP;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Grafik kabının gerçek piksel genişliği. 0 = henüz ölçülmedi. */
function useBoxWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setWidth(Math.round(rect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/* Catmull-Rom → bezier. Kontrol noktaları komşu iki okumadan türer; tepe ve
   dip değerleri yerinde kalır, ölçüm bozulmaz. */
function smooth(pts: readonly (readonly [number, number])[]) {
  if (pts.length < 3) return `M${pts.map((p) => p.join(" ")).join(" L")}`;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function GrowthCurve({
  sessions,
  target = 85,
  height = CURVE_H,
}: {
  readonly sessions: readonly RecentSessionEntry[];
  readonly target?: number;
  readonly height?: number;
}) {
  const [boxRef, boxW] = useBoxWidth();
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotionSafe();
  const [hover, setHover] = useState<number | null>(null);

  const measured = boxW > 0;
  const narrow = measured && boxW < CURVE_NARROW_MAX;
  const W = narrow ? boxW : CURVE_W_DESKTOP;
  const H = height;
  const pad = { l: narrow ? 30 : 26, r: 14, t: 16, b: narrow ? 26 : 22 };
  const axisFs = narrow ? 11 : 10;
  const targetFs = narrow ? 11 : 10.5;

  if (sessions.length < 2) {
    return (
      <div className="grid place-items-center text-[12px] text-(--color-text-soft)" style={{ height: H }}>
        Eğri için en az iki seans gerekiyor.
      </div>
    );
  }

  const xs = sessions.map((_, i) => pad.l + (i * (W - pad.l - pad.r)) / (sessions.length - 1));
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const norm = (s: RecentSessionEntry) => Math.round(normalizeScore(s.gameKey as never, s.score) * 100);
  const values = sessions.map(norm);
  const pts = values.map((v, i) => [xs[i], y(v)] as const);
  const line = smooth(pts);
  const area = `${line} L${xs[xs.length - 1]} ${H - pad.b} L${xs[0]} ${H - pad.b} Z`;
  const lastI = sessions.length - 1;
  const best = values.reduce((bi, v, i) => (v > values[bi] ? i : bi), 0);

  const gapPerPoint = (W - pad.l - pad.r) / (sessions.length - 1);
  const labelEvery = narrow
    ? Math.max(1, Math.ceil((axisFs * 2.6) / gapPerPoint))
    : sessions.length <= 12
      ? 1
      : Math.ceil(sessions.length / 12);
  const labelPhase = lastI % labelEvery;

  const pick = (clientX: number, rect: DOMRect) => {
    const ux = ((clientX - rect.left) / rect.width) * W;
    let bi = 0;
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - ux) < Math.abs(xs[bi] - ux)) bi = i;
    setHover(bi);
  };

  const hi = hover ?? null;
  const tip = hi !== null ? sessions[hi] : null;
  const tipLeft = hi !== null ? (xs[hi] / W) * 100 : 0;

  return (
    <div ref={boxRef} className="growth-curve relative w-full">
      {!measured ? (
        <div style={{ height: H }} />
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: H }}
            className="block outline-none"
            role="img"
            aria-label={`Gelişim eğrisi: ${sessions.length} seans, son skor ${values[lastI]}`}
            tabIndex={0}
            onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
            onPointerLeave={() => setHover(null)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              setHover((h) => {
                const cur = h ?? lastI;
                return Math.min(lastI, Math.max(0, cur + (e.key === "ArrowRight" ? 1 : -1)));
              });
            }}
          >
            <defs>
              <linearGradient id={`gc-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`gc-line-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-signature-to)" />
              </linearGradient>
              <clipPath id={`gc-draw-${uid}`}>
                <motion.rect
                  x="0"
                  y="0"
                  height={H}
                  width={W}
                  style={{ originX: 0 }}
                  initial={reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.1, ease: EASE }}
                />
              </clipPath>
            </defs>

            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line-soft)" strokeWidth={1} />
                <text x={pad.l - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="numeral" style={{ fontSize: axisFs, fill: "var(--color-text-muted)" }}>
                  {v}
                </text>
              </g>
            ))}

            {/* Hedef bandı: çizginin üstü hafif yeşil — "buraya ulaşmak" bölgesi. */}
            <rect x={pad.l} y={y(100)} width={W - pad.l - pad.r} height={y(target) - y(100)} fill="var(--color-accent-green)" opacity={0.045} />
            <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="var(--color-accent-green)" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.75} />
            <text
              x={narrow ? pad.l + 3 : pad.l + 4}
              y={y(target) - 5}
              textAnchor="start"
              className="numeral"
              style={{ fontSize: targetFs, fontWeight: 600, fill: "var(--color-accent-green)" }}
            >
              hedef {target}
            </text>

            <g clipPath={`url(#gc-draw-${uid})`}>
              <path d={area} fill={`url(#gc-fill-${uid})`} />
              <path d={line} fill="none" stroke={`url(#gc-line-${uid})`} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              {sessions.map((s, i) => (
                <circle
                  key={s.id}
                  cx={xs[i]}
                  cy={pts[i][1]}
                  r={i === hi ? 5.5 : i === lastI ? 4.4 : 3.2}
                  fill={i === lastI || i === hi ? "var(--color-surface-strong)" : "var(--color-signature-to)"}
                  stroke={i === lastI || i === hi ? "var(--color-primary)" : "var(--color-surface-strong)"}
                  strokeWidth={i === lastI || i === hi ? 2.5 : 2}
                  style={{ transition: "r 0.2s" }}
                />
              ))}
            </g>

            {/* En iyi seans işareti — yalnızca son seans değilse. */}
            {lastI - best >= 2 && values[best] - values[lastI] >= 3 && hi === null && (
              <g>
                <text x={xs[best]} y={pts[best][1] - 10} textAnchor="middle" className="numeral" style={{ fontSize: axisFs, fontWeight: 600, fill: "var(--color-text-soft)" }}>
                  en iyi {values[best]}
                </text>
              </g>
            )}

            {/* Son değer — eğrinin bittiği yerde. */}
            {hi === null && (
              <g>
                <rect
                  x={Math.min(W - pad.r - 34, xs[lastI] - 17)}
                  y={pts[lastI][1] - 28}
                  width={34}
                  height={18}
                  rx={6}
                  fill="var(--color-text-strong)"
                />
                <text
                  x={Math.min(W - pad.r - 17, xs[lastI])}
                  y={pts[lastI][1] - 18.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="numeral"
                  style={{ fontSize: 10.5, fontWeight: 700, fill: "var(--color-text-inverse)" }}
                >
                  {values[lastI]}
                </text>
              </g>
            )}

            {hi !== null && (
              <line x1={xs[hi]} x2={xs[hi]} y1={pad.t - 4} y2={H - pad.b} stroke="var(--color-primary)" strokeOpacity={0.35} strokeDasharray="3 3" />
            )}

            {sessions.map((s, i) =>
              i % labelEvery === labelPhase ? (
                <text
                  key={`l-${s.id}`}
                  x={xs[i]}
                  y={H - (narrow ? 8 : 6)}
                  textAnchor="middle"
                  className="numeral"
                  style={{ fontSize: axisFs, fill: i === hi ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: i === hi ? 700 : 400 }}
                >
                  S{i + 1}
                </text>
              ) : null,
            )}
          </svg>

          {tip && hi !== null && (
            <div
              className="growth-tip"
              style={{
                left: `${Math.min(86, Math.max(14, tipLeft))}%`,
                top: Math.max(0, pts[hi][1] - 66),
              }}
              aria-hidden="true"
            >
              <span className="growth-tip-score numeral">{values[hi]}</span>
              <span className="growth-tip-meta">
                <span className="growth-tip-game">{gameTitle(tip.gameKey as never)}</span>
                <span className="growth-tip-date">S{hi + 1} · {shortDate(new Date(tip.playedAt))}</span>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
