"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { setScrollLocked } from "./SmoothScroll";

/**
 * Açılış — "Bloklar".
 *
 * Eski perde büyük bir 000→100 sayacıydı; aynı kalıp sahibin beş sitesinde
 * birden açılıyordu ve Mimio'ya ait hiçbir şey söylemiyordu. Bu giriş
 * ürünün kendi malzemesinden kurulur:
 *
 *   1. Sıra Hafızası oyunundaki yumuşak köşeli bloklar, M'nin çizgisini
 *      izleyerek tek tek düşer ve hafif bir yaylanmayla oturur.
 *   2. Bloklar birbirine "tık" diye kenetlenir: aradaki boşluk kapanır,
 *      döşeme monograma dönüşür.
 *   3. Kelime markası altından yükselir; altında seans grafiğinin eğrisi
 *      soldan sağa çizilir — her nokta bir ölçüm.
 *   4. Ekranı kaplayan zemin aslında bir blok ızgarası: merkezden dışa
 *      doğru her blok küçülüp kaybolur, kahraman aralarından görünür.
 *
 * Yaklaşık 2,2 sn. Kurulum (1-3) tamamen CSS ile, sunucunun bastığı
 * işaretlemeden başlar — hidrasyonu beklemez. Çıkışı (4) istemci, kurulum
 * bitince ve sayfa canlandığında tetikler; betik hiç çalışmazsa CSS
 * güvenlik animasyonu perdeyi 4,2 sn'de kendisi kaldırır.
 *
 * Yalnızca transform, opacity ve clip-path canlandırılır.
 *
 * Oturum başına bir kez: `layout.tsx`teki satır içi betik boyamadan önce
 * `html[data-intro="skip"]` yazar, perde CSS ile hiç çizilmez.
 * `prefers-reduced-motion` altında da çizilmez.
 */

const INTRO_KEY = "mimio-intro-seen";
/** Kurulumun bittiği an (ms, CSS zaman çizelgesiyle aynı). */
const LEAVE_AT = 1500;
/** Çıkışın sürdüğü en uzun süre: en uzak bloğun gecikmesi + kendi süresi. */
const LEAVE_MS = 760;
/** CSS güvenlik animasyonunun başladığı an — bundan sonra perde zaten kalkmıştır. */
const FAILSAFE_AT = 4200;
/** Arka plan ızgarasının blok sayısı — en geniş ekranı da örter. */
const CELL_COUNT = 320;

/**
 * M'nin blokları (satır, sütun) — 5×5 ızgarada, çizildiği sırayla:
 * sol ayak aşağıdan yukarı, vadiye iniş, tepeye çıkış, sağ ayak aşağı.
 * Sağ ayak bir satır kısa: markadaki "yukarı bırakılan grafik" okuması.
 */
const TILES: ReadonlyArray<readonly [number, number]> = [
  [4, 0], [3, 0], [2, 0], [1, 0], [0, 0],
  [1, 1], [2, 2], [1, 3],
  [0, 4], [1, 4], [2, 4], [3, 4],
];

/** Seans grafiği: yükselen, ortada bir kez soluklanan eğri (viewBox 120×28). */
const CHART_POINTS: ReadonlyArray<readonly [number, number]> = [
  [4, 22], [31, 16], [58, 18.5], [86, 9.5], [116, 4.5],
];
const CHART_PATH =
  "M4 22 C 14 22, 21 16, 31 16 S 48 18.5, 58 18.5 S 74 9.5, 86 9.5 S 106 4.5, 116 4.5";

const IntroContext = createContext(true);

/** Perde kalktı mı? Kahraman girişini bu değere bağlar. */
export function useIntroDone() {
  return useContext(IntroContext);
}

