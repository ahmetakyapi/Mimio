"use client";

/*
 * Ayarlar — gezinmedeki yedinci bölüm.
 *
 * Tercihlerin çoğu üst çubuktaki hesap menüsünde de var; burası onların
 * tam etiketli, açıklamalı hâli. Menü hız için, bu ekran anlamak için:
 * "yüksek kontrast nedir", "verim nerede duruyor" gibi sorular menüde
 * cevaplanamıyordu.
 */

import { Sun, Moon, Eye, Edit2, Award, LogOut, Database, Check } from "lucide-react";
import type { TherapistProfile, DatabaseStatus } from "@/lib/platform-data";
import { Card, CardTitle, Eyebrow, ScreenHeader } from "./primitives";

interface Props {
  readonly therapist: TherapistProfile | null;
  readonly theme: string;
  readonly preference: string;
  readonly onThemeChange: (t: "light" | "dark" | "high-contrast" | "system") => void;
  readonly onEditProfile: () => void;
  readonly onShowAchievements: () => void;
  readonly achievementCount: number;
  readonly databaseStatus: { configured: boolean; status: DatabaseStatus; provider: string; message: string };
  readonly onLogout: () => void;
}

const THEMES = [
  { key: "light", label: "Açık", desc: "Aydınlık odada gündüz çalışması", Icon: Sun },
  { key: "dark", label: "Koyu", desc: "Loş oda, akşam seansları", Icon: Moon },
  { key: "high-contrast", label: "Yüksek kontrast", desc: "Degrade ve doku kapalı, kenarlar keskin", Icon: Eye },
  { key: "system", label: "Sistem", desc: "İşletim sistemi tercihini izler", Icon: Check },
] as const;

export function SettingsScreen({
  therapist,
  theme,
  preference,
  onThemeChange,
  onEditProfile,
  onShowAchievements,
  achievementCount,
  databaseStatus,
  onLogout,
}: Props) {
  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <ScreenHeader eyebrow="Hesap ve tercihler" title="Ayarlar" sub="Görünüm, profil ve veri katmanı." />

      <div className="grid gap-4 flex-1 min-h-0 overflow-y-auto content-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card pad="p-[18px_20px]">
          <Eyebrow className="mb-3.5">Görünüm</Eyebrow>
          <div className="flex flex-col gap-2">
            {THEMES.map(({ key, label, desc, Icon }) => {
              const on = key === "system" ? preference === "system" : preference !== "system" && theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onThemeChange(key)}
                  aria-pressed={on}
                  className="flex items-center gap-3 text-left cursor-pointer transition-colors"
                  style={{
                    padding: "11px 13px",
                    borderRadius: 12,
                    background: on ? "var(--gradient-signature-soft)" : "transparent",
                    border: `1px solid ${on ? "var(--color-line-strong)" : "var(--color-line)"}`,
                  }}
                >
                  <Icon size={16} strokeWidth={1.9} style={{ color: on ? "var(--color-primary)" : "var(--color-text-soft)" }} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[13px] ${on ? "font-semibold text-(--color-primary-ink)" : "font-medium text-(--color-text-body)"}`}>
                      {label}
                    </span>
                    <span className="block text-[11px] text-(--color-text-soft) truncate">{desc}</span>
                  </span>
                  {on && <Check size={15} style={{ color: "var(--color-primary)" }} />}
                </button>
              );
            })}
          </div>
        </Card>

        <Card pad="p-[18px_20px]">
          <Eyebrow className="mb-3.5">Profil</Eyebrow>
          <div className="flex flex-col gap-2.5 mb-4">
            <Field label="Ad" value={therapist?.displayName ?? "—"} />
            <Field label="Klinik" value={therapist?.clinicName || "Bağımsız terapist"} />
            <Field label="Uzmanlık" value={therapist?.specialty || "Girilmemiş"} muted={!therapist?.specialty} />
          </div>
          <button type="button" onClick={onEditProfile} className="w-full flex items-center justify-center gap-2 text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)" style={{ padding: 11, borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
            <Edit2 size={14} /> {therapist?.specialty ? "Profili düzenle" : "Profili tamamla"}
          </button>
        </Card>

        <Card pad="p-[18px_20px]">
          <Eyebrow className="mb-3.5">Veri katmanı</Eyebrow>
          <div className="flex items-start gap-3 mb-4">
            <span
              className="grid place-items-center shrink-0"
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                background: databaseStatus.configured ? "color-mix(in srgb, var(--color-accent-green) 14%, transparent)" : "var(--color-primary-light)",
                color: databaseStatus.configured ? "var(--color-accent-green)" : "var(--color-text-soft)",
              }}
            >
              <Database size={16} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <CardTitle className="!text-[13px] block">{databaseStatus.provider}</CardTitle>
              <p className="m-0 mt-1 text-[11.5px] leading-[1.5] text-(--color-text-soft)">{databaseStatus.message}</p>
            </div>
          </div>
          <p className="m-0 text-[11px] leading-[1.55] text-(--color-text-muted)">
            Veritabanı bağlı değilse notlar ve planlar yalnızca bu tarayıcıda saklanır.
          </p>
        </Card>

        <Card pad="p-[18px_20px]">
          <Eyebrow className="mb-3.5">Diğer</Eyebrow>
          <button type="button" onClick={onShowAchievements} className="w-full flex items-center gap-3 text-left cursor-pointer bg-transparent transition-colors hover:text-(--color-primary) text-(--color-text-body)" style={{ padding: "11px 13px", borderRadius: 12, border: "1px solid var(--color-line)" }}>
            <Award size={16} strokeWidth={1.9} className="text-(--color-text-soft)" />
            <span className="flex-1 text-[13px] font-medium">Başarımlar</span>
            {achievementCount > 0 && <span className="numeral text-[11px] text-(--color-text-soft)">{achievementCount}</span>}
          </button>
          <button type="button" onClick={onLogout} className="w-full mt-2 flex items-center gap-3 text-left cursor-pointer bg-transparent transition-colors" style={{ padding: "11px 13px", borderRadius: 12, border: "1px solid var(--color-line)", color: "var(--color-accent-red)" }}>
            <LogOut size={16} strokeWidth={1.9} />
            <span className="flex-1 text-[13px] font-medium">Çıkış yap</span>
          </button>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, muted = false }: { readonly label: string; readonly value: string; readonly muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-line-soft)" }}>
      <span className="text-[11.5px] text-(--color-text-soft) shrink-0">{label}</span>
      <span className={`text-[12.5px] font-semibold truncate text-right ${muted ? "text-(--color-text-muted)" : "text-(--color-text-strong)"}`}>
        {value}
      </span>
    </div>
  );
}
