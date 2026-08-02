"use client";

/*
 * Uygulama kabuğu — sidebar (238px) + üst çubuk (62px).
 *
 * Deniz'de kabuk her ekranda birebir aynı: terapist seans sırasında ekranlar
 * arasında geçerken sabit kalan tek şey bu. Bu yüzden burada tek kez kurulur,
 * ekranlar yalnızca içerik alanını doldurur.
 */

import { useEffect, useRef, type ReactNode } from "react";
import {
  Home,
  Users,
  CalendarDays,
  Gamepad2,
  BarChart3,
  BookOpen,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import type { AppView } from "@/lib/platform-data";
import { BlockMark } from "@/components/brand/BlockMark";
import { MeterBar } from "./primitives";

/*
 * Gezinme, tasarım sistemindeki yedi bölümün sırası ve etiketleriyle birebir.
 * Sıra rastgele değil: zaman ekseninde daralıyor — bugün → bu hafta → arşiv.
 */
const NAV: ReadonlyArray<{
  view: AppView;
  label: string;
  icon: typeof Home;
  match?: readonly AppView[];
  badge?: "clients" | "games";
}> = [
  { view: "dashboard", label: "Bugün", icon: Home },
  { view: "clients", label: "Danışanlar", icon: Users, match: ["clients", "client-detail"], badge: "clients" },
  { view: "weekly-plan", label: "Haftalık Plan", icon: CalendarDays },
  { view: "games", label: "Oyunlar", icon: Gamepad2, badge: "games" },
  { view: "reports", label: "Raporlar", icon: BarChart3 },
  { view: "therapy-program", label: "Aktivite Kitaplığı", icon: BookOpen },
  { view: "settings", label: "Ayarlar", icon: Settings },
];

export function Sidebar({
  activeView,
  onNavigate,
  clinicName,
  clientCount,
  gameCount,
  weekDone,
  weekCapacity,
}: {
  readonly activeView: AppView;
  readonly onNavigate: (v: AppView) => void;
  readonly clinicName: string;
  readonly clientCount: number;
  readonly gameCount: number;
  readonly weekDone: number;
  readonly weekCapacity: number;
}) {
  const pct = weekCapacity > 0 ? (weekDone / weekCapacity) * 100 : 0;

  return (
    <nav
      className="hidden lg:flex flex-col shrink-0 relative"
      style={{
        width: 238,
        padding: "22px 16px",
        background: "var(--color-sidebar)",
        borderRight: "1px solid var(--color-line)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      aria-label="Ana gezinme"
    >
      {/* Marka */}
      <div className="flex items-center gap-[11px]" style={{ padding: "4px 8px 22px" }}>
        <span
          className="tile-signature grid place-items-center shrink-0"
          style={{ width: 32, height: 32, borderRadius: 10, boxShadow: "var(--shadow-primary)" }}
        >
          <BlockMark size={17} color="#ffffff" />
        </span>
        <span className="min-w-0">
          <span className="font-display block font-bold text-[14.5px] tracking-[-0.02em] text-(--color-text-strong) leading-tight">
            Mimio
          </span>
          <span className="numeral block text-[9.5px] text-(--color-text-soft) truncate leading-tight">{clinicName}</span>
        </span>
      </div>

      {/* Bölümler */}
      <div className="flex flex-col gap-[3px] flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ view, label, icon: Icon, match, badge }) => {
          const on = match ? match.includes(activeView) : activeView === view;
          const count = badge === "clients" ? clientCount : badge === "games" ? gameCount : 0;
          return (
            <button
              key={view}
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => onNavigate(view)}
              className={`flex items-center gap-[11px] rounded-xl border cursor-pointer text-left transition-colors ${
                on
                  ? "nav-active"
                  : "border-transparent bg-transparent text-(--color-text-body) hover:bg-(--color-primary)/6"
              }`}
              style={{ padding: "11px 12px" }}
            >
              <Icon size={17} strokeWidth={1.9} className="shrink-0" style={{ color: on ? "var(--color-primary)" : "var(--color-text-soft)" }} />
              <span className={`text-[13px] flex-1 ${on ? "font-semibold" : "font-medium"}`}>{label}</span>
              {badge && count > 0 && (
                <span
                  className="numeral text-[10px] font-semibold shrink-0"
                  style={{
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: on ? "rgba(255,255,255,0.18)" : "var(--color-primary-light)",
                    color: on ? "inherit" : "var(--color-text-soft)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/*
        "Bu Hafta" — sidebar'ın dip taşı. Terapistin gün içinde en sık sorduğu
        soru bu: kapasitenin neresindeyim? Sayı seans, çubuk doluluk.
      */}
      <button
        type="button"
        onClick={() => onNavigate("weekly-plan")}
        className="mt-auto text-left cursor-pointer transition-transform hover:-translate-y-px"
        style={{
          padding: 14,
          borderRadius: 16,
          background: "var(--gradient-signature-soft)",
          border: "1px solid var(--color-line-strong)",
        }}
      >
        <span className="numeral block text-[9.5px] font-semibold uppercase tracking-[0.12em] text-(--color-primary-ink) mb-2">
          Bu Hafta
        </span>
        <span className="figure block text-[22px] text-(--color-text-strong) leading-none">
          {weekDone}
          <span className="font-sans font-medium text-[12px] text-(--color-text-soft) tracking-normal"> / {weekCapacity} seans</span>
        </span>
        <span className="block mt-[9px]">
          <MeterBar pct={pct} />
        </span>
      </button>
    </nav>
  );
}

export function TopBar({
  search,
  onSearchChange,
  onSearchSubmit,
  theme,
  onThemeChange,
  notificationCount,
  onNotifications,
  therapistName,
  therapistRole,
  accountOpen,
  onAccountToggle,
  accountMenu,
}: {
  readonly search: string;
  readonly onSearchChange: (v: string) => void;
  readonly onSearchSubmit: () => void;
  readonly theme: string;
  readonly onThemeChange: (t: "light" | "dark") => void;
  readonly notificationCount: number;
  readonly onNotifications: () => void;
  readonly therapistName: string;
  readonly therapistRole: string;
  readonly accountOpen: boolean;
  readonly onAccountToggle: () => void;
  readonly accountMenu: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  /* ⌘K / Ctrl+K aramaya odaklanır. Tasarımdaki kısayol rozeti gerçek bir
     kısayolu gösteriyor — süs değil. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className="hidden lg:flex items-center gap-3.5 shrink-0"
      style={{
        height: 62,
        padding: "0 28px",
        borderBottom: "1px solid var(--color-line)",
        background: "var(--color-chrome-header)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <form
        className="flex items-center gap-[9px] flex-1"
        style={{
          maxWidth: 340,
          padding: "9px 13px",
          borderRadius: 11,
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-line)",
        }}
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
      >
        <Search size={15} strokeWidth={2} className="shrink-0 text-(--color-text-soft)" />
        <input
          ref={inputRef}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Danışan, oyun veya not ara…"
          aria-label="Ara"
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-[12.5px] text-(--color-text-strong) placeholder:text-(--color-text-muted)"
        />
        <kbd
          className="numeral shrink-0 text-[9.5px] font-medium text-(--color-text-muted)"
          style={{ padding: "2px 5px", borderRadius: 5, border: "1px solid var(--color-line)" }}
        >
          ⌘K
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Tema — tasarımdaki iki durumlu segment. Yüksek kontrast hesap
            menüsünde kalıyor: günlük bir tercih değil, erişilebilirlik ayarı. */}
        <div
          className="flex p-[3px] rounded-[10px]"
          style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
          role="radiogroup"
          aria-label="Tema"
        >
          {/* Etiket yerine ikon: iki durumlu bir anahtarda "Açık/Koyu" sözcükleri
              güneş ve ayın zaten söylediğini tekrar ediyordu. Erişilebilir ad
              `aria-label`de kalıyor. */}
          {([
            { key: "light", label: "Açık tema", Icon: Sun },
            { key: "dark", label: "Koyu tema", Icon: Moon },
          ] as const).map(({ key, label, Icon }) => {
            const on = theme === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={label}
                title={label}
                onClick={() => onThemeChange(key)}
                className={`grid place-items-center cursor-pointer border-none transition-colors ${on ? "text-white" : "text-(--color-text-soft) bg-transparent hover:text-(--color-text-body)"}`}
                style={{ width: 30, height: 26, borderRadius: 7, background: on ? "var(--gradient-signature)" : undefined }}
              >
                <Icon size={14} strokeWidth={2} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNotifications}
          aria-label={notificationCount > 0 ? `Bildirimler (${notificationCount} yeni)` : "Bildirimler"}
          className="relative grid place-items-center cursor-pointer transition-colors hover:border-(--color-line-strong)"
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            background: "var(--color-surface-strong)",
            border: "1px solid var(--color-line)",
          }}
        >
          <Bell size={16} strokeWidth={1.9} className="text-(--color-text-body)" />
          {notificationCount > 0 && (
            <span
              className="absolute"
              style={{
                top: 6,
                right: 7,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-accent-amber)",
                boxShadow: "0 0 0 2px var(--color-surface-strong)",
              }}
            />
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            onClick={onAccountToggle}
            className="flex items-center gap-[9px] cursor-pointer transition-colors hover:border-(--color-line-strong)"
            style={{
              padding: "4px 12px 4px 4px",
              borderRadius: 12,
              background: "var(--color-surface-strong)",
              border: "1px solid var(--color-line)",
            }}
          >
            <span
              className="grid place-items-center shrink-0 font-bold text-white text-[11.5px]"
              style={{ width: 27, height: 27, borderRadius: 9, background: "var(--gradient-avatar-3)" }}
            >
              {initials(therapistName)}
            </span>
            <span className="text-left min-w-0">
              <span className="block text-[11.5px] font-semibold text-(--color-text-strong) truncate leading-tight">
                {therapistName}
              </span>
              <span className="block text-[9.5px] text-(--color-text-soft) truncate leading-tight">{therapistRole}</span>
            </span>
            <ChevronDown
              size={13}
              className="shrink-0 text-(--color-text-muted) transition-transform"
              style={{ transform: accountOpen ? "rotate(180deg)" : "none" }}
            />
          </button>
          {accountMenu}
        </div>
      </div>
    </header>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "T";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase("tr-TR");
}
