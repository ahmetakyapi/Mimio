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
 *
 * **Telefonda üç sütun üç kata döner.** Üç sütun tek sütuna inince sıra
 * "alan listesi → filtre → aktiviteler → uygulama" oluyordu: sekiz alan
 * satırı ve üç filtre, ilk aktiviteyi ikinci ekranın altına itiyordu; sağ
 * sütundaki uygulama adımları ise 35 satırın dibine düşüyordu. Küçük ekranda
 * kurgu değişir — alan ve filtre tek satırlık daraltılabilir bir başlığa
 * iner, aktivite listesi hemen başlar, uygulama adımları seçilen satırın
 * altında açılır. Aynı veri, parmakla ulaşılabilir sıra.
 */

import { Fragment, useMemo, useState } from "react";
import { Check, Plus, Clock, Package, Home, ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  THERAPY_DOMAINS,
  GAME_THERAPY_MAPPINGS,
  type TherapyActivity,
  type TherapyDomainKey,
} from "@/lib/therapy-program-data";
import { gameTitle } from "@/lib/deniz-derive";
import { Eyebrow, ScreenHeader } from "./primitives";

type Filter = "home" | "evidence" | "noMaterial";

/** Aktivite + ait olduğu alanın kimliği — liste ve uygulama paneli aynı satırı okur. */
type LibraryRow = TherapyActivity & {
  readonly domainKey: TherapyDomainKey;
  readonly domainLabel: string;
  readonly domainColor: string;
};

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
  /* Yalnızca telefonda anlamı var: alan + filtre panelinin açık olup olmadığı.
     Masaüstünde panel `lg:` ile her zaman görünür, bu durum okunmaz. */
  const [panelOpen, setPanelOpen] = useState(false);

  const all = useMemo<readonly LibraryRow[]>(
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

  const domainLabel = domainKey === "all"
    ? "Tümü"
    : THERAPY_DOMAINS.find((d) => d.key === domainKey)?.label ?? "Tümü";

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

      <div className="grid gap-4 flex-1 min-h-0 deniz-split" style={{ ["--split" as string]: "250px minmax(0,1fr) 316px" }}>
        {/* ── Sol: alan + filtre ── */}
        <div className="flex flex-col gap-3.5 overflow-y-auto min-h-0">
          {/*
           * Telefonda panelin tamamı yerine tek satırlık özeti durur: hangi
           * alandayız, kaç aktivite kaldı, kaç filtre açık. Dokununca açılır.
           * Kapalıyken 46px yer kaplar — aktivite listesi ekranın üstünde
           * başlar; önceki hâlde ilk aktiviteye ulaşmak iki ekran kaydırma
           * istiyordu.
           */}
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            className="lg:hidden glass rounded-[15px] w-full flex items-center gap-3 text-left cursor-pointer"
            style={{ padding: "10px 14px" }}
          >
            <SlidersHorizontal size={15} strokeWidth={1.9} className="shrink-0 text-(--color-text-soft)" />
            <span className="flex-1 min-w-0">
              <span className="block text-[12px] font-semibold text-(--color-text-strong) truncate">{domainLabel}</span>
              <span className="numeral block text-[10px] text-(--color-text-soft)">
                {rows.length} aktivite{filters.length > 0 ? ` · ${filters.length} filtre` : ""}
              </span>
            </span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`shrink-0 text-(--color-text-soft) transition-transform ${panelOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className={`glass rounded-[18px] ${panelOpen ? "" : "max-lg:hidden"}`}
            style={{ padding: "18px 20px" }}
          >
            <Eyebrow className="mb-3">Uygulama Alanı</Eyebrow>
            <div className="flex flex-col gap-0.5">
              <DomainRow
                label="Tümü"
                count={all.length}
                on={domainKey === "all"}
                onClick={() => { setDomainKey("all"); setPanelOpen(false); }}
              />
              {THERAPY_DOMAINS.map((d) => (
                <DomainRow
                  key={d.key}
                  label={d.label}
                  count={d.activities.length}
                  color={d.color}
                  on={domainKey === d.key}
                  /* Alan seçmek tek adımlık bir karar; telefonda panel kapanıp
                     kullanıcıyı sonucun başına döndürür. */
                  onClick={() => { setDomainKey(d.key); setPanelOpen(false); }}
                />
              ))}
            </div>
          </div>

          <div
            className={`glass rounded-[18px] ${panelOpen ? "" : "max-lg:hidden"}`}
            style={{ padding: "18px 20px" }}
          >
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
        <div className="flex flex-col gap-2.5 lg:gap-2 overflow-y-auto min-h-0 pr-1">
          {rows.length === 0 ? (
            <div className="glass rounded-[18px] flex-1 grid place-items-center" style={{ padding: "28px 20px" }}>
              <p className="m-0 text-[12.5px] text-(--color-text-soft)">Bu filtreyle eşleşen aktivite yok.</p>
            </div>
          ) : (
            rows.map((a) => {
              const on = selected?.id === a.id;
              /* Telefonda uygulama paneli satırın altında açılır; varsayılan
                 seçim (`rows[0]`) listeyi kendiliğinden açmasın diye yalnızca
                 açıkça dokunulan satır genişler. */
              const expanded = selectedId === a.id;
              return (
                <Fragment key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    aria-pressed={on}
                    aria-expanded={expanded}
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
                      {/* Kanıt atfı tam bir künye — masaüstünde satırın altında
                          okunabiliyor. Telefonda aynı metin dört satırlık mor
                          bir levhaya dönüşüyor, 35 satırlık liste okunmaz
                          oluyordu. Küçük ekranda yerine rozeti geçer; künyenin
                          tamamı satıra dokununca açılan panelde durur. */}
                      {a.evidenceBase && (
                        <>
                          <Chip tone="violet" className="lg:hidden">Kanıt Atfı</Chip>
                          <Chip tone="violet" className="max-lg:hidden">{a.evidenceBase}</Chip>
                        </>
                      )}
                    </span>
                  </button>

                  {expanded && (
                    <ActivityDetail
                      activity={a}
                      games={matchedGames}
                      onAdd={() => onAddToPlan(a)}
                      className="lg:hidden"
                      showEvidence
                    />
                  )}
                </Fragment>
              );
            })
          )}
        </div>

        {/* ── Sağ: uygulama ── (telefonda seçili satırın altına taşındı) */}
        {selected && (
          <ActivityDetail
            activity={selected}
            games={matchedGames}
            onAdd={() => onAddToPlan(selected)}
            className="max-lg:hidden overflow-y-auto min-h-0"
            stretch
          />
        )}
      </div>
    </div>
  );
}

/**
 * Aktivitenin uygulama paneli. Masaüstünde sağ sütun, telefonda seçili
 * satırın altında açılan katman — aynı içerik, iki yerleşim.
 *
 * `stretch` yalnızca sütun hâlinde anlamlı: "Plana Ekle" düğmesini kartın
 * dibine iter. Satır altında açıldığında düğme metnin hemen ardından gelmeli,
 * yoksa panel boş bir boşlukla uzuyor.
 */
function ActivityDetail({ activity, games, onAdd, className = "", stretch = false, showEvidence = false }: {
  readonly activity: LibraryRow;
  readonly games: readonly string[];
  readonly onAdd: () => void;
  readonly className?: string;
  readonly stretch?: boolean;
  readonly showEvidence?: boolean;
}) {
  return (
    <div className={`glass rounded-[18px] flex flex-col ${className}`} style={{ padding: "20px 22px" }}>
      <span
        className="self-start text-[10.5px] font-semibold mb-2.5"
        style={{
          padding: "4px 10px",
          borderRadius: 7,
          background: `color-mix(in srgb, ${activity.domainColor} 13%, transparent)`,
          color: activity.domainColor,
        }}
      >
        {activity.subSkill}
      </span>

      <h2 className="font-display m-0 mb-2 text-[15px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
        {activity.label}
      </h2>
      <p className="m-0 mb-4 text-[11.5px] leading-[1.6] text-(--color-text-body)">{activity.description}</p>

      {activity.therapistTips && activity.therapistTips.length > 0 && (
        <>
          <Eyebrow className="mb-2.5">Uygulama Adımları</Eyebrow>
          <div className="flex flex-col mb-4">
            {activity.therapistTips.map((tip, i) => (
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

      {activity.materials.length > 0 && (
        <>
          <Eyebrow className="mb-2">Malzeme</Eyebrow>
          <span className="flex flex-wrap gap-1.5 mb-4">
            {activity.materials.map((mt) => <Chip key={mt}>{mt}</Chip>)}
          </span>
        </>
      )}

      {/* Listedeki künye telefonda kırpıldığı için tamamı burada durur;
          masaüstünde liste zaten tam metni gösteriyor, panel tekrarlamaz. */}
      {showEvidence && activity.evidenceBase && (
        <>
          <Eyebrow className="mb-2">Kanıt Atfı</Eyebrow>
          <p className="m-0 mb-4 text-[11px] leading-[1.55] text-(--color-text-soft)">{activity.evidenceBase}</p>
        </>
      )}

      {games.length > 0 && (
        <>
          <span className="block mb-3" style={{ height: 1, background: "var(--color-line)" }} />
          <Eyebrow className="mb-2">Eşleşen Oyunlar</Eyebrow>
          <span className="flex flex-wrap gap-[7px] mb-4">
            {games.map((g) => <Chip key={g} tone="primary">{g}</Chip>)}
          </span>
        </>
      )}

      <button
        type="button"
        onClick={onAdd}
        className={`btn-signature w-full text-[12px] font-semibold cursor-pointer ${stretch ? "mt-auto" : ""}`}
        style={{ padding: 11, borderRadius: 12 }}
      >
        Plana Ekle
      </button>
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

function Chip({ children, icon, tone, className = "" }: {
  readonly children: React.ReactNode; readonly icon?: React.ReactNode;
  readonly tone?: "green" | "violet" | "primary"; readonly className?: string;
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
      className={`inline-flex items-center gap-1 text-[10px] font-semibold ${className}`}
      style={{ padding: "4px 9px", borderRadius: 7, background: bg, color: fg }}
    >
      {icon}{children}
    </span>
  );
}
