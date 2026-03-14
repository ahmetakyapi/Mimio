"use client";

import { useEffect, useState } from "react";
import styles from "./LandingPage.module.css";

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

const FEATURES = [
  {
    icon: "👥",
    title: "Danışan Yönetimi",
    body: "Tüm danışanlarınızı tek ekranda görün. Detay profillerini, seans geçmişlerini ve gelişimlerini kolayca takip edin.",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
  },
  {
    icon: "🎮",
    title: "Oyun Seansları",
    body: "6 farklı bilişsel oyunla danışanlarınızla seans yapın. Her oyunun skoru otomatik kaydedilir ve analiz edilir.",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    icon: "📅",
    title: "Haftalık Plan",
    body: "Danışan başına haftalık egzersiz planları oluşturun. Hangi oyunun hangi gün oynanacağını kolayca belirleyin.",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
  },
  {
    icon: "📝",
    title: "Seans Notları",
    body: "Her seans sonrasında klinik notlarınızı kaydedin. Tarih bazlı notlar danışan geçmişini zenginleştirir.",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    icon: "⚕️",
    title: "Terapi Programı",
    body: "7 farklı ergoterapi alanında aktivite önerileri, oyun eşlemeleri, haftalık plan üretici ve ilerleme takibi.",
    color: "#0891b2",
    bg: "rgba(8,145,178,0.08)",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Hesabınızı Oluşturun",
    body: "Birkaç saniyede terapist profili açın. Klinik adınız ve uzmanlık alanınızı girin.",
    color: "#2563eb",
  },
  {
    num: "02",
    title: "Danışan Ekleyin",
    body: "İsim, yaş grubu ve tedavi hedeflerini girerek danışan kartları oluşturun.",
    color: "#7c3aed",
  },
  {
    num: "03",
    title: "Oynayın & Takip Edin",
    body: "Danışanınızla birlikte oyun oynayın, notlar ekleyin ve haftalık planlar hazırlayın.",
    color: "#0891b2",
  },
];

const STATS = [
  { value: "6", label: "Benzersiz Oyun" },
  { value: "3", label: "Bilişsel Alan" },
  { value: "∞", label: "Danışan Kaydı" },
];

const NAV_LINKS = ["Özellikler", "Nasıl Çalışır?", "Oyunlar"];

