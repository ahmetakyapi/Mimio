"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useSpring as useSpringFM,
  useTransform,
} from "framer-motion";
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
import { HeroSessionCard } from "./landing/HeroSessionCard";
import { BlockMark, BrandLockup } from "./brand/BlockMark";
import { HERO_STATS, PLATFORM_STATS } from "@/lib/platform-stats";
import {
  ComparisonSection,
  FAQSection,
  FloatingCTA,
  GamesCarousel,
  Magnetic,
  PaperBackdrop,
  SectionDots,
  StickyWalkthrough,
  TiltCard,
  TrustMarquee,
} from "./landing/LandingExtras";

/*
 * Kaydırmaya bağlı her hareket aynı yayı kullanır. Tek bir katsayı seti,
 * sayfanın her yerinde aynı ağırlık hissini verir; farklı bölümlerin
 * birbirinden bağımsız hızlarda "yüzmesini" engeller.
 */
const SCROLL_SPRING = { stiffness: 90, damping: 26, mass: 0.35, restDelta: 0.0005 } as const;

/* ── Scroll Progress Bar ── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpringFM(scrollYProgress, SCROLL_SPRING);
  return (
    <motion.div
      style={{ scaleX, background: "var(--color-primary)" }}
      className="fixed top-0 left-0 right-0 z-[200] h-[2px] origin-left pointer-events-none"
      aria-hidden
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
    color: "#4d7dff",
    size: "large" as const,
  },
  {
    icon: Gamepad2,
    title: "İnteraktif Oyunlar",
    body: `${PLATFORM_STATS.gameCount} bilişsel ve motor beceri oyunuyla çocukların seanslara katılımını artırın.`,
    color: "#a8c2ff",
    size: "small" as const,
  },
  {
    icon: CalendarDays,
    title: "Haftalık Plan",
    body: "Her danışan için kişiselleştirilmiş terapi programları oluşturun.",
    color: "#9a80ff",
    size: "small" as const,
  },
  {
    icon: TrendingUp,
    title: "İlerleme Analizi",
    body: "Oyun skorları ve seans verileriyle danışan gelişimini grafikler üzerinden takip edin.",
    color: "#f5c26b",
    size: "large" as const,
  },
  {
    icon: FileText,
    title: "Seans Notları",
    body: "Her seansın detaylı gözlemlerini kolayca kaydedin ve geçmişe dönük inceleyin.",
    color: "#7ee0b8",
    size: "small" as const,
  },
  {
    icon: ShieldCheck,
    title: "Güvenli & Gizli",
    body: "Klinik standartlara uygun veri güvenliği ile danışan bilgileriniz koruma altında.",
    color: "#f7a8b8",
    size: "small" as const,
  },
];

const STEPS = [
  {
    num: "01",
    title: "Hesap Oluşturun",
    body: "Klinik veya bireysel profilinizi saniyeler içinde oluşturun.",
    icon: Sparkles,
    color: "#4d7dff",
  },
  {
    num: "02",
    title: "Danışan Ekleyin",
    body: "Hizmet verdiğiniz kişilerin bilgilerini ve terapi hedeflerini girin.",
    icon: Users,
    color: "#9a80ff",
  },
  {
    num: "03",
    title: "Oynayın & Takip Edin",
    body: "Seanslarda oyunları açın, sonuçları otomatik kaydedin.",
    icon: Play,
    color: "#12b886",
  },
];

const PERSONAS = [
  {
    role: "Pediatrik Ergoterapist",
    text: "Seanslarda çocuğun ilgisini oyunla canlı tutun; skorlar ve seans süreleri kendiliğinden kaydedilsin.",
    module: "Oyun Alanı",
    icon: Stethoscope,
    accent: "#2b62f5",
  },
  {
    role: "Nörolojik Rehabilitasyon Uzmanı",
    text: "El-göz koordinasyonu ve işlem hızı oyunlarıyla motor hedefleri çalışın, gelişimi grafiklerle izleyin.",
    module: "Raporlar",
    icon: Brain,
    accent: "#17c2e0",
  },
  {
    role: "Çocuk Gelişim Uzmanı",
    text: `Her danışan için haftalık program oluşturun; ${PLATFORM_STATS.activityCount} hazır aktiviteden ${PLATFORM_STATS.homeExerciseCount} tanesi ev programına uygun.`,
    module: "Haftalık Plan",
    icon: Heart,
    accent: "#12b886",
  },
  {
    role: "Özel Eğitim Uzmanı",
    text: "Kanıta dayalı protokolleri takip edin, SOAP formatında not tutun ve hedef bazlı ilerleme kaydedin.",
    module: "Terapi Programı",
    icon: Users,
    accent: "#f59e0b",
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
  { id: "testimonials", label: "Kimler İçin" },
  { id: "faq", label: "SSS" },
  { id: "cta", label: "Başla" },
] as const;

/* ── Animations ── */

