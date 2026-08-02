"use client";

/*
 * Bugün — terapistin günü açtığı ekran.
 *
 * Düzen tasarım dokümanındaki 1b/1c'yi izler: selam bloğu, dört ölçüm kartı
 * (sonuncusu imza degradesiyle "sıradaki seans"), altında 1.35fr/1fr ikili —
 * solda günün zaman çizelgesi, sağda öneriler ve hedef radarı.
 *
 * Ekranın tek amacı şu soruyu cevaplamak: "şimdi ne yapıyorum?" Bu yüzden
 * sıradaki seans hem kartta hem çizelgede işaretli ve iki yerden de
 * başlatılabiliyor.
 */

import { Plus, Sparkles, CalendarPlus } from "lucide-react";
import type { AppView, ClientProfile, RecentSessionEntry, WeeklyPlan, PlatformGameKey } from "@/lib/platform-data";
import {
  buildAgenda,
  buildInsights,
  metricsFor,
  gameTitle,
  gameKicker,
  greeting,
  splitEmphasis,
  type AgendaItem,
} from "@/lib/deniz-derive";
import { Avatar, Card, CardTitle, Eyebrow, Radar, ScreenHeader, Sparkline, btnGhost } from "./primitives";

interface Props {
  readonly now: Date;
  readonly therapistFirstName: string;
  readonly clients: readonly ClientProfile[];
  readonly sessions: readonly RecentSessionEntry[];
  readonly plans: readonly WeeklyPlan[];
  readonly averageScore: number;
  readonly onNavigate: (v: AppView) => void;
  readonly onStartSession: (clientId: string, gameKey: PlatformGameKey) => void;
  readonly onOpenClient: (clientId: string) => void;
}

