"use client";

import { useState } from "react";
import { Timer, TrendingUp, Check } from "lucide-react";
import { StarRating } from "./StarRating";
import { ConfettiPieces } from "./ConfettiPieces";

export interface GameResultOverlayProps {
  readonly accent: string;
  readonly gradFrom: string;
  readonly gradTo: string;
  readonly gameName: string;
  readonly score: number;
  readonly bestScore: number;
  readonly stars: number;
  readonly stats: ReadonlyArray<{ label: string; value: string | number }>;
  readonly onReplay: () => void;
  readonly onBack: () => void;
  readonly onSaveNote?: (note: string) => void;
  readonly onSatisfaction?: (rating: number) => void;
  readonly hasActiveClient?: boolean;
  readonly durationSeconds?: number;
  readonly sessionAvg?: number;
  readonly nextInSet?: { gameName: string; onNext: () => void } | null;
}

export function GameResultOverlay({ accent, gradFrom, gradTo, gameName, score, bestScore, stars, stats, onReplay, onBack, onSaveNote, onSatisfaction, hasActiveClient, durationSeconds, sessionAvg, nextInSet }: GameResultOverlayProps) {
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);

  function handleSaveNote() {
    if (!noteText.trim() || !onSaveNote) return;
    onSaveNote(noteText.trim());
    setNoteSaved(true);
  }

  const isNewBest = score >= bestScore && bestScore > 0 && score > 0;
  const prevBest = isNewBest && bestScore < score ? bestScore : 0;

  return (
    <div
      className="result-overlay-in absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden rounded-3xl"
      style={{ background: "rgba(4,8,18,0.97)", backdropFilter: "blur(2px)" }}
    >
      {/* Confetti */}
      <div className="absolute inset-x-0 top-0 h-32 overflow-hidden pointer-events-none">
        <ConfettiPieces count={20} accent={accent} />
      </div>

      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full pointer-events-none" style={{ background: accent, opacity: 0.08, filter: "blur(60px)" }} />
      <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full pointer-events-none" style={{ background: gradTo, opacity: 0.06, filter: "blur(50px)", transform: "translate(20%,20%)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 w-full max-w-sm">
        {/* Game name chip */}
        <div className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}>
          {gameName} · Tamamlandı
        </div>

        {/* Stars */}
        <StarRating stars={stars} accent={accent} />

        {/* Score */}
        <div className="score-count-in flex flex-col items-center">
          <span className="text-white/40 text-xs uppercase tracking-widest font-bold mb-1">Final Skor</span>
          <span className="font-extrabold tabular-nums leading-none" style={{ fontSize: "5rem", lineHeight: 1, background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {score}
          </span>
        </div>

        {/* New best badge */}
        {isNewBest ? (
          <div className="new-best-badge flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: `${accent}20`, border: `1.5px solid ${accent}55` }}>
            <span className="text-lg">🏆</span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest m-0" style={{ color: accent }}>Yeni Rekor!</p>
              <p className="text-white/40 text-xs m-0">Önceki en iyi: <strong className="text-white/60">{prevBest || "—"}</strong></p>
            </div>
          </div>
        ) : bestScore > 0 ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm">📊</span>
            <span className="text-white/40 text-xs">En iyi: <strong className="text-white/60">{bestScore}</strong></span>
          </div>
        ) : null}

        {/* Stats row */}
        <div className="w-full flex gap-2">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`flex-1 flex flex-col items-center py-3 rounded-2xl result-stat-in-${Math.min(i + 1, 3)}`} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <strong className="text-xl font-extrabold tabular-nums leading-none" style={{ color: i === 0 ? accent : "white" }}>{stat.value}</strong>
              <span className="text-white/35 text-[10px] uppercase tracking-wider font-bold mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Replay summary strip */}
        {(durationSeconds || sessionAvg) && (
          <div className="w-full flex gap-2">
            {durationSeconds && (
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Timer size={11} style={{ color: accent, opacity: 0.8 }} />
                <div>
                  <p className="text-white/35 text-[9px] uppercase tracking-wider font-bold m-0">Süre</p>
                  <p className="text-white/70 text-xs font-bold m-0">{Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, "0")}</p>
                </div>
              </div>
            )}
            {sessionAvg !== undefined && sessionAvg > 0 && (
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <TrendingUp size={11} style={{ color: score >= sessionAvg ? "#10b981" : "#f87171", opacity: 0.8 }} />
                <div>
                  <p className="text-white/35 text-[9px] uppercase tracking-wider font-bold m-0">Geçmiş Ort.</p>
                  <p className="text-xs font-bold m-0" style={{ color: score >= sessionAvg ? "#10b981" : "#f87171" }}>
                    {score >= sessionAvg ? "↑" : "↓"} {Math.abs(score - sessionAvg)}p fark
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {nextInSet ? (
          <div className="result-btn-in w-full flex gap-3">
            <button
              type="button"
              onClick={nextInSet.onNext}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border-none cursor-pointer transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`, boxShadow: `0 4px 20px ${accent}40` }}
            >
              <span>▶</span> Sonraki: {nextInSet.gameName}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm text-white/40 cursor-pointer transition-all active:scale-95 hover:text-white/70"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Bırak
            </button>
          </div>
        ) : (
          <div className="result-btn-in w-full flex gap-3">
            <button
              type="button"
              onClick={onReplay}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border-none cursor-pointer transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`, boxShadow: `0 4px 20px ${accent}40` }}
            >
              <span>↩</span> Tekrar Oyna
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm text-white/60 cursor-pointer transition-all active:scale-95 hover:text-white/90"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Oyunlar
            </button>
          </div>
        )}

        {/* Satisfaction rating */}
        {hasActiveClient && (
          <div className="w-full rounded-2xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold m-0">Danışan Memnuniyeti</p>
            <div className="flex justify-between gap-1">
              {([
                { rating: 1, emoji: "😞", label: "Çok zor" },
                { rating: 2, emoji: "😕", label: "Zor" },
                { rating: 3, emoji: "😐", label: "Normal" },
                { rating: 4, emoji: "🙂", label: "İyi" },
                { rating: 5, emoji: "😄", label: "Harika" },
              ] as const).map(({ rating, emoji, label }) => (
                <button key={rating} type="button"
                  title={label}
                  className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl border-none cursor-pointer transition-all"
                  style={{ background: satisfaction === rating ? `${accent}25` : "transparent", outline: satisfaction === rating ? `1.5px solid ${accent}` : "1.5px solid transparent", opacity: satisfaction && satisfaction !== rating ? 0.4 : 1 }}
                  onClick={() => { setSatisfaction(rating); onSatisfaction?.(rating); }}>
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="text-[9px] text-white/40 font-semibold">{rating}</span>
                </button>
              ))}
            </div>
            {satisfaction !== null && (
              <p className="text-[10px] font-bold text-center m-0" style={{ color: accent }}>
                {["", "Çok zor gelmiş", "Biraz zorlandı", "Normal bir seans", "Keyif aldı", "Mükemmel seans!"][satisfaction]}
              </p>
            )}
          </div>
        )}

        {/* Post-game note */}
        {hasActiveClient && onSaveNote && (
          <div className="w-full rounded-2xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold m-0">Seans Notu</p>
            {noteSaved ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: accent }}>
                <Check size={12} /> Not kaydedildi
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Bu oyun için kısa not..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white/70 placeholder-white/25"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(); }}
                />
                <button type="button" onClick={handleSaveNote} disabled={!noteText.trim()}
                  className="shrink-0 px-3 py-1 rounded-xl text-xs font-bold border-none cursor-pointer disabled:opacity-40"
                  style={{ background: `${accent}30`, color: accent }}>
                  Kaydet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
