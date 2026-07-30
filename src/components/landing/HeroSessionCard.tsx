"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Kahraman görseli: tek bir seans kaydı.
 *
 * Önceki sürüm sahte bir tarayıcı penceresi içinde tanıtım videosu
 * oynatıyordu — her SaaS sayfasının aynı klişesi, üstelik ekranın yarısını
 * kaplıyordu ve ürün hakkında hiçbir şey söylemiyordu.
 *
 * Yerine Mimio'nun ürettiği asıl şey kondu: bir seans kaydı. Kart, gerçek
 * bir kaydın taşıdığı alanları taşır ve üç katmanda okunur:
 *
 *   1. KİM   — danışan, görev, yaş grubu
 *   2. EĞRİ  — seanslar arası gelişim (blok açıklığı)
 *   3. İZ    — tek bir seansın içindeki her deneme, sırasıyla
 *
 * Üçüncü katman sayfanın imza ögesi. Bir Corsi denemesinin ham kaydı
 * gerçekten böyle görünür: zaman ekseni üzerinde, tepki süresi kadar
 * aralıklı, doğru/yanlışa göre renklenmiş çentikler. Marka motifi olan
 * cetvel çentiği burada süs değil, verinin kendisi — başlığın altındaki
 * dekoratif çentikler bu yüzden kaldırıldı.
 */

/* Sekiz seanslık Corsi açıklığı: 3'ten 6'ya yükselen gerçekçi bir seyir.
   Sağlıklı yetişkinlerde tipik ileri açıklık 5-7 blok olduğu için tavan 12
   değil, okunabilir bir aralık seçildi. */
const SPAN_SERIES = [3, 3, 4, 4, 5, 4, 5, 6] as const;
const SPAN_MAX = 7;

/* Son turun deneme kaydı: [saniye cinsinden başlangıç, doğru mu].
   Aralıklar eşit değil — tepki süresi uzadıkça çentikler açılır, seri
   hâlinde doğrular sıkışır. Turun tamamı 1:48; seansın tamamı 4:12. */
const TRACE: readonly (readonly [number, boolean])[] = [
  [3, true], [9, true], [16, false], [23, true], [29, true], [34, true],
  [41, false], [47, true], [52, true], [58, true], [67, true], [73, true],
  [81, true], [88, true], [95, true], [101, true],
];
const TRACE_END = 108;
const TRACE_CORRECT = TRACE.filter(([, ok]) => ok).length;
/* Doğruluk okuması izden türetilir; ikisi asla ayrışamaz. */
const TRACE_ACCURACY = Math.round((TRACE_CORRECT / TRACE.length) * 100);

