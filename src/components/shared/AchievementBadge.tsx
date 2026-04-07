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
  { id: "first-session", title: "İlk Adım", description: "İlk seans tamamlandı", icon: Star, color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #059669)", category: "session", check: (s) => s.totalSessions >= 1 },
  { id: "ten-sessions", title: "Düzenli Terapist", description: "10 seans tamamlandı", icon: Award, color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #4f46e5)", category: "session", check: (s) => s.totalSessions >= 10 },
  { id: "fifty-sessions", title: "Deneyimli Uzman", description: "50 seans tamamlandı", icon: Trophy, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #d97706)", category: "session", check: (s) => s.totalSessions >= 50 },
  { id: "hundred-sessions", title: "Yüzüncü Seans", description: "100 seans başarıyla tamamlandı!", icon: Trophy, color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899, #db2777)", category: "milestone", check: (s) => s.totalSessions >= 100 },

  // Score achievements
  { id: "high-scorer", title: "Yüksek Performans", description: "Tek seansta 200+ puan", icon: Zap, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #ea580c)", category: "score", check: (s) => s.bestScore >= 200 },
  { id: "perfect-game", title: "Kusursuz Oyun", description: "Bir oyunda tüm turlar doğru", icon: Sparkles, color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)", category: "score", check: (s) => s.perfectGames >= 1 },

  // Streak achievements
  { id: "three-day-streak", title: "Üç Gün Serisi", description: "3 gün üst üste seans yapıldı", icon: Flame, color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444, #dc2626)", category: "streak", check: (s) => s.sessionStreak >= 3 },
  { id: "week-streak", title: "Haftalık Seri", description: "7 gün üst üste seans yapıldı", icon: Flame, color: "#f97316", gradient: "linear-gradient(135deg, #f97316, #ea580c)", category: "streak", check: (s) => s.sessionStreak >= 7 },

  // Diversity achievements
  { id: "explorer", title: "Kaşif", description: "Tüm oyun türlerini denedi", icon: Target, color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4, #0891b2)", category: "milestone", check: (s) => s.uniqueGamesPlayed >= 7 },

  // Therapist achievements
  { id: "caring-therapist", title: "İlgili Terapist", description: "10+ seans notu yazıldı", icon: Heart, color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899, #be185d)", category: "special", check: (s) => s.notesWritten >= 10 },
  { id: "goal-setter", title: "Hedef Odaklı", description: "5 hedef tamamlandı", icon: TrendingUp, color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #047857)", category: "special", check: (s) => s.goalsCompleted >= 5 },
  { id: "weekly-warrior", title: "Haftalık Savaşçı", description: "Bir haftada 10+ seans", icon: Clock, color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)", category: "milestone", check: (s) => s.thisWeekSessions >= 10 },
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
    { key: "session" as const, label: "Seans", color: "#6366f1" },
    { key: "score" as const, label: "Skor", color: "#f59e0b" },
    { key: "streak" as const, label: "Seri", color: "#ef4444" },
    { key: "milestone" as const, label: "Dönüm Noktası", color: "#8b5cf6" },
    { key: "special" as const, label: "Özel", color: "#ec4899" },
  ];

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="rounded-2xl border p-4" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-(--color-text-muted)">Başarımlar</span>
          <span className="text-sm font-extrabold" style={{ color: "var(--color-primary)" }}>{earnedCount}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)" }} />
        </div>
        <p className="text-[10px] text-(--color-text-muted) mt-1.5 m-0">%{progressPct} tamamlandı</p>
      </div>

      {/* Newly unlocked celebration */}
      {newlyUnlocked && (() => {
        const ach = ACHIEVEMENTS.find(a => a.id === newlyUnlocked);
        if (!ach) return null;
        const Icon = ach.icon;
        return (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${ach.color}44`, background: `${ach.color}08`, animation: "page-fade-in 0.4s ease" }}>
            <div className="h-1 w-full" style={{ background: ach.gradient }} />
            <div className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: ach.gradient, boxShadow: `0 4px 16px ${ach.color}50` }}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest m-0" style={{ color: ach.color }}>Yeni Başarım!</p>
                <p className="text-sm font-bold text-(--color-text-strong) m-0">{ach.title}</p>
                <p className="text-xs text-(--color-text-soft) m-0">{ach.description}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Category sections */}
      {categories.map(cat => {
        const items = ACHIEVEMENTS.filter(a => a.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key}>
            <p className="text-[10px] font-black uppercase tracking-widest m-0 mb-3" style={{ color: cat.color }}>{cat.label}</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {items.map(ach => {
                const e = earned.find(x => x.id === ach.id);
                return <AchievementBadge key={ach.id} achievement={ach} earned={!!e} earnedAt={e?.earnedAt} size="md" />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
