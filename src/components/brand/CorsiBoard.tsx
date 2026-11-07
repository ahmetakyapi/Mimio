"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useReducedMotionSafe } from "../motion/Reveal";

/*
 * Dokuz bloklu Corsi tahtası, kendi kendine bir dizi oynatır.
 *
 * Markanın nesnesi (logo bu bloklardan bir M) burada işini yapar: bloklar
 * sırayla yanar, ardından "doğru" anı gelir ve dizi bir blok uzar — span
 * 3'ten 6'ya kadar tırmanır, sonra başa döner. Sağdaki okuma (span, süre)
 * tahtanın bir ölçüm aracı olduğunu söyler.
 *
 * Görünmüyorken ve hareket azaltmada durur; dinlenme karesi son dizinin
 * izi yanık hâlde kalmış tahta.
 */

const SEQS = [
  [6, 1, 5],
  [0, 4, 8, 2],
  [3, 7, 1, 5, 0],
  [2, 6, 4, 8, 0, 7],
] as const;

export function CorsiBoard({ className = "" }: { readonly className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useInView(ref, { amount: 0.4 });
  const reduced = useReducedMotionSafe();
  const [round, setRound] = useState(1);
  const [step, setStep] = useState(-2);

  useEffect(() => {
    if (!visible || reduced) return;
    let r = round;
    let k = -2;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      k += 1;
      const len = SEQS[r % SEQS.length].length;
      /* -2,-1: bekleme · 0..len-1: yanma · len: doğru · len+1..len+2: dinlenme */
      if (k > len + 2) {
        r += 1;
        k = -1;
        setRound(r);
      }
      setStep(k);
    }, 520);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduced]);

  const seq: readonly number[] = SEQS[round % SEQS.length];
  const showing = step >= 0 && step < seq.length;
  const solved = step >= seq.length || reduced || !visible;

  return (
    <div ref={ref} aria-hidden="true" className={`corsi-board ${className}`}>
      <div className="corsi-grid">
        {Array.from({ length: 9 }, (_, i) => {
          const order = seq.indexOf(i);
          const lit = showing && seq[step] === i;
          const trail = solved && order >= 0;
          return (
            <span key={i} className="corsi-cell" data-lit={lit ? "" : undefined} data-trail={trail ? "" : undefined}>
              {trail && <span className="corsi-order numeral">{order + 1}</span>}
            </span>
          );
        })}
      </div>
      <div className="corsi-read">
        <span>
          <span className="numeral corsi-read-value">{seq.length}</span>
          <span className="corsi-read-label">span</span>
        </span>
        <span className={`corsi-ok ${solved ? "is-on" : ""}`}>Dizi doğru</span>
      </div>
    </div>
  );
}
