"use client";

/*
 * Ayarlar — tasarım dokümanı 1v/1w.
 *
 * Dört kart, iki sütun: Profil, Bildirimler, Görünüm, Veri & Gizlilik.
 *
 * **Anahtarlar hakkında bir dürüstlük notu.** Doküman beş anahtar
 * gösteriyor. Üçünün arkasında çalışan bir mekanizma var (seans
 * hatırlatması, plato uyarısı, danışan adı maskeleme) — bunlar gerçek
 * tercih olarak saklanıyor ve ilgili yerde okunuyor. İkisinin arkasında
 * yok (haftalık e-posta özeti, iki adımlı doğrulama): e-posta altyapısı
 * ve 2FA henüz kurulmadı. Onları çalışıyormuş gibi göstermek yerine
 * devre dışı bırakıp nedenini yazıyoruz — sessizce hiçbir şey yapmayan
 * bir anahtar, olmayan bir anahtardan kötüdür.
 */

import { Sun, Moon, Monitor, Eye, Edit2, Award, LogOut, Database, Check, Download, Upload } from "lucide-react";
import type { TherapistProfile, DatabaseStatus } from "@/lib/platform-data";
import { Card, CardTitle, Eyebrow, ScreenHeader } from "./primitives";

export interface AppPrefs {
  /** Seanstan 15 dk önce tarayıcı bildirimi */
  sessionReminder: boolean;
  /** 3 seans üst üste ilerleme yoksa öneri panelinde uyar */
  plateauAlert: boolean;
  /** Raporlarda yalnızca baş harf göster */
  maskClientNames: boolean;
}

export const DEFAULT_PREFS: AppPrefs = {
  sessionReminder: true,
  plateauAlert: true,
  maskClientNames: false,
};

const THEMES = [
  { key: "light", label: "Açık", Icon: Sun },
  { key: "dark", label: "Koyu", Icon: Moon },
  { key: "system", label: "Sistem", Icon: Monitor },
] as const;

interface Props {
  readonly therapist: TherapistProfile | null;
  readonly clientCount: number;
  readonly theme: string;
  readonly preference: string;
  readonly onThemeChange: (t: "light" | "dark" | "high-contrast" | "system") => void;
  readonly prefs: AppPrefs;
  readonly onPrefsChange: (next: AppPrefs) => void;
  readonly onEditProfile: () => void;
  readonly onShowAchievements: () => void;
  readonly achievementCount: number;
  readonly databaseStatus: { configured: boolean; status: DatabaseStatus; provider: string; message: string };
  readonly onExportAll: () => void;
  readonly onImportCsv: () => void;
  readonly onLogout: () => void;
}

