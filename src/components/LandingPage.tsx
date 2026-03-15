"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  Hand,
  Eye,
  CheckCircle2,
  LayoutDashboard,
  Sun,
  Moon,
  Target,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface Props {
  readonly onLogin: () => void;
  readonly onRegister: () => void;
}

const FEATURES = [
  {
    icon: Users,
    title: "Danışan Yönetimi",
    body: "Tüm hastalarınızın bilgilerini, seans geçmişlerini ve kişisel notlarınızı güvenle saklayın.",
    color: "#818cf8",
    bg: "rgba(99,102,241,0.10)",
    border: "rgba(99,102,241,0.18)",
  },
  {
    icon: Gamepad2,
    title: "İnteraktif Oyun Seansları",
    body: "Özel tasarlanmış bilişsel ve motor beceri oyunlarıyla çocukların seanslara katılımını artırın.",
    color: "#c084fc",
    bg: "rgba(168,85,247,0.10)",
    border: "rgba(168,85,247,0.18)",
  },
  {
    icon: CalendarDays,
    title: "Haftalık Plan & Takip",
    body: "Her danışan için özel haftalık terapi programları oluşturun ve ilerlemeyi gözlemleyin.",
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.10)",
    border: "rgba(6,182,212,0.18)",
  },
  {
    icon: FileText,
    title: "Detaylı Seans Notları",
    body: "Oyunlardan sonra veya bağımsız olarak her seansın detaylı gözlemlerini hızlıca kaydedin.",
    color: "#6ee7b7",
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.18)",
  },
  {
    icon: TrendingUp,
    title: "İlerleme Analizi",
    body: "Oyunlardan elde edilen verilerle danışan gelişimini grafikler üzerinden somut olarak görün.",
    color: "#fcd34d",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.18)",
  },
  {
    icon: ShieldCheck,
    title: "Güvenli ve Gizli",
    body: "Klinik standartlara uygun veri güvenliği ile danışan bilgileriniz her zaman koruma altında.",
    color: "#f9a8d4",
    bg: "rgba(236,72,153,0.10)",
    border: "rgba(236,72,153,0.18)",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Hesabınızı Oluşturun",
    body: "Klinik veya bireysel profilinizi saniyeler içinde oluşturun ve Mimio paneline erişin.",
  },
  {
    num: "2",
    title: "Danışan Ekleyin",
    body: "Hizmet verdiğiniz çocukların yaş, destek seviyesi ve terapi odaklarını sisteme girin.",
  },
  {
    num: "3",
    title: "Oynayın & Takip Edin",
    body: "Seanslarda oyunları açın, sonuçları otomatik kaydedin ve gelişimi raporlayın.",
  },
];

const STATS = [
  { value: "6+", label: "Benzersiz Terapi Oyunu" },
  { value: "3", label: "Temel Bilişsel Alan" },
  { value: "∞", label: "Sınırsız Danışan Kaydı" },
];

const GAMES = [
  {
    key: "memory",
    label: "Sıra Hafızası",
    area: "Hafıza",
    icon: Brain,
    desc: "Sırayla yanan nesneleri hatırla.",
    color: "#6366f1",
  },
  {
    key: "pulse",
    label: "Mavi Nabız",
    area: "Motor Beceri",
    icon: Hand,
    desc: "Hedeflere dokunarak motor beceriyi geliştir.",
    color: "#8b5cf6",
  },
  {
    key: "scan",
    label: "Hedef Tarama",
    area: "Görsel Algı",
    icon: Eye,
    desc: "Görsel tarama ve dikkat becerilerini destekle.",
    color: "#06b6d4",
  },
];

