"use client";

/*
 * Seans Notları — tasarım dokümanı 1p/1q.
 *
 * İki sütun: solda tüm notların akışı, sağda seçili notun tam hâli.
 *
 * Liste kasten "satır" düzeninde ve solunda dar bir tarih oluğu var:
 * terapist burada tek not okumuyor, zaman içinde bir örüntü arıyor
 * ("bu ay hep aynı şeyi mi yazmışım?"). Tarihler hizalı olmazsa bu okuma
 * kayboluyor. Sağdaki panel ise notu SOAP alanlarına ayrılmış hâliyle
 * gösteriyor — liste özet, panel kayıt.
 */

import { useMemo, useState } from "react";
import { Plus, Download } from "lucide-react";
import type { ClientProfile, SessionNote, RecentSessionEntry } from "@/lib/platform-data";
import { gameTitle } from "@/lib/deniz-derive";
import { Avatar, ScreenHeader, btnGhost } from "./primitives";

const SOAP_FIELDS = [
  { key: "s" as const, letter: "S", label: "Sübjektif" },
  { key: "o" as const, letter: "O", label: "Objektif" },
  { key: "a" as const, letter: "A", label: "Değerlendirme" },
  { key: "p" as const, letter: "P", label: "Plan" },
];

type Range = "7" | "30" | "90" | "all";

const RANGES: ReadonlyArray<{ key: Range; label: string; days: number | null }> = [
  { key: "7", label: "Son 7 Gün", days: 7 },
  { key: "30", label: "Son 30 Gün", days: 30 },
  { key: "90", label: "Son 90 Gün", days: 90 },
  { key: "all", label: "Tümü", days: null },
];

interface Props {
  readonly notes: readonly SessionNote[];
  readonly clients: readonly ClientProfile[];
  readonly sessions: readonly RecentSessionEntry[];
  readonly onNewNote: () => void;
  readonly onExport: () => void;
}

