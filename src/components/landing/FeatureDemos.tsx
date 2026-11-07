"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Check, Lock, Unlock } from "lucide-react";
import { useReducedMotionSafe } from "../motion/Reveal";

/*
 * Özellik kartlarının görselleri.
 *
 * Kart yalnızca ikon + metin taşıdığında altı kart da aynı gri bloğa
 * dönüşüyordu; okur hangi özelliğin ne yaptığını metni okuyarak
 * çıkarmak zorundaydı. Her görsel artık işini oynuyor
 * (dev-starter guides/04-motion.md § 14):
 *
 *   · Dinlenme karesi = tasarım. Hareketi azaltan okur yalnızca onu görür.
 *   · Görünürken oynar, ekrandan çıkınca durur; kaydırma dinleyicisi yok.
 *   · Kartlar aynı anda başlamaz: `offset` okuma sırasına göre kaydırır.
 *   · Yalnızca transform + opacity; bulanıklık yalnızca küçük öğede.
 *
 * Veri kurgusaldır ve bunu saklamaz: adlar seed verisindeki kurgusal
 * danışanlarla aynı, sayı uydurulmaz — grafik bir eğilimi, liste bir
 * davranışı gösterir.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Görünürken ve hareket serbestken `tick` her `ms`'de bir artar. */
function useStory(ms: number, offset = 0) {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useInView(ref, { amount: 0.35 });
  const reduced = useReducedMotionSafe();
  const [tick, setTick] = useState(0);
  const active = visible && !reduced;
  useEffect(() => {
    if (!active) return;
    let id: number | undefined;
    const start = window.setTimeout(() => {
      setTick((t) => t + 1);
      id = window.setInterval(() => {
        if (!document.hidden) setTick((t) => t + 1);
      }, ms);
    }, offset);
    return () => {
      window.clearTimeout(start);
      if (id) window.clearInterval(id);
    };
  }, [active, ms, offset]);
  return { ref, tick, active, reduced };
}

