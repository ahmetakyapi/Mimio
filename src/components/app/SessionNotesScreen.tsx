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

import { useMemo, useRef, useState } from "react";
import { Plus, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ClientProfile, SessionNote, RecentSessionEntry } from "@/lib/platform-data";
import { gameTitle } from "@/lib/deniz-derive";
import { normalizeScore } from "@/lib/game-constants";
import { Avatar, ScreenHeader, btnGhost } from "./primitives";

const SOAP_FIELDS = [
  { key: "s" as const, letter: "S", label: "Sübjektif" },
  { key: "o" as const, letter: "O", label: "Objektif" },
  { key: "a" as const, letter: "A", label: "Değerlendirme" },
  { key: "p" as const, letter: "P", label: "Plan" },
];

type Range = "7" | "30" | "90" | "all";

/*
 * `short`, yalnızca telefonda basılan kısa etiket. Dört düğme 320px'te tam
 * etiketiyle tek satıra sığmıyor, sarınca da üç satıra dağılıp filtre şeridini
 * listenin önüne bir duvar gibi koyuyordu. Kısa etiketle dördü tek satırda
 * kalıyor; hangi aralığın seçili olduğu göz kapağında zaten yazılı.
 */
const RANGES: ReadonlyArray<{ key: Range; label: string; short: string; days: number | null }> = [
  { key: "7", label: "Son 7 Gün", short: "7 Gün", days: 7 },
  { key: "30", label: "Son 30 Gün", short: "30 Gün", days: 30 },
  { key: "90", label: "Son 90 Gün", short: "90 Gün", days: 90 },
  { key: "all", label: "Tümü", short: "Tümü", days: null },
];

interface Props {
  readonly notes: readonly SessionNote[];
  readonly clients: readonly ClientProfile[];
  readonly sessions: readonly RecentSessionEntry[];
  readonly onNewNote: () => void;
  readonly onExport: () => void;
  readonly onDeleteNote: (noteId: string) => void;
}

