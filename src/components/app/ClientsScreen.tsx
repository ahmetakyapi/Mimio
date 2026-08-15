"use client";

/*
 * Danışanlar — masaüstünde liste değil tablo, telefonda tablo değil kart.
 *
 * Tasarım dokümanı (1d/1e) bilinçli olarak kart ızgarası yerine satır düzeni
 * kullanıyor: terapist burada tek bir danışanı okumuyor, sekizini yan yana
 * *karşılaştırıyor*. Kartlar bunu imkânsız kılar — aynı ölçü farklı x
 * konumlarına düşer. Sütunlar hizalı olduğu için "kim geride kaldı" bakışta
 * görünür.
 *
 * Sütunlar: Danışan · Hedef · Bağımsızlık · Son seans · Eğilim/skor · Sıradaki
 *
 * Telefonda karşılaştırma zaten mümkün değil — 320px'e yedi sütun sığmaz.
 * Satır burada bilinçli bir kart olur: kimlik üstte, hedef altında, ölçüler
 * iki sütunlu etiketli bir blokta, eylemler en altta sağda. Daha önce düzen
 * `globals.css`teki `flex-wrap` kuralına bırakılmıştı; hücreler kendi
 * genişliklerince aktığı için "bugün" bağımsızlık çubuğunun yanına, skor
 * "planlanmadı"nın soluna düşüyor, her kart farklı bir yerde kırılıyordu.
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

  /* `h-full` masaüstünde şart: liste kalan yüksekliği doldurup kendi içinde
     kayar. Telefonda aynı kural ekranı kabuğun 100%'üne çiviliyor, liste
     kabına sığmayınca taşan kısım alt sekme çubuğunun altına kayıyordu —
     son danışanın "Seansı Başlat" düğmesine erişilemiyordu. Küçük ekranda
     yükseklik içeriğe bırakılır; kaydırma zaten dış kapta. */
  return (
    <div className="flex flex-col gap-5 max-lg:gap-4 h-full max-lg:h-auto min-h-0">
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

      {/*
        Filtre çipleri + sıralama.

        Sıralama kutusu masaüstünde `ml-auto` ile satırın sağ ucuna yaslanıyor.
        Telefonda aynı kural onu çiplerin arasına sokuyordu: çipler sarınca
        kutu son çipin yanına düşüyor, arada dengesiz bir boşluk kalıyordu.
        Küçük ekranda kendi tam genişlikli satırına iner.
      */}
      <div className="flex items-center gap-2 max-lg:gap-[7px] flex-wrap">
        <Chip active={tag === "all"} onClick={() => setTag("all")} label={`Tümü · ${clients.length}`} />
        {tagCounts.map(([t, n]) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(t)} label={`${t} · ${n}`} />
        ))}
        <label
          className="flex items-center gap-[7px] text-[12px] font-semibold text-(--color-text-body) cursor-pointer
            px-[13px] py-2 rounded-[10px] bg-(--color-surface-strong) border border-(--color-line)
            max-lg:w-full max-lg:py-0 lg:ml-auto"
        >
          <ArrowUpDown size={13} className="shrink-0" />
          Sırala:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent border-none outline-none cursor-pointer text-(--color-text-body) font-semibold max-lg:ml-auto"
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
          {/* Sütun başlıkları — kart değil, çıplak. Tablo hissi için.
              Telefonda satır kart olduğu için başlık şeridi anlamsız: her
              ölçü kendi etiketini yanında taşıyor. */}
          <div
            className="hidden lg:grid lg:gap-3.5 lg:px-[18px] lg:grid-cols-[var(--cols)]"
            style={{ ["--cols" as string]: COLS }}
          >
            {["Danışan", "Hedef", "Bağımsızlık", "Son Seans", "Eğilim / Skor", "Sıradaki", ""].map((h, i) => (
              <Eyebrow key={i} className="!tracking-[0.1em]">{h}</Eyebrow>
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-[9px] max-lg:gap-[11px] overflow-y-auto min-h-0">
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
      /* Telefonda yatay pay daralır — dört çip 320px'te üç satıra
         dağılıyordu; dikey ölçü dokunma kuralından zaten 44px. */
      className={`text-[12px] font-semibold cursor-pointer border transition-colors rounded-[10px] px-[15px] py-2 max-lg:px-[12px] ${active ? "text-white border-transparent" : "text-(--color-text-body) hover:border-(--color-line-strong)"}`}
      style={{
        background: active ? "var(--gradient-signature-ink)" : "var(--color-surface-strong)",
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
      /*
       * Tek DOM, iki düzen. Masaüstü: yedi sütunlu tablo satırı.
       * Telefon: iki sütunlu kart — kimlik ve hedef tam genişlikte, dört
       * ölçü ikişerli iki satırda, eylem şeridi en altta. Hücreler alta
       * hizalanır (`items-end`) çünkü her ölçü değerini üstte, fısıltı
       * etiketini altta taşıyor; etiketler böylece aynı çizgide durur.
       */
      className={
        "glass transition-colors hover:border-(--color-line-strong) grid " +
        "max-lg:grid-cols-2 max-lg:items-end max-lg:gap-x-[10px] max-lg:gap-y-[11px] max-lg:p-[14px] max-lg:rounded-2xl " +
        "lg:grid-cols-[var(--cols)] lg:gap-3.5 lg:items-center lg:px-[18px] lg:py-[13px] lg:rounded-[14px]"
      }
      style={{ ["--cols" as string]: COLS }}
    >
      {/* Danışan */}
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-3 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer group max-lg:col-span-2"
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

      {/* Hedef — telefonda tek satıra sığmıyor ("…dikkat sürdürme becer…"),
          kart genişliğinde iki satıra yayılır; alt hattı kimlik bloğunu
          ölçülerden ayırır. */}
      <div className="min-w-0 max-lg:col-span-2 max-lg:border-b max-lg:border-(--color-line) max-lg:pb-[11px]">
        <div className="text-[12px] font-semibold text-(--color-text-body) max-lg:line-clamp-2 lg:truncate">
          {m.client.primaryGoal || "—"}
        </div>
        <div className="numeral text-[10px] text-(--color-text-soft) mt-0.5">birincil hedef</div>
      </div>

      {/* Bağımsızlık */}
      <div className="min-w-0">
        <StepBar value={m.independence} />
        <div className="numeral text-[10px] text-(--color-text-soft) mt-[5px]">bağımsızlık {m.independence}/5</div>
      </div>

      {/* Son seans — masaüstünde etiketini sütun başlığından alıyor; telefonda
          başlık şeridi yok, etiket hücrenin içine iner. Sağ sütun sağa yaslı:
          değerler kartın kenarına oturunca iki sütun tablo gibi okunuyor,
          ortada asılı kalmıyor. */}
      <div className="min-w-0 max-lg:text-right">
        <div className="text-[11.5px] text-(--color-text-body) truncate">{relativeDay(m.lastPlayedAt)}</div>
        <div className="numeral text-[10px] text-(--color-text-soft) mt-[5px] lg:hidden">son seans</div>
      </div>

      {/* Eğilim / skor */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 max-lg:gap-2">
          <Sparkline series={m.series} id={m.client.id} width={104} height={30} />
          <span className="numeral text-[15px] font-semibold" style={{ color: scoreColor }}>
            {m.lastScore ?? "—"}
          </span>
        </div>
        <div className="numeral text-[10px] text-(--color-text-soft) mt-[5px] lg:hidden">eğilim / skor</div>
      </div>

      {/* Sıradaki */}
      <div className="text-[11px] font-medium text-(--color-text-body) min-w-0 max-lg:text-right">
        <div className="min-w-0">
          {next ? (
            <>
              <span className="block truncate">{next.day}{next.time ? ` ${next.time}` : ""}</span>
              <span className="block text-[10px] text-(--color-text-soft) truncate">{gameTitle(next.game)}</span>
            </>
          ) : (
            <span className="block truncate text-(--color-text-muted)">planlanmadı</span>
          )}
        </div>
        <div className="numeral text-[10px] text-(--color-text-soft) mt-[5px] lg:hidden">sıradaki</div>
      </div>

      {/* Eylemler — telefonda kartın en altında kendi şeridinde, sağa yaslı.
          Önceden ölçülerin arasında kalıyor, 30px'lik hedefler parmakla
          ıskalanıyordu; küçük ekranda 44px yüksekliğe çıkar ve birincil
          eylem ikon değil etiketli düğme olur (ekranın asıl işi bu). */}
      <div className="flex items-center gap-1.5 max-lg:col-span-2 max-lg:justify-end max-lg:gap-2 max-lg:border-t max-lg:border-(--color-line) max-lg:pt-[11px]">
        <button
          type="button"
          onClick={onStart}
          title="Seansı Başlat"
          aria-label={`${m.client.displayName} ile seansı başlat`}
          className="grid place-items-center cursor-pointer border-none transition-colors w-[30px] h-[30px] rounded-[9px]
            max-lg:flex max-lg:w-auto max-lg:h-11 max-lg:gap-2 max-lg:px-[17px] max-lg:rounded-xl max-lg:text-[12px] max-lg:font-semibold"
          style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
        >
          <Play size={13} fill="currentColor" />
          <span className="lg:hidden">Seansı Başlat</span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          title="Profili Aç"
          aria-label={`${m.client.displayName} profilini aç`}
          className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-primary) transition-colors w-[30px] h-[30px] rounded-[9px] max-lg:w-11 max-lg:h-11 max-lg:rounded-xl max-lg:border max-lg:border-(--color-line)"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
