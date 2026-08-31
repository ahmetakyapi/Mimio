"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Kahraman görseli: tek bir ölçümün büyütülmüş hâli.
 *
 * Buraya sırayla ne konduysa bir yerden tutmadı: seans kartı fazla sessizdi,
 * ekran görüntüsü küçülünce okunmuyordu, haftalık takvim ise yirmi bir küçük
 * bloğuyla bilgi veriyor ama göz yoruyordu. Üçünün ortak hatası aynı: kahraman
 * görselini bir *bilgi yüzeyi* sanmak. Kahramanın işi bilgi vermek değil, tek
 * bir şeyi güzel söylemek.
 *
 * Bu yüzden burada tek bir ölçüm var: bir çocuğun blok açıklığı ve sekiz
 * seansta nasıl değiştiği. Büyük sayı, yumuşak bir eğri, üç kısa okuma. Geri
 * kalan her şey boşluk.
 *
 * Veri temsilîdir ama uydurma değil: Corsi blok testinde 3'ten 6'ya çıkan bir
 * seyir gerçekçi bir ilerlemedir ve alt satırdaki okumalar (doğruluk, süre,
 * doğru sayısı) aynı seansın kendisinden türer — ikisi asla ayrışmaz.
 */

/* Sekiz seanslık Corsi açıklığı. Tavan 7: sağlıklı yetişkinde tipik ileri
   açıklık 5-7 blok, ölçek buna göre okunur. */
const SERIES = [3, 3, 4, 4, 5, 4, 5, 6] as const;
const SERIES_MAX = 7;
const SPAN = SERIES[SERIES.length - 1];
const SPAN_GAIN = SPAN - SERIES[0];

/* Son turun denemeleri: 16 denemenin 14'ü doğru. Alt satırdaki "%88" ve
   "14/16" buradan türer, elle yazılmaz. */
const TRIALS = 16;
const TRIALS_CORRECT = 14;
const ACCURACY = Math.round((TRIALS_CORRECT / TRIALS) * 100);

const W = 560;
const H = 170;
const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 10;

const points = SERIES.map((v, i) => ({
  x: PAD_X + (i * (W - PAD_X * 2)) / (SERIES.length - 1),
  y: PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) * (1 - v / SERIES_MAX),
}));

/**
 * Catmull-Rom eğrisini bezier'e çevirir.
 *
 * Düz `L` komutlarıyla çizilen çizgi köşeli duruyordu; kahramanda görülen ilk
 * şey bir zikzak oluyordu. Yumuşatma ölçümü bozmuyor: kontrol noktaları
 * yalnızca komşu iki okumadan türüyor, tepe ve dip değerleri yerinde kalıyor.
 */