export default function LandingPage({ onLogin, onRegister }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.animateVisible);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.04, rootMargin: "0px 0px -40px 0px" }
    );

    const animEl = document.querySelectorAll(`.${styles.animateEl}`);
    animEl.forEach((el) => observer.observe(el));

    // Fallback: ensure all elements become visible after 1.5s
    const fallback = setTimeout(() => {
      document.querySelectorAll(`.${styles.animateEl}`).forEach((el) => {
        el.classList.add(styles.animateVisible);
      });
    }, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.landingRoot}>
      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <span className={styles.navLogoMark}>M</span>
            <span className={styles.navLogoText}>Mimio</span>
          </div>

          <ul className={styles.navLinks}>
            {NAV_LINKS.map((link, i) => (
              <li key={i}>
                <button
                  className={styles.navLink}
                  onClick={() =>
                    scrollTo(["features", "how-it-works", "games"][i])
                  }
                >
                  {link}
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.navActions}>
            <button className={styles.navLoginBtn} onClick={onLogin}>
              Giriş Yap
            </button>
            <button className={styles.navRegisterBtn} onClick={onRegister}>
              Ücretsiz Başla
            </button>
          </div>

          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menüyü aç"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <button
          className={styles.mobileMenuClose}
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Menüyü kapat"
        >
          ✕
        </button>
        {NAV_LINKS.map((link, i) => (
          <button
            key={link}
            className={styles.mobileMenuLink}
            onClick={() => {
              setMobileMenuOpen(false);
              scrollTo(["features", "how-it-works", "games"][i]);
            }}
          >
            {link}
          </button>
        ))}
        <div className={styles.mobileMenuActions}>
          <button className={styles.navLoginBtn} onClick={() => { setMobileMenuOpen(false); onLogin(); }}>
            Giriş Yap
          </button>
          <button className={styles.navRegisterBtn} onClick={() => { setMobileMenuOpen(false); onRegister(); }}>
            Ücretsiz Başla
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBgOrb1} />
          <div className={styles.heroBgOrb2} />
          <div className={styles.heroBgOrb3} />
          <div className={styles.heroBgGrid} />
        </div>

        <div className={styles.heroInner}>
          {/* Left */}
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Ergoterapistler için özel tasarlandı
            </div>

            <h1 className={styles.heroTitle}>
              Terapi Seanslarını
              <br />
              <span className={styles.heroTitleAccent}>Oyuna Dönüştürün</span>
            </h1>

            <p className={styles.heroLead}>
              Danışan takibi, oyun seansları, haftalık planlar ve seans notları
              — hepsi tek platformda. Ergoterapistler için geliştirilmiş
              profesyonel bir araç.
            </p>

            <div className={styles.heroCtas}>
              <button className={styles.heroCtaPrimary} onClick={onRegister}>
                <span>Ücretsiz Başla</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className={styles.heroCtaSecondary}
                onClick={() => scrollTo("how-it-works")}
              >
                Nasıl Çalışır?
              </button>
            </div>

            <div className={styles.heroTrust}>
              <div className={styles.heroTrustAvatars}>
                {["A", "B", "C"].map((l) => (
                  <span key={l} className={styles.heroTrustAvatar}>
                    {l}
                  </span>
                ))}
              </div>
              <p className={styles.heroTrustText}>
                Ergoterapistler tarafından kullanılıyor
              </p>
            </div>
          </div>

          {/* Right — App Mockup */}
          <div className={styles.heroVisual}>
            <div className={styles.mockupWrap}>
              {/* Floating badges */}
              <div className={`${styles.floatBadge} ${styles.floatBadge1}`}>
                <span className={styles.floatBadgeIcon}>🎯</span>
                <div>
                  <strong>Ahmet A.</strong>
                  <span>Kart Eşle · 340 puan</span>
                </div>
              </div>
              <div className={`${styles.floatBadge} ${styles.floatBadge2}`}>
                <span className={styles.floatBadgeScore}>+18</span>
                <span className={styles.floatBadgeLabel}>yeni puan</span>
              </div>
              <div className={`${styles.floatBadge} ${styles.floatBadge3}`}>
                <span className={styles.floatBadgeIcon}>📅</span>
                <div>
                  <strong>Haftalık Plan</strong>
                  <span>5/7 tamamlandı</span>
                </div>
              </div>

              {/* Main mockup window */}
              <div className={styles.mockupWindow}>
                <div className={styles.mockupTopBar}>
                  <span className={styles.mockupDot} style={{ background: "#fc5c65" }} />
                  <span className={styles.mockupDot} style={{ background: "#fd9644" }} />
                  <span className={styles.mockupDot} style={{ background: "#26de81" }} />
                  <span className={styles.mockupTitle}>Mimio</span>
                </div>
                <div className={styles.mockupBody}>
                  {/* Sidebar */}
                  <div className={styles.mockupSidebar}>
                    <div className={styles.mockupSidebarLogo}>
                      <span className={styles.mockupSidebarLogoMark}>M</span>
                    </div>
                    {[
                      { icon: "⊞", label: "Panel" },
                      { icon: "👥", label: "Danışanlar" },
                      { icon: "🎮", label: "Oyunlar" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`${styles.mockupNavItem} ${i === 1 ? styles.mockupNavItemActive : ""}`}
                      >
                        <span className={styles.mockupNavIcon}>{item.icon}</span>
                        <span className={styles.mockupNavLabel}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className={styles.mockupMain}>
                    <div className={styles.mockupGreeting}>
                      <div className={styles.mockupGreetingTitle} />
                      <div className={styles.mockupGreetingDate} />
                    </div>

                    <div className={styles.mockupStatRow}>
                      {["#e0f2fe", "#f0fdf4", "#fef3c7"].map((bg, i) => (
                        <div
                          key={i}
                          className={styles.mockupStatCard}
                          style={{ background: bg }}
                        >
                          <div className={styles.mockupStatNum} />
                          <div className={styles.mockupStatLabel} />
                        </div>
                      ))}
                    </div>

                    <div className={styles.mockupClientRow}>
                      {[0, 1].map((i) => (
                        <div key={i} className={styles.mockupClientCard}>
                          <div className={styles.mockupClientAvatar} />
                          <div className={styles.mockupClientInfo}>
                            <div className={styles.mockupClientName} />
                            <div className={styles.mockupClientTag} />
                          </div>
                          <div className={styles.mockupClientBtn} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollWheel} />
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className={styles.statsSection}>
        <div className={styles.statsInner}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <strong className={styles.statValue}>{s.value}</strong>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.animateEl}`}>
            <span className={styles.sectionKicker}>Özellikler</span>
            <h2 className={styles.sectionTitle}>
              Terapistlerin ihtiyacı olan
              <br />
              her şey tek yerde
            </h2>
            <p className={styles.sectionLead}>
              Mimio, kliniğinizin günlük iş akışını dijitalleştirmek için
              tasarlanmış eksiksiz bir platform sunar.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`${styles.featureCard} ${styles.animateEl}`}
                style={{ transitionDelay: `${i * 80}ms`, "--card-accent": f.color } as React.CSSProperties}
              >
                <div
                  className={styles.featureIconWrap}
                  style={{ background: f.bg }}
                >
                  <span className={styles.featureIcon}>{f.icon}</span>
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.howBg} />
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.animateEl}`}>
            <span className={styles.sectionKicker}>Nasıl Çalışır?</span>
            <h2 className={styles.sectionTitle}>
              3 adımda
              <br />
              kullanmaya başlayın
            </h2>
          </div>

          <div className={styles.stepsRow}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`${styles.stepCard} ${styles.animateEl}`}
                style={{ transitionDelay: `${i * 100}ms`, "--card-accent": step.color } as React.CSSProperties}
              >
                <div className={styles.stepNum}>{step.num}</div>
                {i < STEPS.length - 1 && (
                  <div className={styles.stepConnector} />
                )}
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Games preview ── */}
      <section id="games" className={styles.gamesSection}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.animateEl}`}>
            <span className={styles.sectionKicker}>Oyunlar</span>
            <h2 className={styles.sectionTitle}>
              6 farklı bilişsel oyun
            </h2>
            <p className={styles.sectionLead}>
              Hafıza, motor beceri ve görsel algı alanlarını kapsayan oyunlar
              ile danışanlarınızın gelişimini destekleyin.
            </p>
          </div>

          <div className={`${styles.gamesGrid} ${styles.animateEl}`}>
            {[
              { key: "memory", label: "Sıra Hafızası", icon: "◎", area: "Hafıza", color: "#2563eb" },
              { key: "pairs", label: "Kart Eşle", icon: "⊞", area: "Hafıza", color: "#2563eb" },
              { key: "pulse", label: "Mavi Nabız", icon: "◉", area: "Motor", color: "#7c3aed" },
              { key: "route", label: "Komut Rotası", icon: "✦", area: "Motor", color: "#7c3aed" },
              { key: "difference", label: "Fark Avcısı", icon: "◌", area: "Görsel", color: "#0891b2" },
              { key: "scan", label: "Hedef Tarama", icon: "⊡", area: "Görsel", color: "#0891b2" },
            ].map((game, i) => (
              <div
                key={game.key}
                className={styles.gameChip}
                style={{ transitionDelay: `${i * 60}ms`, "--card-accent": game.color } as React.CSSProperties}
              >
                <span
                  className={styles.gameChipIcon}
                  style={{
                    color: game.color,
                    background: `${game.color}14`,
                  }}
                >
                  {game.icon}
                </span>
                <div className={styles.gameChipInfo}>
                  <strong className={styles.gameChipName}>{game.label}</strong>
                  <span className={styles.gameChipArea}>{game.area} Alanı</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBg}>
          <div className={styles.ctaBgOrb1} />
          <div className={styles.ctaBgOrb2} />
        </div>
        <div className={`${styles.ctaInner} ${styles.animateEl}`}>
          <h2 className={styles.ctaTitle}>
            Danışanlarınızın gelişimini
            <br />
            bugün takip etmeye başlayın
          </h2>
          <p className={styles.ctaLead}>
            Ücretsiz hesap oluşturun, dakikalar içinde ilk danışanınızı ekleyin.
          </p>
          <div className={styles.ctaActions}>
            <button className={styles.ctaBtn} onClick={onRegister}>
              Ücretsiz Hesap Oluştur
            </button>
            <button className={styles.ctaBtnSecondary} onClick={onLogin}>
              Giriş Yap
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <span className={styles.navLogoMark} style={{ width: 28, height: 28, fontSize: "0.82rem" }}>M</span>
            <span className={styles.footerLogoText}>Mimio</span>
          </div>
          <p className={styles.footerCopy}>
            © 2026 Mimio · Ergoterapi için tasarlandı
          </p>
        </div>
      </footer>
    </div>
  );
}