export function HeroSessionCard() {
  const reduced = useReducedMotion();

  /* viewBox oranı, kartın içinde çizildiği gerçek orana yakın tutuldu:
     `preserveAspectRatio="none"` altında oran saparsa eğimler yatay olarak
     ezilip grafik düz bir çizgiye dönüşüyor. */
  const W = 520;
  const H = 84;
  /* Uçlarda pay: ilk ve son okuma kartın kenarına yapışmasın. */
  const PAD_X = 14;
  const PAD_Y = 10;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const stepX = innerW / (SPAN_SERIES.length - 1);
  const points = SPAN_SERIES.map((v, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_Y + innerH - (v / SPAN_MAX) * innerH,
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1].x.toFixed(1)} ${H} L${PAD_X} ${H} Z`;
  const last = points[points.length - 1];
  /* Son okumanın SVG tabanından yukarıdaki yüksekliği (rem cinsinden).
     Grafik CHART_REM yüksekliğinde çiziliyor. */
  const CHART_REM = 5;
  const lastOffsetRem = ((H - last.y) / H) * CHART_REM;

  return (
    <div className="relative w-full max-w-[30rem] mx-auto lg:ml-auto lg:mr-0">
      {/* Arkada duran ikinci kayıt — arşiv derinliği, tek bir kayıt değil */}
      <div
        aria-hidden="true"
        className="absolute inset-x-5 -top-3 h-16 rounded-2xl"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          transform: "rotate(-1.2deg)",
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
          className="flex items-center gap-2 px-5 py-2.5"
          style={{ borderBottom: "1px solid var(--color-line)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "var(--color-accent-green)" }}
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--color-text-muted)">
            Canlı seans
          </span>
          <span className="numeral ml-auto text-[11px] text-(--color-text-soft)">14:32</span>
        </header>

        {/* Danışan + görev */}
        <div className="flex items-center gap-3 px-5 pt-5">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
          >
            E
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-(--color-text-strong) m-0 leading-tight">Ela Selin</p>
            <p className="text-[11px] text-(--color-text-muted) m-0 leading-tight mt-0.5">
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

        {/* Katman 2 — seanslar arası eğri */}
        <div className="px-5 pt-5">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--color-text-muted)">
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
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: `${CHART_REM}rem` }}
            role="img"
            aria-label="Son sekiz seansta blok açıklığı 3'ten 6'ya yükseldi"
          >
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Tavan çizgisi — 7 blok. Eğrinin nereye göre okunduğunu söyler. */}
            <line
              x1={PAD_X} y1={PAD_Y} x2={W - PAD_X} y2={PAD_Y}
              stroke="var(--color-line-strong)"
              strokeWidth={1}
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
            />
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
          </svg>

          {/* Son okumanın noktası: SVG `preserveAspectRatio="none"` altında
              esnediği için daire HTML olarak konumlanıyor. */}
          <div className="relative">
            <motion.span
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${(last.x / W) * 100}%`,
                top: `calc(-${lastOffsetRem.toFixed(3)}rem - 0.25rem)`,
                marginLeft: "-0.25rem",
                background: "var(--color-signal)",
                boxShadow: "0 0 0 2px var(--color-surface-strong)",
              }}
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35, delay: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>
        </div>

        {/*
          Katman 3 — tek seansın deneme izi. Sayfanın imza ögesi.
          Her çentik bir deneme; yatay konumu denemenin turun neresinde
          gerçekleştiğini, rengi sonucunu gösterir.
        */}
        <div className="px-5 pt-5">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--color-text-muted)">
              Tepki izi · son tur
            </span>
            <span className="text-[10px] text-(--color-text-muted)">
              <span className="numeral">{TRACE_CORRECT}/{TRACE.length}</span> doğru
            </span>
          </div>

          <div
            className="relative h-8"
            role="img"
            aria-label={`Son turda ${TRACE.length} deneme yapıldı, ${TRACE_CORRECT} tanesi doğru`}
          >
            {/* Zaman ekseni */}
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 bottom-0 h-px"
              style={{ background: "var(--color-line-strong)" }}
            />
            {TRACE.map(([t, ok], i) => (
              <motion.span
                key={t}
                aria-hidden="true"
                className="absolute bottom-0 w-[2px] rounded-[1px]"
                style={{
                  left: `${(t / TRACE_END) * 100}%`,
                  height: ok ? "100%" : "44%",
                  background: ok ? "var(--color-primary)" : "var(--color-signal)",
                  opacity: ok ? 0.85 : 1,
                  transformOrigin: "bottom",
                }}
                initial={reduced ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  duration: 0.26,
                  delay: 0.72 + i * 0.028,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
          </div>
          {/* Zaman ekseninin iki ucu. Kısa/oker çentiklerin hata olduğu
              başlıktaki "14/16 doğru" okumasından anlaşılıyor; ayrı bir
              lejant satırı fazlalıktı. */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="numeral text-[10px] text-(--color-text-disabled)">0:00</span>
            <span className="numeral text-[10px] text-(--color-text-disabled)">1:48</span>
          </div>
        </div>

        {/* Okumalar */}
        <div className="grid grid-cols-3 mt-5" style={{ borderTop: "1px solid var(--color-line)" }}>
          {[
            { v: String(SPAN_SERIES[SPAN_SERIES.length - 1]), l: "Blok" },
            { v: `%${TRACE_ACCURACY}`, l: "Doğruluk" },
            { v: "4:12", l: "Seans" },
          ].map((stat, i) => (
            <div
              key={stat.l}
              className="px-5 py-3.5"
              style={{ borderLeft: i > 0 ? "1px solid var(--color-line)" : undefined }}
            >
              <span className="numeral block text-xl font-bold leading-none text-(--color-text-strong)">
                {stat.v}
              </span>
              <span className="block text-[10px] text-(--color-text-muted) mt-1.5">{stat.l}</span>
            </div>
          ))}
        </div>
      </motion.article>
    </div>
  );
}