function Frame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`feature-demo relative overflow-hidden rounded-xl sm:rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}

/* ── 1. Danışan yığını: yeni danışan üste iner, sonuncusu çıkar ── */

const CLIENTS = [
  { id: "ela", name: "Ela Selin", meta: "6–8 · Pediatrik", hue: "var(--color-primary)", level: 4 },
  { id: "tuna", name: "Tuna Akarsu", meta: "9–11 · Nörolojik", hue: "var(--color-accent-teal)", level: 3 },
  { id: "asya", name: "Asya Demir", meta: "6–8 · Otizm & DEHB", hue: "var(--color-accent-green)", level: 2 },
  { id: "mert", name: "Mert Yiğit", meta: "12–14 · Otizm & DEHB", hue: "var(--color-accent-violet)", level: 5 },
  { id: "defne", name: "Defne Kaya", meta: "4–5 · Pediatrik", hue: "var(--color-accent-amber)", level: 3 },
  { id: "kerem", name: "Kerem Arslan", meta: "9–11 · Nörolojik", hue: "var(--color-accent-red)", level: 4 },
] as const;

const ROW = 46;
const VISIBLE_ROWS = 3;

export function ClientStackDemo({ offset = 0 }: { offset?: number }) {
  const { ref, tick } = useStory(2600, offset);
  const start = tick % CLIENTS.length;
  /* Altı danışan hep DOM'da; her biri yığında bir yuvada. 0–2 görünür,
     3–4 aşağıda sönmüş, 5 yukarıda inmeye hazır. AnimatePresence'ın
     sıra değişiminde yuvayı bir tur geç güncellemesi böyle aşılıyor. */
  const slotOf = (idx: number) => (start - idx + CLIENTS.length) % CLIENTS.length;
  return (
    <div ref={ref}>
      <Frame className="h-[12rem] p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[12px] font-semibold text-(--color-text-soft)">Danışanlar</span>
          <span className="numeral text-[12px] font-semibold text-(--color-primary-ink) px-2 py-0.5 rounded-full bg-(--color-primary-light)">
            Aktif · 8
          </span>
        </div>
        <ul className="relative list-none m-0 p-0" style={{ height: ROW * VISIBLE_ROWS }}>
            {CLIENTS.map((c, idx) => {
              const i = slotOf(idx);
              const shown = i < VISIBLE_ROWS;
              const y = shown ? i * ROW : i === CLIENTS.length - 1 ? -ROW * 0.6 : (VISIBLE_ROWS - 1) * ROW + 18;
              return (
              <motion.li
                key={c.id}
                className="absolute inset-x-0 flex items-center gap-3 px-2.5 rounded-xl"
                style={{ height: ROW - 6, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)", zIndex: VISIBLE_ROWS - i }}
                initial={false}
                animate={{ opacity: shown ? 1 - i * 0.2 : 0, y, scale: shown ? 1 - i * 0.015 : 0.95 }}
                transition={{ duration: shown ? 0.7 : 0.4, ease: EASE }}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                  style={{ background: c.hue }}
                >
                  {c.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold text-(--color-text-strong) leading-tight truncate">{c.name}</span>
                  <span className="block text-[12px] text-(--color-text-muted) leading-tight truncate">{c.meta}</span>
                </span>
                <span className="flex gap-[3px] shrink-0" title={`bağımsızlık ${c.level}/5`}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <span
                      key={k}
                      className="w-[5px] h-3.5 rounded-full"
                      style={{ background: k < c.level ? c.hue : "var(--color-line-strong)" }}
                    />
                  ))}
                </span>
                {i === 0 && tick > 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.4, ease: EASE }}
                    className="hidden sm:inline text-[12px] font-semibold text-(--color-accent-green) shrink-0"
                  >
                    Yeni seans
                  </motion.span>
                )}
              </motion.li>
              );
            })}
        </ul>
      </Frame>
    </div>
  );
}

/* ── 2. Corsi dizisi: üç blok sırayla yanar, sonra "doğru" ── */

const SEQUENCES = [
  [0, 4, 8],
  [2, 3, 7],
  [6, 1, 5],
  [3, 8, 1],
] as const;

export function CorsiDemo({ offset = 0 }: { offset?: number }) {
  /* Bir tur = 3 yanma + 1 onay + 1 dinlenme → 5 adım. */
  const { ref, tick, active } = useStory(620, offset);
  const round = Math.floor(tick / 5);
  const phase = tick % 5;
  const seq = SEQUENCES[round % SEQUENCES.length];
  const lit = active && phase < 3 ? seq[phase] : -1;
  const done = active && phase === 3;
  return (
    <div ref={ref}>
      <Frame className="h-[12rem] flex items-center justify-center feature-demo-ink">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {Array.from({ length: 9 }, (_, i) => {
            const on = i === lit;
            const shown = done && seq.includes(i as never);
            return (
              <motion.span
                key={i}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg relative"
                animate={{
                  scale: on ? 1.08 : 1,
                  backgroundColor: on
                    ? "var(--color-signature-to)"
                    : shown
                      ? "color-mix(in srgb, var(--color-accent-green) 55%, transparent)"
                      : "rgba(255,255,255,0.07)",
                }}
                transition={{ duration: on ? 0.18 : 0.45, ease: EASE }}
                style={{
                  border: "1px solid rgba(255,255,255,0.09)",
                  boxShadow: on ? "0 0 22px color-mix(in srgb, var(--color-signature-to) 60%, transparent)" : "none",
                }}
              />
            );
          })}
        </div>
        <AnimatePresence>
          {done && (
            <motion.span
              key={round}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(25,209,155,0.16)", color: "#7ef0c8", border: "1px solid rgba(25,209,155,0.3)" }}
            >
              <Check size={12} strokeWidth={2.5} /> Dizi doğru · span {3 + (round % 3)}
            </motion.span>
          )}
        </AnimatePresence>
      </Frame>
    </div>
  );
}

/* ── 3. Haftalık plan: dolu günden bir blok boş güne kayar ── */

const DAYS = ["P", "S", "Ç", "P", "C", "C", "P"] as const;
const PLAN: readonly (readonly string[])[] = [
  ["var(--color-domain-cognitive)", "var(--color-domain-motor)"],
  ["var(--color-domain-motor)"],
  [],
  ["var(--color-domain-visual)", "var(--color-domain-cognitive)", "var(--color-domain-motor)"],
  ["var(--color-domain-memory)"],
  [],
  [],
];

export function WeekPlanDemo({ offset = 0 }: { offset?: number }) {
  const { ref, tick, active } = useStory(2300, offset);
  /* Boş Çarşamba'ya akıllı önerinin bloğu iner; bir sonraki adımda
     kalkar. Dinlenme karesinde blok yerinde: önerilmiş plan. */
  const placed = !active || tick % 2 === 1;
  return (
    <div ref={ref}>
      <Frame className="h-[12rem] p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 h-[8.25rem]">
          {DAYS.map((d, di) => (
            <div key={di} className="flex flex-col gap-1 min-w-0">
              <span className={`text-[12px] font-semibold text-center ${di === 2 ? "text-(--color-primary-ink)" : "text-(--color-text-muted)"}`}>{d}</span>
              <div
                className="flex-1 rounded-md flex flex-col gap-1 p-[3px] transition-colors duration-500"
                style={{
                  background: "var(--color-surface-strong)",
                  border: `1px ${di === 2 && !placed ? "dashed" : "solid"} ${di === 2 && !placed ? "var(--color-line-focus)" : "var(--color-line-soft)"}`,
                }}
              >
                {PLAN[di].map((c, k) => (
                  <span
                    key={k}
                    className="block h-5 rounded-[5px]"
                    style={{ background: `color-mix(in srgb, ${c} 30%, transparent)`, borderLeft: `2px solid ${c}` }}
                  />
                ))}
                {di === 2 && (
                  <AnimatePresence initial={false}>
                    {placed && (
                      <motion.span
                        key="drop"
                        className="block h-5 rounded-[5px]"
                        style={{ background: "color-mix(in srgb, var(--color-domain-visual) 34%, transparent)", borderLeft: "2px solid var(--color-domain-visual)" }}
                        initial={{ opacity: 0, y: -26, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ duration: 0.6, ease: EASE }}
                      />
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          ))}
        </div>
        <motion.span
          className="absolute bottom-3 left-3 right-3 text-[12px] text-(--color-text-soft) flex items-center gap-1.5"
          animate={{ opacity: placed ? 1 : 0.6 }}
          transition={{ duration: 0.4 }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--color-domain-visual)" }} />
          <span className="truncate">Öneri: Çarşamba&apos;ya görsel algı</span>
        </motion.span>
      </Frame>
    </div>
  );
}

/* ── 4. İlerleme: okuyucu nokta eğriyi izler, ipucu değeri sayar ── */

const CURVE = [44, 48, 47, 55, 58, 57, 64, 69, 68, 75, 79, 83] as const;

export function ProgressReadDemo({ offset = 0 }: { offset?: number }) {
  const { ref, tick, active } = useStory(900, offset);
  const W = 320;
  const H = 120;
  const pts = CURVE.map((v, i) => [(i / (CURVE.length - 1)) * W, H - ((v - 35) / 55) * H] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${d} L${W},${H} L0,${H} Z`;
  const idx = active ? 3 + (tick % (CURVE.length - 3)) : CURVE.length - 1;
  const [px, py] = pts[idx];
  return (
    <div ref={ref}>
      <Frame className="h-[12rem] px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[12px] font-semibold text-(--color-text-soft)">Normalize skor · 12 seans</span>
          <span className="numeral text-[12px] font-semibold text-(--color-accent-green)">↗ +39</span>
        </div>
        <div className="relative" style={{ height: H }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="fd-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="var(--color-line-soft)" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />
            ))}
            <clipPath id="fd-draw">
              <motion.rect
                x="0"
                y="-10"
                height={H + 20}
                width={W}
                style={{ originX: 0 }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.4, ease: EASE }}
              />
            </clipPath>
            <clipPath id="fd-read">
              <motion.rect x="0" y="0" height={H} width={W} style={{ originX: 0 }} initial={false} animate={{ scaleX: px / W }} transition={{ duration: 0.8, ease: EASE }} />
            </clipPath>
            {/* Alan okuyucunun soluna kadar dolar: "buraya kadar okundu". */}
            <path d={area} fill="url(#fd-area)" clipPath="url(#fd-read)" />
            <path
              d={d}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#fd-draw)"
            />
            <motion.line
              x1={0}
              x2={0}
              y1={0}
              y2={H}
              stroke="var(--color-primary)"
              strokeOpacity="0.25"
              vectorEffect="non-scaling-stroke"
              animate={{ x: px }}
              transition={{ duration: 0.8, ease: EASE }}
            />
          </svg>
          <motion.span
            className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full"
            style={{ left: 0, top: 0, background: "var(--color-surface-strong)", border: "2.5px solid var(--color-primary)" }}
            animate={{ left: `${(px / W) * 100}%`, top: py }}
            transition={{ duration: 0.8, ease: EASE }}
          />
          <motion.span
            className="absolute -translate-x-1/2 numeral text-[12px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
            style={{ top: -2, background: "var(--color-text-strong)", color: "var(--color-text-inverse)" }}
            animate={{ left: `${Math.min(88, Math.max(12, (px / W) * 100))}%`, y: Math.max(0, py - 34) }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            S{idx + 1} · {CURVE[idx]}
          </motion.span>
        </div>
      </Frame>
    </div>
  );
}

