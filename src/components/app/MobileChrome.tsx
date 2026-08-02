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

import type { ReactNode } from "react";
import { Home, Users, CalendarDays, Gamepad2, MoreHorizontal } from "lucide-react";
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
      <div className="flex gap-0.5" style={{ padding: "9px 12px 8px" }}>
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
        paddingTop: "env(safe-area-inset-top, 0px)",
        padding: "env(safe-area-inset-top, 0px) 20px 0",
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
  return (
    <div className="fixed inset-0 z-40 lg:hidden flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Daha">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 cursor-default border-none"
        style={{ background: "rgba(5,11,22,0.45)", backdropFilter: "blur(3px)" }}
      />
      <div
        className="relative"
        style={{
          margin: 12,
          marginBottom: "calc(84px + env(safe-area-inset-bottom, 0px))",
          padding: 8,
          borderRadius: 22,
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-line-strong)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
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
