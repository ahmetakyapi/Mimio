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

      {/* Alan açıklaması — ızgaradaki renklerin sözlüğü */}
      <div
        className="flex items-center gap-4 flex-wrap"
        style={{ padding: "10px 16px", borderRadius: 13, background: "var(--color-surface)", border: "1px solid var(--color-line)" }}
      >
        {DOMAIN_ORDER.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-(--color-text-body)">
            <span style={{ width: 9, height: 9, borderRadius: 3, background: DOMAIN_META[k].color }} />
            {DOMAIN_META[k].label}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-[7px] text-[11px] font-medium text-(--color-text-soft)">
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
              return (
                <div key={day} className="plan-day flex flex-col gap-[7px] min-h-0">
                  <div style={{ padding: "0 2px 7px", borderBottom: `1px solid ${isToday ? "var(--color-primary)" : "var(--color-line-soft)"}` }}>
                    <div className="flex items-baseline gap-[5px]">
                      <span className={`text-[10.5px] font-semibold ${isToday ? "text-(--color-primary)" : "text-(--color-text-soft)"}`}>
                        {DAY_LABELS[day]}
                      </span>
                      <span className="figure text-[15px] text-(--color-text-strong)">{dayDates[i].getDate()}</span>
                      {isToday && (
                        <span className="numeral text-[8.5px] font-semibold text-(--color-primary) lg:hidden">bugün</span>
                      )}
                      <span className="numeral ml-auto text-[8px] font-medium text-(--color-text-muted) lg:hidden">
                        {list.length} seans
                      </span>
                    </div>
                    <span className="numeral hidden lg:block mt-[3px] text-[8px] font-medium text-(--color-text-muted)">
                      {list.length} seans
                    </span>
                  </div>

                  <div className="plan-day-blocks flex flex-col gap-[7px] flex-1 min-h-0 overflow-y-auto">
                    {list.map((b) => (
                      <PlanBlock
                        key={`${b.clientId}-${b.index}-${b.entry.gameKey}`}
                        block={b}
                        onRemove={() => onRemoveEntry(b.clientId, b.day, b.index)}
                        onStart={() => onStartSession(b.clientId, b.entry.gameKey)}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => setComposer(day)}
                      disabled={clients.length === 0}
                      aria-label={`${DAY_LABELS[day]} gününe seans ekle`}
                      className="grid place-items-center cursor-pointer transition-colors text-(--color-text-muted) hover:text-(--color-primary) disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        padding: 7,
                        borderRadius: 9,
                        border: "1px dashed var(--color-line-strong)",
                        background: "transparent",
                      }}
                    >
                      <Plus size={12} />
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
                  <span className="text-[11px] font-semibold text-(--color-text-body)">{b.label}</span>
                  <span className="numeral text-[10.5px] text-(--color-text-soft)">%{b.pct}</span>
                </div>
                <MeterBar pct={Math.min(100, b.pct * 2)} height={5} color={b.color} />
              </div>
            ))}
            {underserved && (
              <div
                className="text-[10.5px] leading-[1.45]"
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
                    <span className="block text-[11.5px] font-bold text-(--color-text-strong) truncate group-hover:text-(--color-primary) transition-colors">
                      {p.name}
                    </span>
                    <span className="block text-[10px] text-(--color-text-soft) mt-px truncate">
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

  return (
    <div
      className="relative group"
      style={{
        padding: "8px 9px",
        borderRadius: 10,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 26%, transparent)`,
        opacity: done ? 0.6 : 1,
      }}
    >
      <button
        type="button"
        onClick={onStart}
        className="w-full text-left bg-transparent border-none p-0 cursor-pointer"
        aria-label={`${block.clientName} · ${gameTitle(block.entry.gameKey)} seansını başlat`}
      >
        {block.entry.time && (
          <span className="numeral block text-[9px] font-semibold mb-[3px]" style={{ color }}>
            {block.entry.time}
          </span>
        )}
        <span className="block text-[11px] font-bold text-(--color-text-strong) truncate">{block.clientName}</span>
        <span className="block text-[9.5px] text-(--color-text-soft) mt-px truncate">
          {gameTitle(block.entry.gameKey)}
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Bloğu kaldır"
        className="absolute opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity grid place-items-center cursor-pointer border-none"
        style={{ top: 4, right: 4, width: 16, height: 16, borderRadius: 5, background: "var(--color-surface-strong)", color: "var(--color-text-soft)" }}
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
      <div
        className="relative w-full max-w-md rounded-[18px]"
        style={{ padding: 22, background: "var(--color-surface-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}
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

          <div className="grid grid-cols-2 gap-3">
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
