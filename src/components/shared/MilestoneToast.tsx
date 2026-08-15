"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Target, Flame, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MilestoneEvent {
  id: string;
  type: "new-best" | "streak" | "first-game" | "session-count" | "all-games";
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
}

// Milestone store (similar to ToastContainer pattern)
const MilestoneStore = {
  items: [] as MilestoneEvent[],
  listeners: new Set<() => void>(),
};

export function showMilestone(event: Omit<MilestoneEvent, "id">) {
  const id = `ms-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  MilestoneStore.items = [...MilestoneStore.items, { ...event, id }];
  MilestoneStore.listeners.forEach(fn => fn());
  setTimeout(() => {
    MilestoneStore.items = MilestoneStore.items.filter(t => t.id !== id);
    MilestoneStore.listeners.forEach(fn => fn());
  }, 5500);
}

// Predefined milestone triggers
export function checkAndShowMilestones(stats: {
  totalSessions: number;
  sessionStreak: number;
  uniqueGamesPlayed: number;
  isNewBest: boolean;
  gameName: string;
}) {
  const { totalSessions, sessionStreak, uniqueGamesPlayed, isNewBest, gameName } = stats;

  if (isNewBest) {
    showMilestone({
      type: "new-best",
      title: "Yeni Rekor!",
      description: `${gameName} oyununda yeni en yüksek skor!`,
      icon: Trophy,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b, #a96708)",
    });
  }

  // Session milestones
  const sessionMilestones = [10, 25, 50, 100, 250, 500];
  if (sessionMilestones.includes(totalSessions)) {
    showMilestone({
      type: "session-count",
      title: `${totalSessions}. Seans!`,
      description: `Toplam ${totalSessions} seans tamamlandı. Harika bir ilerleme!`,
      icon: Award,
      color: "#2b62f5",
      gradient: "linear-gradient(135deg, #2b62f5, #17c2e0)",
    });
  }

  // Streak milestones
  if (sessionStreak === 3 || sessionStreak === 7 || sessionStreak === 14 || sessionStreak === 30) {
    showMilestone({
      type: "streak",
      title: `${sessionStreak} Gün Serisi!`,
      description: `Üst üste ${sessionStreak} gün seans yapıldı!`,
      icon: Flame,
      color: "#d63d63",
      gradient: "linear-gradient(135deg, #d63d63, #f59e0b)",
    });
  }

  // All games played
  if (uniqueGamesPlayed === 7) {
    showMilestone({
      type: "all-games",
      title: "Tüm Oyunlar!",
      description: "7 oyun türünün tamamı en az bir kez oynandı!",
      icon: Star,
      color: "#17c2e0",
      gradient: "linear-gradient(135deg, #17c2e0, #4d7dff)",
    });
  }
}

export function MilestoneContainer() {
  const [items, setItems] = useState<MilestoneEvent[]>([]);

  useEffect(() => {
    const sync = () => setItems([...MilestoneStore.items]);
    MilestoneStore.listeners.add(sync);
    return () => { MilestoneStore.listeners.delete(sync); };
  }, []);

  if (items.length === 0) return null;

  return (
    /* `80vh` iOS'ta görünür alandan büyük; `dvh` gerçek yüksekliği ölçer.
       Üst pay mobil başlık çubuğunun (52px + güvenli alan) altına iner —
       kutlama bildirimi ekranın adını kapatmasın. */
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[99998] flex flex-col items-center gap-3 pointer-events-none w-full max-w-md px-4 max-h-[80dvh] overflow-y-auto"
      style={{ top: "calc(var(--chrome-top, 0px) + 12px)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id}
            className="pointer-events-auto w-full rounded-2xl border overflow-hidden"
            style={{
              borderColor: `${item.color}33`,
              background: "var(--color-surface-strong)",
              boxShadow: `0 8px 40px ${item.color}30, 0 0 0 1px ${item.color}15`,
              animation: "milestone-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}>
            <div className="h-1 w-full" style={{ background: item.gradient }} />
            <div className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden" style={{ background: item.gradient }}>
                <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)" }} />
                <Icon size={22} className="text-white relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-(--color-text-strong) m-0">{item.title}</p>
                <p className="text-xs text-(--color-text-soft) m-0">{item.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
