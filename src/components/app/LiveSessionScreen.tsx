"use client";

/*
 * Canlı Seans kabuğu — tasarım dokümanı 1j/1k.
 *
 * Bu bileşen oyunu oynatmaz; oyunun etrafındaki klinik kabuğu kurar.
 * Oyun tahtası `board` olarak içeri verilir, böylece çalışan yedi oyun
 * olduğu gibi kalır.
 *
 * Kabuğun tamamı tek bir soruya hizmet ediyor: terapist seans sırasında
 * ekrandan gözünü ayırmadan ölçüm alabilmeli. Bu yüzden sağ ray "rapor"
 * değil "kayıt cihazı": ipucu sayaçları tek dokunuş, hızlı not her an
 * yazılabilir, sık gözlemler hazır etiket olarak duruyor.
 *
 * Sidebar burada bilinçli olarak yok — seans tam ekran. Çıkış tek bir
 * düğmeyle ve solda, çünkü yanlışlıkla basılması en pahalı eylem.
 */

import { useState, type ReactNode } from "react";
import { ChevronLeft, Pause, Play, Plus } from "lucide-react";
import type { ClientProfile } from "@/lib/platform-data";
import { Avatar } from "./primitives";

export type SupportKind = "verbal" | "visual" | "physical";

const SUPPORTS: ReadonlyArray<{ key: SupportKind; label: string; dot: string }> = [
  { key: "verbal", label: "Sözel İpucu", dot: "var(--color-primary)" },
  { key: "visual", label: "Görsel İpucu", dot: "var(--color-signature-to)" },
  { key: "physical", label: "Fiziksel Yardım", dot: "var(--color-accent-amber)" },
];

/* Seans sırasında en sık düşülen dört gözlem — yazmak yerine dokunmak için. */
const QUICK_TAGS = ["Dikkat Dağıldı", "Yorgunluk", "İşbirliği İyi", "Frustrasyon"] as const;

export interface LiveMetric {
  label: string;
  value: string;
  unit: string;
  tone?: "green" | "primary" | "amber";
}

interface Props {
  readonly client: ClientProfile | null;
  readonly gameTitle: string;
  readonly gameSubtitle: string;
  readonly elapsed: string;
  readonly paused: boolean;
  readonly onTogglePause: () => void;
  readonly difficulty: string;
  readonly difficultyOptions: readonly string[];
  readonly onDifficultyChange: (d: string) => void;
  readonly onExit: () => void;
  readonly onFinish: () => void;
  /** Tur göstergesi, ör. "Tur 6 / 10" */
  readonly roundLabel: string;
  readonly instruction: ReactNode;
  readonly board: ReactNode;
  /**
   * "card": dokümandaki yuvarlatılmış cam tahta + tur çipi + yönerge.
   * "bare": tahta alanı çıplak — oyun alanı kendi başlığını, yönergesini
   *   ve ipuçlarını zaten üretiyorsa ikisini üst üste basmamak için.
   */
  readonly variant?: "card" | "bare";
  /** Tahta altındaki ilerleme çentikleri ve etiketi */
  readonly progress?: { done: number; total: number; label: string };
  readonly metrics: readonly LiveMetric[];
  /** Tepki izi: her tur için doğru/yanlış */
  readonly trace: readonly boolean[];
  readonly supports: Record<SupportKind, number>;
  readonly onAddSupport: (k: SupportKind) => void;
  readonly note: string;
  readonly onNoteChange: (v: string) => void;
}

