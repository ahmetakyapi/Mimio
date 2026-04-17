"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring as useSpringFM,
  useTransform,
} from "framer-motion";
import { MimioPlayer } from "./MimioPlayer";
import {
  Users,
  Gamepad2,
  CalendarDays,
  FileText,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Brain,
  CheckCircle2,
  LayoutDashboard,
  Sun,
  Moon,
  Target,
  Sparkles,
  Zap,
  Star,
  Play,
  Heart,
  Shield,
  Clock,
  Stethoscope,
  BarChart3,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
  AuroraBackdrop,
  ComparisonSection,
  CursorSpotlight,
  FAQSection,
  FloatingCTA,
  GamesCarousel,
  Magnetic,
  MetricsBand,
  SectionDots,
  SplitText,
  StickyWalkthrough,
  TiltCard,
  TrustMarquee,
} from "./landing/LandingExtras";

/* ── Scroll Progress Bar ── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpringFM(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-[200] h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 origin-left pointer-events-none"
    />
  );
}

interface Props {
  readonly onLogin: () => void;
  readonly onRegister: () => void;
}

/* ── Data ── */

const FEATURES = [
  {
    icon: Users,
    title: "Danışan Yönetimi",
    body: "Tüm hastalarınızın bilgilerini, seans geçmişlerini ve kişisel notlarınızı güvenle saklayın.",
    color: "#818cf8",
    size: "large" as const,
  },
  {
    icon: Gamepad2,
    title: "İnteraktif Oyunlar",
    body: "6 farklı bilişsel ve motor beceri oyunuyla çocukların seanslara katılımını artırın.",
    color: "#c084fc",
    size: "small" as const,
  },
  {
    icon: CalendarDays,
    title: "Haftalık Plan",
    body: "Her danışan için kişiselleştirilmiş terapi programları oluşturun.",
    color: "#22d3ee",
    size: "small" as const,
  },
  {
    icon: TrendingUp,
    title: "İlerleme Analizi",
    body: "Oyun skorları ve seans verileriyle danışan gelişimini grafikler üzerinden takip edin.",
    color: "#fcd34d",
    size: "large" as const,
  },
  {
    icon: FileText,
    title: "Seans Notları",
    body: "Her seansın detaylı gözlemlerini kolayca kaydedin ve geçmişe dönük inceleyin.",
    color: "#6ee7b7",
    size: "small" as const,
  },
  {
    icon: ShieldCheck,
    title: "Güvenli & Gizli",
    body: "Klinik standartlara uygun veri güvenliği ile danışan bilgileriniz koruma altında.",
    color: "#f9a8d4",
    size: "small" as const,
  },
];

const STEPS = [
  {
    num: "01",
    title: "Hesap Oluşturun",
    body: "Klinik veya bireysel profilinizi saniyeler içinde oluşturun.",
    icon: Sparkles,
    color: "#818cf8",
  },
  {
    num: "02",
    title: "Danışan Ekleyin",
    body: "Hizmet verdiğiniz kişilerin bilgilerini ve terapi hedeflerini girin.",
    icon: Users,
    color: "#22d3ee",
  },
  {
    num: "03",
    title: "Oynayın & Takip Edin",
    body: "Seanslarda oyunları açın, sonuçları otomatik kaydedin.",
    icon: Play,
    color: "#10b981",
  },
];

