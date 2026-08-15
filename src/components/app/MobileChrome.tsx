"use client";

/*
 * Mobil kabuk — tasarım dokümanı 2a–2v'nin ortak parçaları.
 *
 * Masaüstündeki sekiz bölüm telefonda beşe iniyor: Bugün · Danışan · Plan ·
 * Oyunlar · Daha. Bu bir kısaltma değil, farklı bir kurgu — telefonda
 * terapist seans *sırasında* bakıyor, masaüstünde seans *öncesi/sonrası*
 * planlıyor. Rapor, notlar, aktivite kitaplığı ve ayarlar "Daha"nın altına
 * iniyor çünkü hiçbiri seans anında gereken şeyler değil.
 *
 * Üst çubuk da sadeleşiyor: arama ve tema anahtarı gidiyor, yerine ekran
 * adı ve tek eylem kalıyor. Küçük ekranda krom, içeriğin payına giriyor.
 */

import { useEffect, useId, type ReactNode } from "react";
import { Home, Users, CalendarDays, Gamepad2, MoreHorizontal, X } from "lucide-react";
import type { AppView } from "@/lib/platform-data";

const TABS: ReadonlyArray<{ view: AppView; label: string; icon: typeof Home; match?: readonly AppView[] }> = [
  { view: "dashboard", label: "Bugün", icon: Home },
  { view: "clients", label: "Danışan", icon: Users, match: ["clients", "client-detail"] },
  { view: "weekly-plan", label: "Plan", icon: CalendarDays },
  { view: "games", label: "Oyunlar", icon: Gamepad2 },
];

/** "Daha" sekmesinin altındaki bölümler — seans anında gerekmeyenler. */
export const MORE_VIEWS: ReadonlyArray<{ view: AppView; label: string }> = [
  { view: "notes", label: "Seans Notları" },
  { view: "reports", label: "İlerleme Raporu" },
  { view: "therapy-program", label: "Aktivite Kitaplığı" },
  { view: "settings", label: "Ayarlar" },
];

const MORE_SET = new Set<AppView>(MORE_VIEWS.map((m) => m.view));