const ease = [0.22, 1, 0.36, 1] as const;

/*
 * Tek bir görünüm eşiği. Önceden bölümler -60px ve -80px arasında
 * gidip geliyordu; art arda gelen iki bölüm birbirinden farklı anlarda
 * açılınca kaydırma düzensiz hissettiriyordu. `amount` eklendi ki tetik
 * bölümün yüksekliğinden bağımsız olsun.
 */
const REVEAL_VIEWPORT = { once: true, margin: "-72px", amount: 0.15 } as const;

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

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                               */
/* ══════════════════════════════════════════════════════════════ */

export default function LandingPage({ onLogin, onRegister }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  /*
   * Kahraman paralaksı.
   *
   * Önceki kurgu üç dönüşümü birlikte uyguluyordu: y, scale ve opacity.
   * Ölçek değişimi kaydırma sırasında büyük başlığı bulanıklaştırıyor,
   * 0.35'e inen opaklık ise içerik hâlâ ekrandayken metni okunmaz hâle
   * getiriyordu. Kalan iki dönüşüm de yaya sarıldı: `useScroll` ham değeri
   * kaydırma olaylarıyla birlikte sıçrar, yay bunu sürekli hâle getirir.
   */
  const heroRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroEased = useSpringFM(heroProgress, SCROLL_SPRING);
  const heroY = useTransform(heroEased, [0, 1], [0, reducedMotion ? 0 : -72]);
  const heroOpacity = useTransform(heroEased, [0, 1], [1, reducedMotion ? 1 : 0.62]);
  const parallaxMockY = useTransform(heroEased, [0, 1], [0, reducedMotion ? 0 : 54]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mobil menü açıkken: scroll kilidi, Esc ile kapatma, odak tuzağı
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) {
      return () => {
        document.body.style.overflow = "";
      };
    }

    const menuEl = menuRef.current;
    const focusables = () =>
      Array.from(
        menuEl?.querySelectorAll<HTMLElement>("button, a[href]") ?? []
      );
    focusables()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div id="top" className="min-h-screen font-(--font-sans) relative">
      <ScrollProgress />
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
            <BrandLockup size={30} />
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
                className="btn-signature text-sm font-semibold px-5 py-2.5 rounded-xl"
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
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Gezinme menüsü"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] backdrop-blur-2xl flex flex-col p-6 gap-2"
            style={{ background: "var(--color-page-bg)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <BrandLockup size={30} />
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
                className="btn-signature w-full py-3.5 text-center font-semibold rounded-xl"
              >
                Hemen Başla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════ HERO ══════════════════════ */}
      {/*
        Kahraman bölümü, iki sütunu eşit ağırlıkta tutar: solda tez, sağda
        ürünün ürettiği asıl şey — bir seans kaydı. Önceki kurguda kart
        `max-w-[26rem]` ile sağ sütunun içinde küçücük kalıyor, aradaki
        ~220px'lik boşluk kompozisyonu ikiye bölüyordu. Artık kart kendi
        sütununu doldurur ve iki sütun aynı tabana oturur.
      */}
      <section
        ref={heroRef}
        className="pt-24 md:pt-28 pb-12 md:pb-16 relative overflow-hidden"
      >
        <PaperBackdrop />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="shell shell-wide relative"
        >
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-y-12 lg:gap-x-14 xl:gap-x-20 items-center">
            {/* Sol — tez */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="flex flex-col items-start gap-6"
            >
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-primary) px-3.5 py-1.5 rounded-full"
                style={{
                  background: "var(--color-primary-light)",
                  border: "1px solid var(--color-line-strong)",
                }}
              >
                <span
                  className="halo-dot w-1.5 h-1.5 rounded-full"
                  style={{ color: "#2b62f5", background: "#2b62f5" }}
                />
                Ölçüm temelli ergoterapi platformu
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="text-[2.75rem] sm:text-6xl lg:text-[4.25rem] xl:text-7xl font-extrabold text-(--color-text-strong) leading-[1.02] m-0"
              >
                {/* Vurgu tek kelimede: dokümanda yalnızca "oyuna" renkleniyor.
                    İki kelimeyi birden boyamak cümlenin ağırlık merkezini
                    kaydırıyor — asıl iddia dönüşümün nereye olduğu. */}
                Terapi Seanslarını
                <br />
                <span className="accent-line">Oyuna</span> Dönüştür
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl text-(--color-text-soft) leading-relaxed max-w-[34rem] m-0"
              >
                Çocukların bilişsel ve motor becerilerini geliştirirken
                eğlenmelerini sağlayın. İlerlemeyi dijital olarak takip edin,
                seansları kişiselleştirin.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex items-center gap-3 flex-wrap w-full sm:w-auto"
              >
                <Magnetic strength={14}>
                  <button
                    type="button"
                    onClick={onRegister}
                    className="group relative flex items-center justify-center gap-2.5 font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm w-full sm:w-auto overflow-hidden"
                    style={{
                      background: "var(--gradient-signature)",
                      color: "#ffffff",
                      boxShadow: "var(--shadow-primary)",
                    }}
                  >
                    <span className="beam-sweep opacity-40" />
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
                  className="flex items-center justify-center gap-2.5 font-semibold px-7 py-3.5 rounded-xl text-sm w-full sm:w-auto transition-colors duration-200 hover:bg-(--color-surface-elevated)"
                  style={{
                    background: "var(--color-surface)",
                    color: "var(--color-text-body)",
                    border: "1px solid var(--color-line-strong)",
                  }}
                >
                  <Play size={14} />
                  Oyunları İncele
                </button>
              </motion.div>

              {/*
                Üç ayrı rozet ("Güvenli veri / Anında başla / Ücretsiz")
                yerine tek satır. Rozetler belirsiz bir güven hissi
                satıyordu; bu satır somut bir bilgi veriyor.
              */}
              <motion.p
                variants={fadeUp}
                className="text-xs text-(--color-text-muted) m-0"
              >
                Ücretsiz — kredi kartı istemez, kurulum gerektirmez.
              </motion.p>
            </motion.div>

            {/* Sağ — seans kaydı kartı. Sahte tarayıcı penceresi + tanıtım
                videosu yerine ürünün gerçek çıktısı gösteriliyor. */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease }}
              style={{ y: parallaxMockY }}
              className="relative"
            >
              <HeroSessionCard />
            </motion.div>
          </div>

          {/* Rakamlarla Mimio — her değer platform verisinden türetilir,
              elle yazılmış sayı yoktur (bkz. lib/platform-stats.ts).
              Kutulanmış ızgara yerine editoryal ölçek: üstte tek bir
              kılcal çizgi, sütunlar arasında dikey ayraç. */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mt-14 md:mt-20 pt-7 grid grid-cols-2 lg:grid-cols-4"
            style={{ borderTop: "1px solid var(--color-line-strong)" }}
          >
            {HERO_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="flex flex-col gap-1.5 py-2 px-0 lg:px-6 first:lg:pl-0 last:lg:pr-0"
                style={{
                  borderLeft: i > 0 ? "1px solid var(--color-line)" : undefined,
                  paddingLeft: i > 0 ? "1.5rem" : undefined,
                }}
              >
                <p className="numeral text-4xl sm:text-[2.75rem] font-extrabold text-(--color-text-strong) leading-none m-0">
                  {stat.value}
                </p>
                <p className="text-sm font-semibold text-(--color-text-body) m-0">
                  {stat.label}
                </p>
                <p className="text-xs text-(--color-text-muted) leading-snug m-0">
                  {stat.hint}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════ TRUST MARQUEE ══════════════════════ */}
      <TrustMarquee />

      {/* ══════════════════════ FEATURES — BENTO GRID w/ TILT ══════════════════════ */}
      <section id="features" className="section relative">
        <div className="shell shell-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
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
              <span className="accent-line">Her Şey Tek Yerde</span>
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
            viewport={REVEAL_VIEWPORT}
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

      {/* ══════════════════════ PLATFORM PREVIEW ══════════════════════ */}
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
        </div>
        <div className="shell">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
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
              <span className="accent-line">
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
            viewport={REVEAL_VIEWPORT}
            transition={{ duration: 0.7, ease }}
            className="relative"
          >
            <TiltCard max={4}>
              <div
                className="relative glass-strong rounded-2xl md:rounded-3xl overflow-hidden"
                style={{
                  boxShadow:
                    "0 25px 60px rgba(0,0,0,0.2), 0 0 80px rgba(43, 98, 245,0.08)",
                }}
              >
                
                <div
                  className="flex items-center gap-2 px-5 py-3 border-b border-(--color-line)"
                  style={{ background: "var(--color-surface)" }}
                >
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f0708a]/60" />
                    <div className="w-3 h-3 rounded-full bg-[#f5c26b]/60" />
                    <div className="w-3 h-3 rounded-full bg-[#19d19b]/60" />
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
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] mb-3"
                      style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}>
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
                              "linear-gradient(90deg, var(--color-primary), rgba(77, 125, 255,0.6))",
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
                          bg: "rgba(43, 98, 245,0.12)",
                          color: "rgba(43, 98, 245,0.6)",
                          icon: CalendarDays,
                        },
                        {
                          label: "Danışanlar",
                          value: "8",
                          bg: "rgba(18, 184, 134,0.12)",
                          color: "rgba(18, 184, 134,0.6)",
                          icon: Users,
                        },
                        {
                          label: "Ort. Skor",
                          value: "84",
                          bg: "rgba(245, 158, 11,0.12)",
                          color: "rgba(245, 158, 11,0.6)",
                          icon: TrendingUp,
                        },
                        {
                          label: "Bu Hafta",
                          value: "6",
                          bg: "rgba(23, 194, 224,0.12)",
                          color: "rgba(23, 194, 224,0.6)",
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
                          color: "#2b62f5",
                        },
                        {
                          name: "Tuna Akarsu",
                          game: "Mavi Nabız",
                          score: 78,
                          color: "#4d7dff",
                        },
                        {
                          name: "Asya Demir",
                          game: "Hedef Tarama",
                          score: 85,
                          color: "#17c2e0",
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

      {/* ══════════════════════ HOW IT WORKS ══════════════════════
          Numaralandırma burada gerçek bir sıra bildiriyor: hesap açmadan
          danışan eklenemez, danışan olmadan seans oynanamaz. Bu yüzden
          adımlar yatay bir akış olarak, aralarında ok ile gösteriliyor. */}
      <section id="how-it-works" className="section-tight relative">
        <div className="shell" style={{ maxWidth: "68rem" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={stagger}
            className="section-head section-head-center"
          >
            <motion.h2 variants={fadeUp} className="section-title">
              Üç adımda başlayın
            </motion.h2>
            <motion.p variants={fadeUp} className="section-sub">
              Kurulum yok, kart bilgisi yok. Hesabı açtığınız gün ilk seansı oynatabilirsiniz.
            </motion.p>
          </motion.div>
          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={stagger}
            className="grid md:grid-cols-3 gap-4 list-none p-0 m-0"
          >
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <motion.li
                  key={step.num}
                  variants={fadeUp}
                  className="surface surface-interactive relative flex items-start gap-4 p-5"
                >
                  <div
                    className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}
                  >
                    <StepIcon size={22} style={{ color: step.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="numeral text-[11px] font-extrabold tracking-widest" style={{ color: step.color }}>
                        {step.num}
                      </span>
                      <h3 className="font-bold text-(--color-text-strong) text-base m-0">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-(--color-text-soft) leading-relaxed m-0">
                      {step.body}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-(--color-text-disabled)"
                    />
                  )}
                </motion.li>
              );
            })}
          </motion.ol>
        </div>
      </section>

      {/* ══════════════════════ GAMES — HORIZONTAL CAROUSEL ══════════════════════ */}
      <GamesCarousel onLogin={onLogin} />

      {/* ══════════════════════ COMPARISON ══════════════════════ */}
      <ComparisonSection />

      {/* ══════════════════════ PERSONAS — KİMLER İÇİN ══════════════════════ */}
      <section id="testimonials" className="section relative overflow-hidden">
        <div className="shell shell-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold text-(--color-text-strong) mb-4"
            >
              Kimler İçin Tasarlandı?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-(--color-text-soft) text-lg"
            >
              Mimio, farklı uzmanlık alanlarının klinik iş akışına uyum sağlar.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={staggerFast}
            className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {PERSONAS.map((p) => {
              const PersonaIcon = p.icon;
              return (
                <motion.div
                  key={p.role}
                  variants={slideRight}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 relative overflow-hidden group flex flex-col"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: p.accent, color: "#fff" }}
                  >
                    <PersonaIcon size={19} />
                  </div>
                  <h3 className="text-sm font-bold text-(--color-text-strong) mb-2">
                    {p.role}
                  </h3>
                  <p className="text-sm text-(--color-text-soft) leading-relaxed mb-5 flex-1">
                    {p.text}
                  </p>
                  <div className="pt-4 border-t border-(--color-line)">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-(--color-primary) bg-(--color-primary-light) px-2.5 py-1 rounded-full">
                      <Sparkles size={10} />
                      {p.module}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ FAQ ══════════════════════ */}
      <FAQSection />

      {/* ══════════════════════ CTA ══════════════════════ */}
      {/* Kapanış bölümünde milimetrik kâğıt bilinçli olarak yok: ızgara
          kahraman bölümünün imzası, sayfanın ortasında tekrar edince hem
          etkisini yitiriyor hem de bölüm sınırında sert bir kenar bırakıyor. */}
      <section id="cta" className="section relative overflow-hidden">
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
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
              <span className="accent-line">Bugün Dijitalleştirin</span>
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
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
            >
              <Magnetic strength={18}>
                <button
                  type="button"
                  onClick={onRegister}
                  className="group relative flex items-center gap-2.5 font-semibold px-10 py-4 rounded-xl text-base transition-all duration-300 hover:-translate-y-0.5 overflow-hidden w-full sm:w-auto justify-center"
                  style={{
                    background: "var(--color-primary)",
                    color: "var(--color-text-inverse)",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
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
        className="border-t border-(--color-line) px-4 sm:px-6 relative overflow-hidden"
        style={{ background: "var(--color-surface)" }}
      >
                <div className="max-w-7xl mx-auto pt-12 sm:pt-16 pb-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] mb-10 sm:mb-14">
            {/* Marka */}
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex items-center gap-2.5">
                <BrandLockup size={30} />
              </div>
              <p className="text-sm text-(--color-text-soft) leading-relaxed">
                Ergoterapistler için oyun temelli seans yönetimi: danışan
                takibi, haftalık plan, ilerleme raporları ve kanıta dayalı
                terapi oyunları — tek platformda.
              </p>
              <span className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-(--color-text-muted) px-3 py-1.5 rounded-full border border-(--color-line) bg-(--color-surface-elevated)">
                <span
                  className="halo-dot w-1.5 h-1.5 rounded-full"
                  style={{ color: "#12b886", background: "#12b886" }}
                />
                Tüm sistemler çalışıyor
              </span>
            </div>

            {/* Keşfet */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
                Keşfet
              </p>
              {NAV_LINKS.map((l) => (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="w-fit text-sm text-(--color-text-soft) hover:text-(--color-text-strong) transition-colors text-left"
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Başlayın */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
                Başlayın
              </p>
              <p className="text-sm text-(--color-text-soft) leading-relaxed">
                Kurulum gerektirmez; ilk seansınızı dakikalar içinde
                başlatın.
              </p>
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={onRegister}
                  className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md) text-center"
                  style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
                >
                  Ücretsiz Başla
                </button>
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-sm font-semibold text-(--color-text-body) hover:text-(--color-text-strong) px-5 py-2.5 rounded-xl border border-(--color-line) hover:border-(--color-primary)/30 transition-all text-center"
                >
                  Giriş Yap
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-(--color-line-soft)">
            <p className="text-xs text-(--color-text-muted)">
              © {new Date().getFullYear()} Mimio. Tüm hakları saklıdır.
            </p>
            <p className="text-xs text-(--color-text-muted)">
              Çocuklar için tasarlandı, terapistler için geliştirildi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
