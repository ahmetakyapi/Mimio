/**
 * Formatting, parsing, and date utility functions for Mimio platform.
 * Extracted from MimioApp.tsx for maintainability.
 */

import type { CSSProperties } from "react";
import { GAME_LABELS, type DatabaseStatus, type DayKey, type PlatformGameKey, type SessionNote, type WeeklyPlan } from "@/lib/platform-data";
import type { SymbolVariant } from "@/lib/game-types";
import { DAY_KEYS, PHASE_LABELS } from "@/lib/game-constants";

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "Kısa tur";
  if (seconds < 60) return `${seconds} sn`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} dk${remainingSeconds > 0 ? ` ${remainingSeconds} sn` : ""}`;
}

export function formatPlayedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Az önce";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatElapsed(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getWeekStart(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getPhaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase;
}

export function getDatabaseStatusLabel(status: DatabaseStatus | "loading"): string {
  if (status === "loading") return "Kontrol ediliyor";
  if (status === "online") return "Bağlı";
  if (status === "schema_missing") return "Şema bekliyor";
  if (status === "error") return "Hata";
  return "Hazır değil";
}

export function patternStyle(tile: SymbolVariant): CSSProperties {
  if (tile.pattern === "grid") return { backgroundImage: "linear-gradient(90deg, rgba(17,84,137,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(17,84,137,0.08) 1px, transparent 1px)", backgroundSize: "22px 22px" };
  if (tile.pattern === "wave") return { backgroundImage: "radial-gradient(circle at 0 100%, transparent 18px, rgba(17,84,137,0.1) 19px, rgba(17,84,137,0.1) 22px, transparent 23px), radial-gradient(circle at 24px 0, transparent 18px, rgba(17,84,137,0.1) 19px, rgba(17,84,137,0.1) 22px, transparent 23px)", backgroundSize: "48px 48px" };
  return { backgroundImage: "radial-gradient(circle, rgba(17,84,137,0.1) 2px, transparent 3px), radial-gradient(circle, rgba(17,84,137,0.06) 14px, transparent 15px)", backgroundSize: "22px 22px, 64px 64px" };
}

export function parseSessionNotes(value: unknown): SessionNote[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `note-${index}`,
      clientId: typeof item.clientId === "string" ? item.clientId : "",
      therapistId: typeof item.therapistId === "string" ? item.therapistId : "",
      date: typeof item.date === "string" ? item.date : "",
      content: typeof item.content === "string" ? item.content : "",
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date(0).toISOString(),
    }))
    .filter((item) => item.clientId && item.content);
}

export function parseWeeklyPlans(value: unknown): WeeklyPlan[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => {
      const emptyDays: WeeklyPlan["days"] = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
      const days = (typeof item.days === "object" && item.days !== null) ? item.days as Record<string, unknown> : {};
      const parsedDays = { ...emptyDays };
      for (const key of DAY_KEYS) {
        const d = days[key as DayKey];
        if (Array.isArray(d)) {
          parsedDays[key as DayKey] = d.filter((e): e is Record<string, unknown> => !!e && typeof e === "object").map((e) => ({
            gameKey: typeof e.gameKey === "string" && e.gameKey in GAME_LABELS ? (e.gameKey as PlatformGameKey) : "memory",
            goal: typeof e.goal === "string" ? e.goal : "",
          }));
        }
      }
      return {
        id: typeof item.id === "string" ? item.id : `plan-${index}`,
        clientId: typeof item.clientId === "string" ? item.clientId : "",
        therapistId: typeof item.therapistId === "string" ? item.therapistId : "",
        weekStartDate: typeof item.weekStartDate === "string" ? item.weekStartDate : "",
        days: parsedDays,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
      };
    })
    .filter((item) => item.clientId);
}
