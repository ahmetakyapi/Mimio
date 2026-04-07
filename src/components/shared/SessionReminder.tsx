"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Clock, Users, X, ChevronRight } from "lucide-react";
import type { ClientProfile, RecentSessionEntry } from "@/lib/platform-data";

const REMINDER_SETTINGS_KEY = "mimio-reminder-settings-v1";
const REMINDER_DISMISSED_KEY = "mimio-reminder-dismissed-v1";

interface ReminderSettings {
  enabled: boolean;
  inactiveDays: number; // remind if client hasn't had a session in X days
  maxDailyReminders: number;
}

interface ReminderItem {
  clientId: string;
  clientName: string;
  daysSinceLastSession: number;
  lastGamePlayed: string;
  type: "inactive" | "scheduled" | "follow-up";
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  inactiveDays: 7,
  maxDailyReminders: 5,
};

function loadSettings(): ReminderSettings {
  try {
    const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function loadDismissed(): Set<string> {
  try {
    const stored = localStorage.getItem(REMINDER_DISMISSED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { ids: string[]; date: string };
      // Reset dismissed list daily
      if (parsed.date === new Date().toISOString().slice(0, 10)) {
        return new Set(parsed.ids);
      }
    }
  } catch { /* ignore */ }
  return new Set();
}

interface SessionReminderBannerProps {
  clients: ClientProfile[];
  sessions: RecentSessionEntry[];
  onSelectClient: (clientId: string) => void;
}

export function SessionReminderBanner({ clients, sessions, onSelectClient }: SessionReminderBannerProps) {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setDismissed(loadDismissed());
  }, []);

  const reminders: ReminderItem[] = (() => {
    if (!settings.enabled) return [];
    const now = Date.now();
    const items: ReminderItem[] = [];

    for (const client of clients) {
      if (client.archivedAt) continue;
      if (dismissed.has(client.id)) continue;

      const clientSessions = sessions.filter(s => s.clientId === client.id);
      const lastSession = clientSessions[0];

      if (!lastSession) {
        // Never had a session
        items.push({
          clientId: client.id,
          clientName: client.displayName,
          daysSinceLastSession: -1,
          lastGamePlayed: "",
          type: "follow-up",
        });
        continue;
      }

      const daysSince = Math.floor((now - new Date(lastSession.playedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= settings.inactiveDays) {
        items.push({
          clientId: client.id,
          clientName: client.displayName,
          daysSinceLastSession: daysSince,
          lastGamePlayed: lastSession.gameLabel,
          type: "inactive",
        });
      }
    }

    return items.sort((a, b) => b.daysSinceLastSession - a.daysSinceLastSession).slice(0, settings.maxDailyReminders);
  })();

  function handleDismiss(clientId: string) {
    const next = new Set(dismissed);
    next.add(clientId);
    setDismissed(next);
    try {
      localStorage.setItem(REMINDER_DISMISSED_KEY, JSON.stringify({
        ids: Array.from(next),
        date: new Date().toISOString().slice(0, 10),
      }));
    } catch { /* ignore */ }
  }

  function handleDismissAll() {
    const next = new Set(reminders.map(r => r.clientId));
    setDismissed(next);
    try {
      localStorage.setItem(REMINDER_DISMISSED_KEY, JSON.stringify({
        ids: Array.from(next),
        date: new Date().toISOString().slice(0, 10),
      }));
    } catch { /* ignore */ }
  }

  if (reminders.length === 0) return null;

  const visibleReminders = showAll ? reminders : reminders.slice(0, 2);

  return (
    <div className="rounded-2xl border overflow-hidden" style={{
      background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(239,68,68,0.02))",
      borderColor: "rgba(245,158,11,0.15)",
    }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
              <Bell size={14} style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-(--color-text-strong) m-0">Seans Hatırlatıcı</h4>
              <p className="text-[10px] text-(--color-text-muted) m-0">{reminders.length} danışan için aksiyon gerekiyor</p>
            </div>
          </div>
          <button type="button" onClick={handleDismissAll} className="text-[10px] font-bold text-(--color-text-muted) bg-transparent border-none cursor-pointer hover:text-(--color-text-body)">
            Tümünü kapat
          </button>
        </div>

        <div className="space-y-2">
          {visibleReminders.map(reminder => (
            <div key={reminder.clientId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
                style={{ background: reminder.type === "inactive" ? "linear-gradient(135deg, #f59e0b, #ea580c)" : "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
                {reminder.clientName[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-(--color-text-strong) m-0 truncate">{reminder.clientName}</p>
                <p className="text-[10px] text-(--color-text-muted) m-0">
                  {reminder.daysSinceLastSession === -1
                    ? "Henüz seans yapılmadı"
                    : `${reminder.daysSinceLastSession} gündür seans yok${reminder.lastGamePlayed ? ` · Son: ${reminder.lastGamePlayed}` : ""}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => { onSelectClient(reminder.clientId); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer"
                  style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}
                  title="Seans başlat">
                  <ChevronRight size={14} />
                </button>
                <button type="button" onClick={() => handleDismiss(reminder.clientId)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer text-(--color-text-muted) hover:text-(--color-text-body)"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  title="Kapat">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {reminders.length > 2 && (
          <button type="button" onClick={() => setShowAll(v => !v)}
            className="w-full text-center text-[10px] font-bold mt-2 bg-transparent border-none cursor-pointer" style={{ color: "#f59e0b" }}>
            {showAll ? "Daha az göster" : `+${reminders.length - 2} danışan daha`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Settings panel for reminder configuration ──
interface ReminderSettingsProps {
  onClose: () => void;
}

export function ReminderSettingsPanel({ onClose }: ReminderSettingsProps) {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);

  useEffect(() => { setSettings(loadSettings()); }, []);

  function handleSave() {
    try { localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
    onClose();
  }

  return (
    <div className="rounded-2xl border p-4 space-y-4" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-extrabold text-(--color-text-strong) m-0">Hatırlatıcı Ayarları</h4>
        <button type="button" onClick={onClose} className="text-(--color-text-muted) bg-transparent border-none cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <label className="flex items-center justify-between">
        <span className="text-xs text-(--color-text-body)">Hatırlatıcıları aktifleştir</span>
        <button type="button" onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
          className="w-10 h-5 rounded-full transition-colors border-none cursor-pointer relative"
          style={{ background: settings.enabled ? "#6366f1" : "rgba(255,255,255,0.1)" }}>
          <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
            style={{ left: settings.enabled ? "calc(100% - 18px)" : "2px" }} />
        </button>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-(--color-text-body)">Aktif olmayan gün eşiği</span>
        <div className="flex items-center gap-2">
          <input type="range" min={3} max={30} value={settings.inactiveDays}
            onChange={e => setSettings(s => ({ ...s, inactiveDays: Number(e.target.value) }))}
            className="flex-1" />
          <span className="text-xs font-bold text-(--color-primary) tabular-nums w-10 text-right">{settings.inactiveDays} gün</span>
        </div>
      </label>

      <button type="button" onClick={handleSave}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
        Kaydet
      </button>
    </div>
  );
}