function smoothPath(pts: readonly { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

const LINE = smoothPath(points);
const AREA = `${LINE} L${points[points.length - 1].x.toFixed(1)} ${H} L${points[0].x.toFixed(1)} ${H} Z`;
const LAST = points[points.length - 1];

const EASE = [0.22, 1, 0.36, 1] as const;

export function HeroPulse() {
  const reduced = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[34rem]">
      {/* Işık. İmza degradesinden türer ama %9'un altında kaldığı için yüzey
          değil aydınlanma olarak okunuyor (degrade yüzey olarak yalnızca üç
          yerde kullanılabilir, bkz. THEME.md). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-12 -inset-y-14 -z-10"
        style={{
          background:
            "radial-gradient(58% 50% at 66% 18%, color-mix(in srgb, var(--color-signature-from) 9%, transparent), transparent 70%), radial-gradient(48% 44% at 26% 84%, color-mix(in srgb, var(--color-signature-to) 8%, transparent), transparent 72%)",
        }}
      />

      {/* Arkada duran ikinci kayıt: tek bir seans değil, bir arşiv. */}
      <motion.div
        aria-hidden="true"
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        className="absolute inset-x-6 -top-4 h-24 rounded-[20px]"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          transform: "rotate(-1.4deg)",
        }}
      />

      <motion.article
        initial={reduced ? false : { opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
        className="relative rounded-[22px] overflow-hidden"
        style={{
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-line-strong)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <header
          className="flex items-center gap-2 px-6 py-3"
          style={{ borderBottom: "1px solid var(--color-line)" }}
        >
          <span
            className="live-pulse w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "var(--color-accent-green)" }}
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--color-text-muted)">
            Canlı seans
          </span>
          <span className="numeral ml-auto text-[11px] text-(--color-text-soft)">14:32</span>
        </header>

        <div className="px-6 pt-5">
          <div className="flex items-center gap-3">
            <span
              className="tile-signature grid place-items-center shrink-0 text-[15px] font-bold"
              style={{ width: 42, height: 42, borderRadius: 13 }}
            >
              E
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-(--color-text-strong) m-0 leading-tight">
                Ela Selin
              </p>
              <p className="text-[12px] text-(--color-text-muted) m-0 leading-tight mt-0.5">
                Sıra Hafızası · Çalışma belleği
              </p>
            </div>
            <span
              className="ml-auto shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg"
              style={{ background: "var(--color-primary-light)", color: "var(--color-primary-ink)" }}
            >
              6–8 yaş
            </span>
          </div>
        </div>

        {/* Tek ölçüm, büyük. Kahramanın söylediği şey bu. */}
        <div className="px-6 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--color-text-muted) m-0">
            Blok açıklığı
          </p>
          <div className="flex items-end gap-3 mt-2">
            <motion.strong
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
              className="figure text-[3.75rem] leading-[0.85] text-(--color-text-strong)"
            >
              {SPAN}
            </motion.strong>
            <span className="text-[13px] text-(--color-text-soft) pb-1.5">blok</span>
            <motion.span
              initial={reduced ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.62, ease: EASE }}
              className="ml-auto mb-1.5 numeral text-[12px] font-bold px-2.5 py-1 rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--color-accent-green) 14%, transparent)",
                color: "var(--color-accent-green)",
              }}
            >
              +{SPAN_GAIN} · son 8 seans
            </motion.span>
          </div>
        </div>

        {/* Eğri. Kartın tek büyük yüzeyi; kenarlara kadar akar. */}
        <div className="mt-3 -mb-px">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="block w-full h-[9.5rem]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hero-pulse-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.26" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={AREA}
              fill="url(#hero-pulse-fill)"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.75, ease: "easeOut" }}
            />
            <motion.path
              d={LINE}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.15, delay: 0.42, ease: EASE }}
            />
          </svg>
          {/* Son okumanın noktası SVG dışında: `preserveAspectRatio="none"`
              altında daire elips gibi eziliyordu. */}
          <span
            aria-hidden="true"
            className="block relative"
            style={{ height: 0 }}
          >
            <motion.span
              initial={reduced ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 1.5, ease: EASE }}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                right: `calc(${(1 - LAST.x / W) * 100}% - 5px)`,
                bottom: `calc(${(1 - LAST.y / H) * 9.5}rem - 5px)`,
                background: "var(--color-primary)",
                boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-primary) 18%, transparent)",
              }}
            />
          </span>
        </div>

        {/* Üç kısa okuma. Sayılar aynı seanstan türer. */}
        <div
          className="grid grid-cols-3"
          style={{ borderTop: "1px solid var(--color-line)" }}
        >
          {[
            { v: `%${ACCURACY}`, l: "Doğruluk" },
            { v: "4:12", l: "Seans" },
            { v: `${TRIALS_CORRECT}/${TRIALS}`, l: "Doğru" },
          ].map((s, i) => (
            <div
              key={s.l}
              className="px-6 py-4"
              style={i > 0 ? { borderLeft: "1px solid var(--color-line)" } : undefined}
            >
              <p className="numeral text-[18px] font-bold text-(--color-text-strong) m-0 leading-none">
                {s.v}
              </p>
              <p className="text-[11px] text-(--color-text-muted) m-0 mt-1.5 leading-none">{s.l}</p>
            </div>
          ))}
        </div>
      </motion.article>
    </div>
  );
}