export function IntroProvider({ children, enabled }: { readonly children: ReactNode; readonly enabled: boolean }) {
  /*
   * Sunucu her zaman perdeyi basar; böylece ilk boyamada kahraman görünmez
   * ve perde kalkarken girer. Atlanacaksa istemci ilk effect'te kararını
   * verir — satır içi betik perdeyi zaten görünmez yapmış olur.
   */
  const [phase, setPhase] = useState<"build" | "leave" | "gone">("build");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    /* Oturum bayrağı boyamadan önce `data-intro="skip"`e çevrildi; burada
       yeniden okunmaz — StrictMode'un ikinci effect turu, ilk turun yazdığı
       bayrağı görüp girişi yarıda keserdi. */
    const skip =
      !enabled ||
      root.dataset.intro === "skip" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skip) {
      setPhase("gone");
      return;
    }

    /* Bayrak hemen yazılır: kurulum sırasında yenilenen sayfa girişi
       ikinci kez oynatmaz. */
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* gizli sekme */ }

    /* CSS zaman çizelgesi hidrasyondan önce başladı; ne kadar ilerlediğini
       perdenin kendi güvenlik animasyonundan okuyoruz. */
    const el = rootRef.current;
    const anim = el?.getAnimations?.()[0];
    const elapsed = typeof anim?.currentTime === "number" ? anim.currentTime : 0;
    if (!el || elapsed >= FAILSAFE_AT) {
      setPhase("gone");
      return;
    }

    setScrollLocked(true);
    root.style.overflow = "hidden";

    let leaveTimer = 0;
    let goneTimer = 0;
    let cancelled = false;

    const leave = () => {
      if (cancelled) return;
      /* Her blok merkeze uzaklığı kadar gecikir: ızgara ortadan açılır. */
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw / 2;
      const cy = vh / 2;
      const maxD = Math.hypot(cx, cy) || 1;
      el.querySelectorAll<HTMLElement>(".intro-cell").forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) {
          c.style.visibility = "hidden";
          return;
        }
        const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy) / maxD;
        c.style.setProperty("--d", `${Math.round(90 + d * d * 200 + d * 30)}ms`);
      });
      setPhase("leave");
      root.style.overflow = "";
      setScrollLocked(false);
      goneTimer = window.setTimeout(() => {
        /* Aynı yüklemede tanıtıma geri dönülürse (çıkış → tanıtım) perde
           yeniden çizilmesin. */
        root.dataset.intro = "skip";
        setPhase("gone");
      }, LEAVE_MS);
    };

    /* Yazı tipi gelmeden kelime markası sistem fontuyla görünmesin — ama
       en geç güvenlik süresinden önce çıkılır. */
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const fontCap = new Promise((r) => window.setTimeout(r, FAILSAFE_AT - elapsed - LEAVE_MS - 200));
    void Promise.race([fonts, fontCap]).then(() => {
      if (cancelled) return;
      const now = typeof anim?.currentTime === "number" ? anim.currentTime : LEAVE_AT;
      leaveTimer = window.setTimeout(leave, Math.max(0, LEAVE_AT - now));
    });

    return () => {
      cancelled = true;
      window.clearTimeout(leaveTimer);
      window.clearTimeout(goneTimer);
      root.style.overflow = "";
      setScrollLocked(false);
    };
  }, [enabled]);

  const done = phase !== "build";

  return (
    <IntroContext.Provider value={done}>
      {children}
      {phase !== "gone" && enabled && (
        <div ref={rootRef} className="intro" data-state={phase} aria-hidden="true">
          <div className="intro-cells">
            {Array.from({ length: CELL_COUNT }, (_, i) => (
              <span key={i} className="intro-cell" />
            ))}
          </div>

          <div className="intro-stage">
            <span className="intro-halo" />
            <div className="intro-mark">
              {TILES.map(([r, c], i) => (
                <span
                  key={`${r}-${c}`}
                  className="intro-tile"
                  style={
                    {
                      "--r": r,
                      "--c": c,
                      "--i": i,
                      /* Renk monogramın köşegeni boyunca maviden cyana. */
                      "--mix": `${Math.round(((c + r * 0.5) / 6) * 100)}%`,
                    } as CSSProperties
                  }
                >
                  <span className="intro-tile-face" />
                </span>
              ))}
            </div>

            <div className="intro-lockup">
              <span className="intro-word">
                {"Mimio".split("").map((ch, i) => (
                  <span key={i} className="intro-letter" style={{ "--i": i } as CSSProperties}>
                    {ch}
                  </span>
                ))}
              </span>
              <svg className="intro-chart" viewBox="0 0 120 28" fill="none">
                <defs>
                  <linearGradient id="intro-chart-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-signature-from)" />
                    <stop offset="100%" stopColor="var(--color-signature-to)" />
                  </linearGradient>
                </defs>
                <line className="intro-chart-base" x1="4" y1="26" x2="116" y2="26" />
                <g className="intro-chart-draw">
                  <path d={CHART_PATH} stroke="url(#intro-chart-grad)" strokeWidth="2.2" strokeLinecap="round" />
                </g>
                {CHART_POINTS.map(([x, y], i) => (
                  <circle
                    key={x}
                    className={i === CHART_POINTS.length - 1 ? "intro-dot intro-dot-last" : "intro-dot"}
                    cx={x}
                    cy={y}
                    r={i === CHART_POINTS.length - 1 ? 3.4 : 2.3}
                    style={{ "--t": `${Math.round(700 + (x / 120) * 760)}ms` } as CSSProperties}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}
    </IntroContext.Provider>
  );
}
