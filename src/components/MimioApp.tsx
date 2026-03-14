"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  EMPTY_PLATFORM_OVERVIEW,
  GAME_LABELS,
  type AppView,
  type ClientProfile,
  type DatabaseStatus,
  type DayKey,
  type PlatformGameKey,
  type PlatformOverviewPayload,
  type RecentSessionEntry,
  type SessionNote,
  type TherapistProfile,
  type WeeklyPlan,
  type WeeklyPlanEntry,
} from "@/lib/platform-data";
import styles from "./MimioApp.module.css";
import {
  THERAPY_DOMAINS,
  GAME_THERAPY_MAPPINGS,
  INDEPENDENCE_LEVELS,
  GAME_PURPOSE_LABELS,
  generateWeeklyPlanSuggestion,
  getGameMappingsForDomain,
  type TherapyDomainKey,
  type TherapyPlanSuggestion,
  type DifficultyLevel,
  type ProgressEntry,
} from "@/lib/therapy-program-data";

type ViewKey = "platform" | "games";
type GameKey = PlatformGameKey;
type GameCategoryKey = "memorySkills" | "motorSkills" | "visualSkills";
type PatternKey = "rings" | "grid" | "wave";
type CommandKey = "up" | "right" | "down" | "left";
type MemoryPhase = "idle" | "showing" | "ready" | "success" | "finished";
type PairsPhase = "idle" | "playing" | "finished";
type PulsePhase = "idle" | "playing" | "finished";
type RoutePhase = "idle" | "playing" | "finished";
type DifferencePhase = "idle" | "playing" | "finished";
type ScanPhase = "idle" | "playing" | "finished";

interface ScoreRecord {
  label: string;
  best: number;
  last: number;
  plays: number;
}

interface Scoreboard {
  memory: ScoreRecord;
  pairs: ScoreRecord;
  pulse: ScoreRecord;
  route: ScoreRecord;
  difference: ScoreRecord;
  scan: ScoreRecord;
}

interface SymbolVariant {
  label: string;
  icon: string;
  accent: string;
  background: string;
  pattern: PatternKey;
}

interface MemoryState {
  sequence: number[];
  input: number[];
  flashIndex: number | null;
  score: number;
  phase: MemoryPhase;
  message: string;
}

interface PairsTile extends SymbolVariant {
  id: string;
  matched: boolean;
  revealed: boolean;
}

interface PairsState {
  tiles: PairsTile[];
  moves: number;
  pairsFound: number;
  locked: boolean;
  phase: PairsPhase;
  message: string;
}

interface PulseState {
  activeIndex: number | null;
  round: number;
  hits: number;
  misses: number;
  combo: number;
  points: number;
  phase: PulsePhase;
  message: string;
}

interface RouteState {
  command: CommandKey | null;
  round: number;
  score: number;
  streak: number;
  phase: RoutePhase;
  history: CommandKey[];
  message: string;
}

interface DifferenceTile extends SymbolVariant {
  id: string;
  odd: boolean;
  rotation: number;
}

interface DifferenceState {
  tiles: DifferenceTile[];
  oddId: string | null;
  round: number;
  score: number;
  phase: DifferencePhase;
  revealId: string | null;
  message: string;
}

interface ScanTile extends SymbolVariant {
  id: string;
  target: boolean;
  rotation: number;
}

interface ScanState {
  tiles: ScanTile[];
  targetLabel: string;
  targetId: string | null;
  round: number;
  score: number;
  phase: ScanPhase;
  revealId: string | null;
  message: string;
}

interface TherapistDraftState {
  username: string;
  password: string;
  displayName: string;
  clinicName: string;
  specialty: string;
}

interface ClientDraftState {
  displayName: string;
  ageGroup: string;
  primaryGoal: string;
  supportLevel: string;
}

const STORAGE_KEY = "mimio-scoreboard-v2";
const SESSION_CONTEXT_KEY = "mimio-session-context-v1";
const ACTIVE_THERAPIST_KEY = "mimio-active-therapist-v2";
const NOTES_KEY = "mimio-notes-v1";
const WEEKLY_PLANS_KEY = "mimio-weekly-plans-v1";

const MEMORY_START_LENGTH = 3;
const PULSE_TOTAL_ROUNDS = 20;
const ROUTE_TOTAL_ROUNDS = 18;
const DIFFERENCE_TOTAL_ROUNDS = 12;
const SCAN_TOTAL_ROUNDS = 15;
const TOTAL_PAIR_MATCHES = 8;
const MEMORY_TILES = ["Bulut", "Damlacık", "Kırık Çizgi", "Halka", "Işık", "Dalga"];
const PULSE_LABELS = ["Sol Üst", "Üst", "Sağ Üst", "Sol", "Merkez", "Sağ", "Sol Alt", "Alt", "Sağ Alt"];

const ROUTE_COMMANDS = [
  { key: "up" as const, label: "Yukarı", icon: "↑" },
  { key: "right" as const, label: "Sağ", icon: "→" },
  { key: "down" as const, label: "Aşağı", icon: "↓" },
  { key: "left" as const, label: "Sol", icon: "←" },
];

const SYMBOL_LIBRARY: SymbolVariant[] = [
  { label: "Bulut", icon: "☁", accent: "#23b8ff", background: "linear-gradient(180deg, rgba(236,250,255,0.96), rgba(219,241,255,0.78))", pattern: "rings" },
  { label: "Damlacık", icon: "◔", accent: "#0da7ff", background: "linear-gradient(180deg, rgba(229,248,255,0.96), rgba(214,236,255,0.8))", pattern: "grid" },
  { label: "Kırık Çizgi", icon: "〰", accent: "#2ca8ff", background: "linear-gradient(180deg, rgba(240,251,255,0.96), rgba(224,238,255,0.78))", pattern: "wave" },
  { label: "Halka", icon: "◎", accent: "#54ccff", background: "linear-gradient(180deg, rgba(238,249,255,0.96), rgba(221,240,255,0.78))", pattern: "rings" },
  { label: "Işık", icon: "✦", accent: "#78dbff", background: "linear-gradient(180deg, rgba(245,252,255,0.96), rgba(228,241,255,0.78))", pattern: "grid" },
  { label: "Dalga", icon: "≈", accent: "#49b8ff", background: "linear-gradient(180deg, rgba(236,249,255,0.96), rgba(219,236,255,0.82))", pattern: "wave" },
  { label: "Çember", icon: "○", accent: "#0cc8e4", background: "linear-gradient(180deg, rgba(228,252,255,0.96), rgba(208,247,255,0.82))", pattern: "rings" },
  { label: "Kare", icon: "□", accent: "#3daaee", background: "linear-gradient(180deg, rgba(225,242,255,0.96), rgba(208,237,255,0.8))", pattern: "grid" },
];

const GAME_TABS = [
  { key: "memory" as const, category: "memorySkills" as const, title: "Sıra Hafızası", kicker: "Çalışma belleği", blurb: "Art arda yanan mavi alanları aynı sırayla tekrar et. Her doğru tur sekansı bir adım daha uzatır.", goals: ["Sekans hafızası", "Odak sürdürme", "Görsel izleme"], teaser: "Kısa süreli hatırlama için katmanlı sekans oyunu.", accent: "#13b8ff", preview: ["Deseni izle", "Aynı sırayı gir", "Seriyi büyüt"] },
  { key: "pairs" as const, category: "memorySkills" as const, title: "Kart Eşle", kicker: "Görsel hatırlama", blurb: "On iki kart içindeki eş çiftleri en az hamleyle bul. Açılan kartların konumunu akılda tutman gerekir.", goals: ["Kısa süreli hatırlama", "Görsel yer bellek", "Planlı seçim"], teaser: "Kapalı kartlar arasında eş çift bulmaya odaklanan hafıza görevi.", accent: "#5dd3ff", preview: ["Kart aç", "Konumu hatırla", "Çiftleri tamamla"] },
  { key: "pulse" as const, category: "motorSkills" as const, title: "Mavi Nabız", kicker: "Hedefe dokunma", blurb: "Işıklanan hedefe hızlı ama kontrollü dokun. Doğruluk ve seri performansı birlikte puan üretir.", goals: ["El-göz koordinasyonu", "Hedefleme", "Tepki kalitesi"], teaser: "Ritim ve doğruluğu bir arada tutan dinamik hedef oyunu.", accent: "#39c6ff", preview: ["Hedef görünür", "Doğru kareye dokun", "Seriyi koru"] },
  { key: "route" as const, category: "motorSkills" as const, title: "Komut Rotası", kicker: "Motor yanıt", blurb: "Ekranda verilen yön komutuna uygun oka bas. Hızlı karar verme ile kontrollü yön seçimi aynı oyunda birleşir.", goals: ["Motor planlama", "Yön komutu takibi", "Hızlı karar"], teaser: "Dört yönlü pad ile çalışan kontrollü komut oyunu.", accent: "#4acfff", preview: ["Komutu gör", "Doğru yönü seç", "Seriyi uzat"] },
  { key: "difference" as const, category: "visualSkills" as const, title: "Fark Avcısı", kicker: "Görsel ayrım", blurb: "Benzer kartlar içinden farklı olanı bul. Dikkatli tarama ve hızlı karşılaştırma gerekir.", goals: ["Görsel ayrım", "Figür-zemin farkı", "Tarama rutini"], teaser: "Benzer kartlar arasında tek farkı bulmaya odaklanan görev.", accent: "#69d4ff", preview: ["Kartları tara", "Farkı ayıkla", "Turu tamamla"] },
  { key: "scan" as const, category: "visualSkills" as const, title: "Hedef Tarama", kicker: "Seçici dikkat", blurb: "Üstte gösterilen hedef simgeyi kalabalık ızgara içinde seç. Her tur yeni hedef gelir ve dikkat filtrelemesi gerekir.", goals: ["Seçici dikkat", "Tarama hızı", "Hedef bulma"], teaser: "Belirli simgeyi ızgara içinde aratan dikkat oyunu.", accent: "#8be2ff", preview: ["Hedefi gör", "Izgarayı tara", "Doğru simgeyi seç"] },
];

const GAME_CATEGORIES = [
  { key: "memorySkills" as const, title: "Hafıza Oyunları", kicker: "Bellek alanı", icon: "◎", description: "Sekans, eşleme ve kısa süreli hatırlama görevleri aynı modül altında toplanır." },
  { key: "motorSkills" as const, title: "Motor Beceri Oyunları", kicker: "Motor alanı", icon: "✦", description: "Hedefleme, yön takibi ve ritim odaklı yanıtlar daha kontrollü bir çalışma akışı sunar." },
  { key: "visualSkills" as const, title: "Görsel Algı Oyunları", kicker: "Algı alanı", icon: "◌", description: "Görsel ayrım, tarama ve seçici dikkat görevleri aynı görsel sistem içinde ilerler." },
];

const EMPTY_SCOREBOARD: Scoreboard = {
  memory: { label: GAME_LABELS.memory, best: 0, last: 0, plays: 0 },
  pairs: { label: GAME_LABELS.pairs, best: 0, last: 0, plays: 0 },
  pulse: { label: GAME_LABELS.pulse, best: 0, last: 0, plays: 0 },
  route: { label: GAME_LABELS.route, best: 0, last: 0, plays: 0 },
  difference: { label: GAME_LABELS.difference, best: 0, last: 0, plays: 0 },
  scan: { label: GAME_LABELS.scan, best: 0, last: 0, plays: 0 },
};

const PHASE_LABELS: Record<string, string> = {
  idle: "Hazır", showing: "Gösterim", ready: "Yanıt", success: "Başarılı tur",
  playing: "Oynanıyor", finished: "Tamamlandı",
};

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<DayKey, string> = {
  mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt", sun: "Paz",
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

function randomIndex(length: number, avoid?: number) {
  let next = Math.floor(Math.random() * length);
  if (typeof avoid === "number" && length > 1) {
    while (next === avoid) next = Math.floor(Math.random() * length);
  }
  return next;
}

function shuffleArray<T>(items: T[]) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function createMemorySequence(length: number, previousLast?: number) {
  const next: number[] = [];
  for (let index = 0; index < length; index += 1) {
    const avoid = index === 0 ? previousLast : next[index - 1];
    next.push(randomIndex(MEMORY_TILES.length, avoid));
  }
  return next;
}

function createPairsDeck() {
  const duplicated = SYMBOL_LIBRARY.flatMap((variant) => [
    { ...variant, id: `${variant.label}-a`, matched: false, revealed: false },
    { ...variant, id: `${variant.label}-b`, matched: false, revealed: false },
  ]);
  return shuffleArray(duplicated);
}

function createRouteCommand(avoid?: CommandKey) {
  const avoidIndex = ROUTE_COMMANDS.findIndex((command) => command.key === avoid);
  return ROUTE_COMMANDS[randomIndex(ROUTE_COMMANDS.length, avoidIndex >= 0 ? avoidIndex : undefined)].key;
}

function createDifferenceRound(round: number) {
  const baseIndex = randomIndex(SYMBOL_LIBRARY.length);
  const oddIndex = randomIndex(SYMBOL_LIBRARY.length, baseIndex);
  const oddTileIndex = randomIndex(6);
  const tiles: DifferenceTile[] = Array.from({ length: 6 }, (_, index) => {
    const variant = index === oddTileIndex ? SYMBOL_LIBRARY[oddIndex] : SYMBOL_LIBRARY[baseIndex];
    return { id: `diff-${round}-${index}`, odd: index === oddTileIndex, rotation: (index % 2 === 0 ? -2 : 2) + (index === oddTileIndex ? 4 : 0), ...variant };
  });
  return { tiles, oddId: tiles[oddTileIndex].id };
}

function createScanRound(round: number) {
  const targetIndex = randomIndex(SYMBOL_LIBRARY.length);
  const distractorOne = randomIndex(SYMBOL_LIBRARY.length, targetIndex);
  let distractorTwo = randomIndex(SYMBOL_LIBRARY.length, distractorOne);
  while (distractorTwo === targetIndex) distractorTwo = randomIndex(SYMBOL_LIBRARY.length, distractorOne);
  const targetVariant = SYMBOL_LIBRARY[targetIndex];
  const distractors = [SYMBOL_LIBRARY[distractorOne], SYMBOL_LIBRARY[distractorTwo]];
  const tiles = shuffleArray(
    Array.from({ length: 9 }, (_, index) => {
      if (index === 0) return { ...targetVariant, target: true, rotation: 4 };
      const variant = distractors[index % distractors.length];
      return { ...variant, target: false, rotation: index % 2 === 0 ? -2 : 2 };
    })
  ).map((tile, index) => ({ id: `scan-${round}-${index}`, ...tile, rotation: tile.rotation + (index % 2 === 0 ? -1 : 1) }));
  const targetTile = tiles.find((tile) => tile.target) ?? null;
  return { tiles, targetLabel: targetVariant.label, targetId: targetTile?.id ?? null };
}

function mergeScoreboard(payload: Partial<Scoreboard> | null | undefined): Scoreboard {
  return {
    memory: { ...EMPTY_SCOREBOARD.memory, ...(payload?.memory ?? {}) },
    pairs: { ...EMPTY_SCOREBOARD.pairs, ...(payload?.pairs ?? {}) },
    pulse: { ...EMPTY_SCOREBOARD.pulse, ...(payload?.pulse ?? {}) },
    route: { ...EMPTY_SCOREBOARD.route, ...(payload?.route ?? {}) },
    difference: { ...EMPTY_SCOREBOARD.difference, ...(payload?.difference ?? {}) },
    scan: { ...EMPTY_SCOREBOARD.scan, ...(payload?.scan ?? {}) },
  };
}

function parseSessionNotes(value: unknown): SessionNote[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `note-${index}`,
      clientId: typeof item.clientId === "string" ? item.clientId : "",
      therapistId: typeof item.therapistId === "string" ? item.therapistId : "",
      date: typeof item.date === "string" ? item.date : "",
      content: typeof item.content === "string" ? item.content : "",
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date(0).toISOString(),
    }))
    .filter((item) => item.clientId && item.content);
}

