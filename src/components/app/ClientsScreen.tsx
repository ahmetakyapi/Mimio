"use client";

/*
 * Danışanlar — liste değil tablo.
 *
 * Tasarım dokümanı (1d/1e) bilinçli olarak kart ızgarası yerine satır düzeni
 * kullanıyor: terapist burada tek bir danışanı okumuyor, sekizini yan yana
 * *karşılaştırıyor*. Kartlar bunu imkânsız kılar — aynı ölçü farklı x
 * konumlarına düşer. Sütunlar hizalı olduğu için "kim geride kaldı" bakışta
 * görünür.
 *
 * Sütunlar: Danışan · Hedef · Bağımsızlık · Son seans · Eğilim/skor · Sıradaki
 */

import { useMemo, useState } from "react";
import { Plus, Download, ArrowUpDown, Play, ChevronRight, GitCompareArrows } from "lucide-react";
import type { ClientProfile, RecentSessionEntry, WeeklyPlan, PlatformGameKey } from "@/lib/platform-data";
import {
  metricsFor,
  relativeDay,
  gameTitle,
  dayKeyOf,
  isoDate,
  startOfWeek,
  DAY_KEYS,
  type ClientMetrics,
} from "@/lib/deniz-derive";
import { Avatar, Card, Eyebrow, ScreenHeader, Sparkline, StepBar, btnGhost } from "./primitives";

const COLS = "2.1fr 1.35fr .9fr 1fr 1.15fr .8fr auto";

type SortKey = "recent" | "name" | "score" | "independence";

const SORTS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "recent", label: "Son Seans" },
  { key: "name", label: "Ad" },
  { key: "score", label: "Skor" },
  { key: "independence", label: "Bağımsızlık" },
];

interface Props {
  readonly now: Date;
  readonly clients: readonly ClientProfile[];
  readonly sessions: readonly RecentSessionEntry[];
  readonly plans: readonly WeeklyPlan[];
  readonly search: string;
  readonly onSearchChange: (v: string) => void;
  readonly onOpenClient: (clientId: string) => void;
  readonly onStartSession: (clientId: string, gameKey?: PlatformGameKey) => void;
  readonly onAddClient: () => void;
  readonly onExport: () => void;
  readonly onCompare: () => void;
}

