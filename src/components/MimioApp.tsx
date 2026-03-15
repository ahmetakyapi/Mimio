"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  LayoutDashboard, Users, Gamepad2, Stethoscope, UserPlus, Brain, Hand, Eye, Settings, LogOut, Clock, ChevronDown, RotateCcw, Sun, Moon,
  Baby, Zap, Puzzle, PersonStanding, Briefcase, Handshake,
  Target, ClipboardList, Home, Tag, FlaskConical, Lightbulb, BookOpen, BarChart3, Search, RefreshCw, Map, Layers, CalendarDays, TrendingUp, Grid3X3,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
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
  { label: "Bulut", icon: "☁", accent: "#23b8ff", background: "linear-gradient(180deg, rgba(6,22,48,0.92), rgba(4,14,34,0.78))", pattern: "rings" },
  { label: "Damlacık", icon: "◔", accent: "#0da7ff", background: "linear-gradient(180deg, rgba(5,18,42,0.92), rgba(3,12,30,0.80))", pattern: "grid" },
  { label: "Kırık Çizgi", icon: "〰", accent: "#2ca8ff", background: "linear-gradient(180deg, rgba(7,20,46,0.92), rgba(5,14,36,0.78))", pattern: "wave" },
  { label: "Halka", icon: "◎", accent: "#54ccff", background: "linear-gradient(180deg, rgba(6,24,50,0.92), rgba(4,16,38,0.78))", pattern: "rings" },
  { label: "Işık", icon: "✦", accent: "#78dbff", background: "linear-gradient(180deg, rgba(8,26,52,0.92), rgba(5,18,40,0.78))", pattern: "grid" },
  { label: "Dalga", icon: "≈", accent: "#49b8ff", background: "linear-gradient(180deg, rgba(5,20,44,0.92), rgba(3,14,32,0.82))", pattern: "wave" },
  { label: "Çember", icon: "○", accent: "#0cc8e4", background: "linear-gradient(180deg, rgba(4,22,40,0.92), rgba(3,16,30,0.82))", pattern: "rings" },
  { label: "Kare", icon: "□", accent: "#3daaee", background: "linear-gradient(180deg, rgba(6,20,44,0.92), rgba(4,14,34,0.80))", pattern: "grid" },
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

const CATEGORY_ICONS = { memorySkills: Brain, motorSkills: Hand, visualSkills: Eye } as const;

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

