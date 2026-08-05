/*
 * Deniz ekranlarının türetilmiş verisi.
 *
 * Dört ekran da aynı ham kaynaktan besleniyor: `recentSessions`, `clients`,
 * `weeklyPlans`. Her ekranın kendi hesabını yapması hâlinde aynı sayı iki
 * yerde farklı çıkıyor (Bugün'de "84 ortalama", Danışanlar'da "82"). Türetme
 * burada tek yerde toplanır.
 *
 * Hiçbir fonksiyon veri uydurmaz: kaynak boşsa boş döner. Ekranlar bu boş
 * hâli kendi boş-durum metniyle karşılar.
 */

import { GAME_TABS, GAME_CATEGORIES } from "./game-constants";
import type {
  ClientProfile,
  RecentSessionEntry,
  WeeklyPlan,
  WeeklyPlanEntry,
  DayKey,
  PlatformGameKey,
} from "./platform-data";

export const DAY_KEYS: readonly DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt", sun: "Paz",
};

/** Pazartesi'yi haftanın ilk günü sayar (TR takvimi). */
export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const shift = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - shift);
  return out;
}

export function dayKeyOf(d: Date): DayKey {
  return DAY_KEYS[(d.getDay() + 6) % 7];
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ── Oyun / alan eşlemesi ──────────────────────────────────────────────── */

const GAME_BY_KEY = new Map(GAME_TABS.map((g) => [g.key, g]));
const CATEGORY_BY_KEY = new Map(GAME_CATEGORIES.map((c) => [c.key, c]));

export type DomainKey = (typeof GAME_CATEGORIES)[number]["key"];

/**
 * Tasarım sistemindeki dört alan etiketi ve rengi.
 *
 * Etiketler kategori adlarıyla aynı gerçeği söylemeli: `memorySkills`
 * altında Sıra Hafızası ve Kart Eşle var — bu "Dikkat" değil "Bellek".
 * `visualSkills` altında Fark Avcısı ve Hedef Tarama var — "Duyusal"
 * değil "Görsel". Önceki etiketler plan lejantında oyun kartlarındaki
 * gruplamayla çelişiyordu; aynı alan iki ekranda iki farklı ada bürününce
 * renk eşlemesi de anlamını yitiriyordu.
 */
export const DOMAIN_META: Record<DomainKey, { label: string; color: string }> = {
  cognitiveSkills: { label: "Bilişsel", color: "var(--color-domain-cognitive)" },
  motorSkills: { label: "Motor", color: "var(--color-domain-motor)" },
  visualSkills: { label: "Görsel", color: "var(--color-domain-visual)" },
  memorySkills: { label: "Bellek", color: "var(--color-domain-memory)" },
};

export const DOMAIN_ORDER: readonly DomainKey[] = ["cognitiveSkills", "motorSkills", "visualSkills", "memorySkills"];

export function gameTitle(key: PlatformGameKey): string {
  return GAME_BY_KEY.get(key as never)?.title ?? key;
}

export function gameKicker(key: PlatformGameKey): string {
  return GAME_BY_KEY.get(key as never)?.kicker ?? "";
}

export function gameDomain(key: PlatformGameKey): DomainKey | null {
  const g = GAME_BY_KEY.get(key as never);
  return (g?.category as DomainKey) ?? null;
}

export function domainColor(key: PlatformGameKey): string {
  const d = gameDomain(key);
  return d ? DOMAIN_META[d].color : "var(--color-text-soft)";
}

export function categoryTitle(key: DomainKey): string {
  return CATEGORY_BY_KEY.get(key)?.title ?? key;
}

/* ── Danışan ölçüleri ──────────────────────────────────────────────────── */

export interface ClientMetrics {
  client: ClientProfile;
  sessions: RecentSessionEntry[];
  sessionCount: number;
  /** Son 8 seansın skor dizisi (eskiden yeniye) — sparkline için */
  series: number[];
  lastScore: number | null;
  averageScore: number | null;
  /** Son 4 seans ile önceki 4 seans arasındaki ortalama farkı */
  delta: number | null;
  lastPlayedAt: Date | null;
  /** `supportLevel` metninden çıkarılan 1–5 bağımsızlık basamağı */
  independence: number;
  independenceLabel: string;
}

/*
 * Bağımsızlık, FIM benzeri 5 basamaklı bir ölçek. Profildeki `supportLevel`
 * serbest metin olduğu için anahtar kelimeyle eşleştiriyoruz; eşleşme yoksa
 * ortadaki "sözel ipucu" basamağı varsayılır — klinikte en sık görülen hâl.
 */
export const INDEPENDENCE_STEPS: readonly string[] = [
  "Tam bağımlı",
  "Fiziksel yardım",
  "Sözel ipucu",
  "Gözetim",
  "Bağımsız",
];

export function independenceOf(supportLevel: string | undefined): number {
  const s = (supportLevel ?? "").toLocaleLowerCase("tr-TR");
  if (s.includes("bağımsız") && !s.includes("yarı")) return 5;
  if (s.includes("gözetim") || s.includes("yarı bağımsız")) return 4;
  if (s.includes("sözel") || s.includes("ipucu")) return 3;
  if (s.includes("fiziksel") || s.includes("orta")) return 2;
  if (s.includes("tam") || s.includes("bağımlı") || s.includes("yoğun")) return 1;
  return 3;
}

export function metricsFor(client: ClientProfile, all: readonly RecentSessionEntry[]): ClientMetrics {
  const sessions = all
    .filter((s) => s.clientId === client.id)
    .slice()
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());

  const scores = sessions.map((s) => s.score);
  const series = scores.slice(-8);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

  const recent = scores.slice(-4);
  const prior = scores.slice(-8, -4);
  const delta = recent.length && prior.length ? (avg(recent) ?? 0) - (avg(prior) ?? 0) : null;

  const independence = independenceOf(client.supportLevel);

  return {
    client,
    sessions,
    sessionCount: sessions.length,
    series,
    lastScore: scores.length ? scores[scores.length - 1] : null,
    averageScore: avg(scores),
    delta,
    lastPlayedAt: sessions.length ? new Date(sessions[sessions.length - 1].playedAt) : null,
    independence,
    independenceLabel: INDEPENDENCE_STEPS[independence - 1] ?? "Sözel ipucu",
  };
}

