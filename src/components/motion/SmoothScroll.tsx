"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * Tanıtım sayfasının yumuşak kaydırması.
 *
 * Tarayıcının kendi tekerlek kaydırması 100px'lik basamaklarla ilerliyor;
 * kaydırmaya bağlı her sahne (sabitlenen tur, yatay oyun şeridi, kelime
 * kelime yanan manifesto) bu basamaklarla kesik kesik akıyordu. Lenis
 * tekerleği tek bir sürekli eğriye çeviriyor, sahneler de onunla akıyor.
 *
 * Yalnızca tekerlek ve dokunmatik yüzey: telefonda dokunmatik kaydırma
 * zaten yerel ve ivmeli, üstüne ikinci bir eğri koymak parmağın altındaki
 * sayfayı geciktirir (`syncTouch` kapalı). `prefers-reduced-motion` altında
 * hiç kurulmaz — kaydırma doğrudan tarayıcıya kalır.
 *
 * Uygulama tarafında kullanılmaz: ekranlar kendi iç kaydırıcılarını
 * yönetiyor ve klinik bir araçta tekerleğin "süzülmesi" istenmez.
 */

const LenisContext = createContext<Lenis | null>(null);

/** Aktif örnek — bağlam dışından (ör. `smoothScrollTo`) erişim için. */
let activeLenis: Lenis | null = null;

export function SmoothScroll({ children }: { readonly children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      /* Kendi kaydırmasını yöneten paneller (mobil menü, SSS) zincirlenmesin. */
      prevent: (node) => node.closest?.("[data-lenis-prevent]") != null,
    });
    activeLenis = instance;
    setLenis(instance);

    const loop = (time: number) => {
      instance.raf(time);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      instance.destroy();
      if (activeLenis === instance) activeLenis = null;
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export function useLenis() {
  return useContext(LenisContext);
}

/**
 * Tek kaydırma kapısı.
 *
 * `scrollIntoView({ behavior: "smooth" })` Lenis açıkken onunla yarışıyor:
 * tarayıcı kendi eğrisini çiziyor, Lenis her karede konumu geri yazıyor ve
 * sayfa hedefin yarısında takılıp kalıyordu. Bütün programatik kaydırmalar
 * buradan geçer; Lenis yoksa tarayıcıya düşer.
 */
export function smoothScrollTo(target: string | number | HTMLElement, opts?: { offset?: number; immediate?: boolean }) {
  const el =
    typeof target === "string"
      ? document.getElementById(target.replace(/^#/, ""))
      : target;
  if (el == null) return;

  if (activeLenis) {
    /* Lenis hedefin `scroll-margin-top` değerini de html'in
       `scroll-padding-top` değerini de düşüyor; globals.css ikisini aynı
       başlık payı için tanımlıyor ve pay iki kez sayılınca bölüm başlığı
       ekranın üçte birinde duruyordu. Birinin geri eklenmesi payı teke indirir. */
    const margin = typeof el === "number" ? 0 : Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    activeLenis.scrollTo(el, {
      offset: opts?.offset ?? margin,
      immediate: opts?.immediate,
      duration: 1.4,
    });
    return;
  }

  if (typeof el === "number") {
    window.scrollTo({ top: el, behavior: opts?.immediate ? "auto" : "smooth" });
  } else {
    el.scrollIntoView({ behavior: opts?.immediate ? "auto" : "smooth" });
  }
}

/** Menü, perde gibi tam ekran katmanlar açıkken sayfayı dondurur. */
export function setScrollLocked(locked: boolean) {
  if (!activeLenis) return;
  if (locked) activeLenis.stop();
  else activeLenis.start();
}
