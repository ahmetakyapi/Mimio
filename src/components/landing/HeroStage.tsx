"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useInView, useTransform, type MotionValue } from "framer-motion";
import { Check } from "lucide-react";
import { useReducedMotionSafe } from "../motion/Reveal";

/*
 * Kahraman sahnesi: gerçek bir Corsi aparatı.
 *
 * Kahraman eskiden tek bir ölçüm kartıydı; doğru şeyi söylüyordu ama
 * sessizdi. Mimio'nun asıl nesnesi masaya dizilmiş dokuz bloktur ve klinik
 * Corsi tahtasında bloklar ızgara değil, düzensiz dağılır. Sahne o tahtayı
 * perspektifte, gerçek hacimli bloklarla kurar ve testin kendisini oynatır:
 *
 *   1. İzle      — bloklar sırayla yükselip yanar, aralarına ışık izi çizilir.
 *   2. Sıra sende — çocuğun dokunuşu aynı sırayı tekrar eder (yeşil halka).
 *   3. Doğru     — dizi bir blok uzar: span 3 → 6, sonra başa döner.
 *
 * Ölçüm çipleri (span, doğruluk, danışan) bloklara iliştirilmiş, kameraya
 * dönük duran "billboard"lardır: tahta döndükçe yerinde kalır, yüzü okura
 * bakar. Tahta imleçle hafifçe döner, kaydırınca düzleşir (perspektif
 * değerleri dışarıdan motion değeri olarak gelir — React'e dokunmaz).
 *
 * Yalnızca transform + opacity. Sahne görünmüyorken döngü durur; hareket
 * azaltmada son dizinin izi yanık hâlde, durağan bir tahta görünür.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/* Düzensiz Corsi yerleşimi (tahta yüzdesi; sol-üst köşe). Blok kenarı
   tahta genişliğinin %14'ü. Tahta en-boy oranı 100:78. */
const BLOCKS = [
  { x: 7, y: 56 },
  { x: 30, y: 71 },
  { x: 14, y: 27 },
  { x: 40, y: 42 },
  { x: 63, y: 66 },
  { x: 52, y: 13 },
  { x: 78, y: 40 },
  { x: 29, y: 4 },
  { x: 81, y: 9 },
] as const;
const SIZE = 14;
const RATIO = 0.78;

const ROUNDS = [
  [2, 5, 4],
  [0, 3, 8, 6],
  [7, 3, 1, 4, 6],
  [2, 7, 5, 6, 4, 0],
] as const;

/* Her tur için okuma: span seriyle birlikte yükselir, doğruluk ve tepki o
   turun kendi denemelerinden (temsilî ama birbirinden ayrışmayan) gelir. */
const READ = [
  { acc: 100, rt: "0,9" },
  { acc: 94, rt: "1,0" },
  { acc: 91, rt: "1,2" },
  { acc: 88, rt: "1,4" },
] as const;

type Phase = "watch" | "recall" | "done";

const center = (i: number) => ({
  cx: BLOCKS[i].x + SIZE / 2,
  cy: (BLOCKS[i].y + SIZE / RATIO / 2) * RATIO,
});

