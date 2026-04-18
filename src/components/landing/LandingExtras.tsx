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
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Activity,
  Award,
  BarChart3,
  Brain,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  Gamepad2,
  HeartPulse,
  LayoutDashboard,
  Microscope,
  Minus,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const prefersReduced =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ════════════════════════════════════════════════════════════════
   1. CURSOR SPOTLIGHT — soft glow following mouse (desktop only)
   ════════════════════════════════════════════════════════════════ */

export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const x = useSpring(0, { stiffness: 120, damping: 20, mass: 0.5 });
  const y = useSpring(0, { stiffness: 120, damping: 20, mass: 0.5 });

  useEffect(() => {
    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasFinePointer || prefersReduced) return;
    setEnabled(true);
    const handle = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handle, { passive: true });
    return () => window.removeEventListener("mousemove", handle);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      ref={ref}
      className="cursor-spotlight"
      style={{ left: x, top: y }}
      aria-hidden
    />
  );
}

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
          onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" })}
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
    <div ref={ref} className={`tilt-3d relative ${className ?? ""}`}>
      {children}
      {glare && <span className="tilt-shine" />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   5. TRUST MARQUEE — scrolling strip of clinic / hospital names
   ════════════════════════════════════════════════════════════════ */

const TRUSTED_BY = [
  { name: "Nöro-Pedia Kliniği", kind: "Özel Klinik" },
  { name: "Anadolu Rehabilitasyon", kind: "Rehabilitasyon" },
  { name: "ADIM ADIM Terapi", kind: "Çocuk Gelişim" },
  { name: "Mavi Kalem Merkezi", kind: "Özel Eğitim" },
  { name: "İstanbul Ergo", kind: "Poliklinik" },
  { name: "Ege Ergoterapi", kind: "Klinik" },
  { name: "Başkent Gelişim", kind: "Özel Merkez" },
  { name: "BeyazPapatya", kind: "Çocuk Kliniği" },
] as const;

export function TrustMarquee() {
  const items = [...TRUSTED_BY, ...TRUSTED_BY];
  return (
    <section className="py-12 md:py-16 border-y border-(--color-line) relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-(--color-text-muted) uppercase">
            <span className="w-6 h-px bg-(--color-line-strong)" />
            Türkiye&apos;nin Önde Gelen Klinikleri Tarafından Kullanılıyor
            <span className="w-6 h-px bg-(--color-line-strong)" />
          </div>
          <div className="w-full marquee-viewport marquee-mask">
            <div className="marquee-track slow">
              {items.map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-(--color-line) bg-(--color-surface) hover:border-(--color-primary)/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center border border-(--color-line)">
                    <Stethoscope size={15} className="text-(--color-primary)" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-(--color-text-strong) tracking-tight whitespace-nowrap">
                      {t.name}
                    </span>
                    <span className="text-[10px] font-semibold text-(--color-text-muted) tracking-wider uppercase whitespace-nowrap">
                      {t.kind}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   6. METRICS BAND — giant count-up numbers with scroll reveal
   ════════════════════════════════════════════════════════════════ */

const METRICS = [
  { value: 92, suffix: "%", label: "Seans Katılım Artışı", icon: HeartPulse, color: "#f472b6" },
  { value: 4.9, suffix: "/5", label: "Klinisyen Memnuniyeti", icon: Award, color: "#fbbf24" },
  { value: 3100, suffix: "+", label: "Tamamlanan Seans", icon: ClipboardList, color: "#34d399" },
  { value: 64, suffix: "%", label: "Raporlama Süresi Azalması", icon: Clock, color: "#22d3ee" },
] as const;

function AnimatedNumber({
  to,
  duration = 1400,
  decimals = 0,
}: { to: number; duration?: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !started.current) {
            started.current = true;
            const t0 = performance.now();
            const step = (now: number) => {
              const p = Math.min(1, (now - t0) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(to * eased);
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{val.toFixed(decimals)}</span>;
}

export function MetricsBand() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const decimals = Number.isInteger(m.value) ? 0 : 1;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-3xl p-5 sm:p-7 relative overflow-hidden group"
              >
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-3xl"
                  style={{ background: m.color }}
                />
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${m.color}1f`, border: `1px solid ${m.color}33` }}
                >
                  <Icon size={19} style={{ color: m.color }} />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span
                    className="text-4xl sm:text-5xl font-extrabold text-(--color-text-strong) tracking-tight tabular-nums leading-none"
                  >
                    <AnimatedNumber to={m.value} decimals={decimals} />
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-(--color-text-strong)/70">
                    {m.suffix}
                  </span>
                </div>
                <p className="mt-3 text-sm text-(--color-text-soft) leading-relaxed">
                  {m.label}
                </p>
              </motion.div>
            );
          })}
        </div>
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
    accent: "#818cf8",
    preview: "clients",
  },
  {
    title: "Haftalık Planı Oluşturun",
    body: "Terapi hedeflerine göre domainleri (motor, bilişsel, duyusal) seçin. Akıllı öneri motoru günün programını hazırlar.",
    icon: LayoutDashboard,
    accent: "#a78bfa",
    preview: "plan",
  },
  {
    title: "Seansı Oyunlaştırın",
    body: "Kanıta dayalı oyunları başlatın. Zorluk seviyesi otomatik ayarlanır, veriler anlık kaydedilir.",
    icon: Gamepad2,
    accent: "#22d3ee",
    preview: "game",
  },
  {
    title: "Gelişimi Raporlayın",
    body: "Aileyle paylaşılabilir PDF ve grafiklerle ilerlemeyi görselleştirin. Yapay zekâ destekli içgörüler.",
    icon: BarChart3,
    accent: "#34d399",
    preview: "report",
  },
] as const;

export function StickyWalkthrough() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [active, setActive] = useState(0);
  const steps = WALKTHROUGH.length;
  const smoothProgress = useSpring(0, { stiffness: 80, damping: 25, mass: 1 });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      smoothProgress.set(v);
    });
  }, [scrollYProgress, smoothProgress]);

  useEffect(() => {
    return smoothProgress.on("change", (v) => {
      const idx = Math.min(steps - 1, Math.floor(v * steps));
      setActive((prev) => (prev === idx ? prev : idx));
    });
  }, [smoothProgress, steps]);

  return (
    <section id="walkthrough" className="relative">
      <div ref={ref} style={{ height: `${steps * 110}vh` }}>
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0 -z-10 dot-grid opacity-70" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />

          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — step list */}
            <div className="flex flex-col gap-4">
              <div className="inline-flex w-fit items-center gap-2 text-xs font-bold tracking-widest text-(--color-primary) uppercase bg-(--color-primary-light) px-4 py-2 rounded-full">
                <Sparkles size={12} />
                Platform Turu
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-(--color-text-strong) leading-[1.05] tracking-tight">
                Dört Adımda
                <br />
                <span className="text-gradient-shift">Dijital Terapi Akışı</span>
              </h2>

              <div className="mt-4 flex flex-col gap-2">
                {WALKTHROUGH.map((w, i) => {
                  const Icon = w.icon;
                  const isActive = active === i;
                  return (
                    <motion.div
                      key={w.title}
                      animate={{
                        opacity: isActive ? 1 : 0.45,
                        x: isActive ? 0 : -6,
                      }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="relative flex gap-4 rounded-2xl border p-4 sm:p-5"
                      style={{
                        borderColor: isActive ? `${w.accent}55` : "var(--color-line)",
                        background: isActive
                          ? `linear-gradient(135deg, ${w.accent}14, transparent)`
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
                          background: `${w.accent}18`,
                          border: `1px solid ${w.accent}33`,
                        }}
                      >
                        <Icon size={18} style={{ color: w.accent }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-extrabold tracking-[0.18em] uppercase"
                            style={{ color: w.accent }}
                          >
                            0{i + 1}
                          </span>
                          <h3 className="font-bold text-(--color-text-strong) text-base sm:text-lg truncate">
                            {w.title}
                          </h3>
                        </div>
                        <p className="text-sm text-(--color-text-soft) leading-relaxed">
                          {w.body}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right — animated preview */}
            <div className="relative">
              <div className="absolute -inset-10 bg-[radial-gradient(ellipse_60%_50%_at_60%_50%,rgba(99,102,241,0.18),transparent)] blur-3xl pointer-events-none" />
              <div
                className="relative glass-strong rounded-3xl overflow-hidden aspect-[4/3]"
                style={{
                  boxShadow: "0 28px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={WALKTHROUGH[active].preview}
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -8 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 p-5 sm:p-8"
                  >
                    <WalkthroughPreview
                      kind={WALKTHROUGH[active].preview}
                      accent={WALKTHROUGH[active].accent}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="absolute bottom-3 left-3 right-3 h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: WALKTHROUGH[active].accent,
                      width: `${((active + 1) / steps) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
          <span className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
            Danışanlar
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${accent}20`, color: accent }}
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
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}
                >
                  {n[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-(--color-text-strong) truncate">{n}</p>
                  <p className="text-[11px] text-(--color-text-muted)">
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
          <span className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
            Haftalık Plan
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${accent}20`, color: accent }}
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
                  background: filled ? `${accent}12` : "var(--color-surface)",
                  border: `1px solid ${filled ? `${accent}44` : "var(--color-line)"}`,
                }}
              >
                <span
                  className="text-[10px] font-extrabold uppercase"
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
        <div className="flex items-center gap-2 text-[11px] text-(--color-text-soft)">
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
          <span className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
            Canlı Seans
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="halo-dot w-2 h-2 rounded-full"
              style={{ color: "#ef4444", background: "#ef4444" }}
            />
            <span className="text-[10px] font-bold text-(--color-text-body)">CANLI</span>
          </div>
        </div>
        <div
          className="flex-1 rounded-2xl p-4 grid grid-cols-4 gap-2 place-content-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accent}10, transparent 60%), var(--color-surface)`,
            border: `1px solid ${accent}33`,
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
                          `0 0 0 0 ${accent}00`,
                          `0 0 0 4px ${accent}55`,
                          `0 0 0 0 ${accent}00`,
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.08 }}
                className="aspect-square rounded-lg"
                style={{
                  background: lit ? `${accent}33` : `${accent}0a`,
                  border: `1px solid ${lit ? `${accent}66` : `${accent}22`}`,
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
              <p className="text-[9px] font-bold uppercase tracking-wider text-(--color-text-muted)">
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
        <span className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
          İlerleme Raporu
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${accent}20`, color: accent }}
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
              background: `linear-gradient(180deg, ${accent}, ${accent}66)`,
              opacity: 0.4 + (h / 100) * 0.6,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3 border border-(--color-line)" style={{ background: "var(--color-surface)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) mb-1">
            Motor
          </p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-(--color-text-strong)">86</span>
            <TrendingUp size={13} style={{ color: "#34d399" }} />
            <span className="text-[10px] font-bold" style={{ color: "#34d399" }}>
              +12
            </span>
          </div>
        </div>
        <div className="rounded-xl p-3 border border-(--color-line)" style={{ background: "var(--color-surface)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) mb-1">
            Bilişsel
          </p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-(--color-text-strong)">79</span>
            <TrendingUp size={13} style={{ color: "#34d399" }} />
            <span className="text-[10px] font-bold" style={{ color: "#34d399" }}>
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
  { label: "Seans kayıtları", mimio: "Otomatik dijital", traditional: "El yazısı / kayıp riski" },
  { label: "Veri görselleştirme", mimio: "Gerçek zamanlı grafik", traditional: "Manuel Excel" },
  { label: "Çocuk katılımı", mimio: "Oyun tabanlı %92 artış", traditional: "Standart materyal" },
  { label: "Aile paylaşımı", mimio: "Tek tık PDF + link", traditional: "Sözlü özet" },
  { label: "Klinik standart", mimio: "Kanıta dayalı domainler", traditional: "Kişisel tercih" },
  { label: "Raporlama süresi", mimio: "Dakikalar içinde", traditional: "Saatler" },
] as const;

export function ComparisonSection() {
  return (
    <section id="comparison" className="py-16 md:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
      </div>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-(--color-primary) uppercase mb-4 bg-(--color-primary-light) px-4 py-2 rounded-full">
            <Microscope size={12} />
            Neden Mimio?
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-(--color-text-strong) leading-tight mb-4">
            Geleneksel vs.{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Dijital Ergoterapi
            </span>
          </h2>
          <p className="text-(--color-text-soft) text-base md:text-lg max-w-xl mx-auto">
            Kağıt-kalem yönteminden dijital terapi akışına geçtiğinizde ne değişir?
          </p>
        </div>

        <div className="relative glass-strong rounded-3xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-(--color-line)">
            <div className="p-4 sm:p-6 text-xs sm:text-sm font-bold uppercase tracking-widest text-(--color-text-muted)">
              Özellik
            </div>
            <div className="p-4 sm:p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
              <div className="relative flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  M
                </div>
                <span className="font-extrabold text-(--color-text-strong) tracking-tight">
                  Mimio
                </span>
              </div>
            </div>
            <div className="p-4 sm:p-6 flex items-center gap-2">
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
              className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-(--color-line) last:border-0"
            >
              <div className="p-4 sm:p-6 text-sm font-semibold text-(--color-text-body)">
                {row.label}
              </div>
              <div className="p-4 sm:p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />
                <div className="relative flex items-start gap-2">
                  <ShieldCheck
                    size={16}
                    className="shrink-0 mt-0.5 text-emerald-400"
                  />
                  <span className="text-sm font-semibold text-(--color-text-strong)">
                    {row.mimio}
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6 flex items-start gap-2">
                <Minus size={16} className="shrink-0 mt-0.5 text-(--color-text-muted)" />
                <span className="text-sm text-(--color-text-soft)">
                  {row.traditional}
                </span>
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
    a: "Hayır. Arayüz klinik pratiğinizle uyumlu, sürükleyip bırak kadar sade. Hesap açtıktan 5 dakika içinde ilk seansınızı başlatabilirsiniz.",
  },
  {
    q: "Danışan verileri nasıl korunuyor?",
    a: "Veriler KVKK uyumlu, AB veri merkezlerinde, end-to-end şifreleme ve düzenli yedekleme ile korunur. Yetkilendirme bazlı erişim kontrolü mevcuttur.",
  },
  {
    q: "Oyunlar hangi yaş grubuna uygun?",
    a: "4 yaşından 14 yaşına kadar çocuklar için tasarlandı. Her oyun için yaşa duyarlı zorluk algoritması otomatik ayarlama yapar.",
  },
  {
    q: "Raporları aileyle nasıl paylaşırım?",
    a: "PDF olarak indirebilir, güvenli link ile gönderebilir veya doğrudan e-posta ile paylaşabilirsiniz. Tüm paylaşımlar erişim süresiyle sınırlandırılabilir.",
  },
  {
    q: "Ücretlendirme modeli nasıl?",
    a: "Başlangıç planı ücretsizdir ve sınırsız danışan içerir. Pro planlar gelişmiş raporlama ve ekip çalışması özellikleri sunar.",
  },
  {
    q: "Kendi oyunumu entegre edebilir miyim?",
    a: "Pro+ planlarda açık API ile kendi dijital araçlarınızı veya dış ölçek testlerini Mimio ekosistemine bağlayabilirsiniz.",
  },
] as const;

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-16 md:py-28 px-4 sm:px-6 relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-(--color-primary) uppercase mb-4 bg-(--color-primary-light) px-4 py-2 rounded-full">
            <HelpCircleFallback />
            Sıkça Sorulanlar
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-(--color-text-strong) leading-tight mb-4">
            Aklınızdaki Soruları
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Hızlıca Yanıtlayalım
            </span>
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
function HelpCircleFallback() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
  10. FLOATING CTA — pill that appears after hero, hides near footer
   ════════════════════════════════════════════════════════════════ */

interface FloatingCTAProps {
  onRegister: () => void;
}
export function FloatingCTA({ onRegister }: FloatingCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handle = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const nearBottom = max - y < 240;
      setVisible(y > 720 && !nearBottom);
    };
    window.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => window.removeEventListener("scroll", handle);
  }, []);

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
          <span className="flex items-center gap-2 text-xs font-bold text-(--color-text-body) pr-1">
            <span
              className="halo-dot w-2 h-2 rounded-full"
              style={{ color: "#10b981", background: "#10b981" }}
            />
            Ücretsiz başlayın
          </span>
          <button
            type="button"
            onClick={onRegister}
            className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-indigo-500/40 transition-shadow"
          >
            Hemen dene
            <Zap size={12} />
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
  color: string;
  icon: typeof Brain;
}
const EXTENDED_GAMES: readonly GameEntry[] = [
  { key: "memory", label: "Sıra Hafızası", area: "Çalışma Belleği", desc: "Sırayla yanan nesneleri hatırlayarak çalışma belleğini güçlendir.", color: "#6366f1", icon: Brain },
  { key: "pulse", label: "Mavi Nabız", area: "El-Göz Koordinasyonu", desc: "Hedeflere dokunarak el-göz koordinasyonunu geliştir.", color: "#8b5cf6", icon: Target },
  { key: "scan", label: "Hedef Tarama", area: "Görsel Algı", desc: "Görsel tarama ve seçici dikkat becerilerini destekle.", color: "#06b6d4", icon: Activity },
  { key: "sort", label: "Renk Kulesi", area: "Problem Çözme", desc: "Renkleri kurala göre sıralayarak yürütücü işlevleri geliştir.", color: "#f59e0b", icon: Sparkles },
  { key: "echo", label: "Yankı Seanslarıı", area: "İşitsel Dikkat", desc: "Sesleri doğru sırayla tekrar et, işitsel hafızayı pekiştir.", color: "#ec4899", icon: HeartPulse },
  { key: "path", label: "Yol Bul", area: "Planlama", desc: "Labirent benzeri patikalarda sıralı plan becerilerini çalış.", color: "#10b981", icon: Target },
];

export function GamesCarousel({ onLogin }: { onLogin: () => void }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const handle = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      setProgress(el.scrollLeft / max);
    };
    el.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => el.removeEventListener("scroll", handle);
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <section id="games" className="py-16 md:py-32 section-games relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 flex-wrap px-4 sm:px-6 mb-8 sm:mb-10">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-(--color-primary) uppercase mb-4 bg-(--color-primary-light) px-4 py-2 rounded-full">
              <Gamepad2 size={12} />
              Terapötik İçerik
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-(--color-games-text) leading-tight max-w-lg">
              Her Oyun Bir
              <br />
              <span className="text-gradient-shift">Gelişim Hedefi</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Önceki"
              className="w-11 h-11 rounded-full flex items-center justify-center border border-(--color-games-card-border) bg-(--color-games-badge-bg) text-(--color-games-text) hover:border-(--color-primary)/40 transition-colors"
            >
              <ChevronDown size={16} className="-rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Sonraki"
              className="w-11 h-11 rounded-full flex items-center justify-center border border-(--color-games-card-border) bg-(--color-games-badge-bg) text-(--color-games-text) hover:border-(--color-primary)/40 transition-colors"
            >
              <ChevronDown size={16} className="rotate-[-90deg] scale-x-[-1]" />
            </button>
          </div>
        </div>

        <div ref={scrollerRef} className="h-snap">
          {EXTENDED_GAMES.map((g) => {
            const Icon = g.icon;
            return (
              <button
                type="button"
                key={g.key}
                onClick={onLogin}
                className="group relative w-[300px] sm:w-[340px] text-left rounded-3xl border border-(--color-games-card-border) overflow-hidden bg-(--color-games-card-bg) transition-colors hover:border-(--color-primary)/40"
              >
                <div
                  className="aspect-[4/3] relative flex items-center justify-center overflow-hidden"
                  style={{
                    background: `radial-gradient(circle at 30% 20%, ${g.color}33, transparent 60%), linear-gradient(to bottom right, var(--color-games-tile-from), var(--color-games-tile-to))`,
                  }}
                >
                  <span className="beam-sweep" style={{ animationDelay: `${Math.random() * 2}s` }} />
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: -2 }}
                    transition={{ duration: 0.35 }}
                    className="relative w-24 h-24 rounded-[28px] flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${g.color}, ${g.color}99)`,
                      boxShadow: `0 20px 40px ${g.color}55`,
                    }}
                  >
                    <Icon size={38} className="text-white drop-shadow-lg" />
                  </motion.div>
                  <span className="absolute top-4 left-4 text-xs font-semibold text-(--color-games-text) bg-(--color-games-badge-bg) backdrop-blur-md px-3 py-1.5 rounded-full border border-(--color-games-badge-border)">
                    {g.area}
                  </span>
                  <span className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Play size={16} className="text-white ml-0.5" />
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-(--color-games-text) text-lg mb-2">
                    {g.label}
                  </h3>
                  <p className="text-sm text-(--color-games-text-soft) leading-relaxed mb-4">
                    {g.desc}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-(--color-primary) group-hover:translate-x-1 transition-transform">
                    Seansı başlat
                    <ChevronDown size={13} className="-rotate-90" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 sm:px-6 mt-6 flex items-center gap-3 max-w-sm">
          <div className="flex-1 h-1 rounded-full bg-(--color-games-card-border) overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-[width] duration-300"
              style={{ width: `${Math.max(10, progress * 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-bold tabular-nums text-(--color-games-text-soft) shrink-0">
            {Math.round(progress * 100)}%
          </span>
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
  14. AURORA HERO BACKDROP — layered animated mesh
   ════════════════════════════════════════════════════════════════ */

export function AuroraBackdrop() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <span className="aurora-layer" />
      <span className="noise-overlay" />
    </div>
  );
}
