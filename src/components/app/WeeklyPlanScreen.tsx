"use client";

/*
 * Haftalık Plan — yedi sütunlu ızgara + sağda karar rayı (1h).
 *
 * Ekranın işi kapasiteyi görünür kılmak: hangi gün dolu, hangi alan ihmal
 * edilmiş, kim uzun süredir gelmemiş. Bu yüzden bloklar alan rengiyle
 * boyanıyor — terapist haftaya baktığında dört rengin dağılımını görüyor,
 * tek tek okumadan dengesizliği fark ediyor.
 */

import { useMemo, useState } from "react";
import { Plus, Sparkles, X, GripVertical } from "lucide-react";
import type {
  AppView,
  ClientProfile,
  RecentSessionEntry,
  WeeklyPlan,
  WeeklyPlanEntry,
  DayKey,
  PlatformGameKey,
} from "@/lib/platform-data";
import { GAME_TABS } from "@/lib/game-constants";
import { THERAPY_PROTOCOLS } from "@/lib/therapy-protocols";
import {
  DAY_KEYS,
  DAY_LABELS,
  DOMAIN_META,
  DOMAIN_ORDER,
  domainBalance,
  domainColor,
  gameTitle,
  gameDomain,
  isoDate,
  startOfWeek,
  metricsFor,
  firstName,
  relativeDay,
} from "@/lib/deniz-derive";
import { Card, CardTitle, Eyebrow, MeterBar, ScreenHeader, SegmentedControl } from "./primitives";

interface Props {
  readonly now: Date;
  readonly clients: readonly ClientProfile[];
  readonly sessions: readonly RecentSessionEntry[];
  readonly plans: readonly WeeklyPlan[];
  readonly weekCapacity: number;
  readonly onNavigate: (v: AppView) => void;
  readonly onAddEntry: (clientId: string, day: DayKey, entry: WeeklyPlanEntry) => void;
  readonly onRemoveEntry: (clientId: string, day: DayKey, index: number) => void;
  readonly onStartSession: (clientId: string, gameKey: PlatformGameKey) => void;
}

interface Block {
  clientId: string;
  clientName: string;
  day: DayKey;
  index: number;
  entry: WeeklyPlanEntry;
}