export function SettingsScreen({
  therapist,
  clientCount,
  theme,
  preference,
  onThemeChange,
  prefs,
  onPrefsChange,
  onEditProfile,
  onShowAchievements,
  achievementCount,
  databaseStatus,
  onExportAll,
  onImportCsv,
  onLogout,
}: Props) {
  const set = <K extends keyof AppPrefs>(k: K, v: AppPrefs[K]) => onPrefsChange({ ...prefs, [k]: v });

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <ScreenHeader eyebrow="Hesap · klinik · görünüm" title="Ayarlar" sub="Tercihler cihaz başına saklanır." />

      <div className="grid gap-4 flex-1 min-h-0 overflow-y-auto content-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        {/* ── Profil ── */}
        <Card pad="p-[20px_22px]">
          <Eyebrow className="mb-3.5">Profil</Eyebrow>
          <div className="flex items-center gap-3 mb-4">
            <span
              className="grid place-items-center shrink-0 font-bold text-white text-[15px]"
              style={{ width: 46, height: 46, borderRadius: 14, background: "var(--gradient-avatar-3)" }}
            >
              {initials(therapist?.displayName ?? "T")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-display block text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong) truncate">
                {therapist?.displayName ?? "Terapist"}
              </span>
              <span className="block text-[11px] text-(--color-text-soft) truncate">
                {[therapist?.specialty || "Ergoterapist", therapist?.clinicName, `${clientCount} danışan`].filter(Boolean).join(" · ")}
              </span>
            </span>
          </div>

          <Field label="Ad Soyad" value={therapist?.displayName ?? "—"} />
          <Field label="Kullanıcı Adı" value={therapist?.username ?? "—"} mono />
          <Field label="Uzmanlık Alanı" value={therapist?.specialty || "Girilmemiş"} muted={!therapist?.specialty} />
          <Field label="Klinik" value={therapist?.clinicName || "Bağımsız terapist"} last />

          <button
            type="button"
            onClick={onEditProfile}
            className="w-full mt-4 flex items-center justify-center gap-2 text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
            style={{ padding: 11, borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
          >
            <Edit2 size={14} /> {therapist?.specialty ? "Profili Düzenle" : "Profili Tamamla"}
          </button>
        </Card>

        {/* ── Bildirimler ── */}
        <Card pad="p-[20px_22px]">
          <Eyebrow className="mb-3.5">Bildirimler</Eyebrow>
          {/* Açıklama mekanizmanın gerçeğini söylemeli: bildirim tarayıcı
              push'u değil, uygulama içi uyarı. */}
          <Toggle
            label="Seans Hatırlatması"
            desc="Planlı seanstan 15 dk önce uygulama içi uyarı"
            on={prefs.sessionReminder}
            onChange={(v) => set("sessionReminder", v)}
          />
          <Toggle
            label="Plato Uyarısı"
            desc="3 seans üst üste ilerleme yoksa öneri panelinde uyar"
            on={prefs.plateauAlert}
            onChange={(v) => set("plateauAlert", v)}
          />
          <Toggle
            label="Haftalık Özet"
            desc="E-posta altyapısı henüz kurulmadı"
            on={false}
            disabled
            onChange={() => {}}
            last
          />
        </Card>

        {/* ── Görünüm ── */}
        <Card pad="p-[20px_22px]">
          <Eyebrow className="mb-1">Görünüm</Eyebrow>
          <p className="m-0 mb-3.5 text-[11px] text-(--color-text-soft)">Tema seçimi cihaz başına saklanır.</p>

          <div className="grid gap-[11px]" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
            {THEMES.map(({ key, label, Icon }) => {
              const on = key === "system" ? preference === "system" : preference !== "system" && theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onThemeChange(key)}
                  aria-pressed={on}
                  className="flex flex-col items-center gap-2 cursor-pointer transition-colors"
                  style={{
                    padding: "14px 8px",
                    borderRadius: 13,
                    background: on ? "var(--gradient-signature-soft)" : "var(--color-surface-strong)",
                    border: `1px solid ${on ? "var(--color-line-strong)" : "var(--color-line)"}`,
                  }}
                >
                  <Icon size={17} strokeWidth={1.9} style={{ color: on ? "var(--color-primary)" : "var(--color-text-soft)" }} />
                  <span className={`text-[11.5px] ${on ? "font-semibold text-(--color-primary-ink)" : "font-medium text-(--color-text-body)"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onThemeChange("high-contrast")}
            aria-pressed={theme === "high-contrast"}
            className="w-full mt-2.5 flex items-center gap-2.5 cursor-pointer text-left transition-colors"
            style={{
              padding: "11px 13px",
              borderRadius: 12,
              background: theme === "high-contrast" ? "var(--gradient-signature-soft)" : "transparent",
              border: `1px solid ${theme === "high-contrast" ? "var(--color-line-strong)" : "var(--color-line)"}`,
            }}
          >
            <Eye size={16} strokeWidth={1.9} className="text-(--color-text-soft)" />
            <span className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-medium text-(--color-text-body)">Yüksek Kontrast</span>
              <span className="block text-[10.5px] text-(--color-text-soft)">Degrade ve doku kapalı, kenarlar keskin</span>
            </span>
            {theme === "high-contrast" && <Check size={15} style={{ color: "var(--color-primary)" }} />}
          </button>

          <p className="m-0 mt-3 text-[10.5px] leading-[1.5] text-(--color-text-muted)">
            Oyun ekranları tema değişiminden bağımsız olarak koyu kalır — çocuğun gördüğü yüzey
            terapistin tercihine göre değişmemeli.
          </p>
        </Card>

        {/* ── Veri & Gizlilik ── */}
        <Card pad="p-[20px_22px]">
          <Eyebrow className="mb-3.5">Veri & Gizlilik</Eyebrow>

          <Toggle
            label="Danışan Adlarını Maskele"
            desc="Raporlarda yalnızca baş harf gösterilir"
            on={prefs.maskClientNames}
            onChange={(v) => set("maskClientNames", v)}
          />
          <Toggle
            label="İki Adımlı Doğrulama"
            desc="Kimlik altyapısı henüz kurulmadı"
            on={false}
            disabled
            onChange={() => {}}
            last
          />

          <div className="flex items-start gap-3 mt-4 mb-3.5">
            <span
              className="grid place-items-center shrink-0"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: databaseStatus.configured ? "color-mix(in srgb, var(--color-accent-green) 14%, transparent)" : "var(--color-primary-light)",
                color: databaseStatus.configured ? "var(--color-accent-green)" : "var(--color-text-soft)",
              }}
            >
              <Database size={15} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <CardTitle className="!text-[12.5px] block">{databaseStatus.provider}</CardTitle>
              <p className="m-0 mt-0.5 text-[11px] leading-[1.5] text-(--color-text-soft)">{databaseStatus.message}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExportAll}
              className="flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
              style={{ padding: 10, borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            >
              <Download size={13} /> Tüm Veriyi İndir
            </button>
            <button
              type="button"
              onClick={onImportCsv}
              className="flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
              style={{ padding: 10, borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            >
              <Upload size={13} /> CSV İçe Aktar
            </button>
            <button
              type="button"
              onClick={onShowAchievements}
              className="flex items-center justify-center gap-2 text-[12px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
              style={{ padding: "10px 14px", borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            >
              <Award size={13} /> {achievementCount > 0 ? achievementCount : ""}
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 text-[12.5px] font-semibold cursor-pointer transition-colors"
            style={{ padding: 11, borderRadius: 11, border: "1px solid var(--color-line)", color: "var(--color-accent-red)", background: "transparent" }}
          >
            <LogOut size={14} /> Çıkış Yap
          </button>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, muted = false, mono = false, last = false }: {
  readonly label: string; readonly value: string; readonly muted?: boolean; readonly mono?: boolean; readonly last?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ padding: "9px 0", borderBottom: last ? "none" : "1px solid var(--color-line-soft)" }}>
      <span className="text-[11.5px] text-(--color-text-soft) shrink-0">{label}</span>
      <span className={`text-[12.5px] font-semibold truncate text-right ${mono ? "numeral" : ""} ${muted ? "text-(--color-text-muted)" : "text-(--color-text-strong)"}`}>
        {value}
      </span>
    </div>
  );
}

function Toggle({ label, desc, on, onChange, disabled = false, last = false }: {
  readonly label: string; readonly desc: string; readonly on: boolean;
  readonly onChange: (v: boolean) => void; readonly disabled?: boolean; readonly last?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="w-full flex items-center gap-3 text-left cursor-pointer bg-transparent border-none disabled:cursor-not-allowed"
      style={{ padding: "11px 0", borderBottom: last ? "none" : "1px solid var(--color-line-soft)", opacity: disabled ? 0.5 : 1 }}
    >
      <span className="flex-1 min-w-0">
        <span className="block text-[12.5px] font-semibold text-(--color-text-strong)">{label}</span>
        <span className="block text-[10.5px] text-(--color-text-soft) mt-0.5">{desc}</span>
      </span>
      <span
        className="shrink-0 relative transition-colors"
        style={{
          width: 38,
          height: 22,
          borderRadius: 999,
          background: on ? "var(--gradient-signature)" : "var(--color-line-strong)",
        }}
      >
        <span
          className="absolute top-[3px] transition-[left] duration-200"
          style={{ left: on ? 19 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff" }}
        />
      </span>
    </button>
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "T";
  if (p.length === 1) return p[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (p[0][0] + p[p.length - 1][0]).toLocaleUpperCase("tr-TR");
}
