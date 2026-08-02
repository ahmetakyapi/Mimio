"use client";

/*
 * Aktivite Kitaplığı — tasarım dokümanı 1t/1u.
 *
 * Üç sütun: solda uygulama alanı + filtre, ortada aktivite akışı, sağda
 * seçili aktivitenin uygulama adımları.
 *
 * Önceki hâli altı sekmeli bir gezintiydi (Alanlar → Aktiviteler → Oyun
 * eşleme → …). Terapist bir aktiviteyi seans sırasında arıyor; her bakışta
 * üç tıklama derine inmesi gerekiyordu. Üç sütun aynı anda "hangi alan",
 * "hangi aktivite", "nasıl uygulanır" sorularını açık tutuyor.
 *
 * Kanıt atfı (Case-Smith, Kessels, Treisman & Gelade, Dunn) kartın üstünde
 * duruyor: kanıta dayalı olduğunu iddia eden bir kitaplıkta kaynak, aranıp
 * bulunacak bir detay değil kimlik bilgisidir.
 */

import { useMemo, useState } from "react";
import { Check, Plus, Clock, Package, Home } from "lucide-react";
import {
  THERAPY_DOMAINS,
  GAME_THERAPY_MAPPINGS,
  type TherapyActivity,
  type TherapyDomainKey,
} from "@/lib/therapy-program-data";
import { gameTitle } from "@/lib/deniz-derive";
import { Eyebrow, ScreenHeader } from "./primitives";

type Filter = "home" | "evidence" | "noMaterial";

const FILTERS: ReadonlyArray<{ key: Filter; label: string }> = [
  { key: "home", label: "Ev Programına Uygun" },
  { key: "evidence", label: "Kanıt Atfı Olan" },
  { key: "noMaterial", label: "Malzeme Gerektirmez" },
];

interface Props {
  readonly onAddToPlan: (activity: TherapyActivity) => void;
}

