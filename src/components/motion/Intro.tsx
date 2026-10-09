"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MARK_PATH, MARK_VIEWBOX } from "@/lib/brand-mark";
import { setScrollLocked } from "./SmoothScroll";

/**
 * Açılış perdesi.
 *
 * Sayfa ilk açıldığında yazı tipleri ve ilk görseller gelene kadar kahraman
 * birkaç yüz milisaniye boyunca sistem fontuyla basılıyor, sonra yerine
 * oturuyordu — markanın ilk izlenimi bir "zıplama"ydı. Perde o aralığı
 * kendi anına çeviriyor: monogram çiziliyor, sayaç yüze çıkıyor, perde
 * kalkarken kahraman satır satır yerine yükseliyor.
 *
 * Oturum başına bir kez. Aynı oturumda tanıtıma geri dönen ya da doğrudan
 * panele giren kullanıcı perdeyi bir daha görmez: `layout.tsx`teki satır içi
 * betik boyamadan önce `html[data-intro="skip"]` yazar, perde CSS ile hiç
 * çizilmez. `prefers-reduced-motion` altında da çizilmez.
 */

const INTRO_KEY = "mimio-intro-seen";
/** Sayacın en kısa süresi — yazı tipleri daha önce gelse de perde bu kadar kalır. */
const MIN_MS = 1500;
/** Yazı tipi hiç gelmezse perde en geç bu sürede kalkar. */
const MAX_MS = 3200;

const IntroContext = createContext(true);

function seenThisSession() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

/** Perde kalktı mı? Kahraman girişini bu değere bağlar. */
export function useIntroDone() {
  return useContext(IntroContext);
}

const EASE_CURTAIN = [0.76, 0, 0.24, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function IntroProvider({ children, enabled }: { readonly children: ReactNode; readonly enabled: boolean }) {
  /*
   * Sunucu her zaman "perde var" basar; böylece ilk boyamada kahraman
   * görünmez ve perde kalkarken girer. Atlanacaksa istemci ilk effect'te
   * kararını verir — satır içi betik perdeyi zaten görünmez yapmış olur.
   */
  const [phase, setPhase] = useState<"count" | "exit" | "gone">("count");
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    const skip =
      !enabled ||
      root.dataset.intro === "skip" ||
      seenThisSession() ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skip) {
      setPhase("gone");
      return;
    }

    setScrollLocked(true);
    root.style.overflow = "hidden";
    const start = performance.now();
    let fontsReady = false;
    document.fonts?.ready.then(() => { fontsReady = true; }).catch(() => { fontsReady = true; });

    const tick = (now: number) => {
      const elapsed = now - start;
      /* Sayaç doğrusal değil: başta hızlı, sonda yavaşlayan bir eğri.
         Yazı tipleri gelmediyse %92'de bekler — sahte bir "%100" yok. */
      const t = Math.min(1, elapsed / MIN_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      const cap = fontsReady || elapsed > MAX_MS ? 1 : 0.92;
      const p = Math.min(cap, eased);
      setProgress(p);
      if (p >= 1) {
        try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* gizli sekme */ }
        root.dataset.intro = "skip";
        window.setTimeout(() => setPhase("exit"), 180);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      root.style.overflow = "";
      setScrollLocked(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (phase === "exit") {
      document.documentElement.style.overflow = "";
      setScrollLocked(false);
    }
  }, [phase]);

  const done = phase !== "count";

  return (
    <IntroContext.Provider value={done}>
      {children}
      <AnimatePresence>
        {phase !== "gone" && enabled && (
          <motion.div
            key="intro"
            className="preloader"
            aria-hidden="true"
            initial={false}
            animate={phase === "exit" ? { clipPath: "inset(0% 0% 100% 0%)" } : { clipPath: "inset(0% 0% 0% 0%)" }}
            transition={{ duration: 1.05, ease: EASE_CURTAIN }}
            onAnimationComplete={() => { if (phase === "exit") setPhase("gone"); }}
          >
            {/* Perdenin arkasından gelen ikinci katman: imza degradesi. Perde
                kalkarken bir an görünür, sayfaya geçişin rengi olur. */}
            <motion.span
              className="preloader-tail"
              initial={false}
              animate={phase === "exit" ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 0.9, ease: EASE_CURTAIN }}
            />

            <div className="preloader-center">
              <svg viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`} className="preloader-mark">
                <motion.path
                  d={MARK_PATH}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={0.5}
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: EASE_OUT }}
                />
                <motion.path
                  d={MARK_PATH}
                  fill="url(#preloader-grad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: progress > 0.55 ? 1 : 0 }}
                  transition={{ duration: 0.6 }}
                />
                <defs>
                  <linearGradient id="preloader-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4d7dff" />
                    <stop offset="100%" stopColor="#2ad6ef" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="preloader-word">
                {"Mimio".split("").map((ch, i) => (
                  <span key={i} className="mask-line">
                    <motion.span
                      className="inline-block"
                      initial={{ y: "110%" }}
                      animate={{ y: phase === "exit" ? "-110%" : "0%" }}
                      transition={{
                        duration: phase === "exit" ? 0.5 : 0.8,
                        delay: phase === "exit" ? i * 0.03 : 0.25 + i * 0.06,
                        ease: EASE_OUT,
                      }}
                    >
                      {ch}
                    </motion.span>
                  </span>
                ))}
              </span>
            </div>

            <div className="preloader-foot">
              <span className="preloader-label">
                <span className="mask-line">
                  <motion.span
                    className="inline-block"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT }}
                  >
                    Ölçüm temelli ergoterapi
                  </motion.span>
                </span>
              </span>
              <span className="preloader-count numeral">
                {String(Math.round(progress * 100)).padStart(3, "0")}
              </span>
            </div>
            <span className="preloader-bar" style={{ transform: `scaleX(${progress})` }} />
          </motion.div>
        )}
      </AnimatePresence>
    </IntroContext.Provider>
  );
}