function useCorsiLoop(active: boolean) {
  const [round, setRound] = useState<number>(2);
  const [phase, setPhase] = useState<Phase>("done");
  const [step, setStep] = useState<number>(ROUNDS[2].length);

  useEffect(() => {
    if (!active) return;
    let r = round;
    let ph: Phase = "done";
    let k = 99;
    let timer = 0;
    const tick = () => {
      if (document.hidden) {
        timer = window.setTimeout(tick, 500);
        return;
      }
      const len = ROUNDS[r].length;
      if (ph === "done") {
        r = (r + 1) % ROUNDS.length;
        ph = "watch";
        k = 0;
        setRound(r);
      } else if (ph === "watch") {
        k += 1;
        if (k > ROUNDS[r].length) {
          ph = "recall";
          k = 0;
        }
      } else if (ph === "recall") {
        k += 1;
        if (k > len) ph = "done";
      }
      setPhase(ph);
      setStep(k);
      const wait = ph === "watch" ? (k === 0 ? 700 : 640) : ph === "recall" ? (k === 0 ? 900 : 470) : 2300;
      timer = window.setTimeout(tick, wait);
    };
    timer = window.setTimeout(tick, 900);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { round, phase, step };
}

type Props = {
  /** Kaydırma ilerlemesi (0 → 1) — tahta düzleşir, küçülür. */
  readonly progress: MotionValue<number>;
  /** İmleç eğimi, derece (yaylı). */
  readonly tiltX: MotionValue<number>;
  readonly tiltY: MotionValue<number>;
  readonly play: boolean;
};

export function HeroStage({ progress, tiltX, tiltY, play }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useInView(ref, { amount: 0.2 });
  const reduced = useReducedMotionSafe();
  const active = play && visible && !reduced;
  const { round, phase, step } = useCorsiLoop(active);

  const seq: readonly number[] = ROUNDS[round];
  const read = READ[round];
  /* Hangi bloklar izde: izleme evresinde o ana kadar yananlar, sonrasında hepsi. */
  const shownCount = phase === "watch" ? Math.min(step, seq.length) : seq.length;
  const litNow = phase === "watch" && step >= 1 && step <= seq.length ? seq[step - 1] : -1;
  const tapNow = phase === "recall" && step >= 1 && step <= seq.length ? seq[step - 1] : -1;
  const tapped = phase === "recall" ? seq.slice(0, Math.max(0, step)) : phase === "done" ? seq : [];

  const rx = useTransform([progress, tiltY], ([p, t]: number[]) => `${54 - p * 26 + t * 0.7}deg`);
  const rz = useTransform([progress, tiltX], ([p, t]: number[]) => `${-30 + p * 14 + t * 0.9}deg`);
  const lift = useTransform(progress, [0, 1], [1, 0.86]);
  /* Çiplerin derinliği: üçü farklı oranda kayar, sahne katmanlı okunur. */
  const fx1 = useTransform(tiltX, (t) => t * -2.2);
  const fy1 = useTransform(tiltY, (t) => t * 2.2);
  const fx2 = useTransform(tiltX, (t) => t * -3.4);
  const fy2 = useTransform(tiltY, (t) => t * 3.4);
  const fx3 = useTransform(tiltX, (t) => t * -1.4);
  const fy3 = useTransform(tiltY, (t) => t * 1.4);
  const rise = useTransform(progress, [0, 1], ["0%", "6%"]);

  const pts = seq.slice(0, shownCount).map(center);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.cx.toFixed(2)} ${p.cy.toFixed(2)}`).join(" ");

  const status =
    phase === "watch"
      ? { dot: "var(--color-signature-to)", text: "İzle · dizi oynuyor" }
      : phase === "recall"
        ? { dot: "var(--color-primary)", text: "Sıra sende · aynı sırayla dokun" }
        : { dot: "var(--color-accent-green)", text: `Dizi doğru · span ${seq.length}` };

  return (
    <div ref={ref} className="hero-stage" data-play={play ? "" : undefined} aria-hidden="true">
      <span className="hero-stage-glow" />
      <motion.div className="hero-stage-scene" style={{ scale: reduced ? 1 : lift, y: reduced ? 0 : rise }}>
        <motion.div
          className="hero-board"
          style={{ ["--rx" as string]: reduced ? "50deg" : rx, ["--rz" as string]: reduced ? "-26deg" : rz } as unknown as CSSProperties}
        >
          <div className="hero-board-slab">
            <span className="hero-board-edge hero-board-edge-front" />
            <span className="hero-board-edge hero-board-edge-right" />
            <span className="hero-board-dots" />
          </div>

          {BLOCKS.map((b, i) => {
            const isLit = i === litNow;
            const isTap = i === tapNow;
            const inSeq = seq.slice(0, shownCount).includes(i);
            const wasTapped = tapped.includes(i);
            const order = seq.indexOf(i);
            return (
              <div
                key={i}
                className="hb"
                data-lit={isLit ? "" : undefined}
                data-tap={isTap ? "" : undefined}
                data-trail={inSeq && !isLit ? "" : undefined}
                data-ok={wasTapped && !isTap ? "" : undefined}
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${SIZE}%`, ["--i" as string]: i } as CSSProperties}
              >
                <span className="hb-shadow" />
                <span className="hb-face hb-front" />
                <span className="hb-face hb-right" />
                <span className="hb-face hb-left" />
                <span className="hb-face hb-top">
                  {/* Klinik tahtada bloklar terapist tarafında numaralıdır. */}
                  <span className="hb-num numeral">{i + 1}</span>
                  {order >= 0 && (phase !== "watch" || inSeq) && (
                    <span className="hb-order numeral" key={`${round}-${i}`}>{order + 1}</span>
                  )}
                </span>
                {isTap && <span className="hb-ripple" key={`${round}-${step}`} />}
              </div>
            );
          })}

          {/* Işık izi: blokların üstünde, tahtanın düzleminde süzülür. */}
          <svg className="hero-trace" viewBox={`0 0 100 ${100 * RATIO}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="hero-trace-g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-signature-from)" />
                <stop offset="100%" stopColor="var(--color-signature-to)" />
              </linearGradient>
            </defs>
            {pts.length > 1 && (
              <>
                <path d={path} className="hero-trace-glow" />
                <motion.path
                  key={`${round}-${pts.length}`}
                  d={path}
                  className="hero-trace-line"
                  initial={reduced ? false : { pathLength: (pts.length - 2) / (pts.length - 1) }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              </>
            )}
            {pts.map((p, i) => (
              <circle key={`${round}-${i}`} cx={p.cx} cy={p.cy} r="0.9" className="hero-trace-node" />
            ))}
          </svg>

        </motion.div>
      </motion.div>
      <div className="hero-chips">
          {/* Ölçüm çipleri tahtanın önünde, ayrı bir katmanda: 3B uzayda
            yükselen bloklarla kesişmesinler. Her biri imleçle kendi
            derinliğinde süzülür. */}
        <motion.div className="hero-chip-anchor" style={{ right: "4%", top: "8%", x: fx2, y: fy2 }}>
          <div className="hero-chip hero-chip-span">
            <span className="hero-chip-label">Blok açıklığı</span>
            <span className="hero-chip-big numeral">
              <motion.span key={seq.length} initial={reduced ? false : { y: "60%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} transition={{ duration: 0.5, ease: EASE }} className="inline-block">
                {seq.length}
              </motion.span>
              <span className="hero-chip-unit">span</span>
            </span>
            <span className="hero-chip-steps">
              {[3, 4, 5, 6].map((n) => (
                <span key={n} data-on={n <= seq.length ? "" : undefined} />
              ))}
            </span>
          </div>
        </motion.div>

        <motion.div className="hero-chip-anchor" style={{ left: "6%", bottom: "14%", x: fx1, y: fy1 }}>
          <div className="hero-chip">
            <span className="hero-chip-label">Doğruluk · tepki</span>
            <span className="hero-chip-row numeral">
              <span className="hero-chip-mid">%{read.acc}</span>
              <span className="hero-chip-sep" />
              <span className="hero-chip-mid">{read.rt} sn</span>
            </span>
            <span className="hero-chip-bar"><span style={{ transform: `scaleX(${read.acc / 100})` }} /></span>
          </div>
        </motion.div>

        <motion.div className="hero-chip-anchor" style={{ left: "10%", top: "12%", x: fx3, y: fy3 }}>
          <div className="hero-chip hero-chip-client">
            <span className="hero-chip-avatar">E</span>
            <span className="min-w-0">
              <span className="hero-chip-name">Ela Selin</span>
              <span className="hero-chip-label">6–8 yaş · Sıra Hafızası</span>
            </span>
          </div>
        </motion.div>

        <motion.div className="hero-chip-anchor hero-chip-anchor-status" style={{ right: "12%", bottom: "6%", x: fx1, y: fy1 }}>
          <div className="hero-chip hero-chip-status" data-phase={phase}>
            <span className="hero-chip-dot" style={{ background: status.dot }} />
            <motion.span key={status.text} initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
              {status.text}
            </motion.span>
            {phase === "done" && <Check size={13} strokeWidth={2.5} className="hero-chip-check" />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