function formatElapsed(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

const DOMAIN_ICON_MAP: Record<string, LucideIcon> = {
  baby: Baby,
  brain: Brain,
  zap: Zap,
  puzzle: Puzzle,
  "person-standing": PersonStanding,
  briefcase: Briefcase,
  handshake: Handshake,
};

const GAME_ICON_MAP: Record<string, LucideIcon> = {
  memory: Brain,
  pairs: Grid3X3,
  pulse: Target,
  route: Map,
  difference: Eye,
  scan: Search,
};

function DomainIcon({ iconKey, size = 20, color, className }: { iconKey: string; size?: number; color?: string; className?: string }) {
  const Icon = DOMAIN_ICON_MAP[iconKey] ?? Brain;
  return <Icon size={size} className={className} style={color ? { color } : undefined} />;
}

interface MimioAppProps {
  initialAppView?: "login" | "register";
  onLogout?: () => void;
}

export function MimioApp({ initialAppView = "login", onLogout }: MimioAppProps = {}) {
  const { theme, toggle: toggleTheme } = useTheme();
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
  const THERAPY_FAVORITES_KEY = "mimio-therapy-favorites-v1";
  const THERAPY_CUSTOM_NOTES_KEY = "mimio-therapy-custom-notes-v1";
  const [tpSelectedDomain, setTpSelectedDomain] = useState<TherapyDomainKey | null>(null);
  const [tpSelectedClientId, setTpSelectedClientId] = useState<string | null>(null);
  const [tpActiveTab, setTpActiveTab] = useState<"domains" | "activities" | "games" | "plan" | "progress">("domains");
  const [tpDifficultyFilter, setTpDifficultyFilter] = useState<DifficultyLevel | "all">("all");
  const [tpGeneratedPlan, setTpGeneratedPlan] = useState<TherapyPlanSuggestion | null>(null);
  const [tpProgressEntries, setTpProgressEntries] = useState<ProgressEntry[]>([]);
  const [tpProgressForm, setTpProgressForm] = useState({ goalId: "", value: 50, note: "" });
  const [tpShowProgressForm, setTpShowProgressForm] = useState(false);
  const [tpFavoriteActivities, setTpFavoriteActivities] = useState<string[]>([]);
  const [tpActivitySearch, setTpActivitySearch] = useState("");
  const [tpExpandedActivity, setTpExpandedActivity] = useState<string | null>(null);
  const [tpCustomNotes, setTpCustomNotes] = useState<Record<string, string>>({});
  const [tpSubSkillFilter, setTpSubSkillFilter] = useState<string>("all");
  const [tpShowHomeOnly, setTpShowHomeOnly] = useState(false);
  const [tpSelectedDays, setTpSelectedDays] = useState<string[]>(["Pazartesi", "Çarşamba", "Cuma"]);

  // ── Existing state ──
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
  const [showUserMenu, setShowUserMenu] = useState(false);
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
  const gameDetailsRef = useRef<HTMLDetailsElement>(null);
  const [gameElapsed, setGameElapsed] = useState(0);
  const [gameTimerKey, setGameTimerKey] = useState(0);

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
      const storedFavs = window.localStorage.getItem(THERAPY_FAVORITES_KEY);
      if (storedFavs) { const p = JSON.parse(storedFavs); if (Array.isArray(p)) setTpFavoriteActivities(p); }
      const storedCNotes = window.localStorage.getItem(THERAPY_CUSTOM_NOTES_KEY);
      if (storedCNotes) { const p = JSON.parse(storedCNotes); if (p && typeof p === "object") setTpCustomNotes(p as Record<string, string>); }
    } catch {
      setScoreboard(EMPTY_SCOREBOARD);
    }
  }, []);

  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scoreboard)); } catch { /* ignore */ } }, [scoreboard]);
  useEffect(() => { try { window.localStorage.setItem(SESSION_CONTEXT_KEY, JSON.stringify({ activeTherapistId, activeClientId, sessionNote, sessionStartedAt })); } catch { /* ignore */ } }, [activeClientId, activeTherapistId, sessionNote, sessionStartedAt]);
  useEffect(() => { try { window.localStorage.setItem(NOTES_KEY, JSON.stringify(allNotes)); } catch { /* ignore */ } }, [allNotes]);
  useEffect(() => { try { window.localStorage.setItem(WEEKLY_PLANS_KEY, JSON.stringify(allWeeklyPlans)); } catch { /* ignore */ } }, [allWeeklyPlans]);
  useEffect(() => { try { window.localStorage.setItem(THERAPY_PROGRESS_KEY, JSON.stringify(tpProgressEntries)); } catch { /* ignore */ } }, [tpProgressEntries]);
  useEffect(() => { try { window.localStorage.setItem(THERAPY_FAVORITES_KEY, JSON.stringify(tpFavoriteActivities)); } catch { /* ignore */ } }, [tpFavoriteActivities]);
  useEffect(() => { try { window.localStorage.setItem(THERAPY_CUSTOM_NOTES_KEY, JSON.stringify(tpCustomNotes)); } catch { /* ignore */ } }, [tpCustomNotes]);

  useEffect(() => {
    if (!activeTherapistId && !activeClientId) return;
    setSessionStartedAt(Date.now());
  }, [activeClientId, activeTherapistId]);

  // ── Game timer: starts only when a game begins ──
  useEffect(() => {
    if (gameTimerKey === 0) return;
    setGameElapsed(0);
    const startedAt = Date.now();
    const id = window.setInterval(() => setGameElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [gameTimerKey]);

  // ── Reset timer and close details when switching games ──
  useEffect(() => {
    if (gameDetailsRef.current) gameDetailsRef.current.open = false;
    setGameTimerKey(0);
    setGameElapsed(0);
  }, [activeGame]);

  useEffect(() => { void loadPlatformOverview(); }, []);


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
    const plan = generateWeeklyPlanSuggestion(tpSelectedDomain, tpSelectedDays);
    setTpGeneratedPlan(plan);
    setTpActiveTab("plan");
  }

  function togglePlanDay(day: string) {
    setTpSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setTpGeneratedPlan(null);
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

  function toggleFavoriteActivity(activityId: string) {
    setTpFavoriteActivities((current) =>
      current.includes(activityId) ? current.filter((id) => id !== activityId) : [...current, activityId]
    );
  }

  function saveTpCustomNote(activityId: string, note: string) {
    setTpCustomNotes((current) => ({ ...current, [activityId]: note }));
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

  function resetSessionClock() { setSessionStartedAt(Date.now()); setGameTimerKey(0); setGameElapsed(0); setProfileFeedback("Seans süresi sıfırlandı."); }

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

  function startMemoryGame() { setGameTimerKey(k => k + 1); setMemoryCursor(0); playMemorySequence(createMemorySequence(MEMORY_START_LENGTH), 0); }
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

  function startPairsGame() { setGameTimerKey(k => k + 1); clearPairTimers(); setPairsCursor(0); setPairsState({ tiles: createPairsDeck(), moves: 0, pairsFound: 0, locked: false, phase: "playing", message: "Kartları aç ve aynı simgeleri eşleştir." }); }

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

  function startPulseGame() { setGameTimerKey(k => k + 1); setPulseCursor(4); setPulseState({ activeIndex: randomIndex(PULSE_LABELS.length), round: 1, hits: 0, misses: 0, combo: 0, points: 0, phase: "playing", message: "Işıklanan hedefe ritmi bozmadan dokun." }); }

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

  function startRouteGame() { setGameTimerKey(k => k + 1); setRouteCursor(0); setRouteState({ command: createRouteCommand(), round: 1, score: 0, streak: 0, phase: "playing", history: [], message: "Ortadaki komutu oku ve doğru yön düğmesine bas." }); }

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
    setGameTimerKey(k => k + 1);
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
    setGameTimerKey(k => k + 1);
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

  // ── Shared auth layout wrapper ──
  const authInp = "w-full px-4 py-3 border border-(--color-line) rounded-2xl bg-(--color-surface-strong) text-(--color-text-strong) text-sm placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/25 focus:border-(--color-primary) transition-colors";

  // ── Register view ──
  if (activeAppView === "register") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.14),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-64 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(99,102,241,0.08),transparent)]" />

        {/* Logo */}
        <button type="button" onClick={onLogout} className="flex flex-col items-center gap-2 mb-8 bg-transparent border-none cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-(--color-primary) flex items-center justify-center text-white font-bold text-lg shadow-(--shadow-primary) group-hover:scale-105 transition-transform">Mi</div>
          <span className="font-bold text-(--color-text-strong) text-lg">Mimio</span>
        </button>

        {/* Card */}
        <div className="w-full max-w-md bg-(--color-surface-strong) rounded-3xl border border-(--color-line) shadow-(--shadow-elevated) p-8" style={{ backdropFilter: "blur(16px)" }}>
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-(--color-primary) bg-(--color-primary-light) px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-(--color-primary)" />
              Ücretsiz Hesap Oluştur
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-(--color-text-strong) text-center mb-1">Hesabınızı Oluşturun</h2>
          <p className="text-(--color-text-soft) text-sm text-center mb-6">Dakikalar içinde başlayın, danışanlarınızla çalışmaya başlayın.</p>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">{loginError}</div>
          )}

          <form className="flex flex-col gap-3" onSubmit={async (e) => {
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
              if (!response.ok || !data?.ok) { setLoginError(data?.message ?? "Kayıt sırasında bir hata oluştu."); return; }
              await loadPlatformOverview();
              setTherapistDraft({ username: "", password: "", displayName: "", clinicName: "", specialty: "" });
              setLoginError("");
              handleLogin(data.profile!.id);
            } catch {
              setLoginError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
            }
          }}>
            <input value={therapistDraft.username} onChange={(e) => { setLoginError(""); setTherapistDraft((c) => ({ ...c, username: e.target.value.replace(/\s/g, "").toLocaleLowerCase("tr-TR") })); }} placeholder="Kullanıcı adı (boşluksuz, benzersiz)" className={authInp} required autoComplete="username" />
            <input type="password" value={therapistDraft.password} onChange={(e) => { setLoginError(""); setTherapistDraft((c) => ({ ...c, password: e.target.value })); }} placeholder="Şifre (en az 4 karakter)" className={authInp} required autoComplete="new-password" />
            <input value={therapistDraft.displayName} onChange={(e) => setTherapistDraft((c) => ({ ...c, displayName: e.target.value }))} placeholder="Ad soyad — örn. Uzm. Erg. Elif Kara" className={authInp} required />
            <div className="grid grid-cols-2 gap-3">
              <input value={therapistDraft.clinicName} onChange={(e) => setTherapistDraft((c) => ({ ...c, clinicName: e.target.value }))} placeholder="Kurum / klinik (isteğe bağlı)" className={authInp} />
              <input value={therapistDraft.specialty} onChange={(e) => setTherapistDraft((c) => ({ ...c, specialty: e.target.value }))} placeholder="Uzmanlık (isteğe bağlı)" className={authInp} />
            </div>
            <button type="submit" className="w-full bg-(--color-primary) text-white font-semibold py-3.5 rounded-2xl hover:bg-(--color-primary-hover) transition-colors text-sm border-none cursor-pointer mt-1 shadow-(--shadow-primary)">
              Hesabı Oluştur ve Gir →
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-(--color-line)" />
            <span className="text-(--color-text-muted) text-xs">veya</span>
            <div className="flex-1 h-px bg-(--color-line)" />
          </div>

          <p className="text-(--color-text-soft) text-sm text-center">
            Zaten hesabınız var mı?{" "}
            <button type="button" className="text-(--color-primary) font-semibold hover:underline bg-transparent border-none cursor-pointer" onClick={() => { setActiveAppView("login"); setLoginError(""); }}>Giriş yapın</button>
          </p>
        </div>

        {onLogout && (
          <button type="button" className="mt-6 text-(--color-text-muted) text-sm bg-transparent border-none cursor-pointer hover:text-(--color-text-body) transition-colors flex items-center gap-1" onClick={onLogout}>
            ← Ana Sayfaya Dön
          </button>
        )}
      </div>
    );
  }

  if (activeAppView === "login") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.14),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-64 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(99,102,241,0.08),transparent)]" />

        {/* Logo */}
        <button type="button" onClick={onLogout} className="flex flex-col items-center gap-2 mb-8 bg-transparent border-none cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-(--color-primary) flex items-center justify-center text-white font-bold text-lg shadow-(--shadow-primary) group-hover:scale-105 transition-transform">Mi</div>
          <span className="font-bold text-(--color-text-strong) text-lg">Mimio</span>
        </button>

        {/* Card */}
        <div className="w-full max-w-sm bg-(--color-surface-strong) rounded-3xl border border-(--color-line) shadow-(--shadow-elevated) p-8" style={{ backdropFilter: "blur(16px)" }}>
          <h2 className="text-2xl font-extrabold text-(--color-text-strong) text-center mb-1">Tekrar Hoş Geldiniz</h2>
          <p className="text-(--color-text-soft) text-sm text-center mb-7">Hesabınıza giriş yapın.</p>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">{loginError}</div>
          )}

          <form className="flex flex-col gap-3" onSubmit={async (e) => {
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
              if (!response.ok || !data?.ok) { setLoginError(data?.message ?? "Giriş sırasında bir hata oluştu."); return; }
              await loadPlatformOverview();
              setLoginUsername(""); setLoginPassword(""); setLoginError("");
              handleLogin(data.profile!.id);
            } catch {
              setLoginError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
            }
          }}>
            <input value={loginUsername} onChange={(e) => { setLoginError(""); setLoginUsername(e.target.value.replace(/\s/g, "").toLocaleLowerCase("tr-TR")); }} placeholder="Kullanıcı adı" className={authInp} required autoComplete="username" />
            <input type="password" value={loginPassword} onChange={(e) => { setLoginError(""); setLoginPassword(e.target.value); }} placeholder="Şifre" className={authInp} required autoComplete="current-password" />
            <button type="submit" className="w-full bg-(--color-primary) text-white font-semibold py-3.5 rounded-2xl hover:bg-(--color-primary-hover) transition-colors text-sm border-none cursor-pointer mt-1 shadow-(--shadow-primary)">
              Giriş Yap
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-(--color-line)" />
            <span className="text-(--color-text-muted) text-xs">veya</span>
            <div className="flex-1 h-px bg-(--color-line)" />
          </div>

          <p className="text-(--color-text-soft) text-sm text-center">
            Hesabınız yok mu?{" "}
            <button type="button" className="text-(--color-primary) font-semibold hover:underline bg-transparent border-none cursor-pointer" onClick={() => { setActiveAppView("register"); setLoginError(""); }}>Ücretsiz kayıt olun</button>
          </p>
        </div>

        {onLogout && (
          <button type="button" className="mt-6 text-(--color-text-muted) text-sm bg-transparent border-none cursor-pointer hover:text-(--color-text-body) transition-colors" onClick={onLogout}>
            ← Ana Sayfaya Dön
          </button>
        )}

        {/* Trust badges */}
        <div className="flex items-center gap-6 mt-8 text-xs text-(--color-text-muted)">
          {["Ücretsiz başla", "Kurulum yok", "Veri güvenliği"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-(--color-accent-green)" />
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── App shell (sidebar + content) ──
  const navItem = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-(--color-text-body) hover:bg-(--color-surface-elevated) transition-colors w-full text-left border-none bg-transparent cursor-pointer";
  const navItemActive = "bg-(--color-primary-light) text-(--color-primary)";
  const btnPrimary = "bg-(--color-primary) text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-(--color-primary-hover) transition-colors cursor-pointer border-none disabled:opacity-50";
  const btnSecondary = "bg-(--color-surface-strong) text-(--color-text-body) text-sm font-medium px-4 py-2 rounded-xl border border-(--color-line) hover:bg-(--color-surface-elevated) transition-colors cursor-pointer disabled:opacity-50";
  const inputCls = "w-full px-3 py-2.5 border border-(--color-line) rounded-xl bg-(--color-surface-strong) text-(--color-text-strong) text-sm placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/25 focus:border-(--color-primary) transition-colors";
  return (
    <main className="flex h-dvh overflow-hidden bg-(--color-page-bg)">
      <nav className="hidden lg:flex flex-col w-64 bg-(--color-sidebar) border-r border-(--color-line) shrink-0 overflow-y-auto" style={{ backdropFilter: "blur(20px)" }}>
        <button type="button" className="flex items-center gap-3 px-4 py-5 border-b border-(--color-line) w-full text-left cursor-pointer bg-transparent border-none" onClick={handleLogout} style={{ cursor: "pointer", background: "none", border: "none", borderBottom: "1px solid var(--color-line)", textAlign: "left" }}>
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-(--color-primary) text-white font-bold text-sm shrink-0">Mi</span>
          <div>
            <p className="font-bold text-(--color-text-strong) text-sm leading-tight m-0">Mimio</p>
            <p className="text-(--color-text-muted) text-xs m-0">Ergoterapi platformu</p>
          </div>
        </button>

        <div className="flex flex-col gap-1 p-3 flex-1">
          <button type="button" className={`${navItem} ${activeAppView === "dashboard" ? navItemActive : ""}`} onClick={() => setActiveAppView("dashboard")}>
            <LayoutDashboard size={16} />
            <span>Panel</span>
          </button>
          <button type="button" className={`${navItem} ${(activeAppView === "clients" || activeAppView === "client-detail") ? navItemActive : ""}`} onClick={() => setActiveAppView("clients")}>
            <Users size={16} />
            <span>Danışanlar</span>
          </button>
          <button type="button" className={`${navItem} ${activeAppView === "games" ? navItemActive : ""}`} onClick={() => setActiveAppView("games")}>
            <Gamepad2 size={16} />
            <span>Oyun Alanı</span>
          </button>
          <button type="button" className={`${navItem} ${activeAppView === "therapy-program" ? navItemActive : ""}`} onClick={() => setActiveAppView("therapy-program")}>
            <Stethoscope size={16} />
            <span>Terapi</span>
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 border-t border-(--color-line) mt-auto">
          <div className="w-8 h-8 rounded-full bg-(--color-primary)/10 flex items-center justify-center text-(--color-primary) font-bold text-sm shrink-0">
            {activeTherapist?.displayName?.[0]?.toUpperCase() ?? "T"}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <strong className="text-(--color-text-strong) text-xs font-semibold truncate">{activeTherapist?.displayName ?? "Terapist"}</strong>
            <span className="text-(--color-text-muted) text-xs truncate">{activeTherapist?.clinicName || "Bağımsız terapist"}</span>
          </div>
          <button type="button" onClick={toggleTheme} className="w-7 h-7 rounded-lg flex items-center justify-center text-(--color-text-muted) hover:text-(--color-primary) hover:bg-(--color-primary-light) bg-transparent border-none cursor-pointer transition-colors shrink-0" aria-label="Tema değiştir">
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button type="button" className="text-xs text-(--color-text-muted) hover:text-(--color-accent-red) bg-transparent border-none cursor-pointer font-medium" onClick={handleLogout}>Çıkış</button>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <header className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-(--color-line) shrink-0 fixed top-0 left-0 right-0 z-30" style={{ background: "var(--color-chrome-nav)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-(--color-primary) text-white font-bold text-xs">Mi</span>
          <span className="font-bold text-(--color-text-strong) text-sm">Mimio</span>
        </div>
        <div className="relative">
          <button type="button" className="w-9 h-9 rounded-full bg-(--color-primary)/10 flex items-center justify-center border-none cursor-pointer" onClick={() => setShowUserMenu((v) => !v)}>
            <span className="text-(--color-primary) font-bold text-sm">{activeTherapist?.displayName?.[0]?.toUpperCase() ?? "T"}</span>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-11 z-50 bg-(--color-surface-strong) rounded-2xl shadow-(--shadow-elevated) border border-(--color-line) p-2 min-w-[200px]" style={{ backdropFilter: "blur(16px)" }}>
                <div className="px-3 py-2 flex flex-col">
                  <strong className="text-(--color-text-strong) text-sm">{activeTherapist?.displayName ?? "Terapist"}</strong>
                  <span className="text-(--color-text-muted) text-xs">{activeTherapist?.clinicName || "Bağımsız terapist"}</span>
                </div>
                <div className="h-px bg-(--color-line) my-1" />
                <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-(--color-text-body) hover:bg-(--color-surface-elevated) w-full text-left bg-transparent border-none cursor-pointer" onClick={() => { setShowUserMenu(false); toggleTheme(); }}>
                  {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                </button>
                <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-(--color-text-body) hover:bg-(--color-surface-elevated) w-full text-left bg-transparent border-none cursor-pointer" onClick={() => setShowUserMenu(false)}>
                  <Settings size={14} /> Ayarlar
                </button>
                <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-(--color-accent-red) hover:bg-red-500/10 w-full text-left bg-transparent border-none cursor-pointer" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                  <LogOut size={14} /> Çıkış Yap
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pt-[52px] pb-16 lg:pt-0 lg:pb-0">

        {/* ── Dashboard ── */}
        {activeAppView === "dashboard" && (
          <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-start justify-between pt-1">
              <div>
                <p className="text-(--color-text-muted) text-xs font-semibold uppercase tracking-widest mb-2">{formatDate(getTodayString())}</p>
                <h1 className="text-3xl lg:text-4xl font-extrabold m-0 leading-tight" style={{
                  background: "linear-gradient(135deg, var(--color-text-strong) 0%, #a5b4fc 55%, #818cf8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Merhaba, {activeTherapist?.displayName?.split(" ")[0] ?? "Terapist"} 👋
                </h1>
              </div>
            </div>

            {/* Stats */}
            {(() => {
              const isLight = theme === "light";
              const statItems = [
                {
                  v: effectiveSessionCount, l: "Toplam Seans", Icon: Gamepad2,
                  gradient: isLight ? "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)" : "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(79,70,229,0.05) 100%)",
                  border: isLight ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.32)",
                  glow: isLight ? "none" : "0 0 48px rgba(99,102,241,0.18)",
                  color: isLight ? "#3730a3" : "#a5b4fc",
                  iconBg: isLight ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.2)",
                  iconColor: isLight ? "#4338ca" : "#818cf8",
                },
                {
                  v: clientOptions.length, l: "Danışan", Icon: Users,
                  gradient: isLight ? "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)" : "linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(5,150,105,0.05) 100%)",
                  border: isLight ? "rgba(16,185,129,0.28)" : "rgba(16,185,129,0.32)",
                  glow: isLight ? "none" : "0 0 48px rgba(16,185,129,0.14)",
                  color: isLight ? "#065f46" : "#6ee7b7",
                  iconBg: isLight ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.2)",
                  iconColor: isLight ? "#047857" : "#34d399",
                },
                {
                  v: thisWeekCount, l: "Bu Hafta", Icon: LayoutDashboard,
                  gradient: isLight ? "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)" : "linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(217,119,6,0.05) 100%)",
                  border: isLight ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.32)",
                  glow: isLight ? "none" : "0 0 48px rgba(245,158,11,0.14)",
                  color: isLight ? "#92400e" : "#fcd34d",
                  iconBg: isLight ? "rgba(245,158,11,0.14)" : "rgba(245,158,11,0.2)",
                  iconColor: isLight ? "#b45309" : "#f59e0b",
                },
              ];
              return (
                <div className="grid grid-cols-3 gap-4">
                  {statItems.map(({ v, l, gradient, border, glow, color, Icon, iconBg, iconColor }) => (
                    <div key={l} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: gradient, border: `1px solid ${border}`, boxShadow: glow }}>
                      <div className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                        <Icon size={15} style={{ color: iconColor }} />
                      </div>
                      <strong className="text-4xl lg:text-5xl font-extrabold block mt-1 mb-2" style={{ color }}>{v}</strong>
                      <span className="text-(--color-text-soft) text-sm font-medium">{l}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Quick Actions */}
            {(() => {
              const isLight = theme === "light";
              const actions = [
                {
                  Icon: UserPlus, title: "Yeni Danışan Ekle", sub: "Profil oluştur ve seans başlat",
                  action: () => { setShowAddClient(true); setActiveAppView("clients"); },
                  gradient: isLight ? "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.03) 100%)" : "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(16,185,129,0.03) 100%)",
                  border: isLight ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.25)",
                  iconBg: isLight ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.2)",
                  iconColor: isLight ? "#047857" : "#34d399",
                },
                {
                  Icon: Gamepad2, title: "Oyun Alanını Aç", sub: "6 modülle seans çalışma alanı",
                  action: () => setActiveAppView("games"),
                  gradient: isLight ? "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.03) 100%)" : "linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.03) 100%)",
                  border: isLight ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.25)",
                  iconBg: isLight ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.2)",
                  iconColor: isLight ? "#4338ca" : "#818cf8",
                },
                {
                  Icon: Stethoscope, title: "Terapi Programı", sub: "Aktivite önerileri ve haftalık plan",
                  action: () => setActiveAppView("therapy-program"),
                  gradient: isLight ? "linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.03) 100%)" : "linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(6,182,212,0.03) 100%)",
                  border: isLight ? "rgba(6,182,212,0.3)" : "rgba(6,182,212,0.25)",
                  iconBg: isLight ? "rgba(6,182,212,0.14)" : "rgba(6,182,212,0.2)",
                  iconColor: isLight ? "#0e7490" : "#22d3ee",
                },
              ] as const;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {actions.map(({ Icon, title, sub, action, gradient, border, iconBg, iconColor }) => (
                    <button key={title} type="button" onClick={action}
                      className="flex flex-col gap-2 p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-elevated) group shadow-(--shadow-card)"
                      style={{ background: gradient, borderColor: border }}>
                      <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-110" style={{ background: iconBg }}>
                        <Icon size={20} style={{ color: iconColor }} />
                      </span>
                      <strong className="text-(--color-text-strong) text-sm font-semibold">{title}</strong>
                      <span className="text-(--color-text-soft) text-xs leading-relaxed">{sub}</span>
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Game Categories */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest m-0">Oyun Kategorileri</h2>
              <div className="grid grid-cols-3 gap-4">
                {GAME_CATEGORIES.map((cat, catIdx) => {
                  const count = GAME_TABS.filter((g) => g.category === cat.key).length;
                  const CatIcon = CATEGORY_ICONS[cat.key];
                  const isLight = theme === "light";
                  const catStyles = [
                    {
                      bg: isLight ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.16)",
                      color: isLight ? "#6d28d9" : "#c4b5fd",
                      border: isLight ? "rgba(139,92,246,0.28)" : "rgba(139,92,246,0.3)",
                      glow: isLight ? "none" : "0 0 32px rgba(139,92,246,0.1)",
                      labelBg: isLight ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.18)",
                      labelColor: isLight ? "#5b21b6" : "#a78bfa",
                    },
                    {
                      bg: isLight ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.16)",
                      color: isLight ? "#b45309" : "#fcd34d",
                      border: isLight ? "rgba(245,158,11,0.28)" : "rgba(245,158,11,0.3)",
                      glow: isLight ? "none" : "0 0 32px rgba(245,158,11,0.1)",
                      labelBg: isLight ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.18)",
                      labelColor: isLight ? "#92400e" : "#f59e0b",
                    },
                    {
                      bg: isLight ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.16)",
                      color: isLight ? "#0e7490" : "#67e8f9",
                      border: isLight ? "rgba(6,182,212,0.28)" : "rgba(6,182,212,0.3)",
                      glow: isLight ? "none" : "0 0 32px rgba(6,182,212,0.1)",
                      labelBg: isLight ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.18)",
                      labelColor: isLight ? "#155e75" : "#06b6d4",
                    },
                  ][catIdx] ?? {
                    bg: "rgba(99,102,241,0.12)", color: isLight ? "#4338ca" : "#818cf8",
                    border: "rgba(99,102,241,0.22)", glow: "none",
                    labelBg: "rgba(99,102,241,0.12)", labelColor: isLight ? "#3730a3" : "#6366f1",
                  };
                  return (
                    <button key={cat.key} type="button"
                      className="flex flex-col gap-2 p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 bg-(--color-surface-strong) group"
                      style={{ borderColor: catStyles.border, boxShadow: catStyles.glow }}
                      onClick={() => { openCategory(cat.key); }}>
                      <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-110" style={{ background: catStyles.bg }}>
                        <CatIcon size={20} style={{ color: catStyles.color }} />
                      </span>
                      <strong className="text-(--color-text-strong) text-sm font-semibold">{cat.title}</strong>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full self-start" style={{ background: catStyles.labelBg, color: catStyles.labelColor }}>{count} oyun</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest m-0">Son Seanslar</h2>
              {recentSessionFeed.length === 0 ? (
                <div className="bg-(--color-surface-strong) rounded-2xl border border-(--color-line) p-8 text-center flex flex-col items-center gap-3">
                  <Gamepad2 size={36} strokeWidth={1.5} className="text-(--color-text-muted)" />
                  <p className="text-(--color-text-soft) text-sm">Henüz seans kaydı yok. Oyun alanına geçerek ilk seansını başlatabilirsin.</p>
                  <button type="button" className={btnPrimary} onClick={() => setActiveAppView("games")}>Oyun Alanını Aç</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessionFeed.map((session) => {
                    const isLight = theme === "light";
                    return (
                      <div key={session.id} className="flex items-center justify-between rounded-2xl border border-(--color-line) px-5 py-4 transition-all duration-200 hover:border-[rgba(99,102,241,0.3)] bg-(--color-surface-strong) group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105" style={{ background: isLight ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.14)" }}>
                            <Gamepad2 size={16} style={{ color: isLight ? "#4338ca" : "#818cf8" }} />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <strong className="text-(--color-text-strong) text-sm font-semibold">{session.gameLabel}</strong>
                            <span className="text-(--color-text-muted) text-xs">{session.clientName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-(--color-text-muted) text-xs">{formatPlayedAt(session.playedAt)}</span>
                            {session.durationSeconds && <span className="text-(--color-text-muted) text-xs">{formatDuration(session.durationSeconds)}</span>}
                          </div>
                          <div className="flex flex-col items-center justify-center min-w-[52px]">
                            <strong className="text-2xl font-extrabold leading-none" style={{ color: isLight ? "#3730a3" : "#a5b4fc" }}>{session.score}</strong>
                            <span className="text-(--color-text-muted) text-[10px] font-medium uppercase tracking-wide">puan</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Clients List ── */}
        {activeAppView === "clients" && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-(--color-text-strong) m-0">Danışanlar</h1>
                <span className="text-(--color-text-muted) text-sm">{clientOptions.length} danışan</span>
              </div>
              <button type="button" className={btnPrimary} onClick={() => setShowAddClient(!showAddClient)}>+ Yeni Danışan</button>
            </div>

            {showAddClient && (
              <div className="bg-(--color-surface-strong) rounded-2xl border border-(--color-line) p-5">
                <h3 className="text-(--color-text-strong) font-semibold mb-3">Yeni Danışan Ekle</h3>
                <form className="flex flex-col gap-3" onSubmit={handleAddClient}>
                  <input value={addClientDraft.displayName} onChange={(e) => setAddClientDraft((c) => ({ ...c, displayName: e.target.value }))} placeholder="Danışan adı (örn. Ada Y.)" className={inputCls} required />
                  <input value={addClientDraft.ageGroup} onChange={(e) => setAddClientDraft((c) => ({ ...c, ageGroup: e.target.value }))} placeholder="Yaş grubu (örn. 7-9 yaş)" className={inputCls} />
                  <input value={addClientDraft.primaryGoal} onChange={(e) => setAddClientDraft((c) => ({ ...c, primaryGoal: e.target.value }))} placeholder="Birincil hedef (örn. Görsel tarama)" className={inputCls} />
                  <input value={addClientDraft.supportLevel} onChange={(e) => setAddClientDraft((c) => ({ ...c, supportLevel: e.target.value }))} placeholder="Destek düzeyi (örn. Orta destek)" className={inputCls} />
                  <div className="flex gap-2">
                    <button type="submit" className={btnPrimary}>Kaydet</button>
                    <button type="button" className={btnSecondary} onClick={() => setShowAddClient(false)}>İptal</button>
                  </div>
                </form>
              </div>
            )}

            {clientOptions.length === 0 ? (
              <div className="bg-(--color-surface-strong) rounded-2xl border border-(--color-line) p-12 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">◈</span>
                <p className="text-(--color-text-soft) text-sm">Henüz danışan eklenmedi. Yukarıdaki butonu kullanarak ilk danışanı ekleyebilirsin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientOptions.map((client, clientIdx) => {
                  const sessionCount = platformOverview.recentSessions.filter((s) => s.clientId === client.id).length;
                  const avatarPalette = theme === "light" ? [
                    { bg: "rgba(99,102,241,0.10)", color: "#4338ca", border: "rgba(99,102,241,0.22)" },
                    { bg: "rgba(16,185,129,0.10)", color: "#047857", border: "rgba(16,185,129,0.22)" },
                    { bg: "rgba(245,158,11,0.10)", color: "#b45309", border: "rgba(245,158,11,0.22)" },
                    { bg: "rgba(6,182,212,0.10)", color: "#0e7490", border: "rgba(6,182,212,0.22)" },
                    { bg: "rgba(168,85,247,0.10)", color: "#7c3aed", border: "rgba(168,85,247,0.22)" },
                    { bg: "rgba(236,72,153,0.10)", color: "#be185d", border: "rgba(236,72,153,0.22)" },
                  ] : [
                    { bg: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "rgba(99,102,241,0.3)" },
                    { bg: "rgba(16,185,129,0.18)", color: "#6ee7b7", border: "rgba(16,185,129,0.3)" },
                    { bg: "rgba(245,158,11,0.18)", color: "#fcd34d", border: "rgba(245,158,11,0.3)" },
                    { bg: "rgba(6,182,212,0.18)", color: "#67e8f9", border: "rgba(6,182,212,0.3)" },
                    { bg: "rgba(168,85,247,0.18)", color: "#d8b4fe", border: "rgba(168,85,247,0.3)" },
                    { bg: "rgba(236,72,153,0.18)", color: "#f9a8d4", border: "rgba(236,72,153,0.3)" },
                  ];
                  const palette = avatarPalette[clientIdx % avatarPalette.length];
                  return (
                    <div key={client.id} className="bg-(--color-surface-strong) rounded-2xl border border-(--color-line) p-5 flex flex-col gap-3 shadow-(--shadow-card) hover:shadow-(--shadow-elevated) hover:border-(--color-primary)/20 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl font-bold flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-105" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>
                          {client.displayName[0]?.toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="font-semibold text-(--color-text-strong) text-sm truncate">{client.displayName}</div>
                          <span className="text-(--color-text-muted) text-xs">{sessionCount} seans kaydı</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {client.ageGroup && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: palette.bg, color: palette.color }}>{client.ageGroup}</span>}
                        {client.supportLevel && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: palette.bg, color: palette.color }}>{client.supportLevel}</span>}
                      </div>
                      {client.primaryGoal && <p className="text-(--color-text-soft) text-sm m-0">{client.primaryGoal}</p>}
                      <div className="flex gap-2 mt-auto">
                        <button type="button" className={btnSecondary} onClick={() => handleSelectClient(client.id)}>Detay</button>
                        <button type="button" className={btnPrimary} onClick={() => { setSelectedClientId(client.id); setActiveClientId(client.id); setActiveAppView("games"); }}>Oyna</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Client Detail ── */}
        {activeAppView === "client-detail" && selectedClient && (() => {
          const isLight = theme === "light";
          const clientIdx = clientOptions.findIndex((c) => c.id === selectedClientId);
          const palette = (isLight ? [
            { bg: "rgba(99,102,241,0.10)", color: "#4338ca", border: "rgba(99,102,241,0.25)", glow: "rgba(99,102,241,0.08)", gradientFrom: "rgba(99,102,241,0.07)" },
            { bg: "rgba(16,185,129,0.10)", color: "#047857", border: "rgba(16,185,129,0.25)", glow: "rgba(16,185,129,0.08)", gradientFrom: "rgba(16,185,129,0.07)" },
            { bg: "rgba(245,158,11,0.10)", color: "#b45309", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.08)", gradientFrom: "rgba(245,158,11,0.07)" },
            { bg: "rgba(6,182,212,0.10)",  color: "#0e7490", border: "rgba(6,182,212,0.25)",  glow: "rgba(6,182,212,0.08)",  gradientFrom: "rgba(6,182,212,0.07)" },
            { bg: "rgba(168,85,247,0.10)", color: "#7c3aed", border: "rgba(168,85,247,0.25)", glow: "rgba(168,85,247,0.08)", gradientFrom: "rgba(168,85,247,0.07)" },
          ] : [
            { bg: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "rgba(99,102,241,0.35)", glow: "rgba(99,102,241,0.18)", gradientFrom: "rgba(99,102,241,0.12)" },
            { bg: "rgba(16,185,129,0.18)", color: "#6ee7b7", border: "rgba(16,185,129,0.35)", glow: "rgba(16,185,129,0.14)", gradientFrom: "rgba(16,185,129,0.12)" },
            { bg: "rgba(245,158,11,0.18)", color: "#fcd34d", border: "rgba(245,158,11,0.35)", glow: "rgba(245,158,11,0.14)", gradientFrom: "rgba(245,158,11,0.12)" },
            { bg: "rgba(6,182,212,0.18)",  color: "#67e8f9", border: "rgba(6,182,212,0.35)",  glow: "rgba(6,182,212,0.14)",  gradientFrom: "rgba(6,182,212,0.12)" },
            { bg: "rgba(168,85,247,0.18)", color: "#d8b4fe", border: "rgba(168,85,247,0.35)", glow: "rgba(168,85,247,0.14)", gradientFrom: "rgba(168,85,247,0.12)" },
          ])[clientIdx % 5];
          const clientSessions = platformOverview.recentSessions.filter((s) => s.clientId === selectedClientId);
          const bestScore = clientSessions.length > 0 ? Math.max(...clientSessions.map((s) => s.score)) : 0;
          return (
            <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

              {/* Back */}
              <button type="button" className="flex items-center gap-1.5 text-(--color-primary) text-sm font-semibold bg-transparent border-none cursor-pointer px-0 hover:opacity-75 transition-opacity" onClick={() => setActiveAppView("clients")}>
                ← Danışanlar
              </button>

              {/* Hero card */}
              <div className="rounded-2xl border p-6 overflow-hidden" style={{
                background: `linear-gradient(135deg, ${palette.gradientFrom} 0%, transparent 55%)`,
                borderColor: palette.border,
                boxShadow: isLight ? `0 2px 16px ${palette.glow}` : `0 0 60px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}>
                <div className="flex items-start gap-5 mb-5">
                  <div className="w-16 h-16 rounded-2xl font-extrabold flex items-center justify-center text-2xl shrink-0" style={{ background: palette.bg, color: palette.color, border: `2px solid ${palette.border}` }}>
                    {selectedClient.displayName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h1 className="text-2xl font-extrabold m-0 mb-2.5 text-(--color-text-strong)">{selectedClient.displayName}</h1>
                    <div className="flex flex-wrap gap-2">
                      {selectedClient.ageGroup && <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>{selectedClient.ageGroup}</span>}
                      {selectedClient.primaryGoal && <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>{selectedClient.primaryGoal}</span>}
                      {selectedClient.supportLevel && <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>{selectedClient.supportLevel}</span>}
                    </div>
                  </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Toplam Seans", value: clientSessions.length },
                    { label: "En İyi Skor", value: bestScore || "—" },
                    { label: "Not Sayısı", value: clientNotes.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{ background: isLight ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.25)", border: `1px solid ${palette.border}` }}>
                      <strong className="text-xl font-extrabold block leading-none mb-1" style={{ color: palette.color }}>{value}</strong>
                      <span className="text-(--color-text-muted) text-xs">{label}</span>
                    </div>
                  ))}
                </div>

                <button type="button" className={`${btnPrimary} w-full justify-center flex items-center gap-2`} onClick={() => { setActiveClientId(selectedClient.id); setActiveAppView("games"); }}>
                  <Gamepad2 size={16} /> Bu Danışanla Oyna
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)" }}>
                {(["notes", "plan", "scores"] as const).map((tab) => (
                  <button key={tab} type="button"
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border-none cursor-pointer ${clientDetailTab === tab ? "bg-(--color-surface-strong) text-(--color-text-strong) shadow-sm" : "text-(--color-text-soft) hover:text-(--color-text-body) bg-transparent"}`}
                    onClick={() => setClientDetailTab(tab)}>
                    {tab === "notes" ? "Notlar" : tab === "plan" ? "Haftalık Plan" : "Skor Geçmişi"}
                  </button>
                ))}
              </div>

              {/* ── Notes ── */}
              {clientDetailTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button type="button" className={btnPrimary} onClick={() => setShowNoteForm(!showNoteForm)}>+ Not Ekle</button>
                  </div>

                  {showNoteForm && (
                    <div className="rounded-2xl border border-(--color-line) p-5 bg-(--color-surface-strong) space-y-3">
                      <h4 className="text-(--color-text-strong) font-semibold m-0">Yeni Not</h4>
                      <input type="date" value={noteForm.date} onChange={(e) => setNoteForm((c) => ({ ...c, date: e.target.value }))} className={inputCls} />
                      <textarea value={noteForm.content} onChange={(e) => setNoteForm((c) => ({ ...c, content: e.target.value }))} placeholder="Seans notu, gözlem veya hedef..." className={`${inputCls} resize-none`} rows={4} />
                      <div className="flex gap-2">
                        <button type="button" className={btnPrimary} onClick={handleAddNote}>Kaydet</button>
                        <button type="button" className={btnSecondary} onClick={() => setShowNoteForm(false)}>İptal</button>
                      </div>
                    </div>
                  )}

                  {clientNotes.length === 0 ? (
                    <div className="rounded-2xl border border-(--color-line) p-8 text-center bg-(--color-surface-strong)">
                      <p className="text-(--color-text-muted) text-sm m-0">Henüz not eklenmedi.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientNotes.map((note) => (
                        <div key={note.id} className="rounded-2xl border border-(--color-line) overflow-hidden bg-(--color-surface-strong) flex">
                          <div className="w-1 shrink-0" style={{ background: palette.color }} />
                          <div className="flex-1 px-4 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: palette.bg, color: palette.color }}>{formatDate(note.date)}</span>
                              <button type="button" className="text-xs font-medium px-2.5 py-1 rounded-lg border-none cursor-pointer transition-opacity hover:opacity-75" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }} onClick={() => handleDeleteNote(note.id)}>Sil</button>
                            </div>
                            <p className="text-(--color-text-body) text-sm m-0 leading-relaxed">{note.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Weekly Plan ── */}
              {clientDetailTab === "plan" && (
                <div className="space-y-4">

                  {/* Week navigation */}
                  <div className="flex items-center gap-3">
                    <button type="button"
                      className="w-9 h-9 rounded-full flex items-center justify-center border text-(--color-text-soft) hover:text-(--color-text-strong) transition-all cursor-pointer shrink-0 text-base"
                      style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}
                      onClick={() => setPlanWeekStart(addDays(planWeekStart, -7))}>
                      ←
                    </button>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) m-0 mb-0.5">Haftalık Plan</p>
                      <strong className="text-sm font-bold text-(--color-text-strong)">{formatDate(planWeekStart)} – {formatDate(addDays(planWeekStart, 6))}</strong>
                    </div>
                    <button type="button"
                      className="w-9 h-9 rounded-full flex items-center justify-center border text-(--color-text-soft) hover:text-(--color-text-strong) transition-all cursor-pointer shrink-0 text-base"
                      style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}
                      onClick={() => setPlanWeekStart(addDays(planWeekStart, 7))}>
                      →
                    </button>
                  </div>

                  {/* Day rows */}
                  <div className="space-y-2">
                    {DAY_KEYS.map((day, dayIndex) => {
                      const dayDate = addDays(planWeekStart, dayIndex);
                      const entries = planEdits[day];
                      const isToday = dayDate === getTodayString();
                      const isWeekend = dayIndex >= 5;
                      const dayNames: Record<DayKey, string> = { mon: "Pazartesi", tue: "Salı", wed: "Çarşamba", thu: "Perşembe", fri: "Cuma", sat: "Cumartesi", sun: "Pazar" };
                      return (
                        <div key={day} className="rounded-2xl border overflow-hidden" style={{
                          borderColor: isToday ? palette.border : "var(--color-line)",
                          background: isToday
                            ? (isLight ? `linear-gradient(135deg, ${palette.bg} 0%, rgba(255,255,255,0.5) 100%)` : `linear-gradient(135deg, ${palette.gradientFrom} 0%, var(--color-surface-strong) 100%)`)
                            : "var(--color-surface-strong)",
                          boxShadow: isToday && !isLight ? `0 0 24px ${palette.glow}` : "none",
                          opacity: isWeekend && !isToday ? 0.75 : 1,
                        }}>

                          {/* Row header */}
                          <div className="flex items-center gap-4 px-4 py-3">
                            {/* Date badge */}
                            <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0" style={{
                              background: isToday ? palette.bg : (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"),
                              border: `1px solid ${isToday ? palette.border : "var(--color-line)"}`,
                            }}>
                              <span className="text-[9px] font-extrabold uppercase tracking-wider leading-none" style={{ color: isToday ? palette.color : "var(--color-text-muted)" }}>
                                {DAY_LABELS[day]}
                              </span>
                              <strong className="text-lg font-extrabold leading-tight" style={{ color: isToday ? palette.color : "var(--color-text-strong)" }}>
                                {dayDate.slice(8)}
                              </strong>
                            </div>

                            {/* Day name + today badge */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold" style={{ color: isToday ? palette.color : (isWeekend ? "var(--color-text-soft)" : "var(--color-text-strong)") }}>
                                  {dayNames[day]}
                                </span>
                                {isToday && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: palette.bg, color: palette.color }}>
                                    Bugün
                                  </span>
                                )}
                              </div>
                              {entries.length > 0 && (
                                <span className="text-xs text-(--color-text-muted)">{entries.length} aktivite planlandı</span>
                              )}
                            </div>

                            {/* Add button */}
                            <button type="button"
                              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border cursor-pointer transition-all hover:opacity-75"
                              style={{
                                background: isToday ? palette.bg : (isLight ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.1)"),
                                borderColor: isToday ? palette.border : (isLight ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.18)"),
                                color: isToday ? palette.color : (isLight ? "#4338ca" : "#818cf8"),
                              }}
                              onClick={() => { setPlanEdits((current) => ({ ...current, [day]: [...current[day], { gameKey: "memory" as PlatformGameKey, goal: "" }] })); }}>
                              + Oyun Ekle
                            </button>
                          </div>

                          {/* Entries */}
                          {entries.length > 0 && (
                            <div className="px-4 pb-4 space-y-2">
                              <div className="h-px" style={{ background: isToday ? palette.border : "var(--color-line)" }} />
                              <div className="pt-1 space-y-2">
                                {entries.map((entry, entryIndex) => (
                                  <div key={entryIndex} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{
                                    background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${isToday ? palette.border : "var(--color-line)"}`,
                                  }}>
                                    {/* Game number */}
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-extrabold" style={{ background: palette.bg, color: palette.color }}>
                                      {entryIndex + 1}
                                    </div>

                                    {/* Game select + goal input */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                      <select
                                        value={entry.gameKey}
                                        className="w-full text-sm font-semibold bg-transparent border-none outline-none cursor-pointer"
                                        style={{ color: "var(--color-text-strong)" }}
                                        onChange={(e) => {
                                          const newKey = e.target.value as PlatformGameKey;
                                          setPlanEdits((current) => { const updated = [...current[day]]; updated[entryIndex] = { ...updated[entryIndex], gameKey: newKey }; return { ...current, [day]: updated }; });
                                        }}>
                                        {GAME_TABS.map((g) => <option key={g.key} value={g.key}>{g.title}</option>)}
                                      </select>
                                      <input
                                        value={entry.goal}
                                        placeholder="Hedef notu ekle..."
                                        className="w-full text-xs bg-transparent border-none outline-none"
                                        style={{ color: "var(--color-text-soft)" }}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setPlanEdits((current) => { const updated = [...current[day]]; updated[entryIndex] = { ...updated[entryIndex], goal: val }; return { ...current, [day]: updated }; });
                                        }} />
                                    </div>

                                    {/* Delete */}
                                    <button type="button"
                                      className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border-none cursor-pointer text-xs font-bold transition-opacity hover:opacity-70"
                                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                                      onClick={() => { setPlanEdits((current) => { const updated = current[day].filter((_, i) => i !== entryIndex); return { ...current, [day]: updated }; }); }}>
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" className={btnPrimary} onClick={handleSaveWeeklyPlan}>
                    Planı Kaydet
                  </button>
                </div>
              )}

              {/* ── Score History ── */}
              {clientDetailTab === "scores" && (
                <div className="space-y-4">
                  {GAME_TABS.map((game) => {
                    const gameSessions = platformOverview.recentSessions.filter((s) => s.gameKey === game.key && s.clientId === selectedClient.id);
                    const gameScore = scoreboard[game.key];
                    if (gameScore.plays === 0) return null;
                    const maxScore = Math.max(gameScore.best, 1);
                    const pct = Math.min(100, (gameScore.best / maxScore) * 100);
                    return (
                      <div key={game.key} className="rounded-2xl border border-(--color-line) p-5 bg-(--color-surface-strong) space-y-3">
                        <div className="flex items-center justify-between">
                          <strong className="text-(--color-text-strong) text-sm font-semibold">{game.title}</strong>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: palette.bg, color: palette.color }}>{gameScore.best} en iyi</span>
                            <span className="text-(--color-text-muted) text-xs">{gameScore.plays} oynama</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${palette.color}, ${palette.border})` }} />
                        </div>
                        {gameSessions.length > 0 && (
                          <div className="grid gap-1.5">
                            {gameSessions.slice(0, 5).map((session) => (
                              <div key={session.id} className="flex items-center justify-between rounded-xl border border-(--color-line) px-3 py-2" style={{ background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>
                                <span className="text-(--color-text-soft) text-xs">{formatPlayedAt(session.playedAt)}{session.durationSeconds ? ` · ${formatDuration(session.durationSeconds)}` : ""}</span>
                                <strong className="text-sm font-extrabold" style={{ color: palette.color }}>{session.score}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {GAME_TABS.every((g) => scoreboard[g.key].plays === 0) && (
                    <div className="rounded-2xl border border-(--color-line) p-8 text-center bg-(--color-surface-strong)">
                      <p className="text-(--color-text-muted) text-sm m-0">Henüz oyun skoru yok.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })()}

        {/* ── Games View ── */}
        {activeAppView === "games" && (
          <div className="flex flex-col h-full">
            <div className="hidden lg:flex items-center justify-between px-6 h-14 border-b border-(--color-line) sticky top-0 z-10" style={{ background: "var(--color-chrome-header)", backdropFilter: "blur(20px)" }}>
              <div className="flex items-center gap-4">
                <span className="font-bold text-(--color-text-strong) text-sm">Oyun Alanı</span>
                <span className="w-px h-4 bg-(--color-line) shrink-0" />
                <div className="flex items-center gap-2 bg-(--color-primary)/8 border border-(--color-primary)/15 rounded-full px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-(--color-primary) max-w-52 truncate">
                    {activeTherapist?.displayName ?? "—"} · {activeClient?.displayName ?? "Danışan seç"}
                  </span>
                </div>
                <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 border ${platformStatus === "online" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : platformStatus === "schema_missing" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : platformStatus === "error" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-(--color-text-muted) border-(--color-line)"}`}>
                  {getDatabaseStatusLabel(platformStatus)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-(--color-surface-strong) border border-(--color-line) rounded-xl px-3 py-1.5">
                  <Clock size={13} className="text-(--color-primary)" />
                  <span className="font-mono font-bold text-(--color-text-strong) text-sm">{formatElapsed(gameElapsed)}</span>
                  <button type="button" className="text-(--color-primary) text-xs hover:underline bg-transparent border-none cursor-pointer ml-1" onClick={resetSessionClock}>Sıfırla</button>
                </div>
                <button type="button" className={btnSecondary} onClick={() => setActiveAppView("dashboard")}>← Panel</button>
              </div>
            </div>

            {/* ── Mobile game nav ── */}
            <div className="flex lg:hidden flex-col gap-2 px-4 py-3 border-b border-(--color-line)" style={{ background: "var(--color-chrome-header)" }}>
              <div className="flex items-center gap-2">
                <select value={activeTherapist?.id ?? ""} onChange={(event) => setActiveTherapistId(event.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-(--color-line) rounded-lg bg-(--color-surface-strong) text-(--color-text-body)">
                  {therapistOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                </select>
                <select value={activeClient?.id ?? ""} onChange={(event) => setActiveClientId(event.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-(--color-line) rounded-lg bg-(--color-surface-strong) text-(--color-text-body)">
                  {clientOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                </select>
                <div className="flex items-center gap-1 text-xs bg-(--color-surface-strong) border border-(--color-line) rounded-lg px-2 py-1">
                  <Clock size={11} className="text-(--color-text-muted)" />
                  <span className="font-mono font-bold text-(--color-text-strong)">{formatElapsed(gameElapsed)}</span>
                  <button type="button" className="text-(--color-primary) hover:underline bg-transparent border-none cursor-pointer ml-0.5" onClick={resetSessionClock}><RotateCcw size={10} /></button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {GAME_CATEGORIES.map((category) => {
                  const isActive = activeTab.category === category.key;
                  return (
                    <button key={category.key} type="button" className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer ${isActive ? "bg-(--color-primary) text-white" : "bg-(--color-surface-elevated) text-(--color-text-body)"}`} onClick={() => openCategory(category.key)}>
                      {(() => { const CI = CATEGORY_ICONS[category.key]; return <CI size={12} />; })()} {category.title}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {visibleTabs.map((tab) => (
                  <button key={tab.key} type="button" className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer ${activeGame === tab.key ? "bg-(--color-primary)/15 text-(--color-primary)" : "bg-(--color-surface-elevated) text-(--color-text-body)"}`} onClick={() => setActiveGame(tab.key)}>
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-(--color-line) overflow-y-auto bg-(--color-sidebar)" style={{ backdropFilter: "blur(20px)" }}>
                {/* Session setup */}
                <div className="p-4 border-b border-(--color-line) space-y-4">

                  {/* Active session status card */}
                  <div className="rounded-xl p-3 flex items-center justify-between" style={{
                    background: gameElapsed > 0 ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                    border: gameElapsed > 0 ? "1px solid rgba(16,185,129,0.2)" : "1px solid var(--color-line)",
                  }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{
                        background: gameElapsed > 0 ? "#10b981" : "#64748b",
                        boxShadow: gameElapsed > 0 ? "0 0 6px rgba(16,185,129,0.6)" : "none",
                      }} />
                      <span className="text-xs font-semibold" style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-text-muted)" }}>
                        {gameElapsed > 0 ? "Seans Aktif" : "Seans Bekliyor"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg" style={{
                      background: gameElapsed > 0 ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                    }}>
                      <Clock size={11} style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-text-muted)" }} />
                      <span className="font-mono font-bold text-xs" style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-text-muted)" }}>
                        {formatElapsed(gameElapsed)}
                      </span>
                    </div>
                  </div>

                  {/* Selectors */}
                  <div className="space-y-2.5">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] text-(--color-text-muted) font-semibold uppercase tracking-wider">Terapist</span>
                      <select value={activeTherapist?.id ?? ""} onChange={(event) => setActiveTherapistId(event.target.value)} className={inputCls}>
                        {therapistOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] text-(--color-text-muted) font-semibold uppercase tracking-wider">Danışan</span>
                      <select value={activeClient?.id ?? ""} onChange={(event) => setActiveClientId(event.target.value)} className={inputCls}>
                        {clientOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                      </select>
                    </label>
                  </div>

                  {/* CTA */}
                  <div className="space-y-1.5">
                    <button type="button" className={`${btnPrimary} w-full flex items-center justify-center gap-2`} onClick={resetSessionClock}>
                      <span>▶</span>
                      {gameElapsed > 0 ? "Yeni Seans Başlat" : "Seansı Başlat"}
                    </button>
                    <p className="text-[11px] text-(--color-text-muted) text-center leading-snug">
                      {gameElapsed > 0
                        ? "Süreyi sıfırlar ve yeni bir seans kaydı açar"
                        : `${activeClient?.displayName ?? "Danışan"} ile seans süresini başlatır`}
                    </p>
                  </div>
                </div>

                {/* Categories */}
                <div className="p-4 border-b border-(--color-line)">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-soft) block mb-3">Kategoriler</span>
                  <div className="flex flex-col gap-1">
                    {GAME_CATEGORIES.map((category) => {
                      const isActive = activeTab.category === category.key;
                      const CatIcon = CATEGORY_ICONS[category.key];
                      const catCount = GAME_TABS.filter((g) => g.category === category.key).length;
                      return (
                        <button key={category.key} type="button" aria-pressed={isActive} className={`flex items-center gap-3 px-2 py-2 rounded-xl w-full text-left cursor-pointer border transition-all ${isActive ? "border-(--color-primary)/15 bg-(--color-primary)/5" : "border-transparent hover:bg-(--color-surface-elevated)"}`} onClick={() => openCategory(category.key)}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-(--color-primary) text-white shadow-sm" : "bg-(--color-surface-elevated) text-(--color-text-muted)"}`}>
                            <CatIcon size={14} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={`text-sm font-semibold truncate leading-tight ${isActive ? "text-(--color-primary)" : "text-(--color-text-strong)"}`}>{category.title}</span>
                            <span className={`text-[11px] ${isActive ? "text-(--color-primary)/70" : "text-(--color-text-muted)"}`}>{catCount} oyun</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Games list */}
                <div className="p-4 border-b border-(--color-line)">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-soft) block mb-3">Oyunlar</span>
                  <div className="flex flex-col gap-1">
                    {visibleTabs.map((tab) => (
                      <button key={tab.key} type="button" aria-pressed={activeGame === tab.key} className={`flex flex-col px-3 py-2.5 rounded-xl cursor-pointer w-full text-left transition-all ${activeGame === tab.key ? "bg-(--color-primary)/8 shadow-[inset_3px_0_0_var(--color-primary)]" : "hover:bg-(--color-surface-elevated)"}`} onClick={() => setActiveGame(tab.key)}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${activeGame === tab.key ? "text-(--color-primary)" : "text-(--color-text-muted)"}`}>{tab.kicker}</span>
                        <span className={`text-sm font-semibold ${activeGame === tab.key ? "text-(--color-primary)" : "text-(--color-text-strong)"}`}>{tab.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score summary */}
                <div className="p-4 border-b border-(--color-line)">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-soft) block mb-3">Skor Özeti</span>
                  <div className="flex flex-col gap-2">
                    {scoreCards.map((card) => (
                      <div key={card.label} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="flex-1 text-(--color-text-soft) truncate">{card.label}</span>
                          <span className={`font-bold tabular-nums ${card.best > 0 ? "text-(--color-primary)" : "text-(--color-text-muted)"}`}>{card.best}</span>
                          <span className="text-(--color-text-muted) text-[10px] w-5 text-right">{card.plays}×</span>
                        </div>
                        <div className="h-1 rounded-full bg-(--color-surface-elevated) overflow-hidden">
                          <div className="h-full bg-(--color-primary) rounded-full transition-all" style={{ width: card.best > 0 ? `${Math.min(100, card.best)}%` : "0%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sessions */}
                {recentSessionFeed.length > 0 && (
                  <div className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-soft) block mb-3">Son Oturumlar</span>
                    <div className="flex flex-col gap-2">
                      {recentSessionFeed.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex justify-between bg-(--color-surface-elevated) rounded-xl px-3 py-2 text-xs border border-(--color-line)">
                          <div className="min-w-0">
                            <strong className="text-(--color-text-strong) block truncate">{session.gameLabel}</strong>
                            <p className="text-(--color-text-muted) m-0 truncate">{session.clientName}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <strong className="text-(--color-primary) block">{session.score}</strong>
                            <p className="text-(--color-text-muted) m-0">{formatPlayedAt(session.playedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              <section className="flex-1 overflow-y-auto bg-(--color-page-bg)">
              {(() => {
                const gameBtn = "flex items-center gap-2 bg-(--color-primary) text-white text-sm font-semibold px-6 py-3 rounded-2xl hover:bg-(--color-primary-hover) transition-colors cursor-pointer border-none shadow-(--shadow-primary)";
                const gameBtnSec = "flex items-center gap-2 bg-white/10 text-slate-200 text-sm font-medium px-6 py-3 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer border border-white/20";
                return (
              <div className="p-3 lg:p-5 max-w-4xl mx-auto flex flex-col gap-4">
                {activeGame === "memory" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(19,184,255,0.12)", boxShadow: "0 0 60px rgba(19,184,255,0.06)" }}>
                    <div className="absolute top-0 right-0 w-80 h-40 rounded-full pointer-events-none" style={{ background: "#13b8ff", opacity: 0.05, filter: "blur(60px)", transform: "translate(20%,-30%)" }} />
                    <div className="relative flex gap-6 pb-4 border-b border-white/10">
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Aktif seri</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{memoryState.score}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Faz</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{getPhaseLabel(memoryState.phase)}</strong></div>
                    </div>
                    <p className="relative text-(--color-text-soft) text-sm leading-relaxed m-0">{memoryState.message}</p>
                    <p className="relative text-(--color-text-muted) text-xs m-0">Kısayollar: <strong>A/B</strong> oyun değiştirir, yön tuşları hücre seçer, <strong>Enter</strong> ve <strong>Boşluk</strong> aksiyonu tetikler.</p>
                    <div className="relative grid grid-cols-3 gap-3">
                      {MEMORY_TILES.map((label, index) => {
                        const isActive = memoryState.flashIndex === index;
                        const isLocked = memoryState.phase === "showing";
                        const isCursor = memoryCursor === index;
                        const symbol = SYMBOL_LIBRARY.find((s) => s.label === label);
                        return (
                          <button key={label} type="button" className={`relative flex flex-col items-center justify-center gap-1.5 h-28 rounded-2xl border cursor-pointer transition-all duration-150 select-none overflow-hidden ${isActive ? "game-tile-active border-transparent" : "border-white/10 hover:border-white/20"} ${isCursor ? "game-tile-cursor" : ""}`} disabled={isLocked} onClick={() => handleMemoryPick(index)} style={!isActive ? { background: symbol?.background } as CSSProperties : undefined}>
                            {!isActive && <div className="absolute inset-0" style={symbol ? patternStyle(symbol) : undefined} />}
                            <span className="relative text-2xl" style={!isActive ? { color: symbol?.accent } : undefined}>{symbol?.icon ?? label[0]}</span>
                            <span className="relative text-xs font-medium text-white/70">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3 pt-2">
                      <button type="button" className={gameBtn} onClick={startMemoryGame}>Yeni Seri Başlat</button>
                      <button type="button" className={gameBtnSec} onClick={replayMemorySequence} disabled={memoryState.sequence.length === 0}>Sırayı Tekrar Göster</button>
                    </div>
                  </section>
                )}

                {activeGame === "pairs" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(93,211,255,0.12)", boxShadow: "0 0 60px rgba(93,211,255,0.06)" }}>
                    <div className="absolute top-0 left-0 w-72 h-48 rounded-full pointer-events-none" style={{ background: "#5dd3ff", opacity: 0.05, filter: "blur(60px)", transform: "translate(-20%,-30%)" }} />
                    <div className="relative flex gap-6 pb-4 border-b border-white/10">
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Eşleşen çift</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{pairsState.pairsFound}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Hamle</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{pairsState.moves}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Durum</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{getPhaseLabel(pairsState.phase)}</strong></div>
                    </div>
                    <p className="relative text-(--color-text-soft) text-sm leading-relaxed m-0">{pairsState.message}</p>
                    <p className="relative text-(--color-text-muted) text-xs m-0">On iki kartı 4x3 düzende gezebilirsin; seçili kart parlak çerçeveyle görünür.</p>
                    <div className="relative grid grid-cols-4 gap-2">
                      {pairsState.tiles.map((tile, index) => {
                        const isCursor = pairsCursor === index;
                        const isVisible = tile.revealed || tile.matched;
                        return (
                          <button key={tile.id} type="button" data-pairs-index={index} aria-label={isVisible ? `${tile.label} kartı` : `Kapalı kart ${index + 1}`} className={`relative flex flex-col items-center justify-center h-24 rounded-xl cursor-pointer transition-all overflow-hidden border ${tile.matched ? "game-tile-matched" : ""} ${isCursor ? "game-tile-cursor" : ""} ${isVisible ? "border-white/15 hover:border-white/25" : "border-white/6 hover:border-white/12"}`} onClick={() => handlePairsPick(index)} style={isVisible && !tile.matched ? { background: tile.background } : { background: "rgba(10,16,30,0.9)" }}>
                            <div className="absolute inset-0 rounded-xl" style={patternStyle(isVisible ? tile : { pattern: "grid" } as typeof tile)} />
                            <div className="relative flex flex-col items-center justify-center gap-1">
                              {isVisible ? (
                                <><span className="text-2xl" style={{ color: tile.accent }}>{tile.icon}</span><span className="text-xs font-medium text-white/60">{tile.label}</span></>
                              ) : (
                                <><span className="text-2xl text-white/15">?</span><span className="text-xs text-white/20">aç</span></>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" className={gameBtn} onClick={startPairsGame}>Yeni Deste Aç</button>
                    </div>
                  </section>
                )}

                {activeGame === "pulse" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(57,198,255,0.12)", boxShadow: "0 0 60px rgba(57,198,255,0.06)" }}>
                    <div className="absolute bottom-0 left-1/2 w-96 h-48 rounded-full pointer-events-none" style={{ background: "#39c6ff", opacity: 0.05, filter: "blur(80px)", transform: "translate(-50%,30%)" }} />
                    <div className="relative flex gap-6 pb-4 border-b border-white/10">
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Puan</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{pulseState.points}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Tur</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{pulseState.round}/{PULSE_TOTAL_ROUNDS}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Seri</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{pulseState.combo}</strong></div>
                    </div>
                    <p className="relative text-(--color-text-soft) text-sm leading-relaxed m-0">{pulseState.message}</p>
                    <p className="relative text-(--color-text-muted) text-xs m-0">Klavyede merkezden başla: yön tuşları seçimi taşır, <strong>Enter</strong> aktif kareyi oynatır.</p>
                    <div className="relative grid grid-cols-3 gap-3">
                      {PULSE_LABELS.map((label, index) => {
                        const isActive = pulseState.activeIndex === index && pulseState.phase === "playing";
                        const isCursor = pulseCursor === index;
                        return (
                          <button key={label} type="button" className={`h-24 rounded-xl border flex items-center justify-center text-sm cursor-pointer transition-all ${isActive ? "game-tile-active border-transparent" : "border-white/8 hover:border-white/16"} ${isCursor ? "game-tile-cursor" : ""}`} style={!isActive ? { background: "rgba(10,18,34,0.9)", color: "rgba(148,163,184,0.8)" } : undefined} onClick={() => handlePulsePick(index)}>
                            <span className="font-medium text-xs">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" className={gameBtn} onClick={startPulseGame}>Seti Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "route" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(74,207,255,0.12)", boxShadow: "0 0 60px rgba(74,207,255,0.06)" }}>
                    <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "#4acfff", opacity: 0.04, filter: "blur(60px)", transform: "translate(30%,-50%)" }} />
                    <div className="relative flex gap-6 pb-4 border-b border-white/10">
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Puan</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{routeState.score}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Tur</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{routeState.round}/{ROUTE_TOTAL_ROUNDS}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Seri</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{routeState.streak}</strong></div>
                    </div>
                    <p className="relative text-(--color-text-soft) text-sm leading-relaxed m-0">{routeState.message}</p>
                    <div className="relative flex items-center gap-6">
                      <div className="flex flex-col items-center rounded-2xl px-8 py-6 border" style={{ background: "rgba(10,18,34,0.9)", borderColor: "rgba(74,207,255,0.15)" }}>
                        <span className="text-(--color-text-muted) text-xs uppercase tracking-wider">Aktif komut</span>
                        <strong className="text-white text-lg mt-1">{routeCommandMeta?.label ?? "Hazır"}</strong>
                        <span className="text-white text-3xl mt-1" style={{ color: "#4acfff" }}>{routeCommandMeta?.icon ?? "•"}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {routeState.history.slice(-5).map((item, index) => {
                          const meta = ROUTE_COMMANDS.find((command) => command.key === item);
                          return <span key={`${item}-${index}`} className="text-(--color-text-muted) text-sm">{meta?.label ?? item}</span>;
                        })}
                      </div>
                    </div>
                    <div className="relative grid grid-cols-2 gap-3">
                      {ROUTE_COMMANDS.map((command, index) => {
                        const isCursor = routeCursor === index;
                        return (
                          <button key={command.key} type="button" className={`flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border cursor-pointer transition-all ${isCursor ? "game-tile-cursor border-transparent" : "border-white/8 hover:border-white/16"}`} style={{ background: "rgba(10,18,34,0.9)" }} onClick={() => handleRoutePick(command.key)}>
                            <span className="text-2xl" style={{ color: "#4acfff" }}>{command.icon}</span>
                            <span className="text-xs text-(--color-text-muted)">{command.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" className={gameBtn} onClick={startRouteGame}>Komutları Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "difference" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(105,212,255,0.12)", boxShadow: "0 0 60px rgba(105,212,255,0.06)" }}>
                    <div className="absolute top-0 left-1/2 w-96 h-48 rounded-full pointer-events-none" style={{ background: "#69d4ff", opacity: 0.05, filter: "blur(60px)", transform: "translate(-50%,-40%)" }} />
                    <div className="relative flex gap-6 pb-4 border-b border-white/10">
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Skor</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{differenceState.score}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Tur</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{differenceState.round}/{DIFFERENCE_TOTAL_ROUNDS}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Durum</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{getPhaseLabel(differenceState.phase)}</strong></div>
                    </div>
                    <p className="relative text-(--color-text-soft) text-sm leading-relaxed m-0">{differenceState.message}</p>
                    <p className="relative text-(--color-text-muted) text-xs m-0">Aynı dizilim klavyede de çalışır; seçili kart parlak kontur ile gösterilir.</p>
                    <div className="relative grid grid-cols-3 gap-3">
                      {differenceState.tiles.map((tile, index) => {
                        const reveal = differenceState.revealId === tile.id;
                        const isCursor = differenceCursor === index;
                        return (
                          <button key={tile.id} type="button" className={`relative flex flex-col items-center justify-center h-28 rounded-2xl border cursor-pointer overflow-hidden transition-all hover:border-white/20 ${reveal ? "game-tile-reveal" : "border-white/8"} ${isCursor ? "game-tile-cursor" : ""}`} onClick={() => handleDifferencePick(tile.id)} style={{ background: tile.background, transform: `rotate(${tile.rotation}deg)` } as CSSProperties}>
                            <div className="absolute inset-0" style={patternStyle(tile)} />
                            <div className="relative flex flex-col items-center justify-center gap-1.5">
                              <span className="text-2xl" style={{ color: tile.accent }}>{tile.icon}</span>
                              <span className="text-xs font-medium text-white/60">{tile.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" className={gameBtn} onClick={startDifferenceGame}>Turu Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "scan" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(139,226,255,0.12)", boxShadow: "0 0 60px rgba(139,226,255,0.06)" }}>
                    <div className="absolute bottom-0 right-0 w-80 h-64 rounded-full pointer-events-none" style={{ background: "#8be2ff", opacity: 0.04, filter: "blur(70px)", transform: "translate(20%,20%)" }} />
                    <div className="relative flex gap-6 pb-4 border-b border-white/10">
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Skor</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{scanState.score}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Tur</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{scanState.round}/{SCAN_TOTAL_ROUNDS}</strong></div>
                      <div><p className="text-(--color-text-muted) text-xs uppercase tracking-wider m-0 mb-0.5">Hedef</p><strong className="text-white text-3xl font-bold tabular-nums leading-none">{scanState.targetLabel || "Hazır"}</strong></div>
                    </div>
                    <p className="relative text-(--color-text-soft) text-sm leading-relaxed m-0">{scanState.message}</p>
                    <div className="relative rounded-xl px-6 py-3 flex items-center gap-4 border" style={{ background: "rgba(10,18,34,0.9)", borderColor: "rgba(139,226,255,0.15)" }}>
                      <span className="text-(--color-text-muted) text-xs uppercase tracking-wider">Bu simgeyi bul</span>
                      {scanState.targetLabel ? (() => {
                        const targetSymbol = SYMBOL_LIBRARY.find((s) => s.label === scanState.targetLabel);
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl" style={{ color: targetSymbol?.accent }}>{targetSymbol?.icon ?? "?"}</span>
                            <strong className="text-white">{scanState.targetLabel}</strong>
                          </div>
                        );
                      })() : <span className="text-(--color-text-muted) text-sm">Oyunu başlat</span>}
                    </div>
                    <div className="relative grid grid-cols-3 gap-3">
                      {scanState.tiles.map((tile, index) => {
                        const reveal = scanState.revealId === tile.id;
                        const isCursor = scanCursor === index;
                        return (
                          <button key={tile.id} type="button" className={`relative flex flex-col items-center justify-center h-28 rounded-2xl border cursor-pointer overflow-hidden transition-all hover:border-white/20 ${reveal ? "game-tile-reveal" : "border-white/8"} ${isCursor ? "game-tile-cursor" : ""}`} onClick={() => handleScanPick(tile.id)} style={{ background: tile.background, transform: `rotate(${tile.rotation}deg)` } as CSSProperties}>
                            <div className="absolute inset-0" style={patternStyle(tile)} />
                            <div className="relative flex flex-col items-center justify-center gap-1.5">
                              <span className="text-2xl" style={{ color: tile.accent }}>{tile.icon}</span>
                              <span className="text-xs font-medium text-white/60">{tile.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" className={gameBtn} onClick={startScanGame}>Taramayı Başlat</button>
                    </div>
                  </section>
                )}

                <details ref={gameDetailsRef} className="bg-(--color-surface-strong) rounded-3xl border border-(--color-line) overflow-hidden w-full">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none group">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-10 rounded-full bg-(--color-primary) shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-primary) block">{activeCategory.title}</span>
                        <h3 className="text-(--color-text-strong) font-semibold m-0">{activeTab.title}</h3>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-(--color-text-muted) text-xs font-medium"><ChevronDown size={14} /> Detaylar</span>
                  </summary>
                  <div className="px-5 pb-5 space-y-4">
                    <p className="text-(--color-text-soft) text-sm m-0">{activeTab.blurb}</p>
                    <div className="flex flex-wrap gap-2">
                      {activeTab.goals.map((goal) => <span key={goal} className="bg-(--color-primary-light) text-(--color-primary) text-xs font-medium px-2.5 py-1 rounded-full">{goal}</span>)}
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        {[{l: "En iyi", v: activeScoreCard.best}, {l: "Son", v: activeScoreCard.last}, {l: "Tekrar", v: activeScoreCard.plays}].map(({l, v}) => (
                          <div key={l} className="flex flex-col bg-(--color-primary)/5 border border-(--color-primary)/10 rounded-xl px-4 py-3 min-w-[80px]">
                            <span className="text-(--color-text-muted) text-xs mb-1">{l}</span>
                            <strong className="text-(--color-primary) text-xl font-bold tabular-nums">{v}</strong>
                          </div>
                        ))}
                      </div>
                      {activeRemoteScore.best > 0 && (
                        <span className="text-(--color-text-soft) text-sm">
                          Sunucu en iyi: <strong className="text-(--color-text-strong)">{activeRemoteScore.best}</strong>
                          {activeRemoteScore.lastPlayedAt ? ` · ${formatPlayedAt(activeRemoteScore.lastPlayedAt)}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </details>

              </div>
                );
              })()}
              </section>
            </div>
          </div>
        )}

        {/* ── Therapy Program ── */}
        {activeAppView === "therapy-program" && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-(--color-line)" style={{ background: "var(--color-chrome-section)" }}>
              <div>
                <h1 className="text-xl font-bold text-(--color-text-strong) m-0">Terapi Programı</h1>
                <p className="text-(--color-text-soft) text-sm mt-1 m-0">Kanıta dayalı ergoterapi alanlarına göre kişiselleştirilmiş aktivite önerileri, oyun eşlemeleri, haftalık plan üreticisi ve ilerleme takibi.</p>
              </div>
              {clientOptions.length > 0 && (
                <label className="flex flex-col gap-1 shrink-0 min-w-[180px]">
                  <span className="text-xs text-(--color-text-soft)">Danışan Seç</span>
                  <select value={tpSelectedClientId ?? ""} onChange={(e) => setTpSelectedClientId(e.target.value || null)} className={inputCls}>
                    <option value="">Danışan seçin...</option>
                    {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                  </select>
                </label>
              )}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 px-4 py-2 border-b border-(--color-line) overflow-x-auto" style={{ background: "var(--color-chrome-section)" }}>
              {([
                {key: "domains" as const, label: "Terapi Alanları", Icon: Stethoscope, disabled: false},
                {key: "activities" as const, label: "Aktiviteler", Icon: ClipboardList, disabled: !tpSelectedDomain},
                {key: "games" as const, label: "Oyun Eşleme", Icon: Gamepad2, disabled: !tpSelectedDomain},
                {key: "plan" as const, label: "Haftalık Plan", Icon: CalendarDays, disabled: !tpSelectedDomain},
                {key: "progress" as const, label: "İlerleme", Icon: TrendingUp, disabled: !tpSelectedClientId},
              ] as {key: "domains" | "activities" | "games" | "plan" | "progress"; label: string; Icon: LucideIcon; disabled: boolean}[]).map(({key, label, Icon, disabled}) => (
                <button key={key} type="button" className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors ${tpActiveTab === key ? "bg-(--color-primary) text-white" : "bg-transparent text-(--color-text-soft) hover:bg-(--color-surface-elevated) hover:text-(--color-text-body)"} disabled:opacity-40 disabled:cursor-not-allowed`} onClick={() => setTpActiveTab(key)} disabled={disabled}>
                  <Icon size={14} className="shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">

              {/* ── Domains Tab ── */}
              {tpActiveTab === "domains" && (
                <div>
                  <h2 className="text-lg font-bold text-(--color-text-strong) mb-1">Ergoterapi Uygulama Alanları</h2>
                  <p className="text-(--color-text-soft) text-sm mb-5">Danışanın ihtiyacına uygun terapi alanını seçin. Sistem, alan bazında hedefler, aktiviteler ve oyun önerileri üretecektir.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {THERAPY_DOMAINS.map((domain) => {
                      const gameMappingCount = GAME_THERAPY_MAPPINGS.filter((m) => m.suitableDomains.includes(domain.key)).length;
                      return (
                        <button key={domain.key} type="button" className={`flex flex-col gap-2 p-5 bg-(--color-surface-strong) rounded-2xl border text-left cursor-pointer transition-all hover:shadow-(--shadow-elevated) ${tpSelectedDomain === domain.key ? "border-(--color-primary) shadow-(--shadow-elevated)" : "border-(--color-line)"}`} onClick={() => handleSelectDomain(domain.key)}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${domain.color}20` }}>
                            <DomainIcon iconKey={domain.icon} size={20} color={domain.color} />
                          </div>
                          <strong className="text-(--color-text-strong) text-sm">{domain.label}</strong>
                          <p className="text-(--color-text-soft) text-xs leading-relaxed m-0">{domain.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-(--color-text-muted)">
                            <span className="flex items-center gap-1"><Target size={11} />{domain.goals.length} hedef</span>
                            <span className="flex items-center gap-1"><ClipboardList size={11} />{domain.activities.length} aktivite</span>
                            <span className="flex items-center gap-1"><Gamepad2 size={11} />{gameMappingCount} oyun</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {domain.suitableAgeGroups.map((ag) => <span key={ag} className="text-[10px] px-2 py-0.5 rounded-full border border-(--color-line) text-(--color-text-muted)">{ag}</span>)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Activities Tab ── */}
              {tpActiveTab === "activities" && tpSelectedDomain && (() => {
                const domain = THERAPY_DOMAINS.find((d) => d.key === tpSelectedDomain);
                if (!domain) return null;
                const subSkillNames = Array.from(new Set(domain.activities.map((a) => a.subSkill)));
                let filteredActivities = domain.activities;
                if (tpDifficultyFilter !== "all") filteredActivities = filteredActivities.filter((a) => a.difficulty === tpDifficultyFilter);
                if (tpSubSkillFilter !== "all") filteredActivities = filteredActivities.filter((a) => a.subSkill === tpSubSkillFilter);
                if (tpShowHomeOnly) filteredActivities = filteredActivities.filter((a) => a.homeExercise);
                if (tpActivitySearch.trim()) {
                  const q = tpActivitySearch.toLocaleLowerCase("tr-TR");
                  filteredActivities = filteredActivities.filter((a) => a.label.toLocaleLowerCase("tr-TR").includes(q) || a.description.toLocaleLowerCase("tr-TR").includes(q) || a.subSkill.toLocaleLowerCase("tr-TR").includes(q));
                }
                const favoriteActivities = domain.activities.filter((a) => tpFavoriteActivities.includes(a.id));
                const diffColor = (d: string) => d === "kolay" ? "bg-emerald-500/10 text-emerald-400" : d === "orta" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400";

                return (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white mb-2" style={{ background: domain.color }}><DomainIcon iconKey={domain.icon} size={12} />{domain.label}</span>
                        <h2 className="text-lg font-bold text-(--color-text-strong) m-0">Terapi Hedefleri ve Aktiviteler</h2>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" className={`${btnSecondary} flex items-center gap-1.5`} onClick={() => setTpActiveTab("games")}><Gamepad2 size={14} />Oyun Eşleme</button>
                        <button type="button" className={`${btnPrimary} flex items-center gap-1.5`} onClick={handleGeneratePlan}><CalendarDays size={14} />Plan Üret →</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[{v: domain.goals.length, l: "Hedef"}, {v: domain.activities.length, l: "Aktivite"}, {v: domain.subSkills.length, l: "Beceri Alanı"}, {v: favoriteActivities.length, l: "Favori"}].map(({v, l}) => (
                        <div key={l} className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) p-3 text-center">
                          <span className="text-2xl font-bold text-(--color-primary) block">{v}</span>
                          <span className="text-(--color-text-muted) text-xs">{l}</span>
                        </div>
                      ))}
                    </div>

                    <details open className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) overflow-hidden">
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none font-medium text-sm text-(--color-text-strong)">
                        <span className="flex items-center gap-1.5"><Target size={14} />Terapi Hedefleri</span>
                        <span className="bg-(--color-surface-elevated) text-(--color-text-muted) text-xs px-2 py-0.5 rounded-full">{domain.goals.length}</span>
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 pt-0">
                        {domain.goals.map((goal) => (
                          <div key={goal.id} className="bg-(--color-surface-elevated) rounded-xl p-3">
                            <strong className="text-(--color-text-strong) text-sm">{goal.label}</strong>
                            <p className="text-(--color-text-soft) text-xs mt-1 m-0">{goal.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    <details open className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) overflow-hidden">
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none font-medium text-sm text-(--color-text-strong)">
                        <span>⚠️ Fonksiyonel Zorluklar</span>
                        <span className="bg-(--color-surface-elevated) text-(--color-text-muted) text-xs px-2 py-0.5 rounded-full">{domain.challenges.length}</span>
                      </summary>
                      <div className="flex flex-wrap gap-2 p-4 pt-0">
                        {domain.challenges.map((ch) => <span key={ch.id} className="bg-(--color-primary-light) text-(--color-primary) text-xs px-2.5 py-1 rounded-full">{ch.label}</span>)}
                      </div>
                    </details>

                    <details open className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) overflow-hidden">
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none font-medium text-sm text-(--color-text-strong)">
                        <span>🧩 Alt Beceriler</span>
                        <span className="bg-(--color-surface-elevated) text-(--color-text-muted) text-xs px-2 py-0.5 rounded-full">{domain.subSkills.length}</span>
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 pt-0">
                        {domain.subSkills.map((skill) => (
                          <div key={skill.id} className="bg-(--color-surface-elevated) rounded-xl p-3">
                            <strong className="text-(--color-text-strong) text-sm">{skill.label}</strong>
                            <p className="text-(--color-text-soft) text-xs mt-1 m-0">{skill.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    {favoriteActivities.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-(--color-text-strong) mb-2">⭐ Favori Aktiviteler</h3>
                        <div className="flex flex-wrap gap-2">
                          {favoriteActivities.map((act) => (
                            <div key={act.id} className="flex items-center gap-2 bg-(--color-surface-strong) border border-(--color-line) rounded-full px-3 py-1.5">
                              <span className="text-xs text-(--color-text-body)">{act.label}</span>
                              <span className={`w-2 h-2 rounded-full ${act.difficulty === "kolay" ? "bg-emerald-500" : act.difficulty === "orta" ? "bg-amber-500" : "bg-red-500"}`} />
                              <button type="button" className="text-(--color-text-muted) hover:text-(--color-accent-red) bg-transparent border-none cursor-pointer text-xs" onClick={() => toggleFavoriteActivity(act.id)} title="Favoriden çıkar">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-(--color-text-strong) mb-3">Aktivite Önerileri</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <input type="search" placeholder="Aktivite ara..." value={tpActivitySearch} onChange={(e) => setTpActivitySearch(e.target.value)} className={`${inputCls} max-w-xs`} />
                        {(["all", "kolay", "orta", "zor"] as const).map((level) => (
                          <button key={level} type="button" className={`px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer ${tpDifficultyFilter === level ? "bg-(--color-primary) text-white" : "bg-(--color-surface-elevated) text-(--color-text-body) hover:bg-(--color-surface)"}`} onClick={() => setTpDifficultyFilter(level)}>
                            {level === "all" ? "Tümü" : level === "kolay" ? "Kolay" : level === "orta" ? "Orta" : "Zor"}
                          </button>
                        ))}
                        <select value={tpSubSkillFilter} onChange={(e) => setTpSubSkillFilter(e.target.value)} className={`${inputCls} max-w-[180px]`}>
                          <option value="all">Tüm beceriler</option>
                          {subSkillNames.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-(--color-text-body) cursor-pointer">
                          <input type="checkbox" checked={tpShowHomeOnly} onChange={(e) => setTpShowHomeOnly(e.target.checked)} />
                          <span className="flex items-center gap-1"><Home size={13} />Ev ödevi</span>
                        </label>
                      </div>

                      {filteredActivities.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-(--color-text-muted)">
                          <Search size={40} strokeWidth={1.5} />
                          <p className="text-sm">Seçili filtrelere uygun aktivite bulunamadı.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filteredActivities.map((activity) => {
                            const isFav = tpFavoriteActivities.includes(activity.id);
                            const isExpanded = tpExpandedActivity === activity.id;
                            const customNote = tpCustomNotes[activity.id] ?? "";
                            return (
                              <div key={activity.id} className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) p-4 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-2">
                                  <strong className="text-(--color-text-strong) text-sm">{activity.label}</strong>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button type="button" className={`text-lg bg-transparent border-none cursor-pointer ${isFav ? "text-amber-400" : "text-slate-300 hover:text-amber-400"}`} onClick={() => toggleFavoriteActivity(activity.id)} title={isFav ? "Favoriden çıkar" : "Favorilere ekle"}>
                                      {isFav ? "★" : "☆"}
                                    </button>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diffColor(activity.difficulty)}`}>
                                      {activity.difficulty === "kolay" ? "Kolay" : activity.difficulty === "orta" ? "Orta" : "Zor"}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-(--color-text-soft) text-xs leading-relaxed m-0">{activity.description}</p>
                                <div className="flex flex-wrap gap-2 text-[10px] text-(--color-text-muted)">
                                  <span className="flex items-center gap-1"><Layers size={10} />{activity.subSkill}</span>
                                  <span className="flex items-center gap-1"><Tag size={10} />{activity.activityType}</span>
                                  <span className="flex items-center gap-1"><Clock size={10} />{activity.sessionMinutes} dk</span>
                                  {activity.homeExercise && <span className="flex items-center gap-1"><Home size={10} />Ev ödevi</span>}
                                </div>
                                <button type="button" className="text-(--color-primary) text-xs hover:underline bg-transparent border-none cursor-pointer text-left" onClick={() => setTpExpandedActivity(isExpanded ? null : activity.id)}>
                                  {isExpanded ? "Kapat ▴" : "Detaylar ▾"}
                                </button>
                                {isExpanded && (
                                  <div className="space-y-3 pt-2 border-t border-(--color-line)">
                                    {activity.materials.length > 0 && (
                                      <div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted) block mb-1">Materyaller:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {activity.materials.map((m) => <span key={m} className="bg-(--color-surface-elevated) text-(--color-text-soft) text-xs px-2 py-0.5 rounded-full">{m}</span>)}
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted) block mb-1">İlgili Hedefler:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {activity.goals.map((gId) => {
                                          const goal = domain.goals.find((g) => g.id === gId);
                                          return goal ? <span key={gId} className="bg-(--color-primary-light) text-(--color-primary) text-xs px-2 py-0.5 rounded-full">{goal.label}</span> : null;
                                        })}
                                      </div>
                                    </div>
                                    {activity.evidenceBase && (
                                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500 mb-1"><FlaskConical size={11} />Kanıt Temeli:</span>
                                        <p className="text-xs text-(--color-text-soft) m-0 leading-relaxed">{activity.evidenceBase}</p>
                                      </div>
                                    )}
                                    {activity.therapistTips && activity.therapistTips.length > 0 && (
                                      <div className="bg-(--color-primary)/5 border border-(--color-primary)/20 rounded-lg p-3">
                                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-(--color-primary) mb-2"><Lightbulb size={11} />Terapist İpuçları:</span>
                                        <ul className="space-y-1 m-0 pl-0 list-none">
                                          {activity.therapistTips.map((tip, ti) => (
                                            <li key={ti} className="text-xs text-(--color-text-soft) flex gap-1.5"><span className="text-(--color-primary) shrink-0">·</span>{tip}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted) block mb-1">Terapist Notu:</span>
                                      <textarea value={customNote} onChange={(e) => saveTpCustomNote(activity.id, e.target.value)} placeholder="Bu aktivite için notlarınızı yazın..." className={`${inputCls} resize-none`} rows={2} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
                const diffColor = (d: string) => d === "kolay" ? "bg-emerald-500/10 text-emerald-400" : d === "orta" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400";
                const gameIcon = (key: string) => { const Icon = GAME_ICON_MAP[key] ?? Gamepad2; return <Icon size={20} />; };
                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white mb-2" style={{ background: domain.color }}><DomainIcon iconKey={domain.icon} size={12} />{domain.label}</span>
                      <h2 className="text-lg font-bold text-(--color-text-strong) m-0">Dijital Oyun Rehberi</h2>
                      <p className="text-(--color-text-soft) text-sm mt-1">Her oyunun kanıt temeli, önerilen seans dozu ve seansta kullanım rehberi. Ergoterapist olarak doğru oyunu doğru danışana eşleştirin.</p>
                    </div>

                    {/* Game cards */}
                    <div className="space-y-4">
                      {gameMappings.map((mapping) => {
                        const gameTab = GAME_TABS.find((g) => g.key === mapping.gameKey);
                        if (!gameTab) return null;
                        return (
                          <div key={mapping.gameKey} className="bg-(--color-surface-strong) rounded-2xl border border-(--color-line) overflow-hidden">
                            {/* Card header */}
                            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-(--color-line)">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-(--color-primary)/10 flex items-center justify-center text-(--color-primary) shrink-0">{gameIcon(mapping.gameKey)}</div>
                                <div>
                                  <strong className="text-(--color-text-strong) text-[15px] font-bold block leading-tight">{gameTab.title}</strong>
                                  <span className="text-(--color-text-muted) text-[12px] mt-0.5 block">{gameTab.kicker}</span>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {mapping.purposes.map((p) => (
                                      <span key={p} className="bg-(--color-primary-light) text-(--color-primary) text-[11px] font-semibold px-2 py-0.5 rounded-md">{GAME_PURPOSE_LABELS[p]}</span>
                                    ))}
                                    {mapping.difficultyFit.map((d) => (
                                      <span key={d} className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${diffColor(d)}`}>{d === "kolay" ? "Kolay" : d === "orta" ? "Orta" : "Zor"}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <button type="button" className={`${btnPrimary} shrink-0`} onClick={() => openGameView(mapping.gameKey)}>▶ Oyna</button>
                            </div>

                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                              {/* Left column */}
                              <div className="space-y-5">
                                {/* Therapeutic rationale */}
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-(--color-text-muted) mb-2">Terapötik Etki</p>
                                  <p className="text-[13px] text-(--color-text-body) leading-relaxed m-0">{mapping.therapeuticRationale}</p>
                                </div>

                                {/* Seansta nasıl kullanılır */}
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-(--color-text-muted) mb-2">Seansta Kullanım</p>
                                  <p className="text-[13px] text-(--color-text-soft) leading-relaxed m-0">{mapping.howToUseInSession}</p>
                                </div>

                                {/* Research basis */}
                                <div className="rounded-xl border border-amber-400/30 p-3.5" style={{ background: "color-mix(in srgb, #f59e0b 8%, transparent)" }}>
                                  <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-2"><BookOpen size={12} />Bilimsel Referans</p>
                                  <p className="text-[12px] text-(--color-text-soft) m-0 leading-relaxed">{mapping.researchBasis}</p>
                                </div>
                              </div>

                              {/* Right column */}
                              <div className="space-y-5">
                                {/* Dosage */}
                                <div className="rounded-xl border border-(--color-primary)/25 bg-(--color-primary)/5 p-4">
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-(--color-primary) mb-3">Önerilen Doz</p>
                                  <div className="flex gap-4 mb-3">
                                    <div className="flex-1 text-center bg-(--color-surface-strong) rounded-xl py-3">
                                      <div className="text-[28px] font-bold text-(--color-text-strong) leading-none">{mapping.sessionDosage.minutesPerSession}</div>
                                      <div className="text-[11px] text-(--color-text-muted) mt-1">dk / seans</div>
                                    </div>
                                    <div className="flex-1 text-center bg-(--color-surface-strong) rounded-xl py-3">
                                      <div className="text-[28px] font-bold text-(--color-text-strong) leading-none">{mapping.sessionDosage.sessionsPerWeek}<span className="text-[16px]">×</span></div>
                                      <div className="text-[11px] text-(--color-text-muted) mt-1">hafta / seans</div>
                                    </div>
                                  </div>
                                  <p className="text-[11px] font-semibold text-(--color-primary) mb-1">İlerleme Rehberi</p>
                                  <p className="text-[12px] text-(--color-text-soft) m-0 leading-relaxed">{mapping.sessionDosage.progressionNote}</p>
                                </div>

                                {/* Outcome indicators */}
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-(--color-text-muted) mb-2">Ölçüm Göstergeleri</p>
                                  <ul className="space-y-1.5 m-0 pl-0 list-none">
                                    {mapping.outcomeIndicators.map((oi, i) => (
                                      <li key={i} className="text-[13px] text-(--color-text-soft) flex gap-2 items-start leading-snug">
                                        <span className="w-1.5 h-1.5 rounded-full bg-(--color-primary)/50 shrink-0 mt-1.5" />{oi}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick reference table */}
                    <details open className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) overflow-hidden">
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none font-medium text-sm text-(--color-text-strong)">
                        <span className="flex items-center gap-1.5"><BarChart3 size={14} />Tüm Oyun–Amaç Eşleme Tablosu (Hızlı Referans)</span>
                      </summary>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-(--color-surface-elevated)">
                            <tr>
                              <th className="text-left px-4 py-2 font-semibold text-(--color-text-strong)">Oyun</th>
                              <th className="text-left px-4 py-2 font-semibold text-(--color-text-strong)">Terapötik Amaçlar</th>
                              <th className="text-left px-4 py-2 font-semibold text-(--color-text-strong)">Süre</th>
                              <th className="text-left px-4 py-2 font-semibold text-(--color-text-strong)">Sıklık</th>
                              <th className="text-left px-4 py-2 font-semibold text-(--color-text-strong)">Zorluk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {GAME_THERAPY_MAPPINGS.map((m) => {
                              const gt = GAME_TABS.find((g) => g.key === m.gameKey);
                              const inDomain = m.suitableDomains.includes(tpSelectedDomain!);
                              return (
                                <tr key={m.gameKey} className={`border-t border-(--color-line) ${inDomain ? "" : "opacity-40"}`}>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-1.5">
                                      {inDomain && <span className="w-1.5 h-1.5 rounded-full bg-(--color-primary) shrink-0" />}
                                      <strong className="text-(--color-text-strong)">{gt?.title ?? m.gameKey}</strong>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-(--color-text-soft)">{m.purposes.map((p) => GAME_PURPOSE_LABELS[p]).join(", ")}</td>
                                  <td className="px-4 py-2 text-(--color-text-soft)">{m.sessionDosage.minutesPerSession} dk</td>
                                  <td className="px-4 py-2 text-(--color-text-soft)">{m.sessionDosage.sessionsPerWeek}x / hafta</td>
                                  <td className="px-4 py-2 text-(--color-text-soft)">{m.difficultyFit.map((d) => d === "kolay" ? "Kolay" : d === "orta" ? "Orta" : "Zor").join(", ")}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <p className="text-[10px] text-(--color-text-muted) px-4 py-2">· Mavi nokta: seçili terapi alanıyla uyumlu oyunlar</p>
                      </div>
                    </details>
                  </div>
                );
              })()}

              {/* ── Weekly Plan Tab ── */}
              {tpActiveTab === "plan" && tpSelectedDomain && (() => {
                const domain = THERAPY_DOMAINS.find((d) => d.key === tpSelectedDomain);
                if (!domain) return null;
                const ALL_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
                const dayShort: Record<string, string> = { Pazartesi: "Pzt", Salı: "Sal", Çarşamba: "Çar", Perşembe: "Per", Cuma: "Cum", Cumartesi: "Cmt", Pazar: "Paz" };
                return (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white mb-2" style={{ background: domain.color }}><DomainIcon iconKey={domain.icon} size={12} />{domain.label}</span>
                        <h2 className="text-lg font-bold text-(--color-text-strong) m-0">Haftalık Terapi Planı</h2>
                      </div>
                    </div>

                    {/* Day selector */}
                    <div className="bg-(--color-surface-strong) rounded-2xl border border-(--color-line) p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-(--color-text-strong)">Seans günlerini seçin</span>
                        <span className="text-[10px] text-(--color-text-muted)">{tpSelectedDays.length} gün seçili</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {ALL_DAYS.map((day) => {
                          const isSelected = tpSelectedDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => togglePlanDay(day)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-(--color-primary) text-white border-transparent"
                                  : "bg-transparent text-(--color-text-muted) border-(--color-line) hover:border-(--color-primary)/50"
                              }`}
                            >
                              {dayShort[day]}
                            </button>
                          );
                        })}
                      </div>
                      {tpSelectedDays.length === 0 && (
                        <p className="text-xs text-amber-500 mt-2">En az 1 gün seçin.</p>
                      )}
                      <div className="mt-3">
                        <button
                          type="button"
                          className={`${btnPrimary} flex items-center gap-1.5`}
                          onClick={handleGeneratePlan}
                          disabled={tpSelectedDays.length === 0}
                        >
                          {tpGeneratedPlan ? <><RefreshCw size={14} />Planı Güncelle</> : <><CalendarDays size={14} />Plan Oluştur</>}
                        </button>
                      </div>
                    </div>

                    {!tpGeneratedPlan ? (
                      <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <ClipboardList size={48} strokeWidth={1.5} className="text-(--color-text-muted)" />
                        <h3 className="text-(--color-text-strong) font-semibold m-0">Henüz plan oluşturulmadı</h3>
                        <p className="text-(--color-text-soft) text-sm m-0">Günleri seçip "Plan Oluştur" butonuna tıklayın.</p>
                        <p className="text-(--color-text-muted) text-xs m-0">Sistem, seçtiğiniz gün sayısına göre aktivite ve dijital oyun planı oluşturacaktır.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            {label: <span className="flex items-center gap-1"><Target size={11} />Ana Hedef</span>, content: <strong className="text-(--color-text-strong) text-sm">{tpGeneratedPlan.weeklyPlan.mainGoal}</strong>},
                            {label: <span className="flex items-center gap-1"><ClipboardList size={11} />Anahtar Aktiviteler</span>, content: <ul className="list-disc pl-4 text-(--color-text-soft) text-xs space-y-1 m-0">{tpGeneratedPlan.weeklyPlan.keyActivities.map((a, i) => <li key={i}>{a}</li>)}</ul>},
                            {label: <span className="flex items-center gap-1"><Gamepad2 size={11} />Dijital Oyunlar</span>, content: <div className="flex flex-wrap gap-1">{tpGeneratedPlan.weeklyPlan.digitalGames.map((gk) => { const gt = GAME_TABS.find((g) => g.key === gk); return <span key={gk} className="bg-(--color-primary-light) text-(--color-primary) text-xs px-2 py-0.5 rounded-full">{gt?.title ?? gk}</span>; })}</div>},
                            {label: <span className="flex items-center gap-1"><Home size={11} />Ev Ödevi</span>, content: <strong className="text-(--color-text-strong) text-sm">{tpGeneratedPlan.weeklyPlan.homeExercise}</strong>},
                          ].map(({label, content}) => (
                            <div key={label} className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) p-4 flex flex-col gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">{label}</span>
                              {content}
                            </div>
                          ))}
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-(--color-text-strong) mb-3">Günlük Yapı — {tpGeneratedPlan.dailyStructure.length} Seans</h3>
                          <div className={`grid gap-4 ${tpGeneratedPlan.dailyStructure.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : tpGeneratedPlan.dailyStructure.length <= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                            {tpGeneratedPlan.dailyStructure.map((day, i) => {
                              const gameTab = GAME_TABS.find((g) => g.key === day.game);
                              return (
                                <div key={i} className="bg-(--color-surface-strong) rounded-2xl border border-(--color-line) overflow-hidden">
                                  <div className="flex items-center gap-2 px-4 py-3 bg-(--color-primary)/5 border-b border-(--color-line)">
                                    <span className="w-6 h-6 rounded-full bg-(--color-primary) text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                    <span className="text-(--color-text-strong) text-sm font-medium">{day.dayLabel}</span>
                                  </div>
                                  <div className="p-4 flex flex-col gap-3">
                                    {[{l: "Aktivite", v: <span className="text-xs text-(--color-text-body)">{day.activity}</span>}, {l: "Dijital Oyun", v: <button type="button" className="text-(--color-primary) text-xs hover:underline bg-transparent border-none cursor-pointer text-left" onClick={() => openGameView(day.game)}>▶ {gameTab?.title ?? day.game}</button>}, {l: "Gözlem", v: <span className="text-xs text-(--color-text-soft)">{day.observation}</span>}].map(({l, v}) => (
                                      <div key={l}>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted) block mb-0.5">{l}</span>
                                        {v}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <p className="text-(--color-text-muted) text-xs italic">Not: {tpGeneratedPlan.weeklyPlan.sessionNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Progress Tab ── */}
              {tpActiveTab === "progress" && (() => {
                const selectedProgressClient = clientOptions.find((c) => c.id === tpSelectedClientId) ?? null;
                if (!selectedProgressClient) return (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <BarChart3 size={48} strokeWidth={1.5} className="text-(--color-text-muted)" />
                    <h3 className="text-(--color-text-strong) font-semibold m-0">Danışan seçilmedi</h3>
                    <p className="text-(--color-text-soft) text-sm m-0">İlerleme takibi için üst kısımdan bir danışan seçin.</p>
                  </div>
                );
                const domain = tpSelectedDomain ? THERAPY_DOMAINS.find((d) => d.key === tpSelectedDomain) : null;
                const clientProgress = tpProgressEntries.filter((e) => e.clientId === selectedProgressClient.id).sort((a, b) => b.date.localeCompare(a.date));
                const goals = domain?.goals ?? [];

                const goalAverages = goals.map((goal) => {
                  const entries = clientProgress.filter((e) => e.goalId === goal.id);
                  const avg = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.value, 0) / entries.length) : 0;
                  return { ...goal, average: avg, count: entries.length };
                });

                const overallAvg = goalAverages.length > 0 ? Math.round(goalAverages.reduce((s, g) => s + g.average, 0) / goalAverages.length) : 0;

                return (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-(--color-text-strong) m-0">İlerleme Takibi</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-(--color-text-strong) font-medium text-sm">{selectedProgressClient.displayName}</span>
                          {domain && <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: domain.color }}>{domain.icon} {domain.label}</span>}
                        </div>
                      </div>
                      <button type="button" className={btnPrimary} onClick={() => setTpShowProgressForm(!tpShowProgressForm)}>+ Kayıt Ekle</button>
                    </div>

                    <div className="flex items-center gap-6 bg-(--color-surface-strong) rounded-2xl border border-(--color-line) p-5">
                      <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#progressGrad)" strokeWidth="3" strokeDasharray={`${overallAvg}, 100`} strokeLinecap="round" />
                          <defs><linearGradient id="progressGrad"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-(--color-text-strong)">{overallAvg}%</span>
                      </div>
                      <div>
                        <strong className="text-(--color-text-strong) block">Genel İlerleme</strong>
                        <span className="text-(--color-text-muted) text-sm">{clientProgress.length} kayıt · {goalAverages.filter((g) => g.count > 0).length}/{goals.length} hedef takipte</span>
                      </div>
                    </div>

                    {tpShowProgressForm && domain && (
                      <div className="bg-(--color-surface-strong) rounded-2xl border border-(--color-line) p-5">
                        <h4 className="text-(--color-text-strong) font-semibold mb-4">Yeni İlerleme Kaydı</h4>
                        <div className="flex flex-col gap-4">
                          <label className="flex flex-col gap-1">
                            <span className="text-xs text-(--color-text-soft)">Hedef</span>
                            <select value={tpProgressForm.goalId} onChange={(e) => setTpProgressForm((c) => ({ ...c, goalId: e.target.value }))} className={inputCls}>
                              <option value="">Hedef seçin...</option>
                              {goals.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs text-(--color-text-soft)">Değer: <strong>{tpProgressForm.value}%</strong></span>
                            <input type="range" min={0} max={100} step={5} value={tpProgressForm.value} onChange={(e) => setTpProgressForm((c) => ({ ...c, value: Number(e.target.value) }))} className="w-full" />
                            <div className="flex justify-between text-xs text-(--color-text-muted)">
                              {INDEPENDENCE_LEVELS.map((lvl) => <span key={lvl.key}>{lvl.label}</span>)}
                            </div>
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs text-(--color-text-soft)">Not</span>
                            <textarea value={tpProgressForm.note} onChange={(e) => setTpProgressForm((c) => ({ ...c, note: e.target.value }))} placeholder="Gözlem veya değerlendirme notu..." className={`${inputCls} resize-none`} rows={3} />
                          </label>
                          <div className="flex gap-2">
                            <button type="button" className={btnPrimary} onClick={handleAddProgressEntry}>Kaydet</button>
                            <button type="button" className={btnSecondary} onClick={() => setTpShowProgressForm(false)}>İptal</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {goalAverages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-(--color-text-strong) mb-3">Hedef Bazlı İlerleme</h3>
                        <div className="space-y-3">
                          {goalAverages.map((ga) => (
                            <div key={ga.id} className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-(--color-text-body) text-sm">{ga.label}</span>
                                <span className="font-bold text-(--color-text-strong) text-sm">{ga.average}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                                <div className="h-full rounded-full bg-(--color-primary) transition-all" style={{ width: `${ga.average}%` }} />
                              </div>
                              <span className="text-(--color-text-muted) text-xs mt-1 block">{ga.count} kayıt</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-(--color-text-strong) mb-3">İlerleme Geçmişi</h3>
                      {clientProgress.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-(--color-text-muted)">
                          <span className="text-3xl">📝</span>
                          <p className="text-sm">Henüz ilerleme kaydı eklenmedi. Yukarıdaki "Kayıt Ekle" butonunu kullanın.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {clientProgress.map((entry) => {
                            const goal = goals.find((g) => g.id === entry.goalId);
                            return (
                              <div key={entry.id} className="bg-(--color-surface-strong) rounded-xl border border-(--color-line) p-4">
                                <div className="flex items-center justify-between mb-1">
                                  <strong className="text-(--color-text-strong) text-sm">{goal?.label ?? entry.goalId}</strong>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 rounded-full bg-white/8 overflow-hidden">
                                      <div className="h-full rounded-full bg-(--color-primary)" style={{ width: `${entry.value}%` }} />
                                    </div>
                                    <span className="text-(--color-text-strong) text-sm font-bold">{entry.value}%</span>
                                  </div>
                                </div>
                                <span className="text-(--color-text-muted) text-xs">{formatDate(entry.date)}</span>
                                {entry.note && <p className="text-(--color-text-soft) text-xs mt-1 m-0">{entry.note}</p>}
                                <button type="button" className="text-(--color-accent-red) text-xs hover:underline bg-transparent border-none cursor-pointer mt-1" onClick={() => handleDeleteProgressEntry(entry.id)}>Sil</button>
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

      {/* ── Mobile bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-(--color-line)" style={{ background: "var(--color-chrome-nav)", backdropFilter: "blur(20px)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch h-16">
          {([
            { view: "dashboard" as AppView, Icon: LayoutDashboard, label: "Panel" },
            { view: "clients" as AppView, Icon: Users, label: "Danışanlar" },
            { view: "games" as AppView, Icon: Gamepad2, label: "Oyunlar" },
            { view: "therapy-program" as AppView, Icon: Stethoscope, label: "Terapi" },
          ]).map(({ view, Icon, label }) => {
            const isActive = activeAppView === view || (view === "clients" && activeAppView === "client-detail");
            return (
              <button
                key={view}
                type="button"
                className={`flex-1 flex flex-col items-center justify-center gap-1 border-none cursor-pointer transition-colors ${isActive ? "text-(--color-primary)" : "text-(--color-text-muted) hover:text-(--color-text-soft)"}`}
                style={{ background: "transparent" }}
                onClick={() => setActiveAppView(view)}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-(--color-primary)/15" : ""}`}>
                  <Icon size={18} />
                </div>
                <span className={`text-[10px] font-medium leading-none ${isActive ? "text-(--color-primary)" : ""}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