export function SessionNotesScreen({ notes, clients, sessions, onNewNote, onExport, onDeleteNote }: Props) {
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [range, setRange] = useState<Range>("90");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /*
   * Telefonda liste ve detay yan yana duramıyor; `deniz-split` tek sütuna
   * inince ikisi alt alta yığılıyor, dokuz notun ardındaki detay paneli
   * ekranın çok altında kalıyor ve "hangi not açık" hiç belli olmuyordu.
   * Küçük ekranda ikili düzen bir itme akışına dönüyor: liste → not → geri.
   * Masaüstünde bu durum hiç okunmaz, iki sütun her zaman birlikte görünür.
   */
  const [mobileDetail, setMobileDetail] = useState(false);
  /* Listedeki kaydırma konumu — detaydan dönünce terapist kaldığı nottan
     devam etsin diye saklanıyor. */
  const listScrollTop = useRef(0);

  /*
   * Kabuğun kaydırma kabı ekranın dışında; telefonda liste yerine detay
   * gelince konum listeden kalıyor ve not ortasından açılıyordu. Açarken
   * başa alınır, dönerken listedeki yere geri konur. Masaüstünde kap zaten
   * kaymıyor, çağrı sonuçsuz kalır.
   */
  const appScroll = () => document.querySelector(".app-scroll");

  const openNote = (id: string) => {
    const sc = appScroll();
    listScrollTop.current = sc?.scrollTop ?? 0;
    setSelectedId(id);
    setMobileDetail(true);
    sc?.scrollTo({ top: 0 });
  };

  const backToList = () => {
    setMobileDetail(false);
    const y = listScrollTop.current;
    requestAnimationFrame(() => appScroll()?.scrollTo({ top: y }));
  };

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
    <div className="flex flex-col gap-5 max-lg:gap-4 h-full min-h-0">
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

      {/* Filtreler — telefonda detay açıkken gizlenir: liste görünmezken
          listeyi süzmek anlamsız, üstelik detay panelini ekranın altına
          itiyordu. */}
      <div className={`flex items-center gap-2 flex-wrap ${mobileDetail ? "max-lg:hidden" : ""}`}>
        {/* Danışan seçimi telefonda kendi satırını alır: yanına aralık
            düğmelerinden biri sıkışınca ikisi de yarım kalıyordu. */}
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="text-[12px] font-semibold text-(--color-text-body) cursor-pointer outline-none p-[8px_13px] max-lg:w-full"
          style={{ borderRadius: 10, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
        >
          <option value="all">Tüm Danışanlar</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </select>
        {/* Dört aralık telefonda eşit dört sütun: sarma yerine ızgara,
            böylece şerit her genişlikte tek satır kalıyor. */}
        <div className="flex items-center gap-2 max-lg:w-full max-lg:grid max-lg:grid-cols-4">
          {RANGES.map((r) => {
            const on = r.key === range;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                aria-pressed={on}
                className={`text-[12px] font-semibold cursor-pointer border transition-colors p-[8px_14px] max-lg:p-[8px_4px] ${on ? "text-white border-transparent" : "text-(--color-text-body) hover:border-(--color-line-strong)"}`}
                style={{
                  borderRadius: 10,
                  background: on ? "var(--gradient-signature-ink)" : "var(--color-surface-strong)",
                  borderColor: on ? "transparent" : "var(--color-line)",
                }}
              >
                <span className="lg:hidden">{r.short}</span>
                <span className="hidden lg:inline">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        /* Telefonda `flex-1` yayacak boş alan bulamıyor (kabuk yüksekliği
           içerikten geliyor); boş durum kutusu bir çizgiye iniyordu. */
        <div className="glass rounded-[18px] flex-1 grid place-items-center max-lg:min-h-[200px] max-lg:p-6">
          <div className="text-center">
            <p className="m-0 mb-1 font-bold text-[15px] text-(--color-text-strong)">Bu Aralıkta Not Yok</p>
            <p className="m-0 text-[12.5px] text-(--color-text-soft)">
              Seans bitiminde SOAP notu yazıldığında burada listelenir.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 flex-1 min-h-0 deniz-split max-lg:gap-3" style={{ ["--split" as string]: "minmax(0,1fr) 400px" }}>
          {/* Not akışı */}
          <div className={`flex flex-col gap-2 overflow-y-auto min-h-0 pr-1 max-lg:pr-0 ${mobileDetail ? "max-lg:hidden" : ""}`}>
            {rows.map((n) => {
              const c = clientOf(n.clientId);
              const sess = sessionFor(n);
              const on = selected?.id === n.id;
              const d = new Date(n.createdAt);
              const dayLabel = d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
              const timeLabel = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNote(n.id)}
                  aria-pressed={on}
                  className="flex items-start gap-3 text-left cursor-pointer transition-colors p-[13px_16px] max-lg:gap-2.5 max-lg:p-[12px_13px]"
                  style={{
                    borderRadius: 14,
                    background: on ? "var(--gradient-signature-soft)" : "var(--color-surface)",
                    border: `1px solid ${on ? "var(--color-line-strong)" : "var(--color-line)"}`,
                  }}
                >
                  {/* Tarih oluğu — hizalı okunsun diye sabit genişlik.
                      Telefonda kapanıyor: 44px'lik sütun + avatar, 320px'te
                      adı "Ela Seren …" hâline getiriyordu. Tarih orada
                      aşağıdaki mikro satıra iniyor. */}
                  <span className="shrink-0 text-right w-[44px] max-lg:hidden">
                    <span className="numeral block text-[10.5px] font-semibold text-(--color-text-body) leading-tight">
                      {dayLabel}
                    </span>
                    <span className="numeral block text-[9.5px] text-(--color-text-muted) leading-tight mt-0.5">
                      {timeLabel}
                    </span>
                  </span>

                  <Avatar name={c?.displayName ?? "?"} id={n.clientId} size={34} radius={11} />

                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 mb-1">
                      <span className="text-[12.5px] font-bold text-(--color-text-strong) truncate">
                        {c?.displayName ?? "Danışan"}
                      </span>
                      {sess && (
                        <span className="text-[10.5px] text-(--color-text-soft) truncate max-lg:hidden">
                          {gameTitle(sess.gameKey)}
                        </span>
                      )}
                      {sess && (
                        <span className="numeral ml-auto text-[11.5px] font-semibold shrink-0" style={{ color: "var(--color-primary)" }}>
                          %{Math.round(normalizeScore(sess.gameKey as never, sess.score) * 100)}
                        </span>
                      )}
                    </span>
                    {/* Telefonun tarih/oyun satırı — ad satırından ayrıldığı
                        için üçü de kesilmeden okunur. */}
                    <span className="lg:hidden flex items-center gap-1.5 mb-1 text-[10px] text-(--color-text-muted)">
                      <span className="numeral shrink-0">{dayLabel} · {timeLabel}</span>
                      {sess && <span className="truncate">· {gameTitle(sess.gameKey)}</span>}
                    </span>
                    {/* `block`, `line-clamp-2`nin kurduğu `-webkit-box`
                        görüntüsünü eziyordu: kırpma hiç çalışmıyor, telefonda
                        her satır dört satır özet taşıyordu. Masaüstü davranışı
                        `lg:block` ile olduğu gibi kalıyor. */}
                    <span className="line-clamp-2 lg:block text-[11.5px] leading-[1.5] text-(--color-text-body)">
                      {n.content || "—"}
                    </span>
                    {n.noteMode && (
                      <span className="inline-flex mt-1.5 text-[9.5px] font-semibold" style={{ padding: "3px 9px", borderRadius: 7, background: "var(--color-primary-light)", color: "var(--color-primary-ink)" }}>
                        {n.noteMode.toUpperCase()}
                      </span>
                    )}
                  </span>

                  {/* Satırın detayı açtığını söyleyen tek işaret — telefonda
                      liste ve detay aynı anda görünmediği için gerekli. */}
                  <ChevronRight
                    size={15}
                    className="lg:hidden shrink-0 self-center text-(--color-text-muted)"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {/* Seçili notun tam hâli */}
          {selected && (
            <div
              className={`flex flex-col min-h-0 overflow-y-auto p-[22px_24px] max-lg:p-[14px_15px] ${mobileDetail ? "" : "max-lg:hidden"}`}
              style={{ borderRadius: 20, background: "var(--color-surface)", border: "1px solid var(--color-line)", backdropFilter: "blur(14px)" }}
            >
              {/* Telefonda detay listenin yerine geçtiği için geri dönüş
                  yolu gerekiyor; masaüstünde iki sütun zaten yan yana. */}
              <button
                type="button"
                onClick={backToList}
                className="lg:hidden self-start flex items-center gap-1 mb-3 -ml-1 px-1 text-[12px] font-semibold cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-primary) transition-colors"
              >
                <ChevronLeft size={15} strokeWidth={2.2} /> Listeye Dön
              </button>

              {/* Telefonda skor bloğu kendi satırına iner: ad + skor + sil
                  tek satırda toplam 130px'lik yer istiyor, geriye kalan
                  boşlukta ad "Ela Se…" hâline geliyordu. */}
              <div className="flex items-center gap-[11px] mb-5 max-lg:flex-wrap max-lg:gap-x-2.5 max-lg:gap-y-2.5 max-lg:mb-4">
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
                  <span className="shrink-0 text-right max-lg:order-last max-lg:w-full max-lg:text-left max-lg:flex max-lg:items-baseline max-lg:gap-2">
                    <span className="numeral block text-[20px] font-semibold leading-none" style={{ color: "var(--color-primary)" }}>
                      %{Math.round(normalizeScore(selectedSession.gameKey as never, selectedSession.score) * 100)}
                    </span>
                    <span className="numeral block text-[9px] text-(--color-text-muted) mt-1 max-lg:mt-0">
                      {selectedSession.score} ham
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Notu sil"
                  title="Notu Sil"
                  onClick={() => onDeleteNote(selected.id)}
                  className="grid place-items-center shrink-0 cursor-pointer border-none bg-transparent text-(--color-text-muted) hover:text-(--color-accent-red) transition-colors w-7 h-7"
                  style={{ borderRadius: 9 }}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>

              {selected.soapContent ? (
                <div className="flex flex-col gap-3.5 max-lg:gap-3">
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