export function ClientsScreen({
  now,
  clients,
  sessions,
  plans,
  search,
  onSearchChange,
  onOpenClient,
  onStartSession,
  onAddClient,
  onExport,
  onCompare,
}: Props) {
  const [tag, setTag] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const metrics = useMemo(() => clients.map((c) => metricsFor(c, sessions)), [clients, sessions]);

  /*
   * Filtre kümesi profillerdeki gerçek etiketlerden doğar — sabit bir
   * "Pediatrik / Nörolojik / Geriatrik" listesi yazmak, o etiketi hiç
   * kullanmayan bir klinikte boş sekmeler bırakırdı.
   */
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clients) for (const t of c.tags ?? []) map.set(t, (map.get(t) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [clients]);

  const rows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    let out = metrics.filter((m) => {
      if (tag !== "all" && !(m.client.tags ?? []).includes(tag)) return false;
      if (!q) return true;
      return (
        m.client.displayName.toLocaleLowerCase("tr-TR").includes(q) ||
        (m.client.primaryGoal ?? "").toLocaleLowerCase("tr-TR").includes(q)
      );
    });
    out = out.slice().sort((a, b) => {
      switch (sort) {
        case "name":
          return a.client.displayName.localeCompare(b.client.displayName, "tr");
        case "score":
          return (b.averageScore ?? -1) - (a.averageScore ?? -1);
        case "independence":
          return b.independence - a.independence;
        default:
          return (b.lastPlayedAt?.getTime() ?? 0) - (a.lastPlayedAt?.getTime() ?? 0);
      }
    });
    return out;
  }, [metrics, tag, sort, search]);

  const archived = clients.filter((c) => c.archivedAt).length;

  /* Bu haftaki plandan her danışanın sıradaki seansı. */
  const nextByClient = useMemo(() => {
    const weekStart = isoDate(startOfWeek(now));
    const todayIdx = DAY_KEYS.indexOf(dayKeyOf(now));
    const map = new Map<string, { day: string; game: PlatformGameKey; time?: string }>();
    for (const plan of plans) {
      if (plan.weekStartDate.slice(0, 10) !== weekStart) continue;
      for (let i = todayIdx; i < DAY_KEYS.length; i += 1) {
        const entries = plan.days?.[DAY_KEYS[i]] ?? [];
        const open = entries.find((e) => !e.completed);
        if (open) {
          map.set(plan.clientId, {
            day: i === todayIdx ? "Bugün" : ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][i],
            game: open.gameKey,
            time: open.time,
          });
          break;
        }
      }
    }
    return map;
  }, [plans, now]);

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <ScreenHeader
        eyebrow={`${clients.length - archived} aktif${archived ? ` · ${archived} arşivde` : ""}`}
        title="Danışanlar"
        sub="Skor sütunu son 8 seansın eğilimini gösterir."
        actions={
          <>
            {/* Karşılaştırma modalı koddaydı ama hiçbir düğme açmıyordu. */}
            <button type="button" className={btnGhost} onClick={onCompare} disabled={clients.length < 2}>
              <span className="inline-flex items-center gap-2">
                <GitCompareArrows size={14} /> Karşılaştır
              </span>
            </button>
            <button type="button" className={btnGhost} onClick={onExport} disabled={clients.length === 0}>
              <span className="inline-flex items-center gap-2">
                <Download size={14} /> CSV Dışa Aktar
              </span>
            </button>
            <button
              type="button"
              className="btn-signature flex items-center gap-2 px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
              onClick={onAddClient}
            >
              <Plus size={15} strokeWidth={2.2} /> Yeni Danışan
            </button>
          </>
        }
      />

      {/* Filtre çipleri + sıralama */}
      <div className="flex items-center gap-2 flex-wrap">
        <Chip active={tag === "all"} onClick={() => setTag("all")} label={`Tümü · ${clients.length}`} />
        {tagCounts.map(([t, n]) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(t)} label={`${t} · ${n}`} />
        ))}
        <label
          className="ml-auto flex items-center gap-[7px] text-[12px] font-semibold text-(--color-text-body) cursor-pointer"
          style={{ padding: "8px 13px", borderRadius: 10, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
        >
          <ArrowUpDown size={13} />
          Sırala:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent border-none outline-none cursor-pointer text-(--color-text-body) font-semibold"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {clients.length === 0 ? (
        <Card className="flex-1 grid place-items-center">
          <div className="text-center">
            <p className="m-0 mb-1 font-bold text-[15px] text-(--color-text-strong)">Henüz Danışan Eklenmedi</p>
            <p className="m-0 mb-4 text-[12.5px] text-(--color-text-soft)">
              İlk profili oluştur, seanslar ve ölçümler buraya düşsün.
            </p>
            <button
              type="button"
              className="btn-signature px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
              onClick={onAddClient}
            >
              Yeni Danışan
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* Sütun başlıkları — kart değil, çıplak. Tablo hissi için. */}
          <div className="grid gap-3.5 px-[18px] client-cols client-head" style={{ ["--cols" as string]: COLS }}>
            {["Danışan", "Hedef", "Bağımsızlık", "Son Seans", "Eğilim / Skor", "Sıradaki", ""].map((h, i) => (
              <Eyebrow key={i} className="!tracking-[0.1em]">{h}</Eyebrow>
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-[9px] overflow-y-auto min-h-0">
            {rows.length === 0 ? (
              <Card className="grid place-items-center py-10">
                <p className="m-0 text-[12.5px] text-(--color-text-soft)">
                  Bu filtreyle eşleşen danışan yok.
                  {search && (
                    <button
                      type="button"
                      onClick={() => onSearchChange("")}
                      className="ml-1.5 font-semibold text-(--color-primary) bg-transparent border-none p-0 cursor-pointer hover:underline"
                    >
                      Aramayı Temizle
                    </button>
                  )}
                </p>
              </Card>
            ) : (
              rows.map((m) => (
                <ClientRow
                  key={m.client.id}
                  m={m}
                  next={nextByClient.get(m.client.id)}
                  onOpen={() => onOpenClient(m.client.id)}
                  onStart={() => onStartSession(m.client.id, nextByClient.get(m.client.id)?.game)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, label }: { readonly active: boolean; readonly onClick: () => void; readonly label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-[12px] font-semibold cursor-pointer border transition-colors ${active ? "text-white border-transparent" : "text-(--color-text-body) hover:border-(--color-line-strong)"}`}
      style={{
        padding: "8px 15px",
        borderRadius: 10,
        background: active ? "var(--gradient-signature)" : "var(--color-surface-strong)",
        borderColor: active ? "transparent" : "var(--color-line)",
      }}
    >
      {label}
    </button>
  );
}

function ClientRow({
  m,
  next,
  onOpen,
  onStart,
}: {
  readonly m: ClientMetrics;
  readonly next?: { day: string; game: PlatformGameKey; time?: string };
  readonly onOpen: () => void;
  readonly onStart: () => void;
}) {
  const scoreColor =
    m.lastScore === null
      ? "var(--color-text-soft)"
      : m.lastScore >= 85
        ? "var(--color-accent-green)"
        : "var(--color-primary)";

  return (
    <div
      className="glass grid gap-3.5 items-center transition-colors hover:border-(--color-line-strong) client-cols client-row"
      style={{ gridTemplateColumns: COLS, padding: "13px 18px", borderRadius: 14 }}
    >
      {/* Danışan */}
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-3 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer group"
      >
        <Avatar name={m.client.displayName} id={m.client.id} size={38} radius={12} />
        <span className="min-w-0">
          <span className="block font-bold text-[13.5px] text-(--color-text-strong) truncate group-hover:text-(--color-primary) transition-colors">
            {m.client.displayName}
          </span>
          <span className="block text-[11px] text-(--color-text-soft) truncate">
            {[m.client.ageGroup, (m.client.tags ?? [])[0]].filter(Boolean).join(" · ") || "—"}
          </span>
        </span>
      </button>

      {/* Hedef */}
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-(--color-text-body) truncate">{m.client.primaryGoal || "—"}</div>
        <div className="numeral text-[10px] text-(--color-text-soft) mt-0.5">birincil hedef</div>
      </div>

      {/* Bağımsızlık */}
      <div>
        <StepBar value={m.independence} />
        <div className="numeral text-[10px] text-(--color-text-soft) mt-[5px]">bağımsızlık {m.independence}/5</div>
      </div>

      {/* Son seans */}
      <div className="text-[11.5px] text-(--color-text-body)">{relativeDay(m.lastPlayedAt)}</div>

      {/* Eğilim / skor */}
      <div className="flex items-center gap-2.5">
        <Sparkline series={m.series} id={m.client.id} width={104} height={30} />
        <span className="numeral text-[15px] font-semibold" style={{ color: scoreColor }}>
          {m.lastScore ?? "—"}
        </span>
      </div>

      {/* Sıradaki */}
      <div className="text-[11px] font-medium text-(--color-text-body) min-w-0">
        {next ? (
          <>
            <span className="block truncate">{next.day}{next.time ? ` ${next.time}` : ""}</span>
            <span className="block text-[10px] text-(--color-text-soft) truncate">{gameTitle(next.game)}</span>
          </>
        ) : (
          <span className="text-(--color-text-muted)">planlanmadı</span>
        )}
      </div>

      {/* Eylemler */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onStart}
          title="Seansı Başlat"
          aria-label={`${m.client.displayName} ile seansı başlat`}
          className="grid place-items-center cursor-pointer border-none transition-colors"
          style={{ width: 30, height: 30, borderRadius: 9, background: "var(--color-primary-light)", color: "var(--color-primary)" }}
        >
          <Play size={13} fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={onOpen}
          title="Profili Aç"
          aria-label={`${m.client.displayName} profilini aç`}
          className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-primary) transition-colors"
          style={{ width: 30, height: 30, borderRadius: 9 }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