export function TodayScreen({
  now,
  therapistFirstName,
  clients,
  sessions,
  plans,
  averageScore,
  onNavigate,
  onStartSession,
  onOpenClient,
}: Props) {
  const agenda = buildAgenda(now, plans, sessions, clients);
  const next = agenda.find((a) => a.status === "next");
  const doneCount = agenda.filter((a) => a.status === "done").length;
  const insights = buildInsights(clients, sessions);

  const dateLabel = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  /* Ortalama skor eğilimi: son 12 seans, eskiden yeniye. */
  const scoreSeries = sessions
    .slice()
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime())
    .slice(-12)
    .map((s) => s.score);

  const prevAvg = scoreSeries.length >= 6
    ? Math.round(scoreSeries.slice(0, -3).reduce((a, b) => a + b, 0) / (scoreSeries.length - 3))
    : null;
  const scoreDelta = prevAvg !== null ? averageScore - prevAvg : null;

  /* Radar, en çok seans görmüş danışanın alan profilini gösterir — boş bir
     radar çizmemek için veri taşıyan biri seçiliyor. */
  const radarClient = clients
    .map((c) => metricsFor(c, sessions))
    .sort((a, b) => b.sessionCount - a.sessionCount)[0];

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <ScreenHeader
        eyebrow={dateLabel}
        title={`${greeting(now)}, ${therapistFirstName}.`}
        sub={
          agenda.length === 0 ? (
            <>Bugün için planlanmış seans yok — <button type="button" onClick={() => onNavigate("weekly-plan")} className="font-bold text-(--color-primary) bg-transparent border-none p-0 cursor-pointer hover:underline">haftalık plana</button> bir slot ekleyebilirsin.</>
          ) : (
            <>
              Bugün <strong className="font-bold text-(--color-text-strong)">{agenda.length} seansın</strong> var
              {next ? <> — sıradaki {next.time ? `${next.time}'da ` : ""}{next.clientName} ile.</> : " — hepsi tamamlandı."}
            </>
          )
        }
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => onNavigate("weekly-plan")}>
              Haftayı gör
            </button>
            <button
              type="button"
              className="btn-signature flex items-center gap-2 px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
              onClick={() => onNavigate("games")}
            >
              <Plus size={15} strokeWidth={2.2} />
              Yeni seans
            </button>
          </>
        }
      />

      {/* ── Ölçüm satırı ── */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <Card pad="p-[17px_18px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-(--color-text-soft)">Bugünün seansı</span>
            {doneCount > 0 && (
              <span className="numeral text-[10px] font-semibold" style={{ color: "var(--color-accent-green)" }}>
                {doneCount} tamam
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="figure text-[30px] text-(--color-text-strong) leading-none">{agenda.length}</span>
            <span className="text-[13px] font-medium text-(--color-text-soft)">seans</span>
          </div>
          {agenda.length > 0 && (
            <div className="flex gap-1 mt-3">
              {agenda.slice(0, 6).map((a) => (
                <span
                  key={a.key}
                  className="flex-1 rounded-full"
                  style={{
                    height: 5,
                    background:
                      a.status === "done"
                        ? "var(--color-accent-green)"
                        : a.status === "next"
                          ? "var(--gradient-bar)"
                          : "var(--color-line-strong)",
                  }}
                />
              ))}
            </div>
          )}
        </Card>

        <Card pad="p-[17px_18px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-(--color-text-soft)">Ortalama skor</span>
            {scoreDelta !== null && scoreDelta !== 0 && (
              <span
                className="numeral text-[10px] font-semibold"
                style={{ color: scoreDelta > 0 ? "var(--color-accent-green)" : "var(--color-accent-red)" }}
              >
                {scoreDelta > 0 ? "+" : "−"}{Math.abs(scoreDelta)}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="figure text-[30px] text-(--color-text-strong) leading-none">{averageScore}</span>
            <span className="text-[13px] font-medium text-(--color-text-soft)">/100</span>
          </div>
          <div className="mt-2">
            <Sparkline series={scoreSeries} id="today-avg" width={220} height={26} />
          </div>
        </Card>

        <Card pad="p-[17px_18px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-(--color-text-soft)">Aktif danışan</span>
            <span className="numeral text-[10px] font-semibold text-(--color-text-soft)">{clients.length} kişi</span>
          </div>
          {clients.length === 0 ? (
            <button
              type="button"
              onClick={() => onNavigate("clients")}
              className="text-[12.5px] font-semibold text-(--color-primary) bg-transparent border-none p-0 cursor-pointer hover:underline"
            >
              İlk danışanı ekle →
            </button>
          ) : (
            <>
              <div className="flex items-center mt-1">
                {clients.slice(0, 4).map((c, i) => (
                  <span key={c.id} style={{ marginLeft: i === 0 ? 0 : -7 }}>
                    <Avatar name={c.displayName} id={c.id} size={32} radius={10} ring />
                  </span>
                ))}
                {clients.length > 4 && (
                  <span
                    className="numeral grid place-items-center text-[11px] font-semibold"
                    style={{
                      width: 32,
                      height: 32,
                      marginLeft: -7,
                      borderRadius: 10,
                      background: "var(--color-primary-light)",
                      color: "var(--color-primary-ink)",
                      boxShadow: "0 0 0 2px var(--color-surface-strong)",
                    }}
                  >
                    +{clients.length - 4}
                  </span>
                )}
              </div>
              <div className="mt-[11px] text-[11px] text-(--color-text-soft)">
                {(() => {
                  const stale = clients.filter((c) => {
                    const m = metricsFor(c, sessions);
                    return !m.lastPlayedAt || Date.now() - m.lastPlayedAt.getTime() > 7 * 86400000;
                  }).length;
                  return stale > 0 ? `${stale}'inin planı bu hafta güncellenmeli` : "Tüm planlar güncel";
                })()}
              </div>
            </>
          )}
        </Card>

        {/* Sıradaki seans — sayfadaki tek dolu degrade. Günün eylemi burada. */}
        <div
          className="tile-signature tile-signature-grain rounded-[16px]"
          style={{ padding: "17px 18px", boxShadow: "var(--shadow-glow)" }}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="on-signature-soft text-[11px] font-semibold">Sıradaki seans</span>
              {next?.time && (
                <span
                  className="numeral on-signature text-[10px] font-semibold"
                  style={{ padding: "2px 7px", borderRadius: 6, background: "rgba(255,255,255,0.2)" }}
                >
                  {next.time}
                </span>
              )}
            </div>
            {next ? (
              <>
                <div className="font-display on-signature font-semibold text-[19px] tracking-[-0.025em] mb-[3px]">
                  {next.clientName}
                </div>
                <div className="on-signature-soft text-[11.5px] mb-3">
                  {gameTitle(next.gameKey)} · {next.goal}
                </div>
                <button
                  type="button"
                  onClick={() => onStartSession(next.clientId, next.gameKey)}
                  className="w-full font-semibold text-[12px] cursor-pointer border-none transition-transform hover:-translate-y-px"
                  style={{ padding: 9, borderRadius: 10, background: "rgba(255,255,255,0.94)", color: "#1b4bc4" }}
                >
                  Seansı başlat
                </button>
              </>
            ) : (
              <>
                <div className="font-display on-signature font-semibold text-[19px] tracking-[-0.025em] mb-[3px]">
                  {doneCount > 0 ? "Gün tamamlandı" : "Boş gün"}
                </div>
                <div className="on-signature-soft text-[11.5px] mb-3">
                  {doneCount > 0 ? `${doneCount} seans kaydedildi` : "Plana seans ekleyerek başla"}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("weekly-plan")}
                  className="w-full font-semibold text-[12px] cursor-pointer border-none transition-transform hover:-translate-y-px"
                  style={{ padding: 9, borderRadius: 10, background: "rgba(255,255,255,0.94)", color: "#1b4bc4" }}
                >
                  Haftayı planla
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Çizelge + paneller ── */}
      <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: "1.35fr 1fr" }}>
        <Agenda items={agenda} onStart={onStartSession} onOpenClient={onOpenClient} onPlan={() => onNavigate("weekly-plan")} />

        <div className="flex flex-col gap-4 min-h-0">
          <div
            className="rounded-[18px] shrink-0"
            style={{
              padding: "19px 21px",
              background: "var(--gradient-signature-soft)",
              border: "1px solid var(--color-line-strong)",
            }}
          >
            <div className="flex items-center gap-2 mb-3.5">
              <Sparkles size={15} strokeWidth={1.9} style={{ color: "var(--color-primary)" }} />
              <CardTitle className="!text-[13.5px]">Akıllı öneriler</CardTitle>
              {insights.length > 0 && (
                <span className="numeral ml-auto text-[9px] font-semibold text-(--color-primary-ink)">
                  {insights.length} YENİ
                </span>
              )}
            </div>
            {insights.length === 0 ? (
              <p className="m-0 text-[12px] leading-[1.5] text-(--color-text-soft)">
                Öneri üretmek için birkaç seans daha gerekiyor — kural tabanlı motor en az 3 seanslık eğilim arıyor.
              </p>
            ) : (
              <div className="flex flex-col gap-[9px]">
                {insights.map((ins) => (
                  <div
                    key={ins.id}
                    style={{ padding: "12px 13px", borderRadius: 13, background: "var(--color-surface-strong)" }}
                  >
                    <div className="flex items-center gap-[7px] mb-[5px]">
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background:
                            ins.tone === "amber"
                              ? "var(--color-accent-amber)"
                              : ins.tone === "green"
                                ? "var(--color-accent-green)"
                                : "var(--color-primary)",
                        }}
                      />
                      <span
                        className="numeral text-[10px] font-semibold"
                        style={{
                          color:
                            ins.tone === "amber"
                              ? "var(--color-accent-amber)"
                              : ins.tone === "green"
                                ? "var(--color-accent-green)"
                                : "var(--color-primary-ink)",
                        }}
                      >
                        {ins.label}
                      </span>
                    </div>
                    <p className="m-0 text-[12px] leading-[1.5] text-(--color-text-body)">
                      {splitEmphasis(ins.text).map((p, i) =>
                        p.strong ? (
                          <strong key={i} className="font-bold text-(--color-text-strong)">{p.text}</strong>
                        ) : (
                          <span key={i}>{p.text}</span>
                        ),
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Card className="flex-1 flex flex-col min-h-0" pad="p-[19px_21px]">
            <div className="flex items-center justify-between mb-1.5">
              <CardTitle className="!text-[13.5px]">Hedef radarı</CardTitle>
              {radarClient && radarClient.sessionCount > 0 && (
                <span className="numeral text-[10px] font-medium text-(--color-text-soft)">
                  {radarClient.client.displayName} · {radarClient.sessionCount} seans
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 grid place-items-center">
              {radarClient && radarClient.sessionCount > 0 ? (
                <Radar id="today" size={200} axes={radarAxes(radarClient.sessions)} />
              ) : (
                <p className="m-0 text-center text-[12px] text-(--color-text-soft)">
                  Radar için en az bir seans gerekiyor.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* Radar eksenleri: beş beceri alanı, her biri o alandaki seansların ortalaması. */
function radarAxes(sessions: readonly RecentSessionEntry[]) {
  const byGame = new Map<string, number[]>();
  for (const s of sessions) {
    const arr = byGame.get(s.gameKey) ?? [];
    arr.push(s.score);
    byGame.set(s.gameKey, arr);
  }
  const avgOf = (keys: string[]) => {
    const xs = keys.flatMap((k) => byGame.get(k) ?? []);
    return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;
  };
  return [
    { label: "Çalışma belleği", value: avgOf(["memory"]) },
    { label: "Dikkat", value: avgOf(["scan"]) },
    { label: "İnce motor", value: avgOf(["pulse", "route"]) },
    { label: "Görsel algı", value: avgOf(["difference", "pairs"]) },
    { label: "Yürütücü", value: avgOf(["logic"]) },
  ];
}

/* ── Zaman çizelgesi ───────────────────────────────────────────────────── */

function Agenda({
  items,
  onStart,
  onOpenClient,
  onPlan,
}: {
  readonly items: readonly AgendaItem[];
  readonly onStart: (clientId: string, gameKey: PlatformGameKey) => void;
  readonly onOpenClient: (clientId: string) => void;
  readonly onPlan: () => void;
}) {
  const span = items.length
    ? `${items.find((i) => i.time)?.time ?? "—"} – ${[...items].reverse().find((i) => i.time)?.time ?? "—"}`
    : "boş";

  return (
    <Card className="flex flex-col min-h-0" pad="p-[20px_22px]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <CardTitle>Bugünün akışı</CardTitle>
          <div className="text-[11px] text-(--color-text-soft) mt-0.5">Zaman çizelgesi · {span}</div>
        </div>
        <span
          className="numeral text-[10.5px] font-semibold text-(--color-primary-ink)"
          style={{ padding: "5px 10px", borderRadius: 8, background: "var(--color-primary-light)" }}
        >
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 grid place-items-center">
          <div className="text-center">
            <p className="m-0 mb-3 text-[13px] text-(--color-text-soft)">Bugüne planlanmış seans yok.</p>
            <button type="button" className={btnGhost} onClick={onPlan}>
              <span className="inline-flex items-center gap-2">
                <CalendarPlus size={14} /> Haftalık plana ekle
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Sol oluk saat sütunu; dikey çizgi degradeyle yukarıdan aşağı söner —
           gün ilerledikçe "geçmiş" hafifliyor. */
        <div className="flex-1 relative overflow-y-auto" style={{ paddingLeft: 60 }}>
          <span
            aria-hidden="true"
            className="absolute"
            style={{
              left: 44,
              top: 6,
              bottom: 6,
              width: 2,
              borderRadius: 2,
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 28%, transparent), color-mix(in srgb, var(--color-signature-to) 14%, transparent), transparent)",
            }}
          />
          <div className="flex flex-col gap-[11px]">
            {items.map((it) => (
              <AgendaRow key={it.key} item={it} onStart={onStart} onOpenClient={onOpenClient} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AgendaRow({
  item,
  onStart,
  onOpenClient,
}: {
  readonly item: AgendaItem;
  readonly onStart: (clientId: string, gameKey: PlatformGameKey) => void;
  readonly onOpenClient: (clientId: string) => void;
}) {
  const isNext = item.status === "next";
  const isDone = item.status === "done";

  return (
    <div
      className="relative flex items-center gap-3"
      style={{
        padding: isNext ? 14 : "12px 14px",
        borderRadius: 14,
        background: isNext
          ? "var(--gradient-signature-soft)"
          : isDone
            ? "color-mix(in srgb, var(--color-accent-green) 7%, transparent)"
            : "var(--color-surface-strong)",
        border: `1px solid ${isNext ? "var(--color-line-strong)" : "var(--color-line)"}`,
      }}
    >
      {/* Saat — çizelgenin dışına, sol oluğa taşar */}
      <span
        className="numeral absolute text-[11px] font-medium"
        style={{ left: -60, width: 34, textAlign: "right", color: isNext ? "var(--color-primary)" : "var(--color-text-soft)" }}
      >
        {item.time ?? "—"}
      </span>
      {/* Çizgi üzerindeki nokta */}
      <span
        aria-hidden="true"
        className="absolute"
        style={{
          left: -21,
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: isDone ? "var(--color-accent-green)" : isNext ? "var(--color-primary)" : "var(--color-surface-strong)",
          border: isDone || isNext ? "none" : "2px solid var(--color-line-strong)",
          boxShadow: isNext ? "0 0 0 4px color-mix(in srgb, var(--color-primary) 18%, transparent)" : undefined,
        }}
      />

      <button
        type="button"
        onClick={() => onOpenClient(item.clientId)}
        className="bg-transparent border-none p-0 cursor-pointer shrink-0"
        aria-label={`${item.clientName} profilini aç`}
      >
        <Avatar name={item.clientName} id={item.clientId} size={34} radius={11} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[7px]">
          <span className="font-bold text-[13px] text-(--color-text-strong) truncate">{item.clientName}</span>
          {isNext && (
            <span
              className="numeral text-[9px] font-semibold text-white shrink-0"
              style={{ padding: "2px 6px", borderRadius: 5, background: "var(--color-primary)" }}
            >
              SIRADAKİ
            </span>
          )}
        </div>
        <div className="text-[11px] text-(--color-text-soft) truncate">
          {gameTitle(item.gameKey)} · {item.goal || gameKicker(item.gameKey)}
        </div>
      </div>

      {isDone ? (
        <div className="text-right shrink-0">
          <div className="numeral text-[15px] font-semibold" style={{ color: "var(--color-accent-green)" }}>
            {item.score ?? "—"}
          </div>
          <div className="text-[9.5px] text-(--color-text-soft)">tamamlandı</div>
        </div>
      ) : isNext ? (
        <button
          type="button"
          onClick={() => onStart(item.clientId, item.gameKey)}
          className="btn-signature shrink-0 text-[11.5px] font-semibold cursor-pointer"
          style={{ padding: "9px 14px", borderRadius: 10 }}
        >
          Başlat
        </button>
      ) : (
        <span
          className="shrink-0 text-[10.5px] font-medium text-(--color-text-soft)"
          style={{ padding: "5px 10px", borderRadius: 8, background: "var(--color-primary-light)" }}
        >
          Planlandı
        </span>
      )}
    </div>
  );
}
