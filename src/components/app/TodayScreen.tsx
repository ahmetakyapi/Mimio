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
import { Avatar, Card, CardTitle, Radar, ScreenHeader, Sparkline, btnGhost } from "./primitives";
import { normalizeScore } from "@/lib/game-constants";

interface Props {
  readonly now: Date;
  readonly therapistFirstName: string;
  readonly clients: readonly ClientProfile[];
  readonly sessions: readonly RecentSessionEntry[];
  readonly plans: readonly WeeklyPlan[];
  readonly averageScore: number;
  /** Ayarlar → "Plato Uyarısı" kapalıysa plato önerileri bastırılır. */
  readonly plateauAlert: boolean;
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
  plateauAlert,
  onNavigate,
  onStartSession,
  onOpenClient,
}: Props) {
  const agenda = buildAgenda(now, plans, sessions, clients);
  const next = agenda.find((a) => a.status === "next");
  const doneCount = agenda.filter((a) => a.status === "done").length;
  /* Ayarlardaki anahtar burada gerçekten bir şey yapmalı — daha önce yalnızca
     görünüşte bir tercihdi, hiçbir yerde okunmuyordu. */
  const insights = buildInsights(clients, sessions).filter((i) => plateauAlert || i.label !== "Plato");

  const dateLabel = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  /* Ortalama skor eğilimi: son 12 seans, eskiden yeniye, normalize. */
  const scoreSeries = sessions
    .slice()
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime())
    .slice(-12)
    .map((s) => Math.round(normalizeScore(s.gameKey as never, s.score) * 100));

  const prevAvg = scoreSeries.length >= 6
    ? Math.round(scoreSeries.slice(0, -3).reduce((a, b) => a + b, 0) / (scoreSeries.length - 3))
    : null;
  const scoreDelta = prevAvg !== null ? averageScore - prevAvg : null;

  /* Radar, en çok seans görmüş danışanın alan profilini gösterir — boş bir
     radar çizmemek için veri taşıyan biri seçiliyor. */
  const radarClient = clients
    .map((c) => metricsFor(c, sessions))
    .sort((a, b) => b.sessionCount - a.sessionCount)[0];

  /* Telefonda `h-full min-h-0` zinciri ekranı viewport'a hapsedip kartları
     eziyordu; mobilde doğal yükseklik, masaüstünde eski davranış. */
  return (
    <div className="flex flex-col gap-4 lg:gap-5 lg:h-full lg:min-h-0">
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
              Haftayı Gör
            </button>
            <button
              type="button"
              className="btn-signature flex items-center gap-2 px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
              onClick={() => onNavigate("games")}
            >
              <Plus size={15} strokeWidth={2.2} />
              Yeni Seans
            </button>
          </>
        }
      />

      {/* ── Ölçüm satırı ──
          Telefonda ızgara iki sütun; "Sıradaki Seans" ve "Aktif Danışan" iki
          sütunu birden kaplar. Böylece dört kart 2×2'ye sıkışıp yükseklikleri
          tutmuyor olmaktan çıkar: günün eylemi en üstte tam genişlikte durur,
          altında iki dar ölçüm, en altta danışan şeridi. */}
      <div className="grid gap-3 lg:gap-3.5" style={{ gridTemplateColumns: "var(--stat-cols, repeat(4, minmax(0, 1fr)))" }}>
        <Card pad="p-[15px_15px] lg:p-[17px_18px]">
          {/* Dar kapta etiket + rozet tek satıra sığmayıp ikisi de kelime
              ortasından sarıyordu; `flex-wrap` ile rozet bütün hâlde alt
              satıra iner. */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-2.5 lg:mb-3">
            <span className="text-[11px] font-semibold text-(--color-text-soft)">Bugünün Seansı</span>
            {doneCount > 0 && (
              <span className="numeral text-[10px] font-semibold shrink-0" style={{ color: "var(--color-accent-green)" }}>
                {doneCount} tamam
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="figure text-[26px] lg:text-[30px] text-(--color-text-strong) leading-none">{agenda.length}</span>
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

        <Card pad="p-[15px_15px] lg:p-[17px_18px]">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-2.5 lg:mb-3">
            <span className="text-[11px] font-semibold text-(--color-text-soft)">Ortalama Skor</span>
            {scoreDelta !== null && scoreDelta !== 0 && (
              <span
                className="numeral text-[10px] font-semibold shrink-0"
                style={{ color: scoreDelta > 0 ? "var(--color-accent-green)" : "var(--color-accent-red)" }}
              >
                {scoreDelta > 0 ? "+" : "−"}{Math.abs(scoreDelta)}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="figure text-[26px] lg:text-[30px] text-(--color-text-strong) leading-none">{averageScore}</span>
            <span className="text-[13px] font-medium text-(--color-text-soft)">/100</span>
          </div>
          {/* Aynı seri iki tavanla: 220 birimlik viewBox telefonda ~100px'lik
              kaba oturunca `preserveAspectRatio="none"` çizgiyi ve uç noktayı
              yatayda eziyordu. Dar tavan bu bozulmayı kaldırır. */}
          <div className="mt-2 lg:hidden">
            <Sparkline series={scoreSeries} id="today-avg-sm" width={116} height={24} />
          </div>
          <div className="mt-2 max-lg:hidden">
            <Sparkline series={scoreSeries} id="today-avg" width={220} height={26} />
          </div>
        </Card>

        <Card className="max-lg:col-span-2" pad="p-[15px_15px] lg:p-[17px_18px]">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-2.5 lg:mb-3">
            <span className="text-[11px] font-semibold text-(--color-text-soft)">Aktif Danışan</span>
            <span className="numeral text-[10px] font-semibold text-(--color-text-soft) shrink-0">{clients.length} kişi</span>
          </div>
          {clients.length === 0 ? (
            <button
              type="button"
              onClick={() => onNavigate("clients")}
              className="text-[12.5px] font-semibold text-(--color-primary) bg-transparent border-none p-0 cursor-pointer hover:underline"
            >
              İlk Danışanı Ekle →
            </button>
          ) : (
            /* Telefonda kart tam genişlikte olduğu için avatarlar ile not
               yan yana durur — alt alta konsa kartın altında boş bant kalıyor.
               Masaüstünde sarmalayıcı düz blok, düzen değişmez. */
            <div className="max-lg:flex max-lg:items-center max-lg:gap-3">
              <div className="flex items-center mt-1 max-lg:mt-0 max-lg:shrink-0">
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
              <div className="mt-[11px] max-lg:mt-0 max-lg:min-w-0 text-[11px] text-(--color-text-soft)">
                {(() => {
                  const stale = clients.filter((c) => {
                    const m = metricsFor(c, sessions);
                    return !m.lastPlayedAt || Date.now() - m.lastPlayedAt.getTime() > 7 * 86400000;
                  }).length;
                  /* "3'inin" gibi ek uydurmak sayıya göre bozuluyor (3'ünün,
                     5'inin, 6'sının…); adı anıp eki sabitlemek her sayıda doğru. */
                  return stale > 0 ? `${stale} danışanın planı bu hafta güncellenmeli` : "Tüm planlar güncel";
                })()}
              </div>
            </div>
          )}
        </Card>

        {/* Sıradaki Seans — sayfadaki tek dolu degrade. Günün eylemi burada.
            Telefonda iki sütunu birden kaplar ve ölçüm kartlarının önüne
            geçer: yarım sütunda başlık iki-üç satıra bölünüp kartı uzatıyordu,
            üstelik ekranın cevapladığı soru ("şimdi ne yapıyorum?") en altta
            kalıyordu. */}
        <div
          className="tile-signature-ink tile-signature-grain rounded-[16px] p-[15px_16px] lg:p-[17px_18px] max-lg:col-span-2 max-lg:order-first"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <div className="relative">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="on-signature-soft text-[11px] font-semibold">Sıradaki Seans</span>
              {next?.time && (
                <span
                  className="numeral on-signature text-[10px] font-semibold shrink-0"
                  style={{ padding: "2px 7px", borderRadius: 6, background: "rgba(255,255,255,0.2)" }}
                >
                  {next.time}
                </span>
              )}
            </div>
            {next ? (
              <>
                <div className="font-display on-signature font-semibold text-[17px] lg:text-[19px] max-lg:leading-[1.2] tracking-[-0.025em] mb-[3px]">
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
                  Seansı Başlat
                </button>
              </>
            ) : (
              <>
                <div className="font-display on-signature font-semibold text-[17px] lg:text-[19px] max-lg:leading-[1.2] tracking-[-0.025em] mb-[3px]">
                  {doneCount > 0 ? "Gün Tamamlandı" : "Boş Gün"}
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
                  Haftayı Planla
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Çizelge + paneller ── */}
      <div className="grid gap-3.5 lg:gap-4 lg:flex-1 lg:min-h-0 deniz-split" style={{ ["--split" as string]: "1.35fr 1fr" }}>
        <Agenda items={agenda} onStart={onStartSession} onOpenClient={onOpenClient} onPlan={() => onNavigate("weekly-plan")} />

        <div className="flex flex-col gap-3.5 lg:gap-4 lg:min-h-0">
          <div
            className="rounded-[18px] shrink-0 p-[16px_16px] lg:p-[19px_21px]"
            style={{
              background: "var(--gradient-signature-soft)",
              border: "1px solid var(--color-line-strong)",
            }}
          >
            <div className="flex items-center gap-2 mb-3 lg:mb-3.5">
              <Sparkles size={15} strokeWidth={1.9} style={{ color: "var(--color-primary)" }} />
              <CardTitle className="!text-[13.5px]">Akıllı Öneriler</CardTitle>
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

          <Card className="lg:flex-1 flex flex-col lg:min-h-0" pad="p-[16px_16px] lg:p-[19px_21px]">
            {/* Dar kapta başlık ve künye aynı satırda ikiye bölünüyordu;
                telefonda alt alta, künye tek satırda kısalarak. */}
            <div className="flex items-center justify-between gap-2 mb-1.5 max-lg:flex-col max-lg:items-start max-lg:gap-0.5">
              <CardTitle className="!text-[13.5px]">Hedef Radarı</CardTitle>
              {radarClient && radarClient.sessionCount > 0 && (
                <span className="numeral text-[10px] font-medium text-(--color-text-soft) truncate max-w-full">
                  {radarClient.client.displayName} · {radarClient.sessionCount} seans
                </span>
              )}
            </div>
            {/* Radar kaba göre ölçeklenir. Telefonda kap kare olunca SVG'nin
                viewBox'ı tüm genişliği kaplıyor, eksen etiketleri ("Yürütücü",
                "Dikkat") kutunun dışına düşüp kırpılıyordu. Sabit yükseklik
                veriyoruz: viewBox yüksekliğe göre oturur, yanlarda kalan boşluk
                etiketlere yer açar — kart da yarı yarıya kısalır. */}
            <div className="lg:flex-1 lg:min-h-0 grid place-items-center max-lg:h-[168px] max-lg:mt-1">
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

/* Radar eksenleri: beş beceri alanı, her biri o alandaki seansların ortalaması.
   Eksenler 0-100 olduğu için değerler normalize edilir; ham puanla bir
   Kart Eşle seansı (280) radarı tek yöne çekip şekli okunmaz kılıyordu. */
function radarAxes(sessions: readonly RecentSessionEntry[]) {
  const byGame = new Map<string, number[]>();
  for (const s of sessions) {
    const arr = byGame.get(s.gameKey) ?? [];
    arr.push(Math.round(normalizeScore(s.gameKey as never, s.score) * 100));
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

/* ── Zaman Çizelgesi ───────────────────────────────────────────────────── */

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
    <Card className="flex flex-col lg:min-h-0" pad="p-[16px_16px] lg:p-[20px_22px]">
      <div className="flex items-start justify-between gap-2 mb-3.5 lg:mb-4">
        <div className="min-w-0">
          <CardTitle>Bugünün Akışı</CardTitle>
          <div className="text-[11px] text-(--color-text-soft) mt-0.5">Zaman Çizelgesi · {span}</div>
        </div>
        <span
          className="numeral text-[10.5px] font-semibold text-(--color-primary-ink) shrink-0"
          style={{ padding: "5px 10px", borderRadius: 8, background: "var(--color-primary-light)" }}
        >
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="lg:flex-1 grid place-items-center max-lg:py-6">
          <div className="text-center">
            <p className="m-0 mb-3 text-[13px] text-(--color-text-soft)">Bugüne planlanmış seans yok.</p>
            <button type="button" className={btnGhost} onClick={onPlan}>
              <span className="inline-flex items-center gap-2">
                <CalendarPlus size={14} /> Haftalık Plana Ekle
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Sol oluk saat sütunu; dikey çizgi degradeyle yukarıdan aşağı söner —
           gün ilerledikçe "geçmiş" hafifliyor. Telefonda oluk tamamen kalkar:
           60px'lik pay 320px ekranda satıra ~180px bırakıyor, danışan adı ile
           skor iç içe geçiyordu. Saat o zaman satırın künye satırına iner
           (aşağıya bkz.), çizgi ve nokta gizlenir. */
        <div className="lg:flex-1 relative overflow-y-auto pl-0 lg:pl-[60px]">
          <span
            aria-hidden="true"
            className="absolute max-lg:hidden"
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
          <div className="flex flex-col gap-2.5 lg:gap-[11px]">
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
      className={`relative flex items-center gap-2.5 lg:gap-3 ${
        isNext ? "p-[11px] lg:p-[14px]" : "p-[10px_11px] lg:p-[12px_14px]"
      }`}
      style={{
        borderRadius: 14,
        background: isNext
          ? "var(--gradient-signature-soft)"
          : isDone
            ? "color-mix(in srgb, var(--color-accent-green) 7%, transparent)"
            : "var(--color-surface-strong)",
        border: `1px solid ${isNext ? "var(--color-line-strong)" : "var(--color-line)"}`,
      }}
    >
      {/* Saat — çizelgenin dışına, sol oluğa taşar. Telefonda oluk olmadığı
          için gizlenir; aynı bilgi künye satırının başında durur. */}
      <span
        className="numeral absolute text-[11px] font-medium max-lg:hidden"
        style={{ left: -60, width: 34, textAlign: "right", color: isNext ? "var(--color-primary)" : "var(--color-text-soft)" }}
      >
        {item.time ?? "—"}
      </span>
      {/* Çizgi üzerindeki nokta */}
      <span
        aria-hidden="true"
        className="absolute max-lg:hidden"
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

      {/* `p-0` kalkmadı ama dokunma payı açıkça verildi: küresel 44px kuralı
          `p-0` taşıyan düğmeleri dışarıda bırakıyor, avatar 34×34'te kalıyordu. */}
      <button
        type="button"
        onClick={() => onOpenClient(item.clientId)}
        className="bg-transparent border-none p-0 cursor-pointer shrink-0 grid place-items-center max-lg:min-w-[44px] max-lg:min-h-[44px]"
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
          {/* Saat mobilde buraya iner — oluk kalktı, bilgi kalmalı. */}
          <span
            className="numeral font-medium lg:hidden"
            style={{ color: isNext ? "var(--color-primary)" : undefined }}
          >
            {item.time ?? "—"}
            {" · "}
          </span>
          {gameTitle(item.gameKey)} · {item.goal || gameKicker(item.gameKey)}
        </div>
      </div>

      {isDone ? (
        <div className="text-right shrink-0">
          <div className="numeral text-[15px] font-semibold" style={{ color: "var(--color-accent-green)" }}>
            {item.score ?? "—"}
          </div>
          <div className="text-[9.5px] text-(--color-text-soft)">Tamamlandı</div>
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