export function WeeklyPlanScreen({
  now,
  clients,
  sessions,
  plans,
  weekCapacity,
  onNavigate,
  onAddEntry,
  onRemoveEntry,
  onStartSession,
}: Props) {
  const [scope, setScope] = useState<"week" | "client">("week");
  const [clientFilter, setClientFilter] = useState<string>(clients[0]?.id ?? "");
  const [composer, setComposer] = useState<DayKey | null>(null);

  const weekStartDate = startOfWeek(now);
  const weekStart = isoDate(weekStartDate);
  const todayKey = DAY_KEYS[(now.getDay() + 6) % 7];

  const dayDates = useMemo(
    () =>
      DAY_KEYS.map((_, i) => {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStartDate],
  );

  /* Haftanın blokları — plan kayıtları gün gün düzleştiriliyor. */
  const blocks = useMemo(() => {
    const out: Record<DayKey, Block[]> = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    for (const plan of plans) {
      if (plan.weekStartDate.slice(0, 10) !== weekStart) continue;
      if (scope === "client" && plan.clientId !== clientFilter) continue;
      const name = clients.find((c) => c.id === plan.clientId)?.displayName ?? "Danışan";
      for (const day of DAY_KEYS) {
        (plan.days?.[day] ?? []).forEach((entry, index) => {
          out[day].push({ clientId: plan.clientId, clientName: name, day, index, entry });
        });
      }
    }
    for (const day of DAY_KEYS) {
      out[day].sort((a, b) => (a.entry.time ?? "99:99").localeCompare(b.entry.time ?? "99:99"));
    }
    return out;
  }, [plans, weekStart, scope, clientFilter, clients]);

  const planned = DAY_KEYS.reduce((n, d) => n + blocks[d].length, 0);
  const fillPct = weekCapacity > 0 ? Math.round((planned / weekCapacity) * 100) : 0;

  const balance = useMemo(() => {
    /* Denge planlanan bloklardan hesaplanır, geçmiş seanslardan değil:
       burada soru "bu haftayı nasıl kurdum", "geçen ay ne yaptım" değil. */
    const fake = DAY_KEYS.flatMap((d) => blocks[d]).map((b) => ({ gameKey: b.entry.gameKey }) as RecentSessionEntry);
    return domainBalance(fake.length ? fake : sessions);
  }, [blocks, sessions]);

  const underserved = balance.filter((b) => b.pct < 15).sort((a, b) => a.pct - b.pct)[0];

  /* Uzun süredir seans görmeyen danışan — öneri motorunun girdisi. */
  const idle = useMemo(() => {
    const scored = clients
      .map((c) => ({ c, m: metricsFor(c, sessions) }))
      .filter(({ m }) => !m.lastPlayedAt || Date.now() - m.lastPlayedAt.getTime() > 4 * 86400000)
      .sort((a, b) => (a.m.lastPlayedAt?.getTime() ?? 0) - (b.m.lastPlayedAt?.getTime() ?? 0));
    return scored[0] ?? null;
  }, [clients, sessions]);

  const weekLabel = `${dayDates[0].toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} – ${dayDates[6].toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <ScreenHeader
        eyebrow={weekLabel}
        title="Haftalık Plan"
        sub={`${planned} seans planlandı · ${weekCapacity} slot kapasite · doluluk %${fillPct}`}
        actions={
          <>
            <SegmentedControl
              label="Plan görünümü"
              value={scope}
              onChange={setScope}
              options={[
                { value: "week", label: "Hafta" },
                { value: "client", label: "Danışan" },
              ]}
            />
            {scope === "client" && clients.length > 0 && (
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="text-[12px] font-semibold text-(--color-text-body) cursor-pointer outline-none"
                style={{ padding: "9px 12px", borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="btn-signature flex items-center gap-2 px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
              onClick={() => setComposer(todayKey)}
              disabled={clients.length === 0}
            >
              <Plus size={15} strokeWidth={2.2} /> Seans Planla
            </button>
          </>
        }
      />

      {/* Alan açıklaması — ızgaradaki renklerin sözlüğü.
          Telefonda satır aralığı daralır ve "güne tıklayarak seans ekle"
          ipucu düşer: dokunmatikte her günün kendi "Seans Ekle" düğmesi
          görünür durumda, ipucu ise tek başına bir satır yiyordu. */}
      <div
        className="flex items-center gap-x-3.5 gap-y-1.5 flex-wrap px-[13px] py-[9px] lg:gap-4 lg:px-4 lg:py-[10px]"
        style={{ borderRadius: 13, background: "var(--color-surface)", border: "1px solid var(--color-line)" }}
      >
        {DOMAIN_ORDER.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-(--color-text-body)">
            <span style={{ width: 9, height: 9, borderRadius: 3, background: DOMAIN_META[k].color }} />
            {DOMAIN_META[k].label}
          </span>
        ))}
        <span className="ml-auto hidden lg:inline-flex items-center gap-[7px] text-[11px] font-medium text-(--color-text-soft)">
          <GripVertical size={13} />
          Güne Tıklayarak Seans Ekle
        </span>
      </div>

      <div className="grid gap-4 flex-1 min-h-0 deniz-split" style={{ ["--split" as string]: "minmax(0,1fr) 272px" }}>
        {/*
          ── Hafta ızgarası ──

          Masaüstünde yedi sütun; telefonda yedi sütun 55px'e düşüyor ve
          danışan adları "Ela Se", "Kerer" diye kesiliyordu — plan okunamaz
          hâle geliyordu. Küçük ekranda aynı veri gün gün alt alta akıyor:
          her gün kendi başlığıyla bir bölüm, bloklar tam genişlikte.
        */}
        <Card className="min-h-0 overflow-hidden" pad="p-[16px_18px]">
          <div className="plan-week h-full">
            {DAY_KEYS.map((day, i) => {
              const isToday = day === todayKey;
              const list = blocks[day];
              /*
               * Boş gün telefonda tek satıra iner: başlık solda, "Seans Ekle"
               * sağda. Önceden boş gün de başlık + tam genişlikte kesikli
               * kutu olarak ~95px yer kaplıyordu; beş boş günde ekranın
               * yarısı boş kutuydu ve dolu günleri aşağı itiyordu.
               * Masaüstünde sütun düzeni aynen korunur (`lg:` geri alma).
               */
              const empty = list.length === 0;
              return (
                <div
                  key={day}
                  className={`plan-day flex min-h-0 ${
                    empty
                      ? "max-lg:flex-row max-lg:items-center max-lg:gap-2.5 lg:flex-col lg:gap-[7px]"
                      : "flex-col gap-[7px]"
                  }`}
                >
                  <div
                    className={`px-[2px] ${
                      isToday ? "border-(--color-primary)" : "border-(--color-line-soft)"
                    } ${empty ? "max-lg:flex-1 max-lg:min-w-0 lg:border-b lg:pb-[7px]" : "border-b pb-[7px]"}`}
                  >
                    <div className="flex items-baseline gap-[5px]">
                      <span className={`text-[11px] lg:text-[10.5px] font-semibold ${isToday ? "text-(--color-primary)" : "text-(--color-text-soft)"}`}>
                        {DAY_LABELS[day]}
                      </span>
                      <span className="figure text-[15px] text-(--color-text-strong)">{dayDates[i].getDate()}</span>
                      {isToday && (
                        <span className="numeral text-[9.5px] lg:text-[8.5px] font-semibold text-(--color-primary) lg:hidden">bugün</span>
                      )}
                      {/* Sayaç telefonda 8px'te okunmuyordu; küçük bir sayı
                          rozeti oldu. Boş günde hiç basılmaz — yanındaki
                          "Seans Ekle" satırı zaten "burada seans yok" diyor. */}
                      {!empty && (
                        <span className="numeral ml-auto shrink-0 rounded-full px-[7px] py-[2px] text-[9.5px] font-semibold text-(--color-text-soft) lg:hidden" style={{ background: "var(--color-surface-strong)" }}>
                          {list.length} seans
                        </span>
                      )}
                    </div>
                    <span className="numeral hidden lg:block mt-[3px] text-[8px] font-medium text-(--color-text-muted)">
                      {list.length} seans
                    </span>
                  </div>

                  <div
                    className={`plan-day-blocks flex flex-col gap-[7px] min-h-0 overflow-y-auto ${
                      empty ? "max-lg:flex-none lg:flex-1" : "flex-1"
                    }`}
                  >
                    {list.map((b) => (
                      <PlanBlock
                        key={`${b.clientId}-${b.index}-${b.entry.gameKey}`}
                        block={b}
                        onRemove={() => onRemoveEntry(b.clientId, b.day, b.index)}
                        onStart={() => onStartSession(b.clientId, b.entry.gameKey)}
                      />
                    ))}

                    {/* Telefonda düğme etiketli: tek başına "+" ikonu ne
                        yaptığını söylemiyordu, üstelik 12px'lik hedefti. */}
                    <button
                      type="button"
                      onClick={() => setComposer(day)}
                      disabled={clients.length === 0}
                      aria-label={`${DAY_LABELS[day]} gününe seans ekle`}
                      className={`flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-(--color-text-muted) hover:text-(--color-primary) disabled:opacity-40 disabled:cursor-not-allowed ${
                        empty ? "max-lg:p-[7px_14px] lg:p-[7px]" : "p-[7px]"
                      }`}
                      style={{
                        borderRadius: 9,
                        border: "1px dashed var(--color-line-strong)",
                        background: "transparent",
                      }}
                    >
                      <Plus size={12} />
                      <span className="text-[11px] font-semibold whitespace-nowrap lg:hidden">Seans Ekle</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Karar rayı ── */}
        <div className="flex flex-col gap-3.5 min-h-0 overflow-y-auto">
          <div
            className="rounded-[16px] shrink-0"
            style={{ padding: "15px 17px", background: "var(--gradient-signature-soft)", border: "1px solid var(--color-line-strong)" }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles size={14} strokeWidth={1.9} style={{ color: "var(--color-primary)" }} />
              <CardTitle className="!text-[13px]">Öneri Motoru</CardTitle>
            </div>
            {idle ? (
              <>
                <p className="m-0 mb-3 text-[11.5px] leading-[1.5] text-(--color-text-body)">
                  <strong className="font-bold text-(--color-text-strong)">{idle.c.displayName}</strong>{" "}
                  {idle.m.lastPlayedAt ? `${relativeDay(idle.m.lastPlayedAt)} seans gördü` : "hiç seans görmedi"}.
                  Bu haftaya bir slot eklemek dengeyi düzeltir.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setComposer(todayKey)}
                    className="btn-signature flex-1 text-[11.5px] font-semibold cursor-pointer"
                    style={{ padding: 8, borderRadius: 9 }}
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate("clients")}
                    className="text-[11.5px] font-semibold text-(--color-text-body) cursor-pointer transition-colors hover:text-(--color-primary)"
                    style={{ padding: "8px 13px", borderRadius: 9, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
                  >
                    Profili Aç
                  </button>
                </div>
              </>
            ) : (
              <p className="m-0 text-[11.5px] leading-[1.5] text-(--color-text-body)">
                Tüm danışanlar son 4 gün içinde seans gördü. Plan dengeli görünüyor.
              </p>
            )}
          </div>

          <Card className="shrink-0" pad="p-[15px_17px]">
            <Eyebrow className="mb-3">Alan Dengesi</Eyebrow>
            {balance.map((b) => (
              <div key={b.key} className="mb-[9px]">
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] lg:text-[11px] font-semibold text-(--color-text-body)">{b.label}</span>
                  <span className="numeral text-[11px] lg:text-[10.5px] text-(--color-text-soft)">%{b.pct}</span>
                </div>
                <MeterBar pct={Math.min(100, b.pct * 2)} height={5} color={b.color} />
              </div>
            ))}
            {underserved && (
              <div
                className="text-[11.5px] lg:text-[10.5px] leading-[1.45]"
                style={{
                  padding: "9px 11px",
                  borderRadius: 10,
                  background: "color-mix(in srgb, var(--color-accent-amber) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-accent-amber) 28%, transparent)",
                  color: "var(--color-accent-amber)",
                }}
              >
                {underserved.label} alanı hedefin altında — 2 seans ekle.
              </div>
            )}
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col" pad="p-[15px_17px]">
            <Eyebrow className="mb-2.5">Hazır Protokoller</Eyebrow>
            <div className="flex-1 overflow-y-auto min-h-0">
              {THERAPY_PROTOCOLS.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onNavigate("therapy-program")}
                  className="w-full flex items-center gap-2.5 text-left bg-transparent cursor-pointer group"
                  style={{ padding: "8px 0", borderBottom: "1px solid var(--color-line-soft)", border: "none", borderBottomWidth: 1, borderBottomStyle: "solid" }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] lg:text-[11.5px] font-bold text-(--color-text-strong) truncate group-hover:text-(--color-primary) transition-colors">
                      {p.name}
                    </span>
                    <span className="block text-[10.5px] lg:text-[10px] text-(--color-text-soft) mt-px truncate">
                      {p.duration} hafta · {p.frequency}
                    </span>
                  </span>
                  <Plus size={13} strokeWidth={2} className="shrink-0 text-(--color-primary)" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {composer && (
        <Composer
          day={composer}
          dayLabel={DAY_LABELS[composer]}
          clients={clients}
          onClose={() => setComposer(null)}
          onSubmit={(clientId, entry) => {
            onAddEntry(clientId, composer, entry);
            setComposer(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Plan bloğu ────────────────────────────────────────────────────────── */

function PlanBlock({
  block,
  onRemove,
  onStart,
}: {
  readonly block: Block;
  readonly onRemove: () => void;
  readonly onStart: () => void;
}) {
  const color = domainColor(block.entry.gameKey);
  const done = block.entry.completed;

  /*
   * Telefonda blok üç satırdan (saat / ad / oyun) iki satıra iner: saat
   * solda sabit genişlikte bir sütun, ad ve oyun sağda. On sekiz seanslık
   * bir haftada bu satır başına ~20px kazandırıyor, üstelik ajanda gibi
   * okunuyor. Masaüstünde sütun 55px'e kadar daralabildiği için orada
   * dikey yığın korunur.
   */
  return (
    <div
      className="relative group max-lg:p-[5px_8px] lg:p-[8px_9px] max-lg:flex max-lg:items-center max-lg:gap-2"
      style={{
        borderRadius: 10,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 26%, transparent)`,
        opacity: done ? 0.6 : 1,
      }}
    >
      <button
        type="button"
        onClick={onStart}
        /* `p-0` bu düğmeyi 44px dokunma hedefi kuralının dışında bırakıyor
           (kural cümle içi metin bağlantıları için böyle); seansı başlatan
           asıl hedef bu olduğu için yüksekliği telefonda elle veriyoruz. */
        className="w-full text-left bg-transparent border-none p-0 cursor-pointer max-lg:flex max-lg:min-h-11 max-lg:min-w-0 max-lg:flex-1 max-lg:items-center max-lg:gap-2.5"
        aria-label={`${block.clientName} · ${gameTitle(block.entry.gameKey)} seansını başlat`}
      >
        {block.entry.time && (
          <span
            className="numeral block text-[10.5px] lg:text-[9px] font-semibold mb-[3px] lg:mb-[3px] max-lg:mb-0 max-lg:shrink-0"
            style={{ color }}
          >
            {block.entry.time}
          </span>
        )}
        <span className="block min-w-0 max-lg:flex-1">
          {/* Masaüstünde sütun 55px: ad kesilmek zorunda. Telefonda kesmek
              yerine iki satıra sarar — "Mehmet Ali Kayalıoğ…" 320px'te
              kimin seansı olduğunu söylemiyordu. */}
          <span className="block text-[12px] lg:text-[11px] font-bold text-(--color-text-strong) lg:truncate max-lg:line-clamp-2 max-lg:leading-[1.25]">{block.clientName}</span>
          <span className="block text-[10.5px] lg:text-[9.5px] text-(--color-text-soft) mt-px truncate">
            {gameTitle(block.entry.gameKey)}
          </span>
        </span>
      </button>
      {/*
        Kaldırma düğmesi masaüstünde üzerine gelince beliriyor; dokunmatikte
        "üzerine gelme" diye bir şey olmadığı için telefonda hiç ulaşılamıyor
        ve 16px'lik hedef zaten dokunulamayacak kadar küçüktü. Küçük ekranda
        akışa girer, hep görünür durur.
      */}
      <button
        type="button"
        onClick={onRemove}
        /* Ad, hangi bloğu kaldıracağını söylemeliydi: haftada 18 blok varken
           ekran okuyucu on sekiz kez "Bloğu kaldır" okuyor, ses komutuyla
           gezinen kullanıcı hiçbirini seçemiyordu. */
        aria-label={`${block.clientName} · ${gameTitle(block.entry.gameKey)} bloğunu plandan kaldır`}
        className={
          "grid place-items-center cursor-pointer border-none transition-opacity text-(--color-text-muted) " +
          "lg:absolute lg:top-1 lg:right-1 lg:w-4 lg:h-4 lg:rounded-[5px] lg:bg-(--color-surface-strong) lg:text-(--color-text-soft) " +
          "lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 " +
          /* Telefonda dolu bir yüzey değil sade bir glif: 44px'lik hedef
             kalır ama blok içindeki ağırlık danışan adında kalır. */
          "max-lg:static max-lg:shrink-0 max-lg:w-11 max-lg:h-11 max-lg:bg-transparent max-lg:[&>svg]:w-[15px] max-lg:[&>svg]:h-[15px]"
        }
      >
        <X size={10} />
      </button>
    </div>
  );
}