const NAV_LINKS = [
  { label: "Özellikler", id: "features" },
  { label: "Nasıl Çalışır?", id: "how-it-works" },
  { label: "Oyunlar", id: "games" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function LandingPage({ onLogin, onRegister }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-(--color-page-bg) font-(--font-sans)">

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b border-(--color-line)" style={{ background: "var(--color-chrome-nav)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-(--color-primary) flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-bold text-(--color-text-strong) text-lg">Mimio</span>
          </div>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-sm text-(--color-text-soft) hover:text-(--color-text-strong) font-medium transition-colors"
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-(--color-text-muted) hover:text-(--color-primary) hover:bg-(--color-primary-light) bg-transparent border-none cursor-pointer transition-colors"
              aria-label="Tema değiştir"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={onLogin}
              className="text-sm font-medium text-(--color-text-body) hover:text-(--color-text-strong) transition-colors px-3 py-2"
            >
              Giriş Yap
            </button>
            <button
              onClick={onRegister}
              className="text-sm font-semibold bg-(--color-primary) text-white px-5 py-2.5 rounded-xl hover:bg-(--color-primary-hover) transition-colors"
            >
              Hemen Başla
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-(--color-text-muted) hover:text-(--color-primary) bg-transparent border-none cursor-pointer"
              aria-label="Tema değiştir"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              className="p-2 text-(--color-text-body)"
              onClick={() => setMenuOpen(true)}
              aria-label="Menüyü aç"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col p-6 gap-4" style={{ background: "var(--color-page-bg)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-(--color-primary) flex items-center justify-center text-white font-bold text-sm">M</div>
              <span className="font-bold text-(--color-text-strong) text-lg">Mimio</span>
            </div>
            <button onClick={() => setMenuOpen(false)} className="p-2 text-(--color-text-soft)">
              <X size={22} />
            </button>
          </div>
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="text-left text-lg font-medium text-(--color-text-body) py-3 border-b border-(--color-line)"
            >
              {l.label}
            </button>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            <button onClick={() => { setMenuOpen(false); onLogin(); }} className="w-full py-3 text-center font-semibold border border-(--color-line) rounded-xl text-(--color-text-body)">
              Giriş Yap
            </button>
            <button onClick={() => { setMenuOpen(false); onRegister(); }} className="w-full py-3 text-center font-semibold bg-(--color-primary) text-white rounded-xl">
              Hemen Başla
            </button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Subtle bg gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.1),transparent)]" />

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-(--color-primary) bg-(--color-primary-light) px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-primary) animate-pulse" />
                <span>Ergoterapistler için Yeni Nesil Platform</span>
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-extrabold text-(--color-text-strong) leading-[1.1] tracking-tight">
              Terapi{" "}
              <br />
              Seanslarını
              <br />
              <span className="text-(--color-primary)">Oyuna</span>
              <br />
              <span className="text-(--color-primary)">Dönüştürün</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-(--color-text-soft) leading-relaxed max-w-md">
              Çocukların bilişsel ve motor becerilerini geliştirirken eğlenmelerini sağlayın. İlerlemeyi dijital olarak takip edin, seansları kişiselleştirin ve ailelerle rapor paylaşın.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap">
              <button
                onClick={onRegister}
                className="flex items-center gap-2 bg-(--color-primary) text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-(--color-primary-hover) transition-colors shadow-(--shadow-primary) text-sm"
              >
                Danışanlarını Takip Et
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => scrollTo("games")}
                className="flex items-center gap-2 bg-(--color-surface) text-(--color-text-body) font-semibold px-7 py-3.5 rounded-2xl border border-(--color-line) hover:border-(--color-primary) transition-colors text-sm"
              >
                Oyunları İncele
              </button>
            </motion.div>
          </motion.div>

          {/* Right — app mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center px-6 md:px-0"
          >
            {/* Floating: Ahmet A. achievement — top right */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-5 -right-2 md:-right-8 z-10 bg-(--color-surface-strong) backdrop-blur-md rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-(--color-line)"
            >
              <Target size={20} className="text-(--color-primary) shrink-0" />
              <div>
                <p className="text-sm font-bold text-(--color-text-strong) m-0 leading-tight">Ahmet A.</p>
                <p className="text-xs text-(--color-text-soft) m-0">Kart Eşle · 340 puan</p>
              </div>
            </motion.div>

            {/* Floating: +18 new points — bottom right */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-2 md:-right-8 bottom-14 z-10 bg-(--color-surface-strong) backdrop-blur-md rounded-2xl shadow-lg px-5 py-4 border border-(--color-line) text-center"
            >
              <p className="text-3xl font-extrabold text-(--color-primary) m-0 leading-none">+18</p>
              <p className="text-xs text-(--color-text-soft) mt-1 m-0">yeni puan</p>
            </motion.div>

            {/* Floating: Haftalık Plan — bottom left */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute -left-2 md:-left-8 -bottom-4 z-10 bg-(--color-surface-strong) backdrop-blur-md rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-(--color-line)"
            >
              <span className="text-2xl leading-none">📅</span>
              <div>
                <p className="text-sm font-bold text-(--color-text-strong) m-0 leading-tight">Haftalık Plan</p>
                <p className="text-xs text-(--color-text-soft) m-0">5/7 tamamlandı</p>
              </div>
            </motion.div>

            {/* App window */}
            <div className="w-full max-w-md bg-(--color-surface-strong) rounded-2xl shadow-xl border border-(--color-line) overflow-hidden" style={{ backdropFilter: "blur(16px)" }}>
              {/* macOS window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-line)" style={{ background: "var(--color-surface)" }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                </div>
                <span className="text-sm font-semibold text-(--color-text-strong) ml-2">Mimio</span>
              </div>

              {/* App layout */}
              <div className="flex" style={{ height: 280 }}>
                {/* Narrow sidebar */}
                <div className="w-[60px] border-r border-(--color-line) flex flex-col items-center py-3 gap-1 shrink-0" style={{ background: "var(--color-sidebar)" }}>
                  <div className="w-9 h-9 rounded-xl bg-(--color-primary) flex items-center justify-center text-white font-bold text-sm mb-2">M</div>
                  {[
                    { Icon: LayoutDashboard, label: "Panel", active: false },
                    { Icon: Users, label: "Danışanlar", active: true },
                    { Icon: Gamepad2, label: "Oyunlar", active: false },
                  ].map(({ Icon, label, active }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5 w-full px-1.5">
                      <div className={`w-full flex items-center justify-center py-2 rounded-xl ${active ? "bg-(--color-primary)/10 text-(--color-primary)" : "text-(--color-text-muted)"}`}>
                        <Icon size={16} />
                      </div>
                      <span className={`text-[8px] font-medium leading-tight text-center ${active ? "text-(--color-primary) font-semibold" : "text-(--color-text-muted)"}`}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Content area */}
                <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                  {/* Header placeholders */}
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 rounded-full w-3/4 bg-(--color-skeleton-hi)" />
                    <div className="h-2.5 rounded-full w-1/2 bg-(--color-skeleton-lo)" />
                  </div>
                  {/* 3 stat cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[["blue", "rgba(37,99,235,0.12)", "rgba(37,99,235,0.3)"], ["emerald", "rgba(16,185,129,0.12)", "rgba(16,185,129,0.3)"], ["amber", "rgba(245,158,11,0.12)", "rgba(245,158,11,0.3)"]].map(([key, bg, bar]) => (
                      <div key={key} className="rounded-xl p-2.5" style={{ background: bg }}>
                        <div className="h-2 rounded-full w-2/3 mb-1.5" style={{ background: bar }} />
                        <div className="h-1.5 rounded-full w-1/2 opacity-60" style={{ background: bar }} />
                      </div>
                    ))}
                  </div>
                  {/* Client rows */}
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-2.5 border border-(--color-line) rounded-xl px-3 py-2" style={{ background: "var(--color-surface)" }}>
                      <div className="w-7 h-7 rounded-lg bg-(--color-primary) shrink-0" />
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="h-2.5 rounded-full w-3/4 bg-(--color-skeleton-hi)" />
                        <div className="h-2 rounded-full w-1/2 bg-(--color-skeleton-lo)" />
                      </div>
                      <div className="w-10 h-6 bg-(--color-primary)/70 rounded-lg shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-t border-b border-(--color-line) py-10" style={{ background: "var(--color-surface)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 divide-x divide-(--color-line)">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 px-4">
                <span className="text-3xl font-extrabold text-(--color-primary)">{s.value}</span>
                <span className="text-sm text-(--color-text-soft) text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest text-(--color-primary) uppercase mb-3">
              Özellikler
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-(--color-text-strong) mb-4">
              İhtiyacınız Olan Her Şey Tek Yerde
            </motion.h2>
            <motion.p variants={fadeUp} className="text-(--color-text-soft) max-w-xl mx-auto">
              Mimio, ergoterapistlerin klinik süreçlerini kolaylaştırmak için tasarlandı.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-5"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className="rounded-3xl p-6 shadow-(--shadow-card) hover:-translate-y-1 transition-all duration-200 hover:shadow-(--shadow-elevated) group"
                  style={{ background: "var(--color-surface-strong)", border: `1px solid ${f.border}` }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: f.bg }}
                  >
                    <Icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-(--color-text-strong) mb-2">{f.title}</h3>
                  <p className="text-sm text-(--color-text-soft) leading-relaxed">{f.body}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-(--color-text-strong) mb-3">
              Nasıl Çalışır?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-(--color-text-soft)">
              Sadece 3 adımda dijital terapi süreçlerinize başlayın.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8 relative"
          >
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-(--color-primary) to-(--color-accent-teal)" />

            {STEPS.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className="flex flex-col items-center text-center gap-4">
                <div className="relative z-10 w-20 h-20 rounded-full bg-(--color-surface-strong) border-2 border-(--color-line) flex items-center justify-center text-2xl font-extrabold text-(--color-primary) shadow-(--shadow-card)">
                  {step.num}
                  {i < STEPS.length - 1 && (
                    <div className="md:hidden absolute left-full top-1/2 w-8 h-px bg-(--color-line) -translate-y-1/2" />
                  )}
                </div>
                <h3 className="font-bold text-(--color-text-strong)">{step.title}</h3>
                <p className="text-sm text-(--color-text-soft) leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Games ── */}
      <section id="games" className="py-24 px-6 section-games">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mb-12"
          >
            <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest text-(--color-primary) uppercase mb-3">
              Terapötik İçerik
            </motion.p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-(--color-games-text) max-w-md leading-tight">
                Her oyun spesifik bir gelişim alanını hedefler ve çocukların ilgisini çekecek şekilde tasarlanmıştır.
              </motion.h2>
              <motion.button
                variants={fadeUp}
                onClick={onLogin}
                className="text-sm font-semibold text-(--color-games-text) bg-(--color-games-badge-bg) hover:bg-(--color-games-card-hover) border border-(--color-games-badge-border) px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                Tüm Kataloğu Gör
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-5"
          >
            {GAMES.map((game) => {
              const Icon = game.icon;
              return (
                <motion.div
                  key={game.key}
                  variants={fadeUp}
                  className="backdrop-blur rounded-3xl overflow-hidden border transition-colors group cursor-pointer bg-(--color-games-card-bg) border-(--color-games-card-border) hover:bg-(--color-games-card-hover)"
                  onClick={onLogin}
                >
                  <div className="aspect-[4/3] game-tile-preview flex items-center justify-center relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `radial-gradient(circle at 60% 40%, ${game.color}, transparent 60%)`,
                      }}
                    />
                    <Icon size={48} color={game.color} className="opacity-80" />
                    <span className="absolute bottom-3 left-3 text-xs font-semibold text-(--color-games-text) bg-(--color-games-badge-bg) backdrop-blur px-2.5 py-1 rounded-full border border-(--color-games-badge-border)">
                      {game.area}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-(--color-games-text) mb-1">{game.label}</h3>
                    <p className="text-sm text-(--color-games-text-soft)">{game.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 relative overflow-hidden bg-(--color-page-bg)">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(99,102,241,0.08),transparent)]" />
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="flex flex-col items-center gap-6"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-(--color-text-strong) leading-tight">
              Klinik süreçlerinizi bugün dijitalleştirin.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-(--color-text-soft)">
              Mimio ile terapi seanslarınızı daha ölçülebilir, daha eğlenceli ve daha verimli hale getirin.
            </motion.p>
            <motion.button
              variants={fadeUp}
              onClick={onRegister}
              className="flex items-center gap-2 bg-(--color-primary) text-white font-semibold px-10 py-4 rounded-full hover:bg-(--color-primary-hover) transition-colors shadow-(--shadow-primary) text-base"
            >
              Ücretsiz Hesabını Oluştur
              <ArrowRight size={18} />
            </motion.button>

            <motion.div variants={fadeUp} className="flex items-center gap-6 text-sm text-(--color-text-soft)">
              {["Ücretsiz başla", "Kurulum yok", "Hemen kullan"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-(--color-accent-green)" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-(--color-line) py-10 px-6" style={{ background: "var(--color-surface)" }}>
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-(--color-primary) flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-(--color-text-strong) text-lg">Mimio</span>
          </div>
          <p className="text-sm text-(--color-text-muted)">
            © 2025 Mimio Ergoterapi Platformu. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
