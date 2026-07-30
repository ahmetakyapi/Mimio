"use client";

import type { SessionSetState } from "@/lib/game-types";

interface SessionSetSummaryProps {
  readonly sessionSet: SessionSetState;
  readonly onClose: () => void;
  readonly onNewSet: () => void;
}

export function SessionSetSummary({ sessionSet, onClose, onNewSet }: SessionSetSummaryProps) {
  const total = sessionSet.entries.reduce((sum, e) => sum + e.score, 0);
  const maxPossible = sessionSet.games.length * 100;
  const pct = Math.round((total / Math.max(maxPossible, 1)) * 100);
  const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : pct >= 20 ? 1 : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(8,13,12,0.92)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-md mx-4 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(160deg, #0e1a28 0%, #0a1622 100%)", border: "1px solid rgba(29, 90, 140,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #1d5a8c, #4a95cc, #b8503f)" }} />

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: "linear-gradient(135deg, rgba(29, 90, 140,0.2), rgba(74, 149, 204,0.1))", border: "1px solid rgba(29, 90, 140,0.3)" }}>
              🏁
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#4a95cc] m-0">{sessionSet.presetLabel} · Tamamlandı</p>
              <h3 className="text-white font-extrabold text-lg m-0 leading-tight">Seri Özeti</h3>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => (
              <span key={i} className="text-3xl transition-all" style={{ filter: i <= stars ? "none" : "grayscale(1) opacity(0.25)" }}>⭐</span>
            ))}
          </div>

          <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(29, 90, 140,0.08)", border: "1px solid rgba(29, 90, 140,0.2)" }}>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold m-0 mb-1">Toplam Skor</p>
            <span className="font-extrabold tabular-nums" style={{ fontSize: "3.5rem", lineHeight: 1, background: "linear-gradient(135deg, #4a95cc, #4a95cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {total}
            </span>
            <p className="text-white/35 text-xs m-0 mt-1">{sessionSet.entries.length}/{sessionSet.games.length} oyun tamamlandı · %{pct}</p>
          </div>

          <div className="space-y-2">
            {sessionSet.entries.map((entry, i) => {
              const accent = (["#8ba0b0", "#9db0be", "#8ba0b0", "#9db0be", "#a9bac6", "#b6c4cf", "#4a95cc"] as const)[i % 7];
              return (
                <div key={`${entry.gameKey}-${i}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0" style={{ background: `${accent}18`, color: accent }}>
                    {i + 1}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-white/80">{entry.label}</span>
                  <span className="font-extrabold tabular-nums text-sm" style={{ color: accent }}>{entry.score}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onNewSet}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border-none cursor-pointer transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #1d5a8c, #4a95cc)", boxShadow: "0 4px 20px rgba(29, 90, 140,0.35)" }}>
              ↩ Yeni Set
            </button>
            <button type="button" onClick={onClose}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm text-white/60 cursor-pointer transition-all active:scale-95 hover:text-white/90"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