const TESTIMONIALS = [
  {
    name: "Dr. Elif Yılmaz",
    role: "Pediatrik Ergoterapist",
    text: "Mimio ile seanslardaki çocuk katılımı gözle görülür arttı. Dijital takip sistemi klinik raporlamayı çok kolaylaştırdı.",
    avatar: "EY",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    name: "Mehmet Kaya",
    role: "Nörolojik Rehabilitasyon Uzmanı",
    text: "Oyun bazlı terapi yaklaşımı hastalarımın motivasyonunu artırdı. İlerleme grafikleri aileyle paylaşım için mükemmel.",
    avatar: "MK",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    name: "Ayşe Demir",
    role: "Çocuk Gelişim Uzmanı",
    text: "Kanıta dayalı oyun tasarımları ve kolay arayüzü ile günlük klinik pratiğimin vazgeçilmez aracı oldu.",
    avatar: "AD",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    name: "Prof. Dr. Cem Aksoy",
    role: "Nörogelişim Araştırmacısı",
    text: "Kanıta dayalı protokollerle uyumlu domain yapısı, akademik araştırma için de veri toplamayı kolaylaştırıyor.",
    avatar: "CA",
    gradient: "from-amber-500 to-orange-500",
  },
];

const NAV_LINKS = [
  { label: "Özellikler", id: "features" },
  { label: "Nasıl Çalışır?", id: "how-it-works" },
  { label: "Oyunlar", id: "games" },
  { label: "Karşılaştır", id: "comparison" },
  { label: "SSS", id: "faq" },
];

const SECTION_DOTS = [
  { id: "top", label: "Ana Sayfa" },
  { id: "features", label: "Özellikler" },
  { id: "walkthrough", label: "Platform Turu" },
  { id: "how-it-works", label: "Nasıl Çalışır?" },
  { id: "games", label: "Oyunlar" },
  { id: "comparison", label: "Karşılaştır" },
  { id: "testimonials", label: "Yorumlar" },
  { id: "faq", label: "SSS" },
  { id: "cta", label: "Başla" },
] as const;

/* ── Animations ── */

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const slideRight = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerFast = {
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ── Animated Background Orbs ── */
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)",
        }}
      />
      <motion.div
        animate={{ x: [0, -40, 30, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -right-40 w-[250px] sm:w-[380px] lg:w-[500px] h-[250px] sm:h-[380px] lg:h-[500px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.12), transparent 70%)",
        }}
      />
      <motion.div
        animate={{ x: [0, 20, -30, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 -left-20 w-[200px] sm:w-[300px] lg:w-[400px] h-[200px] sm:h-[300px] lg:h-[400px] rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)",
        }}
      />
    </div>
  );
}

/* ── Animated Grid Pattern ── */
function GridPattern() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-[0.03]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                               */
/* ══════════════════════════════════════════════════════════════ */

