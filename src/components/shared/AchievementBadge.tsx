"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Trophy, Star, Flame, Target, Zap, Award, Heart, TrendingUp, Clock, Sparkles } from "lucide-react";

// ── Achievement definitions ──
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  category: "session" | "score" | "streak" | "milestone" | "special";
  check: (stats: AchievementStats) => boolean;
  /** Kaç birim tamamlandı / hedef kaç — kilitli rozette ilerleme çubuğu için */
  progress: (stats: AchievementStats) => { current: number; target: number };
  /** İlerlemenin birimi ("seans", "puan", "gün"…) */
  unit: string;
}

export interface AchievementStats {
  totalSessions: number;
  totalScore: number;
  bestScore: number;
  uniqueGamesPlayed: number;
  sessionStreak: number;
  perfectGames: number; // games where all rounds correct
  thisWeekSessions: number;
  totalClients: number;
  notesWritten: number;
  goalsCompleted: number;
}

export interface EarnedAchievement {
  id: string;
  earnedAt: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Session milestones
  { id: "first-session", title: "İlk Adım", description: "İlk seans tamamlandı", icon: Star, color: "#3f7d4f", gradient: "linear-gradient(135deg, #3f7d4f, #33663f)", category: "session", check: (s) => s.totalSessions >= 1, progress: (s) => ({ current: s.totalSessions, target: 1 }), unit: "seans" },
  { id: "ten-sessions", title: "Düzenli Terapist", description: "10 seans tamamlandı", icon: Award, color: "#1d5a8c", gradient: "linear-gradient(135deg, #1d5a8c, #17456e)", category: "session", check: (s) => s.totalSessions >= 10, progress: (s) => ({ current: s.totalSessions, target: 10 }), unit: "seans" },
  { id: "fifty-sessions", title: "Deneyimli Uzman", description: "50 seans tamamlandı", icon: Trophy, color: "#b8763a", gradient: "linear-gradient(135deg, #b8763a, #8f5626)", category: "session", check: (s) => s.totalSessions >= 50, progress: (s) => ({ current: s.totalSessions, target: 50 }), unit: "seans" },
  { id: "hundred-sessions", title: "Yüzüncü Seans", description: "100 seans başarıyla tamamlandı!", icon: Trophy, color: "#b8503f", gradient: "linear-gradient(135deg, #b8503f, #8a2c21)", category: "milestone", check: (s) => s.totalSessions >= 100, progress: (s) => ({ current: s.totalSessions, target: 100 }), unit: "seans" },

  // Score achievements
  { id: "high-scorer", title: "Yüksek Performans", description: "Tek seansta 200+ puan", icon: Zap, color: "#b8763a", gradient: "linear-gradient(135deg, #b8763a, #8f5626)", category: "score", check: (s) => s.bestScore >= 200, progress: (s) => ({ current: s.bestScore, target: 200 }), unit: "puan" },
  { id: "perfect-game", title: "Kusursuz Oyun", description: "Bir oyunda tüm turlar doğru", icon: Sparkles, color: "#2a72ac", gradient: "linear-gradient(135deg, #2a72ac, #17456e)", category: "score", check: (s) => s.perfectGames >= 1, progress: (s) => ({ current: s.perfectGames, target: 1 }), unit: "oyun" },

  // Streak achievements
  { id: "three-day-streak", title: "Üç Gün Serisi", description: "3 gün üst üste seans yapıldı", icon: Flame, color: "#a8392c", gradient: "linear-gradient(135deg, #a8392c, #8a2c21)", category: "streak", check: (s) => s.sessionStreak >= 3, progress: (s) => ({ current: s.sessionStreak, target: 3 }), unit: "gün" },
  { id: "week-streak", title: "Haftalık Seri", description: "7 gün üst üste seans yapıldı", icon: Flame, color: "#b8763a", gradient: "linear-gradient(135deg, #b8763a, #8f5626)", category: "streak", check: (s) => s.sessionStreak >= 7, progress: (s) => ({ current: s.sessionStreak, target: 7 }), unit: "gün" },

  // Diversity achievements
  { id: "explorer", title: "Kaşif", description: "Tüm oyun türlerini denedi", icon: Target, color: "#5b7183", gradient: "linear-gradient(135deg, #5b7183, #465a6b)", category: "milestone", check: (s) => s.uniqueGamesPlayed >= 7, progress: (s) => ({ current: s.uniqueGamesPlayed, target: 7 }), unit: "oyun" },

