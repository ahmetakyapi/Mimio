"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Ear,
  Eye,
  FileText,
  Gamepad2,
  Hand,
  LayoutDashboard,
  Minus,
  Play,
  Plus,
  Puzzle,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { PLATFORM_STATS } from "@/lib/platform-stats";
import { MaskLines, VelocityMarquee, useReducedMotionSafe } from "@/components/motion/Reveal";
import { smoothScrollTo } from "@/components/motion/SmoothScroll";

const prefersReduced =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ════════════════════════════════════════════════════════════════
   2. SIDE SECTION NAV DOTS (desktop only)
   ════════════════════════════════════════════════════════════════ */

interface SectionDotsProps {
  sections: readonly { id: string; label: string }[];
}
export function SectionDots({ sections }: SectionDotsProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) setActive(s.id);
          });
        },
        { threshold: [0.35, 0.55], rootMargin: "-20% 0px -40% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  return (
    <div className="section-dots" aria-label="Sayfa bölümleri">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className="section-dot group"
          data-active={active === s.id}
          aria-label={s.label}
          onClick={() => smoothScrollTo(s.id)}
        >
          <span className="section-dot-label">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   3. MAGNETIC BUTTON — pulls toward cursor on hover
   ════════════════════════════════════════════════════════════════ */

interface MagneticProps extends PropsWithChildren {
  strength?: number;
  className?: string;
}
export function Magnetic({ children, strength = 22, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(relX * relX + relY * relY);
      const max = Math.max(rect.width, rect.height);
      const factor = Math.min(1, dist / max);
      x.set((relX / max) * strength * (1 - factor * 0.4));
      y.set((relY / max) * strength * (1 - factor * 0.4));
    };
    const handleLeave = () => {
      x.set(0);
      y.set(0);
    };
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength, x, y]);

  return (
    <motion.div ref={ref} className={`magnetic ${className ?? ""}`} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. TILT CARD — 3D mouse-tracked card
   ════════════════════════════════════════════════════════════════ */

interface TiltCardProps extends PropsWithChildren {
  max?: number;
  className?: string;
  glare?: boolean;
}
export function TiltCard({ children, max = 9, className, glare = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -2 * max;
      const ry = (px - 0.5) * 2 * max;
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    };
    const handleLeave = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [max]);

  return (
    <div ref={ref} className={`tilt-3d relative h-full ${className ?? ""}`}>
      {children}
      {glare && <span className="tilt-shine" />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   5. SKILLS MARQUEE — scrolling strip of therapy skill areas
   ════════════════════════════════════════════════════════════════ */

const SKILL_AREAS = [
  { name: "İnce Motor Beceriler", kind: "Motor", icon: Hand },
  { name: "El-Göz Koordinasyonu", kind: "Motor", icon: Target },
  { name: "Çalışma Belleği", kind: "Bilişsel", icon: Brain },
  { name: "Görsel Algı", kind: "Bilişsel", icon: Eye },
  { name: "Seçici Dikkat", kind: "Bilişsel", icon: Zap },
  { name: "İşitsel Dikkat", kind: "Bilişsel", icon: Ear },
  { name: "Yürütücü İşlevler", kind: "Bilişsel", icon: Puzzle },
  { name: "Planlama & Problem Çözme", kind: "Bilişsel", icon: ClipboardList },
] as const;

/**
 * Beceri alanları şeridi.
 *
 * Önceki şerit küçük çipler halinde sabit hızda akıyordu; sayfanın geri
 * kalanıyla hiçbir bağı yoktu ve bir "logo bandı" gibi okunuyordu. Şimdi
 * iki satır, ekran genişliğinde dev yazı: biri dolu, biri kontur; ters
 * yönlerde akarlar. Sayfa kaydırıldıkça hızlanır, yönünü kaydırmaya göre
 * çevirir ve hızla birlikte hafifçe eğilir (bkz. `VelocityMarquee`).
 *
 * Bilgi aynı: sekiz beceri alanı. Ekran okuyucu için liste ayrıca düz
 * metin olarak verilir; kayan kopyalar `aria-hidden`.
 */
export function TrustMarquee() {
  const half = Math.ceil(SKILL_AREAS.length / 2);
  const rows = [SKILL_AREAS.slice(0, half), SKILL_AREAS.slice(half)];
  return (
    <section className="py-[clamp(2.5rem,6vw,5rem)] relative overflow-hidden border-y border-(--color-line)">
      <p className="sr-only">
        Oyunlar ve aktiviteler şu beceri alanlarını çalışır: {SKILL_AREAS.map((s) => s.name).join(", ")}.
      </p>
      <div aria-hidden="true" className="flex flex-col gap-2 sm:gap-4">
        {rows.map((row, r) => (
          <VelocityMarquee key={r} baseVelocity={r === 0 ? -1.6 : 1.6}>
            {row.map((t) => {
              const Icon = t.icon;
              return (
                <span key={t.name} className="mega-marquee-item" data-outline={r === 1 || undefined}>
                  {t.name}
                  <span className="mega-marquee-sep">
                    <Icon className="w-[45%] h-[45%]" strokeWidth={2.2} />
                  </span>
                </span>
              );
            })}
          </VelocityMarquee>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   7. STICKY WALKTHROUGH — pinned scene that changes with scroll
   ════════════════════════════════════════════════════════════════ */

const WALKTHROUGH = [
  {
    title: "Danışanı Tanıyın",
    body: "Demografik, klinik not ve değerlendirme verilerini tek ekranda toplayın. Her danışan için bir hafıza merkezi.",
    icon: Users,
    accent: "var(--color-primary)",
    preview: "clients",
  },
  {
    title: "Haftalık Planı Oluşturun",
    body: "Terapi hedeflerine göre beceri alanlarını (motor, bilişsel, duyusal) seçin. Akıllı öneri motoru günün programını hazırlar.",
    icon: LayoutDashboard,
    accent: "var(--color-primary)",
    preview: "plan",
  },
  {
    title: "Seansı Oyunlaştırın",
    body: `${PLATFORM_STATS.gameCount} terapi oyunundan birini başlatın. Skorlar anlık kaydedilir, zorluk danışan profiline göre seçilir.`,
    icon: Gamepad2,
    accent: "var(--color-accent-violet)",
    preview: "game",
  },
  {
    title: "Gelişimi Raporlayın",
    body: "Yazdırılabilir raporlar ve grafiklerle ilerlemeyi görselleştirin; seans verilerini CSV olarak dışa aktarın.",
    icon: BarChart3,
    accent: "var(--color-accent-green)",
    preview: "report",
  },
] as const;

/** Adım başına ayrılan kaydırma payı (dvh). Sabitlenen ekran payı hariç. */
const STEP_TRAVEL_DVH = 70;

/** Kendiliğinden ilerlemede bir adımın ekranda kalma süresi. */
const STEP_DURATION_MS = 4600;

/**
 * Kaydırmadan sonra zamanlayıcının susacağı süre.
 *
 * İkisi aynı anda çalışırsa kullanıcı kaydırırken adım altından kayıyor.
 * Kaydırma her zaman önceliklidir; durduktan bu kadar sonra tur kaldığı
 * yerden kendi kendine devam eder.
 */
const SCROLL_GRACE_MS = 2600;

/**
 * Adım değişimi için gereken güvenlik payı (bant genişliğinin oranı).
 * Sınırda ileri geri salınan kaydırmanın adımı zıplatmasını engeller.
 */
const STEP_HYSTERESIS = 0.12;

export function StickyWalkthrough() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [active, setActive] = useState(0);
  const steps = WALKTHROUGH.length;
  const reducedMotion = useReducedMotionSafe();

  /* Bölüm ekranda mı? Zamanlayıcı yalnızca buradayken çalışır; sayfanın
     başka yerindeyken görünmeyen bir turu ilerletmenin anlamı yok. */
  const [inView, setInView] = useState(false);
  /* Son kaydırma anı. Ref, çünkü değeri her değiştiğinde yeniden render
     etmenin gereği yok — yalnızca zamanlayıcı okuyor. */
  const lastScrollAt = useRef(0);

  /* İlerleme çubuğu adım sayısını gösterir. Kaydırmaya bağlıyken zamanlayıcı
     adımı değiştirdiğinde çubuk yerinde kalıyor, ikisi birbirini yalanlıyordu. */
  const stepProgress = useSpring(1 / steps, { stiffness: 120, damping: 26, mass: 0.4 });
  useEffect(() => {
    stepProgress.set((active + 1) / steps);
  }, [active, steps, stepProgress]);

  /*
   * Hangi adımdayız?
   *
   * Önceki kurgu ham kaydırmayı bir yaya veriyor, adımı da yayın çıktısından
   * `Math.floor` ile buluyordu. İki hata birden: yay sönümlenirken sınırın
   * çevresinde salınıyor (2 → 3 → 2), ve `floor` sınırda histerezissiz
   * olduğu için her salınım bir adım değişimi sayılıyordu. Bölüm bu yüzden
   * kaydırırken takılıyordu.
   *
   * Artık eşik ham kaydırmadan okunur ve bir güvenlik payı taşır: adım
   * ancak mevcut bandın HYSTERESIS kadar dışına çıkılınca değişir. Yumuşatma
   * gerektiği yerde, yani geçişin kendisinde yapılır — sayının hesabında değil.
   */
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    lastScrollAt.current = Date.now();
    const raw = v * steps;
    /*
     * Mutlak indekse atlamak yerine tek adım ilerleniyor. Zamanlayıcı adımı
     * kaydırma konumundan bağımsız değiştirebildiği için `Math.floor(raw)`
     * kullanıcı yeniden kaydırdığı anda turu bambaşka bir adıma sıçratıyordu.
     * Tek adımlık hareket iki mekanizmayı birbirine ekliyor: kaydırma nereden
     * bırakıldıysa oradan devam eder. Olaylar saniyede onlarca kez geldiği
     * için hızlı kaydırma yine hızlı ilerliyor.
     */
    setActive((prev) => {
      const target = Math.min(steps - 1, Math.max(0, Math.floor(raw)));
      /* Büyük sıçrama (kaydırma çubuğunu sürükleme, End tuşu) tek adımla
         takip edilemez; orada konuma uyulur. Küçük hareketlerde tek adım. */
      if (Math.abs(target - prev) >= 2) return target;
      if (raw >= prev + 1 + STEP_HYSTERESIS) return Math.min(steps - 1, prev + 1);
      if (raw < prev - STEP_HYSTERESIS) return Math.max(0, prev - 1);
      return prev;
    });
  });

  /*
   * Kendiliğinden ilerleme.
   *
   * Tur yalnızca kaydırmaya bağlıyken, sayfayı okuyup duran biri ilk adımda
   * kalıyordu — dört adımın üçü hiç görünmüyordu. Zamanlayıcı bölüm ekranda
   * ve kullanıcı kaydırmıyorken devreye giriyor, son adımdan başa dönüyor.
   *
   * `prefers-reduced-motion` altında kapalı: kendiliğinden değişen içerik
   * tam olarak bu tercihin kapsadığı şey. Sekme arkada olduğunda da durur.
   */
  useEffect(() => {
    if (reducedMotion || !inView) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      if (Date.now() - lastScrollAt.current < SCROLL_GRACE_MS) return;
      setActive((prev) => (prev + 1) % steps);
    }, STEP_DURATION_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, inView, steps]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /*
    Telefonda sabitleme (`sticky` + `h-screen` + `overflow-hidden`) tümüyle
    kapalı: tek sütuna inen liste + önizleme bir ekrana sığmadığı için ilk
    adım üst çubuğun altında, önizleme kartı da ortasından kesiliyordu.
    Mobilde bölüm normal akışta dikey olarak uzuyor; `lg`ten itibaren
    sabitlenen sahne aynen geri geliyor.
  */
  return (
    <section id="walkthrough" className="relative">
      <div
        ref={ref}
        className="h-auto lg:h-[var(--wt-track)]"
        /*
          Sabitlenen sahne bir ekran kaplar; `useScroll` ilerlemeyi
          `ray - ekran` üzerinde ölçer. Ray `steps * 58dvh` iken gerçek pay
          232 - 100 = 132dvh, yani adım başına 33dvh kalıyordu: ekranın
          üçte biri kaydırmada bir adım tükeniyor, bazı adımlar göz
          kırpmasında geçiyordu. Ekran payı formüle açıkça yazıldı ki
          `STEP_TRAVEL_DVH` gerçekten adım başına düşen mesafe olsun.
        */
        style={{ "--wt-track": `calc(100dvh + ${steps * STEP_TRAVEL_DVH}dvh)` } as React.CSSProperties}
      >
        {/*
          Sahne ekranın tamamını kaplar ve içerik ortalanır.
          `max-h-[46rem]` sahneyi 736px'e sabitliyordu: 1080px'lik bir ekranda
          altta 344px boşluk kalıyor, üstelik sahne `top-0` olduğu için başlık
          sabit üst çubuğun dibine yapışıyordu. Yükseklik ekranı takip ediyor,
          `pt-16` üst çubuğun payını düşüyor, `items-center` kalanı ortalıyor.
        */}
        <div className="wt-scene relative lg:sticky lg:top-0 lg:h-[100dvh] flex items-center overflow-visible lg:overflow-hidden max-lg:py-12 lg:pt-16">
          <div className="absolute inset-0 -z-10 dot-grid opacity-70" />

          {/* Yan boşluk sayfanın kendi oluğuyla aynı: telefonda adım kartları
              üstteki/alttaki bölümlerle aynı hizadan başlar. */}
          <div className="max-w-7xl mx-auto w-full px-[var(--gutter)] lg:px-6 grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-12 xl:gap-16 items-center">
            {/* Left — step list */}
            <div className="flex flex-col gap-4">
              <h2 className="text-[clamp(1.625rem,7.5vw,2.25rem)] md:text-5xl text-(--color-text-strong) leading-[1.05] tracking-tight">
                <MaskLines lines={["Dört Adımda", <span key="a" className="accent-line">Dijital Terapi Akışı</span>]} />
              </h2>

              <div className="wt-steps mt-4 flex flex-col gap-2">
                {WALKTHROUGH.map((w, i) => {
                  const Icon = w.icon;
                  const isActive = active === i;
                  return (
                    <motion.button
                      key={w.title}
                      type="button"
                      aria-current={isActive}
                      onClick={() => {
                        /* Adıma tıklamak o adımın kaydırma konumuna götürür —
                           bölüm yalnızca kaydırmaya bağlı kalmaz. */
                        const el = ref.current;
                        if (!el) return;
                        const start = el.getBoundingClientRect().top + window.scrollY;
                        const span = el.offsetHeight - window.innerHeight;
                        smoothScrollTo(start + (span * (i + 0.5)) / steps);
                      }}
                      animate={{
                        opacity: isActive ? 1 : 0.5,
                        x: isActive ? 0 : -6,
                      }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      /* Sönümleme yalnızca sabitlenmiş sahnede anlamlı: orada
                         tek bir adım "şu an" demek. Telefonda dört adım da
                         akışta yan yana okunduğu için üçünü %50 opaklıkta
                         bırakmak metni okunmaz yapıyordu — mobilde framer'ın
                         satır içi opaklık/kaydırma değerleri iptal edilir. */
                      className="relative flex gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5 text-left w-full cursor-pointer max-lg:opacity-100! max-lg:transform-none!"
                      style={{
                        borderColor: isActive ? `color-mix(in srgb, ${w.accent} 33%, transparent)` : "var(--color-line)",
                        background: isActive
                          ? `linear-gradient(135deg, color-mix(in srgb, ${w.accent} 8%, transparent), transparent)`
                          : "var(--color-surface)",
                      }}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="walkthrough-indicator"
                          className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
                          style={{ background: w.accent }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                      <div
                        className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
                        style={{
                          background: `color-mix(in srgb, ${w.accent} 9%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${w.accent} 20%, transparent)`,
                        }}
                      >
                        <Icon size={18} style={{ color: w.accent }} />
                      </div>
                      <div className="min-w-0">
                        {/* Başlık telefonda kesilmez: 320px'te "Haftalık Planı
                            Oluşturun" tek satıra sığmıyor, `truncate` adımın
                            yarısını yiyordu. Mobilde sarar, `lg`te kısalır. */}
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="shrink-0 text-[12px] font-semibold"
                            style={{ color: w.accent }}
                          >
                            0{i + 1}
                          </span>
                          <h3 className="font-bold text-(--color-text-strong) text-base sm:text-lg lg:truncate">
                            {w.title}
                          </h3>
                        </div>
                        <p className="text-sm text-(--color-text-soft) leading-relaxed">
                          {w.body}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Right — animated preview */}
            <div className="relative">
              <div
                className="relative glass-strong rounded-3xl overflow-hidden aspect-[4/3]"
                style={{
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                {/*
                  `mode="wait"` çıkışı bitmeden girişi başlatmıyordu: adım
                  başına 0.45s + 0.45s. Hızlı kaydırmada değişimler kuyruğa
                  giriyor, önizleme kaydırmanın gerisinde kalıyordu. İki
                  katman üst üste duruyor (ikisi de `absolute inset-0`), giriş
                  ve çıkış aynı anda akıyor: geçiş yarı yarıya kısaldı ve
                  kuyruk oluşmuyor.
                */}
                <AnimatePresence initial={false}>
                  <motion.div
                    key={WALKTHROUGH[active].preview}
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute inset-0 p-5 sm:p-8"
                  >
                    <WalkthroughPreview
                      kind={WALKTHROUGH[active].preview}
                      accent={WALKTHROUGH[active].accent}
                    />
                  </motion.div>
                </AnimatePresence>

                {/*
                  Çubuk adım sayısından değil kaydırmanın kendisinden besleniyor:
                  önceden `width` yüzdesi basılıyordu — düzen özelliği olduğu için
                  animasyonlanmıyor, adım değişince zıplıyordu. `scaleX` dönüşümdür,
                  kaydırmayla sürekli akar ve kullanıcıya bölümün neresinde
                  olduğunu adım adım değil kesintisiz söyler.
                */}
                <div className="absolute bottom-3 left-3 right-3 h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full w-full rounded-full origin-left"
                    style={{
                      background: WALKTHROUGH[active].accent,
                      scaleX: stepProgress,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WalkthroughPreview({ kind, accent }: { kind: string; accent: string }) {
  if (kind === "clients") {
    return (
      <div className="w-full h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-(--color-text-soft)">
            Danışanlar
          </span>
          <span
            className="text-[12px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `color-mix(in srgb, ${accent} 13%, transparent)`, color: accent }}
          >
            Aktif · 8
          </span>
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          {["Ela Selin", "Tuna Akarsu", "Asya Demir", "Mert Yiğit", "Defne Kaya"].map(
            (n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-(--color-line)"
                style={{ background: "var(--color-surface)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, transparent))` }}
                >
                  {n[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-(--color-text-strong) truncate">{n}</p>
                  <p className="text-[12px] text-(--color-text-muted)">
                    Son seans · {4 - (i % 3)} gün önce
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 3 }).map((_, k) => (
                    <div
                      key={k}
                      className="w-1.5 h-4 rounded-full"
                      style={{
                        background: k <= (i % 3) ? accent : "var(--color-line-strong)",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>
    );
  }

  if (kind === "plan") {
    return (
      <div className="w-full h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-(--color-text-soft)">
            Haftalık Plan
          </span>
          <span
            className="text-[12px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `color-mix(in srgb, ${accent} 13%, transparent)`, color: accent }}
          >
            14 Nisan · Pazartesi
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 flex-1">
          {["P", "S", "Ç", "P", "C", "C", "P"].map((d, i) => {
            const filled = [true, true, false, true, false, true, false][i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col gap-1.5 h-full rounded-xl p-2"
                style={{
                  background: filled ? `color-mix(in srgb, ${accent} 7%, transparent)` : "var(--color-surface)",
                  border: `1px solid ${filled ? `color-mix(in srgb, ${accent} 27%, transparent)` : "var(--color-line)"}`,
                }}
              >
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: filled ? accent : "var(--color-text-muted)" }}
                >
                  {d}
                </span>
                <div className="flex flex-col gap-1 flex-1">
                  {filled &&
                    Array.from({ length: 2 + (i % 2) }).map((_, k) => (
                      <motion.div
                        key={k}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3 + k * 0.1 }}
                        className="origin-left h-1.5 rounded-full"
                        style={{ background: accent, opacity: 0.55 + k * 0.15 }}
                      />
                    ))}
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-(--color-text-soft)">
          <Zap size={12} style={{ color: accent }} />
          <span>Akıllı öneri: Bugün motor koordinasyonu + görsel algı</span>
        </div>
      </div>
    );
  }

  if (kind === "game") {
    return (
      <div className="w-full h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-(--color-text-soft)">
            Canlı Seans
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="halo-dot w-2 h-2 rounded-full"
              style={{ color: "var(--color-accent-red)", background: "var(--color-accent-red)" }}
            />
            <span className="text-[12px] font-bold text-(--color-text-body)">Canlı</span>
          </div>
        </div>
        <div
          className="flex-1 rounded-2xl p-4 grid grid-cols-4 gap-2 place-content-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 6%, transparent), transparent 60%), var(--color-surface)`,
            border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
          }}
        >
          <span className="beam-sweep" />
          {Array.from({ length: 16 }).map((_, i) => {
            const lit = [2, 5, 7, 10, 13].includes(i);
            return (
              <motion.div
                key={i}
                animate={
                  lit
                    ? {
                        scale: [1, 1.12, 1],
                        boxShadow: [
                          `0 0 0 0 transparent`,
                          `0 0 0 4px color-mix(in srgb, ${accent} 33%, transparent)`,
                          `0 0 0 0 transparent`,
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.08 }}
                className="aspect-square rounded-lg"
                style={{
                  background: lit ? `color-mix(in srgb, ${accent} 20%, transparent)` : `color-mix(in srgb, ${accent} 4%, transparent)`,
                  border: `1px solid ${lit ? `color-mix(in srgb, ${accent} 40%, transparent)` : `color-mix(in srgb, ${accent} 13%, transparent)`}`,
                }}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { v: "8", l: "Seri" },
            { v: "94", l: "Skor" },
            { v: "3:42", l: "Süre" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl py-2 border border-(--color-line)"
              style={{ background: "var(--color-surface)" }}
            >
              <p
                className="text-lg font-extrabold tabular-nums"
                style={{ color: accent }}
              >
                {s.v}
              </p>
              <p className="text-[12px] font-semibold text-(--color-text-soft)">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // report
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-(--color-text-soft)">
          İlerleme Raporu
        </span>
        <span
          className="text-[12px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `color-mix(in srgb, ${accent} 13%, transparent)`, color: accent }}
        >
          + %28 gelişim
        </span>
      </div>
      <div
        className="flex-1 rounded-2xl p-4 flex items-end gap-2"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)" }}
      >
        {[40, 55, 48, 62, 70, 66, 78, 82, 74, 88, 92, 95].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 rounded-md min-w-0"
            style={{
              background: `linear-gradient(180deg, ${accent}, color-mix(in srgb, ${accent} 40%, transparent))`,
              opacity: 0.4 + (h / 100) * 0.6,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3 border border-(--color-line)" style={{ background: "var(--color-surface)" }}>
          <p className="text-[12px] font-semibold text-(--color-text-soft) mb-1">
            Motor
          </p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-(--color-text-strong)">86</span>
            <TrendingUp size={13} style={{ color: "var(--color-accent-green)" }} />
            <span className="text-[12px] font-bold" style={{ color: "var(--color-accent-green)" }}>
              +12
            </span>
          </div>
        </div>
        <div className="rounded-xl p-3 border border-(--color-line)" style={{ background: "var(--color-surface)" }}>
          <p className="text-[12px] font-semibold text-(--color-text-soft) mb-1">
            Bilişsel
          </p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-(--color-text-strong)">79</span>
            <TrendingUp size={13} style={{ color: "var(--color-accent-green)" }} />
            <span className="text-[12px] font-bold" style={{ color: "var(--color-accent-green)" }}>
              +8
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   8. COMPARISON TABLE — Mimio vs. Geleneksel
   ════════════════════════════════════════════════════════════════ */

const COMPARISON = [
  { label: "Seans kayıtları", mimio: "Otomatik dijital kayıt", traditional: "El yazısı / kayıp riski" },
  { label: "Veri görselleştirme", mimio: "Anlık skor grafikleri", traditional: "Manuel Excel" },
  { label: "Çocuk katılımı", mimio: "Oyun tabanlı etkileşim", traditional: "Standart materyal" },
  { label: "Aile paylaşımı", mimio: "Yazdırılabilir rapor + CSV", traditional: "Sözlü özet" },
  { label: "Klinik standart", mimio: "Kanıta dayalı beceri alanları", traditional: "Kişisel tercih" },
  { label: "Raporlama süresi", mimio: "Dakikalar içinde", traditional: "Saatler" },
] as const;

/**
 * Karşılaştırma tablosu.
 *
 * Üç sütunlu ızgara (özellik | Mimio | geleneksel) 320px'lik ekranda her
 * hücreye ~90px bırakıyordu: "El yazısı / kayıp riski" satır başına tek
 * kelimeye düşüyor, "Geleneksel" başlığı kabın dışında kalıyordu (ölçüm:
 * hücrelerde 10–55px taşma, kapta 76px kırpma).
 *
 * Telefonda tablo bırakılıp özellik başına bir karta dönülüyor: özellik adı
 * üstte, iki değer altında kendi etiketiyle. `lg`ten itibaren ızgara aynen
 * geri geliyor — masaüstü görünümü değişmiyor.
 */
export function ComparisonSection() {
  return (
    <section id="comparison" className="section max-sm:py-10! relative overflow-hidden">
      <div className="shell" style={{ maxWidth: "68rem" }}>
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-[clamp(1.875rem,8vw,2.5rem)] md:text-6xl text-(--color-text-strong) leading-tight mb-4">
            <MaskLines lines={["Geleneksel vs.", <span key="a" className="accent-line">Dijital Ergoterapi</span>]} />
          </h2>
          <p className="text-(--color-text-soft) text-base md:text-lg max-w-xl mx-auto">
            Kağıt-kalem yönteminden dijital terapi akışına geçtiğinizde ne değişir?
          </p>
        </div>

        <div className="relative glass-strong rounded-3xl overflow-hidden">
          {/* Sütun başlıkları yalnızca tablo düzeninde anlam taşır; kart
              düzeninde her satır kendi etiketini kendi taşıyor. */}
          <div className="hidden lg:grid grid-cols-[1.3fr_1fr_1fr] border-b border-(--color-line)">
            <div className="p-6 text-sm font-semibold text-(--color-text-soft)">
              Özellik
            </div>
            <div className="p-6 relative">
              <div className="relative flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}>
                  M
                </div>
                <span className="font-extrabold text-(--color-text-strong) tracking-tight">
                  Mimio
                </span>
              </div>
            </div>
            <div className="p-6 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-(--color-surface) border border-(--color-line) flex items-center justify-center text-(--color-text-muted) text-xs">
                <FileText size={13} />
              </div>
              <span className="font-bold text-(--color-text-soft) tracking-tight">
                Geleneksel
              </span>
            </div>
          </div>

          {COMPARISON.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex flex-col gap-2.5 p-4 sm:p-5 lg:grid lg:grid-cols-[1.3fr_1fr_1fr] lg:gap-0 lg:p-0 border-b border-(--color-line) last:border-0"
            >
              <div className="text-sm font-semibold text-(--color-text-strong) lg:text-(--color-text-body) lg:p-6">
                {row.label}
              </div>
              <div className="relative lg:p-6">
                <div className="relative flex items-start gap-2">
                  <ShieldCheck
                    size={16}
                    className="shrink-0 mt-0.5 text-(--color-accent-green)"
                  />
                  <div className="min-w-0">
                    <span className="block lg:hidden text-[12px] font-semibold text-(--color-text-soft) mb-0.5">
                      Mimio
                    </span>
                    <span className="text-sm font-semibold text-(--color-text-strong)">
                      {row.mimio}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 lg:p-6">
                <Minus size={16} className="shrink-0 mt-0.5 text-(--color-text-muted)" />
                <div className="min-w-0">
                  <span className="block lg:hidden text-[12px] font-semibold text-(--color-text-soft) mb-0.5">
                    Geleneksel
                  </span>
                  <span className="text-sm text-(--color-text-soft)">
                    {row.traditional}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   9. FAQ ACCORDION — smooth height transitions
   ════════════════════════════════════════════════════════════════ */

const FAQ = [
  {
    q: "Mimio'yu kullanmak için teknik bilgiye ihtiyacım var mı?",
    a: "Hayır. Arayüz klinik pratiğinizle uyumlu ve sade tutuldu. Hesap açtıktan dakikalar içinde danışan ekleyip ilk oyun seansınızı başlatabilirsiniz.",
  },
  {
    q: "Danışan verileri nasıl korunuyor?",
    a: "Veriler şifreli (TLS) bağlantıyla bulut veritabanında saklanır; şifreler geri döndürülemez şekilde hash'lenir ve tüm kayıt işlemleri oturum doğrulaması gerektirir. Danışan profillerinde yalnızca çalışmanız için gereken asgari bilgileri tutmanız yeterlidir.",
  },
  {
    q: "Oyunlar hangi yaş grubuna uygun?",
    a: "Oyunlar okul öncesi ve okul çağındaki çocuklarla yapılan seanslar düşünülerek tasarlandı. Her danışan için kolay, orta veya zor zorluk seviyesi seçebilir; performansa göre seviye önerisi alabilirsiniz.",
  },
  {
    q: "Raporları aileyle nasıl paylaşırım?",
    a: "Rapor ekranından yazdırılabilir bir gelişim özeti oluşturabilir, seans ve hedef verilerini CSV olarak dışa aktarabilirsiniz.",
  },
  {
    q: "Ücretlendirme modeli nasıl?",
    a: "Mimio şu anda tamamen ücretsiz ve sınırsız danışan içeriyor. İleride ücretli özellikler eklenirse mevcut kullanıcılar önceden bilgilendirilecek.",
  },
  {
    q: "Kendi oyunumu veya ölçeğimi entegre edebilir miyim?",
    a: `Şu an platformdaki ${PLATFORM_STATS.gameCount} oyun ve ${PLATFORM_STATS.activityCount} hazır aktivite kullanılabilir durumda; dış araç entegrasyonu yol haritamızda. İhtiyacınızı bize iletirseniz önceliklendirirken dikkate alırız.`,
  },
] as const;

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="section relative">
      <div className="shell" style={{ maxWidth: "56rem" }}>
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-[clamp(1.875rem,8vw,2.5rem)] md:text-6xl text-(--color-text-strong) leading-tight mb-4">
            <MaskLines lines={["Aklınızdaki Soruları", <span key="a" className="accent-line">Hızlıca Yanıtlayalım</span>]} />
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="acc-item glass rounded-2xl border border-(--color-line) overflow-hidden"
                data-open={isOpen}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-4 sm:py-5"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-(--color-text-strong) text-sm sm:text-base">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border border-(--color-line) text-(--color-primary) bg-(--color-primary-light)"
                  >
                    <Plus size={15} />
                  </motion.span>
                </button>
                <div className="acc-body">
                  <div className="acc-body-inner px-5 sm:px-6 pb-5 sm:pb-6 -mt-1 text-sm text-(--color-text-soft) leading-relaxed">
                    {item.a}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
  10. FLOATING CTA — pill that appears after hero, hides near footer
   ════════════════════════════════════════════════════════════════ */

interface FloatingCTAProps {
  onRegister: () => void;
}
/**
 * Sayfanın sağ alt köşesine tutunan kayıt kısayolu.
 *
 * Önceden ekranın alt-ortasında duruyor ve okuma sütununu kalıcı olarak
 * kapatıyordu. Artık: köşede durur, kapatılabilir ve sayfanın kendi CTA
 * bölümü görünürken kendini gizler — aynı çağrıyı iki kez yapmaz.
 */
export function FloatingCTA({ onRegister }: FloatingCTAProps) {
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [ctaInView, setCtaInView] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* Kaydırma konumu olay dinleyicisiyle değil Motion değeriyle okunur;
     dinleyici her karede React'i uyandırıyordu. */
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const next = y > 720 && max - y > 240;
    setScrolledPastHero((prev) => (prev === next ? prev : next));
  });

  useEffect(() => {
    const target = document.getElementById("cta");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCtaInView(entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const visible = scrolledPastHero && !ctaInView && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="floating-cta"
        >
          <button type="button" onClick={onRegister} className="floating-cta-action">
            Hemen Başla
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Bu kısayolu gizle"
            className="floating-cta-dismiss"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════════════════════════════
  11. GAMES CAROUSEL — horizontal snap scroll of games
   ════════════════════════════════════════════════════════════════ */

interface GameEntry {
  key: string;
  label: string;
  area: string;
  desc: string;
  /** `scripts/capture-game-shots.mjs` ile uygulamadan yakalanan tahta. */
  shot: string;
}
/*
 * Platformdaki gerçek 7 oyun (GAME_LABELS ile birebir aynı adlar).
 *
 * Kapaklar önce her oyun için aynı degrade kutu + bir lucide ikonuydu:
 * yedi kart yedi ayrı oyunu satıyor ama hiçbiri oyunun neye benzediğini
 * göstermiyordu. Artık kapak, oyunun kendi tahtası — uygulamadan yakalanıyor.
 * Tahtalar tema değişiminden bağımsız olarak koyu (bkz. THEME.md § Game
 * Canvas), bu yüzden tek görsel iki temada da doğru duruyor.
 */
const EXTENDED_GAMES: readonly GameEntry[] = [
  { key: "memory", label: "Sıra Hafızası", area: "Çalışma belleği", desc: "Sırayla yanan kutuları hatırlayıp aynı sırayla tekrar et; çalışma belleğini güçlendir.", shot: "/games/memory.webp" },
  { key: "pairs", label: "Kart Eşle", area: "Görsel hafıza", desc: "Kapalı kartları açarak eşleşen çiftleri bul; görsel hafızayı pekiştir.", shot: "/games/pairs.webp" },
  { key: "pulse", label: "Mavi Nabız", area: "El-göz koordinasyonu", desc: "Beliren hedeflere hızla dokunarak el-göz koordinasyonunu geliştir.", shot: "/games/pulse.webp" },
  { key: "route", label: "Komut Rotası", area: "Yön ve planlama", desc: "Gösterilen yön komutlarını doğru sırayla uygula; işlem hızını artır.", shot: "/games/route.webp" },
  { key: "difference", label: "Fark Avcısı", area: "Görsel ayrım", desc: "Benzer kartlar arasından farklı olanı bul; görsel ayrım becerisini destekle.", shot: "/games/difference.webp" },
  { key: "scan", label: "Hedef Tarama", area: "Seçici dikkat", desc: "Hedef simgeyi ızgara içinde tara ve bul; seçici dikkati çalıştır.", shot: "/games/scan.webp" },
  { key: "logic", label: "Dizi Mantık", area: "Yürütücü işlevler", desc: "Matristeki örüntüyü çöz, eksik hücreyi tamamla; akıl yürütmeyi geliştir.", shot: "/games/logic.webp" },
];

export function GamesCarousel({ onLogin }: { onLogin: () => void }) {
  /*
   * İki düzen, tek içerik.
   *
   * Masaüstünde bölüm sabitlenir ve dikey kaydırma kart şeridini yatay
   * sürükler: okur tekerleği çevirmeye devam eder, yedi oyun sırayla
   * önünden geçer. Ok düğmeleri ve gizli yatay kaydırma çubuğu yerine
   * sayfanın kendi hareketi kullanılır.
   *
   * Telefonda sabitleme yok — dikey kaydırmayı yatay harekete çevirmek
   * parmağın altında "takılma" hissi veriyor. Orada yerel yatay şerit
   * (kaydırma yakalamalı) kalır.
   *
   * Sunucu her zaman telefon düzenini basar; masaüstü kararı ilk effect'te
   * verilir. Bölüm katlamanın çok altında olduğu için değişim görünmez.
   */
  const [desktop, setDesktop] = useState(false);
  const reduced = useReducedMotionSafe();
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (min-height: 640px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (desktop && !reduced) return <GamesPinned onLogin={onLogin} />;
  return <GamesSnap onLogin={onLogin} />;
}

function GamesHeading({ dark = true }: { dark?: boolean }) {
  return (
    <h2 className={`text-[clamp(1.875rem,8vw,2.5rem)] md:text-6xl leading-[1.02] max-w-lg m-0 ${dark ? "text-(--color-games-text)" : ""}`}>
      <MaskLines lines={["Her Oyun Bir", <span key="a" className="accent-line">Gelişim Hedefi</span>]} />
    </h2>
  );
}

function GameCard({ g, i, onLogin, wide = false }: { g: GameEntry; i: number; onLogin: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onLogin}
      className={`group relative ${wide ? "w-[min(30rem,38vw)]" : "w-[300px] sm:w-[340px]"} shrink-0 text-left rounded-3xl border border-(--color-games-card-border) overflow-hidden bg-(--color-games-card-bg) transition-colors hover:border-(--color-primary)/40`}
    >
      {/* Beceri alanı etiketi görselin üstünde değil altında: gerçek bir
          görüntünün üzerine rozet basmak tahtanın kendisini örtüyor. */}
      <div className="aspect-[4/3] relative overflow-hidden bg-(--color-games-tile-to)">
        <Image
          src={g.shot}
          alt={`${g.label} oyununun tahtası`}
          fill
          sizes={wide ? "(min-width: 1024px) 38vw, 340px" : "(max-width: 639px) 300px, 340px"}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />
        <span className="absolute top-4 left-4 numeral text-[12px] font-semibold px-2.5 py-1 rounded-full text-white/85 bg-black/35 backdrop-blur-md border border-white/10">
          {String(i + 1).padStart(2, "0")} / {String(EXTENDED_GAMES.length).padStart(2, "0")}
        </span>
        <span className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
          <Play size={16} className="text-white ml-0.5" aria-hidden="true" />
        </span>
      </div>
      <div className={wide ? "p-6" : "p-5"}>
        <p className="text-xs font-semibold text-(--color-games-text-soft) m-0 mb-1">
          {g.area}
        </p>
        <h3 className={`font-bold text-(--color-games-text) mb-2 ${wide ? "text-2xl" : "text-lg"}`}>
          {g.label}
        </h3>
        <p className="text-sm text-(--color-games-text-soft) leading-relaxed mb-4">
          {g.desc}
        </p>
        <div className="flex items-center gap-2 text-xs font-bold text-(--color-primary) group-hover:translate-x-1 transition-transform">
          Seansı Başlat
          <ChevronRight size={13} />
        </div>
      </div>
    </button>
  );
}

function GamesPinned({ onLogin }: { onLogin: () => void }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [distance, setDistance] = useState(0);
  const [index, setIndex] = useState(0);

  /* Şeridin taşma payı = kaydırılacak yatay mesafe. Bölüm bu kadar
     uzatılır ki tekerleğin her pikseli şeritte bir piksel olsun. */
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const vp = viewportRef.current;
      if (!track || !vp) return;
      setDistance(Math.max(0, track.scrollWidth - vp.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const eased = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.35 });
  const x = useTransform(eased, (v) => -v * distance);
  const bar = useTransform(eased, [0, 1], [1 / EXTENDED_GAMES.length, 1]);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(EXTENDED_GAMES.length - 1, Math.round(v * (EXTENDED_GAMES.length - 1)));
    setIndex((prev) => (prev === next ? prev : next));
  });

  return (
    <section
      id="games"
      ref={sectionRef}
      className="section-games relative"
      style={{ height: `calc(100dvh + ${distance}px)` }}
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden flex flex-col justify-center gap-10 pt-16">
        <div className="shell shell-wide w-full flex items-end justify-between gap-6">
          <GamesHeading />
          <div className="flex flex-col items-end gap-3 pb-2">
            <span className="numeral text-(--color-games-text) text-5xl leading-none tracking-[-0.04em]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={index}
                  className="inline-block"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {String(index + 1).padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
              <span className="text-(--color-games-text-soft) text-2xl"> / {String(EXTENDED_GAMES.length).padStart(2, "0")}</span>
            </span>
            <span className="text-sm text-(--color-games-text-soft)">{EXTENDED_GAMES[index].area}</span>
            <span className="block w-48 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--color-games-card-border)" }}>
              <motion.span className="block h-full origin-left" style={{ scaleX: bar, background: "var(--gradient-bar)" }} />
            </span>
          </div>
        </div>
        <div ref={viewportRef} className="w-full overflow-hidden">
          <motion.div ref={trackRef} className="games-track px-[max(var(--gutter),calc((100vw-88rem)/2+var(--gutter)))]" style={{ x }}>
            {EXTENDED_GAMES.map((g, i) => (
              <GameCard key={g.key} g={g} i={i} onLogin={onLogin} wide />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function GamesSnap({ onLogin }: { onLogin: () => void }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  /* Yüzde yerine kaçıncı kartta olduğunu göster — okur bunu kullanabilir. */
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const handle = () => {
      const max = el.scrollWidth - el.clientWidth;
      const card = el.firstElementChild as HTMLElement | null;
      const step = card ? card.offsetWidth + 16 : 356;
      setIndex(Math.min(EXTENDED_GAMES.length - 1, Math.round(el.scrollLeft / step)));
      setAtStart(el.scrollLeft <= 4);
      setAtEnd(max - el.scrollLeft <= 4);
    };
    el.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    handle();
    return () => {
      el.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : 356;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section id="games" className="section section-games relative">
      <div className="shell shell-wide">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-8 sm:mb-10">
          <GamesHeading />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              aria-label="Önceki oyun"
              className="w-11 h-11 rounded-full flex items-center justify-center border border-(--color-games-card-border) bg-(--color-games-badge-bg) text-(--color-games-text) hover:border-(--color-primary)/40 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              aria-label="Sonraki oyun"
              className="w-11 h-11 rounded-full flex items-center justify-center border border-(--color-games-card-border) bg-(--color-games-badge-bg) text-(--color-games-text) hover:border-(--color-primary)/40 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div ref={scrollerRef} className="h-snap" data-lenis-prevent-wheel>
          {EXTENDED_GAMES.map((g, i) => (
            <GameCard key={g.key} g={g} i={i} onLogin={onLogin} />
          ))}
        </div>

        {/* Konum göstergesi — hangi karttayız, kaç kart var */}
        <div className="flex items-center gap-1.5 mt-1">
          {EXTENDED_GAMES.map((g, i) => (
            <span
              key={g.key}
              aria-hidden="true"
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 28 : 10,
                background: i === index ? "var(--gradient-bar)" : "var(--color-games-card-border)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
  12. SPLIT TEXT HELPER — word-by-word reveal
   ════════════════════════════════════════════════════════════════ */

export function SplitText({
  text,
  delay = 0,
  className,
}: { text: string; delay?: number; className?: string }) {
  const words = useMemo(() => text.split(" "), [text]);
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="word-reveal">
          <span style={{ animationDelay: `${delay + i * 0.06}s` } as React.CSSProperties}>{w}&nbsp;</span>
        </span>
      ))}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
  13. PARALLAX LAYER — bindable to a scroll progress value
   ════════════════════════════════════════════════════════════════ */

export function useParallax(scrollYProgress: MotionValue<number>, distance: number) {
  return useTransform(scrollYProgress, [0, 1], [0, distance]);
}

/* ════════════════════════════════════════════════════════════════
  14. KAHRAMAN ZEMİNİ — milimetrik kâğıt + film graini
   ════════════════════════════════════════════════════════════════ */

/**
 * Eski adı AuroraBackdrop'tı: sürekli hareket eden, 60px bulanık üç renkli
 * bir mesh. Bej zeminde atmosfer değil leke okunuyordu. Yerine ölçüm
 * kâğıdının kendisi kondu — sabit, keskin, kılcal.
 */
export function PaperBackdrop() {
  return (
    /*
      `-z-10` DEĞİL. Sarmalayıcı `#top` konumlandırılmış ama yığın bağlamı
      açmıyor; negatif z-index'li çocuk bu yüzden `#top`'un kendi zemin
      renginin de arkasına düşüyor ve hiç görünmüyordu (eski aurora
      katmanının aylardır görünmemesinin sebebi de buydu). Katman z-0'da
      duruyor, içerik DOM'da sonra geldiği için üstte kalıyor.
    */
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <span className="paper-grid" />
      <span className="noise-overlay" />
    </div>
  );
}