/* ── Seans ekleyici ────────────────────────────────────────────────────── */

function Composer({
  day,
  dayLabel,
  clients,
  onClose,
  onSubmit,
}: {
  readonly day: DayKey;
  readonly dayLabel: string;
  readonly clients: readonly ClientProfile[];
  readonly onClose: () => void;
  readonly onSubmit: (clientId: string, entry: WeeklyPlanEntry) => void;
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [gameKey, setGameKey] = useState<PlatformGameKey>(GAME_TABS[0].key as PlatformGameKey);
  const [time, setTime] = useState("09:30");
  const [goal, setGoal] = useState("");

  const field = "w-full text-[13px] text-(--color-text-strong) outline-none";
  const fieldStyle = {
    padding: "10px 12px",
    borderRadius: 11,
    background: "var(--color-surface-strong)",
    border: "1px solid var(--color-line)",
  } as const;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={`${dayLabel} gününe seans ekle`}>
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 cursor-default border-none" style={{ background: "rgba(5,11,22,0.5)", backdropFilter: "blur(4px)" }} />
      {/* Telefonda pencere yüksekliği 568px'e kadar inebiliyor; klavye
          açılınca form alta taşıyordu. Kutu ekranı aşarsa kendi içinde
          kayar (`overflow-auto`; `overflow-y-auto` sınıfı mobilde kabuk
          kuralıyla serbest bırakıldığı için burada işe yaramaz). */}
      <div
        className="relative w-full max-w-md rounded-[18px] p-[17px] lg:p-[22px] max-h-[calc(100dvh-2rem)] overflow-auto"
        style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <Eyebrow>{dayLabel}</Eyebrow>
            <CardTitle className="block mt-1">Seans Planla</CardTitle>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-text-strong)" style={{ width: 30, height: 30 }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Danışan</span>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={field} style={fieldStyle}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Oyun</span>
            <select value={gameKey} onChange={(e) => setGameKey(e.target.value as PlatformGameKey)} className={field} style={fieldStyle}>
              {GAME_TABS.map((g) => {
                const d = gameDomain(g.key as PlatformGameKey);
                return (
                  <option key={g.key} value={g.key}>
                    {g.title} — {d ? DOMAIN_META[d].label : g.kicker}
                  </option>
                );
              })}
            </select>
          </label>

          {/* Saat + hedef telefonda alt alta: 320px'te iki sütun saat
              alanını 116px'e düşürüyor, yerleşik saat seçici kırpılıyordu. */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Saat</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} style={fieldStyle} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Hedef</span>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="ör. Çalışma belleği"
                className={`${field} placeholder:text-(--color-text-muted)`}
                style={fieldStyle}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button type="button" onClick={onClose} className="flex-1 text-[12.5px] font-semibold text-(--color-text-body) cursor-pointer transition-colors hover:text-(--color-primary)" style={{ padding: 11, borderRadius: 11, background: "transparent", border: "1px solid var(--color-line)" }}>
            Vazgeç
          </button>
          <button
            type="button"
            disabled={!clientId}
            onClick={() => onSubmit(clientId, { gameKey, goal: goal.trim(), time: time || undefined })}
            className="btn-signature flex-1 text-[12.5px] font-semibold cursor-pointer"
            style={{ padding: 11, borderRadius: 11 }}
          >
            Plana Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
