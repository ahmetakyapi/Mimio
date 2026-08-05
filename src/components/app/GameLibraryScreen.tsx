"use client";

/*
 * Oyun Kitaplığı — tasarım dokümanı 1l/1m.
 *
 * Dokümanın oyun akışı üç ekrana bölünür ve bu ilki:
 *
 *   Kitaplık (seç) → Canlı Seans (oyna) → Seans Sonu (kaydet)
 *
 * Buradaki iş "hangi oyunu oynayacağım" değil, "bu danışan için hangi
 * paradigma doğru": bu yüzden her kart oyunun adından önce dayandığı testi
 * söylüyor (Corsi Blok, Fitts 1954, Treisman & Gelade) ve yanında o
 * danışandaki oturum sayısı, ortalama skor, zorluk aralığı duruyor.
 */

import { useMemo, useState } from "react";
import { Sparkles, ChevronDown, Layers } from "lucide-react";
import type { ClientProfile, RecentSessionEntry, PlatformGameKey } from "@/lib/platform-data";
import { GAME_TABS } from "@/lib/game-constants";
import { DOMAIN_META, DOMAIN_ORDER, gameDomain, type DomainKey } from "@/lib/deniz-derive";
import { Avatar, ScreenHeader, SegmentedControl } from "./primitives";

/*
 * Her oyunun dayandığı paradigma ve alan etiketi. Oyun sabitlerindeki
 * `kicker` pazarlama dili taşıyor ("Çalışma belleği"); doküman burada
 * literatür atfını istiyor, o yüzden ayrı bir tablo.
 */
const PARADIGM: Record<string, { tag: string; source: string }> = {
  memory:     { tag: "Çalışma belleği",        source: "Corsi Blok Testi — görsel-uzamsal" },
  pairs:      { tag: "Görsel-uzamsal bellek",  source: "Görsel eşleştirme, sistematik arama" },
  pulse:      { tag: "Motor beceri",           source: "Fitts (1954) hız-doğruluk" },
  route:      { tag: "Yürütücü işlev",         source: "Yön komutu işleme, inhibisyon" },
  difference: { tag: "Görsel algı",            source: "Figür-zemin ayrımı" },
  scan:       { tag: "Seçici dikkat",          source: "Visual Search (Treisman & Gelade)" },
  logic:      { tag: "Akıl yürütme",           source: "3×3 matris örüntü tamamlama" },
};

type Filter = "all" | DomainKey;

interface Props {
  readonly clients: readonly ClientProfile[];
  readonly activeClient: ClientProfile | null;
  readonly onSelectClient: (id: string) => void;
  readonly sessions: readonly RecentSessionEntry[];
  readonly activityCount: number;
  readonly onStart: (gameKey: PlatformGameKey) => void;
  readonly onStartSequence: (keys: readonly PlatformGameKey[]) => void;
  readonly onOpenSetPicker: () => void;
}