export function SessionNotesScreen({ notes, clients, sessions, onNewNote, onExport }: Props) {
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [range, setRange] = useState<Range>("90");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const clientOf = (id: string) => clients.find((c) => c.id === id) ?? null;

  /* Nota en yakın seans — skoru ve oyunu buradan bağlanıyor. */
  const sessionFor = (n: SessionNote) => {
    const same = sessions.filter((s) => s.clientId === n.clientId);
    const day = n.date.slice(0, 10);
    return same.find((s) => s.playedAt.slice(0, 10) === day) ?? null;
  };

  const rows = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? null;
    const cut = days ? Date.now() - days * 86400000 : 0;
    return notes
      .filter((n) => (clientFilter === "all" ? true : n.clientId === clientFilter))
      .filter((n) => (cut ? new Date(n.createdAt).getTime() >= cut : true))
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes, clientFilter, range]);

  const selected = rows.find((n) => n.id === selectedId) ?? rows[0] ?? null;
  const selectedClient = selected ? clientOf(selected.clientId) : null;
  const selectedSession = selected ? sessionFor(selected) : null;

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <ScreenHeader
        eyebrow={`${rows.length} not · ${RANGES.find((r) => r.key === range)?.label.toLocaleLowerCase("tr-TR")}`}
        title="Seans Notları"
        sub="SOAP formatı · oyun skorları otomatik bağlanır."
        actions={
          <>
            {/* Düğme ne yapıyorsa onu söylemeli: indirilen dosya CSV. */}
            <button type="button" className={btnGhost} onClick={onExport} disabled={rows.length === 0}>
              <span className="inline-flex items-center gap-2">
                <Download size={14} /> CSV Dışa Aktar
              </span>
            </button>
            <button
              type="button"
              onClick={onNewNote}
              className="btn-signature flex items-center gap-2 px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.2} /> Yeni Not
            </button>
          </>
        }
      />

      {/* Filtreler */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="text-[12px] font-semibold text-(--color-text-body) cursor-pointer outline-none"
          style={{ padding: "8px 13px", borderRadius: 10, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
        >
          <option value="all">Tüm Danışanlar</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </select>
        {RANGES.map((r) => {
          const on = r.key === range;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={on}
              className={`text-[12px] font-semibold cursor-pointer border transition-colors ${on ? "text-white border-transparent" : "text-(--color-text-body) hover:border-(--color-line-strong)"}`}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: on ? "var(--gradient-signature)" : "var(--color-surface-strong)",
                borderColor: on ? "transparent" : "var(--color-line)",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="glass rounded-[18px] flex-1 grid place-items-center">
          <div className="text-center">
            <p className="m-0 mb-1 font-bold text-[15px] text-(--color-text-strong)">Bu Aralıkta Not Yok</p>
            <p className="m-0 text-[12.5px] text-(--color-text-soft)">
              Seans bitiminde SOAP notu yazıldığında burada listelenir.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 flex-1 min-h-0 deniz-split" style={{ ["--split" as string]: "minmax(0,1fr) 400px" }}>
          {/* Not akışı */}
          <div className="flex flex-col gap-2 overflow-y-auto min-h-0 pr-1">
            {rows.map((n) => {
              const c = clientOf(n.clientId);
              const sess = sessionFor(n);
              const on = selected?.id === n.id;
              const d = new Date(n.createdAt);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  aria-pressed={on}
                  className="flex items-start gap-3 text-left cursor-pointer transition-colors"
                  style={{
                    padding: "13px 16px",
                    borderRadius: 14,
                    background: on ? "var(--gradient-signature-soft)" : "var(--color-surface)",
                    border: `1px solid ${on ? "var(--color-line-strong)" : "var(--color-line)"}`,
                  }}
                >
                  {/* Tarih oluğu — hizalı okunsun diye sabit genişlik */}
                  <span className="shrink-0 text-right" style={{ width: 44 }}>
                    <span className="numeral block text-[10.5px] font-semibold text-(--color-text-body) leading-tight">
                      {d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </span>
                    <span className="numeral block text-[9.5px] text-(--color-text-muted) leading-tight mt-0.5">
                      {d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>

                  <Avatar name={c?.displayName ?? "?"} id={n.clientId} size={34} radius={11} />

                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 mb-1">
                      <span className="text-[12.5px] font-bold text-(--color-text-strong) truncate">
                        {c?.displayName ?? "Danışan"}
                      </span>
                      {sess && (
                        <span className="text-[10.5px] text-(--color-text-soft) truncate">
                          {gameTitle(sess.gameKey)}
                        </span>
                      )}
                      {sess && (
                        <span className="numeral ml-auto text-[11.5px] font-semibold shrink-0" style={{ color: "var(--color-primary)" }}>
                          {sess.score}
                        </span>
                      )}
                    </span>
                    <span className="block text-[11.5px] leading-[1.5] text-(--color-text-body) line-clamp-2">
                      {n.content || "—"}
                    </span>
                    {n.noteMode && (
                      <span className="inline-flex mt-1.5 text-[9.5px] font-semibold" style={{ padding: "3px 9px", borderRadius: 7, background: "var(--color-primary-light)", color: "var(--color-primary-ink)" }}>
                        {n.noteMode.toUpperCase()}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Seçili notun tam hâli */}
          {selected && (
            <div
              className="flex flex-col min-h-0 overflow-y-auto"
              style={{ padding: "22px 24px", borderRadius: 20, background: "var(--color-surface)", border: "1px solid var(--color-line)", backdropFilter: "blur(14px)" }}
            >
              <div className="flex items-center gap-[11px] mb-5">
                <Avatar name={selectedClient?.displayName ?? "?"} id={selected.clientId} size={40} radius={13} />
                <span className="min-w-0 flex-1">
                  <span className="font-display block text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong) truncate">
                    {selectedClient?.displayName ?? "Danışan"}
                  </span>
                  <span className="block text-[10.5px] text-(--color-text-soft) truncate">
                    {new Date(selected.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    {selectedSession ? ` · ${gameTitle(selectedSession.gameKey)}` : ""}
                  </span>
                </span>
                {selectedSession && (
                  <span className="numeral text-[20px] font-semibold shrink-0" style={{ color: "var(--color-primary)" }}>
                    {selectedSession.score}
                  </span>
                )}
              </div>

              {selected.soapContent ? (
                <div className="flex flex-col gap-3.5">
                  {SOAP_FIELDS.map(({ key, letter, label }) => (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="numeral grid place-items-center text-[10px] font-bold shrink-0"
                          style={{ width: 20, height: 20, borderRadius: 6, background: "var(--color-primary-light)", color: "var(--color-primary-ink)" }}
                        >
                          {letter}
                        </span>
                        <span className="text-[11px] font-semibold text-(--color-text-body)">{label}</span>
                      </div>
                      <p
                        className="m-0 text-[11.5px] leading-[1.55] text-(--color-text-strong)"
                        style={{ padding: "11px 13px", borderRadius: 12, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
                      >
                        {selected.soapContent?.[key] || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="m-0 text-[12px] leading-[1.6] text-(--color-text-strong)"
                  style={{ padding: "13px 15px", borderRadius: 12, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
                >
                  {selected.content || "—"}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
