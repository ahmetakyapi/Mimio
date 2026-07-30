"use client";

import { useState } from "react";
import { Play, Clock, Users, Gamepad2, ChevronRight, Zap, Star, RotateCcw } from "lucide-react";
import type { ClientProfile, PlatformGameKey, RecentSessionEntry } from "@/lib/platform-data";
import { GAME_LABELS } from "@/lib/platform-data";
import { gameAccent } from "@/lib/game-constants";

interface QuickSessionStartProps {
  clients: ClientProfile[];
  activeClientId: string;
  recentSessions: RecentSessionEntry[];
  onSelectClient: (clientId: string) => void;
  onStartGame: (gameKey: PlatformGameKey) => void;
  onStartSessionSet: (presetId: string) => void;
}

export function QuickSessionStart({ clients, activeClientId, recentSessions, onSelectClient, onStartGame, onStartSessionSet }: QuickSessionStartProps) {
  const [expanded, setExpanded] = useState(false);

  const activeClient = clients.find(c => c.id === activeClientId);

  // Smart suggestions based on recent activity
  const clientSessions = recentSessions.filter(s => s.clientId === activeClientId);
  const lastGame = clientSessions[0]?.gameKey as PlatformGameKey | undefined;

  // Find least played game for this client
  const gameCounts: Record<string, number> = {};
  clientSessions.forEach(s => { gameCounts[s.gameKey] = (gameCounts[s.gameKey] ?? 0) + 1; });
  const allGames: PlatformGameKey[] = ["memory", "pairs", "pulse", "route", "difference", "scan", "logic"];
  const leastPlayed = allGames.sort((a, b) => (gameCounts[a] ?? 0) - (gameCounts[b] ?? 0))[0];

  // Days since last session for this client
  const daysSinceLastSession = clientSessions[0]
    ? Math.floor((Date.now() - new Date(clientSessions[0].playedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const quickActions = [
    lastGame && { label: `Devam: ${GAME_LABELS[lastGame]}`, icon: RotateCcw, gameKey: lastGame, color: "var(--color-primary)", description: "Son oynanan oyun" },
    leastPlayed && { label: `Önerilen: ${GAME_LABELS[leastPlayed]}`, icon: Star, gameKey: leastPlayed, color: "var(--color-signal)", description: "Az çalışılan alan" },
    { label: "Hızlı Set", icon: Zap, preset: "quick-mix", color: "var(--color-accent-green)", description: "3 oyunluk karma set" },
  ].filter(Boolean) as Array<{ label: string; icon: typeof Play; gameKey?: PlatformGameKey; preset?: string; color: string; description: string }>;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-line)" }}>
        <div className="flex items-center gap-2">
          <Play size={13} className="text-(--color-text-muted)" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">Hızlı Başlat</span>
        </div>
        <button type="button" onClick={() => setExpanded(v => !v)}
          className="text-[11px] font-semibold text-(--color-primary) bg-transparent border-none cursor-pointer hover:underline">
          {expanded ? "Kapat" : "Tüm oyunlar"}
        </button>
      </div>

      <div className="p-4">
        {/* Active client indicator */}
        {activeClient && (
          <div className="flex items-center gap-2.5 mb-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
              {activeClient.displayName[0]?.toLocaleUpperCase("tr") ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-(--color-text-strong) m-0 truncate">{activeClient.displayName}</p>
              {daysSinceLastSession !== null && (
                <p className="text-[10px] text-(--color-text-muted) m-0">
                  {daysSinceLastSession === 0 ? "Bugün seans yapıldı" : `${daysSinceLastSession} gün önce son seans`}
                </p>
              )}
            </div>
            {clients.length > 1 && (
              <select
                className="text-[10px] bg-transparent border border-(--color-line) rounded-lg px-2 py-1 text-(--color-text-soft) cursor-pointer"
                value={activeClientId}
                onChange={e => onSelectClient(e.target.value)}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Quick action buttons */}
        <div className="space-y-2">
          {quickActions.slice(0, expanded ? undefined : 2).map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => action.gameKey ? onStartGame(action.gameKey) : action.preset ? onStartSessionSet(action.preset) : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-(--color-surface-elevated) group"
                style={{ background: "transparent", border: "1px solid var(--color-line)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in srgb, ${action.color} 13%, transparent)` }}>
                  <Icon size={14} style={{ color: action.color }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-(--color-text-strong) m-0 truncate">{action.label}</p>
                  <p className="text-[11px] text-(--color-text-muted) m-0 mt-0.5">{action.description}</p>
                </div>
                <ChevronRight size={14} className="text-(--color-text-disabled) shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>

        {/* All games grid (expanded) */}
        {expanded && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-line)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) m-0 mb-2.5">Tüm Oyunlar</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {allGames.map(key => {
                const count = gameCounts[key] ?? 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onStartGame(key)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-(--color-surface-elevated)"
                    style={{ background: "transparent", border: "1px solid var(--color-line)" }}
                  >
                    <Gamepad2 size={15} style={{ color: gameAccent(key) }} />
                    <span className="text-[10px] font-medium text-(--color-text-body) text-center leading-tight">{GAME_LABELS[key]}</span>
                    <span className="numeral text-[10px] text-(--color-text-muted)">{count > 0 ? `${count}×` : "—"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
