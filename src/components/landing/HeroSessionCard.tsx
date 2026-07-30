"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GAME_SCORE_SCALE } from "@/lib/game-constants";

/**
 * Kahraman görseli: tek bir seans kaydı.
 *
 * Önceki sürüm sahte bir tarayıcı penceresi içinde tanıtım videosu
 * oynatıyordu — her SaaS sayfasının aynı klişesi, üstelik ekranın yarısını
 * kaplıyordu ve ürün hakkında hiçbir şey söylemiyordu.
 *
 * Yerine Mimio'nun ürettiği asıl şey kondu: bir seans kaydı. Kart, gerçek
 * bir kaydın taşıdığı alanları taşır (danışan, görev, ölçüm eğrisi, okuma
 * değerleri) ve marka motifini — cetvel çentikli taban çizgisi — grafiğin
 * ekseni olarak kullanır. Süs değil, ürünün çıktısı.
 */

/* Sekiz seanslık Corsi açıklığı: 3'ten 6'ya yükselen gerçekçi bir seyir.
   Sağlıklı yetişkinlerde tipik ileri açıklık 5-7 blok olduğu için tavan 12
   değil, okunabilir bir aralık seçildi. */
const SPAN_SERIES = [3, 3, 4, 4, 5, 4, 5, 6] as const;
const SPAN_MAX = 7;

export function HeroSessionCard() {
  const reduced = useReducedMotion();

  const W = 240;
  const H = 76;
  const stepX = W / (SPAN_SERIES.length - 1);
  const points = SPAN_SERIES.map((v, i) => ({
    x: i * stepX,
    y: H - (v / SPAN_MAX) * H,
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const last = points[points.length - 1];

  return (
    <div className="relative w-full max-w-[26rem] mx-auto lg:ml-auto lg:mr-0">
      {/* Arkada duran ikinci kayıt — arşiv derinliği, tek bir kayıt değil */}
      <div
        aria-hidden="true"
        className="absolute inset-x-4 -top-3 h-16 rounded-2xl"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          transform: "rotate(-1.4deg)",
        }}
      />

      <motion.article
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-line-strong)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Ray */}
        <header
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--color-line)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "var(--color-accent-green)" }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">
            Canlı seans
          </span>
          <span className="numeral ml-auto text-[11px] text-(--color-text-soft)">14:32</span>
        </header>

        {/* Danışan + görev */}
        <div className="flex items-center gap-3 px-4 pt-4">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
          >
            E
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-(--color-text-strong) m-0 leading-tight">Ela Selin</p>
            <p className="text-[11px] text-(--color-text-muted) m-0 leading-tight">
              Sıra Hafızası · Çalışma belleği
            </p>
          </div>
          <span
            className="ml-auto shrink-0 text-[10px] font-bold px-2 py-1 rounded-md"
            style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
          >
            6–8 yaş
          </span>
        </div>

        {/* Ölçüm eğrisi — ekseni marka motifi olan cetvel çentikleri */}
        <div className="px-4 pt-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">
              Blok açıklığı
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-(--color-text-muted)">
              son 8 seans
              <span
                className="numeral font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--color-signal-light)", color: "var(--color-signal)" }}
              >
                +3
              </span>
            </span>
          </div>

          <svg
            viewBox={`0 0 ${W} ${H + 10}`}
            className="w-full"
            style={{ height: "5.25rem" }}
            role="img"
            aria-label="Son sekiz seansta blok açıklığı 3'ten 6'ya yükseldi"
          >
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={area} fill="url(#heroFill)" />
            <motion.path
              d={line}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.circle
              cx={last.x}
              cy={last.y}
              r={3.5}
              fill="var(--color-signal)"
              stroke="var(--color-surface-strong)"
              strokeWidth={2}
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35, delay: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: `${last.x}px ${last.y}px` }}
            />

            {/* Cetvel taban çizgisi */}
            <line x1={0} y1={H} x2={W} y2={H} stroke="var(--color-line-strong)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            {Array.from({ length: 25 }).map((_, i) => (
              <line
                key={i}
                x1={(i * W) / 24}
                y1={H}
                x2={(i * W) / 24}
                y2={H + (i % 4 === 0 ? 6 : 3)}
                stroke="var(--color-signal)"
                strokeWidth={1}
                opacity={i % 4 === 0 ? 0.75 : 0.4}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>

        {/* Okumalar */}
        <div className="grid grid-cols-3 mt-3" style={{ borderTop: "1px solid var(--color-line)" }}>
          {[
            { v: "6", l: "Blok", hint: GAME_SCORE_SCALE.memory.unit },
            { v: "%86", l: "Doğruluk" },
            { v: "4:12", l: "Süre" },
          ].map((stat, i) => (
            <div
              key={stat.l}
              className="px-4 py-3"
              style={{ borderLeft: i > 0 ? "1px solid var(--color-line)" : undefined }}
            >
              <span className="numeral block text-lg font-bold leading-none text-(--color-text-strong)">
                {stat.v}
              </span>
              <span className="block text-[10px] text-(--color-text-muted) mt-1">{stat.l}</span>
            </div>
          ))}
        </div>
      </motion.article>

    </div>
  );
}