  // Therapist achievements
  { id: "caring-therapist", title: "İlgili Terapist", description: "10+ seans notu yazıldı", icon: Heart, color: "#b8503f", gradient: "linear-gradient(135deg, #b8503f, #8a2c21)", category: "special", check: (s) => s.notesWritten >= 10, progress: (s) => ({ current: s.notesWritten, target: 10 }), unit: "not" },
  { id: "goal-setter", title: "Hedef Odaklı", description: "5 hedef tamamlandı", icon: TrendingUp, color: "#3f7d4f", gradient: "linear-gradient(135deg, #3f7d4f, #33663f)", category: "special", check: (s) => s.goalsCompleted >= 5, progress: (s) => ({ current: s.goalsCompleted, target: 5 }), unit: "hedef" },
  { id: "weekly-warrior", title: "Haftalık Savaşçı", description: "Bir haftada 10+ seans", icon: Clock, color: "#2a72ac", gradient: "linear-gradient(135deg, #2a72ac, #17456e)", category: "milestone", check: (s) => s.thisWeekSessions >= 10, progress: (s) => ({ current: s.thisWeekSessions, target: 10 }), unit: "seans" },
];

// ── Badge component ──
interface AchievementBadgeProps {
  achievement: AchievementDef;
  earned: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function AchievementBadge({ achievement, earned, earnedAt, size = "md", onClick }: AchievementBadgeProps) {
  const Icon = achievement.icon;
  const sizeMap = { sm: { box: 40, icon: 16, text: "text-[10px]" }, md: { box: 56, icon: 22, text: "text-xs" }, lg: { box: 72, icon: 28, text: "text-sm" } };
  const s = sizeMap[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent group transition-transform hover:scale-105 active:scale-95"
      title={earned ? `${achievement.title} — ${achievement.description}` : `Kilitli: ${achievement.description}`}
    >
      <div
        className="rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300"
        style={{
          width: s.box,
          height: s.box,
          background: earned ? achievement.gradient : "rgba(255,255,255,0.04)",
          border: earned ? `2px solid ${achievement.color}66` : "2px solid rgba(255,255,255,0.08)",
          boxShadow: earned ? `0 4px 20px ${achievement.color}40` : "none",
          opacity: earned ? 1 : 0.4,
          filter: earned ? "none" : "grayscale(1)",
        }}
      >
        {earned && (
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)" }} />
        )}
        <Icon size={s.icon} className="relative z-10" style={{ color: earned ? "#fff" : "var(--color-text-muted)" }} />
      </div>
      <span className={`${s.text} font-bold text-center leading-tight max-w-[72px]`} style={{ color: earned ? "var(--color-text-strong)" : "var(--color-text-muted)" }}>
        {achievement.title}
      </span>
      {earned && earnedAt && size === "lg" && (
        <span className="text-[9px] text-(--color-text-muted)">{new Date(earnedAt).toLocaleDateString("tr-TR")}</span>
      )}
    </button>
  );
}

// ── Achievement panel ──
interface AchievementPanelProps {
  stats: AchievementStats;
  earned: EarnedAchievement[];
  onEarn?: (achievementId: string) => void;
}