/* ── Bugünün akışı ─────────────────────────────────────────────────────── */

export type AgendaStatus = "done" | "next" | "planned";

export interface AgendaItem {
  key: string;
  time: string | null;
  clientId: string;
  clientName: string;
  gameKey: PlatformGameKey;
  goal: string;
  status: AgendaStatus;
  /** Tamamlanan seansın skoru — yalnızca `done` için dolu */
  score: number | null;
}

/**
 * Bugünün çizelgesi: haftalık plandaki bugüne ait girişler + bugün oynanmış
 * seanslar birleştirilir. Plan girişi bugün oynanmışsa "tamamlandı" sayılır;
 * plan dışı oynanan seanslar da listeye girer (terapist plan dışı çalışabilir,
 * çizelge gerçeği göstermeli).
 *
 * Saatli girişler önce ve saate göre; saatsizler sonda, giriş sırasında.
 */
export function buildAgenda(
  today: Date,
  plans: readonly WeeklyPlan[],
  sessions: readonly RecentSessionEntry[],
  clients: readonly ClientProfile[],
): AgendaItem[] {
  const dayKey = dayKeyOf(today);
  const weekStart = isoDate(startOfWeek(today));
  const dayStart = new Date(today); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

  const nameOf = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "Danışan";

  const todaysSessions = sessions.filter((s) => {
    const t = new Date(s.playedAt).getTime();
    return t >= dayStart.getTime() && t < dayEnd.getTime();
  });
  const consumed = new Set<string>();

  const items: AgendaItem[] = [];

  for (const plan of plans) {
    if (plan.weekStartDate.slice(0, 10) !== weekStart) continue;
    const entries: WeeklyPlanEntry[] = plan.days?.[dayKey] ?? [];
    entries.forEach((entry, i) => {
      const match = todaysSessions.find((s) => s.clientId === plan.clientId && s.gameKey === entry.gameKey && !consumed.has(s.id));
      if (match) consumed.add(match.id);
      items.push({
        key: `${plan.clientId}-${dayKey}-${i}`,
        time: entry.time ?? null,
        clientId: plan.clientId,
        clientName: nameOf(plan.clientId),
        gameKey: entry.gameKey,
        goal: entry.goal || gameKicker(entry.gameKey),
        status: match || entry.completed ? "done" : "planned",
        score: match ? match.score : null,
      });
    });
  }

  /* Plan dışı oynanan seanslar — çizelge planı değil günü göstermeli. */
  for (const s of todaysSessions) {
    if (consumed.has(s.id) || !s.clientId) continue;
    items.push({
      key: `session-${s.id}`,
      time: new Date(s.playedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      clientId: s.clientId,
      clientName: s.clientName || nameOf(s.clientId),
      gameKey: s.gameKey,
      goal: gameKicker(s.gameKey),
      status: "done",
      score: s.score,
    });
  }

  items.sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  const firstPlanned = items.find((i) => i.status === "planned");
  if (firstPlanned) firstPlanned.status = "next";

  return items;
}

/* ── Alan dengesi ──────────────────────────────────────────────────────── */

export interface DomainShare {
  key: DomainKey;
  label: string;
  color: string;
  count: number;
  pct: number;
}

/** Seansların alanlara dağılımı. Dengesizlik plan önerisini tetikler. */
export function domainBalance(sessions: readonly RecentSessionEntry[]): DomainShare[] {
  const counts = new Map<DomainKey, number>();
  for (const s of sessions) {
    const d = gameDomain(s.gameKey);
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return DOMAIN_ORDER.map((key) => {
    const count = counts.get(key) ?? 0;
    return {
      key,
      label: DOMAIN_META[key].label,
      color: DOMAIN_META[key].color,
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

/* ── Akıllı öneriler ───────────────────────────────────────────────────── */

export type InsightTone = "amber" | "green" | "primary";

export interface Insight {
  id: string;
  tone: InsightTone;
  label: string;
  /** Cümlenin vurgulanacak parçaları `**` ile işaretlenir */
  text: string;
}

/**
 * Öneriler kuraldan doğar, modelden değil — her biri terapistin kendi
 * verisinde doğrulayabileceği bir gözlem:
 *
 *   · Plato    — son 3 seansın skoru ±3 içinde: zorluk artırılabilir.
 *   · Hedef yakın — ortalama hedefin %90'ını geçti.
 *   · Ara verdi  — 7 günden uzun süredir seans yok.
 *   · Alan boşluğu — bir alan hiç çalışılmamış.
 */
export function buildInsights(
  clients: readonly ClientProfile[],
  sessions: readonly RecentSessionEntry[],
  targetScore = 85,
): Insight[] {
  const out: Insight[] = [];
  const now = Date.now();

  for (const c of clients) {
    const m = metricsFor(c, sessions);
    if (m.sessionCount === 0) continue;

    /*
     * Plato yalnızca "son üç skor birbirine yakın" değildir — istikrarlı
     * ilerleyen bir danışan da dar bir bant çizer. Gerçek plato, bandın dar
     * olması *ve* önceki üçlüye göre net kazanç kalmamasıdır. İlk kural tek
     * başına yükselen danışanları da plato diye işaretliyordu.
     */
    const last3 = m.series.slice(-3);
    const prev3 = m.series.slice(-6, -3);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const flat = last3.length === 3 && Math.max(...last3) - Math.min(...last3) <= 3;
    const noGain = prev3.length === 3 ? mean(last3) - mean(prev3) < 2 : true;
    if (flat && noGain) {
      out.push({
        id: `plateau-${c.id}`,
        tone: "amber",
        label: "Plato",
        text: `**${firstName(c.displayName)}** — skor 3 seanstır sabit. Zorluğu bir kademe artırmayı dene.`,
      });
    }

    if (m.averageScore !== null && m.averageScore >= targetScore * 0.9 && m.averageScore < targetScore) {
      out.push({
        id: `near-${c.id}`,
        tone: "green",
        label: "Hedef Yakın",
        text: `**${firstName(c.displayName)}** — ortalama hedefin %${Math.round((m.averageScore / targetScore) * 100)}'ünde. Bu hafta kapanabilir.`,
      });
    }

    if (m.lastPlayedAt && now - m.lastPlayedAt.getTime() > 7 * 86400000) {
      const days = Math.floor((now - m.lastPlayedAt.getTime()) / 86400000);
      out.push({
        id: `idle-${c.id}`,
        tone: "primary",
        label: "Ara Verdi",
        text: `**${firstName(c.displayName)}** — ${days} gündür seans görmedi. Plana bir slot ekle.`,
      });
    }
  }

  const balance = domainBalance(sessions);
  const empty = balance.find((b) => b.count === 0);
  if (empty && sessions.length >= 4) {
    out.push({
      id: `domain-${empty.key}`,
      tone: "amber",
      label: "Alan Boşluğu",
      text: `**${empty.label}** alanında hiç seans yok. Denge için 2 seans ekle.`,
    });
  }

  /*
   * Aynı etiketten en fazla iki tane. Sekiz danışanın altısı aynı anda
   * "hedef yakın" olabiliyor; panel o zaman altı özdeş satıra dönüşüp
   * hiçbir şey söylemiyordu. Çeşitlilik sinyali korur.
   */
  const seen = new Map<string, number>();
  const diverse = out.filter((i) => {
    const n = seen.get(i.label) ?? 0;
    if (n >= 2) return false;
    seen.set(i.label, n + 1);
    return true;
  });

  /* Farklı etiketler öne gelsin: önce her etiketten birer tane, sonra kalanlar. */
  const firstOfLabel: Insight[] = [];
  const rest: Insight[] = [];
  const used = new Set<string>();
  for (const i of diverse) {
    if (used.has(i.label)) rest.push(i);
    else { used.add(i.label); firstOfLabel.push(i); }
  }

  return [...firstOfLabel, ...rest].slice(0, 4);
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

/** `**vurgu**` işaretli metni parçalara ayırır. */
export function splitEmphasis(text: string): Array<{ text: string; strong: boolean }> {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith("**") && part.endsWith("**")
      ? { text: part.slice(2, -2), strong: true }
      : { text: part, strong: false },
  );
}

/* ── Biçimlendirme ─────────────────────────────────────────────────────── */

export function relativeDay(d: Date | null): string {
  if (!d) return "seans yok";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  return `${months} ay önce`;
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}
