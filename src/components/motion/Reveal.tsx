"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";

/**
 * Kaydırmaya bağlı metin ve sayı hareketleri.
 *
 * Bölüm başlıkları önceden bütün blok olarak yukarı kayıp beliriyordu
 * (`fadeUp`). Okur başlığı tek parça görüyor ama satırların kendi
 * ritmi kayboluyordu. Buradaki bileşenler başlığı satır satır, manifestoyu
 * kelime kelime, sayıları basamak basamak açar.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * `useReducedMotion`, ama ilk boyamada her zaman `false`.
 *
 * Sunucu tercihi bilemez (`null` döner), istemci ilk render'da `true`
 * okuyabilir. Bu değer `initial` ya da `style`a girince sunucunun bastığı
 * stil ile istemcinin ilk stili ayrışıyor, React hidrasyonu atıp ağacı
 * baştan kuruyordu. Tercih ancak bileşen yerleştikten sonra devreye girer;
 * hareket azaltma kullanıcısı için içerik o an süresiz (0 sn) açılır.
 */
/*
 * Dikkat: bu kanca ilk karede `false` döner (hidrasyon güvenliği), hareket
 * azaltma tercihi bir sonraki karede gelir. O arada Framer kaydırma
 * değerlerini öğeye satır içi stil olarak yazmış oluyor; `style` sonra
 * `undefined` yapılınca Framer o stili SİLMİYOR. Azaltılmış dalda bu yüzden
 * nötr değerler açıkça verilir (`{ opacity: 1, y: 0 }`) — aksi hâlde
 * manifesto metni hareket azaltan ziyaretçide %14 opaklıkta takılı
 * kalıyordu.
 */
export function useReducedMotionSafe(): boolean {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!reduced;
}
const VIEW = { once: true, margin: "-12% 0px -12% 0px" } as const;

/* ───────────────────────── Satır maskesi ───────────────────────── */

/**
 * Her satır kendi maskesinin altından yükselir.
 *
 * `lines` düz metin ya da öğe olabilir (vurgu satırı `accent-line` taşır).
 * `play` verilirse görünürlük yerine o değeri bekler — kahraman başlığı
 * açılış perdesinin kalkmasını bekliyor.
 */