export function ActivityLibraryScreen({ onAddToPlan }: Props) {
  const [domainKey, setDomainKey] = useState<TherapyDomainKey | "all">("all");
  const [filters, setFilters] = useState<readonly Filter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = useMemo(
    () => THERAPY_DOMAINS.flatMap((d) => d.activities.map((a) => ({ ...a, domainKey: d.key, domainLabel: d.label, domainColor: d.color }))),
    [],
  );

  const homeCount = all.filter((a) => a.homeExercise).length;

  const rows = useMemo(() => {
    return all.filter((a) => {
      if (domainKey !== "all" && a.domainKey !== domainKey) return false;
      if (filters.includes("home") && !a.homeExercise) return false;
      if (filters.includes("evidence") && !a.evidenceBase) return false;
      if (filters.includes("noMaterial") && a.materials.length > 0) return false;
      return true;
    });
  }, [all, domainKey, filters]);

  const selected = rows.find((a) => a.id === selectedId) ?? rows[0] ?? null;

  /* Aktivitenin alt becerisiyle örtüşen oyunlar — eşleşme tablosundan. */
  const matchedGames = useMemo(() => {
    if (!selected) return [];
    return GAME_THERAPY_MAPPINGS
      .filter((mp) => mp.suitableDomains.includes(selected.domainKey))
      .slice(0, 3)
      .map((mp) => gameTitle(mp.gameKey as never));
  }, [selected]);

  const toggle = (f: Filter) =>
    setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <ScreenHeader
        eyebrow={`${all.length} aktivite · ${homeCount}'si ev programına uygun`}
        title="Aktivite Kitaplığı"
        sub="AOTA OTPF-4 ve WHO ICF çerçevesiyle etiketlendi."
        actions={
          selected ? (
            <button
              type="button"
              onClick={() => onAddToPlan(selected)}
              className="btn-signature flex items-center gap-2 px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.2} /> Plana Ekle
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: "250px minmax(0,1fr) 316px" }}>
        {/* ── Sol: alan + filtre ── */}
        <div className="flex flex-col gap-3.5 overflow-y-auto min-h-0">
          <div className="glass rounded-[18px]" style={{ padding: "18px 20px" }}>
            <Eyebrow className="mb-3">Uygulama Alanı</Eyebrow>
            <div className="flex flex-col gap-0.5">
              <DomainRow label="Tümü" count={all.length} on={domainKey === "all"} onClick={() => setDomainKey("all")} />
              {THERAPY_DOMAINS.map((d) => (
                <DomainRow
                  key={d.key}
                  label={d.label}
                  count={d.activities.length}
                  color={d.color}
                  on={domainKey === d.key}
                  onClick={() => setDomainKey(d.key)}
                />
              ))}
            </div>
          </div>

          <div className="glass rounded-[18px]" style={{ padding: "18px 20px" }}>
            <Eyebrow className="mb-3">Filtre</Eyebrow>
            <div className="flex flex-col gap-1">
              {FILTERS.map((f) => {
                const on = filters.includes(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggle(f.key)}
                    aria-pressed={on}
                    className="flex items-center gap-2.5 text-left cursor-pointer bg-transparent border-none text-[12px] font-medium text-(--color-text-body)"
                    style={{ padding: "7px 0" }}
                  >
                    <span
                      className="grid place-items-center shrink-0"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 5,
                        background: on ? "var(--gradient-signature)" : "transparent",
                        border: on ? "none" : "1px solid var(--color-line-strong)",
                      }}
                    >
                      {on && <Check size={10} strokeWidth={3.5} color="#fff" />}
                    </span>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Orta: aktivite akışı ── */}
        <div className="flex flex-col gap-2 overflow-y-auto min-h-0 pr-1">
          {rows.length === 0 ? (
            <div className="glass rounded-[18px] flex-1 grid place-items-center">
              <p className="m-0 text-[12.5px] text-(--color-text-soft)">Bu filtreyle eşleşen aktivite yok.</p>
            </div>
          ) : (
            rows.map((a) => {
              const on = selected?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  aria-pressed={on}
                  className="text-left cursor-pointer transition-colors"
                  style={{
                    padding: "14px 16px",
                    borderRadius: 15,
                    background: on ? "var(--gradient-signature-soft)" : "var(--color-surface)",
                    border: `1px solid ${on ? "var(--color-line-strong)" : "var(--color-line)"}`,
                  }}
                >
                  <span className="block text-[13px] font-bold text-(--color-text-strong) mb-1">{a.label}</span>
                  <span className="block text-[11px] text-(--color-text-soft) mb-2.5">
                    {a.subSkill} · {a.activityType}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <Chip icon={<Clock size={10} />}>{a.sessionMinutes} dk</Chip>
                    {a.homeExercise && <Chip icon={<Home size={10} />} tone="green">Ev Programı</Chip>}
                    {a.materials.length === 0 && <Chip icon={<Package size={10} />}>Malzemesiz</Chip>}
                    {a.evidenceBase && <Chip tone="violet">{a.evidenceBase}</Chip>}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* ── Sağ: uygulama ── */}
        {selected && (
          <div className="glass rounded-[18px] flex flex-col overflow-y-auto min-h-0" style={{ padding: "20px 22px" }}>
            <span
              className="self-start text-[10.5px] font-semibold mb-2.5"
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                background: `color-mix(in srgb, ${selected.domainColor} 13%, transparent)`,
                color: selected.domainColor,
              }}
            >
              {selected.subSkill}
            </span>

            <h2 className="font-display m-0 mb-2 text-[16px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
              {selected.label}
            </h2>
            <p className="m-0 mb-4 text-[11.5px] leading-[1.6] text-(--color-text-body)">{selected.description}</p>

            {selected.therapistTips && selected.therapistTips.length > 0 && (
              <>
                <Eyebrow className="mb-2.5">Uygulama Adımları</Eyebrow>
                <div className="flex flex-col mb-4">
                  {selected.therapistTips.map((tip, i) => (
                    <div key={tip} className="flex gap-2.5" style={{ padding: "6px 0" }}>
                      <span
                        className="numeral grid place-items-center shrink-0 text-[9.5px] font-bold"
                        style={{ width: 18, height: 18, borderRadius: 6, background: "var(--color-primary-light)", color: "var(--color-primary-ink)" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[11.5px] leading-[1.5] text-(--color-text-body)">{tip}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selected.materials.length > 0 && (
              <>
                <Eyebrow className="mb-2">Malzeme</Eyebrow>
                <span className="flex flex-wrap gap-1.5 mb-4">
                  {selected.materials.map((mt) => <Chip key={mt}>{mt}</Chip>)}
                </span>
              </>
            )}

            {matchedGames.length > 0 && (
              <>
                <span className="block mb-3" style={{ height: 1, background: "var(--color-line)" }} />
                <Eyebrow className="mb-2">Eşleşen Oyunlar</Eyebrow>
                <span className="flex flex-wrap gap-[7px] mb-4">
                  {matchedGames.map((g) => <Chip key={g} tone="primary">{g}</Chip>)}
                </span>
              </>
            )}

            <button
              type="button"
              onClick={() => onAddToPlan(selected)}
              className="btn-signature w-full mt-auto text-[12px] font-semibold cursor-pointer"
              style={{ padding: 11, borderRadius: 12 }}
            >
              Plana Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DomainRow({ label, count, color, on, onClick }: {
  readonly label: string; readonly count: number; readonly color?: string;
  readonly on: boolean; readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex items-center gap-2.5 text-left cursor-pointer border-none transition-colors"
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        background: on ? "var(--gradient-signature-soft)" : "transparent",
      }}
    >
      {color && <span className="shrink-0" style={{ width: 7, height: 7, borderRadius: 2, background: color }} />}
      <span className={`flex-1 text-[12px] truncate ${on ? "font-semibold text-(--color-primary-ink)" : "font-medium text-(--color-text-body)"}`}>
        {label}
      </span>
      <span className="numeral text-[10.5px] text-(--color-text-soft) shrink-0">{count}</span>
    </button>
  );
}

function Chip({ children, icon, tone }: {
  readonly children: React.ReactNode; readonly icon?: React.ReactNode; readonly tone?: "green" | "violet" | "primary";
}) {
  const bg =
    tone === "green" ? "color-mix(in srgb, var(--color-accent-green) 12%, transparent)"
      : tone === "violet" ? "color-mix(in srgb, var(--color-accent-violet) 12%, transparent)"
      : tone === "primary" ? "var(--color-primary-light)"
      : "var(--color-surface-strong)";
  const fg =
    tone === "green" ? "var(--color-accent-green)"
      : tone === "violet" ? "var(--color-accent-violet)"
      : tone === "primary" ? "var(--color-primary-ink)"
      : "var(--color-text-soft)";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold"
      style={{ padding: "4px 9px", borderRadius: 7, background: bg, color: fg }}
    >
      {icon}{children}
    </span>
  );
}
