"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useReducedMotionSafe } from "../motion/Reveal";

/*
 * Kapanış panelinin zemini: Corsi bloklarından bir ızgara.
 *
 * Bloklar panelde soluk durur; görünürken her 2,4 sn'de bir dört bloklu
 * bir dizi sırayla yanar — sayfa, kahramanda vaat ettiği oyunu son ekranda
 * kendi kendine oynar. İmleç ızgaranın üstünde bir el feneri gibi gezer:
 * yakınındaki blokların kenarı aydınlanır (yalnızca CSS maskesi, React'e
 * dokunmaz). Dokunmatikte ve hareket azaltmada ızgara durağandır.
 */

const COLS = 14;
const ROWS = 6;
const N = COLS * ROWS;

function pickSequence(seed: number) {
  const out: number[] = [];
  let s = seed * 9301 + 49297;
  while (out.length < 4) {
    s = (s * 9301 + 49297) % 233280;
    const i = Math.floor((s / 233280) * N);
    /* Metnin tam arkası (orta sütunlar, orta satırlar) dizi dışı. */
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    const behindText = c > 2 && c < COLS - 3;
    if (!behindText && !out.includes(i)) out.push(i);
  }
  return out;
}

export function CtaBlocks() {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotionSafe();
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!visible || reduced) return;
    let k = 0;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      k += 1;
      /* 4 yanma + 2 dinlenme adımı. */
      const phase = k % 6;
      if (phase === 0) setRound((r) => r + 1);
      setStep(phase < 4 ? phase : -1);
    }, 420);
    return () => window.clearInterval(id);
  }, [visible, reduced]);

  const seq = pickSequence(round + 3);
  const lit = step >= 0 ? seq[step] : -1;
  const trail = step >= 0 ? seq.slice(0, step) : [];

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--fx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--fy", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      onPointerMove={onMove}
      className="cta-blocks"
      style={{ ["--cols" as string]: COLS }}
    >
      {Array.from({ length: N }, (_, i) => (
        <span
          key={i}
          className="cta-block"
          data-lit={i === lit ? "" : undefined}
          data-trail={trail.includes(i) ? "" : undefined}
        />
      ))}
    </div>
  );
}