export function MobileTabBar({
  activeView,
  onNavigate,
  onMore,
}: {
  readonly activeView: AppView;
  readonly onNavigate: (v: AppView) => void;
  readonly onMore: () => void;
}) {
  const moreActive = MORE_SET.has(activeView);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
      role="navigation"
      aria-label="Mobil gezinme"
      style={{
        background: "var(--color-chrome-nav)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--color-line)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Yatay çevrilen çentikli telefonda 12px'lik yan boşluk çentiğin
          altında kalıyordu: ilk ve son sekme kısmen erişilemiyordu. Yükseklik
          (9+50+8 = 67px, globals.css'teki `--mobile-tabbar`) korunuyor. */}
      <div className="flex gap-0.5" style={{ paddingTop: 9, paddingBottom: 8, paddingLeft: "max(12px, env(safe-area-inset-left))", paddingRight: "max(12px, env(safe-area-inset-right))" }}>
        {TABS.map(({ view, label, icon: Icon, match }) => {
          const on = match ? match.includes(activeView) : activeView === view;
          return (
            <button
              key={view}
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => onNavigate(view)}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer border-none transition-colors"
              style={{
                padding: "5px 0",
                borderRadius: 12,
                background: on ? "var(--gradient-signature-soft)" : "transparent",
              }}
            >
              <Icon size={20} strokeWidth={1.9} style={{ color: on ? "var(--color-primary)" : "var(--color-text-muted)" }} />
              <span
                className="text-[9.5px]"
                style={{ fontWeight: on ? 700 : 500, color: on ? "var(--color-primary-ink)" : "var(--color-text-muted)" }}
              >
                {label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onMore}
          aria-current={moreActive ? "page" : undefined}
          className="flex-1 flex flex-col items-center gap-1 cursor-pointer border-none transition-colors"
          style={{ padding: "5px 0", borderRadius: 12, background: moreActive ? "var(--gradient-signature-soft)" : "transparent" }}
        >
          <MoreHorizontal size={20} strokeWidth={1.9} style={{ color: moreActive ? "var(--color-primary)" : "var(--color-text-muted)" }} />
          <span
            className="text-[9.5px]"
            style={{ fontWeight: moreActive ? 700 : 500, color: moreActive ? "var(--color-primary-ink)" : "var(--color-text-muted)" }}
          >
            Daha
          </span>
        </button>
      </div>
    </nav>
  );
}

/**
 * Mobil üst çubuk. Ekran adı + tek eylem; arama ve tema masaüstünde kalıyor.
 */
export function MobileTopBar({
  title,
  action,
}: {
  readonly title: string;
  readonly action?: ReactNode;
}) {
  return (
    <header
      className="flex lg:hidden items-center gap-3 fixed top-0 left-0 right-0 z-30"
      style={{
        height: "calc(52px + env(safe-area-inset-top, 0px))",
        /* Önce `paddingTop`, hemen ardından onu ezen `padding` kısayolu
           vardı; kısayol kazandığı için üstteki satır ölü koddu. Tek
           kaynağa indi, yan boşluklar da güvenli alanı hesaba katıyor. */
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: 0,
        paddingLeft: "max(20px, env(safe-area-inset-left))",
        paddingRight: "max(20px, env(safe-area-inset-right))",
        background: "var(--color-chrome-nav)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <span className="font-display flex-1 min-w-0 truncate text-[15px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
        {title}
      </span>
      {action}
    </header>
  );
}

/** "Daha" sayfası — dört bölümün listesi. */
export function MobileMoreSheet({
  onNavigate,
  onClose,
  activeView,
}: {
  readonly onNavigate: (v: AppView) => void;
  readonly onClose: () => void;
  readonly activeView: AppView;
}) {
  const titleId = useId();

  /*
   * Kaydırma kilidi. Sayfa açıkken arkadaki ekran kayabiliyordu: parmak
   * kartın dışına taştığında alttaki liste sürükleniyor, sayfa kapanınca
   * terapist bıraktığı yerde olmuyordu. Mobilde asıl kaydırıcı `.app-scroll`
   * (bkz. globals.css) — `overflow: hidden` elementin `scrollTop`'unu
   * koruduğu için kapanışta sıçrama olmaz; `position: fixed` numarasının
   * aksine konum kaybolmaz.
   */
  useEffect(() => {
    // Kart `lg:hidden` ile gizlenir ama takılı kalır: sayfa açıkken pencere
    // masaüstü genişliğine büyürse görünmeyen bir kart sayfayı kilitlerdi.
    // Kilit bu yüzden kırılma noktasına bağlı.
    const mq = window.matchMedia("(max-width: 1023px)");
    const scroller = document.querySelector<HTMLElement>(".app-scroll");
    const prevBody = document.body.style.overflow;
    const prevScroller = scroller?.style.overflow ?? "";
    const apply = () => {
      document.body.style.overflow = mq.matches ? "hidden" : prevBody;
      if (scroller) scroller.style.overflow = mq.matches ? "hidden" : prevScroller;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.body.style.overflow = prevBody;
      if (scroller) scroller.style.overflow = prevScroller;
    };
  }, []);

  // Klavye takılı tabletlerde Esc; dokunmatikte zaten zemin kapatıyor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 lg:hidden flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ overscrollBehavior: "contain" }}
    >
      {/* Zemin artık erişilebilirlik ağacında görünmüyor: görünür "Kapat"
          düğmesi eklenince aynı adı taşıyan iki hedef oluşuyordu. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 cursor-default border-none"
        style={{ background: "rgba(5,11,22,0.45)", backdropFilter: "blur(3px)" }}
      />
      {/*
        Kart, ekranın uzun kenarına göre sınırlanıyor: 568px yüksekliğindeki
        küçük telefonlarda ya da yatay çevrildiğinde dört satır + başlık alt
        sekme çubuğunun arkasına giriyordu. Yan boşluklar güvenli alanı,
        alt boşluk ise sekme çubuğunu (67px) + payı hesaba katıyor.
      */}
      <div
        className="relative"
        style={{
          marginTop: 12,
          marginLeft: "max(12px, env(safe-area-inset-left))",
          marginRight: "max(12px, env(safe-area-inset-right))",
          marginBottom: "calc(84px + env(safe-area-inset-bottom, 0px))",
          padding: 8,
          borderRadius: 22,
          maxHeight: "calc(100dvh - 108px - env(safe-area-inset-bottom, 0px))",
          overflowY: "auto",
          overscrollBehavior: "contain",
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-line-strong)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Sayfanın başlığı yoktu: dört satır havada duran isimsiz bir kutu
            gibi açılıyordu, ekran okuyucuda da yalnızca liste vardı. */}
        <div className="flex items-center justify-between gap-3" style={{ padding: "6px 6px 8px 10px" }}>
          <h2
            id={titleId}
            className="font-display m-0 text-[15px] font-bold tracking-[-0.02em] text-(--color-text-strong)"
          >
            Daha
          </h2>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="grid place-items-center shrink-0 cursor-pointer border-none bg-transparent text-(--color-text-soft)"
            style={{ width: 32, height: 32, borderRadius: 10 }}
          >
            <X size={17} strokeWidth={2.2} />
          </button>
        </div>

        {MORE_VIEWS.map((m) => {
          const on = activeView === m.view;
          return (
            <button
              key={m.view}
              type="button"
              onClick={() => { onNavigate(m.view); onClose(); }}
              className="w-full text-left cursor-pointer border-none text-[14px] font-semibold transition-colors"
              style={{
                padding: "14px 16px",
                borderRadius: 15,
                background: on ? "var(--gradient-signature-soft)" : "transparent",
                color: on ? "var(--color-primary-ink)" : "var(--color-text-body)",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
