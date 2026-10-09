"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Tanıtım sayfasının imleci.
 *
 * İki katman: imlecin tam konumundaki nokta ve ona yayla yetişen halka.
 * Halka etkileşimli bir öğenin üstüne gelince büyür; öğe `data-cursor`
 * taşıyorsa halkanın içinde o etiket yazar ("Oyna", "Sürükle").
 *
 * Yalnızca ince işaretçili cihazlarda (fare, dokunmatik yüzey) ve hareket
 * azaltma tercihi yokken kurulur. Sistem imleci gizlenmez: halka onu süsler,
 * yerine geçmez — metin seçimi, form alanı ve erişilebilirlik araçları
 * alıştıkları imleci görmeye devam eder.
 */

const INTERACTIVE = "a, button, [role='button'], [role='tab'], [data-cursor], input, textarea, select, label";

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState("");
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });
  const lastTarget = useRef<Element | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduce.matches);
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
      const target = e.target as Element | null;
      if (target === lastTarget.current) return;
      lastTarget.current = target;
      const hit = target?.closest?.(INTERACTIVE) ?? null;
      setHover(hit != null);
      setLabel(hit?.getAttribute("data-cursor") ?? "");
    };
    const leave = () => setVisible(false);
    const press = () => setDown(true);
    const release = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, [enabled, visible, x, y]);

  if (!enabled) return null;

  const ringScale = label ? 2.6 : hover ? 1.7 : 1;

  return (
    <div className="cursor-layer" aria-hidden="true" style={{ opacity: visible ? 1 : 0 }}>
      <motion.span className="cursor-ring" style={{ x: rx, y: ry }}>
        <motion.span
          className="cursor-ring-inner"
          data-hover={hover || undefined}
          data-label={label ? true : undefined}
          animate={{ scale: down ? ringScale * 0.85 : ringScale }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        />
        {/* Etiket ölçeklenen halkanın dışında: halkayla birlikte büyüseydi
            yazı da 2.6 kat büyüyüp bulanıklaşırdı. */}
        <motion.span
          className="cursor-label"
          initial={false}
          animate={{ opacity: label ? 1 : 0, scale: label ? 1 : 0.6 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.span>
      </motion.span>
      <motion.span className="cursor-dot" style={{ x, y }} animate={{ scale: hover ? 0 : 1 }} />
    </div>
  );
}