export function LiveSessionScreen({
  client,
  gameTitle,
  gameSubtitle,
  elapsed,
  paused,
  onTogglePause,
  difficulty,
  difficultyOptions,
  onDifficultyChange,
  onExit,
  onFinish,
  roundLabel,
  instruction,
  board,
  progress,
  metrics,
  trace,
  supports,
  onAddSupport,
  note,
  onNoteChange,
  variant = "card",
}: Props) {
  const [tagsUsed, setTagsUsed] = useState<readonly string[]>([]);

  const addTag = (t: string) => {
    if (tagsUsed.includes(t)) return;
    setTagsUsed((cur) => [...cur, t]);
    onNoteChange(note ? `${note.trimEnd()} ${t}.` : `${t}.`);
  };

  const correct = trace.filter(Boolean).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Üst çubuk ── */}
      <header
        className="flex items-center gap-4 shrink-0"
        style={{
          height: 68,
          padding: "0 26px",
          background: "var(--color-chrome-header)",
          borderBottom: "1px solid var(--color-line)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary) shrink-0"
          style={{ padding: "9px 14px", borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
        >
          <ChevronLeft size={14} strokeWidth={2.2} />
          Seanstan Çık
        </button>

        {client && (
          <span className="flex items-center gap-[11px] ml-1.5 min-w-0">
            <Avatar name={client.displayName} id={client.id} size={38} radius={12} />
            <span className="min-w-0">
              <span className="block text-[14px] font-bold text-(--color-text-strong) truncate leading-tight">
                {client.displayName}
              </span>
              <span className="block text-[11px] text-(--color-text-soft) truncate leading-tight">
                {gameTitle} · {gameSubtitle} · {difficulty}
              </span>
            </span>
          </span>
        )}

        <div className="ml-auto flex items-center gap-3 shrink-0">
          {/* Canlı sayaç — seansın tek nabzı, bu yüzden tint zeminde */}
          <span
            className="flex items-center gap-2"
            style={{ padding: "9px 15px", borderRadius: 11, background: "var(--color-primary-light)", border: "1px solid var(--color-line-strong)" }}
          >
            <span
              className={paused ? "" : "live-pulse"}
              style={{ width: 8, height: 8, borderRadius: "50%", background: paused ? "var(--color-text-muted)" : "var(--color-primary)" }}
            />
            <span className="numeral text-[10px] font-semibold text-(--color-primary-ink)">
              {paused ? "DURDU" : "CANLI"}
            </span>
            <span className="numeral text-[15px] font-semibold text-(--color-text-strong)">{elapsed}</span>
          </span>

          <div
            className="flex p-[3px] rounded-[10px]"
            style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            role="radiogroup"
            aria-label="Zorluk"
          >
            {difficultyOptions.map((d) => {
              const on = d === difficulty;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onDifficultyChange(d)}
                  className={`text-[11px] font-semibold cursor-pointer border-none transition-colors ${on ? "text-white" : "text-(--color-text-soft) bg-transparent hover:text-(--color-text-body)"}`}
                  style={{ padding: "6px 11px", borderRadius: 7, background: on ? "var(--gradient-signature)" : undefined }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onTogglePause}
            aria-label={paused ? "Devam et" : "Duraklat"}
            title={paused ? "Devam et" : "Duraklat"}
            className="grid place-items-center cursor-pointer transition-colors hover:border-(--color-line-strong)"
            style={{ width: 38, height: 38, borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
          >
            {paused ? <Play size={15} fill="currentColor" className="text-(--color-primary)" /> : <Pause size={15} className="text-(--color-text-body)" />}
          </button>

          <button
            type="button"
            onClick={onFinish}
            className="btn-signature text-[12.5px] font-semibold cursor-pointer"
            style={{ padding: "11px 19px", borderRadius: 12 }}
          >
            Seansı Bitir
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Oyun alanı ── */}
        {variant === "bare" ? (
          <div className="flex-1 flex flex-col min-w-0 min-h-0">{board}</div>
        ) : (
        <div className="flex-1 flex flex-col items-center min-w-0 overflow-y-auto" style={{ padding: 34 }}>
          <div className="flex items-center gap-3 mb-[22px] self-center">
            <span
              className="text-[11px] font-semibold shrink-0"
              style={{ padding: "6px 13px", borderRadius: 9, background: "var(--color-primary-light)", border: "1px solid var(--color-line-strong)", color: "var(--color-primary-ink)" }}
            >
              {roundLabel}
            </span>
            <span className="text-[13px] text-(--color-text-body)">{instruction}</span>
          </div>

          {/* Tahta kabuğu — oyun buraya oturur */}
          <div
            className="shrink-0"
            style={{
              padding: 26,
              borderRadius: 32,
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            {board}
          </div>

          {progress && (
            <div className="flex items-center gap-3 mt-[22px]">
              <span className="flex gap-1.5">
                {Array.from({ length: progress.total }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 22,
                      height: 5,
                      borderRadius: 3,
                      background:
                        i < progress.done
                          ? "var(--color-accent-green)"
                          : i === progress.done
                            ? "var(--gradient-bar)"
                            : "var(--color-line-strong)",
                    }}
                  />
                ))}
              </span>
              <span className="numeral text-[11px] text-(--color-text-soft)">{progress.label}</span>
            </div>
          )}
        </div>
        )}

        {/* ── Canlı ölçüm rayı ── */}
        <aside
          className="hidden xl:flex flex-col shrink-0 gap-3.5 overflow-y-auto"
          style={{
            width: 330,
            padding: 24,
            background: "var(--color-sidebar)",
            borderLeft: "1px solid var(--color-line)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          aria-label="Canlı ölçümler"
        >
          <h2 className="font-display m-0 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
            Canlı Ölçümler
          </h2>

          <div className="grid grid-cols-2 gap-2.5">
            {metrics.map((m) => (
              <div
                key={m.label}
                style={{ padding: "13px 15px", borderRadius: 14, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
              >
                <div className="numeral text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-text-soft) mb-[7px]">
                  {m.label}
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="figure text-[24px] leading-none"
                    style={{
                      color:
                        m.tone === "green"
                          ? "var(--color-accent-green)"
                          : m.tone === "amber"
                            ? "var(--color-accent-amber)"
                            : "var(--color-primary)",
                    }}
                  >
                    {m.value}
                  </span>
                  <span className="text-[11px] font-medium text-(--color-text-soft)">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tepki izi — tur tur doğru/yanlış, seansın ritmi buradan okunur */}
          {trace.length > 0 && (
            <div style={{ padding: "14px 15px", borderRadius: 14, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
              <div className="flex items-center justify-between mb-[9px]">
                <span className="numeral text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-text-soft)">
                  Tepki İzi
                </span>
                <span className="numeral text-[10.5px] font-semibold" style={{ color: "var(--color-accent-green)" }}>
                  {correct}/{trace.length} doğru
                </span>
              </div>
              <div className="flex items-end gap-[3px]" style={{ height: 44 }}>
                {trace.map((ok, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-[2px]"
                    style={{
                      height: `${ok ? 45 + ((i * 13) % 55) : 22 + ((i * 7) % 20)}%`,
                      background: ok ? "var(--color-primary)" : "var(--color-accent-red)",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* İpucu kaydı — seansın klinik verisi; tek dokunuşla artar */}
          <div>
            <div className="numeral text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-text-soft) mb-[9px]">
              İpucu / Destek Kaydı
            </div>
            <div className="flex flex-col gap-2">
              {SUPPORTS.map(({ key, label, dot }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAddSupport(key)}
                  className="flex items-center gap-2.5 cursor-pointer text-left transition-colors hover:border-(--color-line-strong)"
                  style={{ padding: "11px 13px", borderRadius: 12, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
                  <span className="flex-1 text-[12px] font-semibold text-(--color-text-body)">{label}</span>
                  <span className="numeral text-[13px] font-semibold text-(--color-text-strong)">{supports[key]}</span>
                  <Plus size={14} strokeWidth={2.2} className="text-(--color-primary)" />
                </button>
              ))}
            </div>
          </div>

          {/* Hızlı not — seans biterken SOAP notunun ham maddesi */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="numeral text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-text-soft) mb-[9px]">
              Hızlı Not
            </div>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Gözlemini buraya yaz…"
              className="flex-1 min-h-[110px] resize-none outline-none text-[12px] leading-[1.55] text-(--color-text-strong) placeholder:text-(--color-text-muted)"
              style={{ padding: "13px 14px", borderRadius: 14, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            />
            <div className="flex flex-wrap gap-[7px] mt-[9px]">
              {QUICK_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  disabled={tagsUsed.includes(t)}
                  className="text-[10.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary) disabled:opacity-40 disabled:cursor-default"
                  style={{ padding: "6px 11px", borderRadius: 9, background: "var(--color-primary-light)", border: "1px solid var(--color-line)" }}
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
