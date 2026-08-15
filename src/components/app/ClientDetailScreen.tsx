"use client";

/*
 * Danışan detayı — üç sütun (1f/1g).
 *
 *   sol (262px)  · değişmeyen bilgi: profil, bağımsızlık ölçeği, aile notu
 *   orta (esnek) · zaman içindeki değişim: gelişim eğrisi, seans geçmişi
 *   sağ (268px)  · karar: hedef halkaları ve öneri motoru
 *
 * Sıralama soldan sağa "ne biliyoruz → ne değişti → ne yapacağız" okunur.
 * Öneri Motoru kartı her iki temada da koyu: ekrandaki tek karar bloğu ve
 * çevresindeki açık yüzeylerden ayrılması isteniyor.
 *
 * Telefonda sütun sırası değişir (`order`): sekmelerin yönettiği orta sütun
 * başa geçer. Doküman sırasıyla dizilince "Notlar" sekmesine basan kişi
 * profil, bağımsızlık ölçeği ve son notu geçip üç ekran aşağı kaydırmadan
 * notlara ulaşamıyordu — sekme bastığı yerde hiçbir şey değişmiyor gibi
 * görünüyordu. Karar bloğu (hedefler + öneri) ikinci, değişmeyen künye
 * bilgisi (profil) sona gider.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Sparkles, FileText, Plus, Minus, Archive, Trash2 } from "lucide-react";
import type { AppView, ClientProfile, RecentSessionEntry, SessionNote, ClientGoal, PlatformGameKey } from "@/lib/platform-data";
import {
  metricsFor,
  gameTitle,
  gameKicker,
  domainColor,
  shortDate,
  INDEPENDENCE_STEPS,
} from "@/lib/deniz-derive";
import { normalizeScore, GAME_SCORE_SCALE } from "@/lib/game-constants";
import { SessionTrendChart } from "@/components/shared/SessionTrendChart";
import { Avatar, Card, CardTitle, Eyebrow, ScoreRing, ScreenHeader, SegmentedControl, Tag, btnGhost } from "./primitives";

const TARGET_SCORE = 85;

type TabKey = "overview" | "sessions" | "notes";

interface Props {
  readonly client: ClientProfile;
  readonly sessions: readonly RecentSessionEntry[];
  readonly notes: readonly SessionNote[];
  readonly goals: readonly ClientGoal[];
  readonly therapistName: string;
  readonly onBack: () => void;
  readonly onNavigate: (v: AppView) => void;
  readonly onStartSession: (clientId: string, gameKey?: PlatformGameKey) => void;
  readonly onCreateReport: () => void;
  readonly onAddNote: () => void;
  readonly onDeleteNote: (noteId: string) => void;
  readonly onAddGoal: () => void;
  readonly onUpdateGoal: (goalId: string, currentValue: number) => void;
  readonly onDeleteGoal: (goalId: string) => void;
  readonly onArchive: () => void;
}

export function ClientDetailScreen({
  client,
  sessions,
  notes,
  goals,
  therapistName,
  onBack,
  onNavigate,
  onStartSession,
  onCreateReport,
  onAddNote,
  onDeleteNote,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onArchive,
}: Props) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [range, setRange] = useState<"10" | "90" | "all">("10");

  const m = useMemo(() => metricsFor(client, sessions), [client, sessions]);
  const clientNotes = useMemo(() => notes.filter((n) => n.clientId === client.id), [notes, client.id]);
  const clientGoals = useMemo(() => goals.filter((g) => g.clientId === client.id), [goals, client.id]);

  const curve = useMemo(() => {
    if (range === "10") return m.sessions.slice(-10);
    if (range === "90") {
      const cut = Date.now() - 90 * 86400000;
      return m.sessions.filter((s) => new Date(s.playedAt).getTime() >= cut);
    }
    return m.sessions;
  }, [m.sessions, range]);

  /* Etiket şeridi iki yerde basılıyor: masaüstünde ad sütununun altında,
     telefonda kendi tam satırında. Telefonda ad sütunu ~150px'e düşüyor ve
     "Görsel tarama ve dikkat sürdürme becerisi" gibi tek etiket üç satıra
     sarıyordu. */
  const tagRow = (
    <>
      {client.ageGroup && <Tag tone="primary">{client.ageGroup} yaş</Tag>}
      {(client.tags ?? []).slice(0, 1).map((t) => (
        <Tag key={t} tone="primary">{t}</Tag>
      ))}
      {client.primaryGoal && <Tag tone="green">{client.primaryGoal}</Tag>}
      <Tag tone="amber">{m.independenceLabel} · {m.independence}/5</Tag>
      <Tag tone="violet">{m.sessionCount} seans</Tag>
    </>
  );

  return (
    <div className="flex flex-col gap-4 max-lg:gap-3 h-full min-h-0">
      {/* Kırıntı yolu */}
      <nav className="flex items-center gap-2 text-[11px] font-medium text-(--color-text-soft)" aria-label="Konum">
        {/* Geri bağlantısı 17px yüksekliğindeydi; parmakla vurulamıyordu.
            Telefonda satır 44px'e çıkar, görsel ağırlık aynı kalır. */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center bg-transparent border-none p-0 max-lg:min-h-11 cursor-pointer hover:text-(--color-primary) transition-colors"
        >
          Danışanlar
        </button>
        <ChevronRight size={12} className="shrink-0" />
        <span className="font-semibold text-(--color-text-strong) truncate">{client.displayName}</span>
      </nav>

      {/* Başlık */}
      <div className="flex items-start gap-5 flex-wrap max-lg:items-center max-lg:gap-x-3.5 max-lg:gap-y-3">
        {/* Avatar telefonda 54px: 74px, 320px'lik ekranda ad sütununu üç
            satıra düşürüyordu. İki ayrı örnek — boyut inline style'dan
            geliyor, sınıfla ezilemiyor. */}
        <Avatar name={client.displayName} id={client.id} size={74} radius={22} className="max-lg:hidden font-display" />
        <Avatar name={client.displayName} id={client.id} size={54} radius={17} className="lg:hidden font-display" />
        <div className="flex-1 min-w-0">
          <h1 className="m-0 mb-2 max-lg:mb-0 text-[clamp(1.3125rem,2.1vw,1.8125rem)] leading-none max-lg:leading-[1.2] text-(--color-text-strong)">
            {client.displayName}
          </h1>
          <div className="flex flex-wrap gap-[7px] max-lg:hidden">{tagRow}</div>
        </div>
        <div className="hidden max-lg:flex flex-wrap gap-[7px] w-full">{tagRow}</div>
        {/* Telefonda iki eylem satırı paylaşır ve tam genişliğe yayılır;
            `shrink-0` masaüstünde başlığı ezmemesi için duruyor. */}
        <div className="flex items-center gap-2.5 shrink-0 max-lg:w-full max-lg:gap-2">
          {/* Yan boşluk telefonda 17→10px: 320px'te iki düğme satırı paylaşınca
              "Rapor Oluştur" iki satıra kırılıp düğmeyi 100px yükseltiyordu. */}
          <button type="button" className={`${btnGhost} max-lg:flex-1 max-lg:px-2.5`} onClick={onCreateReport}>
            <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap"><FileText size={14} className="shrink-0" /> Rapor Oluştur</span>
          </button>
          <button
            type="button"
            className="btn-signature px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer whitespace-nowrap max-lg:flex-1 max-lg:px-2.5"
            onClick={() => onStartSession(client.id)}
          >
            Seansı Başlat
          </button>
        </div>
      </div>

      {/* Sekmeler — alt çizgi, kutu değil: içerik yüzeyiyle aynı düzlemde kalsın.
          Telefonda dört etiket 320px'e sığmayıp iki satıra sarıyor, alt çizgi
          hizası dağılıyordu. Şerit artık yatay kayar; etiketler kırılmaz. */}
      <div
        className="flex items-center gap-[22px] max-lg:gap-4 max-lg:overflow-x-auto max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden"
        style={{ borderBottom: "1px solid var(--color-line)" }}
        role="tablist"
      >
        {([
          { key: "overview" as const, label: "Genel Bakış" },
          { key: "sessions" as const, label: "Seanslar" },
          { key: "notes" as const, label: `Notlar${clientNotes.length ? ` · ${clientNotes.length}` : ""}` },
        ]).map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.key)}
              className={`relative shrink-0 whitespace-nowrap bg-transparent border-none cursor-pointer text-[13px] py-[9px] px-0 transition-colors ${on ? "font-semibold text-(--color-primary)" : "font-medium text-(--color-text-soft) hover:text-(--color-text-body)"}`}
            >
              {t.label}
              {on && (
                <span
                  className="absolute left-0 right-0"
                  style={{ bottom: -1, height: 2, borderRadius: 2, background: "var(--gradient-bar)" }}
                />
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onNavigate("weekly-plan")}
          /* `ml-auto` masaüstünde bağlantıyı şeridin sağ ucuna yaslar.
             Telefonda şerit yatay kaydığı için aynı kural onu görünür alanın
             60px dışına itiyordu: bağlantı hiç görünmüyor, kaydırılabilir
             olduğuna dair bir ipucu da kalmıyordu. Küçük ekranda sekmelerin
             hemen ardına gelir; yarısı görünüp şeridin kaydığını haber verir. */
          className="lg:ml-auto max-lg:pl-1 shrink-0 whitespace-nowrap text-[12px] font-semibold text-(--color-text-soft) hover:text-(--color-primary) bg-transparent border-none cursor-pointer transition-colors"
        >
          Haftalık Plan →
        </button>
      </div>

      <div className="grid gap-4 max-lg:gap-3 flex-1 min-h-0 deniz-split" style={{ ["--split" as string]: "262px minmax(0,1fr) 268px" }}>
        {/* ── Sol: sabit bilgi (telefonda en sona iner) ── */}
        <div className="flex flex-col gap-3.5 max-lg:gap-3 min-h-0 overflow-y-auto max-lg:order-3">
          <Card pad="p-[18px_20px]">
            <Eyebrow className="mb-2.5">Profil</Eyebrow>
            <Row label="Doğum" value={client.birthDate ? new Date(client.birthDate).toLocaleDateString("tr-TR") : "—"} />
            <Row label="Yaş grubu" value={client.ageGroup || "—"} />
            <Row label="Destek" value={client.supportLevel || "—"} />
            <Row label="Zorluk" value={client.difficultyLevel || "—"} />
            <Row label="Terapist" value={therapistName} last />
            {/* Arşiv — yıkıcı eylem köşede ve sessiz durur; onay MimioApp'teki
                ConfirmDialog'dan geçer. Daha önce arşivleme hiçbir ekrandan
                erişilemiyordu. */}
            <button
              type="button"
              onClick={onArchive}
              className="mt-2 max-lg:mt-1 flex items-center gap-1.5 text-[11px] font-medium bg-transparent border-none p-0 max-lg:min-h-11 cursor-pointer text-(--color-text-muted) hover:text-(--color-accent-red) transition-colors"
            >
              <Archive size={12} className="shrink-0" /> Danışanı Arşivle
            </button>
          </Card>

          <Card pad="p-[18px_20px]">
            <Eyebrow className="mb-3">Bağımsızlık Ölçeği</Eyebrow>
            {INDEPENDENCE_STEPS.map((label, i) => {
              const step = i + 1;
              const reached = step <= m.independence;
              const current = step === m.independence;
              return (
                <div key={label} className="flex items-center gap-[9px]" style={{ padding: "6px 0" }}>
                  <span
                    className="numeral text-[10px] font-semibold shrink-0"
                    style={{ width: 18, color: current ? "var(--color-primary)" : "var(--color-text-muted)" }}
                  >
                    {step}
                  </span>
                  <span
                    className="flex-1 rounded-full"
                    style={{
                      height: 6,
                      background: current ? "var(--gradient-bar)" : reached ? "var(--color-primary)" : "var(--color-line-strong)",
                    }}
                  />
                  <span
                    className="text-[11px] shrink-0"
                    style={{
                      width: 96,
                      fontWeight: current ? 700 : 400,
                      color: current ? "var(--color-text-strong)" : "var(--color-text-soft)",
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </Card>

          <div
            className="rounded-[18px] flex-1"
            style={{
              padding: "16px 18px",
              background: "var(--gradient-signature-soft)",
              border: "1px solid var(--color-line-strong)",
            }}
          >
            <Eyebrow className="!text-(--color-primary-ink) mb-2.5">Son Not</Eyebrow>
            {clientNotes.length === 0 ? (
              <p className="m-0 text-[12px] leading-[1.55] text-(--color-text-soft)">
                Bu danışan için henüz not yok.{" "}
                <button type="button" onClick={onAddNote} className="font-semibold text-(--color-primary) bg-transparent border-none p-0 cursor-pointer hover:underline">
                  Not Ekle
                </button>
              </p>
            ) : (
              <p className="m-0 text-[12px] leading-[1.55] text-(--color-text-body)">
                {clientNotes[0].content?.slice(0, 180) || "—"}
                {(clientNotes[0].content?.length ?? 0) > 180 ? "…" : ""}
                <strong className="block mt-2 font-bold text-(--color-text-strong)">
                  {shortDate(new Date(clientNotes[0].createdAt))}
                </strong>
              </p>
            )}
          </div>
        </div>

        {/* ── Orta: değişim (telefonda başa geçer — sekmeler burayı yönetiyor) ── */}
        <div className="flex flex-col gap-3.5 max-lg:gap-3 min-h-0 max-lg:order-1">
          {tab === "overview" && (
            <>
              <Card pad="p-[18px_20px] max-lg:p-[16px_14px]" className="shrink-0">
                {/* Başlık ve aralık seçici telefonda yan yana sığmıyor: seçici
                    başlığı iki satıra kırıyordu. Dar ekranda alt alta, seçici
                    tam genişlikte üç eşit segment. */}
                <div className="flex items-start justify-between mb-3.5 gap-3 max-lg:flex-col max-lg:items-stretch max-lg:gap-2.5">
                  <div className="min-w-0">
                    <CardTitle>Gelişim Eğrisi</CardTitle>
                    <div className="text-[11px] text-(--color-text-soft) mt-0.5">
                      {curve.length} seans · normalize skor
                    </div>
                  </div>
                  <div className="max-lg:[&>div]:w-full max-lg:[&_button]:flex-1">
                    <SegmentedControl
                      size="sm"
                      value={range}
                      onChange={setRange}
                      options={[
                        { value: "10", label: "10 Seans" },
                        { value: "90", label: "3 Ay" },
                        { value: "all", label: "Tümü" },
                      ]}
                    />
                  </div>
                </div>
                <GrowthCurve sessions={curve} />
              </Card>

              <SessionHistory sessions={m.sessions.slice().reverse().slice(0, 6)} total={m.sessionCount} onAll={() => setTab("sessions")} />
            </>
          )}

          {tab === "sessions" && (
            <>
              {/* Alan renkli, normalize eğilim grafiği. Bileşen yazılmıştı ama
                  hiçbir ekranda render edilmiyordu; yeri burası: "Seanslar"
                  sekmesi zaman içindeki dağılımı soruyor. */}
              {m.sessions.length >= 3 && (
                <Card pad="p-[18px_20px] max-lg:p-[16px_14px]" className="shrink-0">
                  <SessionTrendChart sessions={m.sessions} />
                </Card>
              )}
              <SessionHistory sessions={m.sessions.slice().reverse()} total={m.sessionCount} fill />
            </>
          )}

          {tab === "notes" && (
            <Card className="flex-1 flex flex-col min-h-0" pad="p-[18px_20px] max-lg:p-[16px_14px]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <CardTitle>Notlar</CardTitle>
                <button
                  type="button"
                  onClick={onAddNote}
                  className="btn-signature flex shrink-0 items-center justify-center gap-1.5 text-[11.5px] font-semibold cursor-pointer px-3 py-[7px] rounded-[9px]"
                >
                  <Plus size={13} className="shrink-0" /> Not Ekle
                </button>
              </div>
              {clientNotes.length === 0 ? (
                <div className="flex-1 grid place-items-center">
                  <p className="m-0 text-[12.5px] text-(--color-text-soft)">Bu danışan için henüz not yok.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
                  {clientNotes.map((n) => (
                    <div key={n.id} className="group" style={{ padding: "12px 14px", borderRadius: 13, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="numeral text-[10.5px] text-(--color-text-soft)">
                          {shortDate(new Date(n.createdAt))}
                        </span>
                        <span className="flex items-center gap-2">
                          {n.noteMode && <Tag tone="teal">{n.noteMode.toUpperCase()}</Tag>}
                          {/* Dokunmatikte "hover" diye bir durum yok: silme
                              düğmesi telefonda hiç görünmüyordu. */}
                          <button
                            type="button"
                            aria-label="Notu sil"
                            onClick={() => onDeleteNote(n.id)}
                            className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-muted) hover:text-(--color-accent-red) opacity-0 max-lg:opacity-100 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            style={{ width: 22, height: 22, borderRadius: 7 }}
                          >
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
                        </span>
                      </div>
                      <p className="m-0 text-[12.5px] leading-[1.55] text-(--color-text-body)">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── Sağ: karar (telefonda orta sütunun hemen altında) ── */}
        <div className="flex flex-col gap-3.5 max-lg:gap-3 min-h-0 overflow-y-auto max-lg:order-2">
          <Card pad="p-[18px_20px] max-lg:p-[16px_14px]">
            <div className="flex items-center justify-between gap-3 mb-3.5">
              <Eyebrow>Hedefler</Eyebrow>
              {/* Hedefler daha önce yalnızca seed'den gelebiliyordu: ekleme
                  formu ve ilerleme güncelleme hiçbir yerden açılmıyordu. */}
              <button
                type="button"
                onClick={onAddGoal}
                className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-(--color-primary) bg-transparent border-none p-0 max-lg:min-h-11 cursor-pointer hover:underline"
              >
                <Plus size={12} strokeWidth={2.4} className="shrink-0" /> Hedef Ekle
              </button>
            </div>
            {clientGoals.length === 0 ? (
              <p className="m-0 text-[12px] text-(--color-text-soft)">
                Tanımlı hedef yok. Hedef eklendiğinde ilerleme halkası burada görünür.
              </p>
            ) : (
              /* Telefonda iç kaydırıcı yok: 300px'lik kutu, sayfa zaten
                 kayarken ikinci bir kaydırma alanı açıyordu. */
              <div className="flex flex-col gap-3.5 max-lg:gap-4 max-h-none lg:max-h-[300px] overflow-y-auto">
                {clientGoals.map((g) => {
                  const pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0;
                  return (
                    <div key={g.id} className="flex items-center gap-3 group max-lg:flex-wrap max-lg:gap-y-1.5">
                      <ScoreRing value={pct} size={58} />
                      <div className="min-w-0 flex-1">
                        {/* Telefonda tek satır hedef adını "G…"ye indiriyordu; iki satır hakkı var. */}
                        <div className="text-[12.5px] font-semibold text-(--color-text-strong) truncate max-lg:whitespace-normal max-lg:line-clamp-2">
                          {g.title}
                        </div>
                        <div className="text-[10.5px] text-(--color-text-soft) mt-0.5 truncate">
                          Hedef {g.targetValue} · şu an {g.currentValue}
                        </div>
                      </div>
                      {/* İlerleme tek dokunuşla işlenir — seans arasında form açtırmak fazla tören.
                          Telefonda üç düğme 44px'e büyüyor ve halka + başlıkla aynı satıra
                          sığmıyor: hedef adı "G…"ye kadar kırpılıyordu. Kendi satırına iner.
                          Görünürlük de hover'a bağlıydı; dokunmatikte hiç açılmıyordu. */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity max-lg:opacity-100 max-lg:w-full max-lg:justify-end max-lg:gap-1.5">
                        <button
                          type="button"
                          aria-label={`${g.title} ilerlemesini azalt`}
                          disabled={g.currentValue <= 0}
                          onClick={() => onUpdateGoal(g.id, Math.max(0, g.currentValue - 1))}
                          className="grid place-items-center cursor-pointer border-none text-(--color-text-soft) hover:text-(--color-primary) disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ width: 22, height: 22, borderRadius: 7, background: "var(--color-primary-light)" }}
                        >
                          <Minus size={11} strokeWidth={2.4} />
                        </button>
                        <button
                          type="button"
                          aria-label={`${g.title} ilerlemesini artır`}
                          onClick={() => onUpdateGoal(g.id, g.currentValue + 1)}
                          className="grid place-items-center cursor-pointer border-none text-(--color-text-soft) hover:text-(--color-primary)"
                          style={{ width: 22, height: 22, borderRadius: 7, background: "var(--color-primary-light)" }}
                        >
                          <Plus size={11} strokeWidth={2.4} />
                        </button>
                        <button
                          type="button"
                          aria-label={`${g.title} hedefini sil`}
                          onClick={() => onDeleteGoal(g.id)}
                          className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-muted) hover:text-(--color-accent-red)"
                          style={{ width: 22, height: 22, borderRadius: 7 }}
                        >
                          <Trash2 size={11} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/*
            Öneri Motoru — her iki temada koyu. Ekrandaki tek "karar" bloğu;
            açık yüzeylerin arasında koyu bir ada olarak duruyor ki göz onu
            veri kartlarından ayırsın.
          */}
          <div
            className="rounded-[18px] relative overflow-hidden flex-1 p-[18px_20px] max-lg:p-[16px_14px]"
            style={{ background: "#0a1524" }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(320px 180px at 100% 0%, rgba(77,125,255,.35), transparent 65%), radial-gradient(280px 160px at 0% 100%, rgba(42,214,239,.22), transparent 65%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} strokeWidth={1.9} style={{ color: "#4d7dff" }} />
                <span className="font-display font-bold text-[13px] tracking-[-0.02em]" style={{ color: "#eaf2ff" }}>
                  Öneri Motoru
                </span>
              </div>
              <p className="m-0 mb-3 text-[12px] leading-[1.6]" style={{ color: "#b9cade" }}>
                {engineSummary(m.series, m.averageScore)}
              </p>
              <div className="flex flex-col gap-[7px]">
                {engineActions(m.series, m.sessions).map((a) => (
                  <div
                    key={a.text}
                    className="flex items-center gap-[9px]"
                    style={{ padding: "9px 11px", borderRadius: 11, background: "rgba(255,255,255,0.06)" }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.dot }} />
                    <span className="text-[11.5px] font-semibold" style={{ color: "#eaf2ff" }}>{a.text}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigate("weekly-plan")}
                className="w-full mt-3 text-[12px] font-semibold cursor-pointer border-none text-white transition-transform hover:-translate-y-px"
                style={{ padding: 10, borderRadius: 11, background: "linear-gradient(135deg,#4d7dff,#2ad6ef)" }}
              >
                Planı Güncelle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Parçalar ──────────────────────────────────────────────────────────── */

/**
 * Anahtar/değer satırı. Masaüstünde etiket solda, değer sağa yaslı.
 *
 * Telefonda aynı satır çalışmıyordu: kart ~250px'e inince "Destek ·
 * Kademeli sözel ipucu" gibi çiftlerde değer kabın sağ kenarına yapışıyor,
 * `truncate` yüzünden de kesiliyordu. Dar ekranda etiket üste, değer altına
 * geçer ve sararak tamamı okunur.
 */
function Row({ label, value, last = false }: { readonly label: string; readonly value: string; readonly last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-[9px] max-lg:flex-col max-lg:items-start max-lg:gap-0.5 max-lg:py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid var(--color-line-soft)" }}
    >
      <span className="text-[11.5px] text-(--color-text-soft) shrink-0">{label}</span>
      <span className="text-[11.5px] font-semibold text-(--color-text-strong) truncate text-right max-lg:text-left max-lg:whitespace-normal max-lg:overflow-visible max-lg:max-w-full">
        {value}
      </span>
    </div>
  );
}

/** Grafik kabının gerçek piksel genişliği. 0 = henüz ölçülmedi. */
function useBoxWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setWidth(Math.round(rect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}

/* Grafiğin geometrisi birim cinsinden yazılıyor; birimin kaç piksele
   denk düştüğü viewBox'a bağlı. Dar kapta birim = piksel olduğu için
   punto da doğrudan piksel: 11 birim ekranda 11px. */
const CURVE_H = 158;
const CURVE_W_DESKTOP = 560;
/* Bu genişliğin altındaki kap "dar" sayılır ve birim piksele eşitlenir.
   Eşik doğrudan masaüstü viewBox'ı: 420 olduğunda 420-560 birim arasındaki
   kaplar sabit 560 birimlik çizimi *küçülterek* basıyordu (ölçek 0.75-0.99),
   8.5 birimlik eksen etiketi 480px'lik bir katlanabilir telefonda 7px'e
   iniyordu. Eşik 560'a çekilince küçülme bandı tamamen kalkar: kap ya
   birebir ölçekte (dar) ya da büyütülerek (geniş) çizilir. */
const CURVE_NARROW_MAX = CURVE_W_DESKTOP;

/**
 * Gelişim Eğrisi. Hedef çizgisi kesikli — ölçülen değer değil, hedeflenen.
 * Bu ayrım olmadan grafik "ulaşıldı mı?" sorusunu cevaplamıyor.
 *
 * viewBox artık kabın darlığına göre seçiliyor. Sabit 560 birimlik viewBox
 * %100 genişlikte çizilirken telefonda kap ~250px'e düşüyor, ölçek 0.45'e
 * iniyordu: 8.5 birimlik eksen etiketleri ekranda 4px basıyor, S1…S10 ile
 * "hedef 85" okunmuyordu. Kap 560'ın altındaysa viewBox ölçülen piksel
 * genişliğine eşitlenir (ölçek tam 1) ve punto 11px'e çıkar. Kap geniş
 * olduğunda eski çizim birebir korunur.
 */
function GrowthCurve({ sessions }: { readonly sessions: readonly RecentSessionEntry[] }) {
  const [boxRef, boxW] = useBoxWidth();

  /* Ölçüm gelmeden çizmiyoruz: ilk kare 560 birimle basılıp sonra küçülünce
     grafik gözle görülür biçimde zıplıyor. */
  const measured = boxW > 0;
  const narrow = measured && boxW < CURVE_NARROW_MAX;
  const W = narrow ? boxW : CURVE_W_DESKTOP;
  const H = CURVE_H;
  const pad = { l: narrow ? 30 : 26, r: 12, t: 12, b: narrow ? 26 : 22 };
  /* Geniş kapta viewBox büyütülerek basılıyor, yani birim > piksel; yine de
     taban 10 birimin altına inmiyor ki eşik hemen üstündeki (560-620px)
     kaplarda etiket 10px'in altına düşmesin. */
  const axisFs = narrow ? 11 : 10;
  const targetFs = narrow ? 11 : 10.5;

  if (sessions.length < 2) {
    return (
      <div className="grid place-items-center text-[12px] text-(--color-text-soft)" style={{ height: H }}>
        Eğri için en az iki seans gerekiyor.
      </div>
    );
  }

  const xs = sessions.map((_, i) => pad.l + (i * (W - pad.l - pad.r)) / (sessions.length - 1));
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  /* Eksen 0-100; noktalar normalize skordan. Ham puanla çizildiğinde bir
     Kart Eşle seansı (280) grafiğin dışına taşıyordu. */
  const norm = (s: RecentSessionEntry) => Math.round(normalizeScore(s.gameKey as never, s.score) * 100);
  const pts = sessions.map((s, i) => `${xs[i].toFixed(1)} ${y(norm(s)).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${xs[xs.length - 1]} ${H - pad.b} L${xs[0]} ${H - pad.b} Z`;

  /* Etiketler punto büyüyünce birbirine giriyor: iki komşu etiket arası en
     az ~2.6 kadem olacak biçimde seyreltilir. Sayım sondan yapılır ki son
     seans (S10) her zaman yazılı kalsın. */
  const gapPerPoint = (W - pad.l - pad.r) / (sessions.length - 1);
  const labelEvery = narrow
    ? Math.max(1, Math.ceil((axisFs * 2.6) / gapPerPoint))
    : sessions.length <= 12
      ? 1
      : 2;
  const labelPhase = narrow ? (sessions.length - 1) % labelEvery : 0;

  return (
    <div ref={boxRef} className="w-full">
      {!measured ? (
        <div style={{ height: H }} />
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }} className="block" role="img" aria-label="Gelişim Eğrisi">
          <defs>
            <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.26" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line-soft)" strokeWidth={1} />
              <text x={pad.l - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="numeral" style={{ fontSize: axisFs, fill: "var(--color-text-muted)" }}>
                {v}
              </text>
            </g>
          ))}

          {/* Hedef */}
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(TARGET_SCORE)}
            y2={y(TARGET_SCORE)}
            stroke="var(--color-accent-green)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.75}
          />
          {/* Etiket dar ekranda sola geçer: sağ uçta son seansın noktası ve
              eğrinin tepesi 11px'lik yazının üstüne biniyordu. */}
          <text
            x={narrow ? pad.l + 3 : W - pad.r}
            y={y(TARGET_SCORE) - 5}
            textAnchor={narrow ? "start" : "end"}
            className="numeral"
            style={{ fontSize: targetFs, fontWeight: 600, fill: "var(--color-accent-green)" }}
          >
            hedef {TARGET_SCORE}
          </text>

          <path d={area} fill="url(#growth-fill)" />
          <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          {sessions.map((s, i) => (
            <circle key={s.id} cx={xs[i]} cy={y(norm(s))} r={3.4} fill="var(--color-signature-to)" stroke="var(--color-surface-strong)" strokeWidth={2} />
          ))}
          {sessions.map((s, i) =>
            i % labelEvery === labelPhase ? (
              <text key={`l-${s.id}`} x={xs[i]} y={H - (narrow ? 8 : 6)} textAnchor="middle" className="numeral" style={{ fontSize: axisFs, fill: "var(--color-text-muted)" }}>
                S{i + 1}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </div>
  );
}

function SessionHistory({
  sessions,
  total,
  onAll,
  fill = false,
}: {
  readonly sessions: readonly RecentSessionEntry[];
  readonly total: number;
  readonly onAll?: () => void;
  readonly fill?: boolean;
}) {
  return (
    <Card className={`flex flex-col min-h-0 ${fill ? "flex-1" : "flex-1"}`} pad="p-[18px_20px] max-lg:p-[16px_14px]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <CardTitle>Seans Geçmişi</CardTitle>
        {onAll ? (
          <button
            type="button"
            onClick={onAll}
            className="numeral shrink-0 inline-flex items-center text-[10.5px] font-semibold text-(--color-primary) bg-transparent border-none p-0 max-lg:min-h-11 cursor-pointer hover:underline"
          >
            Tümü · {total}
          </button>
        ) : (
          <span className="numeral shrink-0 text-[10.5px] font-semibold text-(--color-text-soft)">{total} seans</span>
        )}
      </div>
      {sessions.length === 0 ? (
        <div className="flex-1 grid place-items-center">
          <p className="m-0 text-[12.5px] text-(--color-text-soft)">Henüz seans kaydı yok.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-0">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 max-lg:gap-2.5 px-[13px] py-2.5 max-lg:px-2.5"
              style={{ borderRadius: 13, background: "var(--color-surface-strong)", border: "1px solid var(--color-line-soft)" }}
            >
              {/* Tarih masaüstünde kendi sütununda; telefonda 62px'lik bu sütun
                  oyun adına 100px bırakıyor, başlık "H…"ye kadar kırpılıyordu.
                  Dar ekranda tarih alt satıra, açıklamanın önüne geçer. */}
              <span className="numeral shrink-0 w-[62px] max-lg:hidden text-[11px] font-medium text-(--color-text-soft)">
                {shortDate(new Date(s.playedAt))}
              </span>
              {/* Alan rengi — hangi beceriye çalışıldığı listede renkten okunur */}
              <span className="shrink-0" style={{ width: 3, height: 26, borderRadius: 2, background: domainColor(s.gameKey) }} />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold text-(--color-text-strong) truncate">{gameTitle(s.gameKey)}</div>
                <div className="text-[10.5px] text-(--color-text-soft) truncate">
                  <span className="numeral lg:hidden">{shortDate(new Date(s.playedAt))} · </span>
                  {gameKicker(s.gameKey)}
                </div>
              </div>
              {/* Listede ham puan kendi biriminde, altında normalize karşılığı:
                  "184 puan" tek başına oyunlar arası kıyaslanamıyor, "%66"
                  ise hedefe uzaklığı söylüyor. */}
              {(() => {
                const pct = Math.round(normalizeScore(s.gameKey as never, s.score) * 100);
                return (
                  <span className="shrink-0 text-right">
                    <span
                      className="numeral block text-[15px] font-semibold leading-none"
                      style={{ color: pct >= TARGET_SCORE ? "var(--color-accent-green)" : "var(--color-primary)" }}
                    >
                      {s.score}
                    </span>
                    {/* Birim adı ("dizi uzunluğu", "doğru tur") telefonda skor
                        sütununu 130px'e çıkarıp oyun adını kırpıyordu. Dar
                        ekranda yalnızca normalize yüzde kalır — hedefe uzaklığı
                        söyleyen kısım o. */}
                    <span className="numeral block text-[9px] text-(--color-text-muted) mt-1 whitespace-nowrap">
                      <span className="max-md:hidden">
                        {GAME_SCORE_SCALE[s.gameKey as keyof typeof GAME_SCORE_SCALE]?.unit ?? "puan"} ·{" "}
                      </span>
                      %{pct}
                    </span>
                  </span>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Öneri Motoru kuralları ────────────────────────────────────────────── */

function engineSummary(series: readonly number[], avg: number | null): string {
  if (series.length < 3) return "Öneri için en az üç seans gerekiyor. Motor eğilim arıyor, tek ölçüm değil.";
  const last3 = series.slice(-3);
  const spread = Math.max(...last3) - Math.min(...last3);
  if (spread <= 3) return `Skor 3 seanstır ${Math.round(last3[2])} civarında sabit. Zorluk artışı ve dönüşümlü çalışma öneriliyor.`;
  if (last3[2] > last3[0]) return `Son üç seansta ${last3[2] - last3[0]} puanlık yükseliş var. Mevcut zorluk korunabilir.`;
  if (avg !== null && avg < 60) return "Skorlar hedefin belirgin altında. Zorluğu düşürüp başarı deneyimi kurmayı dene.";
  return "Skorlarda dalgalanma var. Seans süresi ve günün saati değişkenlerini kontrol et.";
}

function engineActions(series: readonly number[], sessions: readonly RecentSessionEntry[]) {
  const out: Array<{ dot: string; text: string }> = [];
  const played = new Set(sessions.map((s) => s.gameKey));
  const last3 = series.slice(-3);
  const stable = last3.length === 3 && Math.max(...last3) - Math.min(...last3) <= 3;
  const lastGame = sessions.length ? sessions[sessions.length - 1].gameKey : null;

  if (lastGame) {
    out.push({ dot: "#19d19b", text: `${gameTitle(lastGame)} → ${stable ? "Zor" : "Mevcut Seviye"}` });
  }
  const unplayed = (["logic", "scan", "route", "difference"] as const).find((k) => !played.has(k));
  if (unplayed) out.push({ dot: "#4d7dff", text: `${gameTitle(unplayed)} Ekle` });
  out.push({ dot: "#f5c26b", text: "Ev Programına 1 Aktivite" });

  return out.slice(0, 3);
}