function parseWeeklyPlans(value: unknown): WeeklyPlan[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => {
      const emptyDays: WeeklyPlan["days"] = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
      const days = (typeof item.days === "object" && item.days !== null) ? item.days as Record<string, unknown> : {};
      const parsedDays = { ...emptyDays };
      for (const key of DAY_KEYS) {
        const d = days[key];
        if (Array.isArray(d)) {
          parsedDays[key] = d.filter((e): e is Record<string, unknown> => !!e && typeof e === "object").map((e) => ({
            gameKey: typeof e.gameKey === "string" && e.gameKey in GAME_LABELS ? (e.gameKey as PlatformGameKey) : "memory",
            goal: typeof e.goal === "string" ? e.goal : "",
          }));
        }
      }
      return {
        id: typeof item.id === "string" ? item.id : `plan-${index}`,
        clientId: typeof item.clientId === "string" ? item.clientId : "",
        therapistId: typeof item.therapistId === "string" ? item.therapistId : "",
        weekStartDate: typeof item.weekStartDate === "string" ? item.weekStartDate : "",
        days: parsedDays,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
      };
    })
    .filter((item) => item.clientId);
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "Kısa tur";
  if (seconds < 60) return `${seconds} sn`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} dk${remainingSeconds > 0 ? ` ${remainingSeconds} sn` : ""}`;
}

function patternStyle(tile: SymbolVariant): CSSProperties {
  if (tile.pattern === "grid") return { backgroundImage: "linear-gradient(90deg, rgba(17,84,137,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(17,84,137,0.08) 1px, transparent 1px)", backgroundSize: "22px 22px" };
  if (tile.pattern === "wave") return { backgroundImage: "radial-gradient(circle at 0 100%, transparent 18px, rgba(17,84,137,0.1) 19px, rgba(17,84,137,0.1) 22px, transparent 23px), radial-gradient(circle at 24px 0, transparent 18px, rgba(17,84,137,0.1) 19px, rgba(17,84,137,0.1) 22px, transparent 23px)", backgroundSize: "48px 48px" };
  return { backgroundImage: "radial-gradient(circle, rgba(17,84,137,0.1) 2px, transparent 3px), radial-gradient(circle, rgba(17,84,137,0.06) 14px, transparent 15px)", backgroundSize: "22px 22px, 64px 64px" };
}

function getPhaseLabel(phase: string) { return PHASE_LABELS[phase] ?? phase; }

function getDatabaseStatusLabel(status: DatabaseStatus | "loading") {
  if (status === "loading") return "Kontrol ediliyor";
  if (status === "online") return "Bağlı";
  if (status === "schema_missing") return "Şema bekliyor";
  if (status === "error") return "Hata";
  return "Hazır değil";
}

function formatPlayedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Az önce";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStart(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function moveGridCursor(current: number, key: string, columns: number, itemCount: number) {
  const row = Math.floor(current / columns);
  const column = current % columns;
  if (key === "ArrowUp") return Math.max(0, current - columns);
  if (key === "ArrowDown") return Math.min(itemCount - 1, current + columns);
  if (key === "ArrowLeft") return row * columns + Math.max(0, column - 1);
  if (key === "ArrowRight") return row * columns + Math.min(columns - 1, column + 1);
  return current;
}

interface MimioAppProps {
  initialAppView?: "login" | "register";
  onLogout?: () => void;
}

export function MimioApp({ initialAppView = "login", onLogout }: MimioAppProps = {}) {
  // ── New multi-screen state ──
  const [activeAppView, setActiveAppView] = useState<AppView>(initialAppView);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [allNotes, setAllNotes] = useState<SessionNote[]>([]);
  const [allWeeklyPlans, setAllWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [clientDetailTab, setClientDetailTab] = useState<"notes" | "plan" | "scores">("notes");
  const [noteForm, setNoteForm] = useState({ date: getTodayString(), content: "" });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [planEdits, setPlanEdits] = useState<Record<DayKey, WeeklyPlanEntry[]>>({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
  const [planWeekStart, setPlanWeekStart] = useState(getWeekStart());
  const [addClientDraft, setAddClientDraft] = useState<ClientDraftState>({ displayName: "", ageGroup: "", primaryGoal: "", supportLevel: "" });

  // ── Therapy Program state ──
  const THERAPY_PROGRESS_KEY = "mimio-therapy-progress-v1";
  const [tpSelectedDomain, setTpSelectedDomain] = useState<TherapyDomainKey | null>(null);
  const [tpSelectedClientId, setTpSelectedClientId] = useState<string | null>(null);
  const [tpActiveTab, setTpActiveTab] = useState<"domains" | "activities" | "games" | "plan" | "progress">("domains");
  const [tpDifficultyFilter, setTpDifficultyFilter] = useState<DifficultyLevel | "all">("all");
  const [tpGeneratedPlan, setTpGeneratedPlan] = useState<TherapyPlanSuggestion | null>(null);
  const [tpProgressEntries, setTpProgressEntries] = useState<ProgressEntry[]>([]);
  const [tpProgressForm, setTpProgressForm] = useState({ goalId: "", value: 50, note: "" });
  const [tpShowProgressForm, setTpShowProgressForm] = useState(false);

  // ── Existing state ──
  const [activeView, setActiveView] = useState<ViewKey>("platform");
  const [activeGame, setActiveGame] = useState<GameKey>("memory");
  const [scoreboard, setScoreboard] = useState<Scoreboard>(EMPTY_SCOREBOARD);
  const [platformOverview, setPlatformOverview] = useState<PlatformOverviewPayload>({ ...EMPTY_PLATFORM_OVERVIEW, database: { ...EMPTY_PLATFORM_OVERVIEW.database, message: "Bulut veri katmanı kontrol ediliyor." } });
  const [platformStatus, setPlatformStatus] = useState<DatabaseStatus | "loading">("loading");
  const [activeTherapistId, setActiveTherapistId] = useState("");
  const [activeClientId, setActiveClientId] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [therapistDraft, setTherapistDraft] = useState<TherapistDraftState>({ username: "", password: "", displayName: "", clinicName: "", specialty: "" });
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [clientDraft, setClientDraft] = useState<ClientDraftState>({ displayName: "", ageGroup: "", primaryGoal: "", supportLevel: "" });
  const [profileFeedback, setProfileFeedback] = useState("Profiller ve seans verileri bulut veritabanından yükleniyor.");
  const [memoryCursor, setMemoryCursor] = useState(0);
  const [pairsCursor, setPairsCursor] = useState(0);
  const [pulseCursor, setPulseCursor] = useState(4);
  const [routeCursor, setRouteCursor] = useState(0);
  const [differenceCursor, setDifferenceCursor] = useState(0);
  const [scanCursor, setScanCursor] = useState(0);
  const [memoryState, setMemoryState] = useState<MemoryState>({ sequence: [], input: [], flashIndex: null, score: 0, phase: "idle", message: "Oyunu başlat ve diziyi dikkatle izle." });
  const [pairsState, setPairsState] = useState<PairsState>({ tiles: [], moves: 0, pairsFound: 0, locked: false, phase: "idle", message: "Kartları aç ve eşleşen çiftleri bul." });
  const [pulseState, setPulseState] = useState<PulseState>({ activeIndex: null, round: 0, hits: 0, misses: 0, combo: 0, points: 0, phase: "idle", message: "Parmak, kalem veya ekran kalemiyle kontrollü hız denemesi yap." });
  const [routeState, setRouteState] = useState<RouteState>({ command: null, round: 0, score: 0, streak: 0, phase: "idle", history: [], message: "Gösterilen yön komutuna doğru oka bas." });
  const [differenceState, setDifferenceState] = useState<DifferenceState>({ tiles: [], oddId: null, round: 0, score: 0, phase: "idle", revealId: null, message: "Benzer kartları tara; farklı olanı seç." });
  const [scanState, setScanState] = useState<ScanState>({ tiles: [], targetLabel: "", targetId: null, round: 0, score: 0, phase: "idle", revealId: null, message: "Üstteki hedef simgeyi ızgara içinde bul." });
  const memoryTimersRef = useRef<number[]>([]);
  const pairTimersRef = useRef<number[]>([]);

  // ── On mount: restore local UI state ──
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setScoreboard(mergeScoreboard(JSON.parse(stored) as Partial<Scoreboard>));

      const storedContext = window.localStorage.getItem(SESSION_CONTEXT_KEY);
      if (storedContext) {
        const parsedContext = JSON.parse(storedContext) as Record<string, unknown>;
        setActiveTherapistId(typeof parsedContext.activeTherapistId === "string" ? parsedContext.activeTherapistId : "");
        setActiveClientId(typeof parsedContext.activeClientId === "string" ? parsedContext.activeClientId : "");
        setSessionNote(typeof parsedContext.sessionNote === "string" ? parsedContext.sessionNote : "");
        setSessionStartedAt(typeof parsedContext.sessionStartedAt === "number" && Number.isFinite(parsedContext.sessionStartedAt) ? parsedContext.sessionStartedAt : Date.now());
      }

      const storedActiveTherapist = window.localStorage.getItem(ACTIVE_THERAPIST_KEY);
      if (storedActiveTherapist) {
        const parsed = JSON.parse(storedActiveTherapist) as Record<string, unknown>;
        if (typeof parsed.therapistId === "string" && parsed.therapistId) {
          setActiveTherapistId(parsed.therapistId);
          setActiveAppView("dashboard");
        }
      }

      const storedNotes = window.localStorage.getItem(NOTES_KEY);
      if (storedNotes) setAllNotes(parseSessionNotes(JSON.parse(storedNotes)));

      const storedPlans = window.localStorage.getItem(WEEKLY_PLANS_KEY);
      if (storedPlans) setAllWeeklyPlans(parseWeeklyPlans(JSON.parse(storedPlans)));

      const storedProgress = window.localStorage.getItem(THERAPY_PROGRESS_KEY);
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        if (Array.isArray(parsed)) setTpProgressEntries(parsed as ProgressEntry[]);
      }
    } catch {
      setScoreboard(EMPTY_SCOREBOARD);
    }
  }, []);

  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scoreboard)); } catch { /* ignore */ } }, [scoreboard]);
  useEffect(() => { try { window.localStorage.setItem(SESSION_CONTEXT_KEY, JSON.stringify({ activeTherapistId, activeClientId, sessionNote, sessionStartedAt })); } catch { /* ignore */ } }, [activeClientId, activeTherapistId, sessionNote, sessionStartedAt]);
  useEffect(() => { try { window.localStorage.setItem(NOTES_KEY, JSON.stringify(allNotes)); } catch { /* ignore */ } }, [allNotes]);
  useEffect(() => { try { window.localStorage.setItem(WEEKLY_PLANS_KEY, JSON.stringify(allWeeklyPlans)); } catch { /* ignore */ } }, [allWeeklyPlans]);
  useEffect(() => { try { window.localStorage.setItem(THERAPY_PROGRESS_KEY, JSON.stringify(tpProgressEntries)); } catch { /* ignore */ } }, [tpProgressEntries]);

  useEffect(() => {
    if (!activeTherapistId && !activeClientId) return;
    setSessionStartedAt(Date.now());
  }, [activeClientId, activeTherapistId]);

  useEffect(() => { void loadPlatformOverview(); }, []);

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({ activeView, activeGame, scoreboard, activeAppView, sessionDesk: { therapistId: activeTherapistId, clientId: activeClientId } });
    window.advanceTime = () => {
      if (memoryState.phase === "showing" && memoryState.sequence.length > 0) {
        clearMemoryTimers();
        setMemoryState((current) => ({ ...current, flashIndex: null, phase: "ready", message: "Hızlı test modu: şimdi aynı sırayı sen gir." }));
      }
      if (pairsState.locked) { clearPairTimers(); hideMismatchedPairs(); }
    };
    return () => { window.render_game_to_text = undefined; window.advanceTime = undefined; };
  }, [activeGame, activeClientId, activeTherapistId, activeView, activeAppView, differenceCursor, differenceState, memoryCursor, memoryState, pairsCursor, pairsState, pulseCursor, pulseState, routeCursor, routeState, scanCursor, scanState, scoreboard, platformOverview.database.configured, platformOverview.totals.sessionCount, platformOverview.totals.totalScore, platformOverview.recentSessions.length, platformStatus, sessionNote]);

  useEffect(() => { return () => { clearMemoryTimers(); clearPairTimers(); }; }, []);

  // ── New handlers ──
  function handleLogin(therapistId: string) {
    try { window.localStorage.setItem(ACTIVE_THERAPIST_KEY, JSON.stringify({ therapistId })); } catch { /* ignore */ }
    setActiveTherapistId(therapistId);
    setActiveAppView("dashboard");
  }

  function handleLogout() {
    try { window.localStorage.removeItem(ACTIVE_THERAPIST_KEY); } catch { /* ignore */ }
    if (onLogout) {
      onLogout();
    } else {
      setActiveAppView("login");
    }
  }

  function handleSelectClient(clientId: string) {
    setSelectedClientId(clientId);
    setClientDetailTab("notes");
    setActiveAppView("client-detail");
  }

  function handleAddNote() {
    if (!noteForm.content.trim() || !selectedClientId) return;
    const note: SessionNote = {
      id: `note-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      clientId: selectedClientId,
      therapistId: activeTherapistId,
      date: noteForm.date || getTodayString(),
      content: noteForm.content.trim(),
      createdAt: new Date().toISOString(),
    };
    setAllNotes((current) => [note, ...current]);
    setNoteForm({ date: getTodayString(), content: "" });
    setShowNoteForm(false);
  }

  function handleDeleteNote(noteId: string) {
    setAllNotes((current) => current.filter((n) => n.id !== noteId));
  }

  function handleSaveWeeklyPlan() {
    if (!selectedClientId) return;
    const existingIndex = allWeeklyPlans.findIndex((p) => p.clientId === selectedClientId && p.weekStartDate === planWeekStart);
    const plan: WeeklyPlan = {
      id: existingIndex >= 0 ? allWeeklyPlans[existingIndex].id : `plan-${Date.now()}`,
      clientId: selectedClientId,
      therapistId: activeTherapistId,
      weekStartDate: planWeekStart,
      days: planEdits,
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      setAllWeeklyPlans((current) => current.map((p, i) => i === existingIndex ? plan : p));
    } else {
      setAllWeeklyPlans((current) => [...current, plan]);
    }
  }

  async function handleAddClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = addClientDraft.displayName.trim();
    if (!displayName) return;
    const created = await createProfileInBackend(
      { kind: "client", displayName, ageGroup: addClientDraft.ageGroup.trim(), primaryGoal: addClientDraft.primaryGoal.trim(), supportLevel: addClientDraft.supportLevel.trim() },
      "Danışan kaydedilemedi."
    );
    if (created) {
      await loadPlatformOverview();
      setProfileFeedback("Danışan başarıyla kaydedildi.");
    }
    setAddClientDraft({ displayName: "", ageGroup: "", primaryGoal: "", supportLevel: "" });
    setShowAddClient(false);
  }

  // ── Therapy Program handlers ──
  function handleSelectDomain(domainKey: TherapyDomainKey) {
    setTpSelectedDomain(domainKey);
    setTpActiveTab("activities");
    setTpDifficultyFilter("all");
    setTpGeneratedPlan(null);
  }

  function handleGeneratePlan() {
    if (!tpSelectedDomain) return;
    const plan = generateWeeklyPlanSuggestion(tpSelectedDomain);
    setTpGeneratedPlan(plan);
    setTpActiveTab("plan");
  }

  function handleAddProgressEntry() {
    if (!tpProgressForm.goalId || !tpSelectedClientId) return;
    const entry: ProgressEntry = {
      id: `prog-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      clientId: tpSelectedClientId,
      date: getTodayString(),
      goalId: tpProgressForm.goalId,
      metric: "hedef_tamamlanma",
      value: tpProgressForm.value,
      note: tpProgressForm.note.trim(),
    };
    setTpProgressEntries((current) => [entry, ...current]);
    setTpProgressForm({ goalId: "", value: 50, note: "" });
    setTpShowProgressForm(false);
  }

  function handleDeleteProgressEntry(entryId: string) {
    setTpProgressEntries((current) => current.filter((e) => e.id !== entryId));
  }

  // ── Load plan when client/week changes ──
  useEffect(() => {
    if (!selectedClientId) return;
    const existing = allWeeklyPlans.find((p) => p.clientId === selectedClientId && p.weekStartDate === planWeekStart);
    if (existing) {
      setPlanEdits(existing.days);
    } else {
      setPlanEdits({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
    }
  }, [selectedClientId, planWeekStart, allWeeklyPlans]);

  // ── Existing helpers ──
  function clearMemoryTimers() { memoryTimersRef.current.forEach((timer) => window.clearTimeout(timer)); memoryTimersRef.current = []; }
  function clearPairTimers() { pairTimersRef.current.forEach((timer) => window.clearTimeout(timer)); pairTimersRef.current = []; }

  async function loadPlatformOverview() {
    try {
      const response = await fetch("/api/platform/overview", { cache: "no-store" });
      if (!response.ok) throw new Error("Platform overview alınamadı.");
      const payload = (await response.json()) as PlatformOverviewPayload;
      setPlatformOverview(payload);
      setPlatformStatus(payload.database.status);
      return payload;
    } catch {
      setPlatformStatus("error");
      setPlatformOverview({ ...EMPTY_PLATFORM_OVERVIEW, database: { configured: false, status: "error", provider: "PostgreSQL / Neon", message: "Sunucu durumu okunamadı. Lütfen sayfayı yenileyin." } });
      return null;
    }
  }

  async function resolvePlatformStatus() {
    if (platformStatus !== "loading") return platformStatus;
    const payload = await loadPlatformOverview();
    return payload?.database.status ?? "error";
  }


  async function createProfileInBackend(body: Record<string, string>, fallbackMessage: string): Promise<TherapistProfile | ClientProfile | null> {
    const nextPlatformStatus = await resolvePlatformStatus();
    if (nextPlatformStatus !== "online") { setProfileFeedback(fallbackMessage); return null; }
    try {
      const response = await fetch("/api/platform/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        const nextStatus = response.status === 409 ? "schema_missing" : response.status === 503 ? "not_configured" : "error";
        setPlatformStatus(nextStatus);
        setPlatformOverview((current) => ({ ...current, database: { configured: nextStatus !== "not_configured", status: nextStatus, provider: "PostgreSQL / Neon", message: payload?.message ?? "Profil kaydı sırasında bir hata oluştu." } }));
        setProfileFeedback(payload?.message ?? fallbackMessage);
        return null;
      }
      const payload = (await response.json()) as { profile: TherapistProfile | ClientProfile };
      await loadPlatformOverview();
      return payload.profile;
    } catch {
      setPlatformStatus("error");
      setProfileFeedback(fallbackMessage);
      return null;
    }
  }

  async function handleTherapistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = therapistDraft.displayName.trim();
    if (!displayName) { setProfileFeedback("Terapist kartı eklemek için ad alanını doldur."); return; }
    const created = await createProfileInBackend({ kind: "therapist", username: therapistDraft.username.trim(), password: therapistDraft.password, displayName, clinicName: therapistDraft.clinicName, specialty: therapistDraft.specialty }, "Terapist kaydedilemedi. Veritabanı bağlantısını kontrol edin.");
    if (created && "clinicName" in created) {
      setProfileFeedback("Terapist başarıyla kaydedildi.");
      setActiveTherapistId(created.id);
    }
    setTherapistDraft({ username: "", password: "", displayName: "", clinicName: "", specialty: "" });
  }

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = clientDraft.displayName.trim();
    if (!displayName) { setProfileFeedback("Danışan kartı eklemek için ad alanını doldur."); return; }
    const created = await createProfileInBackend({ kind: "client", displayName, ageGroup: clientDraft.ageGroup, primaryGoal: clientDraft.primaryGoal, supportLevel: clientDraft.supportLevel }, "Danışan kaydedilemedi. Veritabanı bağlantısını kontrol edin.");
    if (created && "ageGroup" in created) {
      setProfileFeedback("Danışan başarıyla kaydedildi.");
      setActiveClientId(created.id);
    }
    setClientDraft({ displayName: "", ageGroup: "", primaryGoal: "", supportLevel: "" });
  }

  function resetSessionClock() { setSessionStartedAt(Date.now()); setProfileFeedback("Seans süresi sıfırlandı ve yeni oturum akışı başlatıldı."); }

  async function syncScoreToBackend(game: GameKey, nextScore: number, metadata: Record<string, unknown>, sessionEntry: RecentSessionEntry) {
    const nextPlatformStatus = await resolvePlatformStatus();
    if (nextPlatformStatus !== "online") return;
    try {
      const response = await fetch("/api/platform/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ therapistId: sessionEntry.therapistId ?? undefined, therapistName: sessionEntry.therapistName, clientId: sessionEntry.clientId ?? undefined, clientName: sessionEntry.clientName, gameKey: game, score: nextScore, source: "web-app", playedAt: sessionEntry.playedAt, sessionNote: sessionEntry.sessionNote ?? undefined, durationSeconds: sessionEntry.durationSeconds ?? undefined, metadata }) });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        const nextStatus = response.status === 409 ? "schema_missing" : response.status === 503 ? "not_configured" : "error";
        setPlatformStatus(nextStatus);
        setPlatformOverview((current) => ({ ...current, database: { configured: nextStatus !== "not_configured", status: nextStatus, provider: "PostgreSQL / Neon", message: payload?.message ?? "Bulut kaydı sırasında bir hata oluştu." } }));
        return;
      }
      await loadPlatformOverview();
    } catch {
      setPlatformStatus("error");
    }
  }

  function commitScore(game: GameKey, nextScore: number, metadata: Record<string, unknown> = {}) {
    const playedAt = new Date().toISOString();
    const durationSeconds = Math.max(45, Math.round((Date.now() - sessionStartedAt) / 1000));
    const sessionEntry: RecentSessionEntry = {
      id: `session-${playedAt}-${game}-${Math.random().toString(16).slice(2, 8)}`,
      therapistId: activeTherapist?.id ?? null,
      therapistName: activeTherapist?.displayName ?? "Terapist",
      clientId: activeClient?.id ?? null,
      clientName: activeClient?.displayName ?? "Danışan",
      gameKey: game, gameLabel: GAME_LABELS[game], score: nextScore, source: "web-app", playedAt,
      sessionNote: sessionNote.trim() || null, durationSeconds,
    };
    setScoreboard((current) => {
      const entry = current[game];
      return { ...current, [game]: { ...entry, best: Math.max(entry.best, nextScore), last: nextScore, plays: entry.plays + 1 } };
    });
    void syncScoreToBackend(game, nextScore, metadata, sessionEntry);
  }

  function openGameView(game: GameKey) {
    setActiveGame(game);
    setActiveView("games");
    setActiveAppView("games");
  }

  function openCategory(category: GameCategoryKey) {
    const nextGame = GAME_TABS.find((tab) => tab.category === category);
    if (!nextGame) return;
    openGameView(nextGame.key);
  }

  function playMemorySequence(nextSequence: number[], carriedScore = 0) {
    clearMemoryTimers();
    setMemoryState({ sequence: nextSequence, input: [], flashIndex: null, score: carriedScore, phase: "showing", message: "Deseni izle. Işıklar birazdan sende olacak." });
    nextSequence.forEach((item, index) => {
      const showDelay = 320 + index * 720;
      const hideDelay = showDelay + 360;
      memoryTimersRef.current.push(window.setTimeout(() => setMemoryState((current) => ({ ...current, flashIndex: item })), showDelay));
      memoryTimersRef.current.push(window.setTimeout(() => setMemoryState((current) => ({ ...current, flashIndex: null })), hideDelay));
    });
    memoryTimersRef.current.push(window.setTimeout(() => setMemoryState((current) => ({ ...current, flashIndex: null, phase: "ready", message: "Sırayı tekrar et. Yanlış seçimde tur kapanır." })), 360 + nextSequence.length * 720));
  }

  function startMemoryGame() { setMemoryCursor(0); playMemorySequence(createMemorySequence(MEMORY_START_LENGTH), 0); }
  function replayMemorySequence() { if (memoryState.sequence.length === 0) return; playMemorySequence(memoryState.sequence, memoryState.score); }

  function handleMemoryPick(index: number) {
    if (memoryState.phase !== "ready") return;
    const expected = memoryState.sequence[memoryState.input.length];
    const nextInput = [...memoryState.input, index];
    if (index !== expected) {
      commitScore("memory", memoryState.score, { phase: "finished", sequenceLength: memoryState.sequence.length, inputLength: nextInput.length });
      setMemoryState((current) => ({ ...current, input: nextInput, flashIndex: expected, phase: "finished", message: `Tur bitti. Kaydedilen skor ${current.score}. Doğru düğme parlıyordu.` }));
      return;
    }
    if (nextInput.length === memoryState.sequence.length) {
      const nextScore = memoryState.sequence.length;
      const expandedSequence = [...memoryState.sequence, randomIndex(MEMORY_TILES.length, memoryState.sequence.at(-1))];
      setMemoryState((current) => ({ ...current, input: nextInput, flashIndex: index, score: nextScore, phase: "success", message: `Harika. Seri ${nextScore} oldu; bir sonraki katman hazırlanıyor.` }));
      memoryTimersRef.current.push(window.setTimeout(() => playMemorySequence(expandedSequence, nextScore), 760));
      return;
    }
    setMemoryState((current) => ({ ...current, input: nextInput, flashIndex: index, message: `${nextInput.length}/${current.sequence.length} adım doğru. Devam et.` }));
    memoryTimersRef.current.push(window.setTimeout(() => setMemoryState((current) => ({ ...current, flashIndex: null })), 220));
  }

  function startPairsGame() { clearPairTimers(); setPairsCursor(0); setPairsState({ tiles: createPairsDeck(), moves: 0, pairsFound: 0, locked: false, phase: "playing", message: "Kartları aç ve aynı simgeleri eşleştir." }); }

  function hideMismatchedPairs() { setPairsState((current) => ({ ...current, locked: false, tiles: current.tiles.map((tile) => (tile.matched ? tile : { ...tile, revealed: false })), message: "Kartlar kapandı. Şimdi doğru çifti bul." })); }

  function handlePairsPick(index: number) {
    if (pairsState.phase !== "playing" || pairsState.locked) return;
    const clickedTile = pairsState.tiles[index];
    if (!clickedTile || clickedTile.matched || clickedTile.revealed) return;
    const nextTiles = pairsState.tiles.map((tile, tileIndex) => tileIndex === index ? { ...tile, revealed: true } : tile);
    const openTiles = nextTiles.filter((tile) => tile.revealed && !tile.matched);
    if (openTiles.length < 2) { setPairsState((current) => ({ ...current, tiles: nextTiles, message: "Bir kart daha aç ve eşini bul." })); return; }
    const nextMoves = pairsState.moves + 1;
    const isMatch = openTiles[0].label === openTiles[1].label;
    if (isMatch) {
      const matchedTiles = nextTiles.map((tile) => tile.revealed && !tile.matched ? { ...tile, matched: true } : tile);
      const nextPairsFound = pairsState.pairsFound + 1;
      if (nextPairsFound >= TOTAL_PAIR_MATCHES) {
        const finalScore = Math.max(50, 280 - nextMoves * 7);
        commitScore("pairs", finalScore, { phase: "finished", moves: nextMoves, pairsFound: nextPairsFound });
        setPairsState({ tiles: matchedTiles, moves: nextMoves, pairsFound: nextPairsFound, locked: false, phase: "finished", message: `Tüm çiftler bulundu. Final skor ${finalScore}.` });
        return;
      }
      setPairsState({ tiles: matchedTiles, moves: nextMoves, pairsFound: nextPairsFound, locked: false, phase: "playing", message: `Doğru çift bulundu. ${nextPairsFound}/${TOTAL_PAIR_MATCHES} tamamlandı.` });
      return;
    }
    setPairsState({ tiles: nextTiles, moves: nextMoves, pairsFound: pairsState.pairsFound, locked: true, phase: "playing", message: "Eşleşme olmadı. Kartlar birazdan kapanacak." });
    pairTimersRef.current.push(window.setTimeout(() => hideMismatchedPairs(), 700));
  }

  function startPulseGame() { setPulseCursor(4); setPulseState({ activeIndex: randomIndex(PULSE_LABELS.length), round: 1, hits: 0, misses: 0, combo: 0, points: 0, phase: "playing", message: "Işıklanan hedefe ritmi bozmadan dokun." }); }

  function handlePulsePick(index: number) {
    if (pulseState.phase !== "playing" || pulseState.activeIndex === null) return;
    const isHit = index === pulseState.activeIndex;
    const nextRound = pulseState.round + 1;
    const nextHits = pulseState.hits + (isHit ? 1 : 0);
    const nextMisses = pulseState.misses + (isHit ? 0 : 1);
    const nextCombo = isHit ? pulseState.combo + 1 : 0;
    const nextPoints = Math.max(0, pulseState.points + (isHit ? 12 + pulseState.combo * 2 : -4));
    if (nextRound > PULSE_TOTAL_ROUNDS) {
      commitScore("pulse", nextPoints, { phase: "finished", round: PULSE_TOTAL_ROUNDS, hits: nextHits, misses: nextMisses });
      setPulseState({ activeIndex: pulseState.activeIndex, round: PULSE_TOTAL_ROUNDS, hits: nextHits, misses: nextMisses, combo: nextCombo, points: nextPoints, phase: "finished", message: `Set tamamlandı. ${nextHits} doğru hedef ve ${nextPoints} puan toplandı.` });
      return;
    }
    setPulseState({ activeIndex: randomIndex(PULSE_LABELS.length, pulseState.activeIndex), round: nextRound, hits: nextHits, misses: nextMisses, combo: nextCombo, points: nextPoints, phase: "playing", message: isHit ? `Temiz vuruş. Seri ${nextCombo}, puan ${nextPoints}.` : `Hedef değişti. Hata sayısı ${nextMisses}, puan ${nextPoints}.` });
  }

  function startRouteGame() { setRouteCursor(0); setRouteState({ command: createRouteCommand(), round: 1, score: 0, streak: 0, phase: "playing", history: [], message: "Ortadaki komutu oku ve doğru yön düğmesine bas." }); }

  function handleRoutePick(command: CommandKey) {
    if (routeState.phase !== "playing" || !routeState.command) return;
    const isCorrect = command === routeState.command;
    const nextRound = routeState.round + 1;
    const nextStreak = isCorrect ? routeState.streak + 1 : 0;
    const nextScore = Math.max(0, routeState.score + (isCorrect ? 14 + routeState.streak * 3 : -5));
    const nextHistory = [...routeState.history, routeState.command];
    if (nextRound > ROUTE_TOTAL_ROUNDS) {
      commitScore("route", nextScore, { phase: "finished", round: ROUTE_TOTAL_ROUNDS, streak: nextStreak, historyLength: nextHistory.length });
      setRouteState({ command: routeState.command, round: ROUTE_TOTAL_ROUNDS, score: nextScore, streak: nextStreak, phase: "finished", history: nextHistory, message: `Komut seti tamamlandı. Final skor ${nextScore}.` });
      return;
    }
    setRouteState({ command: createRouteCommand(routeState.command), round: nextRound, score: nextScore, streak: nextStreak, phase: "playing", history: nextHistory, message: isCorrect ? `Doğru yön. Seri ${nextStreak}, puan ${nextScore}.` : `Yanlış yön. Seri sıfırlandı, puan ${nextScore}.` });
  }

  function startDifferenceGame() {
    const round = createDifferenceRound(1);
    setDifferenceCursor(0);
    setDifferenceState({ ...round, round: 1, score: 0, phase: "playing", revealId: null, message: "Altı kartı tara; farklı olanı seç." });
  }

  function handleDifferencePick(tileId: string) {
    if (differenceState.phase !== "playing") return;
    const isCorrect = tileId === differenceState.oddId;
    if (!isCorrect) {
      commitScore("difference", differenceState.score, { phase: "finished", round: differenceState.round, revealId: differenceState.oddId });
      setDifferenceState((current) => ({ ...current, phase: "finished", revealId: current.oddId, message: `Tur bitti. Kaydedilen skor ${current.score}. İşaretlenen kart doğru değildi.` }));
      return;
    }
    if (differenceState.round >= DIFFERENCE_TOTAL_ROUNDS) {
      const finalScore = differenceState.score + 1;
      commitScore("difference", finalScore, { phase: "finished", round: DIFFERENCE_TOTAL_ROUNDS, revealId: differenceState.oddId });
      setDifferenceState((current) => ({ ...current, score: finalScore, phase: "finished", revealId: current.oddId, message: `Tüm turları geçtin. Final skor ${finalScore}.` }));
      return;
    }
    const nextRoundNumber = differenceState.round + 1;
    const nextRound = createDifferenceRound(nextRoundNumber);
    setDifferenceState({ ...nextRound, round: nextRoundNumber, score: differenceState.score + 1, phase: "playing", revealId: null, message: `Doğru seçim. ${nextRoundNumber}. tura geçildi.` });
  }

  function startScanGame() {
    const round = createScanRound(1);
    setScanCursor(0);
    setScanState({ ...round, round: 1, score: 0, phase: "playing", revealId: null, message: "Üstteki hedef simgeyi ızgara içinde bul." });
  }

  function handleScanPick(tileId: string) {
    if (scanState.phase !== "playing") return;
    const isCorrect = tileId === scanState.targetId;
    if (!isCorrect) {
      commitScore("scan", scanState.score, { phase: "finished", round: scanState.round, targetLabel: scanState.targetLabel });
      setScanState((current) => ({ ...current, phase: "finished", revealId: current.targetId, message: `Tur bitti. Kaydedilen skor ${current.score}. Doğru hedef işaretlenemedi.` }));
      return;
    }
    if (scanState.round >= SCAN_TOTAL_ROUNDS) {
      const finalScore = scanState.score + 1;
      commitScore("scan", finalScore, { phase: "finished", round: SCAN_TOTAL_ROUNDS, targetLabel: scanState.targetLabel });
      setScanState((current) => ({ ...current, score: finalScore, phase: "finished", revealId: current.targetId, message: `Tüm hedefler bulundu. Final skor ${finalScore}.` }));
      return;
    }
    const nextRoundNumber = scanState.round + 1;
    const nextRound = createScanRound(nextRoundNumber);
    setScanState({ ...nextRound, round: nextRoundNumber, score: scanState.score + 1, phase: "playing", revealId: null, message: `Doğru hedef bulundu. ${nextRoundNumber}. tura geçildi.` });
  }

  useEffect(() => {
    function moveCursor(key: string) {
      if (activeAppView !== "games") return;
      if (activeGame === "pulse") { setPulseCursor((current) => moveGridCursor(current, key, 3, PULSE_LABELS.length)); return; }
      if (activeGame === "route") { setRouteCursor((current) => moveGridCursor(current, key, 2, ROUTE_COMMANDS.length)); return; }
      if (activeGame === "pairs") { setPairsCursor((current) => moveGridCursor(current, key, 4, SYMBOL_LIBRARY.length * 2)); return; }
      if (activeGame === "scan") { setScanCursor((current) => moveGridCursor(current, key, 3, 9)); return; }
      if (activeGame === "difference") { setDifferenceCursor((current) => moveGridCursor(current, key, 3, 6)); return; }
      setMemoryCursor((current) => moveGridCursor(current, key, 3, 6));
    }
    function activateCurrentSelection() {
      if (activeAppView !== "games") return;
      if (activeGame === "memory") { if (memoryState.phase === "idle" || memoryState.phase === "finished") { startMemoryGame(); return; } if (memoryState.phase === "ready") { handleMemoryPick(memoryCursor); return; } if (memoryState.phase === "showing") replayMemorySequence(); return; }
      if (activeGame === "pairs") { if (pairsState.phase !== "playing") { startPairsGame(); return; } handlePairsPick(pairsCursor); return; }
      if (activeGame === "pulse") { if (pulseState.phase !== "playing") { startPulseGame(); return; } handlePulsePick(pulseCursor); return; }
      if (activeGame === "route") { if (routeState.phase !== "playing") { startRouteGame(); return; } const command = ROUTE_COMMANDS[routeCursor]; if (command) handleRoutePick(command.key); return; }
      if (activeGame === "difference") { if (differenceState.phase !== "playing") { startDifferenceGame(); return; } const activeTile = differenceState.tiles[differenceCursor]; if (activeTile) handleDifferencePick(activeTile.id); return; }
      if (scanState.phase !== "playing") { startScanGame(); return; }
      const activeTile = scanState.tiles[scanCursor];
      if (activeTile) handleScanPick(activeTile.id);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (activeAppView !== "games") return;
      const normalizedKey = event.key.toLowerCase();
      const currentIndex = GAME_TABS.findIndex((tab) => tab.key === activeGame);
      if (normalizedKey === "a") { event.preventDefault(); const nextIndex = currentIndex === 0 ? GAME_TABS.length - 1 : currentIndex - 1; setActiveGame(GAME_TABS[nextIndex].key); return; }
      if (normalizedKey === "b") { event.preventDefault(); const nextIndex = currentIndex === GAME_TABS.length - 1 ? 0 : currentIndex + 1; setActiveGame(GAME_TABS[nextIndex].key); return; }
      if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); moveCursor(event.key); return; }
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activateCurrentSelection(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGame, activeAppView, differenceCursor, differenceState, memoryCursor, memoryState, pairsCursor, pairsState, pulseCursor, pulseState, routeCursor, routeState, scanCursor, scanState]);

  // ── Derived values ──
  const activeTab = GAME_TABS.find((tab) => tab.key === activeGame) ?? GAME_TABS[0];
  const activeCategory = GAME_CATEGORIES.find((category) => category.key === activeTab.category) ?? GAME_CATEGORIES[0];
  const therapistOptions = platformOverview.therapists;
  const clientOptions = platformOverview.clients;
  const activeTherapist = therapistOptions.find((profile) => profile.id === activeTherapistId) ?? therapistOptions[0] ?? null;
  const activeClient = clientOptions.find((profile) => profile.id === activeClientId) ?? clientOptions[0] ?? null;
  const visibleTabs = GAME_TABS.filter((tab) => tab.category === activeTab.category);
  const activeScoreCard = scoreboard[activeGame];
  const activeRemoteScore = platformOverview.remoteScores[activeGame];
  const scoreCards = Object.values(scoreboard);
  const recentSessionFeed = platformOverview.recentSessions.slice(0, 6);
  const effectiveSessionCount = platformOverview.totals.sessionCount;
  const effectiveAverageScore = platformOverview.sessionInsight.averageScore;
  const effectiveLastPlayedAt = platformOverview.sessionInsight.lastPlayedAt;
  const selectedClient = clientOptions.find((c) => c.id === selectedClientId) ?? null;
  const clientNotes = allNotes.filter((n) => n.clientId === selectedClientId).sort((a, b) => b.date.localeCompare(a.date));
  const routeCommandMeta = ROUTE_COMMANDS.find((item) => item.key === routeState.command) ?? null;

  const thisWeekCount = platformOverview.recentSessions.filter((s) => {
    const sessionDate = new Date(s.playedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return sessionDate >= weekAgo;
  }).length;

  useEffect(() => {
    if (!activeTherapist && therapistOptions.length > 0) setActiveTherapistId(therapistOptions[0].id);
  }, [activeTherapist, therapistOptions]);

  useEffect(() => {
    if (!activeClient && clientOptions.length > 0) setActiveClientId(clientOptions[0].id);
  }, [activeClient, clientOptions]);

  // ── Register view ──
  if (activeAppView === "register") {
    return (
      <div className={styles.loginShell}>
        <div className={styles.loginBrand}>
          <button type="button" className={styles.loginBrandLogoBtn} onClick={onLogout} style={{ cursor: "pointer", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, padding: 0 }}>
            <div className={styles.loginBrandLogo}>Mi</div>
            <h1 className={styles.loginBrandTitle}>Mimio</h1>
          </button>
          <p className={styles.loginBrandLead}>Ergoterapistler için geliştirilmiş profesyonel platform</p>
          <ul className={styles.loginFeatureList}>
            <li className={styles.loginFeatureItem}>6 benzersiz ergoterapi oyunu</li>
            <li className={styles.loginFeatureItem}>Danışan yönetimi ve seans takibi</li>
            <li className={styles.loginFeatureItem}>Haftalık plan ve not sistemi</li>
            <li className={styles.loginFeatureItem}>Terapi programı ve aktivite önerileri</li>
          </ul>
        </div>
        <div className={styles.loginCard}>
          <h2 className={styles.loginTitle}>Hesap Oluştur</h2>
          <p className={styles.loginLead}>Dakikalar içinde profilinizi oluşturun ve danışanlarınızla çalışmaya başlayın.</p>
          {loginError && <p style={{ color: "#dc2626", fontSize: "0.9rem", margin: "0 0 8px", fontWeight: 500 }}>{loginError}</p>}
          <form className={styles.loginForm} onSubmit={async (e) => {
            e.preventDefault();
            setLoginError("");
            const username = therapistDraft.username.trim().toLocaleLowerCase("tr-TR");
            const password = therapistDraft.password;
            const displayName = therapistDraft.displayName.trim();
            if (!username) { setLoginError("Kullanıcı adı zorunludur."); return; }
            if (!password || password.length < 4) { setLoginError("Şifre en az 4 karakter olmalıdır."); return; }
            if (!displayName) { setLoginError("Ad soyad zorunludur."); return; }
            try {
              const response = await fetch("/api/platform/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "therapist", username, password, displayName, clinicName: therapistDraft.clinicName.trim(), specialty: therapistDraft.specialty.trim() }),
              });
              const data = await response.json().catch(() => null) as { ok?: boolean; profile?: TherapistProfile; message?: string } | null;
              if (!response.ok || !data?.ok) {
                setLoginError(data?.message ?? "Kayıt sırasında bir hata oluştu.");
                return;
              }
              await loadPlatformOverview();
              setTherapistDraft({ username: "", password: "", displayName: "", clinicName: "", specialty: "" });
              setLoginError("");
              handleLogin(data.profile!.id);
            } catch {
              setLoginError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
            }
          }}>
            <input value={therapistDraft.username} onChange={(e) => { setLoginError(""); setTherapistDraft((c) => ({ ...c, username: e.target.value.replace(/\s/g, "").toLocaleLowerCase("tr-TR") })); }} placeholder="Kullanıcı adı (benzersiz, boşluksuz)" className={styles.loginInput} required autoComplete="username" />
            <input type="password" value={therapistDraft.password} onChange={(e) => { setLoginError(""); setTherapistDraft((c) => ({ ...c, password: e.target.value })); }} placeholder="Şifre (en az 4 karakter)" className={styles.loginInput} required autoComplete="new-password" />
            <input value={therapistDraft.displayName} onChange={(e) => setTherapistDraft((c) => ({ ...c, displayName: e.target.value }))} placeholder="Ad soyad — örn. Uzm. Erg. Elif Kara" className={styles.loginInput} required />
            <input value={therapistDraft.clinicName} onChange={(e) => setTherapistDraft((c) => ({ ...c, clinicName: e.target.value }))} placeholder="Kurum / klinik adı (isteğe bağlı)" className={styles.loginInput} />
            <input value={therapistDraft.specialty} onChange={(e) => setTherapistDraft((c) => ({ ...c, specialty: e.target.value }))} placeholder="Uzmanlık alanı (isteğe bağlı)" className={styles.loginInput} />
            <button type="submit" className={styles.loginSubmitBtn}>Hesabı Oluştur ve Gir →</button>
          </form>
          <p className={styles.loginSwitchText}>
            Zaten hesabınız var mı?{" "}
            <button type="button" className={styles.loginSwitchLink} onClick={() => { setActiveAppView("login"); setLoginError(""); }}>Giriş yapın</button>
          </p>
          {onLogout && (
            <button type="button" className={styles.loginBackLink} onClick={onLogout}>← Ana Sayfaya Dön</button>
          )}
        </div>
      </div>
    );
  }

  if (activeAppView === "login") {
    return (
      <div className={styles.loginShell}>
        <div className={styles.loginBrand}>
          <button type="button" className={styles.loginBrandLogoBtn} onClick={onLogout} style={{ cursor: "pointer", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, padding: 0 }}>
            <div className={styles.loginBrandLogo}>Mi</div>
            <h1 className={styles.loginBrandTitle}>Mimio</h1>
          </button>
          <p className={styles.loginBrandLead}>Ergoterapistler için oyun platformu</p>
          <ul className={styles.loginFeatureList}>
            <li className={styles.loginFeatureItem}>6 ergoterapi oyun modülü</li>
            <li className={styles.loginFeatureItem}>Danışan profili ve seans takibi</li>
            <li className={styles.loginFeatureItem}>Haftalık plan ve not yönetimi</li>
            <li className={styles.loginFeatureItem}>Terapi programı ve aktivite önerileri</li>
          </ul>
        </div>
        <div className={styles.loginCard}>
          <h2 className={styles.loginTitle}>Giriş Yap</h2>
          <p className={styles.loginLead}>Kullanıcı adınız ve şifrenizle giriş yapın.</p>

          {loginError && <p style={{ color: "#dc2626", fontSize: "0.9rem", margin: "0 0 8px", fontWeight: 500 }}>{loginError}</p>}

          <form className={styles.loginForm} onSubmit={async (e) => {
            e.preventDefault();
            setLoginError("");
            const username = loginUsername.trim().toLocaleLowerCase("tr-TR");
            const password = loginPassword;
            if (!username) { setLoginError("Kullanıcı adı zorunludur."); return; }
            if (!password) { setLoginError("Şifre zorunludur."); return; }
            try {
              const response = await fetch("/api/platform/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "login", username, password }),
              });
              const data = await response.json().catch(() => null) as { ok?: boolean; profile?: TherapistProfile; message?: string } | null;
              if (!response.ok || !data?.ok) {
                setLoginError(data?.message ?? "Giriş sırasında bir hata oluştu.");
                return;
              }
              await loadPlatformOverview();
              setLoginUsername("");
              setLoginPassword("");
              setLoginError("");
              handleLogin(data.profile!.id);
            } catch {
              setLoginError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
            }
          }}>
            <input value={loginUsername} onChange={(e) => { setLoginError(""); setLoginUsername(e.target.value.replace(/\s/g, "").toLocaleLowerCase("tr-TR")); }} placeholder="Kullanıcı adı" className={styles.loginInput} required autoComplete="username" />
            <input type="password" value={loginPassword} onChange={(e) => { setLoginError(""); setLoginPassword(e.target.value); }} placeholder="Şifre" className={styles.loginInput} required autoComplete="current-password" />
            <button type="submit" className={styles.loginSubmitBtn}>Giriş Yap</button>
          </form>
          <p className={styles.loginSwitchText}>
            Hesabınız yok mu?{" "}
            <button type="button" className={styles.loginSwitchLink} onClick={() => { setActiveAppView("register"); setLoginError(""); }}>Kayıt olun</button>
          </p>
          {onLogout && (
            <button type="button" className={styles.loginBackLink} onClick={onLogout}>← Ana Sayfaya Dön</button>
          )}
        </div>
      </div>
    );
  }

  // ── App shell (sidebar + content) ──
  return (
    <main className={styles.appShell}>
      <nav className={styles.sidebar}>
        <button type="button" className={styles.sidebarLogo} onClick={handleLogout} style={{ cursor: "pointer", background: "none", border: "none", textAlign: "left" }}>
          <span className={styles.brandBadge}>Mi</span>
          <div>
            <p className={styles.brandName}>Mimio</p>
            <p className={styles.brandCaption}>Ergoterapi platformu</p>
          </div>
        </button>

        <div className={styles.sidebarNav}>
          <button type="button" className={`${styles.navItem} ${activeAppView === "dashboard" ? styles.navItemActive : ""}`} onClick={() => setActiveAppView("dashboard")}>
            <span className={styles.navIcon}>◎</span>
            <span>Panel</span>
          </button>
          <button type="button" className={`${styles.navItem} ${(activeAppView === "clients" || activeAppView === "client-detail") ? styles.navItemActive : ""}`} onClick={() => setActiveAppView("clients")}>
            <span className={styles.navIcon}>◈</span>
            <span>Danışanlar</span>
          </button>
          <button type="button" className={`${styles.navItem} ${activeAppView === "games" ? styles.navItemActive : ""}`} onClick={() => setActiveAppView("games")}>
            <span className={styles.navIcon}>✦</span>
            <span>Oyun Alanı</span>
          </button>
          <button type="button" className={`${styles.navItem} ${activeAppView === "therapy-program" ? styles.navItemActive : ""}`} onClick={() => setActiveAppView("therapy-program")}>
            <span className={styles.navIcon}>⚕</span>
            <span>Terapi Programı</span>
          </button>
        </div>

        <div className={styles.sidebarUser}>
          <div className={styles.sidebarUserInfo}>
            <strong>{activeTherapist?.displayName ?? "Terapist"}</strong>
            <span>{activeTherapist?.clinicName || "Bağımsız terapist"}</span>
          </div>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>Çıkış</button>
        </div>
      </nav>

      <div className={styles.mainContent}>

        {/* ── Dashboard ── */}
        {activeAppView === "dashboard" && (
          <div className={styles.dashboardPage}>
            <div className={styles.dashboardHeader}>
              <h1 className={styles.dashboardGreeting}>Merhaba, {activeTherapist?.displayName?.split(" ")[0] ?? "Terapist"} 👋</h1>
              <p className={styles.dashboardDate}>{formatDate(getTodayString())}</p>
            </div>

            <div className={styles.statsStrip}>
              <div className={styles.dashStatCard}>
                <strong>{effectiveSessionCount}</strong>
                <span>Toplam Seans</span>
              </div>
              <div className={styles.dashStatCard}>
                <strong>{clientOptions.length}</strong>
                <span>Danışan Sayısı</span>
              </div>
              <div className={styles.dashStatCard}>
                <strong>{thisWeekCount}</strong>
                <span>Bu Hafta</span>
              </div>
            </div>

            <div className={styles.quickActions}>
              <button type="button" className={styles.quickActionCard} onClick={() => { setShowAddClient(true); setActiveAppView("clients"); }}>
                <span className={styles.quickActionIcon}>+</span>
                <strong>Yeni Danışan Ekle</strong>
                <span>Profil oluştur ve seans başlat</span>
              </button>
              <button type="button" className={styles.quickActionCard} onClick={() => setActiveAppView("games")}>
                <span className={styles.quickActionIcon}>✦</span>
                <strong>Oyun Alanını Aç</strong>
                <span>6 modülle seans çalışma alanı</span>
              </button>
              <button type="button" className={styles.quickActionCard} onClick={() => setActiveAppView("therapy-program")}>
                <span className={styles.quickActionIcon}>⚕</span>
                <strong>Terapi Programı</strong>
                <span>Aktivite önerileri ve haftalık plan</span>
              </button>
            </div>

            <div className={styles.categoriesRow}>
              {GAME_CATEGORIES.map((cat) => {
                const count = GAME_TABS.filter((g) => g.category === cat.key).length;
                return (
                  <button key={cat.key} type="button" className={styles.categoryPickCard} onClick={() => { openCategory(cat.key); }}>
                    <span className={styles.categoryPickIcon}>{cat.icon}</span>
                    <strong>{cat.title}</strong>
                    <span>{count} oyun</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.recentActivitySection}>
              <h2>Son Seanslar</h2>
              {recentSessionFeed.length === 0 ? (
                <div className={styles.activityEmpty}>
                  <span>🎮</span>
                  <p>Henüz seans kaydı yok. Oyun alanına geçerek ilk seansını başlatabilirsin.</p>
                  <button type="button" className={styles.primaryButton} onClick={() => setActiveAppView("games")}>Oyun Alanını Aç</button>
                </div>
              ) : (
                <div className={styles.activityFeed}>
                  {recentSessionFeed.map((session) => (
                    <div key={session.id} className={styles.activityCard}>
                      <div className={styles.activityCardLeft}>
                        <strong>{session.gameLabel}</strong>
                        <span>{session.clientName}</span>
                      </div>
                      <div className={styles.activityCardRight}>
                        <strong>{session.score}</strong>
                        <span>{formatPlayedAt(session.playedAt)}</span>
                        {session.durationSeconds && <span>{formatDuration(session.durationSeconds)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Clients List ── */}
        {activeAppView === "clients" && (
          <div className={styles.clientsPage}>
            <div className={styles.clientsHeader}>
              <div>
                <h1>Danışanlar</h1>
                <span className={styles.clientsCount}>{clientOptions.length} danışan</span>
              </div>
              <button type="button" className={styles.primaryButton} onClick={() => setShowAddClient(!showAddClient)}>+ Yeni Danışan</button>
            </div>

            {showAddClient && (
              <div className={styles.addClientPanel}>
                <h3>Yeni Danışan Ekle</h3>
                <form className={styles.addClientForm} onSubmit={handleAddClient}>
                  <input value={addClientDraft.displayName} onChange={(e) => setAddClientDraft((c) => ({ ...c, displayName: e.target.value }))} placeholder="Danışan adı (örn. Ada Y.)" className={styles.inputSurface} required />
                  <input value={addClientDraft.ageGroup} onChange={(e) => setAddClientDraft((c) => ({ ...c, ageGroup: e.target.value }))} placeholder="Yaş grubu (örn. 7-9 yaş)" className={styles.inputSurface} />
                  <input value={addClientDraft.primaryGoal} onChange={(e) => setAddClientDraft((c) => ({ ...c, primaryGoal: e.target.value }))} placeholder="Birincil hedef (örn. Görsel tarama)" className={styles.inputSurface} />
                  <input value={addClientDraft.supportLevel} onChange={(e) => setAddClientDraft((c) => ({ ...c, supportLevel: e.target.value }))} placeholder="Destek düzeyi (örn. Orta destek)" className={styles.inputSurface} />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" className={styles.primaryButton}>Kaydet</button>
                    <button type="button" className={styles.secondaryButton} onClick={() => setShowAddClient(false)}>İptal</button>
                  </div>
                </form>
              </div>
            )}

            {clientOptions.length === 0 ? (
              <div className={styles.clientsEmpty}>
                <span>◈</span>
                <p>Henüz danışan eklenmedi. Yukarıdaki butonu kullanarak ilk danışanı ekleyebilirsin.</p>
              </div>
            ) : (
              <div className={styles.clientsGrid}>
                {clientOptions.map((client) => {
                  const sessionCount = platformOverview.recentSessions.filter((s) => s.clientId === client.id).length;
                  return (
                    <div key={client.id} className={styles.clientCard}>
                      <div className={styles.clientCardName}>{client.displayName}</div>
                      <div className={styles.clientCardChips}>
                        {client.ageGroup && <span className={styles.chip}>{client.ageGroup}</span>}
                        {client.supportLevel && <span className={styles.chip}>{client.supportLevel}</span>}
                      </div>
                      {client.primaryGoal && <p style={{ margin: "8px 0", color: "#567896", fontSize: "0.9rem" }}>{client.primaryGoal}</p>}
                      <p style={{ margin: "4px 0 12px", color: "#7a99b4", fontSize: "0.84rem" }}>{sessionCount} seans kaydı</p>
                      <div className={styles.clientCardActions}>
                        <button type="button" className={styles.secondaryButton} onClick={() => handleSelectClient(client.id)}>Detay</button>
                        <button type="button" className={styles.primaryButton} onClick={() => { setSelectedClientId(client.id); setActiveClientId(client.id); setActiveAppView("games"); }}>Oyna</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Client Detail ── */}
        {activeAppView === "client-detail" && selectedClient && (
          <div className={styles.clientDetailPage}>
            <button type="button" className={styles.clientDetailBack} onClick={() => setActiveAppView("clients")}>← Danışanlar</button>

            <div className={styles.clientDetailHeader}>
              <h1 className={styles.clientDetailName}>{selectedClient.displayName}</h1>
              <div className={styles.clientDetailChips}>
                {selectedClient.ageGroup && <span className={styles.chip}>{selectedClient.ageGroup}</span>}
                {selectedClient.primaryGoal && <span className={styles.chip}>{selectedClient.primaryGoal}</span>}
                {selectedClient.supportLevel && <span className={styles.chip}>{selectedClient.supportLevel}</span>}
              </div>
              <div className={styles.clientDetailActions}>
                <button type="button" className={styles.primaryButton} onClick={() => { setActiveClientId(selectedClient.id); setActiveAppView("games"); }}>Bu Danışanla Oyna</button>
              </div>
            </div>

            <div className={styles.clientTabStrip}>
              <button type="button" className={`${styles.clientTab} ${clientDetailTab === "notes" ? styles.clientTabActive : ""}`} onClick={() => setClientDetailTab("notes")}>Notlar</button>
              <button type="button" className={`${styles.clientTab} ${clientDetailTab === "plan" ? styles.clientTabActive : ""}`} onClick={() => setClientDetailTab("plan")}>Haftalık Plan</button>
              <button type="button" className={`${styles.clientTab} ${clientDetailTab === "scores" ? styles.clientTabActive : ""}`} onClick={() => setClientDetailTab("scores")}>Skor Geçmişi</button>
            </div>

            <div className={styles.clientTabContent}>
              {clientDetailTab === "notes" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                    <button type="button" className={styles.primaryButton} onClick={() => setShowNoteForm(!showNoteForm)}>+ Not Ekle</button>
                  </div>

                  {showNoteForm && (
                    <div className={styles.addNotePanel}>
                      <h4>Yeni Not</h4>
                      <div className={styles.noteForm}>
                        <input type="date" value={noteForm.date} onChange={(e) => setNoteForm((c) => ({ ...c, date: e.target.value }))} className={styles.inputSurface} />
                        <textarea value={noteForm.content} onChange={(e) => setNoteForm((c) => ({ ...c, content: e.target.value }))} placeholder="Seans notu, gözlem veya hedef..." className={`${styles.inputSurface} ${styles.textareaSurface}`} rows={4} />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button type="button" className={styles.primaryButton} onClick={handleAddNote}>Kaydet</button>
                          <button type="button" className={styles.secondaryButton} onClick={() => setShowNoteForm(false)}>İptal</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {clientNotes.length === 0 ? (
                    <div className={styles.scoreHistoryEmpty}><p>Henüz not eklenmedi.</p></div>
                  ) : (
                    <div className={styles.notesList}>
                      {clientNotes.map((note) => (
                        <div key={note.id} className={styles.noteCard}>
                          <div className={styles.noteCardDate}>{formatDate(note.date)}</div>
                          <p className={styles.noteCardContent}>{note.content}</p>
                          <button type="button" style={{ background: "none", border: "none", color: "#b33a4e", fontSize: "0.8rem", cursor: "pointer", padding: "4px 0" }} onClick={() => handleDeleteNote(note.id)}>Sil</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {clientDetailTab === "plan" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <button type="button" className={styles.secondaryButton} onClick={() => setPlanWeekStart(addDays(planWeekStart, -7))}>←</button>
                    <strong style={{ color: "#0d2c44" }}>
                      {formatDate(planWeekStart)} – {formatDate(addDays(planWeekStart, 6))}
                    </strong>
                    <button type="button" className={styles.secondaryButton} onClick={() => setPlanWeekStart(addDays(planWeekStart, 7))}>→</button>
                  </div>

                  <div className={styles.weeklyPlanGrid}>
                    {DAY_KEYS.map((day, dayIndex) => {
                      const dayDate = addDays(planWeekStart, dayIndex);
                      const entries = planEdits[day];
                      return (
                        <div key={day} className={styles.weeklyDay}>
                          <div className={styles.weeklyDayHeader}>
                            <strong>{DAY_LABELS[day]}</strong>
                            <span style={{ fontSize: "0.76rem", color: "#7a99b4" }}>{dayDate.slice(8)}</span>
                          </div>
                          {entries.map((entry, entryIndex) => (
                            <div key={entryIndex} className={styles.weeklyEntry}>
                              <select
                                value={entry.gameKey}
                                className={`${styles.inputSurface} ${styles.weeklyEntryGame}`}
                                onChange={(e) => {
                                  const newKey = e.target.value as PlatformGameKey;
                                  setPlanEdits((current) => {
                                    const updated = [...current[day]];
                                    updated[entryIndex] = { ...updated[entryIndex], gameKey: newKey };
                                    return { ...current, [day]: updated };
                                  });
                                }}
                              >
                                {GAME_TABS.map((g) => <option key={g.key} value={g.key}>{g.title}</option>)}
                              </select>
                              <input
                                value={entry.goal}
                                placeholder="Hedef..."
                                className={`${styles.inputSurface} ${styles.weeklyEntryGoal}`}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPlanEdits((current) => {
                                    const updated = [...current[day]];
                                    updated[entryIndex] = { ...updated[entryIndex], goal: val };
                                    return { ...current, [day]: updated };
                                  });
                                }}
                              />
                              <button type="button" style={{ background: "none", border: "none", color: "#b33a4e", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => {
                                setPlanEdits((current) => {
                                  const updated = current[day].filter((_, i) => i !== entryIndex);
                                  return { ...current, [day]: updated };
                                });
                              }}>×</button>
                            </div>
                          ))}
                          <button type="button" style={{ fontSize: "0.8rem", color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }} onClick={() => {
                            setPlanEdits((current) => ({
                              ...current,
                              [day]: [...current[day], { gameKey: "memory" as PlatformGameKey, goal: "" }],
                            }));
                          }}>+ Oyun Ekle</button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: "20px" }}>
                    <button type="button" className={styles.primaryButton} onClick={handleSaveWeeklyPlan}>Planı Kaydet</button>
                  </div>
                </div>
              )}

              {clientDetailTab === "scores" && (
                <div className={styles.scoreHistorySection}>
                  {GAME_TABS.map((game) => {
                    const gameSessions = platformOverview.recentSessions.filter((s) => s.gameKey === game.key && s.clientId === selectedClient.id);
                    const gameScore = scoreboard[game.key];
                    const maxScore = Math.max(gameScore.best, 1);
                    return (
                      <div key={game.key} className={styles.scoreGameSection}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <strong style={{ color: "#0d2c44" }}>{game.title}</strong>
                          <span style={{ color: "#7a99b4", fontSize: "0.84rem" }}>{gameScore.plays} oynama</span>
                        </div>
                        <div className={styles.scoreBar}>
                          <div className={styles.scoreBarFill} style={{ width: `${Math.min(100, (gameScore.best / maxScore) * 100)}%` }} />
                        </div>
                        {gameSessions.length === 0 ? (
                          <p style={{ color: "#7a99b4", fontSize: "0.84rem", marginTop: "8px" }}>Henüz oyun skoru yok.</p>
                        ) : (
                          <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
                            {gameSessions.slice(0, 5).map((session) => (
                              <div key={session.id} className={styles.activityCard} style={{ padding: "10px 14px" }}>
                                <span style={{ color: "#567896", fontSize: "0.84rem" }}>{formatPlayedAt(session.playedAt)}</span>
                                <strong style={{ color: "#0d2c44" }}>{session.score} puan</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Games View ── */}
        {activeAppView === "games" && (
          <div>
            <div className={styles.workspaceBar}>
              <div className={styles.workspaceBarLeft}>
                <span className={styles.workspaceCrumb}>Oyun Çalışma Alanı</span>
                <span className={styles.workspaceSessionBadge}>
                  {activeTherapist?.displayName ?? "Terapist seç"} · {activeClient?.displayName ?? "Danışan seç"}
                </span>
                <span className={`${styles.serverBadge} ${platformStatus === "online" ? styles.serverBadgeOnline : platformStatus === "schema_missing" ? styles.serverBadgeWarn : platformStatus === "error" ? styles.serverBadgeError : styles.serverBadgeIdle}`}>
                  {getDatabaseStatusLabel(platformStatus)}
                </span>
              </div>
              <div className={styles.workspaceBarRight}>
                <button type="button" className={styles.secondaryButton} onClick={() => setActiveAppView("dashboard")}>Panel</button>
              </div>
            </div>

            {/* ── Mobile-first: compact session + game picker ── */}
            <div className={styles.mobileGameNav}>
              <div className={styles.mobileSessionRow}>
                <select value={activeTherapist?.id ?? ""} onChange={(event) => setActiveTherapistId(event.target.value)} className={styles.mobileSelectCompact}>
                  {therapistOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                </select>
                <select value={activeClient?.id ?? ""} onChange={(event) => setActiveClientId(event.target.value)} className={styles.mobileSelectCompact}>
                  {clientOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                </select>
              </div>
              <div className={styles.mobileCategoryStrip}>
                {GAME_CATEGORIES.map((category) => {
                  const isActive = activeTab.category === category.key;
                  return (
                    <button key={category.key} type="button" className={`${styles.mobileCategoryChip} ${isActive ? styles.mobileCategoryChipActive : ""}`} onClick={() => openCategory(category.key)}>
                      <span>{category.icon}</span> {category.title}
                    </button>
                  );
                })}
              </div>
              <div className={styles.mobileGameStrip}>
                {visibleTabs.map((tab) => (
                  <button key={tab.key} type="button" className={`${styles.mobileGameChip} ${activeGame === tab.key ? styles.mobileGameChipActive : ""}`} onClick={() => setActiveGame(tab.key)}>
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.gamesLayout}>
              <aside className={styles.gamesSidebar}>
                <div className={styles.sidebarBlock}>
                  <span className={styles.sectionEyebrow}>Aktif seans</span>
                  <div className={styles.sessionContextCard}>
                    <label className={styles.fieldBlock}>
                      <span>Terapist</span>
                      <select value={activeTherapist?.id ?? ""} onChange={(event) => setActiveTherapistId(event.target.value)} className={styles.inputSurface}>
                        {therapistOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                      </select>
                    </label>
                    <label className={styles.fieldBlock}>
                      <span>Danışan</span>
                      <select value={activeClient?.id ?? ""} onChange={(event) => setActiveClientId(event.target.value)} className={styles.inputSurface}>
                        {clientOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                      </select>
                    </label>
                    <button type="button" className={styles.secondaryButton} style={{ width: "100%" }} onClick={resetSessionClock}>Yeni Seans Başlat</button>
                  </div>
                </div>

                <div className={styles.sidebarBlock}>
                  <span className={styles.sectionEyebrow}>Kategoriler</span>
                  <div className={styles.categoryTabs}>
                    {GAME_CATEGORIES.map((category) => {
                      const isActive = activeTab.category === category.key;
                      return (
                        <button key={category.key} type="button" aria-pressed={isActive} className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ""}`} onClick={() => openCategory(category.key)}>
                          <span className={styles.categoryTabIcon}>{category.icon}</span>
                          {category.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.sidebarBlock}>
                  <span className={styles.sectionEyebrow}>Oyunlar</span>
                  <div className={styles.gameTabList}>
                    {visibleTabs.map((tab) => (
                      <button key={tab.key} type="button" aria-pressed={activeGame === tab.key} className={`${styles.gameTabItem} ${activeGame === tab.key ? styles.gameTabItemActive : ""}`} onClick={() => setActiveGame(tab.key)}>
                        <span style={{ color: "#5f83a3", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>{tab.kicker}</span>
                        <span style={{ color: "#0e2e48", fontSize: "0.92rem", fontWeight: 700 }}>{tab.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`${styles.sidebarBlock} ${styles.sidebarBlockDesktopOnly}`}>
                  <span className={styles.sectionEyebrow}>Skor özeti</span>
                  <div className={styles.scoreSummaryList}>
                    {scoreCards.map((card) => (
                      <div key={card.label} className={styles.scoreRow}>
                        <span className={styles.scoreRowLabel}>{card.label}</span>
                        <span className={styles.scoreRowBest}>{card.best}</span>
                        <span className={styles.scoreRowPlays}>{card.plays}×</span>
                      </div>
                    ))}
                  </div>
                </div>

                {recentSessionFeed.length > 0 && (
                  <div className={`${styles.sidebarBlock} ${styles.sidebarBlockDesktopOnly}`}>
                    <span className={styles.sectionEyebrow}>Son oturumlar</span>
                    <div className={styles.recentSessionList}>
                      {recentSessionFeed.slice(0, 3).map((session) => (
                        <div key={session.id} className={styles.recentSessionCard}>
                          <div>
                            <strong>{session.gameLabel}</strong>
                            <p>{session.therapistName} · {session.clientName}</p>
                          </div>
                          <div>
                            <strong>{session.score}</strong>
                            <p>{formatPlayedAt(session.playedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              <section className={styles.gameWorkspace}>
                <details className={styles.workspaceTopDetails} open>
                  <summary className={styles.workspaceTopSummary}>
                    <span className={styles.sectionEyebrow}>{activeCategory.title}</span>
                    <h3>{activeTab.title}</h3>
                  </summary>
                  <p>{activeTab.blurb}</p>
                  <div className={styles.goalPills}>
                    {activeTab.goals.map((goal) => <span key={goal}>{goal}</span>)}
                  </div>
                  <div className={styles.workspaceMeta}>
                    <div className={styles.workspaceMetaCards}>
                      <div className={styles.workspaceMetaCard}><span>En iyi</span><strong>{activeScoreCard.best}</strong></div>
                      <div className={styles.workspaceMetaCard}><span>Son</span><strong>{activeScoreCard.last}</strong></div>
                      <div className={styles.workspaceMetaCard}><span>Tekrar</span><strong>{activeScoreCard.plays}</strong></div>
                    </div>
                    {activeRemoteScore.best > 0 && (
                      <span style={{ color: "#4e7494", fontSize: "0.86rem" }}>
                        Sunucu en iyi: <strong style={{ color: "#071e30" }}>{activeRemoteScore.best}</strong>
                        {activeRemoteScore.lastPlayedAt ? ` · ${formatPlayedAt(activeRemoteScore.lastPlayedAt)}` : ""}
                      </span>
                    )}
                  </div>
                </details>

                {activeGame === "memory" && (
                  <section className={styles.gameCard}>
                    <div className={styles.gameStatusRow}>
                      <div><p className={styles.statusLabel}>Aktif seri</p><strong className={styles.statusValue}>{memoryState.score}</strong></div>
                      <div><p className={styles.statusLabel}>Faz</p><strong className={styles.statusValue}>{getPhaseLabel(memoryState.phase)}</strong></div>
                    </div>
                    <p className={styles.gameMessage}>{memoryState.message}</p>
                    <p className={styles.shortcutHint}>Kısayollar: <strong>A/B</strong> oyun değiştirir, yön tuşları hücre seçer, <strong>Enter</strong> ve <strong>Boşluk</strong> aksiyonu tetikler.</p>
                    <div className={styles.memoryGrid}>
                      {MEMORY_TILES.map((label, index) => {
                        const isActive = memoryState.flashIndex === index;
                        const isLocked = memoryState.phase === "showing";
                        const isCursor = memoryCursor === index;
                        const symbol = SYMBOL_LIBRARY.find((s) => s.label === label);
                        return (
                          <button key={label} type="button" className={`${styles.memoryTile} ${isActive ? styles.memoryTileActive : ""} ${isCursor ? styles.cursorTile : ""}`} disabled={isLocked} onClick={() => handleMemoryPick(index)} style={!isActive ? { "--tile-accent": symbol?.accent, background: symbol?.background } as CSSProperties : undefined}>
                            <span className={styles.memoryTileIcon}>{symbol?.icon ?? label[0]}</span>
                            <span className={styles.memoryTileLabel}>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.controlRow}>
                      <button type="button" className={styles.primaryButton} onClick={startMemoryGame}>Yeni Seri Başlat</button>
                      <button type="button" className={styles.secondaryButton} onClick={replayMemorySequence} disabled={memoryState.sequence.length === 0}>Sırayı Tekrar Göster</button>
                    </div>
                  </section>
                )}

                {activeGame === "pairs" && (
                  <section className={styles.gameCard}>
                    <div className={styles.gameStatusRow}>
                      <div><p className={styles.statusLabel}>Eşleşen çift</p><strong className={styles.statusValue}>{pairsState.pairsFound}</strong></div>
                      <div><p className={styles.statusLabel}>Hamle</p><strong className={styles.statusValue}>{pairsState.moves}</strong></div>
                      <div><p className={styles.statusLabel}>Durum</p><strong className={styles.statusValue}>{getPhaseLabel(pairsState.phase)}</strong></div>
                    </div>
                    <p className={styles.gameMessage}>{pairsState.message}</p>
                    <p className={styles.shortcutHint}>On iki kartı 4x3 düzende gezebilirsin; seçili kart parlak çerçeveyle görünür.</p>
                    <div className={styles.pairsGrid}>
                      {pairsState.tiles.map((tile, index) => {
                        const isCursor = pairsCursor === index;
                        const isVisible = tile.revealed || tile.matched;
                        return (
                          <button key={tile.id} type="button" data-pairs-index={index} aria-label={isVisible ? `${tile.label} kartı` : `Kapalı kart ${index + 1}`} className={`${styles.pairsTile} ${tile.matched ? styles.pairsTileMatched : ""} ${isVisible ? styles.pairsTileRevealed : styles.pairsTileHidden} ${isCursor ? styles.cursorTile : ""}`} onClick={() => handlePairsPick(index)}>
                            <div className={styles.pairsPattern} style={patternStyle(tile)} />
                            <div className={styles.pairsInner}>
                              {isVisible ? (
                                <><span className={styles.pairsIcon} style={{ color: tile.accent }}>{tile.icon}</span><span className={styles.pairsLabel}>{tile.label}</span></>
                              ) : (
                                <><span className={styles.pairsPlaceholder}>?</span><span className={styles.pairsHint}>Kartı aç</span></>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.controlRow}>
                      <button type="button" className={styles.primaryButton} onClick={startPairsGame}>Yeni Deste Aç</button>
                    </div>
                  </section>
                )}

                {activeGame === "pulse" && (
                  <section className={styles.gameCard}>
                    <div className={styles.gameStatusRow}>
                      <div><p className={styles.statusLabel}>Puan</p><strong className={styles.statusValue}>{pulseState.points}</strong></div>
                      <div><p className={styles.statusLabel}>Tur</p><strong className={styles.statusValue}>{pulseState.round}/{PULSE_TOTAL_ROUNDS}</strong></div>
                      <div><p className={styles.statusLabel}>Seri</p><strong className={styles.statusValue}>{pulseState.combo}</strong></div>
                    </div>
                    <p className={styles.gameMessage}>{pulseState.message}</p>
                    <p className={styles.shortcutHint}>Klavyede merkezden başla: yön tuşları seçimi taşır, <strong>Enter</strong> aktif kareyi oynatır.</p>
                    <div className={styles.pulseGrid}>
                      {PULSE_LABELS.map((label, index) => {
                        const isActive = pulseState.activeIndex === index && pulseState.phase === "playing";
                        const isCursor = pulseCursor === index;
                        return (
                          <button key={label} type="button" className={`${styles.pulseTile} ${isActive ? styles.pulseTileActive : ""} ${isCursor ? styles.cursorTile : ""}`} onClick={() => handlePulsePick(index)}>
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.controlRow}>
                      <button type="button" className={styles.primaryButton} onClick={startPulseGame}>Seti Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "route" && (
                  <section className={styles.gameCard}>
                    <div className={styles.gameStatusRow}>
                      <div><p className={styles.statusLabel}>Puan</p><strong className={styles.statusValue}>{routeState.score}</strong></div>
                      <div><p className={styles.statusLabel}>Tur</p><strong className={styles.statusValue}>{routeState.round}/{ROUTE_TOTAL_ROUNDS}</strong></div>
                      <div><p className={styles.statusLabel}>Seri</p><strong className={styles.statusValue}>{routeState.streak}</strong></div>
                    </div>
                    <p className={styles.gameMessage}>{routeState.message}</p>
                    <div className={styles.routeStage}>
                      <div className={styles.routeCommandCard}>
                        <span className={styles.statusLabel}>Aktif komut</span>
                        <strong>{routeCommandMeta?.label ?? "Hazır"}</strong>
                        <span>{routeCommandMeta?.icon ?? "•"}</span>
                      </div>
                      <div className={styles.routeHistory}>
                        {routeState.history.slice(-5).map((item, index) => {
                          const meta = ROUTE_COMMANDS.find((command) => command.key === item);
                          return <span key={`${item}-${index}`}>{meta?.label ?? item}</span>;
                        })}
                      </div>
                    </div>
                    <div className={styles.routeGrid}>
                      {ROUTE_COMMANDS.map((command, index) => {
                        const isCursor = routeCursor === index;
                        return (
                          <button key={command.key} type="button" className={`${styles.routeTile} ${isCursor ? styles.cursorTile : ""}`} onClick={() => handleRoutePick(command.key)}>
                            <span className={styles.routeIcon}>{command.icon}</span>
                            <span className={styles.routeLabel}>{command.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.controlRow}>
                      <button type="button" className={styles.primaryButton} onClick={startRouteGame}>Komutları Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "difference" && (
                  <section className={styles.gameCard}>
                    <div className={styles.gameStatusRow}>
                      <div><p className={styles.statusLabel}>Skor</p><strong className={styles.statusValue}>{differenceState.score}</strong></div>
                      <div><p className={styles.statusLabel}>Tur</p><strong className={styles.statusValue}>{differenceState.round}/{DIFFERENCE_TOTAL_ROUNDS}</strong></div>
                      <div><p className={styles.statusLabel}>Durum</p><strong className={styles.statusValue}>{getPhaseLabel(differenceState.phase)}</strong></div>
                    </div>
                    <p className={styles.gameMessage}>{differenceState.message}</p>
                    <p className={styles.shortcutHint}>Aynı dizilim klavyede de çalışır; seçili kart parlak kontur ile gösterilir.</p>
                    <div className={styles.differenceGrid}>
                      {differenceState.tiles.map((tile, index) => {
                        const reveal = differenceState.revealId === tile.id;
                        const isCursor = differenceCursor === index;
                        return (
                          <button key={tile.id} type="button" className={`${styles.differenceTile} ${reveal ? styles.differenceTileReveal : ""} ${isCursor ? styles.cursorTile : ""}`} onClick={() => handleDifferencePick(tile.id)} style={{ "--tile-accent": tile.accent, "--tile-background": tile.background, transform: `rotate(${tile.rotation}deg)` } as CSSProperties}>
                            <div className={styles.differencePattern} style={patternStyle(tile)} />
                            <div className={styles.differenceInner}>
                              <span className={styles.differenceIcon}>{tile.icon}</span>
                              <span className={styles.differenceLabel}>{tile.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.controlRow}>
                      <button type="button" className={styles.primaryButton} onClick={startDifferenceGame}>Turu Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "scan" && (
                  <section className={styles.gameCard}>
                    <div className={styles.gameStatusRow}>
                      <div><p className={styles.statusLabel}>Skor</p><strong className={styles.statusValue}>{scanState.score}</strong></div>
                      <div><p className={styles.statusLabel}>Tur</p><strong className={styles.statusValue}>{scanState.round}/{SCAN_TOTAL_ROUNDS}</strong></div>
                      <div><p className={styles.statusLabel}>Hedef</p><strong className={styles.statusValue}>{scanState.targetLabel || "Hazır"}</strong></div>
                    </div>
                    <p className={styles.gameMessage}>{scanState.message}</p>
                    <div className={styles.scanTargetPanel}>
                      <span className={styles.statusLabel}>Bu simgeyi bul</span>
                      <strong>{scanState.targetLabel || "Oyunu başlat"}</strong>
                    </div>
                    <div className={styles.scanGrid}>
                      {scanState.tiles.map((tile, index) => {
                        const reveal = scanState.revealId === tile.id;
                        const isCursor = scanCursor === index;
                        return (
                          <button key={tile.id} type="button" className={`${styles.scanTile} ${reveal ? styles.differenceTileReveal : ""} ${isCursor ? styles.cursorTile : ""}`} onClick={() => handleScanPick(tile.id)} style={{ "--tile-accent": tile.accent, "--tile-background": tile.background, transform: `rotate(${tile.rotation}deg)` } as CSSProperties}>
                            <div className={styles.differencePattern} style={patternStyle(tile)} />
                            <div className={styles.scanInner}>
                              <span className={styles.scanIcon}>{tile.icon}</span>
                              <span className={styles.differenceLabel}>{tile.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.controlRow}>
                      <button type="button" className={styles.primaryButton} onClick={startScanGame}>Taramayı Başlat</button>
                    </div>
                  </section>
                )}

              </section>
            </div>
          </div>
        )}

        {/* ── Therapy Program ── */}
        {activeAppView === "therapy-program" && (
          <div className={styles.therapyProgramPage}>
            <div className={styles.tpHeader}>
              <div>
                <h1 className={styles.tpTitle}>Terapi Programı</h1>
                <p className={styles.tpLead}>Kanıta dayalı ergoterapi alanlarına göre aktivite önerileri, oyun eşlemeleri ve haftalık plan üreticisi.</p>
              </div>
              {clientOptions.length > 0 && (
                <div className={styles.tpClientPicker}>
                  <label className={styles.fieldBlock}>
                    <span>Danışan seç</span>
                    <select value={tpSelectedClientId ?? ""} onChange={(e) => setTpSelectedClientId(e.target.value || null)} className={styles.inputSurface}>
                      <option value="">Danışan seçin...</option>
                      {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                    </select>
                  </label>
                </div>
              )}
            </div>

            {/* Domain Tabs */}
            <div className={styles.tpTabStrip}>
              <button type="button" className={`${styles.tpTab} ${tpActiveTab === "domains" ? styles.tpTabActive : ""}`} onClick={() => setTpActiveTab("domains")}>Terapi Alanları</button>
              <button type="button" className={`${styles.tpTab} ${tpActiveTab === "activities" ? styles.tpTabActive : ""}`} onClick={() => setTpActiveTab("activities")} disabled={!tpSelectedDomain}>Aktiviteler</button>
              <button type="button" className={`${styles.tpTab} ${tpActiveTab === "games" ? styles.tpTabActive : ""}`} onClick={() => setTpActiveTab("games")} disabled={!tpSelectedDomain}>Oyun Eşleme</button>
              <button type="button" className={`${styles.tpTab} ${tpActiveTab === "plan" ? styles.tpTabActive : ""}`} onClick={() => setTpActiveTab("plan")} disabled={!tpSelectedDomain}>Haftalık Plan</button>
              <button type="button" className={`${styles.tpTab} ${tpActiveTab === "progress" ? styles.tpTabActive : ""}`} onClick={() => setTpActiveTab("progress")} disabled={!tpSelectedClientId}>İlerleme</button>
            </div>

            <div className={styles.tpContent}>

              {/* ── Domains Tab ── */}
              {tpActiveTab === "domains" && (
                <div>
                  <h2 className={styles.tpSectionTitle}>Ergoterapi Uygulama Alanları</h2>
                  <p style={{ color: "#567896", marginBottom: "24px", fontSize: "0.94rem" }}>Danışanın ihtiyacına uygun terapi alanını seçin. Sistem, alan bazında hedefler, aktiviteler ve oyun önerileri üretecektir.</p>
                  <div className={styles.tpDomainsGrid}>
                    {THERAPY_DOMAINS.map((domain) => (
                      <button key={domain.key} type="button" className={`${styles.tpDomainCard} ${tpSelectedDomain === domain.key ? styles.tpDomainCardActive : ""}`} onClick={() => handleSelectDomain(domain.key)} style={{ "--domain-color": domain.color } as CSSProperties}>
                        <span className={styles.tpDomainIcon}>{domain.icon}</span>
                        <strong className={styles.tpDomainLabel}>{domain.label}</strong>
                        <p className={styles.tpDomainDesc}>{domain.description}</p>
                        <div className={styles.tpDomainMeta}>
                          <span>{domain.goals.length} hedef</span>
                          <span>{domain.activities.length} aktivite</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Activities Tab ── */}
              {tpActiveTab === "activities" && tpSelectedDomain && (() => {
                const domain = THERAPY_DOMAINS.find((d) => d.key === tpSelectedDomain);
                if (!domain) return null;
                const filteredActivities = tpDifficultyFilter === "all" ? domain.activities : domain.activities.filter((a) => a.difficulty === tpDifficultyFilter);
                return (
                  <div>
                    <div className={styles.tpSectionHeader}>
                      <div>
                        <span className={styles.tpDomainBadge} style={{ background: domain.color }}>{domain.icon} {domain.label}</span>
                        <h2 className={styles.tpSectionTitle}>Terapi Hedefleri ve Aktiviteler</h2>
                      </div>
                      <button type="button" className={styles.primaryButton} onClick={handleGeneratePlan}>Plan Üret →</button>
                    </div>

                    {/* Goals */}
                    <div className={styles.tpGoalsSection}>
                      <h3 className={styles.tpSubTitle}>Terapi Hedefleri</h3>
                      <div className={styles.tpGoalsGrid}>
                        {domain.goals.map((goal) => (
                          <div key={goal.id} className={styles.tpGoalCard}>
                            <strong>{goal.label}</strong>
                            <p>{goal.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Functional Challenges */}
                    <div className={styles.tpChallengesSection}>
                      <h3 className={styles.tpSubTitle}>Fonksiyonel Zorluklar</h3>
                      <div className={styles.tpChipList}>
                        {domain.challenges.map((ch) => (
                          <span key={ch.id} className={styles.tpChip}>{ch.label}</span>
                        ))}
                      </div>
                    </div>

                    {/* Sub Skills */}
                    <div className={styles.tpSkillsSection}>
                      <h3 className={styles.tpSubTitle}>Alt Beceriler</h3>
                      <div className={styles.tpSkillsGrid}>
                        {domain.subSkills.map((skill) => (
                          <div key={skill.id} className={styles.tpSkillCard}>
                            <strong>{skill.label}</strong>
                            <p>{skill.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Activities */}
                    <div className={styles.tpActivitiesSection}>
                      <div className={styles.tpActivitiesHeader}>
                        <h3 className={styles.tpSubTitle}>Aktivite Önerileri</h3>
                        <div className={styles.tpFilterRow}>
                          {(["all", "kolay", "orta", "zor"] as const).map((level) => (
                            <button key={level} type="button" className={`${styles.tpFilterBtn} ${tpDifficultyFilter === level ? styles.tpFilterBtnActive : ""}`} onClick={() => setTpDifficultyFilter(level)}>
                              {level === "all" ? "Tümü" : level === "kolay" ? "Kolay" : level === "orta" ? "Orta" : "Zor"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {filteredActivities.length === 0 ? (
                        <p style={{ color: "#7a99b4", padding: "20px 0" }}>Bu zorluk seviyesinde aktivite bulunmuyor.</p>
                      ) : (
                        <div className={styles.tpActivitiesGrid}>
                          {filteredActivities.map((activity) => (
                            <div key={activity.id} className={styles.tpActivityCard}>
                              <div className={styles.tpActivityTop}>
                                <strong>{activity.label}</strong>
                                <span className={`${styles.tpDiffBadge} ${styles[`tpDiff_${activity.difficulty}`]}`}>{activity.difficulty === "kolay" ? "Kolay" : activity.difficulty === "orta" ? "Orta" : "Zor"}</span>
                              </div>
                              <p className={styles.tpActivityDesc}>{activity.description}</p>
                              <div className={styles.tpActivityMeta}>
                                <span className={styles.tpMetaItem}>📁 {activity.subSkill}</span>
                                <span className={styles.tpMetaItem}>🏷️ {activity.activityType}</span>
                                <span className={styles.tpMetaItem}>⏱️ {activity.sessionMinutes} dk</span>
                                {activity.homeExercise && <span className={styles.tpMetaItem}>🏠 Ev ödevi</span>}
                              </div>
                              {activity.materials.length > 0 && (
                                <div className={styles.tpMaterials}>
                                  <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "#4a7090" }}>Materyaller:</span>
                                  {activity.materials.map((m) => <span key={m} className={styles.tpMaterialChip}>{m}</span>)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Games Mapping Tab ── */}
              {tpActiveTab === "games" && tpSelectedDomain && (() => {
                const domain = THERAPY_DOMAINS.find((d) => d.key === tpSelectedDomain);
                if (!domain) return null;
                const gameMappings = getGameMappingsForDomain(tpSelectedDomain);
                return (
                  <div>
                    <div className={styles.tpSectionHeader}>
                      <div>
                        <span className={styles.tpDomainBadge} style={{ background: domain.color }}>{domain.icon} {domain.label}</span>
                        <h2 className={styles.tpSectionTitle}>Dijital Oyun Eşlemesi</h2>
                      </div>
                    </div>
                    <p style={{ color: "#567896", marginBottom: "24px", fontSize: "0.94rem" }}>Bu terapi alanı için uygun dijital oyunlar ve terapötik amaçları.</p>

                    <div className={styles.tpGamesGrid}>
                      {gameMappings.map((mapping) => {
                        const gameTab = GAME_TABS.find((g) => g.key === mapping.gameKey);
                        if (!gameTab) return null;
                        return (
                          <div key={mapping.gameKey} className={styles.tpGameCard}>
                            <div className={styles.tpGameCardHeader}>
                              <strong>{gameTab.title}</strong>
                              <span style={{ color: "#6987a4", fontSize: "0.84rem" }}>{gameTab.kicker}</span>
                            </div>
                            <p className={styles.tpGameRationale}>{mapping.therapeuticRationale}</p>
                            <div className={styles.tpGamePurposes}>
                              <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#0d2c44" }}>Terapötik Amaçlar:</span>
                              {mapping.purposes.map((p) => (
                                <span key={p} className={styles.tpPurposeChip}>{GAME_PURPOSE_LABELS[p]}</span>
                              ))}
                            </div>
                            <div className={styles.tpGameDifficulty}>
                              <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "#4a7090" }}>Zorluk uyumu:</span>
                              {mapping.difficultyFit.map((d) => (
                                <span key={d} className={`${styles.tpDiffBadge} ${styles[`tpDiff_${d}`]}`}>{d === "kolay" ? "Kolay" : d === "orta" ? "Orta" : "Zor"}</span>
                              ))}
                            </div>
                            <button type="button" className={styles.primaryButton} style={{ marginTop: "14px", width: "100%", padding: "10px 16px", fontSize: "0.86rem" }} onClick={() => openGameView(mapping.gameKey)}>Oyunu Aç →</button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Full Game Mapping Reference Table */}
                    <div className={styles.tpMappingTable}>
                      <h3 className={styles.tpSubTitle}>Tüm Oyun–Amaç Eşleme Tablosu</h3>
                      <div className={styles.tpTableWrap}>
                        <table className={styles.tpTable}>
                          <thead>
                            <tr>
                              <th>Oyun</th>
                              <th>Terapötik Amaçlar</th>
                              <th>Uygun Alanlar</th>
                              <th>Zorluk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {GAME_THERAPY_MAPPINGS.map((m) => {
                              const gt = GAME_TABS.find((g) => g.key === m.gameKey);
                              return (
                                <tr key={m.gameKey}>
                                  <td><strong>{gt?.title ?? m.gameKey}</strong></td>
                                  <td>{m.purposes.map((p) => GAME_PURPOSE_LABELS[p]).join(", ")}</td>
                                  <td>{m.suitableDomains.map((dk) => THERAPY_DOMAINS.find((d) => d.key === dk)?.label ?? dk).join(", ")}</td>
                                  <td>{m.difficultyFit.map((d) => d === "kolay" ? "Kolay" : d === "orta" ? "Orta" : "Zor").join(", ")}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Weekly Plan Tab ── */}
              {tpActiveTab === "plan" && tpSelectedDomain && (() => {
                const domain = THERAPY_DOMAINS.find((d) => d.key === tpSelectedDomain);
                if (!domain) return null;
                return (
                  <div>
                    <div className={styles.tpSectionHeader}>
                      <div>
                        <span className={styles.tpDomainBadge} style={{ background: domain.color }}>{domain.icon} {domain.label}</span>
                        <h2 className={styles.tpSectionTitle}>Haftalık Terapi Planı</h2>
                      </div>
                      <button type="button" className={styles.primaryButton} onClick={handleGeneratePlan}>{tpGeneratedPlan ? "Yeniden Üret" : "Plan Üret"}</button>
                    </div>

                    {!tpGeneratedPlan ? (
                      <div className={styles.tpPlanEmpty}>
                        <span style={{ fontSize: "3rem" }}>📋</span>
                        <p>Seçili terapi alanına göre otomatik haftalık plan oluşturmak için "Plan Üret" butonuna tıklayın.</p>
                        <p style={{ color: "#7a99b4", fontSize: "0.84rem" }}>Sistem, alanın hedeflerini, aktivitelerini ve uygun dijital oyunları kullanarak 3 günlük bir yapı önerecektir.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Weekly Plan Summary */}
                        <div className={styles.tpPlanSummary}>
                          <div className={styles.tpPlanSummaryCard}>
                            <span className={styles.tpPlanLabel}>Ana Hedef</span>
                            <strong>{tpGeneratedPlan.weeklyPlan.mainGoal}</strong>
                          </div>
                          <div className={styles.tpPlanSummaryCard}>
                            <span className={styles.tpPlanLabel}>Anahtar Aktiviteler</span>
                            <ul className={styles.tpPlanList}>
                              {tpGeneratedPlan.weeklyPlan.keyActivities.map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                          </div>
                          <div className={styles.tpPlanSummaryCard}>
                            <span className={styles.tpPlanLabel}>Dijital Oyunlar</span>
                            <div className={styles.tpChipList}>
                              {tpGeneratedPlan.weeklyPlan.digitalGames.map((gk) => {
                                const gt = GAME_TABS.find((g) => g.key === gk);
                                return <span key={gk} className={styles.tpChip}>{gt?.title ?? gk}</span>;
                              })}
                            </div>
                          </div>
                          <div className={styles.tpPlanSummaryCard}>
                            <span className={styles.tpPlanLabel}>Ev Ödevi</span>
                            <strong>{tpGeneratedPlan.weeklyPlan.homeExercise}</strong>
                          </div>
                        </div>

                        {/* Daily Structure */}
                        <h3 className={styles.tpSubTitle} style={{ marginTop: "32px" }}>Günlük Yapı</h3>
                        <div className={styles.tpDailyGrid}>
                          {tpGeneratedPlan.dailyStructure.map((day, i) => {
                            const gameTab = GAME_TABS.find((g) => g.key === day.game);
                            return (
                              <div key={i} className={styles.tpDayCard}>
                                <div className={styles.tpDayHeader}>{day.dayLabel}</div>
                                <div className={styles.tpDayBody}>
                                  <div className={styles.tpDayRow}>
                                    <span className={styles.tpDayRowLabel}>Aktivite</span>
                                    <span>{day.activity}</span>
                                  </div>
                                  <div className={styles.tpDayRow}>
                                    <span className={styles.tpDayRowLabel}>Dijital Oyun</span>
                                    <span>{gameTab?.title ?? day.game}</span>
                                  </div>
                                  <div className={styles.tpDayRow}>
                                    <span className={styles.tpDayRowLabel}>Gözlem</span>
                                    <span style={{ color: "#567896", fontSize: "0.86rem" }}>{day.observation}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <p style={{ marginTop: "20px", color: "#7a99b4", fontSize: "0.86rem" }}><em>Not: {tpGeneratedPlan.weeklyPlan.sessionNotes}</em></p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Progress Tab ── */}
              {tpActiveTab === "progress" && (() => {
                const selectedClient = clientOptions.find((c) => c.id === tpSelectedClientId) ?? null;
                if (!selectedClient) return (
                  <div className={styles.tpPlanEmpty}>
                    <span style={{ fontSize: "3rem" }}>📊</span>
                    <p>İlerleme takibi için üst kısımdan bir danışan seçin.</p>
                  </div>
                );
                const domain = tpSelectedDomain ? THERAPY_DOMAINS.find((d) => d.key === tpSelectedDomain) : null;
                const clientProgress = tpProgressEntries.filter((e) => e.clientId === selectedClient.id).sort((a, b) => b.date.localeCompare(a.date));
                const goals = domain?.goals ?? [];

                // Calculate average per goal
                const goalAverages = goals.map((goal) => {
                  const entries = clientProgress.filter((e) => e.goalId === goal.id);
                  const avg = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.value, 0) / entries.length) : 0;
                  return { ...goal, average: avg, count: entries.length };
                });

                return (
                  <div>
                    <div className={styles.tpSectionHeader}>
                      <div>
                        <h2 className={styles.tpSectionTitle}>İlerleme Takibi — {selectedClient.displayName}</h2>
                        {domain && <span className={styles.tpDomainBadge} style={{ background: domain.color }}>{domain.icon} {domain.label}</span>}
                      </div>
                      <button type="button" className={styles.primaryButton} onClick={() => setTpShowProgressForm(!tpShowProgressForm)}>+ Kayıt Ekle</button>
                    </div>

                    {tpShowProgressForm && domain && (
                      <div className={styles.tpProgressForm}>
                        <h4>Yeni İlerleme Kaydı</h4>
                        <div className={styles.tpProgressFormFields}>
                          <label className={styles.fieldBlock}>
                            <span>Hedef</span>
                            <select value={tpProgressForm.goalId} onChange={(e) => setTpProgressForm((c) => ({ ...c, goalId: e.target.value }))} className={styles.inputSurface}>
                              <option value="">Hedef seçin...</option>
                              {goals.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                            </select>
                          </label>
                          <label className={styles.fieldBlock}>
                            <span>Değer (0-100): {tpProgressForm.value}</span>
                            <input type="range" min={0} max={100} value={tpProgressForm.value} onChange={(e) => setTpProgressForm((c) => ({ ...c, value: Number(e.target.value) }))} className={styles.tpRangeInput} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "#7a99b4" }}>
                              {INDEPENDENCE_LEVELS.map((lvl) => <span key={lvl.key}>{lvl.label}</span>)}
                            </div>
                          </label>
                          <label className={styles.fieldBlock}>
                            <span>Not</span>
                            <textarea value={tpProgressForm.note} onChange={(e) => setTpProgressForm((c) => ({ ...c, note: e.target.value }))} placeholder="Gözlem veya değerlendirme notu..." className={`${styles.inputSurface} ${styles.textareaSurface}`} rows={3} />
                          </label>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button type="button" className={styles.primaryButton} onClick={handleAddProgressEntry}>Kaydet</button>
                            <button type="button" className={styles.secondaryButton} onClick={() => setTpShowProgressForm(false)}>İptal</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Goal Averages */}
                    {goalAverages.length > 0 && (
                      <div className={styles.tpProgressSummary}>
                        <h3 className={styles.tpSubTitle}>Hedef Bazlı Ortalama</h3>
                        <div className={styles.tpProgressBars}>
                          {goalAverages.map((ga) => (
                            <div key={ga.id} className={styles.tpProgressBarRow}>
                              <div className={styles.tpProgressBarLabel}>
                                <span>{ga.label}</span>
                                <span>{ga.average}%</span>
                              </div>
                              <div className={styles.tpProgressBarTrack}>
                                <div className={styles.tpProgressBarFill} style={{ width: `${ga.average}%` }} />
                              </div>
                              <span style={{ fontSize: "0.78rem", color: "#7a99b4" }}>{ga.count} kayıt</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* History */}
                    <div className={styles.tpProgressHistory}>
                      <h3 className={styles.tpSubTitle}>İlerleme Geçmişi</h3>
                      {clientProgress.length === 0 ? (
                        <p style={{ color: "#7a99b4", padding: "16px 0" }}>Henüz ilerleme kaydı eklenmedi.</p>
                      ) : (
                        <div className={styles.tpProgressList}>
                          {clientProgress.map((entry) => {
                            const goal = goals.find((g) => g.id === entry.goalId);
                            return (
                              <div key={entry.id} className={styles.tpProgressCard}>
                                <div className={styles.tpProgressCardTop}>
                                  <strong>{goal?.label ?? entry.goalId}</strong>
                                  <div className={styles.tpProgressCardScore}>
                                    <div className={styles.tpProgressMiniBar}>
                                      <div className={styles.tpProgressMiniBarFill} style={{ width: `${entry.value}%` }} />
                                    </div>
                                    <span>{entry.value}%</span>
                                  </div>
                                </div>
                                <span style={{ fontSize: "0.82rem", color: "#7a99b4" }}>{formatDate(entry.date)}</span>
                                {entry.note && <p style={{ marginTop: "6px", color: "#567896", fontSize: "0.88rem" }}>{entry.note}</p>}
                                <button type="button" style={{ background: "none", border: "none", color: "#b33a4e", fontSize: "0.8rem", cursor: "pointer", padding: "4px 0", marginTop: "6px" }} onClick={() => handleDeleteProgressEntry(entry.id)}>Sil</button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}

// Suppress unused lint for legacy constants still present
const _unusedRefs = { _formatDuration: typeof formatDuration };
void _unusedRefs;