export function MaskLines({
  lines,
  delay = 0,
  stagger = 0.09,
  play,
  className,
  lineClassName,
}: {
  readonly lines: readonly ReactNode[];
  readonly delay?: number;
  readonly stagger?: number;
  readonly play?: boolean;
  readonly className?: string;
  readonly lineClassName?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, VIEW);
  const reduced = useReducedMotionSafe();
  const show = reduced || (play ?? inView);

  return (
    <span ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className={`mask-line block ${lineClassName ?? ""}`}>
          <motion.span
            className="block"
            initial={{ y: "108%", rotate: 2.5 }}
            animate={show ? { y: "0%", rotate: 0 } : undefined}
            transition={reduced ? { duration: 0 } : { duration: 1, delay: delay + i * stagger, ease: EASE_OUT }}
            style={{ transformOrigin: "0% 100%" }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ───────────────────────── Görünüme girişte yüksel ───────────────────────── */

export function Rise({
  children,
  delay = 0,
  y = 28,
  className,
  play,
}: {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly y?: number;
  readonly className?: string;
  readonly play?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, VIEW);
  const reduced = useReducedMotionSafe();
  const show = reduced || (play ?? inView);
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={reduced ? { duration: 0 } : { duration: 0.9, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── Manifesto: kelime kelime aydınlanan metin ───────────────────────── */

/**
 * Metin kaydırmayla birlikte okunur: her kelime, kaydırma onun sırasına
 * geldiğinde soluk tondan tam tona geçer. Okurun gözü ile sayfanın hızı
 * aynı yerde buluşur — awwwards sitelerinin en çok taklit edilen hareketi.
 *
 * `accent` listesindeki kelimeler tam tona geçtiklerinde marka rengine boyanır.
 */
export function ScrubWords({
  text,
  accent = [],
  className,
}: {
  readonly text: string;
  readonly accent?: readonly string[];
  readonly className?: string;
}) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88", "end 0.42"] });
  const words = text.split(" ");

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        const isAccent = accent.includes(w.replace(/[.,;:!?]/g, ""));
        return (
          <ScrubWord
            key={i}
            progress={scrollYProgress}
            range={[start, end]}
            accent={isAccent}
            reduced={!!reduced}
          >
            {w}
          </ScrubWord>
        );
      })}
    </p>
  );
}

function ScrubWord({
  children,
  progress,
  range,
  accent,
  reduced,
}: {
  readonly children: string;
  readonly progress: MotionValue<number>;
  readonly range: [number, number];
  readonly accent: boolean;
  readonly reduced: boolean;
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [6, 0]);
  return (
    <span className="scrub-word">
      <motion.span
        style={reduced ? { opacity: 1, y: 0 } : { opacity, y }}
        className={accent ? "scrub-accent" : undefined}
      >
        {children}
      </motion.span>{" "}
    </span>
  );
}

/* ───────────────────────── Sayaç ───────────────────────── */

/**
 * Sayı görünüme girdiğinde sıfırdan değerine sayar. Değer sayı değilse
 * (ör. "4:12") dokunulmadan basılır.
 */
export function CountUp({ value, duration = 1.6, className }: { readonly value: string; readonly duration?: number; readonly className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotionSafe();
  const target = Number(value);
  const numeric = Number.isFinite(target) && value.trim() !== "";
  const [shown, setShown] = useState(numeric ? "0" : value);

  useEffect(() => {
    if (!numeric || reduced || !inView) {
      if (!numeric || reduced) setShown(value);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(String(Math.round(v))),
    });
    return () => controls.stop();
  }, [inView, numeric, reduced, target, duration, value]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}

/* ───────────────────────── Hıza duyarlı kayan şerit ───────────────────────── */

function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

/**
 * Sonsuz kayan şerit. Kendi hızında akar; sayfa kaydırıldıkça hızlanır ve
 * kaydırma yönüne döner, durunca kendi hızına geri yavaşlar. Hızla birlikte
 * öğeler hafifçe eğilir — şerit sayfanın ataletini taşır.
 */
export function VelocityMarquee({
  children,
  baseVelocity = -2,
  className,
}: {
  readonly children: ReactNode;
  readonly baseVelocity?: number;
  readonly className?: string;
}) {
  const reduced = useReducedMotionSafe();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [-1000, 0, 1000], [-4, 0, 4], { clamp: false });
  const skew = useTransform(smoothVelocity, [-2000, 0, 2000], [7, 0, -7]);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const direction = useRef(1);
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref);

  useAnimationFrame((_, delta) => {
    if (reduced || !inView) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) direction.current = -1;
    else if (vf > 0) direction.current = 1;
    moveBy += direction.current * moveBy * vf;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div ref={ref} className={`overflow-hidden whitespace-nowrap flex flex-nowrap ${className ?? ""}`}>
      <motion.div className="flex flex-nowrap shrink-0" style={{ x, skewX: reduced ? 0 : skew }}>
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className="flex flex-nowrap shrink-0" aria-hidden={k > 0 || undefined}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ───────────────────────── Perspektifle oturan yüzey ───────────────────────── */

/**
 * Büyük bir ekran görüntüsü sahneye yatık girer ve kaydırmayla düzleşir:
 * önce masaya bırakılmış bir kâğıt gibi uzaktan, sonra okurun önünde dik.
 * Hareket kaydırmaya bağlı — okur durursa yüzey de durur.
 */
export function ScrollPerspective({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.18"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const rotateX = useTransform(p, [0, 1], [28, 0]);
  const scale = useTransform(p, [0, 1], [0.86, 1]);
  const y = useTransform(p, [0, 1], [80, 0]);
  const opacity = useTransform(p, [0, 0.35], [0.3, 1]);
  return (
    <div ref={ref} className={className} style={{ perspective: 1600 }}>
      <motion.div
        style={reduced ? { rotateX: 0, scale: 1, y: 0, opacity: 1 } : { rotateX, scale, y, opacity, transformOrigin: "50% 0%" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ───────────────────────── Kaydırmayla dolan ray ───────────────────────── */

/**
 * Dikey adım rayı. Gri iz sabit durur, üstündeki imza çizgisi okur adımları
 * geçtikçe dolar — "neredeyim" sorusunun yanıtı rayın kendisi olur.
 */
export function ScrollRail({ className }: { readonly className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.55"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 26 });
  return (
    <span ref={ref} aria-hidden="true" className={className} style={{ background: "var(--color-line-strong)" }}>
      <motion.span
        className="absolute inset-0 origin-top"
        style={{ background: "var(--gradient-bar)", scaleY: reduced ? 1 : scaleY }}
      />
    </span>
  );
}