export function GameLibraryScreen({
  clients,
  activeClient,
  onSelectClient,
  sessions,
  activityCount,
  onStart,
  onStartSequence,
  onOpenSetPicker,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [pickerOpen, setPickerOpen] = useState(false);

  /* Oyun başına oturum ve ortalama — seçili danışan varsa ona daralır. */
  const stats = useMemo(() => {
    const scope = activeClient ? sessions.filter((s) => s.clientId === activeClient.id) : sessions;
    const map = new Map<string, { count: number; total: number }>();
    for (const s of scope) {
      const cur = map.get(s.gameKey) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += s.score;
      map.set(s.gameKey, cur);
    }
    return map;
  }, [sessions, activeClient]);

  const games = useMemo(
    () => (filter === "all" ? GAME_TABS : GAME_TABS.filter((g) => gameDomain(g.key as PlatformGameKey) === filter)),
    [filter],
  );

  /*
   * Önerilen sıra: danışanın en zayıf iki alanı. Kural tabanlı — hiç seans
   * yoksa öneri de yok, uydurma bir sıra göstermiyoruz.
   */
  const suggestion = useMemo(() => {
    if (!activeClient) return null;
    const mine = sessions.filter((s) => s.clientId === activeClient.id);
    if (mine.length < 3) return null;

    const byGame = new Map<string, number[]>();
    for (const s of mine) {
      const arr = byGame.get(s.gameKey) ?? [];
      arr.push(s.score);
      byGame.set(s.gameKey, arr);
    }
    const ranked = Array.from(byGame.entries())
      .map(([key, xs]) => ({ key: key as PlatformGameKey, avg: xs.reduce((a, b) => a + b, 0) / xs.length }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 2);
    if (ranked.length < 2) return null;

    return {
      keys: ranked.map((r) => r.key),
      labels: ranked.map((r) => {
        const g = GAME_TABS.find((t) => t.key === r.key);
        const level = r.avg < 60 ? "Kolay" : r.avg < 80 ? "Orta" : "Zor";
        return `${g?.title ?? r.key} (${level})`;
      }),
      minutes: ranked.length * 9,
    };
  }, [activeClient, sessions]);

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <ScreenHeader
        eyebrow={`${GAME_TABS.length} oyun · ${activityCount} kanıt temelli aktivite`}
        title="Terapi Oyunları"
        sub="Her oyun literatürde doğrulanmış bir paradigmaya dayanır."
        actions={
          <>
            {clients.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={pickerOpen}
                  className="flex items-center gap-2 cursor-pointer transition-colors hover:border-(--color-line-strong)"
                  style={{
                    padding: "5px 12px 5px 5px",
                    borderRadius: 12,
                    background: "var(--color-surface-strong)",
                    border: "1px solid var(--color-line)",
                  }}
                >
                  {activeClient ? (
                    <>
                      <Avatar name={activeClient.displayName} id={activeClient.id} size={26} radius={9} />
                      <span className="text-[12.5px] font-semibold text-(--color-text-strong)">
                        {activeClient.displayName}
                      </span>
                    </>
                  ) : (
                    <span className="text-[12.5px] font-semibold text-(--color-text-soft) pl-2">Danışan seç</span>
                  )}
                  <ChevronDown size={13} className="text-(--color-text-muted)" />
                </button>

                {pickerOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Kapat"
                      onClick={() => setPickerOpen(false)}
                      className="fixed inset-0 z-40 cursor-default border-none bg-transparent"
                    />
                    <ul
                      role="listbox"
                      className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl overflow-hidden list-none p-1 m-0"
                      style={{
                        background: "var(--color-surface-strong)",
                        border: "1px solid var(--color-line-strong)",
                        boxShadow: "var(--shadow-lg)",
                      }}
                    >
                      {clients.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={c.id === activeClient?.id}
                            onClick={() => { onSelectClient(c.id); setPickerOpen(false); }}
                            className="w-full flex items-center gap-2.5 text-left cursor-pointer border-none bg-transparent transition-colors hover:bg-(--color-primary)/8"
                            style={{ padding: "8px 10px", borderRadius: 10 }}
                          >
                            <Avatar name={c.displayName} id={c.id} size={24} radius={8} />
                            <span className="text-[12.5px] font-medium text-(--color-text-body) truncate">
                              {c.displayName}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Hazır setler (Günlük Rutin, Hafıza Seti…) koddaydı ama seçici
                hiçbir düğmeden açılmıyordu. */}
            <button
              type="button"
              onClick={onOpenSetPicker}
              className="flex items-center gap-2 text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
              style={{ padding: "9px 14px", borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            >
              <Layers size={14} /> Oyun Seti
            </button>
            {/* Dört alanın dördü de filtrelenebilir olmalı — önceki hâl yalnızca
                Bilişsel ve Motor'u sunuyor, yedi oyunun dördünü (bellek ve
                görsel alan) hiçbir filtreyle bulunamaz bırakıyordu. */}
            <SegmentedControl
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all" as Filter, label: "Tümü" },
                ...DOMAIN_ORDER.map((k) => ({ value: k as Filter, label: DOMAIN_META[k].label })),
              ]}
            />
          </>
        }
      />

      {/* Önerilen sıra — kitaplığın üstünde tek satırlık karar şeridi */}
      {suggestion && activeClient && (
        <div
          className="flex items-center gap-3 flex-wrap"
          style={{
            padding: "14px 18px",
            borderRadius: 15,
            background: "var(--gradient-signature-soft)",
            border: "1px solid var(--color-line-strong)",
          }}
        >
          <Sparkles size={15} strokeWidth={1.9} className="shrink-0" style={{ color: "var(--color-primary)" }} />
          <span className="text-[12.5px] text-(--color-text-body) flex-1 min-w-0">
            <strong className="font-bold text-(--color-text-strong)">{activeClient.displayName.split(" ")[0]}</strong> için
            önerilen sıra:{" "}
            <strong className="font-bold text-(--color-text-strong)">{suggestion.labels.join(" → ")}</strong>
            {" "}· toplam ~{suggestion.minutes} dk
          </span>
          <button
            type="button"
            onClick={() => onStartSequence(suggestion.keys)}
            className="btn-signature shrink-0 text-[12px] font-semibold cursor-pointer"
            style={{ padding: "9px 16px", borderRadius: 10 }}
          >
            Sırayı Başlat
          </button>
        </div>
      )}

      {/* Oyun ızgarası */}
      <div
        className="grid gap-[13px] flex-1 min-h-0 overflow-y-auto content-start pb-1"
        style={{ gridTemplateColumns: "var(--card-cols, repeat(4, minmax(0, 1fr)))" }}
      >
        {games.map((g) => {
          const key = g.key as PlatformGameKey;
          const meta = PARADIGM[g.key] ?? { tag: g.kicker, source: g.blurb };
          const domain = gameDomain(key);
          const color = domain ? DOMAIN_META[domain].color : "var(--color-primary)";
          const st = stats.get(g.key);
          const avg = st && st.count ? Math.round(st.total / st.count) : null;

          return (
            <article
              key={g.key}
              className="glass rounded-[18px] flex flex-col self-start"
              style={{ padding: 14 }}
            >
              {/* Önizleme — oyunun görsel imzası, ekran görüntüsü değil şema */}
              <div
                className="grid place-items-center shrink-0 mb-[11px]"
                style={{
                  height: 78,
                  borderRadius: 14,
                  background:
                    "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 7%, transparent), color-mix(in srgb, var(--color-signature-to) 5%, transparent))",
                }}
              >
                <GamePreview gameKey={g.key} />
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                <span
                  className="self-start text-[10px] font-semibold mb-[9px]"
                  style={{
                    padding: "4px 10px",
                    borderRadius: 7,
                    background: `color-mix(in srgb, ${color} 13%, transparent)`,
                    color,
                  }}
                >
                  {meta.tag}
                </span>

                <h3 className="font-display m-0 mb-1 text-[15px] font-bold text-(--color-text-strong) tracking-[-0.02em]">
                  {g.title}
                </h3>
                <p className="m-0 mb-[9px] text-[11px] leading-[1.45] text-(--color-text-soft)">{meta.source}</p>

                <div className="flex items-end gap-3 mt-auto" style={{ padding: "7px 0" }}>
                  <span>
                    <span className="numeral block text-[13px] font-semibold text-(--color-text-strong) leading-none">
                      {st?.count ?? 0}
                    </span>
                    <span className="numeral block text-[9px] text-(--color-text-soft) mt-1">oturum</span>
                  </span>
                  <span>
                    <span className="numeral block text-[13px] font-semibold leading-none" style={{ color: avg === null ? "var(--color-text-muted)" : "var(--color-primary)" }}>
                      {avg ?? "—"}
                    </span>
                    <span className="numeral block text-[9px] text-(--color-text-soft) mt-1">ort. skor</span>
                  </span>
                  <span className="numeral ml-auto text-[10px] font-medium text-(--color-text-soft)">
                    {difficultyRange(avg)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onStart(key)}
                  className="btn-signature w-full text-[11.5px] font-semibold cursor-pointer mt-2"
                  style={{ padding: 9, borderRadius: 11 }}
                >
                  Seansı Başlat
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* Ortalama skordan önerilen zorluk aralığı. */
function difficultyRange(avg: number | null): string {
  if (avg === null) return "Kolay → Orta";
  if (avg >= 85) return "Orta → Zor";
  if (avg >= 70) return "Kolay → Zor";
  return "Kolay → Orta";
}

/**
 * Kart önizlemesi — dokümandaki gibi gerçek bir mini ızgara, SVG şema değil.
 *
 * Hücreler oyunun kendi tahtasının küçültülmüş hâli: terapist kartta gördüğü
 * deseni birazdan ekranda aynen görecek. Aktif hücre imza degradesini taşır,
 * pasifler soluk mavi tint.
 */
function GamePreview({ gameKey }: { readonly gameKey: string }) {
  const shape = PREVIEW[gameKey] ?? PREVIEW.memory;
  const { cols, rows, on, round } = shape;
  const size = 76;

  return (
    <div
      aria-hidden="true"
      className="grid"
      style={{
        width: size,
        height: size,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 7,
      }}
    >
      {Array.from({ length: cols * rows }, (_, i) => (
        <span
          key={i}
          style={{
            borderRadius: round ? "50%" : 6,
            background: on.includes(i)
              ? "linear-gradient(140deg, var(--color-signature-from), var(--color-signature-to))"
              : "var(--color-primary-light)",
          }}
        />
      ))}
    </div>
  );
}

/* Her oyunun tahta şekli ve hangi hücrenin "yandığı". */
const PREVIEW: Record<string, { cols: number; rows: number; on: number[]; round?: boolean }> = {
  memory:     { cols: 3, rows: 3, on: [4] },
  pairs:      { cols: 2, rows: 3, on: [1, 3] },
  pulse:      { cols: 2, rows: 2, on: [0], round: true },
  route:      { cols: 3, rows: 1, on: [1] },
  difference: { cols: 2, rows: 2, on: [2], round: true },
  scan:       { cols: 5, rows: 3, on: [7] },
  logic:      { cols: 3, rows: 3, on: [4] },
};
