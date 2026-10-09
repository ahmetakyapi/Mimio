"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BlockMark } from "@/components/brand/BlockMark";
import { setScrollLocked } from "./SmoothScroll";

/**
 * Tanıtım ↔ uygulama geçiş perdesi.
 *
 * İki dünya arasındaki geçiş önceden tek bir kareydi: "Giriş Yap"a
 * basıldığı anda tanıtım sayfası yok oluyor, yerine bir iskelet basılıyordu.
 * Kullanıcı nerede olduğunu kaybediyor, ürüne "girdiğini" hissetmiyordu.
 *
 * Perde beş sütundan oluşur. Sütunlar alttan yükselip ekranı kapatır, o
 * an görünüm değişir (bkz. `run`), sonra sütunlar yukarı doğru çekilerek
 * yeni görünümü açar. Ortadaki etiket nereye gidildiğini söyler.
 *
 * `prefers-reduced-motion` altında perde çizilmez; görünüm doğrudan değişir.
 */

type Phase = "idle" | "cover" | "reveal";

interface TransitionApi {
  /** Perdeyi kapat → `swap` çalıştır → perdeyi aç. */
  run: (swap: () => void, label?: string) => void;
}

const TransitionContext = createContext<TransitionApi>({ run: (swap) => swap() });

export function usePageTransition() {
  return useContext(TransitionContext);
}

const COLS = 5;
const EASE = [0.76, 0, 0.24, 1] as const;
const COVER_S = 0.62;
const STAGGER_S = 0.055;

export function PageTransitionProvider({ children }: { readonly children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState("");
  const pending = useRef<(() => void) | null>(null);
  const busy = useRef(false);

  const run = useCallback((swap: () => void, nextLabel = "") => {
    if (busy.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      swap();
      window.scrollTo(0, 0);
      return;
    }
    busy.current = true;
    pending.current = swap;
    setLabel(nextLabel);
    setScrollLocked(true);
    setPhase("cover");
  }, []);

  const onCovered = () => {
    const swap = pending.current;
    pending.current = null;
    swap?.();
    window.scrollTo(0, 0);
    /* Yeni görünümün ilk boyaması perdenin arkasında olsun: iki kare bekle. */
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.setTimeout(() => setPhase("reveal"), 260);
      }),
    );
  };

  const onRevealed = () => {
    setPhase("idle");
    setScrollLocked(false);
    busy.current = false;
  };

  const totalCover = COVER_S + STAGGER_S * (COLS - 1);

  return (
    <TransitionContext.Provider value={{ run }}>
      {children}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            key="curtain"
            className="curtain"
            aria-hidden="true"
            initial={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            {Array.from({ length: COLS }).map((_, i) => (
              <motion.span
                key={i}
                className="curtain-col"
                style={{ originY: phase === "cover" ? 1 : 0 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: phase === "cover" ? 1 : 0 }}
                transition={{ duration: COVER_S, delay: i * STAGGER_S, ease: EASE }}
                onAnimationComplete={() => {
                  if (i !== COLS - 1) return;
                  if (phase === "cover") onCovered();
                  else if (phase === "reveal") onRevealed();
                }}
              />
            ))}
            <motion.div
              className="curtain-label"
              initial={{ opacity: 0, y: 24 }}
              animate={phase === "cover" ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
              transition={{
                duration: 0.45,
                delay: phase === "cover" ? totalCover * 0.55 : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="curtain-mark">
                <BlockMark size={26} color="#ffffff" />
              </span>
              <span className="curtain-text">{label}</span>
              <span className="curtain-dots" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  );
}
