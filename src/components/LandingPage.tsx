"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValueEvent,
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
  Sun,
  Moon,
  Sparkles,
  Play,
  Heart,
  Shield,
  Clock,
  Stethoscope,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { HeroSessionCard } from "./landing/HeroSessionCard";
import { HeroWeekPanel } from "./landing/HeroWeekPanel";
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
    color: "var(--color-primary)",
    size: "large" as const,
  },
  {
    icon: Gamepad2,
    title: "İnteraktif Oyunlar",
    body: `${PLATFORM_STATS.gameCount} bilişsel ve motor beceri oyunuyla çocukların seanslara katılımını artırın.`,
    color: "var(--color-primary-ink)",
    size: "small" as const,
  },
  {
    icon: CalendarDays,
    title: "Haftalık Plan",
    body: "Her danışan için kişiselleştirilmiş terapi programları oluşturun.",
    color: "var(--color-accent-violet)",
    size: "small" as const,
  },
  {
    icon: TrendingUp,
    title: "İlerleme Analizi",
    body: "Oyun skorları ve seans verileriyle danışan gelişimini grafikler üzerinden takip edin.",
    color: "var(--color-accent-amber)",
    size: "large" as const,
  },
  {
    icon: FileText,
    title: "Seans Notları",
    body: "Her seansın detaylı gözlemlerini kolayca kaydedin ve geçmişe dönük inceleyin.",
    color: "var(--color-accent-green)",
    size: "small" as const,
  },
  {
    icon: ShieldCheck,
    title: "Güvenli & Gizli",
    body: "Klinik standartlara uygun veri güvenliği ile danışan bilgileriniz koruma altında.",
    color: "var(--color-accent-red)",
    size: "small" as const,
  },
];

const STEPS = [
  {
    num: "01",
    title: "Hesap Oluşturun",
    body: "Klinik veya bireysel profilinizi saniyeler içinde oluşturun.",
    icon: Sparkles,
    color: "var(--color-primary)",
  },
  {
    num: "02",
    title: "Danışan Ekleyin",
    body: "Hizmet verdiğiniz kişilerin bilgilerini ve terapi hedeflerini girin.",
    icon: Users,
    color: "var(--color-accent-violet)",
  },
  {
    num: "03",
    title: "Oynayın & Takip Edin",
    body: "Seanslarda oyunları açın, sonuçları otomatik kaydedin.",
    icon: Play,
    color: "var(--color-accent-green)",
  },
];