export default function LandingPage({ onLogin, onRegister }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, -120]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.94]);
  const heroOpacity = useTransform(heroProgress, [0, 1], [1, 0.35]);
  const parallaxMockY = useTransform(heroProgress, [0, 1], [0, 80]);
  const parallaxMockScale = useTransform(heroProgress, [0, 1], [1, 1.06]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div id="top" className="min-h-screen bg-(--color-page-bg) font-(--font-sans) relative">
      <ScrollProgress />
      <BackgroundOrbs />
      <GridPattern />
      <CursorSpotlight />
      <SectionDots sections={SECTION_DOTS} />
      <FloatingCTA onRegister={onRegister} />

      {/* ── Navbar ── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-2xl border-b border-(--color-line) shadow-lg"
            : "backdrop-blur-sm"
        }`}
        style={{
          background: scrolled ? "var(--color-chrome-nav)" : "transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => scrollTo("top")}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/25">
              M
            </div>
            <span className="font-extrabold text-(--color-text-strong) text-lg tracking-tight">
              Mimio
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <button
                type="button"
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-sm text-(--color-text-soft) hover:text-(--color-text-strong) font-medium transition-colors px-4 py-2 rounded-lg hover:bg-(--color-surface)"
              >
                {l.label}
              </button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-(--color-text-muted) hover:text-(--color-primary) hover:bg-(--color-primary-light) bg-transparent border border-(--color-line) cursor-pointer transition-all duration-200"
              aria-label="Tema değiştir"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="text-sm font-semibold text-(--color-text-body) hover:text-(--color-text-strong) transition-colors px-4 py-2.5 rounded-xl hover:bg-(--color-surface)"
            >
              Giriş Yap
            </button>
            <Magnetic strength={10}>
              <button
                type="button"
                onClick={onRegister}
                className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5"
              >
                Hemen Başla
              </button>
            </Magnetic>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-(--color-text-muted) hover:text-(--color-primary) bg-transparent border border-(--color-line) cursor-pointer"
              aria-label="Tema değiştir"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-(--color-text-body) border border-(--color-line)"
              onClick={() => setMenuOpen(true)}
              aria-label="Menüyü aç"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] backdrop-blur-2xl flex flex-col p-6 gap-2"
            style={{ background: "var(--color-page-bg)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  M
                </div>
                <span className="font-extrabold text-(--color-text-strong) text-lg">
                  Mimio
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-(--color-text-soft) border border-(--color-line)"
                aria-label="Menüyü kapat"
              >
                <X size={18} />
              </button>
            </div>
            {NAV_LINKS.map((l, i) => (
              <motion.button
                type="button"
                key={l.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => scrollTo(l.id)}
                className="text-left text-lg font-semibold text-(--color-text-body) py-4 px-4 rounded-xl hover:bg-(--color-surface) transition-colors"
              >
                {l.label}
              </motion.button>
            ))}
            <div className="flex flex-col gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogin();
                }}
                className="w-full py-3.5 text-center font-semibold border border-(--color-line) rounded-xl text-(--color-text-body) hover:bg-(--color-surface) transition-colors"
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRegister();
                }}
                className="w-full py-3.5 text-center font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl"
              >
                Hemen Başla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section
        ref={heroRef}
        className="pt-24 md:pt-36 pb-16 md:pb-28 px-4 sm:px-6 relative overflow-hidden"
      >
        <AuroraBackdrop />

        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="max-w-7xl mx-auto relative"
        >
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="flex flex-col gap-7"
            >
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2.5 text-xs font-bold text-(--color-primary) bg-(--color-primary-light) px-4 py-2 rounded-full border border-(--color-primary)/15 backdrop-blur-sm">
                  <span
                    className="halo-dot w-1.5 h-1.5 rounded-full"
                    style={{ color: "#6366f1", background: "#6366f1" }}
                  />
                  Ergoterapistler için Yeni Nesil Platform
                </span>
              </motion.div>

              <h1 className="text-[2.5rem] sm:text-6xl lg:text-7xl font-extrabold text-(--color-text-strong) leading-[1.05] tracking-tight">
                <SplitText text="Terapi" />
                <br />
                <SplitText text="Seanslarını" delay={0.08} />
                <br />
                <span className="text-gradient-shift">
                  <SplitText text="Oyuna Dönüştür" delay={0.18} />
                </span>
              </h1>

              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl text-(--color-text-soft) leading-relaxed max-w-lg"
              >
                Çocukların bilişsel ve motor becerilerini geliştirirken
                eğlenmelerini sağlayın. İlerlemeyi dijital olarak takip edin,
                seansları kişiselleştirin.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex items-center gap-4 flex-wrap"
              >
                <Magnetic strength={14}>
                  <button
                    type="button"
                    onClick={onRegister}
                    className="group relative flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 text-sm w-full sm:w-auto overflow-hidden"
                  >
                    <span className="beam-sweep opacity-60" />
                    <span className="relative z-10 flex items-center gap-2.5">
                      Ücretsiz Başla
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </button>
                </Magnetic>
                <button
                  type="button"
                  onClick={() => scrollTo("games")}
                  className="flex items-center justify-center gap-2.5 bg-(--color-surface) text-(--color-text-body) font-semibold px-8 py-4 rounded-2xl border border-(--color-line) hover:border-(--color-primary)/30 hover:bg-(--color-surface-elevated) transition-all duration-200 text-sm backdrop-blur-sm w-full sm:w-auto"
                >
                  <Play size={14} />
                  Oyunları İncele
                </button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex items-center gap-4 sm:gap-6 mt-2 flex-wrap"
              >
                {[
                  { icon: Shield, text: "Güvenli veri" },
                  { icon: Zap, text: "Anında başla" },
                  { icon: Heart, text: "Ücretsiz" },
                ].map((b) => (
                  <span
                    key={b.text}
                    className="flex items-center gap-1.5 text-xs text-(--color-text-muted)"
                  >
                    <b.icon size={13} className="text-(--color-text-soft)" />
                    {b.text}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — App window showcase with parallax + float */}
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease }}
              style={{ y: parallaxMockY, scale: parallaxMockScale }}
              className="relative"
            >
              {/* Glow halo */}
              <div className="absolute -inset-8 bg-[radial-gradient(ellipse_70%_60%_at_60%_50%,rgba(99,102,241,0.14),transparent)] blur-3xl pointer-events-none" />

              {/* Floating accent pills */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="hidden sm:flex absolute -top-6 -left-8 z-20 items-center gap-2 px-3.5 py-2 rounded-2xl border glass"
              >
                <span
                  className="halo-dot w-2 h-2 rounded-full"
                  style={{ color: "#10b981", background: "#10b981" }}
                />
                <span className="text-[11px] font-bold text-(--color-text-strong)">
                  +12 gelişim skoru
                </span>
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6,
                }}
                className="hidden sm:flex absolute -bottom-6 -right-5 z-20 items-center gap-2 px-3.5 py-2 rounded-2xl border glass"
              >
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-(--color-text-strong)">
                  Yeni rekor!
                </span>
              </motion.div>

              {/* App window frame */}
              <div
                className="relative w-full rounded-2xl overflow-hidden border border-(--color-line) ring-conic"
                style={{
                  boxShadow:
                    "0 2px 0 0 rgba(255,255,255,0.06) inset, 0 24px 64px rgba(99,102,241,0.14), 0 8px 28px rgba(0,0,0,0.16)",
                }}
              >
                {/* Chrome bar */}
                <div
                  className="flex items-center gap-3 px-4 py-3 border-b border-(--color-line)"
                  style={{ background: "var(--color-surface)" }}
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                  </div>
                  <div className="flex-1 mx-2 max-w-xs">
                    <div className="h-6 rounded-md bg-(--color-surface-elevated) border border-(--color-line) flex items-center justify-center gap-1.5 px-3">
                      <ShieldCheck size={9} className="text-(--color-accent-green) shrink-0" />
                      <span className="text-[10px] text-(--color-text-muted) truncate">
                        mimio.app/dashboard
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--color-primary-light) border border-(--color-primary)/15">
                    <Gamepad2 size={10} className="text-(--color-primary)" />
                    <span className="text-[10px] font-semibold text-(--color-primary)">
                      Mimio
                    </span>
                  </div>
                </div>
                <MimioPlayer />
              </div>
            </motion.div>
          </div>

          {/* Stats Strip */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mt-14 md:mt-28 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              { value: "6+", label: "Terapi Oyunu", icon: Gamepad2 },
              { value: "3", label: "Beceri Alanı", icon: Brain },
              { value: "7", label: "Terapi Domainı", icon: Target },
              { value: "∞", label: "Sınırsız Danışan", icon: Users },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="glass rounded-2xl p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 hover:border-(--color-primary)/20 transition-colors"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-(--color-primary-light) flex items-center justify-center shrink-0">
                  <s.icon size={18} className="text-(--color-primary)" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-(--color-text-strong) leading-none">
                    {s.value}
                  </p>
                  <p className="text-xs text-(--color-text-soft) mt-0.5">
                    {s.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════ TRUST MARQUEE ══════════════════════ */}
      <TrustMarquee />

      {/* ══════════════════════ FEATURES — BENTO GRID w/ TILT ══════════════════════ */}
      <section id="features" className="py-16 md:py-32 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-10 sm:mb-16"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-(--color-primary) uppercase mb-4 bg-(--color-primary-light) px-4 py-2 rounded-full"
            >
              <Sparkles size={12} />
              Özellikler
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold text-(--color-text-strong) mb-5"
            >
              İhtiyacınız Olan
              <br />
              <span className="text-gradient-shift">Her Şey Tek Yerde</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-(--color-text-soft) text-lg max-w-xl mx-auto"
            >
              Mimio, ergoterapistlerin klinik süreçlerini kolaylaştırmak için
              tasarlandı.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 md:grid-cols-4 gap-4"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const isLarge = f.size === "large";
              return (
                <motion.div
                  key={f.title}
                  variants={scaleIn}
                  className={
                    isLarge ? "sm:col-span-2 md:col-span-2" : "md:col-span-1"
                  }
                >
                  <TiltCard max={7}>
                    <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden group cursor-default transition-all duration-300 h-full">
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                        style={{
                          background: `radial-gradient(circle at 0% 0%, ${f.color}15, transparent 50%)`,
                        }}
                      />
                      <div
                        className="tilt-layer-1 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 transition-transform duration-300"
                        style={{
                          background: `${f.color}18`,
                          border: `1px solid ${f.color}25`,
                        }}
                      >
                        <Icon size={22} style={{ color: f.color }} />
                      </div>
                      <h3 className="tilt-layer-2 font-bold text-(--color-text-strong) mb-2 text-lg">
                        {f.title}
                      </h3>
                      <p className="text-sm text-(--color-text-soft) leading-relaxed">
                        {f.body}
                      </p>
                      <div
                        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                        style={{ background: f.color, filter: "blur(40px)" }}
                      />
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ STICKY WALKTHROUGH ══════════════════════ */}
      <StickyWalkthrough />

      {/* ══════════════════════ METRICS BAND ══════════════════════ */}
      <MetricsBand />

      {/* ══════════════════════ PLATFORM PREVIEW ══════════════════════ */}
      <section className="py-16 md:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[900px] h-[400px] sm:h-[600px] bg-[radial-gradient(ellipse,rgba(99,102,241,0.08),transparent_65%)]" />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-(--color-primary) uppercase mb-4 bg-(--color-primary-light) px-4 py-2 rounded-full"
            >
              <LayoutDashboard size={12} />
              Platform Arayüzü
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-extrabold text-(--color-text-strong) mb-4"
            >
              Güçlü Araçlar,{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Sade Arayüz
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-(--color-text-soft) text-base md:text-lg max-w-xl mx-auto"
            >
              Danışan yönetimi, haftalık plan, seans kayıtları ve ilerleme
              takibi — hepsi tek ekranda.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(99,102,241,0.12),transparent)] blur-2xl pointer-events-none" />
            <TiltCard max={4}>
              <div
                className="relative glass-strong rounded-2xl md:rounded-3xl overflow-hidden"
                style={{
                  boxShadow:
                    "0 25px 60px rgba(0,0,0,0.2), 0 0 80px rgba(99,102,241,0.08)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                <div
                  className="flex items-center gap-2 px-5 py-3 border-b border-(--color-line)"
                  style={{ background: "var(--color-surface)" }}
                >
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="flex-1 mx-4 max-w-sm">
                    <div className="h-6 rounded-lg bg-(--color-surface-elevated) border border-(--color-line) flex items-center justify-center">
                      <span className="text-[10px] text-(--color-text-muted) flex items-center gap-1.5">
                        <Shield
                          size={9}
                          className="text-(--color-accent-green)"
                        />
                        mimio.app/dashboard
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex" style={{ minHeight: 340 }}>
                  <div
                    className="hidden sm:flex w-14 border-r border-(--color-line) flex-col items-center py-4 gap-2 shrink-0"
                    style={{ background: "var(--color-sidebar)" }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] mb-3">
                      M
                    </div>
                    {[
                      { Icon: LayoutDashboard, active: true },
                      { Icon: Users, active: false },
                      { Icon: Gamepad2, active: false },
                      { Icon: Stethoscope, active: false },
                      { Icon: BarChart3, active: false },
                    ].map(({ Icon, active }, i) => (
                      <div
                        key={i}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          active
                            ? "bg-(--color-primary)/15 text-(--color-primary)"
                            : "text-(--color-text-muted)"
                        }`}
                      >
                        <Icon size={15} />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div
                          className="h-5 rounded-full w-40"
                          style={{
                            background:
                              "linear-gradient(90deg, var(--color-primary), rgba(139,92,246,0.6))",
                            opacity: 0.7,
                          }}
                        />
                        <div className="h-2.5 rounded-full w-24 bg-(--color-skeleton-lo)" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-8 rounded-lg bg-(--color-primary)/15 flex items-center justify-center">
                          <Gamepad2
                            size={12}
                            className="text-(--color-primary)"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        {
                          label: "Toplam Seans",
                          value: "24",
                          bg: "rgba(99,102,241,0.12)",
                          color: "rgba(99,102,241,0.6)",
                          icon: CalendarDays,
                        },
                        {
                          label: "Danışanlar",
                          value: "8",
                          bg: "rgba(16,185,129,0.12)",
                          color: "rgba(16,185,129,0.6)",
                          icon: Users,
                        },
                        {
                          label: "Ort. Skor",
                          value: "84",
                          bg: "rgba(245,158,11,0.12)",
                          color: "rgba(245,158,11,0.6)",
                          icon: TrendingUp,
                        },
                        {
                          label: "Bu Hafta",
                          value: "6",
                          bg: "rgba(6,182,212,0.12)",
                          color: "rgba(6,182,212,0.6)",
                          icon: Target,
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-xl p-3"
                          style={{ background: s.bg }}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <s.icon size={11} style={{ color: s.color }} />
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider"
                              style={{ color: s.color }}
                            >
                              {s.label}
                            </span>
                          </div>
                          <strong className="text-xl font-extrabold text-(--color-text-strong) leading-none">
                            {s.value}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {[
                        {
                          name: "Ela Selin",
                          game: "Sıra Hafızası",
                          score: 92,
                          color: "#6366f1",
                        },
                        {
                          name: "Tuna Akarsu",
                          game: "Mavi Nabız",
                          score: 78,
                          color: "#8b5cf6",
                        },
                        {
                          name: "Asya Demir",
                          game: "Hedef Tarama",
                          score: 85,
                          color: "#06b6d4",
                        },
                      ].map((s) => (
                        <div
                          key={s.name}
                          className="flex items-center gap-2.5 border border-(--color-line) rounded-xl px-3 py-2.5"
                          style={{ background: "var(--color-surface)" }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                            style={{
                              background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`,
                            }}
                          >
                            {s.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-(--color-text-strong) m-0 truncate">
                              {s.name}
                            </p>
                            <p className="text-[10px] text-(--color-text-muted) m-0">
                              {s.game}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-extrabold tabular-nums"
                              style={{ color: s.color }}
                            >
                              {s.score}
                            </span>
                            <div className="w-14 h-1.5 bg-(--color-surface-elevated) rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${s.score}%`,
                                  background: s.color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section id="how-it-works" className="py-16 md:py-32 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-12 md:mb-20"
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold text-(--color-text-strong) mb-4"
            >
              Nasıl Çalışır?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-(--color-text-soft) text-lg"
            >
              Sadece 3 adımda dijital terapi süreçlerinize başlayın.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="relative"
          >
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-(--color-line) to-transparent" />
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {STEPS.map((step) => {
                const StepIcon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center text-center gap-4 sm:gap-5 relative"
                  >
                    <div className="relative z-10">
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-(--color-line) shadow-(--shadow-card)"
                        style={{ background: `${step.color}12` }}
                      >
                        <StepIcon size={28} style={{ color: step.color }} />
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-(--color-primary) text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-(--color-primary)/25">
                        {step.num}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-(--color-text-strong) text-lg mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-(--color-text-soft) leading-relaxed max-w-xs mx-auto">
                        {step.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ GAMES — HORIZONTAL CAROUSEL ══════════════════════ */}
      <GamesCarousel onLogin={onLogin} />

      {/* ══════════════════════ COMPARISON ══════════════════════ */}
      <ComparisonSection />

      {/* ══════════════════════ TESTIMONIALS ══════════════════════ */}
      <section id="testimonials" className="py-16 md:py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_40%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold text-(--color-text-strong) mb-4"
            >
              Uzmanlar Ne Diyor?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-(--color-text-soft) text-lg"
            >
              Mimio&apos;yu kullanan ergoterapistlerin deneyimleri.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerFast}
            className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={slideRight}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 relative overflow-hidden group"
              >
                <div className="absolute top-3 right-5 text-5xl font-serif text-(--color-text-disabled) leading-none select-none">
                  &ldquo;
                </div>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-(--color-text-body) leading-relaxed mb-5 relative z-10">
                  {t.text}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-(--color-line)">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-(--color-text-strong) m-0 truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-(--color-text-soft) m-0 truncate">
                      {t.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ FAQ ══════════════════════ */}
      <FAQSection />

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section id="cta" className="py-20 md:py-36 px-4 sm:px-6 relative overflow-hidden">
        <AuroraBackdrop />
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(99,102,241,0.1),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(139,92,246,0.06),transparent)]" />
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="flex flex-col items-center gap-8"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 text-xs font-bold text-(--color-primary) bg-(--color-primary-light) px-4 py-2 rounded-full"
            >
              <Zap size={12} />
              Hemen Başla
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl font-extrabold text-(--color-text-strong) leading-tight"
            >
              Klinik Süreçlerinizi
              <br />
              <span className="text-gradient-shift">Bugün Dijitalleştirin</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-(--color-text-soft) max-w-lg"
            >
              Mimio ile terapi seanslarınızı daha ölçülebilir, daha eğlenceli ve
              daha verimli hale getirin.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Magnetic strength={18}>
                <button
                  type="button"
                  onClick={onRegister}
                  className="group relative flex items-center gap-2.5 text-white font-semibold px-10 py-4 rounded-2xl text-base transition-all duration-300 hover:-translate-y-0.5 overflow-hidden w-full sm:w-auto justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
                  <span className="relative z-10 flex items-center gap-2.5">
                    Ücretsiz Hesabını Oluştur
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </button>
              </Magnetic>
              <button
                type="button"
                onClick={onLogin}
                className="text-sm font-semibold text-(--color-text-body) hover:text-(--color-text-strong) px-6 py-4 rounded-2xl border border-(--color-line) hover:border-(--color-primary)/30 transition-all w-full sm:w-auto text-center"
              >
                Giriş Yap
              </button>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-8 mt-4 text-sm text-(--color-text-soft)"
            >
              {[
                { icon: CheckCircle2, text: "Ücretsiz başla" },
                { icon: Clock, text: "Kurulum gerektirmez" },
                { icon: Shield, text: "Güvenli veri" },
              ].map((t) => (
                <span key={t.text} className="flex items-center gap-2">
                  <t.icon size={15} className="text-(--color-accent-green)" />
                  {t.text}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer
        className="border-t border-(--color-line) py-8 sm:py-12 px-4 sm:px-6"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                M
              </div>
              <span className="font-extrabold text-(--color-text-strong) text-lg">
                Mimio
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {NAV_LINKS.map((l) => (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="text-sm text-(--color-text-muted) hover:text-(--color-text-body) transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-(--color-text-muted)">
              © 2026 Mimio. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