export function AchievementPanel({ stats, earned, onEarn }: AchievementPanelProps) {
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null);

  useEffect(() => {
    for (const ach of ACHIEVEMENTS) {
      const isEarned = earned.some(e => e.id === ach.id);
      if (!isEarned && ach.check(stats)) {
        onEarn?.(ach.id);
        setNewlyUnlocked(ach.id);
        const timer = setTimeout(() => setNewlyUnlocked(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [stats, earned, onEarn]);

  const earnedIds = new Set(earned.map(e => e.id));
  const earnedCount = ACHIEVEMENTS.filter(a => earnedIds.has(a.id)).length;
  const progressPct = Math.round((earnedCount / ACHIEVEMENTS.length) * 100);

  const categories = [
    { key: "session" as const, label: "Seans", color: "#1d5a8c" },
    { key: "score" as const, label: "Skor", color: "#b8763a" },
    { key: "streak" as const, label: "Seri", color: "#a8392c" },
    { key: "milestone" as const, label: "Dönüm Noktası", color: "#2a72ac" },
    { key: "special" as const, label: "Özel", color: "#b8503f" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/*
        Üst şerit: tek bir ilerleme halkası + sayaç. Önceki sürümde düz bir
        çubuk ve "%0 tamamlandı" yazısı vardı; panelin tamamı kilitliyken
        hiçbir şey söylemiyordu.
      */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: 76, height: 76 }}>
          <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
            <circle cx="38" cy="38" r="33" fill="none" stroke="var(--color-line)" strokeWidth="6" />
            <circle
              cx="38" cy="38" r="33" fill="none"
              stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 33}
              strokeDashoffset={2 * Math.PI * 33 * (1 - earnedCount / ACHIEVEMENTS.length)}
              style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="numeral text-lg font-bold leading-none text-(--color-text-strong)">{earnedCount}</span>
            <span className="numeral text-[10px] text-(--color-text-muted) leading-none mt-0.5">/{ACHIEVEMENTS.length}</span>
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xl font-extrabold text-(--color-text-strong) m-0 tracking-tight">
            {earnedCount === 0 ? "Henüz başarım yok" : earnedCount === ACHIEVEMENTS.length ? "Hepsi tamamlandı" : `${earnedCount} başarım kazanıldı`}
          </h3>
          <p className="text-sm text-(--color-text-soft) m-0 mt-1 leading-relaxed">
            {earnedCount === 0
              ? "Seans oynattıkça, not tuttukça ve hedef tamamladıkça açılırlar."
              : `%${progressPct} tamamlandı. Kalan ${ACHIEVEMENTS.length - earnedCount} başarımın koşulunu aşağıda görebilirsin.`}
          </p>
        </div>
      </div>

      {/* Yeni açılan başarım kutlaması */}
      {newlyUnlocked && (() => {
        const ach = ACHIEVEMENTS.find(a => a.id === newlyUnlocked);
        if (!ach) return null;
        const Icon = ach.icon;
        return (
          <div className="flex items-center gap-3 rounded-2xl p-4"
            style={{ border: `1px solid ${ach.color}55`, background: `color-mix(in srgb, ${ach.color} 8%, transparent)`, animation: "page-fade-in 0.4s ease" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: ach.color }}>
              <Icon size={20} style={{ color: "var(--color-text-inverse)" }} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest m-0" style={{ color: ach.color }}>Yeni başarım</p>
              <p className="text-sm font-bold text-(--color-text-strong) m-0">{ach.title}</p>
            </div>
          </div>
        );
      })()}

      {/* Kategoriler — her başarım kendi koşulunu ve ilerlemesini taşır */}
      {categories.map(cat => {
        const items = ACHIEVEMENTS.filter(a => a.category === cat.key);
        if (items.length === 0) return null;
        const catEarned = items.filter(a => earnedIds.has(a.id)).length;
        return (
          <section key={cat.key}>
            <div className="flex items-baseline gap-2 mb-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.16em] m-0" style={{ color: cat.color }}>{cat.label}</h4>
              <span className="numeral text-[11px] text-(--color-text-muted)">{catEarned}/{items.length}</span>
              <span className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {items.map(ach => {
                const e = earned.find(x => x.id === ach.id);
                const isEarned = !!e;
                const { current, target } = ach.progress(stats);
                const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
                const Icon = ach.icon;
                return (
                  <div
                    key={ach.id}
                    className="relative flex items-start gap-3 rounded-2xl p-3.5 overflow-hidden transition-colors"
                    style={{
                      background: isEarned ? `color-mix(in srgb, ${ach.color} 7%, transparent)` : "var(--color-surface-elevated)",
                      border: `1px solid ${isEarned ? `color-mix(in srgb, ${ach.color} 32%, transparent)` : "var(--color-line)"}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isEarned ? ach.color : "var(--color-surface)",
                        border: isEarned ? "none" : "1px solid var(--color-line)",
                      }}
                    >
                      <Icon
                        size={18}
                        style={{ color: isEarned ? "var(--color-text-inverse)" : "var(--color-text-disabled)" }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <strong
                          className="text-[13px] font-bold truncate"
                          style={{ color: isEarned ? "var(--color-text-strong)" : "var(--color-text-soft)" }}
                        >
                          {ach.title}
                        </strong>
                        {isEarned && (
                          <span className="text-[10px] shrink-0" style={{ color: ach.color }}>✓</span>
                        )}
                      </div>
                      <p className="text-[11px] text-(--color-text-muted) m-0 mt-0.5 leading-snug">
                        {ach.description}
                      </p>

                      {isEarned ? (
                        e?.earnedAt && (
                          <p className="numeral text-[10px] text-(--color-text-muted) m-0 mt-1.5">
                            {new Date(e.earnedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        )
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                            <div
                              className="h-full rounded-full transition-[width] duration-700"
                              style={{ width: `${pct}%`, background: ach.color, opacity: 0.7 }}
                            />
                          </div>
                          <span className="numeral text-[10px] text-(--color-text-muted) shrink-0">
                            {Math.min(current, target)}/{target} {ach.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