/* ── 5. Seans notu: gözlem harf harf yazılır ── */

const NOTES = [
  "Ela dizi uzunluğunu 5'e çıkardı; ipucu gerekmedi.",
  "Sağ elde hız arttı, hedef kaçırma 3'ten 1'e indi.",
  "Yönerge tekrarı olmadan rotayı tamamladı.",
] as const;

export function NoteTypingDemo({ offset = 0 }: { offset?: number }) {
  const { ref, tick, active, reduced } = useStory(55, offset);
  /* Her not: yazma + 40 adım bekleme. */
  const lengths = NOTES.map((n) => n.length + 40);
  const cycle = lengths.reduce((a, b) => a + b, 0);
  let t = tick % cycle;
  let which = 0;
  while (t >= lengths[which]) {
    t -= lengths[which];
    which += 1;
  }
  const note = NOTES[which];
  const shown = active ? note.slice(0, Math.min(note.length, t)) : reduced || tick === 0 ? NOTES[0] : note;
  return (
    <div ref={ref}>
      <Frame className="h-[12rem] p-3 sm:p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="numeral text-[12px] font-semibold px-1.5 py-0.5 rounded bg-(--color-primary-light) text-(--color-primary-ink)">S</span>
          <span className="text-[12px] font-semibold text-(--color-text-soft)">Gözlem · bugün 10:42</span>
        </div>
        <p className="text-[12.5px] leading-relaxed text-(--color-text-body) m-0 min-h-[3.6em]">
          {shown}
          <span className="note-caret" />
        </p>
        <div className="mt-auto flex gap-1.5">
          {["Dikkat", "İnce motor", "Bağımsız"].map((tag, i) => (
            <motion.span
              key={tag}
              className="text-[12px] font-semibold px-2 py-0.5 rounded-full text-(--color-text-soft)"
              style={{ border: "1px solid var(--color-line)" }}
              animate={{ opacity: active && t < note.length ? 0.45 : 1 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </Frame>
    </div>
  );
}

/* ── 6. Gizlilik: rapordaki ad, harf harf maskelenir ── */

const FULL = "Ela Selin";
const MASKED = FULL.split("").map((ch, i) => (ch === " " || i === 0 || i === 4 ? ch : "•")).join("");

export function PrivacyMaskDemo({ offset = 0 }: { offset?: number }) {
  const { ref, tick, active } = useStory(1900, offset);
  const masked = !active || tick % 2 === 1;
  return (
    <div ref={ref}>
      <Frame className="h-[12rem] p-3 sm:p-4 flex flex-col justify-center gap-3">
        <div className="rounded-xl p-3" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
          <span className="block text-[12px] text-(--color-text-muted) mb-1">Aile raporu · danışan</span>
          <span className="flex items-center justify-between gap-2">
            <span className="numeral text-[15px] font-semibold text-(--color-text-strong) tracking-wide flex">
              {FULL.split("").map((ch, i) => (
                <span key={i} className="relative inline-block overflow-hidden" style={{ width: ch === " " ? "0.4em" : undefined }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={masked ? MASKED[i] : ch}
                      className="inline-block"
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ duration: 0.32, delay: i * 0.035, ease: EASE }}
                    >
                      {masked ? MASKED[i] : ch}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ))}
            </span>
            <motion.span
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              animate={{
                backgroundColor: masked ? "color-mix(in srgb, var(--color-accent-green) 14%, transparent)" : "var(--color-primary-light)",
              }}
            >
              {masked ? (
                <Lock size={13} className="text-(--color-accent-green)" />
              ) : (
                <Unlock size={13} className="text-(--color-primary)" />
              )}
            </motion.span>
          </span>
        </div>
        <span className="text-[12px] text-(--color-text-soft) flex items-center gap-1.5 px-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: masked ? "var(--color-accent-green)" : "var(--color-text-muted)" }} />
          {masked ? "İsim maskeleme açık" : "Yalnızca terapist görür"}
        </span>
      </Frame>
    </div>
  );
}