const PERSONAS = [
  {
    role: "Pediatrik Ergoterapist",
    text: "Seanslarda çocuğun ilgisini oyunla canlı tutun; skorlar ve seans süreleri kendiliğinden kaydedilsin.",
    module: "Oyun Alanı",
    icon: Stethoscope,
    accent: "var(--color-primary)",
  },
  {
    role: "Nörolojik Rehabilitasyon Uzmanı",
    text: "El-göz koordinasyonu ve işlem hızı oyunlarıyla motor hedefleri çalışın, gelişimi grafiklerle izleyin.",
    module: "Raporlar",
    icon: Brain,
    accent: "var(--color-accent-teal)",
  },
  {
    role: "Çocuk Gelişim Uzmanı",
    text: `Her danışan için haftalık program oluşturun; ${PLATFORM_STATS.activityCount} hazır aktiviteden ${PLATFORM_STATS.homeExerciseCount} tanesi ev programına uygun.`,
    module: "Haftalık Plan",
    icon: Heart,
    accent: "var(--color-accent-green)",
  },
  {
    role: "Özel Eğitim Uzmanı",
    text: "Kanıta dayalı protokolleri takip edin, SOAP formatında not tutun ve hedef bazlı ilerleme kaydedin.",
    module: "Terapi Programı",
    icon: Users,
    accent: "var(--color-accent-amber)",
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

/** "Kimler İçin" sekmelerinin kendiliğinden geçiş aralığı. */
const PERSONA_DURATION_MS = 5200;
/** Kullanıcı sekmeye dokunduktan sonra zamanlayıcının susacağı süre. */
const PERSONA_GRACE_MS = 9000;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                               */
/* ══════════════════════════════════════════════════════════════ */

export default function LandingPage({ onLogin, onRegister }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  /* Hem kahraman paralaksı hem sekme/tur zamanlayıcıları okuyor; tek yerde. */
  const reducedMotion = useReducedMotion();
  const [persona, setPersona] = useState(0);
  /*
   * Sekmeler kendiliğinden ilerler. Dört uzmanlık alanı var ve okur yalnızca
   * kendisininkine bakıyordu; diğer üçü hiç görünmüyordu. Bölüm ekrandayken
   * dönüyor, kullanıcı bir sekmeye dokunduğunda susuyor — seçimini okumaya
   * vakti olsun; kendi seçtiği sekme altından kaymasın.
   */
  const personaRef = useRef<HTMLElement | null>(null);
  const [personaInView, setPersonaInView] = useState(false);
  const personaTouchedAt = useRef(0);

  const selectPersona = (i: number) => {
    personaTouchedAt.current = Date.now();
    setPersona(i);
  };

  useEffect(() => {
    const el = personaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setPersonaInView(e.isIntersecting), { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || !personaInView) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      if (Date.now() - personaTouchedAt.current < PERSONA_GRACE_MS) return;
      setPersona((prev) => (prev + 1) % PERSONAS.length);
    }, PERSONA_DURATION_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, personaInView]);
  /*
   * Ürün önizlemesi temaya göre iki ayrı görüntü taşıyor. `theme` ilk
   * render'da sunucudaki varsayılana ("light") eşit; localStorage ancak
   * effect'te okunuyor. Koruma olmadan koyu temadaki ziyaretçi önce açık
   * görüntüyü indirip sonra koyusuna geçerdi. Bölüm katlamanın çok
   * altında olduğu için bu bekleme görünmez.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /*
   * Aurora sürüklenmesini kahraman bölümüne bağla.
   *
   * Katman sabit konumlu, yani animasyon sayfanın her yerinde çalışıyor ve
   * compositor hiç boşa çıkmıyordu. Kahraman ekrandan çıkınca duraklatılır;
   * geri dönüldüğünde kaldığı yerden devam eder.
   */
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const root = document.documentElement;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) root.removeAttribute("data-aurora");
        else root.setAttribute("data-aurora", "paused");
      },
      { threshold: 0 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      root.removeAttribute("data-aurora");
    };
  }, []);
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
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroEased = useSpringFM(heroProgress, SCROLL_SPRING);
  const heroY = useTransform(heroEased, [0, 1], [0, reducedMotion ? 0 : -72]);
  const heroOpacity = useTransform(heroEased, [0, 1], [1, reducedMotion ? 1 : 0.62]);
  const parallaxMockY = useTransform(heroEased, [0, 1], [0, reducedMotion ? 0 : 54]);
  /* Arka katman daha çok kayar: iki yüzey arasındaki hız farkı derinliği
     kurar. Tek hızda kayarlarsa kompozisyon düz bir resim gibi okunur. */
  const parallaxBoardY = useTransform(heroEased, [0, 1], [0, reducedMotion ? 0 : 104]);

  /*
   * Üst çubuğun durumu `scroll` olayıyla değil Motion'ın kendi değeriyle
   * okunur. Olay dinleyicisi her kaydırma karesinde React'i uyandırıyordu;
   * `useMotionValueEvent` değeri render döngüsünün dışında izler ve durum
   * yalnızca eşik geçildiğinde değişir.
   */
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 20;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  // Mobil menü açıkken: scroll kilidi, Esc ile kapatma, odak tuzağı
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    /*
     * Kilit yalnızca `body` üzerindeydi; telefonda kaydırma kabı çoğu zaman
     * `documentElement` olduğu için menü açıkken arkadaki sayfa kayabiliyor,
     * menü kapandığında kullanıcı bambaşka bir yerde uyanıyordu. İki öge de
     * kilitleniyor; panelin kendi kaydırması `overscroll-contain` ile
     * zincirlenmiyor.
     */
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) {
      return () => {
        document.documentElement.style.overflow = "";
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
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  /*
   * Önce menü kapanır, sonra kaydırılır. Ters sırada kaydırma emri kilit
   * hâlâ takılıyken veriliyordu; tarayıcı emri yutunca menüdeki bağlantı
   * hiçbir yere gitmiyordu. İki kare bekleniyor: biri React'in kilidi
   * kaldırması, diğeri düzenin oturması için.
   */
  const scrollTo = (id: string) => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      });
    });
  };

  return (
    <div id="top" className="min-h-[100dvh] font-(--font-sans) relative">
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
            ? "backdrop-blur-md border-b border-(--color-line) shadow-lg"
            : "backdrop-blur-sm"
        }`}
        style={{
          background: scrolled ? "var(--color-chrome-nav)" : "transparent",
        }}
      >
        {/* Telefonda yatay pay `--gutter` ile aynı: marka, altındaki kahraman
            metniyle aynı çizgiden başlasın. 24px'lik sabit pay 4px'lik bir
            kayma bırakıyor, üst çubuk içerikten kopuk duruyordu. */}
        <div className="max-w-7xl mx-auto px-(--gutter) sm:px-6 h-16 flex items-center justify-between">
          {/* Marka aynı zamanda "başa dön" düğmesi; 30px'lik kilit tek başına
              parmak hedefi olarak kısa kalıyordu. Dikey pay negatif kenar
              boşluğuyla dengelenir, çubuğun yüksekliği değişmez. */}
          <button
            type="button"
            onClick={() => scrollTo("top")}
            className="flex items-center gap-2.5 py-2 -my-2 pr-2 -mr-2"
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
                Ücretsiz Başla
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

      {/* ── Mobile Menu ──
          Panel üç parçaya ayrıldı: sabit başlık, kayan bağlantı listesi, sabit
          eylem şeridi. Önceden hepsi tek bir esnek sütundu; içerik ekrandan
          uzun olduğunda satırlar büzülüp 24px'e iniyor (parmakla vurulamaz
          hâle geliyor), en alttaki "Hemen Başla" ekranın dışında kalıyordu.
          Artık yalnızca liste kayar; eylemler her boyda görünür kalır. */}
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
            className="fixed inset-0 z-[60] flex flex-col px-(--gutter) pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            style={{ background: "var(--color-page-bg)" }}
          >
            <div className="flex items-center justify-between shrink-0 mb-4">
              <div className="flex items-center gap-2.5">
                <BrandLockup size={30} />
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-(--color-text-soft) border border-(--color-line)"
                aria-label="Menüyü kapat"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-1 -mx-2 px-2">
              {NAV_LINKS.map((l, i) => (
                <motion.button
                  type="button"
                  key={l.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => scrollTo(l.id)}
                  className="shrink-0 text-left text-[17px] font-semibold text-(--color-text-body) py-3.5 px-4 rounded-xl hover:bg-(--color-surface) transition-colors"
                >
                  {l.label}
                </motion.button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 shrink-0 pt-4 mt-2 border-t border-(--color-line)">
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
                Ücretsiz Başla
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
        className="pt-[5.25rem] sm:pt-24 md:pt-28 pb-10 sm:pb-12 md:pb-16 relative overflow-hidden"
      >
        <PaperBackdrop />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="shell shell-wide relative"
        >
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-y-8 sm:gap-y-12 lg:gap-x-14 xl:gap-x-20 items-center">
            {/* Sol — tez */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="flex flex-col items-start gap-4 sm:gap-6"
            >
              {/* Rozet telefonda 11.5px + 0.14em ile 34 karakteri iki satıra
                  bölüp kutuya dönüşüyordu; dar ekranda punto ve harf aralığı
                  gevşetildi. */}
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 sm:gap-2.5 text-[10.5px] tracking-[0.06em] px-3 py-1 sm:text-[11px] sm:tracking-[0.14em] sm:px-3.5 sm:py-1.5 font-bold uppercase text-(--color-primary) rounded-full"
                style={{
                  background: "var(--color-primary-light)",
                  border: "1px solid var(--color-line-strong)",
                }}
              >
                Ölçüm temelli ergoterapi platformu
              </motion.span>

              {/* Taban 44px'ti: 320px'lik ekranda başlık dört satıra bölünüp
                  kahraman bölümünü tek başına dolduruyor, birincil eylem
                  katlamanın altına düşüyordu. Dar ekranda ölçek viewport'la
                  akar, 640px'ten itibaren eski ölçek aynen devam eder. */}
              <motion.h1
                variants={fadeUp}
                className="text-[clamp(1.75rem,8vw,2.75rem)] sm:text-6xl lg:text-[4.25rem] xl:text-7xl text-(--color-text-strong) leading-[1.06] sm:leading-[1.02] m-0"
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
                className="text-[0.9375rem] sm:text-lg md:text-xl text-(--color-text-soft) leading-relaxed max-w-[34rem] m-0"
              >
                Çocukların bilişsel ve motor becerilerini geliştirirken
                eğlenmelerini sağlayın. İlerlemeyi dijital olarak takip edin,
                seansları kişiselleştirin.
              </motion.p>

              {/* `.magnetic` sarmalayıcısı `inline-flex`: içindeki `w-full`
                  sarmalayıcının içerik genişliğini ölçü alıyordu, birincil
                  eylem telefonda ikincil eylemden dar çıkıp zayıf görünüyordu.
                  Genişlik sarmalayıcıya da veriliyor. */}
              <motion.div
                variants={fadeUp}
                className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full sm:w-auto"
              >
                <Magnetic strength={14} className="w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onRegister}
                    className="btn-signature group flex items-center justify-center gap-2.5 font-semibold px-7 py-3.5 rounded-xl text-sm w-full sm:w-auto"
                  >
                    Ücretsiz Başla
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
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

            </motion.div>

            {/*
              Sağ — geniş plan + okunabilir detay.

              Kahraman görseli önce tek bir seans kartıydı: dürüst ama sessiz,
              ürünün ne kadar iş yaptığını göstermiyordu. Ardından kartın
              arkasına oyun tahtası kondu; derinlik geldi ama sayfa hâlâ
              "bu çalışan bir uygulama" demiyordu.

              Ardından arkaya panelin ekran görüntüsü kondu. O da tutmadı:
              küçültülmüş bir ekran görüntüsü kahraman ölçeğinde okunmuyor,
              kenar bar ve yarım kalmış kartlar parça parça bir gürültüye
              dönüşüyordu — tasarlanmış bir sahne değil, arkaya yapıştırılmış
              bir resim gibi duruyordu.

              Şimdi arka yüzey de kahramana özel çiziliyor: bir haftanın
              ritmi (bkz. HeroWeekPanel). İki yüzey tek bir cümle kuruyor —
              arkada haftanın tamamı, önde o haftanın içinden tek bir seansın
              kaydı. İkisi de ürünün ürettiği şeyi kendi ölçeğinde çiziyor,
              ekran görüntüsü taklidi yapmıyor.
            */}
            <div className="relative">
              {/* İmza degradesinden çok soluk bir hâle — iki katmanı bağlayan
                  zemin. Renk %8'in altında kaldığı için yüzey değil ışık olarak
                  okunuyor (degrade yalnızca üç yerde, bkz. THEME.md). */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-12 -inset-y-14 -z-10 hidden sm:block"
                style={{
                  background:
                    "radial-gradient(52% 46% at 70% 22%, color-mix(in srgb, var(--color-signature-from) 8%, transparent), transparent 70%), radial-gradient(46% 42% at 26% 78%, color-mix(in srgb, var(--color-signature-to) 7%, transparent), transparent 72%)",
                }}
              />

              {/* Arka katman — haftanın ritmi. Kahramana özel çizilir;
                  ekran görüntüsü değil (bkz. HeroWeekPanel). */}
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.1, ease }}
                style={{ y: parallaxBoardY }}
                className="hidden sm:block absolute left-[4%] -top-2 w-[100%]"
              >
                <HeroWeekPanel />
              </motion.div>

              {/* Ön katman — okunacak detay */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.28, ease }}
                style={{ y: parallaxMockY }}
                className="relative mx-auto sm:mx-0 sm:mt-[7.5rem] sm:w-[88%] lg:w-[84%]"
              >
                <HeroSessionCard />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════ RAKAMLARLA MİMİO ══════════════════════
          Şerit kahraman bölümünün içindeyken onu beş metin ögesine
          çıkarıyor ve birincil eylemi katlamanın altına itiyordu. Kendi
          bölümüne alındı: kahraman tek bir iddiada bulunur, sayılar hemen
          altında onu doğrular. */}
      <section className="section-tight relative">
        <div className="shell shell-wide">
        {/* Rakamlarla Mimio — her değer platform verisinden türetilir,
            elle yazılmış sayı yoktur (bkz. lib/platform-stats.ts).
            Kutulanmış ızgara yerine editoryal ölçek: üstte tek bir
            kılcal çizgi, sütunlar arasında dikey ayraç. */}
        {/* Dikey ayraç ve sol pay sıraya (i > 0) bağlıydı. Telefonda ızgara
            iki sütuna indiğinde üçüncü kutu satır başına düşüyor, ayracı
            ekranın sol kenarına yapışıyor, metni içeri kaçıyordu. Ayraç
            artık yalnızca dört sütunlu düzende (lg) çizilir; telefonda
            sütunları boşluk ayırır. */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          variants={stagger}
          className="pt-5 sm:pt-7 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4 lg:gap-0"
          style={{ borderTop: "1px solid var(--color-line-strong)" }}
        >
          {HERO_STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="flex flex-col gap-1.5 py-2 min-w-0 lg:px-6 lg:border-l lg:border-(--color-line) lg:first:pl-0 lg:first:border-l-0 lg:last:pr-0"
            >
              <p className="figure text-[1.75rem] sm:text-[2.75rem] text-(--color-text-strong) leading-none m-0">
                {stat.value}
              </p>
              <p className="text-[0.8125rem] sm:text-sm font-semibold text-(--color-text-body) m-0">
                {stat.label}
              </p>
              <p className="text-xs text-(--color-text-muted) leading-snug m-0">
                {stat.hint}
              </p>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </section>

      {/* ══════════════════════ TRUST MARQUEE ══════════════════════ */}
      <TrustMarquee />

      {/* ══════════════════════ FEATURES — BENTO GRID w/ TILT ══════════════════════
          Telefonda bölüm payı 48px: on bir bölümlük bir tanıtım sayfasında
          yalnızca bölüm araları bir ekran boyundan fazla yer tutuyordu. Dar
          ekranda pay 40px'e iner (`!` şart: `.section` katmansız yazılmış,
          katmanlı yardımcıyı bastırıyor). 640px'ten itibaren ritim aynı. */}
      <section id="features" className="section max-sm:py-10! relative">
        <div className="shell shell-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={stagger}
            className="text-center mb-10 sm:mb-16"
          >
            {/* Bölüm başlıkları telefonda 36px basıyordu: iki satırlık başlık
                üç satıra taşıp ekranın yarısını yiyordu. Ölçek 640px'in
                altında viewport'la akar, üstünde eski değerinde kalır. */}
            <motion.h2
              variants={fadeUp}
              className="text-[clamp(1.625rem,7.5vw,2.25rem)] md:text-5xl text-(--color-text-strong) mb-3 sm:mb-5"
            >
              İhtiyacınız Olan
              <br />
              <span className="accent-line">Her Şey Tek Yerde</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-(--color-text-soft) text-[0.9375rem] sm:text-lg max-w-xl mx-auto"
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
                    {/*
                      Geniş hücreler kalıcı bir ton taşır. Altı hücrenin altısı
                      da cam + metinken ızgara tek bir gri blok gibi okunuyor,
                      "large/small" ayrımı yalnızca genişlikten anlaşılıyordu.
                      Ton hücrenin kendi alan renginden türer, yani dekorasyon
                      değil; hangi hücrenin ızgaranın çapası olduğunu söyler.
                      Dar hücrelerde ton yok — hepsine verilince ayrım kaybolur.
                    */}
                    <div
                      className="glass rounded-2xl sm:rounded-3xl p-[1.125rem] sm:p-7 relative overflow-hidden group cursor-default transition-all duration-300 h-full"
                      style={
                        isLarge
                          ? {
                              backgroundImage: `radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, ${f.color} 11%, transparent), transparent 62%)`,
                            }
                          : undefined
                      }
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                        style={{
                          background: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${f.color} 8%, transparent), transparent 50%)`,
                        }}
                      />
                      <div
                        className="tilt-layer-1 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-300"
                        style={{
                          background: `color-mix(in srgb, ${f.color} 9%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${f.color} 15%, transparent)`,
                        }}
                      >
                        <Icon size={22} style={{ color: f.color }} />
                      </div>
                      <h3 className="tilt-layer-2 font-bold text-(--color-text-strong) mb-1.5 sm:mb-2 text-[1.0625rem] sm:text-lg">
                        {f.title}
                      </h3>
                      <p className="text-[0.8125rem] sm:text-sm text-(--color-text-soft) leading-relaxed">
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

      {/* ══════════════════════ ÜRÜN ÖNİZLEMESİ ══════════════════════
          Burada önce trafik ışıkları, sahte bir adres çubuğu ve iskelet
          çubuklarından kurulu bir "gösterge paneli" duruyordu: üründen hiçbir
          şey göstermiyor, yalnızca bir ekran görüntüsü taklit ediyordu.
          Yerine ürünün kendisi geldi — `scripts/capture-app-shots.mjs` bu
          görüntüyü demo hesabına gerçekten girerek çeker, ekrandaki her sayı
          seed verisinden gelir. Pencere çerçevesi bilerek yok: çerçeve ekran
          görüntüsünün gerçek olduğunu değil, öyle görünmeye çalıştığını
          söylüyordu.

          Kahraman haftanın ritmini çiziyor, burası günün kendisini gösteriyor —
          ve burası gerçek bir ekran görüntüsü. Kahramanda ekran görüntüsü
          okunmuyordu; burada tam genişlikte basıldığı için okunuyor ve
          "işte ürün bu" cümlesini asıl burası kuruyor. */}
      <section className="section max-sm:py-10! relative overflow-hidden">
        <div className="shell shell-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={stagger}
            className="max-w-2xl mb-8 sm:mb-12"
          >
            <motion.h2
              variants={fadeUp}
              className="text-[clamp(1.625rem,7.5vw,2.25rem)] md:text-5xl text-(--color-text-strong) mb-3 sm:mb-4"
            >
              Seansın Sabahı <span className="accent-line">Tek Ekranda</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-(--color-text-soft) text-[0.9375rem] sm:text-lg m-0"
            >
              Günün akışı, sıradaki danışan, ortalama skorun eğilimi ve plana
              dokunması gereken uyarılar.
            </motion.p>
          </motion.div>

          <motion.figure
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={REVEAL_VIEWPORT}
            transition={{ duration: 0.7, ease }}
            className="m-0"
          >
            <div
              className="rounded-2xl md:rounded-3xl overflow-hidden border border-(--color-line-strong)"
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              {mounted ? (
                <Image
                  src={theme === "dark" ? "/app/dashboard-dark.webp" : "/app/dashboard-light.webp"}
                  alt="Mimio panelinde bir günün akışı: zaman çizelgesi, sıradaki seans ve gelişim uyarıları"
                  width={2200}
                  height={1375}
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1200px"
                  className="w-full h-auto block"
                />
              ) : (
                /* Tema çözülene kadar aynı orana sahip sessiz bir yüzey:
                   görüntü yerine oturduğunda düzen kaymaz (CLS). */
                <div className="w-full aspect-[2200/1375] bg-(--color-surface)" />
              )}
            </div>
            <figcaption className="mt-3 text-xs text-(--color-text-muted)">
              Demo hesabındaki gerçek ekran. Danışan adları kurgusaldır.
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* ══════════════════════ STICKY WALKTHROUGH ══════════════════════ */}
      <StickyWalkthrough />

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
          {/*
            Üç eş kart yerine tek sütunlu dikey akış. Kartlar burada bir
            hiyerarşi bildirmiyordu: üç adım eşit ağırlıkta ve sırayla
            okunuyor. Sol ray sırayı taşır, `01/02/03` etiketine gerek
            bırakmaz — `<ol>` sırayı zaten hem anlamsal hem görsel olarak
            veriyor. Ray son adımın ikonunda biter, boşluğa uzamaz.
          */}
          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={stagger}
            className="relative mx-auto max-w-2xl list-none p-0 m-0 flex flex-col gap-7 sm:gap-9"
          >
            <span
              aria-hidden="true"
              className="absolute left-[1.375rem] top-6 bottom-6 w-px"
              style={{ background: "var(--color-line-strong)" }}
            />
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <motion.li
                  key={step.num}
                  variants={fadeUp}
                  className="relative flex items-start gap-4 sm:gap-5"
                >
                  <div
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: "var(--color-surface-strong)",
                      border: `1px solid color-mix(in srgb, ${step.color} 24%, transparent)`,
                    }}
                  >
                    <StepIcon size={20} style={{ color: step.color }} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 pt-1.5">
                    <h3 className="font-bold text-(--color-text-strong) text-base m-0 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-[0.8125rem] sm:text-sm text-(--color-text-soft) leading-relaxed m-0">
                      {step.body}
                    </p>
                  </div>
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
      {/*
        Dört uzmanlık alanı, dört eş kart olarak `md:grid-cols-4` içinde
        sıkışıyordu: Türkçe rol adları ("Nörolojik Rehabilitasyon Uzmanı")
        üç satıra bölünüyor, gövde metni kartın içinde nefes alamıyordu.
        Ayrıca eş kart ızgarası sayfada zaten Özellikler bölümünün dili.
        Burada okur dört rolden yalnızca kendisininkini arıyor: seçim işi
        sekmeye devrediliyor, seçilen rol tam genişlikte anlatılıyor.
      */}
      <section ref={personaRef} id="testimonials" className="section max-sm:py-10! relative overflow-hidden">
        <div className="shell" style={{ maxWidth: "68rem" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={stagger}
            className="max-w-2xl mb-8 sm:mb-10"
          >
            <motion.h2
              variants={fadeUp}
              className="text-[clamp(1.625rem,7.5vw,2.25rem)] md:text-5xl text-(--color-text-strong) mb-3 sm:mb-4"
            >
              Kimler İçin Tasarlandı?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-(--color-text-soft) text-[0.9375rem] sm:text-lg m-0"
            >
              Mimio, farklı uzmanlık alanlarının klinik iş akışına uyum sağlar.
            </motion.p>
          </motion.div>

          {/* Sekme şeridi telefonda yatay kayar; ok tuşları listeyi dolaşır. */}
          <div
            role="tablist"
            aria-label="Uzmanlık alanları"
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const step = e.key === "ArrowRight" ? 1 : -1;
              personaTouchedAt.current = Date.now();
              setPersona((i) => (i + step + PERSONAS.length) % PERSONAS.length);
            }}
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-(--gutter) px-(--gutter) sm:mx-0 sm:px-0 pb-1"
          >
            {PERSONAS.map((p, i) => {
              const selected = persona === i;
              return (
                <button
                  type="button"
                  key={p.role}
                  role="tab"
                  id={`persona-tab-${i}`}
                  aria-selected={selected}
                  aria-controls="persona-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectPersona(i)}
                  className={`shrink-0 whitespace-nowrap text-[0.8125rem] sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
                    selected
                      ? "text-(--color-primary-ink)"
                      : "text-(--color-text-soft) hover:text-(--color-text-strong)"
                  }`}
                  style={{
                    background: selected ? "var(--color-primary-light)" : "transparent",
                    border: `1px solid ${selected ? "var(--color-line-strong)" : "var(--color-line-soft)"}`,
                  }}
                >
                  {p.role}
                </button>
              );
            })}
          </div>

          <div
            id="persona-panel"
            role="tabpanel"
            aria-labelledby={`persona-tab-${persona}`}
            className="glass rounded-2xl sm:rounded-3xl mt-4 p-5 sm:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={PERSONAS[persona].role}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease }}
                className="grid gap-5 sm:gap-8 md:grid-cols-[auto_1fr] items-start"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${PERSONAS[persona].accent} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${PERSONAS[persona].accent} 26%, transparent)`,
                  }}
                >
                  {(() => {
                    const PersonaIcon = PERSONAS[persona].icon;
                    return (
                      <PersonaIcon
                        size={22}
                        aria-hidden="true"
                        style={{ color: PERSONAS[persona].accent }}
                      />
                    );
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.9375rem] sm:text-lg text-(--color-text-body) leading-relaxed m-0 max-w-[58ch]">
                    {PERSONAS[persona].text}
                  </p>
                  <p className="text-xs text-(--color-text-muted) m-0 mt-4 sm:mt-5">
                    Çalıştığı ekran: {PERSONAS[persona].module}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
      {/* ══════════════════════ FAQ ══════════════════════ */}
      <FAQSection />

      {/* ══════════════════════ CTA ══════════════════════ */}
      {/* Kapanış bölümünde milimetrik kâğıt bilinçli olarak yok: ızgara
          kahraman bölümünün imzası, sayfanın ortasında tekrar edince hem
          etkisini yitiriyor hem de bölüm sınırında sert bir kenar bırakıyor. */}
      {/* Bu bölümün tek çocuğu `shell` taşımıyordu: telefonda düğmeler
          ekranın kenarına yapışıyor, metin kenar boşluksuz okunuyordu.
          Yatay pay yalnızca dar ekranda ekleniyor — masaüstünde blok zaten
          ortalanmış ve genişliği sınırlı. */}
      <section id="cta" className="section max-sm:py-10! relative overflow-hidden">
        <div className="relative max-w-3xl mx-auto text-center px-(--gutter) sm:px-0">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={stagger}
            className="flex flex-col items-center gap-5 sm:gap-8"
          >
            <motion.h2
              variants={fadeUp}
              className="text-[clamp(1.75rem,7.5vw,2.25rem)] md:text-6xl text-(--color-text-strong) leading-tight"
            >
              Klinik Süreçlerinizi
              <br />
              <span className="accent-line">Bugün Dijitalleştirin</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-[0.9375rem] sm:text-lg md:text-xl text-(--color-text-soft) max-w-lg"
            >
              Mimio ile terapi seanslarınızı daha ölçülebilir, daha eğlenceli ve
              daha verimli hale getirin.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
            >
              <Magnetic strength={18} className="w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onRegister}
                  className="btn-signature group flex items-center justify-center gap-2.5 font-semibold px-6 sm:px-10 py-4 rounded-xl text-[0.9375rem] sm:text-base w-full sm:w-auto"
                >
                  Ücretsiz Başla
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </Magnetic>
              <button
                type="button"
                onClick={onLogin}
                className="text-sm font-semibold text-(--color-text-body) hover:text-(--color-text-strong) px-6 py-4 rounded-xl border border-(--color-line) hover:border-(--color-primary)/30 transition-all w-full sm:w-auto text-center"
              >
                Giriş Yap
              </button>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 sm:gap-8 mt-1 sm:mt-4 text-[0.8125rem] sm:text-sm text-(--color-text-soft)"
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
        className="border-t border-(--color-line) px-(--gutter) sm:px-6 relative overflow-hidden"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="max-w-7xl mx-auto pt-10 sm:pt-16 pb-8">
          <div className="grid gap-8 sm:gap-10 md:grid-cols-[1.4fr_1fr_1fr] mb-8 sm:mb-14">
            {/* Marka */}
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex items-center gap-2.5">
                <BrandLockup size={30} />
              </div>
              <p className="text-sm text-(--color-text-soft) leading-relaxed">
                Ergoterapistler için oyun temelli seans yönetimi: danışan
                takibi, haftalık plan, ilerleme raporları ve kanıta dayalı
                terapi oyunları, tek platformda.
              </p>
            </div>

            {/* Keşfet — dokunma hedefleri zaten 44px'e yükseltiliyor; araya
                ayrıca 12px koyunca liste telefonda gereksiz uzuyordu. */}
            <div className="flex flex-col gap-1 sm:gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
                Keşfet
              </p>
              {NAV_LINKS.map((l) => (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  /* Dokunma payı global kuraldan (`pointer: coarse` → 44px)
                     değil, düğmenin kendisinden gelsin: dokunmatik dizüstü
                     gibi kuralın eşleşmediği cihazlarda alt bilgi bağlantıları
                     14px'lik bir metin şeridine iniyordu. */
                  className="w-fit text-sm text-(--color-text-soft) hover:text-(--color-text-strong) transition-colors text-left py-2.5 -my-1"
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
                  className="btn-signature text-sm font-semibold px-5 py-2.5 rounded-xl text-center"
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
