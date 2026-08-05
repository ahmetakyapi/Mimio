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
 */

import { useMemo, useState } from "react";
import { ChevronRight, Sparkles, FileText, Plus, Minus, Archive, Trash2 } from "lucide-react";
import type { AppView, ClientProfile, RecentSessionEntry, SessionNote, ClientGoal, PlatformGameKey } from "@/lib/platform-data";
import {
  metricsFor,
  gameTitle,
  gameKicker,
  domainColor,
  shortDate,
  INDEPENDENCE_STEPS,
  firstName,
} from "@/lib/deniz-derive";
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

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Kırıntı yolu */}
      <nav className="flex items-center gap-2 text-[11px] font-medium text-(--color-text-soft)" aria-label="Konum">
        <button type="button" onClick={onBack} className="bg-transparent border-none p-0 cursor-pointer hover:text-(--color-primary) transition-colors">
          Danışanlar
        </button>
        <ChevronRight size={12} />
        <span className="font-semibold text-(--color-text-strong)">{client.displayName}</span>
      </nav>

      {/* Başlık */}
      <div className="flex items-start gap-5 flex-wrap">
        <Avatar name={client.displayName} id={client.id} size={74} radius={22} className="!text-[30px] font-display" />
        <div className="flex-1 min-w-0">
          <h1 className="m-0 mb-2 text-[clamp(1.3125rem,2.1vw,1.8125rem)] leading-none text-(--color-text-strong)">
            {client.displayName}
          </h1>
          <div className="flex flex-wrap gap-[7px]">
            {client.ageGroup && <Tag tone="primary">{client.ageGroup} yaş</Tag>}
            {(client.tags ?? []).slice(0, 1).map((t) => (
              <Tag key={t} tone="primary">{t}</Tag>
            ))}
            {client.primaryGoal && <Tag tone="green">{client.primaryGoal}</Tag>}
            <Tag tone="amber">{m.independenceLabel} · {m.independence}/5</Tag>
            <Tag tone="violet">{m.sessionCount} seans</Tag>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button type="button" className={btnGhost} onClick={onCreateReport}>
            <span className="inline-flex items-center gap-2"><FileText size={14} /> Rapor Oluştur</span>
          </button>
          <button
            type="button"
            className="btn-signature px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
            onClick={() => onStartSession(client.id)}
          >
            Seansı Başlat
          </button>
        </div>
      </div>

      {/* Sekmeler — alt çizgi, kutu değil: içerik yüzeyiyle aynı düzlemde kalsın */}
      <div className="flex items-center gap-[22px]" style={{ borderBottom: "1px solid var(--color-line)" }} role="tablist">
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
              className={`relative bg-transparent border-none cursor-pointer text-[13px] transition-colors ${on ? "font-semibold text-(--color-primary)" : "font-medium text-(--color-text-soft) hover:text-(--color-text-body)"}`}
              style={{ padding: "9px 0" }}
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
          className="ml-auto text-[12px] font-semibold text-(--color-text-soft) hover:text-(--color-primary) bg-transparent border-none cursor-pointer transition-colors"
        >
          Haftalık Plan →
        </button>
      </div>

      <div className="grid gap-4 flex-1 min-h-0 deniz-split" style={{ ["--split" as string]: "262px minmax(0,1fr) 268px" }}>
        {/* ── Sol: sabit bilgi ── */}
        <div className="flex flex-col gap-3.5 min-h-0 overflow-y-auto">
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
              className="mt-2 flex items-center gap-1.5 text-[11px] font-medium bg-transparent border-none p-0 cursor-pointer text-(--color-text-muted) hover:text-(--color-accent-red) transition-colors"
            >
              <Archive size={12} /> Danışanı Arşivle
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

        {/* ── Orta: değişim ── */}
        <div className="flex flex-col gap-3.5 min-h-0">
          {tab === "overview" && (
            <>
              <Card pad="p-[18px_20px]" className="shrink-0">
                <div className="flex items-start justify-between mb-3.5 gap-3">
                  <div>
                    <CardTitle>Gelişim Eğrisi</CardTitle>
                    <div className="text-[11px] text-(--color-text-soft) mt-0.5">
                      {curve.length} seans · normalize skor
                    </div>
                  </div>
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
                <GrowthCurve sessions={curve} />
              </Card>

              <SessionHistory sessions={m.sessions.slice().reverse().slice(0, 6)} total={m.sessionCount} onAll={() => setTab("sessions")} />
            </>
          )}

          {tab === "sessions" && (
            <SessionHistory sessions={m.sessions.slice().reverse()} total={m.sessionCount} fill />
          )}

          {tab === "notes" && (
            <Card className="flex-1 flex flex-col min-h-0" pad="p-[18px_20px]">
              <div className="flex items-center justify-between mb-3">
                <CardTitle>Notlar</CardTitle>
                <button
                  type="button"
                  onClick={onAddNote}
                  className="btn-signature flex items-center gap-1.5 text-[11.5px] font-semibold cursor-pointer"
                  style={{ padding: "7px 12px", borderRadius: 9 }}
                >
                  <Plus size={13} /> Not Ekle
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
                          <button
                            type="button"
                            aria-label="Notu sil"
                            onClick={() => onDeleteNote(n.id)}
                            className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-muted) hover:text-(--color-accent-red) opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
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

        {/* ── Sağ: karar ── */}
        <div className="flex flex-col gap-3.5 min-h-0 overflow-y-auto">
          <Card pad="p-[18px_20px]">
            <div className="flex items-center justify-between mb-3.5">
              <Eyebrow>Hedefler</Eyebrow>
              {/* Hedefler daha önce yalnızca seed'den gelebiliyordu: ekleme
                  formu ve ilerleme güncelleme hiçbir yerden açılmıyordu. */}
              <button
                type="button"
                onClick={onAddGoal}
                className="flex items-center gap-1 text-[11px] font-semibold text-(--color-primary) bg-transparent border-none p-0 cursor-pointer hover:underline"
              >
                <Plus size={12} strokeWidth={2.4} /> Hedef Ekle
              </button>
            </div>
            {clientGoals.length === 0 ? (
              <p className="m-0 text-[12px] text-(--color-text-soft)">
                Tanımlı hedef yok. Hedef eklendiğinde ilerleme halkası burada görünür.
              </p>
            ) : (
              <div className="flex flex-col gap-3.5" style={{ maxHeight: 300, overflowY: "auto" }}>
                {clientGoals.map((g) => {
                  const pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0;
                  return (
                    <div key={g.id} className="flex items-center gap-3 group">
                      <ScoreRing value={pct} size={58} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold text-(--color-text-strong) truncate">{g.title}</div>
                        <div className="text-[10.5px] text-(--color-text-soft) mt-0.5 truncate">
                          Hedef {g.targetValue} · şu an {g.currentValue}
                        </div>
                      </div>
                      {/* İlerleme tek dokunuşla işlenir — seans arasında form açtırmak fazla tören */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
            className="rounded-[18px] relative overflow-hidden flex-1"
            style={{ padding: "18px 20px", background: "#0a1524" }}
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

function Row({ label, value, last = false }: { readonly label: string; readonly value: string; readonly last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3"
      style={{ padding: "9px 0", borderBottom: last ? "none" : "1px solid var(--color-line-soft)" }}
    >
      <span className="text-[11.5px] text-(--color-text-soft) shrink-0">{label}</span>
      <span className="text-[11.5px] font-semibold text-(--color-text-strong) truncate text-right">{value}</span>
    </div>
  );
}

/**
 * Gelişim Eğrisi. Hedef çizgisi kesikli — ölçülen değer değil, hedeflenen.
 * Bu ayrım olmadan grafik "ulaşıldı mı?" sorusunu cevaplamıyor.
 */
function GrowthCurve({ sessions }: { readonly sessions: readonly RecentSessionEntry[] }) {
  const H = 158;
  const W = 560;
  const pad = { l: 26, r: 12, t: 12, b: 22 };

  if (sessions.length < 2) {
    return (
      <div className="grid place-items-center text-[12px] text-(--color-text-soft)" style={{ height: H }}>
        Eğri için en az iki seans gerekiyor.
      </div>
    );
  }

  const xs = sessions.map((_, i) => pad.l + (i * (W - pad.l - pad.r)) / (sessions.length - 1));
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const pts = sessions.map((s, i) => `${xs[i].toFixed(1)} ${y(s.score).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${xs[xs.length - 1]} ${H - pad.b} L${xs[0]} ${H - pad.b} Z`;

  return (
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
          <text x={pad.l - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="numeral" style={{ fontSize: 8.5, fill: "var(--color-text-muted)" }}>
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
      <text x={W - pad.r} y={y(TARGET_SCORE) - 5} textAnchor="end" className="numeral" style={{ fontSize: 9, fontWeight: 600, fill: "var(--color-accent-green)" }}>
        hedef {TARGET_SCORE}
      </text>

      <path d={area} fill="url(#growth-fill)" />
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      {sessions.map((s, i) => (
        <circle key={s.id} cx={xs[i]} cy={y(s.score)} r={3.4} fill="var(--color-signature-to)" stroke="var(--color-surface-strong)" strokeWidth={2} />
      ))}
      {sessions.map((s, i) =>
        sessions.length <= 12 || i % 2 === 0 ? (
          <text key={`l-${s.id}`} x={xs[i]} y={H - 6} textAnchor="middle" className="numeral" style={{ fontSize: 8.5, fill: "var(--color-text-muted)" }}>
            S{i + 1}
          </text>
        ) : null,
      )}
    </svg>
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
    <Card className={`flex flex-col min-h-0 ${fill ? "flex-1" : "flex-1"}`} pad="p-[18px_20px]">
      <div className="flex items-center justify-between mb-3">
        <CardTitle>Seans Geçmişi</CardTitle>
        {onAll ? (
          <button
            type="button"
            onClick={onAll}
            className="numeral text-[10.5px] font-semibold text-(--color-primary) bg-transparent border-none p-0 cursor-pointer hover:underline"
          >
            Tümü · {total}
          </button>
        ) : (
          <span className="numeral text-[10.5px] font-semibold text-(--color-text-soft)">{total} seans</span>
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
              className="flex items-center gap-3"
              style={{ padding: "10px 13px", borderRadius: 13, background: "var(--color-surface-strong)", border: "1px solid var(--color-line-soft)" }}
            >
              <span className="numeral shrink-0 text-[11px] font-medium text-(--color-text-soft)" style={{ width: 62 }}>
                {shortDate(new Date(s.playedAt))}
              </span>
              {/* Alan rengi — hangi beceriye çalışıldığı listede renkten okunur */}
              <span className="shrink-0" style={{ width: 3, height: 26, borderRadius: 2, background: domainColor(s.gameKey) }} />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold text-(--color-text-strong) truncate">{gameTitle(s.gameKey)}</div>
                <div className="text-[10.5px] text-(--color-text-soft) truncate">{gameKicker(s.gameKey)}</div>
              </div>
              <span
                className="numeral text-[15px] font-semibold shrink-0"
                style={{ color: s.score >= TARGET_SCORE ? "var(--color-accent-green)" : "var(--color-primary)" }}
              >
                {s.score}
              </span>
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
