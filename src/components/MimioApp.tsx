"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  LayoutDashboard, Users, Gamepad2, Stethoscope, UserPlus, Brain, Hand, Eye, LogOut, Clock, ChevronDown, RotateCcw, Sun, Moon,
  Baby, Zap, Puzzle, PersonStanding, Briefcase, Handshake,
  Target, ClipboardList, Home, Tag, FlaskConical, Lightbulb, BookOpen, BarChart3, Search, RefreshCw, Map, CalendarDays, TrendingUp, Grid3X3,
  Bell, FileText, Award, Activity, ChevronRight, Star, Flame, Trophy, ArrowUpRight, ArrowDownRight,
  Plus, Check, Archive, Edit2, Timer, X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
  EMPTY_PLATFORM_OVERVIEW,
  GAME_LABELS,
  type AppView,
  type ClientGoal,
  type ClientProfile,
  type DatabaseStatus,
  type DayKey,
  type NoteMode,
  type PlatformGameKey,
  type PlatformOverviewPayload,
  type RecentSessionEntry,
  type SessionNote,
  type SoapNoteContent,
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

// ── Confetti helper ──
const CONFETTI_COLORS = ["#13b8ff","#8b5cf6","#ec4899","#f59e0b","#10b981","#f97316","#06b6d4","#a855f7"];
const CONFETTI_SEEDS = Array.from({ length: 24 }, (_, i) => ({
  id: `cp-${i}`,
  left: 5 + (i / 24) * 90,
  delay: (i * 0.18) % 1.8,
  duration: 1.4 + (i % 5) * 0.3,
  wide: i % 2 === 0,
}));
function ConfettiPieces({ count = 18, accent }: Readonly<{ count?: number; accent: string }>) {
  return (
    <>
      {CONFETTI_SEEDS.slice(0, count).map((seed) => {
        const color = seed.id.charCodeAt(3) % 3 === 0 ? accent : CONFETTI_COLORS[seed.id.charCodeAt(3) % CONFETTI_COLORS.length];
        return (
          <div
            key={seed.id}
            className="confetti-piece pointer-events-none"
            style={{
              left: `${seed.left}%`,
              top: 0,
              background: color,
              animationDelay: `${seed.delay}s`,
              animationDuration: `${seed.duration}s`,
              width: seed.wide ? "5px" : "7px",
              height: seed.wide ? "12px" : "7px",
              borderRadius: seed.wide ? "2px" : "50%",
              opacity: 0,
            }}
          />
        );
      })}
    </>
  );
}

// ── Star rating helper ──
const STAR_POP_CLASSES = ["star-pop-1", "star-pop-2", "star-pop-3"] as const;
function StarRating({ stars, accent }: Readonly<{ stars: number; accent: string }>) {
  return (
    <div className="flex items-center justify-center gap-3 my-1">
      {[1, 2, 3].map((n) => {
        const isLit = n <= stars;
        const popClass = isLit ? STAR_POP_CLASSES[n - 1] : "opacity-20";
        return (
          <div
            key={n}
            className={`text-4xl transition-all ${popClass}`}
            style={isLit ? { filter: `drop-shadow(0 0 10px ${accent}88)` } : undefined}
          >
            {isLit ? "⭐" : "☆"}
          </div>
        );
      })}
    </div>
  );
}

// ── Premium Game Result Overlay ──
interface GameResultOverlayProps {
  readonly accent: string;
  readonly gradFrom: string;
  readonly gradTo: string;
  readonly gameName: string;
  readonly score: number;
  readonly bestScore: number;
  readonly stars: number;
  readonly stats: ReadonlyArray<{ label: string; value: string | number }>;
  readonly onReplay: () => void;
  readonly onBack: () => void;
  readonly onSaveNote?: (note: string) => void;
  readonly hasActiveClient?: boolean;
}
function GameResultOverlay({ accent, gradFrom, gradTo, gameName, score, bestScore, stars, stats, onReplay, onBack, onSaveNote, hasActiveClient }: GameResultOverlayProps) {
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  function handleSaveNote() {
    if (!noteText.trim() || !onSaveNote) return;
    onSaveNote(noteText.trim());
    setNoteSaved(true);
  }
  const isNewBest = score >= bestScore && bestScore > 0 && score > 0;
  const prevBest = isNewBest && bestScore < score ? bestScore : 0;
  return (
    <div
      className="result-overlay-in absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden rounded-3xl"
      style={{ background: "rgba(4,8,18,0.97)", backdropFilter: "blur(2px)" }}
    >
      {/* Confetti */}
      <div className="absolute inset-x-0 top-0 h-32 overflow-hidden pointer-events-none">
        <ConfettiPieces count={20} accent={accent} />
      </div>

      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full pointer-events-none" style={{ background: accent, opacity: 0.08, filter: "blur(60px)" }} />
      <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full pointer-events-none" style={{ background: gradTo, opacity: 0.06, filter: "blur(50px)", transform: "translate(20%,20%)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 w-full max-w-sm">
        {/* Game name chip */}
        <div className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}>
          {gameName} · Tamamlandı
        </div>

        {/* Stars */}
        <StarRating stars={stars} accent={accent} />

        {/* Score */}
        <div className="score-count-in flex flex-col items-center">
          <span className="text-white/40 text-xs uppercase tracking-widest font-bold mb-1">Final Skor</span>
          <span className="font-extrabold tabular-nums leading-none" style={{ fontSize: "5rem", lineHeight: 1, background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {score}
          </span>
        </div>

        {/* New best badge */}
        {isNewBest ? (
          <div className="new-best-badge flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: `${accent}20`, border: `1.5px solid ${accent}55` }}>
            <span className="text-lg">🏆</span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest m-0" style={{ color: accent }}>Yeni Rekor!</p>
              <p className="text-white/40 text-xs m-0">Önceki en iyi: <strong className="text-white/60">{prevBest || "—"}</strong></p>
            </div>
          </div>
        ) : bestScore > 0 ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm">📊</span>
            <span className="text-white/40 text-xs">En iyi: <strong className="text-white/60">{bestScore}</strong></span>
          </div>
        ) : null}

        {/* Stats row */}
        <div className="w-full flex gap-2">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`flex-1 flex flex-col items-center py-3 rounded-2xl result-stat-in-${Math.min(i + 1, 3)}`} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <strong className="text-xl font-extrabold tabular-nums leading-none" style={{ color: i === 0 ? accent : "white" }}>{stat.value}</strong>
              <span className="text-white/35 text-[10px] uppercase tracking-wider font-bold mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="result-btn-in w-full flex gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border-none cursor-pointer transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`, boxShadow: `0 4px 20px ${accent}40` }}
          >
            <span>↩</span> Tekrar Oyna
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm text-white/60 cursor-pointer transition-all active:scale-95 hover:text-white/90"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Oyunlar
          </button>
        </div>

        {/* Post-game note */}
        {hasActiveClient && onSaveNote && (
          <div className="w-full rounded-2xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold m-0">Seans Notu</p>
            {noteSaved ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: accent }}>
                <Check size={12} /> Not kaydedildi
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Bu oyun için kısa not..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white/70 placeholder-white/25"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(); }}
                />
                <button type="button" onClick={handleSaveNote} disabled={!noteText.trim()}
                  className="shrink-0 px-3 py-1 rounded-xl text-xs font-bold border-none cursor-pointer disabled:opacity-40"
                  style={{ background: `${accent}30`, color: accent }}>
                  Kaydet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

/* ─── useCountUp ─── smooth number animation hook ──────────────── */
function useCountUp(target: number, duration = 900): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let frame: number;
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return count;
}

/* ─── Toast notification system ────────────────────────────────── */
interface ToastItem { id: string; message: string; type: "success" | "info" | "warning"; }
const ToastContext = { items: [] as ToastItem[], listeners: new Set<() => void>() };
function useToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const sync = () => setItems([...ToastContext.items]);
    ToastContext.listeners.add(sync);
    return () => { ToastContext.listeners.delete(sync); };
  }, []);
  return items;
}
function showToast(message: string, type: ToastItem["type"] = "success") {
  const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2,6)}`;
  ToastContext.items = [...ToastContext.items, { id, message, type }];
  ToastContext.listeners.forEach(fn => fn());
  setTimeout(() => {
    ToastContext.items = ToastContext.items.filter(t => t.id !== id);
    ToastContext.listeners.forEach(fn => fn());
  }, 3800);
}

function ToastContainer() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  const colors = { success: "#10b981", info: "#6366f1", warning: "#f59e0b" };
  const icons = { success: "✓", info: "ℹ", warning: "⚠" };
  return (
    <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[99999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${colors[t.type]}ee, ${colors[t.type]}bb)`,
            boxShadow: `0 8px 32px ${colors[t.type]}55, 0 2px 8px rgba(0,0,0,0.3)`,
            backdropFilter: "blur(12px)",
            border: `1px solid ${colors[t.type]}44`,
            animation: "page-fade-in 0.3s ease both",
            minWidth: "220px",
          }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
            style={{ background: "rgba(255,255,255,0.25)" }}>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

interface StatCardProps {
  v: number; l: string; sub: string; tooltip: string;
  gradient: string; border: string; glow: string; color: string;
  Icon: typeof LayoutDashboard; iconBg: string; iconColor: string;
  sparkColor: string; trend: string;
}
function StatCard({ v, l, sub, tooltip, gradient, border, glow, color, Icon, iconBg, iconColor, sparkColor, trend }: StatCardProps) {
  const animated = useCountUp(v, 900);
  return (
    <div
      data-tooltip={tooltip}
      data-tooltip-dir="bottom"
      className="rounded-2xl p-5 relative overflow-hidden card-hover cursor-default"
      style={{ background: gradient, border: `1px solid ${border}`, boxShadow: glow }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${border},transparent)` }} />
      <div className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        <Icon size={15} style={{ color: iconColor }} />
      </div>
      {trend === "up" && (
        <div className="absolute top-4 right-[52px] flex items-center gap-0.5" style={{ color: sparkColor }}>
          <ArrowUpRight size={11} />
        </div>
      )}
      <strong className="text-4xl lg:text-5xl font-extrabold block mt-1 mb-1 tabular-nums" style={{ color }}>{animated}</strong>
      <span className="text-(--color-text-strong) text-sm font-semibold block">{l}</span>
      <span className="text-(--color-text-muted) text-xs">{sub}</span>
      <svg className="absolute bottom-3 right-3 opacity-30" width="40" height="16" viewBox="0 0 40 16">
        <polyline points="0,14 8,10 16,11 24,5 32,7 40,2" fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
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
  const [clientDetailTab, setClientDetailTab] = useState<"notes" | "plan" | "scores" | "progress">("notes");
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

  // ── New feature states ──
  const [clientSearch, setClientSearch] = useState("");
  const [noteMode, setNoteMode] = useState<NoteMode>("free");
  const [soapDraft, setSoapDraft] = useState<SoapNoteContent>({ s: "", o: "", a: "", p: "" });
  const [clientGoals, setClientGoals] = useState<ClientGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalDraft, setGoalDraft] = useState({ title: "", description: "", targetValue: 100, deadline: "" });
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [showEditTherapist, setShowEditTherapist] = useState(false);
  const [therapistEditDraft, setTherapistEditDraft] = useState({ displayName: "", clinicName: "", specialty: "" });
  const [postGameNote, setPostGameNote] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(false);

  // ── In-game feedback ──
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; combo: number; timestamp: number } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  function triggerFeedback(correct: boolean, combo = 0) {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    setLastFeedback({ correct, combo, timestamp: Date.now() });
    feedbackTimerRef.current = window.setTimeout(() => setLastFeedback(null), 700);
  }

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

      // Legacy migration: notes/plans are now DB-backed; keep localStorage as offline fallback
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
    showToast("Not eklendi", "success");
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
    showToast("📅 Haftalık plan kaydedildi", "success");
  }

  // ── DB-backed note handlers ──
  async function handleAddNoteDB() {
    if (!selectedClientId) return;
    const content = noteMode === "soap"
      ? `[S] ${soapDraft.s}\n[O] ${soapDraft.o}\n[A] ${soapDraft.a}\n[P] ${soapDraft.p}`
      : noteForm.content.trim();
    if (!content.trim()) return;
    setIsNotesLoading(true);
    try {
      const res = await fetch("/api/platform/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          therapistId: activeTherapistId || undefined,
          date: noteForm.date || getTodayString(),
          content,
          noteMode,
          soapContent: noteMode === "soap" ? soapDraft : undefined,
        }),
      });
      if (res.ok) {
        const { note } = (await res.json()) as { note: SessionNote };
        setAllNotes((c) => [note, ...c.filter((n) => n.id !== note.id)]);
        showToast("Not eklendi", "success");
      } else {
        // Fallback: add locally
        const note: SessionNote = {
          id: `note-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          clientId: selectedClientId,
          therapistId: activeTherapistId,
          date: noteForm.date || getTodayString(),
          content,
          noteMode,
          soapContent: noteMode === "soap" ? soapDraft : undefined,
          createdAt: new Date().toISOString(),
        };
        setAllNotes((c) => [note, ...c]);
        showToast("Not yerel olarak eklendi", "info");
      }
    } catch {
      const note: SessionNote = {
        id: `note-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        clientId: selectedClientId, therapistId: activeTherapistId,
        date: noteForm.date || getTodayString(), content, noteMode,
        soapContent: noteMode === "soap" ? soapDraft : undefined,
        createdAt: new Date().toISOString(),
      };
      setAllNotes((c) => [note, ...c]);
    }
    setNoteForm({ date: getTodayString(), content: "" });
    setSoapDraft({ s: "", o: "", a: "", p: "" });
    setNoteMode("free");
    setShowNoteForm(false);
    setIsNotesLoading(false);
  }

  async function handleDeleteNoteDB(noteId: string) {
    setAllNotes((c) => c.filter((n) => n.id !== noteId));
    try { await fetch(`/api/platform/notes?noteId=${noteId}`, { method: "DELETE" }); } catch { /* local already removed */ }
  }

  async function handleSaveWeeklyPlanDB() {
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
      setAllWeeklyPlans((c) => c.map((p, i) => i === existingIndex ? plan : p));
    } else {
      setAllWeeklyPlans((c) => [...c, plan]);
    }
    showToast("📅 Haftalık plan kaydedildi", "success");
    try {
      await fetch("/api/platform/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClientId, therapistId: activeTherapistId || undefined, weekStartDate: planWeekStart, days: planEdits }),
      });
    } catch { /* already saved locally */ }
  }

  // ── Load notes from DB when client selected ──
  async function loadClientNotesFromDB(clientId: string) {
    try {
      const res = await fetch(`/api/platform/notes?clientId=${clientId}`);
      if (res.ok) {
        const { notes } = (await res.json()) as { notes: SessionNote[] };
        setAllNotes((c) => {
          const ids = new Set(notes.map((n) => n.id));
          const local = c.filter((n) => n.clientId !== clientId || !ids.has(n.id));
          return [...notes, ...local].sort((a, b) => b.date.localeCompare(a.date));
        });
      }
    } catch { /* keep local */ }
  }

  // ── Load plan from DB when client/week changes ──
  async function loadWeeklyPlanFromDB(clientId: string, weekStartDate: string) {
    try {
      const res = await fetch(`/api/platform/plans?clientId=${clientId}&weekStartDate=${weekStartDate}`);
      if (res.ok) {
        const { plan } = (await res.json()) as { plan: WeeklyPlan | null };
        if (plan) {
          setAllWeeklyPlans((c) => {
            const idx = c.findIndex((p) => p.clientId === clientId && p.weekStartDate === weekStartDate);
            if (idx >= 0) return c.map((p, i) => i === idx ? plan : p);
            return [...c, plan];
          });
          setPlanEdits(plan.days);
        }
      }
    } catch { /* keep local */ }
  }

  // ── Goals handlers ──
  async function loadClientGoals(clientId: string) {
    try {
      const res = await fetch(`/api/platform/goals?clientId=${clientId}`);
      if (res.ok) {
        const { goals } = (await res.json()) as { goals: ClientGoal[] };
        setClientGoals(goals);
      }
    } catch { setClientGoals([]); }
  }

  async function handleAddGoal() {
    if (!selectedClientId || !goalDraft.title.trim()) return;
    try {
      const res = await fetch("/api/platform/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          therapistId: activeTherapistId || undefined,
          title: goalDraft.title.trim(),
          description: goalDraft.description.trim() || undefined,
          targetValue: goalDraft.targetValue,
          deadline: goalDraft.deadline || undefined,
        }),
      });
      if (res.ok) {
        const { goal } = (await res.json()) as { goal: ClientGoal };
        setClientGoals((c) => [...c, goal]);
        setGoalDraft({ title: "", description: "", targetValue: 100, deadline: "" });
        setShowGoalForm(false);
        showToast("🎯 Hedef eklendi", "success");
      }
    } catch { showToast("Hedef eklenemedi", "warning"); }
  }

  async function handleUpdateGoalProgress(goalId: string, currentValue: number) {
    try {
      const res = await fetch("/api/platform/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, currentValue }),
      });
      if (res.ok) {
        const { goal } = (await res.json()) as { goal: ClientGoal };
        setClientGoals((c) => c.map((g) => g.id === goalId ? goal : g));
        showToast(`📈 İlerleme güncellendi — %${currentValue}`, "success");
      }
    } catch { /* ignore */ }
  }

  async function handleDeleteGoal(goalId: string) {
    setClientGoals((c) => c.filter((g) => g.id !== goalId));
    try { await fetch(`/api/platform/goals?goalId=${goalId}`, { method: "DELETE" }); } catch { /* local removed */ }
  }

  // ── Archive client ──
  async function handleArchiveClient(clientId: string) {
    setArchiveTargetId(null);
    try {
      await fetch("/api/platform/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "archive-client", clientId }),
      });
      await loadPlatformOverview();
      showToast("Danışan arşivlendi", "info");
    } catch { showToast("Arşivleme başarısız", "warning"); }
  }

  // ── Update therapist profile ──
  async function handleUpdateTherapist() {
    if (!activeTherapistId) return;
    try {
      const res = await fetch("/api/platform/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "update-therapist",
          therapistId: activeTherapistId,
          displayName: therapistEditDraft.displayName.trim() || undefined,
          clinicName: therapistEditDraft.clinicName,
          specialty: therapistEditDraft.specialty,
        }),
      });
      if (res.ok) {
        const { profile } = (await res.json()) as { profile: TherapistProfile };
        await loadPlatformOverview();
        setShowEditTherapist(false);
        showToast(`✅ Profil güncellendi — ${profile.displayName}`, "success");
      }
    } catch { showToast("Profil güncellenemedi", "warning"); }
  }

  // ── Post-game note handler ──
  async function handleSavePostGameNote(note: string, gameLabel: string) {
    if (!note.trim() || !selectedClientId) return;
    setNoteForm({ date: getTodayString(), content: `[${gameLabel}] ${note}` });
    setNoteMode("free");
    await handleAddNoteDB();
  }

  // ── PDF Export ──
  function handlePrintReport(client: ClientProfile) {
    const sessions = platformOverview.recentSessions.filter(s => s.clientId === client.id);
    const notes = allNotes.filter(n => n.clientId === client.id).slice(0, 10);
    const goals = clientGoals;
    const therapistName = activeTherapist?.displayName ?? "Terapist";
    const clinicName = activeTherapist?.clinicName ?? "";
    const today = getTodayString();
    const bestScore = sessions.length > 0 ? Math.max(...sessions.map(s => s.score)) : 0;
    const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;
    const gameMap: Record<string, { plays: number; best: number }> = {};
    sessions.forEach(s => {
      if (!gameMap[s.gameKey]) gameMap[s.gameKey] = { plays: 0, best: 0 };
      gameMap[s.gameKey].plays++;
      if (s.score > gameMap[s.gameKey].best) gameMap[s.gameKey].best = s.score;
    });
    const gameRows = Object.entries(gameMap).map(([key, v]) => {
      const g = GAME_TABS.find(gt => gt.key === key);
      return `<tr><td>${g?.title ?? key}</td><td>${v.plays}</td><td>${v.best}</td></tr>`;
    }).join("");
    const noteRows = notes.map(n => `<tr><td>${n.date}</td><td style="white-space:pre-wrap">${n.content}</td></tr>`).join("");
    const goalRows = goals.map(g => {
      const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
      return `<tr><td>${g.title}</td><td>${g.currentValue}/${g.targetValue}</td><td>${pct}%</td><td>${g.deadline ?? "—"}</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Mimio Rapor — ${client.displayName}</title><style>
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;margin:0;padding:24px;font-size:13px}
      h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;font-weight:700;margin:20px 0 8px;color:#6366f1;text-transform:uppercase;letter-spacing:.05em}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #6366f1;padding-bottom:12px;margin-bottom:20px}
      .meta{font-size:11px;color:#666;line-height:1.6}.badge{display:inline-block;background:#ede9fe;color:#6366f1;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;margin-right:4px;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}td,th{padding:6px 10px;border:1px solid #e5e7eb;text-align:left;font-size:12px}th{background:#f5f3ff;font-weight:700;color:#4f46e5}
      .stat-row{display:flex;gap:16px;margin-bottom:16px}.stat{background:#f5f3ff;border:1px solid #ede9fe;border-radius:12px;padding:12px 18px;text-align:center;flex:1}.stat-val{font-size:28px;font-weight:900;color:#6366f1}.stat-lbl{font-size:11px;color:#888;font-weight:600}
      .no-data{color:#999;font-style:italic;font-size:12px}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#aaa;text-align:center}
      @media print{body{padding:0}button{display:none}}
    </style></head><body>
      <div class="header">
        <div>
          <h1>${client.displayName}</h1>
          <div class="meta">
            ${client.ageGroup ? `<span class="badge">${client.ageGroup}</span>` : ""}
            ${client.primaryGoal ? `<span class="badge">${client.primaryGoal}</span>` : ""}
            ${client.supportLevel ? `<span class="badge">${client.supportLevel}</span>` : ""}
            ${client.difficultyLevel ? `<span class="badge">${client.difficultyLevel}</span>` : ""}
          </div>
        </div>
        <div class="meta" style="text-align:right">
          <strong>${therapistName}</strong>${clinicName ? `<br>${clinicName}` : ""}<br>Rapor tarihi: ${today}
        </div>
      </div>

      <h2>Genel Performans</h2>
      <div class="stat-row">
        <div class="stat"><div class="stat-val">${sessions.length}</div><div class="stat-lbl">Toplam Seans</div></div>
        <div class="stat"><div class="stat-val">${bestScore || "—"}</div><div class="stat-lbl">En Yüksek Skor</div></div>
        <div class="stat"><div class="stat-val">${avgScore || "—"}</div><div class="stat-lbl">Ortalama Skor</div></div>
      </div>

      <h2>Oyun Bazlı Sonuçlar</h2>
      ${gameRows ? `<table><thead><tr><th>Oyun</th><th>Oynama</th><th>En İyi Skor</th></tr></thead><tbody>${gameRows}</tbody></table>` : '<p class="no-data">Henüz oyun seansı yok.</p>'}

      ${goalRows ? `<h2>SMART Hedefler</h2><table><thead><tr><th>Hedef</th><th>İlerleme</th><th>%</th><th>Son Tarih</th></tr></thead><tbody>${goalRows}</tbody></table>` : ""}

      <h2>Seans Notları</h2>
      ${noteRows ? `<table><thead><tr><th style="width:100px">Tarih</th><th>Not</th></tr></thead><tbody>${noteRows}</tbody></table>` : '<p class="no-data">Henüz seans notu yok.</p>'}

      <div class="footer">Mimio Ergoterapi Platformu — ${today} tarihinde oluşturuldu</div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;

    const win = window.open("", "_blank", "width=800,height=900");
    if (win) { win.document.write(html); win.document.close(); }
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
      showToast(`👤 ${addClientDraft.displayName.trim()} eklendi`, "success");
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
    showToast(`📈 İlerleme kaydedildi — %${entry.value}`, "success");
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

  // ── Load notes & goals from DB when client changes ──
  useEffect(() => {
    if (!selectedClientId) return;
    void loadClientNotesFromDB(selectedClientId);
    void loadClientGoals(selectedClientId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  // ── Load plan when client/week changes (DB first, then local fallback) ──
  useEffect(() => {
    if (!selectedClientId) return;
    void loadWeeklyPlanFromDB(selectedClientId, planWeekStart);
    const existing = allWeeklyPlans.find((p) => p.clientId === selectedClientId && p.weekStartDate === planWeekStart);
    if (existing) {
      setPlanEdits(existing.days);
    } else {
      setPlanEdits({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, planWeekStart]);

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
      showToast(`👤 ${created.displayName} eklendi`, "success");
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

  // Approximate high-score thresholds per game (≥ this = strong performance)
  const ADAPTIVE_THRESHOLDS: Record<GameKey, number> = {
    memory: 8, pairs: 10, pulse: 14, route: 12, difference: 9, scan: 10,
  } as const;

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
      const isNewBest = nextScore > entry.best;
      if (isNewBest && nextScore > 0) {
        showToast(`🏆 Yeni rekor! ${GAME_LABELS[game]}: ${nextScore}`, "success");
      } else if (nextScore > 0) {
        showToast(`✓ Seans kaydedildi — ${GAME_LABELS[game]}: ${nextScore}`, "info");
      }
      return { ...current, [game]: { ...entry, best: Math.max(entry.best, nextScore), last: nextScore, plays: entry.plays + 1 } };
    });
    // ── Adaptive difficulty suggestion ──
    if (activeClient && nextScore > 0) {
      const threshold = ADAPTIVE_THRESHOLDS[game];
      const recentForGame = platformOverview.recentSessions
        .filter(s => s.clientId === activeClient.id && s.gameKey === game)
        .slice(-2); // last 2 in history + this one = 3 total
      const allHigh = recentForGame.length >= 2 && recentForGame.every(s => s.score >= threshold) && nextScore >= threshold;
      if (allHigh) {
        setTimeout(() => showToast(`📈 ${activeClient.displayName} son 3 seansta yüksek performans — zorluk artırılabilir!`, "info"), 2500);
      }
    }
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
      triggerFeedback(false);
      commitScore("memory", memoryState.score, { phase: "finished", sequenceLength: memoryState.sequence.length, inputLength: nextInput.length });
      setMemoryState((current) => ({ ...current, input: nextInput, flashIndex: expected, phase: "finished", message: `Tur bitti. Kaydedilen skor ${current.score}. Doğru düğme parlıyordu.` }));
      return;
    }
    triggerFeedback(true);
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
    triggerFeedback(isHit, nextCombo);
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
    triggerFeedback(isCorrect, nextStreak);
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
    triggerFeedback(isCorrect, 0);
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
    triggerFeedback(isCorrect, 0);
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
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "var(--color-page-bg)" }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", top: "-20%", left: "50%", transform: "translateX(-50%)" }} />
          <div className="absolute w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", bottom: "-10%", right: "10%" }} />
          <div className="absolute w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)", bottom: "20%", left: "5%" }} />
        </div>

        {/* Logo */}
        <button type="button" onClick={onLogout} className="flex flex-col items-center gap-2.5 mb-8 bg-transparent border-none cursor-pointer group">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-105 transition-transform" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>Mi</div>
          <span className="font-extrabold text-(--color-text-strong) text-xl tracking-tight">Mimio</span>
        </button>

        {/* Card */}
        <div className="w-full max-w-md rounded-3xl border border-(--color-line) p-8 relative overflow-hidden" style={{ background: "var(--color-surface-strong)", backdropFilter: "blur(24px)", boxShadow: "0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)" }} />
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full" style={{ background: "var(--color-primary)/10", color: "var(--color-primary)", border: "1px solid var(--color-primary)/20" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-primary)" }} />
              Ücretsiz Hesap Oluştur
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-(--color-text-strong) text-center mb-1 tracking-tight">Hesabınızı Oluşturun</h2>
          <p className="text-(--color-text-soft) text-sm text-center mb-6">Dakikalar içinde başlayın, danışanlarınızla çalışmaya başlayın.</p>

          {loginError && (
            <div className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <span>⚠️</span>{loginError}
            </div>
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
              <input value={therapistDraft.clinicName} onChange={(e) => setTherapistDraft((c) => ({ ...c, clinicName: e.target.value }))} placeholder="Kurum / klinik" className={authInp} />
              <input value={therapistDraft.specialty} onChange={(e) => setTherapistDraft((c) => ({ ...c, specialty: e.target.value }))} placeholder="Uzmanlık" className={authInp} />
            </div>
            <button type="submit" className="relative w-full text-white font-bold py-3.5 rounded-2xl transition-all text-sm border-none cursor-pointer mt-1 overflow-hidden hover:opacity-90 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}>
              Hesabı Oluştur ve Gir →
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-(--color-line)" />
            <span className="text-(--color-text-muted) text-xs font-medium">veya</span>
            <div className="flex-1 h-px bg-(--color-line)" />
          </div>

          <p className="text-(--color-text-soft) text-sm text-center">
            Zaten hesabınız var mı?{" "}
            <button type="button" className="font-bold hover:underline bg-transparent border-none cursor-pointer" style={{ color: "var(--color-primary)" }} onClick={() => { setActiveAppView("login"); setLoginError(""); }}>Giriş yapın</button>
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
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "var(--color-page-bg)" }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)", top: "-30%", left: "50%", transform: "translateX(-50%)" }} />
          <div className="absolute w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", bottom: "0%", right: "15%" }} />
        </div>

        {/* Logo */}
        <button type="button" onClick={onLogout} className="flex flex-col items-center gap-2.5 mb-8 bg-transparent border-none cursor-pointer group">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-white font-black text-xl group-hover:scale-105 transition-transform" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>Mi</div>
          <span className="font-extrabold text-(--color-text-strong) text-xl tracking-tight">Mimio</span>
        </button>

        {/* Card */}
        <div className="w-full max-w-sm rounded-3xl border border-(--color-line) p-8 relative overflow-hidden" style={{ background: "var(--color-surface-strong)", backdropFilter: "blur(24px)", boxShadow: "0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)" }} />
          <h2 className="text-2xl font-extrabold text-(--color-text-strong) text-center mb-1 tracking-tight">Tekrar Hoş Geldiniz</h2>
          <p className="text-(--color-text-soft) text-sm text-center mb-7">Hesabınıza giriş yapın ve çalışmaya devam edin.</p>

          {loginError && (
            <div className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <span>⚠️</span>{loginError}
            </div>
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
            <button type="submit" className="relative w-full text-white font-bold py-3.5 rounded-2xl transition-all text-sm border-none cursor-pointer mt-1 overflow-hidden hover:opacity-90 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}>
              Giriş Yap →
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-(--color-line)" />
            <span className="text-(--color-text-muted) text-xs font-medium">veya</span>
            <div className="flex-1 h-px bg-(--color-line)" />
          </div>

          <p className="text-(--color-text-soft) text-sm text-center">
            Hesabınız yok mu?{" "}
            <button type="button" className="font-bold hover:underline bg-transparent border-none cursor-pointer" style={{ color: "var(--color-primary)" }} onClick={() => { setActiveAppView("register"); setLoginError(""); }}>Ücretsiz kayıt olun</button>
          </p>
        </div>

        {onLogout && (
          <button type="button" className="mt-5 text-(--color-text-muted) text-sm bg-transparent border-none cursor-pointer hover:text-(--color-text-body) transition-colors" onClick={onLogout}>
            ← Ana Sayfaya Dön
          </button>
        )}

        {/* Trust badges */}
        <div className="flex items-center gap-6 mt-8 text-xs text-(--color-text-muted)">
          {["Ücretsiz başla", "Kurulum yok", "Veri güvenliği"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── App shell (sidebar + content) ──
  const navItem = "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-(--color-text-soft) hover:text-(--color-text-body) hover:bg-(--color-surface-elevated) transition-all duration-150 w-full text-left border-none bg-transparent cursor-pointer group";
  const navItemActive = "!text-(--color-primary) bg-(--color-primary)/8 hover:bg-(--color-primary)/10 hover:!text-(--color-primary)";
  const btnPrimary = "bg-(--color-primary) text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-(--color-primary-hover) transition-colors cursor-pointer border-none disabled:opacity-50 shadow-(--shadow-primary)";
  const btnSecondary = "bg-(--color-surface-strong) text-(--color-text-body) text-sm font-medium px-4 py-2 rounded-xl border border-(--color-line) hover:bg-(--color-surface-elevated) hover:border-(--color-line-strong) transition-all cursor-pointer disabled:opacity-50";
  const inputCls = "w-full px-3 py-2.5 border border-(--color-line) rounded-xl bg-(--color-surface-strong) text-(--color-text-strong) text-sm placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/25 focus:border-(--color-primary) transition-colors";

  const navLinks: Array<{ view: AppView; icon: typeof LayoutDashboard; label: string; tooltip: string; matchViews?: AppView[]; badge?: string | number }> = [
    { view: "dashboard", icon: LayoutDashboard, label: "Panel", tooltip: "Genel bakış & istatistikler" },
    { view: "clients", icon: Users, label: "Danışanlar", tooltip: "Danışan listesi & profilleri", matchViews: ["clients", "client-detail"], badge: clientOptions.length > 0 ? clientOptions.length : undefined },
    { view: "games", icon: Gamepad2, label: "Oyun Alanı", tooltip: "Terapi oyunlarını başlat", badge: GAME_TABS.length },
    { view: "therapy-program", icon: Stethoscope, label: "Terapi", tooltip: "Program, aktiviteler & ilerleme" },
    { view: "reports", icon: BarChart3, label: "Raporlar", tooltip: "Analitik & performans raporları", badge: thisWeekCount > 0 ? `${thisWeekCount}↑` : undefined },
  ];

  return (
    <main className="flex h-dvh overflow-hidden bg-(--color-page-bg)">
      {/* ── Premium Sidebar ── */}
      <nav className="hidden lg:flex flex-col w-64 shrink-0 overflow-y-auto relative"
        style={{
          background: "var(--color-sidebar)",
          borderRight: "1px solid var(--color-line)",
          backdropFilter: "blur(24px)",
        }}>
        {/* Subtle gradient top glow */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12), transparent)" }} />

        {/* Logo area */}
        <div className="relative flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid var(--color-line)" }}>
          <div className="relative w-9 h-9 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)", boxShadow: "0 4px 14px rgba(99,102,241,0.45)" }}>
              Mi
            </div>
          </div>
          <div>
            <p className="font-extrabold text-(--color-text-strong) text-sm leading-tight m-0 tracking-tight">Mimio</p>
            <p className="text-(--color-text-muted) text-[11px] m-0 font-medium">Ergoterapi platformu</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(16,185,129,0.7)" }} />
            <span className="text-[10px] font-bold text-emerald-400">Aktif</span>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-0.5 p-3 flex-1 relative">
          <p className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) px-3 py-1 mt-1 mb-0.5">Ana Menü</p>
          {navLinks.map(({ view, icon: Icon, label, tooltip, matchViews, badge }) => {
            const isActive = matchViews ? matchViews.includes(activeAppView) : activeAppView === view;
            return (
              <button key={view} type="button"
                data-tooltip={tooltip}
                data-tooltip-dir="right"
                className={`${navItem} ${isActive ? navItemActive : ""}`}
                onClick={() => setActiveAppView(view)}>
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-(--color-primary)"
                    style={{ boxShadow: "0 0 8px rgba(99,102,241,0.6)" }} />
                )}
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${isActive ? "bg-(--color-primary)/15" : "bg-transparent group-hover:bg-(--color-surface-elevated)"}`}>
                  <Icon size={15} />
                </span>
                <span className="font-semibold text-sm flex-1">{label}</span>
                {badge !== undefined && !isActive && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums"
                    style={{
                      background: view === "reports" ? "rgba(245,158,11,0.15)" : view === "clients" ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.12)",
                      color: view === "reports" ? "#f59e0b" : view === "clients" ? "#34d399" : "#818cf8",
                      border: `1px solid ${view === "reports" ? "rgba(245,158,11,0.2)" : view === "clients" ? "rgba(16,185,129,0.18)" : "rgba(99,102,241,0.18)"}`,
                    }}>
                    {badge}
                  </span>
                )}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-(--color-primary) shrink-0"
                    style={{ boxShadow: "0 0 6px rgba(99,102,241,0.5)" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* User footer */}
        <div className="relative p-3 mt-auto" style={{ borderTop: "1px solid var(--color-line)" }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}>
              {activeTherapist?.displayName?.[0]?.toUpperCase() ?? "T"}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <strong className="text-(--color-text-strong) text-xs font-semibold truncate leading-tight">
                {activeTherapist?.displayName ?? "Terapist"}
              </strong>
              <span className="text-(--color-text-muted) text-[10px] truncate">
                {activeTherapist?.clinicName || "Bağımsız terapist"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={toggleTheme}
                data-tooltip={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
                data-tooltip-dir="top"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-(--color-text-muted) hover:text-(--color-primary) hover:bg-(--color-primary-light) bg-transparent border-none cursor-pointer transition-all"
                aria-label="Tema değiştir">
                {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              </button>
              <button type="button"
                data-tooltip="Profil düzenle"
                data-tooltip-dir="top"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-(--color-text-muted) hover:text-indigo-400 hover:bg-indigo-500/10 bg-transparent border-none cursor-pointer transition-all"
                onClick={() => { setTherapistEditDraft({ displayName: activeTherapist?.displayName ?? "", clinicName: activeTherapist?.clinicName ?? "", specialty: activeTherapist?.specialty ?? "" }); setShowEditTherapist(true); }} aria-label="Profil düzenle">
                <Edit2 size={13} />
              </button>
              <button type="button"
                data-tooltip="Raporlar & Analitik"
                data-tooltip-dir="top"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-(--color-text-muted) hover:text-amber-400 hover:bg-amber-500/10 bg-transparent border-none cursor-pointer transition-all"
                onClick={() => setActiveAppView("reports")} aria-label="Raporlar">
                <BarChart3 size={13} />
              </button>
              <button type="button"
                data-tooltip="Çıkış yap"
                data-tooltip-dir="top"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-(--color-text-muted) hover:text-red-400 hover:bg-red-500/10 bg-transparent border-none cursor-pointer transition-all"
                onClick={handleLogout} aria-label="Çıkış yap">
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <header className="flex lg:hidden items-center justify-between px-4 shrink-0 fixed top-0 left-0 right-0 z-30"
        style={{
          height: "56px",
          background: "var(--color-chrome-nav)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--color-line)",
        }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 2px 8px rgba(99,102,241,0.45)" }}>
            Mi
          </div>
          <div>
            <span className="font-extrabold text-(--color-text-strong) text-sm tracking-tight block leading-none">Mimio</span>
            <span className="text-[9px] font-semibold text-(--color-text-muted) leading-none">
              {activeTherapist?.displayName?.split(" ")[0] ?? "Ergoterapi"}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Status badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{
              background: platformStatus === "online" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              border: `1px solid ${platformStatus === "online" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
            }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: platformStatus === "online" ? "#10b981" : "#f59e0b", boxShadow: `0 0 5px ${platformStatus === "online" ? "rgba(16,185,129,0.7)" : "rgba(245,158,11,0.7)"}` }} />
            <span className="text-[9px] font-bold" style={{ color: platformStatus === "online" ? "#10b981" : "#f59e0b" }}>
              {platformStatus === "online" ? "Canlı" : "Lokal"}
            </span>
          </div>
          {/* Theme toggle */}
          <button type="button"
            className="w-8 h-8 rounded-xl flex items-center justify-center border-none cursor-pointer bg-transparent text-(--color-text-muted) hover:text-(--color-text-body) transition-colors"
            onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {/* Avatar / menu */}
          <button type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all active:scale-95"
            style={{ background: "rgba(99,102,241,0.1)" }}
            onClick={() => setShowUserMenu(v => !v)}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 2px 6px rgba(99,102,241,0.4)" }}>
              {activeTherapist?.displayName?.[0]?.toUpperCase() ?? "T"}
            </div>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-3 z-50 rounded-2xl shadow-(--shadow-elevated) border p-2 min-w-[220px]"
                style={{ top: "60px", background: "var(--color-surface-strong)", borderColor: "rgba(99,102,241,0.2)", backdropFilter: "blur(20px)" }}>
                {/* Top shimmer */}
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl" style={{ background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.4),transparent)" }} />
                <div className="px-3 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}>
                    {activeTherapist?.displayName?.[0]?.toUpperCase() ?? "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-(--color-text-strong) text-sm block truncate">{activeTherapist?.displayName ?? "Terapist"}</strong>
                    <span className="text-(--color-text-muted) text-xs">{activeTherapist?.clinicName || "Bağımsız terapist"}</span>
                  </div>
                </div>
                <div className="h-px mx-2 my-1" style={{ background: "var(--color-line)" }} />
                <button type="button" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-(--color-text-body) hover:bg-(--color-surface-elevated) w-full text-left bg-transparent border-none cursor-pointer"
                  onClick={() => { setShowUserMenu(false); setTherapistEditDraft({ displayName: activeTherapist?.displayName ?? "", clinicName: activeTherapist?.clinicName ?? "", specialty: activeTherapist?.specialty ?? "" }); setShowEditTherapist(true); }}>
                  <Edit2 size={14} /> Profili Düzenle
                </button>
                <button type="button" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-(--color-text-body) hover:bg-(--color-surface-elevated) w-full text-left bg-transparent border-none cursor-pointer" onClick={() => { setShowUserMenu(false); toggleTheme(); }}>
                  {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                </button>
                <button type="button" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-(--color-accent-red) hover:bg-red-500/10 w-full text-left bg-transparent border-none cursor-pointer" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                  <LogOut size={14} /> Çıkış Yap
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pt-[56px] pb-20 lg:pt-0 lg:pb-0 safe-scroll-bottom">

        {/* ── Dashboard ── */}
        {activeAppView === "dashboard" && (
          <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-5 lg:space-y-8">

            {/* Header */}
            <div className="flex items-start justify-between pt-1 gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) hidden sm:inline">{formatDate(getTodayString())}</span>
                  <span className="w-1 h-1 rounded-full bg-(--color-text-muted) hidden sm:inline-block" />
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: platformStatus === "online" ? "#10b981" : "#f59e0b" }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ background: platformStatus === "online" ? "#10b981" : "#f59e0b", boxShadow: `0 0 5px ${platformStatus === "online" ? "rgba(16,185,129,0.6)" : "rgba(245,158,11,0.6)"}` }} />
                    {getDatabaseStatusLabel(platformStatus)}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-4xl font-extrabold m-0 leading-tight truncate" style={{
                  background: "linear-gradient(135deg, var(--color-text-strong) 0%, #a5b4fc 55%, #818cf8 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  Merhaba, {activeTherapist?.displayName?.split(" ")[0] ?? "Terapist"} 👋
                </h1>
                <p className="text-(--color-text-soft) text-xs lg:text-sm mt-1.5 m-0">
                  {clientOptions.length} danışan · {effectiveSessionCount} toplam seans
                </p>
              </div>
              <button type="button"
                className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold text-white border-none cursor-pointer transition-all hover:scale-105 shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
                onClick={() => setActiveAppView("games")}>
                <Gamepad2 size={14} /> <span className="hidden sm:inline">Oyun Başlat</span><span className="sm:hidden">Oyna</span>
              </button>
            </div>

            {/* Stats */}
            {(() => {
              const isLight = theme === "light";
              const avgScore = effectiveSessionCount > 0
                ? Math.round(platformOverview.totals.totalScore / effectiveSessionCount)
                : 0;
              const statItems = [
                {
                  v: effectiveSessionCount, l: "Toplam Seans", sub: "tüm zamanlar",
                  tooltip: "Tüm zamanlarda kaydedilen toplam oyun seansı sayısı",
                  Icon: Gamepad2,
                  gradient: isLight ? "linear-gradient(135deg,rgba(99,102,241,0.14),rgba(99,102,241,0.04))" : "linear-gradient(135deg,rgba(99,102,241,0.22),rgba(79,70,229,0.05))",
                  border: isLight ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.32)",
                  glow: isLight ? "none" : "0 0 48px rgba(99,102,241,0.15),0 2px 8px rgba(0,0,0,0.3)",
                  color: isLight ? "#3730a3" : "#a5b4fc",
                  iconBg: isLight ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.2)",
                  iconColor: isLight ? "#4338ca" : "#818cf8",
                  sparkColor: "#818cf8",
                  trend: thisWeekCount > 0 ? "up" : "flat",
                },
                {
                  v: clientOptions.length, l: "Danışan", sub: "kayıtlı profil",
                  tooltip: "Sisteme kayıtlı toplam danışan profili",
                  Icon: Users,
                  gradient: isLight ? "linear-gradient(135deg,rgba(16,185,129,0.14),rgba(16,185,129,0.04))" : "linear-gradient(135deg,rgba(16,185,129,0.22),rgba(5,150,105,0.05))",
                  border: isLight ? "rgba(16,185,129,0.28)" : "rgba(16,185,129,0.32)",
                  glow: isLight ? "none" : "0 0 48px rgba(16,185,129,0.12),0 2px 8px rgba(0,0,0,0.3)",
                  color: isLight ? "#065f46" : "#6ee7b7",
                  iconBg: isLight ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.2)",
                  iconColor: isLight ? "#047857" : "#34d399",
                  sparkColor: "#34d399",
                  trend: clientOptions.length > 0 ? "up" : "flat",
                },
                {
                  v: thisWeekCount, l: "Bu Hafta", sub: "son 7 gün",
                  tooltip: "Son 7 gün içinde oynanan seans sayısı",
                  Icon: TrendingUp,
                  gradient: isLight ? "linear-gradient(135deg,rgba(245,158,11,0.14),rgba(245,158,11,0.04))" : "linear-gradient(135deg,rgba(245,158,11,0.22),rgba(217,119,6,0.05))",
                  border: isLight ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.32)",
                  glow: isLight ? "none" : "0 0 48px rgba(245,158,11,0.12),0 2px 8px rgba(0,0,0,0.3)",
                  color: isLight ? "#92400e" : "#fcd34d",
                  iconBg: isLight ? "rgba(245,158,11,0.14)" : "rgba(245,158,11,0.2)",
                  iconColor: isLight ? "#b45309" : "#f59e0b",
                  sparkColor: "#f59e0b",
                  trend: thisWeekCount > 0 ? "up" : "flat",
                },
                {
                  v: avgScore, l: "Ort. Skor", sub: "seans başına",
                  tooltip: "Tüm seansların skor ortalaması",
                  Icon: Award,
                  gradient: isLight ? "linear-gradient(135deg,rgba(236,72,153,0.14),rgba(236,72,153,0.04))" : "linear-gradient(135deg,rgba(236,72,153,0.22),rgba(219,39,119,0.05))",
                  border: isLight ? "rgba(236,72,153,0.28)" : "rgba(236,72,153,0.32)",
                  glow: isLight ? "none" : "0 0 48px rgba(236,72,153,0.12),0 2px 8px rgba(0,0,0,0.3)",
                  color: isLight ? "#9d174d" : "#f9a8d4",
                  iconBg: isLight ? "rgba(236,72,153,0.14)" : "rgba(236,72,153,0.2)",
                  iconColor: isLight ? "#be185d" : "#f472b6",
                  sparkColor: "#f472b6",
                  trend: avgScore > 0 ? "up" : "flat",
                },
              ];
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {statItems.map((item) => (
                    <StatCard key={item.l} {...item} />
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
                  gradient: isLight ? "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.03))" : "linear-gradient(135deg,rgba(16,185,129,0.14),rgba(16,185,129,0.03))",
                  border: isLight ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.25)",
                  iconBg: isLight ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.2)",
                  iconColor: isLight ? "#047857" : "#34d399",
                  badge: null as string | null,
                },
                {
                  Icon: Gamepad2, title: "Oyun Alanını Aç", sub: "6 modülle seans çalışma alanı",
                  action: () => setActiveAppView("games"),
                  gradient: isLight ? "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.03))" : "linear-gradient(135deg,rgba(99,102,241,0.14),rgba(99,102,241,0.03))",
                  border: isLight ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.25)",
                  iconBg: isLight ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.2)",
                  iconColor: isLight ? "#4338ca" : "#818cf8",
                  badge: "6 Oyun" as string | null,
                },
                {
                  Icon: Stethoscope, title: "Terapi Programı", sub: "Aktivite önerileri ve haftalık plan",
                  action: () => setActiveAppView("therapy-program"),
                  gradient: isLight ? "linear-gradient(135deg,rgba(6,182,212,0.1),rgba(6,182,212,0.03))" : "linear-gradient(135deg,rgba(6,182,212,0.14),rgba(6,182,212,0.03))",
                  border: isLight ? "rgba(6,182,212,0.3)" : "rgba(6,182,212,0.25)",
                  iconBg: isLight ? "rgba(6,182,212,0.14)" : "rgba(6,182,212,0.2)",
                  iconColor: isLight ? "#0e7490" : "#22d3ee",
                  badge: null as string | null,
                },
                {
                  Icon: BarChart3, title: "Raporlar & Analitik", sub: "Skor grafikleri, danışan gelişimi",
                  action: () => setActiveAppView("reports"),
                  gradient: isLight ? "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03))" : "linear-gradient(135deg,rgba(245,158,11,0.14),rgba(245,158,11,0.03))",
                  border: isLight ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.25)",
                  iconBg: isLight ? "rgba(245,158,11,0.14)" : "rgba(245,158,11,0.2)",
                  iconColor: isLight ? "#b45309" : "#fbbf24",
                  badge: "YENİ" as string | null,
                },
              ] as const;
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {actions.map(({ Icon, title, sub, action, gradient, border, iconBg, iconColor, badge }) => (
                    <button key={title} type="button" onClick={action}
                      data-tooltip={sub}
                      data-tooltip-dir="bottom"
                      className="flex flex-col gap-2 p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow-elevated) group relative overflow-hidden"
                      style={{ background: gradient, borderColor: border }}>
                      {badge && (
                        <span className="absolute top-3 right-3 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>{badge}</span>
                      )}
                      <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-110"
                        style={{ background: iconBg }}>
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
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-(--color-text-muted) uppercase tracking-widest m-0">Oyun Kategorileri</h2>
                <button type="button" className="text-xs font-semibold text-(--color-primary) bg-transparent border-none cursor-pointer hover:underline" onClick={() => setActiveAppView("games")}>
                  Tümünü gör →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
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
                      gradLine: "rgba(139,92,246,0.4)",
                    },
                    {
                      bg: isLight ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.16)",
                      color: isLight ? "#b45309" : "#fcd34d",
                      border: isLight ? "rgba(245,158,11,0.28)" : "rgba(245,158,11,0.3)",
                      glow: isLight ? "none" : "0 0 32px rgba(245,158,11,0.1)",
                      labelBg: isLight ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.18)",
                      labelColor: isLight ? "#92400e" : "#f59e0b",
                      gradLine: "rgba(245,158,11,0.4)",
                    },
                    {
                      bg: isLight ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.16)",
                      color: isLight ? "#0e7490" : "#67e8f9",
                      border: isLight ? "rgba(6,182,212,0.28)" : "rgba(6,182,212,0.3)",
                      glow: isLight ? "none" : "0 0 32px rgba(6,182,212,0.1)",
                      labelBg: isLight ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.18)",
                      labelColor: isLight ? "#155e75" : "#06b6d4",
                      gradLine: "rgba(6,182,212,0.4)",
                    },
                  ][catIdx] ?? { bg: "rgba(99,102,241,0.12)", color: isLight ? "#4338ca" : "#818cf8", border: "rgba(99,102,241,0.22)", glow: "none", labelBg: "rgba(99,102,241,0.12)", labelColor: isLight ? "#3730a3" : "#6366f1", gradLine: "rgba(99,102,241,0.4)" };
                  return (
                    <button key={cat.key} type="button"
                      className="flex sm:flex-col flex-row items-center sm:items-start gap-3 sm:gap-2 p-3.5 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 sm:hover:-translate-y-1 bg-(--color-surface-strong) group relative overflow-hidden"
                      style={{ borderColor: catStyles.border, boxShadow: catStyles.glow }}
                      onClick={() => { openCategory(cat.key); }}>
                      {/* Top shimmer line */}
                      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${catStyles.gradLine}, transparent)` }} />
                      <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 sm:mb-1 transition-transform duration-200 group-hover:scale-110"
                        style={{ background: catStyles.bg }}>
                        <CatIcon size={19} style={{ color: catStyles.color }} />
                      </span>
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <strong className="text-(--color-text-strong) text-sm font-semibold">{cat.title}</strong>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full self-start"
                          style={{ background: catStyles.labelBg, color: catStyles.labelColor }}>
                          {count} oyun
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-(--color-text-muted) uppercase tracking-widest m-0">Son Seanslar</h2>
                {recentSessionFeed.length > 0 && (
                  <button type="button" className="text-xs font-semibold text-(--color-primary) bg-transparent border-none cursor-pointer hover:underline" onClick={() => setActiveAppView("reports")}>
                    Tümünü gör →
                  </button>
                )}
              </div>
              {recentSessionFeed.length === 0 ? (
                <div className="rounded-2xl border border-(--color-line) p-10 text-center flex flex-col items-center gap-4"
                  style={{ background: "var(--color-surface-strong)" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <Gamepad2 size={24} strokeWidth={1.5} style={{ color: "#818cf8" }} />
                  </div>
                  <div>
                    <p className="text-(--color-text-strong) text-sm font-semibold m-0 mb-1">Henüz seans kaydı yok</p>
                    <p className="text-(--color-text-muted) text-xs m-0">Oyun alanına geçerek ilk seansını başlatabilirsin.</p>
                  </div>
                  <button type="button" className={btnPrimary} onClick={() => setActiveAppView("games")}>Oyun Alanını Aç</button>
                </div>
              ) : (
                /* ── Premium Vertical Timeline ── */
                <div className="relative rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                  {/* Top shimmer accent */}
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.4),transparent)" }} />
                  {/* Vertical line */}
                  <div className="absolute left-[52px] top-6 bottom-6 w-px" style={{ background: "linear-gradient(180deg,rgba(99,102,241,0.3),rgba(139,92,246,0.15),rgba(6,182,212,0.1))" }} />
                  <div className="flex flex-col">
                    {recentSessionFeed.map((session, idx) => {
                      const isLight = theme === "light";
                      // Per-game accent colour
                      const gameAccents: Record<string, { color: string; bg: string; border: string }> = {
                        memory:     { color: "#818cf8", bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.2)" },
                        pairs:      { color: "#2dd4bf", bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.2)"  },
                        pulse:      { color: "#39c6ff", bg: "rgba(57,198,255,0.12)",  border: "rgba(57,198,255,0.2)"  },
                        route:      { color: "#6366f1", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.2)"  },
                        difference: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.2)" },
                        scan:       { color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.2)"  },
                      };
                      const accent = gameAccents[session.gameKey ?? ""] ?? { color: isLight ? "#4338ca" : "#818cf8", bg: isLight ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.18)" };
                      const isLast = idx === recentSessionFeed.length - 1;
                      return (
                        <div key={session.id}
                          className="relative flex items-start gap-4 px-4 py-4 transition-all duration-150 hover:bg-(--color-surface-elevated) group cursor-pointer"
                          style={{ borderBottom: !isLast ? "1px solid var(--color-line-soft)" : "none" }}
                          onClick={() => { const c = clientOptions.find(cl => cl.id === session.clientId); if (c) handleSelectClient(c.id); }}>
                          {/* Timeline dot + icon */}
                          <div className="relative flex flex-col items-center shrink-0 mt-0.5">
                            {/* Connector dot on the line */}
                            <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ring-2 ring-(--color-surface-strong) z-10"
                              style={{ background: accent.color, boxShadow: `0 0 8px ${accent.color}80`, top: "11px" }} />
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                              style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
                              <Gamepad2 size={15} style={{ color: accent.color }} />
                            </div>
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <strong className="text-(--color-text-strong) text-sm font-semibold block truncate leading-tight">{session.gameLabel}</strong>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="flex items-center gap-1 text-(--color-text-muted) text-xs font-medium">
                                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                                      style={{ background: accent.color }}>
                                      {session.clientName?.[0]?.toUpperCase() ?? "?"}
                                    </span>
                                    {session.clientName}
                                  </span>
                                  {session.durationSeconds && (
                                    <span className="flex items-center gap-0.5 text-(--color-text-muted) text-[11px]">
                                      <Clock size={9} />
                                      {formatDuration(session.durationSeconds)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Right side — score + time */}
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex items-baseline gap-0.5 px-2.5 py-1 rounded-lg"
                                  style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
                                  <strong className="text-base font-extrabold tabular-nums leading-none" style={{ color: accent.color }}>{session.score}</strong>
                                  <span className="text-[9px] font-bold text-(--color-text-muted) uppercase ml-0.5">puan</span>
                                </div>
                                <span className="text-[11px] text-(--color-text-muted)">{formatPlayedAt(session.playedAt)}</span>
                              </div>
                            </div>
                          </div>
                          {/* Hover arrow */}
                          <ChevronRight size={13} className="text-(--color-text-muted) opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                        </div>
                      );
                    })}
                  </div>
                  {/* Footer CTA */}
                  <div className="px-4 py-3 flex items-center justify-between border-t border-(--color-line)"
                    style={{ background: "rgba(255,255,255,0.015)" }}>
                    <span className="text-xs text-(--color-text-muted)">{effectiveSessionCount} toplam seans kaydı</span>
                    <button type="button"
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition-all hover:scale-105"
                      style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.2)", color: "#818cf8" }}
                      onClick={() => setActiveAppView("reports")}>
                      <BarChart3 size={11} /> Tam Raporu Gör
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



        {/* ── Clients List ── */}
        {activeAppView === "clients" && (
          <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5 lg:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-(--color-text-strong) m-0" style={{
                  background: "linear-gradient(135deg, var(--color-text-strong) 0%, #a5b4fc 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>Danışanlar</h1>
                <span className="text-(--color-text-muted) text-xs lg:text-sm">{clientOptions.length} kayıtlı danışan</span>
              </div>
              <button type="button"
                className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-all hover:scale-105 shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
                onClick={() => setShowAddClient(!showAddClient)}>
                <UserPlus size={14} />
                <span className="hidden sm:inline">Yeni Danışan</span>
                <span className="sm:hidden">Ekle</span>
              </button>
            </div>

            {showAddClient && (
              <div className="rounded-2xl border p-4 lg:p-6 relative overflow-hidden"
                style={{ background: "var(--color-surface-strong)", borderColor: "rgba(99,102,241,0.25)", boxShadow: "0 0 40px rgba(99,102,241,0.08)" }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }} />
                <h3 className="text-(--color-text-strong) font-bold mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                    <UserPlus size={14} style={{ color: "#818cf8" }} />
                  </span>
                  Yeni Danışan Ekle
                </h3>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleAddClient}>
                  <input value={addClientDraft.displayName} onChange={(e) => setAddClientDraft((c) => ({ ...c, displayName: e.target.value }))} placeholder="Danışan adı (örn. Ada Y.)" className={`${inputCls} sm:col-span-2`} required />
                  <input value={addClientDraft.ageGroup} onChange={(e) => setAddClientDraft((c) => ({ ...c, ageGroup: e.target.value }))} placeholder="Yaş grubu (örn. 7-9 yaş)" className={inputCls} />
                  <input value={addClientDraft.primaryGoal} onChange={(e) => setAddClientDraft((c) => ({ ...c, primaryGoal: e.target.value }))} placeholder="Birincil hedef (örn. Görsel tarama)" className={inputCls} />
                  <input value={addClientDraft.supportLevel} onChange={(e) => setAddClientDraft((c) => ({ ...c, supportLevel: e.target.value }))} placeholder="Destek düzeyi (örn. Orta destek)" className={`${inputCls} sm:col-span-2`} />
                  <div className="flex gap-2 sm:col-span-2 mt-1">
                    <button type="submit" className={btnPrimary}>Kaydet</button>
                    <button type="button" className={btnSecondary} onClick={() => setShowAddClient(false)}>İptal</button>
                  </div>
                </form>
              </div>
            )}

            {/* Search */}
            {clientOptions.length > 0 && (
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
                <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Danışan ara..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border"
                  style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-text-body)", outline: "none" }} />
                {clientSearch && (
                  <button type="button" onClick={() => setClientSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent p-0">
                    <X size={13} style={{ color: "var(--color-text-muted)" }} />
                  </button>
                )}
              </div>
            )}

            {/* Archive confirm modal */}
            {archiveTargetId && (() => {
              const archiveTarget = clientOptions.find((c) => c.id === archiveTargetId);
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                  <div className="rounded-3xl border p-6 max-w-sm w-full space-y-4" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                        <Archive size={18} style={{ color: "#f59e0b" }} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-(--color-text-strong) m-0">Danışanı Arşivle</h3>
                        <p className="text-(--color-text-muted) text-xs m-0">Bu işlem geri alınabilir</p>
                      </div>
                    </div>
                    <p className="text-(--color-text-body) text-sm m-0"><strong>{archiveTarget?.displayName}</strong> arşive taşınacak. Seans verileri korunur.</p>
                    <div className="flex gap-2">
                      <button type="button" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }} onClick={() => { void handleArchiveClient(archiveTargetId); }}>Arşivle</button>
                      <button type="button" className="flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer" style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }} onClick={() => setArchiveTargetId(null)}>İptal</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {showEditTherapist && activeTherapist && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                <div className="rounded-3xl border p-6 max-w-sm w-full space-y-4" style={{ background: "var(--color-surface-strong)", borderColor: "rgba(99,102,241,0.25)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                        <Edit2 size={18} style={{ color: "#818cf8" }} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-(--color-text-strong) m-0">Profili Düzenle</h3>
                        <p className="text-(--color-text-muted) text-xs m-0">Terapist bilgilerini güncelle</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowEditTherapist(false)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text-body) bg-transparent border-none cursor-pointer hover:bg-(--color-surface-elevated) transition-all">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-(--color-text-muted) font-bold uppercase tracking-wider mb-1 block">Ad Soyad</label>
                      <input value={therapistEditDraft.displayName} onChange={e => setTherapistEditDraft(d => ({ ...d, displayName: e.target.value }))}
                        placeholder="Ad Soyad" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-(--color-text-muted) font-bold uppercase tracking-wider mb-1 block">Klinik / Kurum</label>
                      <input value={therapistEditDraft.clinicName} onChange={e => setTherapistEditDraft(d => ({ ...d, clinicName: e.target.value }))}
                        placeholder="Klinik adı (isteğe bağlı)" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-(--color-text-muted) font-bold uppercase tracking-wider mb-1 block">Uzmanlık Alanı</label>
                      <input value={therapistEditDraft.specialty} onChange={e => setTherapistEditDraft(d => ({ ...d, specialty: e.target.value }))}
                        placeholder="Uzmanlık alanı (isteğe bağlı)" className={inputCls} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button"
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
                      onClick={() => void handleUpdateTherapist()}>
                      Kaydet
                    </button>
                    <button type="button"
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer"
                      style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }}
                      onClick={() => setShowEditTherapist(false)}>
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const filtered = clientSearch.trim()
                ? clientOptions.filter((c) => c.displayName.toLowerCase().includes(clientSearch.toLowerCase()) || c.primaryGoal?.toLowerCase().includes(clientSearch.toLowerCase()))
                : clientOptions;
              return clientOptions.length === 0 ? (
              <div className="rounded-2xl border border-(--color-line) p-12 text-center flex flex-col items-center gap-4"
                style={{ background: "var(--color-surface-strong)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Users size={28} strokeWidth={1.5} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <p className="text-(--color-text-strong) font-semibold m-0 mb-1">Henüz danışan eklenmedi</p>
                  <p className="text-(--color-text-muted) text-sm m-0">Yukarıdaki butonu kullanarak ilk danışanı ekleyebilirsin.</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-(--color-line) p-8 text-center" style={{ background: "var(--color-surface-strong)" }}>
                <Search size={28} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-(--color-text-muted) text-sm m-0">"{clientSearch}" için sonuç bulunamadı.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((client, clientIdx) => {
                  const sessionCount = platformOverview.recentSessions.filter((s) => s.clientId === client.id).length;
                  const clientScores = platformOverview.recentSessions.filter((s) => s.clientId === client.id);
                  const bestScore = clientScores.length > 0 ? Math.max(...clientScores.map(s => s.score)) : 0;
                  const avatarPalette = theme === "light" ? [
                    { bg: "rgba(99,102,241,0.10)", color: "#4338ca", border: "rgba(99,102,241,0.25)", glow: "rgba(99,102,241,0.1)", gradLine: "rgba(99,102,241,0.3)" },
                    { bg: "rgba(16,185,129,0.10)", color: "#047857", border: "rgba(16,185,129,0.25)", glow: "rgba(16,185,129,0.08)", gradLine: "rgba(16,185,129,0.3)" },
                    { bg: "rgba(245,158,11,0.10)", color: "#b45309", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.08)", gradLine: "rgba(245,158,11,0.3)" },
                    { bg: "rgba(6,182,212,0.10)", color: "#0e7490", border: "rgba(6,182,212,0.25)", glow: "rgba(6,182,212,0.08)", gradLine: "rgba(6,182,212,0.3)" },
                    { bg: "rgba(168,85,247,0.10)", color: "#7c3aed", border: "rgba(168,85,247,0.25)", glow: "rgba(168,85,247,0.08)", gradLine: "rgba(168,85,247,0.3)" },
                    { bg: "rgba(236,72,153,0.10)", color: "#be185d", border: "rgba(236,72,153,0.25)", glow: "rgba(236,72,153,0.08)", gradLine: "rgba(236,72,153,0.3)" },
                  ] : [
                    { bg: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "rgba(99,102,241,0.3)", glow: "rgba(99,102,241,0.12)", gradLine: "rgba(99,102,241,0.4)" },
                    { bg: "rgba(16,185,129,0.18)", color: "#6ee7b7", border: "rgba(16,185,129,0.3)", glow: "rgba(16,185,129,0.1)", gradLine: "rgba(16,185,129,0.4)" },
                    { bg: "rgba(245,158,11,0.18)", color: "#fcd34d", border: "rgba(245,158,11,0.3)", glow: "rgba(245,158,11,0.1)", gradLine: "rgba(245,158,11,0.4)" },
                    { bg: "rgba(6,182,212,0.18)", color: "#67e8f9", border: "rgba(6,182,212,0.3)", glow: "rgba(6,182,212,0.1)", gradLine: "rgba(6,182,212,0.4)" },
                    { bg: "rgba(168,85,247,0.18)", color: "#d8b4fe", border: "rgba(168,85,247,0.3)", glow: "rgba(168,85,247,0.1)", gradLine: "rgba(168,85,247,0.4)" },
                    { bg: "rgba(236,72,153,0.18)", color: "#f9a8d4", border: "rgba(236,72,153,0.3)", glow: "rgba(236,72,153,0.1)", gradLine: "rgba(236,72,153,0.4)" },
                  ];
                  const palette = avatarPalette[clientIdx % avatarPalette.length];
                  return (
                    <div key={client.id}
                      className="rounded-2xl border flex flex-col gap-3 lg:gap-4 p-4 lg:p-5 card-hover group relative overflow-hidden cursor-pointer"
                      style={{ background: "var(--color-surface-strong)", borderColor: palette.border }}
                      onClick={() => handleSelectClient(client.id)}>
                      {/* Top shimmer line */}
                      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${palette.gradLine}, transparent)` }} />
                      {/* Header row */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl font-extrabold flex items-center justify-center text-lg shrink-0"
                          style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}`, boxShadow: `0 4px 12px ${palette.glow}` }}>
                          {client.displayName[0]?.toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="font-bold text-(--color-text-strong) text-sm truncate">{client.displayName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.color }} />
                            <span className="text-(--color-text-muted) text-xs">{sessionCount} seans kaydı</span>
                          </div>
                        </div>
                        {bestScore > 0 && (
                          <div className="flex flex-col items-center px-2.5 py-1.5 rounded-xl"
                            style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
                            <strong className="text-base font-extrabold leading-none" style={{ color: palette.color }}>{bestScore}</strong>
                            <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: palette.color, opacity: 0.7 }}>en iyi</span>
                          </div>
                        )}
                      </div>
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {client.ageGroup && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>
                            {client.ageGroup}
                          </span>
                        )}
                        {client.supportLevel && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>
                            {client.supportLevel}
                          </span>
                        )}
                      </div>
                      {client.primaryGoal && (
                        <p className="text-(--color-text-soft) text-xs m-0 leading-relaxed line-clamp-2">{client.primaryGoal}</p>
                      )}
                      {/* Progress bar */}
                      {sessionCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-semibold text-(--color-text-muted) uppercase tracking-wider">Seans ilerleme</span>
                            <span className="text-[10px] font-bold" style={{ color: palette.color }}>{sessionCount} / 10</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-elevated)" }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (sessionCount / 10) * 100)}%`, background: `linear-gradient(90deg, ${palette.color}, ${palette.border})` }} />
                          </div>
                        </div>
                      )}
                      {/* Actions */}
                      <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className={`${btnSecondary} flex-1 justify-center flex items-center gap-1.5`}
                          onClick={() => handleSelectClient(client.id)}>
                          Detay
                        </button>
                        <button type="button" className={`${btnPrimary} flex-1 justify-center flex items-center gap-1.5`}
                          onClick={() => { setSelectedClientId(client.id); setActiveClientId(client.id); setActiveAppView("games"); }}>
                          <Gamepad2 size={13} /> Oyna
                        </button>
                        <button type="button"
                          title="Arşivle"
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border cursor-pointer transition-all hover:opacity-80"
                          style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.25)", color: "#f59e0b" }}
                          onClick={() => setArchiveTargetId(client.id)}>
                          <Archive size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
            })()}
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
            <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-6">

              {/* ── Back button ── */}
              <button type="button" className="flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all hover:opacity-80" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-primary)" }} onClick={() => setActiveAppView("clients")}>
                ← Danışanlar
              </button>

              {/* ── Hero card ── */}
              <div className="rounded-3xl border overflow-hidden relative" style={{
                borderColor: palette.border,
                boxShadow: isLight ? `0 4px 24px ${palette.glow}` : `0 0 80px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}>
                {/* Gradient top strip */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${palette.color}, ${palette.border})` }} />
                {/* Background glow blob */}
                <div className="absolute top-0 right-0 w-64 h-48 rounded-full pointer-events-none" style={{ background: palette.color, opacity: 0.05, filter: "blur(60px)", transform: "translate(20%,-20%)" }} />
                <div className="relative p-4 lg:p-6">
                  {/* Top row: avatar + name + badges */}
                  <div className="flex items-start gap-3 lg:gap-5 mb-4 lg:mb-6">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl font-extrabold flex items-center justify-center text-2xl lg:text-3xl" style={{ background: `linear-gradient(135deg, ${palette.bg}, ${palette.bg})`, color: palette.color, border: `2px solid ${palette.border}`, boxShadow: `0 8px 24px ${palette.glow}` }}>
                        {selectedClient.displayName[0]?.toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${palette.color}, ${palette.border})`, boxShadow: `0 2px 8px ${palette.glow}` }}>
                        <span className="text-white text-[9px] lg:text-[10px] font-black">✓</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 lg:pt-1">
                      <h1 className="text-xl lg:text-2xl font-extrabold m-0 mb-2 lg:mb-3 text-(--color-text-strong) tracking-tight truncate">{selectedClient.displayName}</h1>
                      <div className="flex flex-wrap gap-1.5 lg:gap-2">
                        {selectedClient.ageGroup && <span className="text-xs font-bold px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>{selectedClient.ageGroup}</span>}
                        {selectedClient.primaryGoal && <span className="text-xs font-bold px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full hidden sm:inline-flex" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>{selectedClient.primaryGoal}</span>}
                        {selectedClient.supportLevel && <span className="text-xs font-bold px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full hidden sm:inline-flex" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>{selectedClient.supportLevel}</span>}
                        {selectedClient.difficultyLevel && (
                          <span className="text-xs font-bold px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full hidden sm:inline-flex items-center gap-1"
                            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
                            🎯 {selectedClient.difficultyLevel}
                          </span>
                        )}
                      </div>
                      {/* Mobile-only: show goal/support as small text */}
                      {(selectedClient.primaryGoal || selectedClient.supportLevel) && (
                        <p className="sm:hidden text-xs text-(--color-text-muted) mt-1.5 m-0 truncate">
                          {[selectedClient.primaryGoal, selectedClient.supportLevel, selectedClient.difficultyLevel].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mini stat row */}
                  <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4 lg:mb-5">
                    {[
                      { label: "Seans", value: clientSessions.length, icon: "🎮" },
                      { label: "En İyi", value: bestScore || "—", icon: "⭐" },
                      { label: "Not", value: clientNotes.length, icon: "📋" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="rounded-xl lg:rounded-2xl p-2.5 lg:p-4 text-center relative overflow-hidden" style={{ background: isLight ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.3)", border: `1px solid ${palette.border}` }}>
                        <span className="text-lg lg:text-xl mb-0.5 block">{icon}</span>
                        <strong className="text-xl lg:text-2xl font-extrabold block leading-none mb-0.5" style={{ color: palette.color }}>{value}</strong>
                        <span className="text-(--color-text-muted) text-[9px] lg:text-[10px] font-semibold uppercase tracking-wider">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button type="button" className="flex-1 flex items-center justify-center gap-2 font-bold text-sm px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-white cursor-pointer border-none transition-all hover:opacity-90 active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${palette.color}, ${palette.border})`, boxShadow: `0 6px 20px ${palette.glow}` }} onClick={() => { setActiveClientId(selectedClient.id); setActiveAppView("games"); }}>
                      <Gamepad2 size={15} /> Bu Danışanla Oyna
                    </button>
                    <button type="button" data-tooltip="PDF Rapor Al" data-tooltip-dir="top"
                      className="flex items-center justify-center gap-1.5 font-bold text-sm px-4 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl cursor-pointer border-none transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)", color: "var(--color-text-soft)" }}
                      onClick={() => handlePrintReport(selectedClient)}>
                      <FileText size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)" }}>
                {([
                  { key: "notes",    label: "📝 Notlar" },
                  { key: "plan",     label: "📅 Plan" },
                  { key: "scores",   label: "📊 Skorlar" },
                  { key: "progress", label: "📈 İlerleme" },
                ] as const).map(({ key, label }) => (
                  <button key={key} type="button"
                    className="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 border-none cursor-pointer"
                    style={{
                      background: clientDetailTab === (key as typeof clientDetailTab) ? "var(--color-surface-strong)" : "transparent",
                      color: clientDetailTab === (key as typeof clientDetailTab) ? "var(--color-text-strong)" : "var(--color-text-soft)",
                      boxShadow: clientDetailTab === (key as typeof clientDetailTab) ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                    }}
                    onClick={() => setClientDetailTab(key as typeof clientDetailTab)}>
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Notes ── */}
              {clientDetailTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-(--color-text-muted) m-0">Seans Notları</h3>
                    <button type="button" className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl text-white cursor-pointer border-none transition-all hover:opacity-90 active:scale-95" style={{ background: `linear-gradient(135deg, ${palette.color}, ${palette.border})`, boxShadow: `0 3px 12px ${palette.glow}` }} onClick={() => setShowNoteForm(!showNoteForm)}>+ Not Ekle</button>
                  </div>

                  {showNoteForm && (
                    <div className="rounded-2xl border p-5 space-y-3 relative overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: palette.border }}>
                      <div className="h-0.5 absolute top-0 left-0 right-0" style={{ background: `linear-gradient(90deg, ${palette.color}, ${palette.border})` }} />
                      <div className="flex items-center justify-between pt-1">
                        <h4 className="text-(--color-text-strong) font-bold m-0">Yeni Not</h4>
                        {/* Mode toggle */}
                        <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}>
                          {(["free", "soap"] as NoteMode[]).map((m) => (
                            <button key={m} type="button"
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none"
                              style={{
                                background: noteMode === m ? "var(--color-surface-strong)" : "transparent",
                                color: noteMode === m ? palette.color : "var(--color-text-muted)",
                                boxShadow: noteMode === m ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                              }}
                              onClick={() => setNoteMode(m)}>
                              {m === "free" ? "Serbest" : "SOAP"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input type="date" value={noteForm.date} onChange={(e) => setNoteForm((c) => ({ ...c, date: e.target.value }))} className={inputCls} />
                      {noteMode === "free" ? (
                        <textarea value={noteForm.content} onChange={(e) => setNoteForm((c) => ({ ...c, content: e.target.value }))} placeholder="Seans notu, gözlem veya hedef..." className={`${inputCls} resize-none`} rows={4} />
                      ) : (
                        <div className="space-y-2">
                          {(["s", "o", "a", "p"] as (keyof SoapNoteContent)[]).map((field) => {
                            const labels = { s: "S — Subjektif (Danışan ifadesi)", o: "O — Objektif (Gözlem & ölçüm)", a: "A — Assessment (Değerlendirme)", p: "P — Plan (Sonraki adımlar)" };
                            return (
                              <div key={field} className="space-y-0.5">
                                <p className="text-[10px] font-extrabold uppercase tracking-wider m-0" style={{ color: palette.color }}>{labels[field]}</p>
                                <textarea value={soapDraft[field]} onChange={(e) => setSoapDraft((c) => ({ ...c, [field]: e.target.value }))} placeholder={`${field.toUpperCase()} alanı...`} className={`${inputCls} resize-none`} rows={2} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button type="button" disabled={isNotesLoading} className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white cursor-pointer border-none transition-all hover:opacity-90 disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${palette.color}, ${palette.border})`, boxShadow: `0 3px 12px ${palette.glow}` }} onClick={() => { void handleAddNoteDB(); }}>Kaydet</button>
                        <button type="button" className={btnSecondary} onClick={() => { setShowNoteForm(false); setNoteMode("free"); setSoapDraft({ s: "", o: "", a: "", p: "" }); }}>İptal</button>
                      </div>
                    </div>
                  )}

                  {clientNotes.length === 0 ? (
                    <div className="rounded-2xl border border-(--color-line) p-12 text-center" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-(--color-text-muted) text-sm m-0 font-medium">Henüz not eklenmedi.</p>
                      <p className="text-(--color-text-muted) text-xs mt-1 m-0">İlk seans notunu eklemek için yukarıdaki butona tıklayın.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientNotes.map((note) => (
                        <div key={note.id} className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: isLight ? palette.border : "var(--color-line)" }}>
                          <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${palette.color}, ${palette.border})` }} />
                          <div className="px-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>{formatDate(note.date)}</span>
                              <button type="button" className="text-xs font-bold px-2.5 py-1.5 rounded-xl border-none cursor-pointer transition-all hover:opacity-70 active:scale-95" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }} onClick={() => { void handleDeleteNoteDB(note.id); }}>Sil</button>
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
                                    {/* Completed checkbox */}
                                    <button type="button"
                                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-none cursor-pointer transition-all"
                                      style={{
                                        background: entry.completed ? palette.color : palette.bg,
                                        border: `1.5px solid ${palette.border}`,
                                      }}
                                      title={entry.completed ? "Tamamlandı" : "Tamamlandı işaretle"}
                                      onClick={() => {
                                        setPlanEdits((current) => {
                                          const updated = [...current[day]];
                                          updated[entryIndex] = { ...updated[entryIndex], completed: !updated[entryIndex].completed };
                                          return { ...current, [day]: updated };
                                        });
                                      }}>
                                      {entry.completed ? <Check size={10} className="text-white" /> : <span className="text-[8px] font-extrabold" style={{ color: palette.color }}>{entryIndex + 1}</span>}
                                    </button>

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

                  <button type="button" className={btnPrimary} onClick={() => { void handleSaveWeeklyPlanDB(); }}>
                    Planı Kaydet
                  </button>
                </div>
              )}

              {/* ── Score History ── */}
              {clientDetailTab === "scores" && (
                <div className="space-y-4">
                  {/* ── Overall score summary strip ── */}
                  {clientSessions.length > 0 && (() => {
                    const avgScore = Math.round(clientSessions.reduce((s,ss) => s + ss.score, 0) / clientSessions.length);
                    const maxS = Math.max(...clientSessions.map(s => s.score));
                    const minS = Math.min(...clientSessions.map(s => s.score));
                    return (
                      <div className="relative overflow-hidden rounded-3xl border p-5" style={{ borderColor: palette.border, background: `linear-gradient(135deg, ${palette.gradientFrom} 0%, var(--color-surface-strong) 100%)` }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${palette.color}, transparent)` }} />
                        <div className="flex items-center gap-6">
                          {/* Mini SVG sparkline */}
                          <div className="shrink-0">
                            <svg width="96" height="48" viewBox="0 0 96 48" className="overflow-visible">
                              <defs>
                                <linearGradient id={`spark-grad-${selectedClientId}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={palette.color} stopOpacity="0.3" />
                                  <stop offset="100%" stopColor={palette.color} stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              {(() => {
                                const pts = clientSessions.slice(0, 8).reverse();
                                if (pts.length < 2) return null;
                                const maxV = Math.max(...pts.map(p => p.score), 1);
                                const minV = Math.min(...pts.map(p => p.score), 0);
                                const range = maxV - minV || 1;
                                const xs = pts.map((_, i) => (i / (pts.length - 1)) * 88 + 4);
                                const ys = pts.map(p => 44 - ((p.score - minV) / range) * 40);
                                const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
                                const area = `${d} L${xs[xs.length-1]},48 L${xs[0]},48 Z`;
                                return (
                                  <>
                                    <path d={area} fill={`url(#spark-grad-${selectedClientId})`} />
                                    <path d={d} fill="none" stroke={palette.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    {xs.map((x, i) => (
                                      <circle key={i} cx={x} cy={ys[i]} r="2.5" fill={palette.color} />
                                    ))}
                                  </>
                                );
                              })()}
                            </svg>
                            <p className="text-[10px] text-(--color-text-muted) text-center mt-1">Son {Math.min(clientSessions.length, 8)} seans</p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 flex-1">
                            {[
                              { l: "Ortalama", v: avgScore, icon: "⚡" },
                              { l: "En Yüksek", v: maxS, icon: "🏆" },
                              { l: "En Düşük", v: minS, icon: "📉" },
                            ].map(({ l, v, icon }) => (
                              <div key={l} className="text-center">
                                <span className="text-lg block">{icon}</span>
                                <strong className="text-2xl font-extrabold tabular-nums" style={{ color: palette.color }}>{v}</strong>
                                <span className="text-[10px] text-(--color-text-muted) block">{l}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Score Trend Chart ── */}
                  {clientSessions.length >= 3 && (() => {
                    const sorted = [...clientSessions].sort((a, b) => (a.playedAt ?? "").localeCompare(b.playedAt ?? "")).slice(-20);
                    const maxV = Math.max(...sorted.map(s => s.score), 1);
                    const W = 420; const H = 80; const PAD = 8;
                    const xs = sorted.map((_, i) => PAD + (i / (sorted.length - 1)) * (W - PAD * 2));
                    const ys = sorted.map(s => H - PAD - ((s.score / maxV) * (H - PAD * 2)));
                    const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
                    const areaPath = `${linePath} L${xs[xs.length-1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;
                    const gradId = `trend-${selectedClientId}`;
                    return (
                      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
                        <div className="px-4 pt-4 pb-1 flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-(--color-text-muted)">Skor Trendi</span>
                          <span className="text-[10px] text-(--color-text-muted)">Son {sorted.length} seans</span>
                        </div>
                        <div className="px-4 pb-4">
                          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "80px" }}>
                            <defs>
                              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={palette.color} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={palette.color} stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path d={areaPath} fill={`url(#${gradId})`} />
                            <path d={linePath} fill="none" stroke={palette.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            {xs.map((x, i) => (
                              <circle key={i} cx={x} cy={ys[i]} r="3" fill={palette.color} fillOpacity="0.8" />
                            ))}
                          </svg>
                          <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-(--color-text-muted)">{sorted[0]?.playedAt?.slice(0, 10) ?? ""}</span>
                            <span className="text-[9px] text-(--color-text-muted)">{sorted[sorted.length-1]?.playedAt?.slice(0, 10) ?? ""}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-(--color-text-muted) m-0">Oyun Bazlı Skorlar</h3>
                  {GAME_TABS.map((game) => {
                    const gameSessions = platformOverview.recentSessions.filter((s) => s.gameKey === game.key && s.clientId === selectedClient.id);
                    const gameScore = scoreboard[game.key];
                    if (gameScore.plays === 0) return null;
                    const maxScore = Math.max(gameScore.best, 1);
                    const pct = Math.min(100, (gameScore.best / maxScore) * 100);
                    return (
                      <div key={game.key} className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: isLight ? palette.border : "var(--color-line)" }}>
                        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${palette.color}, ${palette.border})` }} />
                        <div className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <strong className="text-(--color-text-strong) font-bold">{game.title}</strong>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold px-3 py-1.5 rounded-full" style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>⭐ {gameScore.best}</span>
                              <span className="text-(--color-text-muted) text-xs font-semibold">{gameScore.plays}× oynadı</span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${palette.color}, ${palette.border})` }} />
                          </div>
                          {gameSessions.length > 0 && (
                            <div className="grid gap-1.5">
                              {gameSessions.slice(0, 5).map((session) => (
                                <div key={session.id} className="flex items-center justify-between rounded-xl px-3 py-2.5 border" style={{ background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)", borderColor: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)" }}>
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: palette.bg }}>
                                      <span className="text-[10px] font-extrabold" style={{ color: palette.color }}>▶</span>
                                    </div>
                                    <div>
                                      <span className="text-(--color-text-soft) text-xs font-medium">{formatPlayedAt(session.playedAt)}</span>
                                      {session.durationSeconds ? <span className="text-(--color-text-muted) text-[10px] ml-1.5">· {formatDuration(session.durationSeconds)}</span> : null}
                                    </div>
                                  </div>
                                  <strong className="text-lg font-extrabold tabular-nums" style={{ color: palette.color }}>{session.score}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {GAME_TABS.every((g) => scoreboard[g.key].plays === 0) && (
                    <div className="rounded-2xl border border-(--color-line) p-12 text-center" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="text-4xl mb-3">🎮</div>
                      <p className="text-(--color-text-muted) text-sm m-0 font-medium">Henüz oyun skoru yok.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Progress Tab (Client Detail) ── */}
              {clientDetailTab === "progress" && (() => {
                const clientProgress = tpProgressEntries.filter(e => e.clientId === selectedClientId).sort((a,b) => b.date.localeCompare(a.date));
                const domain = tpSelectedDomain ? THERAPY_DOMAINS.find(d => d.key === tpSelectedDomain) : null;
                const goals = domain?.goals ?? [];
                const goalAverages = goals.map(goal => {
                  const entries = clientProgress.filter(e => e.goalId === goal.id);
                  const avg = entries.length > 0 ? Math.round(entries.reduce((s,e) => s + e.value, 0) / entries.length) : 0;
                  return { ...goal, average: avg, count: entries.length, entries };
                });
                const overallAvg = goalAverages.length > 0 ? Math.round(goalAverages.reduce((s,g) => s + g.average, 0) / goalAverages.length) : 0;

                return (
                  <div className="space-y-5">
                    {/* ── Donut + Overall ── */}
                    <div className="relative overflow-hidden rounded-3xl border p-6" style={{ borderColor: palette.border, background: `linear-gradient(135deg, ${palette.gradientFrom} 0%, var(--color-surface-strong) 100%)` }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${palette.color}, transparent)` }} />
                      <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={palette.color} strokeWidth="3" strokeDasharray={`${overallAvg}, 100`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xl font-black" style={{ color: palette.color }}>{overallAvg}%</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-extrabold text-(--color-text-strong) m-0 mb-1">Genel Bağımsızlık Düzeyi</h3>
                          <p className="text-(--color-text-soft) text-sm m-0">{clientProgress.length} kayıt · {goalAverages.filter(g => g.count > 0).length}/{goals.length} hedef takipte</p>
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallAvg}%`, background: `linear-gradient(90deg, ${palette.color}, ${palette.border})` }} />
                          </div>
                          {clientProgress.length === 0 && (
                            <button type="button"
                              className="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl text-white border-none cursor-pointer transition-all"
                              style={{ background: `linear-gradient(135deg, ${palette.color}, ${palette.border})` }}
                              onClick={() => { setTpSelectedClientId(selectedClientId); setActiveAppView("therapy-program"); setTpActiveTab("progress"); }}>
                              Terapi Programına Git →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── Goal bars ── */}
                    {goalAverages.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-(--color-text-muted) m-0">Hedef Bazlı İlerleme</h4>
                        {goalAverages.map((ga) => {
                          const barColor = ga.average >= 75 ? "#10b981" : ga.average >= 50 ? "#f59e0b" : ga.average >= 25 ? "#2563eb" : "#ef4444";
                          const barLabel = ga.average >= 75 ? "Bağımsız" : ga.average >= 50 ? "Min. Yardım" : ga.average >= 25 ? "Orta Yardım" : "Max. Yardım";
                          return (
                            <div key={ga.id} className="rounded-2xl border border-(--color-line) p-4" style={{ background: "var(--color-surface-strong)" }}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-(--color-text-body) font-semibold flex-1 mr-2">{ga.label}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: barColor }}>{barLabel}</span>
                                  <span className="text-lg font-extrabold tabular-nums" style={{ color: barColor }}>{ga.average}%</span>
                                </div>
                              </div>
                              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ga.average}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}99)` }} />
                              </div>
                              {ga.count > 0 && (
                                <p className="text-[10px] text-(--color-text-muted) mt-1.5 m-0">{ga.count} ölçüm · son güncelleme: {ga.entries[0]?.date ?? "—"}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-(--color-line) p-10 text-center" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="text-4xl mb-3">📈</div>
                        <p className="text-(--color-text-muted) text-sm m-0 mb-3">İlerleme takibi için önce Terapi Programından bir alan seçin.</p>
                        <button type="button"
                          className="text-xs font-bold px-4 py-2 rounded-xl text-white border-none cursor-pointer"
                          style={{ background: `linear-gradient(135deg, ${palette.color}, ${palette.border})` }}
                          onClick={() => { setTpSelectedClientId(selectedClientId); setActiveAppView("therapy-program"); setTpActiveTab("domains"); }}>
                          Terapi Programını Aç →
                        </button>
                      </div>
                    )}

                    {/* ── Recent progress log ── */}
                    {clientProgress.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-(--color-text-muted) m-0">Son Kayıtlar</h4>
                        {clientProgress.slice(0, 6).map((entry, i) => {
                          const goal = goals.find(g => g.id === entry.goalId);
                          const barColor = entry.value >= 75 ? "#10b981" : entry.value >= 50 ? "#f59e0b" : "#2563eb";
                          return (
                            <div key={entry.id} className="flex items-start gap-3 p-3.5 rounded-2xl border border-(--color-line)" style={{ background: "var(--color-surface-elevated)", animation: `result-stat-in 0.3s ease ${i * 0.05}s both` }}>
                              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-black" style={{ background: barColor }}>
                                {entry.value}%
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-(--color-text-strong) m-0 truncate">{goal?.label ?? "Hedef"}</p>
                                {entry.note && <p className="text-xs text-(--color-text-muted) m-0 mt-0.5 italic">"{entry.note}"</p>}
                              </div>
                              <span className="text-[10px] text-(--color-text-muted) shrink-0 tabular-nums">{entry.date}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── SMART Goals ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-(--color-text-muted) m-0">SMART Hedefler</h4>
                        <button type="button" onClick={() => setShowGoalForm(v => !v)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white border-none cursor-pointer transition-all hover:opacity-80"
                          style={{ background: `linear-gradient(135deg, ${palette.color}, ${palette.border})` }}>
                          <Plus size={12} /> Hedef Ekle
                        </button>
                      </div>

                      {showGoalForm && (
                        <div className="rounded-2xl border border-(--color-line) p-4 space-y-3" style={{ background: "var(--color-surface-strong)" }}>
                          <input value={goalDraft.title} onChange={e => setGoalDraft(d => ({ ...d, title: e.target.value }))}
                            placeholder="Hedef başlığı (örn. Makas kullanımı)" className={inputCls} />
                          <input value={goalDraft.description} onChange={e => setGoalDraft(d => ({ ...d, description: e.target.value }))}
                            placeholder="Açıklama (isteğe bağlı)" className={inputCls} />
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-(--color-text-muted) font-bold uppercase tracking-wider mb-1 block">Hedef Değer (%)</label>
                              <input type="number" min={1} max={100} value={goalDraft.targetValue} onChange={e => setGoalDraft(d => ({ ...d, targetValue: Number(e.target.value) }))}
                                className={inputCls} />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-(--color-text-muted) font-bold uppercase tracking-wider mb-1 block">Son Tarih</label>
                              <input type="date" value={goalDraft.deadline} onChange={e => setGoalDraft(d => ({ ...d, deadline: e.target.value }))}
                                className={inputCls} />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowGoalForm(false)}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer border border-(--color-line) text-(--color-text-muted) hover:opacity-80 transition-all" style={{ background: "transparent" }}>
                              İptal
                            </button>
                            <button type="button" onClick={handleAddGoal} disabled={!goalDraft.title.trim()}
                              className="text-xs font-bold px-4 py-1.5 rounded-xl text-white border-none cursor-pointer transition-all hover:opacity-80 disabled:opacity-40"
                              style={{ background: `linear-gradient(135deg, ${palette.color}, ${palette.border})` }}>
                              Kaydet
                            </button>
                          </div>
                        </div>
                      )}

                      {clientGoals.length === 0 && !showGoalForm && (
                        <div className="rounded-2xl border border-dashed border-(--color-line) p-8 text-center" style={{ background: "var(--color-surface-strong)" }}>
                          <div className="text-3xl mb-2">🎯</div>
                          <p className="text-(--color-text-muted) text-sm m-0">Bu danışan için henüz SMART hedef tanımlanmadı.</p>
                        </div>
                      )}

                      {clientGoals.map((g, i) => {
                        const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
                        const clampedPct = Math.min(pct, 100);
                        const goalColor = clampedPct >= 100 ? "#10b981" : clampedPct >= 60 ? "#f59e0b" : palette.color;
                        const isOverdue = g.deadline && g.deadline < getTodayString() && clampedPct < 100;
                        return (
                          <div key={g.id} className="rounded-2xl border border-(--color-line) p-4 space-y-3" style={{ background: "var(--color-surface-strong)", animation: `result-stat-in 0.3s ease ${i * 0.06}s both` }}>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-(--color-text-strong)">{g.title}</span>
                                  {clampedPct >= 100 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#10b981" }}>✓ Tamamlandı</span>}
                                  {isOverdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#ef4444" }}>Gecikmiş</span>}
                                </div>
                                {g.description && <p className="text-xs text-(--color-text-muted) m-0 mt-0.5">{g.description}</p>}
                                {g.deadline && <p className="text-[10px] text-(--color-text-muted) m-0 mt-0.5">Son tarih: {g.deadline}</p>}
                              </div>
                              <button type="button" onClick={() => handleDeleteGoal(g.id)}
                                className="text-(--color-text-muted) hover:text-red-400 transition-colors cursor-pointer border-none bg-transparent p-1 shrink-0">
                                <X size={14} />
                              </button>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-(--color-text-muted) font-bold uppercase tracking-wider">İlerleme</span>
                                <span className="text-sm font-extrabold tabular-nums" style={{ color: goalColor }}>{g.currentValue}/{g.targetValue} <span className="text-[10px] text-(--color-text-muted)">({clampedPct}%)</span></span>
                              </div>
                              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${clampedPct}%`, background: `linear-gradient(90deg, ${goalColor}, ${goalColor}99)` }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="range" min={0} max={g.targetValue} value={g.currentValue}
                                onChange={e => handleUpdateGoalProgress(g.id, Number(e.target.value))}
                                className="flex-1 h-1.5 rounded-full cursor-pointer accent-indigo-500" />
                              <span className="text-[10px] text-(--color-text-muted) shrink-0 w-16 text-right tabular-nums">{g.currentValue}/{g.targetValue}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>
          );
        })()}

        {/* ── Games View ── */}
        {activeAppView === "games" && (
          <div className="flex flex-col h-full">
            {/* ── Premium Desktop Game Header ── */}
            <div className="hidden lg:flex items-center justify-between px-6 h-16 border-b border-(--color-line) sticky top-0 z-20" style={{
              background: "var(--color-chrome-header)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 1px 0 var(--color-line), 0 4px 24px rgba(0,0,0,0.08)",
            }}>
              {/* Left: title + session info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)", boxShadow: "0 2px 8px var(--color-primary)/30" }}>
                    <Gamepad2 size={15} className="text-white" />
                  </div>
                  <span className="font-bold text-(--color-text-strong) text-sm tracking-tight">Oyun Alanı</span>
                </div>
                <div className="w-px h-5 shrink-0" style={{ background: "var(--color-line)" }} />
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: gameElapsed > 0 ? "rgba(16,185,129,0.08)" : "var(--color-primary)/8", border: gameElapsed > 0 ? "1px solid rgba(16,185,129,0.25)" : "1px solid var(--color-primary)/15" }}>
                  <span className="w-2 h-2 rounded-full shrink-0 transition-all" style={{ background: gameElapsed > 0 ? "#10b981" : "var(--color-primary)", boxShadow: gameElapsed > 0 ? "0 0 6px rgba(16,185,129,0.7)" : "none" }} />
                  <span className="text-xs font-semibold max-w-56 truncate" style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-primary)" }}>
                    {activeTherapist?.displayName ?? "—"}&nbsp;·&nbsp;{activeClient?.displayName ?? "Danışan seç"}
                  </span>
                </div>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${platformStatus === "online" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : platformStatus === "schema_missing" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : platformStatus === "error" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-(--color-text-muted) border-(--color-line)"}`}>
                  {getDatabaseStatusLabel(platformStatus)}
                </span>
              </div>
              {/* Right: timer + back */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-2xl px-3 py-1.5 border" style={{
                  background: gameElapsed > 0 ? "rgba(16,185,129,0.08)" : "var(--color-surface-strong)",
                  borderColor: gameElapsed > 0 ? "rgba(16,185,129,0.25)" : "var(--color-line)",
                }}>
                  <Clock size={13} style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-primary)" }} />
                  <span className="font-mono font-bold text-sm tabular-nums" style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-text-strong)", letterSpacing: "-0.02em" }}>{formatElapsed(gameElapsed)}</span>
                  <button type="button" className="text-[11px] font-semibold hover:opacity-70 bg-transparent border-none cursor-pointer ml-0.5 transition-opacity" style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-primary)" }} onClick={resetSessionClock}>Sıfırla</button>
                </div>
                <button type="button" className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border cursor-pointer transition-all hover:opacity-80" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }} onClick={() => setActiveAppView("dashboard")}>
                  ← Panel
                </button>
              </div>
            </div>

            {/* ── Mobile game nav ── */}
            <div className="flex lg:hidden flex-col gap-1.5 px-3 py-2.5 border-b border-(--color-line) shrink-0" style={{ background: "var(--color-chrome-header)", backdropFilter: "blur(20px)" }}>
              {/* Row 1: selectors + timer */}
              <div className="flex items-center gap-1.5">
                <select value={activeTherapist?.id ?? ""} onChange={(event) => setActiveTherapistId(event.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-(--color-line) rounded-lg bg-(--color-surface-strong) text-(--color-text-body) min-w-0">
                  {therapistOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                </select>
                <select value={activeClient?.id ?? ""} onChange={(event) => setActiveClientId(event.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-(--color-line) rounded-lg bg-(--color-surface-strong) text-(--color-text-body) min-w-0">
                  {clientOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                </select>
                <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 border shrink-0" style={{ background: gameElapsed > 0 ? "rgba(16,185,129,0.1)" : "var(--color-surface-strong)", borderColor: gameElapsed > 0 ? "rgba(16,185,129,0.3)" : "var(--color-line)" }}>
                  <Clock size={10} style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-text-muted)" }} />
                  <span className="font-mono font-bold text-xs tabular-nums" style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-text-strong)" }}>{formatElapsed(gameElapsed)}</span>
                  <button type="button" className="hover:opacity-70 bg-transparent border-none cursor-pointer ml-0.5 transition-opacity" style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-primary)" }} onClick={resetSessionClock}><RotateCcw size={9} /></button>
                </div>
              </div>
              {/* Row 2: category + game tabs — scroll snap */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 tab-scroll">
                {GAME_CATEGORIES.map((category) => {
                  const isActive = activeTab.category === category.key;
                  const CI = CATEGORY_ICONS[category.key];
                  return (
                    <button key={category.key} type="button" className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${isActive ? "bg-(--color-primary) text-white border-(--color-primary)" : "bg-(--color-surface-elevated) text-(--color-text-soft) border-(--color-line)"}`} onClick={() => openCategory(category.key)}>
                      <CI size={11} /> {category.title.split(" ")[0]}
                    </button>
                  );
                })}
                <div className="w-px h-4 shrink-0 self-center" style={{ background: "var(--color-line)" }} />
                {visibleTabs.map((tab) => (
                  <button key={tab.key} type="button" className={`shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${activeGame === tab.key ? "border-(--color-primary)/40 text-(--color-primary)" : "bg-(--color-surface-elevated) text-(--color-text-soft) border-(--color-line)"}`}
                    style={activeGame === tab.key ? { background: "rgba(99,102,241,0.1)" } : {}}
                    onClick={() => setActiveGame(tab.key)}>
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* ── Premium Game Sidebar ── */}
              <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-(--color-line) overflow-y-auto" style={{ background: "var(--color-sidebar)", backdropFilter: "blur(24px)" }}>

                {/* Session card */}
                <div className="p-4 border-b border-(--color-line) space-y-3">
                  {/* Status indicator */}
                  <div className="rounded-2xl p-3.5 relative overflow-hidden" style={{
                    background: gameElapsed > 0 ? "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)" : "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)",
                    border: gameElapsed > 0 ? "1px solid rgba(16,185,129,0.25)" : "1px solid var(--color-primary)/15",
                  }}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none" style={{ background: gameElapsed > 0 ? "#10b981" : "var(--color-primary)", opacity: 0.06, filter: "blur(20px)", transform: "translate(30%,-30%)" }} />
                    <div className="relative flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: gameElapsed > 0 ? "#10b981" : "#64748b", boxShadow: gameElapsed > 0 ? "0 0 8px rgba(16,185,129,0.8)" : "none" }} />
                        <span className="text-xs font-bold" style={{ color: gameElapsed > 0 ? "#10b981" : "var(--color-text-muted)" }}>
                          {gameElapsed > 0 ? "Seans Aktif" : "Seans Bekliyor"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs tabular-nums" style={{ background: gameElapsed > 0 ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", color: gameElapsed > 0 ? "#10b981" : "var(--color-text-muted)" }}>
                        <Clock size={10} />
                        {formatElapsed(gameElapsed)}
                      </div>
                    </div>
                    {activeClient && (
                      <div className="relative flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0" style={{ background: gameElapsed > 0 ? "rgba(16,185,129,0.2)" : "var(--color-primary)/15", color: gameElapsed > 0 ? "#10b981" : "var(--color-primary)" }}>
                          {activeClient.displayName[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-(--color-text-strong) truncate">{activeClient.displayName}</span>
                      </div>
                    )}
                  </div>

                  {/* Selectors */}
                  <div className="space-y-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-(--color-text-muted) font-extrabold uppercase tracking-widest">Terapist</span>
                      <select value={activeTherapist?.id ?? ""} onChange={(event) => setActiveTherapistId(event.target.value)} className={inputCls}>
                        {therapistOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-(--color-text-muted) font-extrabold uppercase tracking-widest">Danışan</span>
                      <select value={activeClient?.id ?? ""} onChange={(event) => setActiveClientId(event.target.value)} className={inputCls}>
                        {clientOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                      </select>
                    </label>
                  </div>

                  {/* CTA */}
                  <button type="button" className="w-full flex items-center justify-center gap-2 font-bold text-sm px-4 py-2.5 rounded-2xl text-white cursor-pointer border-none transition-all hover:opacity-90 active:scale-[0.98]" style={{ background: gameElapsed > 0 ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, var(--color-primary), #8b5cf6)", boxShadow: gameElapsed > 0 ? "0 4px 16px rgba(16,185,129,0.35)" : "0 4px 16px var(--color-primary)/35" }} onClick={resetSessionClock}>
                    <span>{gameElapsed > 0 ? "↺" : "▶"}</span>
                    {gameElapsed > 0 ? "Yeni Seans" : "Seansı Başlat"}
                  </button>
                </div>

                {/* Categories */}
                <div className="p-4 border-b border-(--color-line)">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted) block mb-3 px-1">Kategoriler</span>
                  <div className="flex flex-col gap-1">
                    {GAME_CATEGORIES.map((category) => {
                      const isActive = activeTab.category === category.key;
                      const CatIcon = CATEGORY_ICONS[category.key];
                      const catCount = GAME_TABS.filter((g) => g.category === category.key).length;
                      return (
                        <button key={category.key} type="button" aria-pressed={isActive} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl w-full text-left cursor-pointer border transition-all" style={{ background: isActive ? "var(--color-primary)/8" : "transparent", borderColor: isActive ? "var(--color-primary)/20" : "transparent" }} onClick={() => openCategory(category.key)}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all" style={{ background: isActive ? "linear-gradient(135deg, var(--color-primary), #8b5cf6)" : "var(--color-surface-elevated)", color: isActive ? "white" : "var(--color-text-muted)", boxShadow: isActive ? "0 4px 12px var(--color-primary)/30" : "none" }}>
                            <CatIcon size={15} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate leading-tight" style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-strong)" }}>{category.title}</span>
                            <span className="text-[11px]" style={{ color: isActive ? "var(--color-primary)/70" : "var(--color-text-muted)" }}>{catCount} oyun</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Games list */}
                <div className="p-4 border-b border-(--color-line)">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted) block mb-3 px-1">Oyunlar</span>
                  <div className="flex flex-col gap-1">
                    {visibleTabs.map((tab) => (
                      <button key={tab.key} type="button" aria-pressed={activeGame === tab.key} className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer w-full text-left transition-all" style={{ background: activeGame === tab.key ? "var(--color-primary)/8" : "transparent" }} onClick={() => setActiveGame(tab.key)}>
                        {activeGame === tab.key && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full" style={{ background: "var(--color-primary)" }} />}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: activeGame === tab.key ? "var(--color-primary)" : "var(--color-text-muted)" }}>{tab.kicker}</span>
                          <span className="text-sm font-semibold truncate" style={{ color: activeGame === tab.key ? "var(--color-primary)" : "var(--color-text-strong)" }}>{tab.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score summary */}
                <div className="p-4 border-b border-(--color-line)">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted) block mb-3 px-1">Skor Özeti</span>
                  <div className="flex flex-col gap-2.5">
                    {scoreCards.map((card) => (
                      <div key={card.label} className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="flex-1 text-(--color-text-soft) truncate font-medium">{card.label}</span>
                          <span
                            data-tooltip={card.plays > 0 ? `En iyi: ${card.best} · Son: ${card.last} · ${card.plays}× oynadı` : "Henüz oynanmadı"}
                            data-tooltip-dir="left"
                            className="font-extrabold tabular-nums" style={{ color: card.best > 0 ? "var(--color-primary)" : "var(--color-text-muted)" }}>{card.best}</span>
                          <span className="text-(--color-text-muted) text-[10px]">{card.plays}×</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-elevated)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: card.best > 0 ? `${Math.min(100, card.best)}%` : "0%", background: "linear-gradient(90deg, var(--color-primary), #8b5cf6)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sessions */}
                {recentSessionFeed.length > 0 && (
                  <div className="p-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted) block mb-3 px-1">Son Oturumlar</span>
                    <div className="flex flex-col gap-2">
                      {recentSessionFeed.slice(0, 3).map((session) => (
                        <div key={session.id}
                          data-tooltip={`${session.clientName} · Skor: ${session.score}`}
                          data-tooltip-dir="right"
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 border border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-extrabold" style={{ background: "var(--color-primary)/10", color: "var(--color-primary)" }}>
                            {session.score}
                          </div>
                          <div className="flex-1 min-w-0">
                            <strong className="text-(--color-text-strong) text-xs font-semibold block truncate">{session.gameLabel}</strong>
                            <p className="text-(--color-text-muted) text-[11px] m-0 truncate">{session.clientName} · {formatPlayedAt(session.playedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              <section className="flex-1 overflow-y-auto" style={{ background: "var(--color-page-bg)" }}>
              {(() => {
                const gameBtn = "flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-2xl transition-all cursor-pointer border-none active:scale-95";
                const gameBtnSec = "flex items-center gap-2 text-slate-300 text-sm font-semibold px-6 py-3 rounded-2xl transition-all cursor-pointer border border-white/15 hover:border-white/30 hover:text-white";
                return (
              <div className="p-4 lg:p-6 max-w-4xl mx-auto flex flex-col gap-5">

                {/* ── Active Game: Top Info Bar ── */}
                <div className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                  <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, var(--color-primary), #8b5cf6, #ec4899)" }} />
                  <div className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted) m-0 mb-0.5">{activeCategory.title}</p>
                      <h2 className="text-base font-extrabold text-(--color-text-strong) m-0 truncate">{activeTab.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeTab.goals.slice(0, 2).map((goal) => (
                        <span key={goal} data-tooltip={`Terapi hedefi: ${goal}`} data-tooltip-dir="bottom" className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--color-primary)/10", color: "var(--color-primary)", border: "1px solid var(--color-primary)/20" }}>{goal}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {activeGame === "memory" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(19,184,255,0.18)", boxShadow: "0 0 80px rgba(19,184,255,0.08), 0 24px 48px rgba(0,0,0,0.4)" }}>
                    {memoryState.phase === "finished" && (() => {
                      const s = memoryState.score;
                      const memStars = s >= 6 ? 3 : s >= 3 ? 2 : s >= 1 ? 1 : 0;
                      return (
                        <GameResultOverlay
                          accent="#13b8ff"
                          gradFrom="#13b8ff"
                          gradTo="#8b5cf6"
                          gameName="Dizi Hafıza"
                          score={s}
                          bestScore={scoreboard.memory.best}
                          stars={memStars}
                          stats={[
                            { label: "Seri", value: s },
                            { label: "Dizi Uzunluğu", value: memoryState.sequence.length },
                            { label: "En İyi", value: scoreboard.memory.best || "—" },
                          ]}
                          onReplay={startMemoryGame}
                          onBack={() => setActiveAppView("dashboard")}
                          onSaveNote={async (note) => { setNoteForm({ date: getTodayString(), content: `[${GAME_LABELS[activeGame]}] ${note}` }); setNoteMode("free"); await handleAddNoteDB(); }}
                          hasActiveClient={!!activeClient}
                        />
                      );
                    })()}
                    <div className="absolute top-0 right-0 w-96 h-48 rounded-full pointer-events-none" style={{ background: "#13b8ff", opacity: 0.06, filter: "blur(70px)", transform: "translate(20%,-30%)" }} />
                    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "#8b5cf6", opacity: 0.04, filter: "blur(60px)", transform: "translate(-30%,30%)" }} />
                    {/* HUD */}
                    <div className="relative flex gap-2 lg:gap-4 pb-5 border-b border-white/10">
                      <div className={`flex-1 rounded-2xl p-3 lg:p-3.5 transition-all ${lastFeedback && activeGame === "memory" ? (lastFeedback.correct ? "correct-glow" : "wrong-shake") : ""}`}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Aktif seri</p>
                        <strong className="text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight">{memoryState.score}</strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Faz</p>
                        <strong className={`text-2xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight transition-all ${lastFeedback && activeGame === "memory" ? (lastFeedback.correct ? "text-emerald-400" : "text-red-400") : "text-white"}`}>
                          {lastFeedback && activeGame === "memory" ? (lastFeedback.correct ? "✓" : "✗") : getPhaseLabel(memoryState.phase)}
                        </strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(19,184,255,0.08)", border: "1px solid rgba(19,184,255,0.15)" }}>
                        <p className="text-[#13b8ff]/60 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">En İyi</p>
                        <strong className="text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight" style={{ color: "#13b8ff" }}>{scoreboard.memory.best || "—"}</strong>
                      </div>
                      {gameTimerKey > 0 && (
                        <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold flex items-center gap-1"><Timer size={8} /> Süre</p>
                          <strong className="text-white text-xl lg:text-2xl font-extrabold tabular-nums leading-none">{Math.floor(gameElapsed / 60)}:{String(gameElapsed % 60).padStart(2, "0")}</strong>
                        </div>
                      )}
                    </div>
                    <p className="relative text-white/50 text-sm leading-relaxed m-0">{memoryState.message}</p>
                    <p className="relative text-white/30 text-xs m-0">Kısayollar: <strong className="text-white/50">A/B</strong> oyun değiştirir, yön tuşları hücre seçer, <strong className="text-white/50">Enter</strong> ve <strong className="text-white/50">Boşluk</strong> aksiyonu tetikler.</p>
                    <div className="relative grid grid-cols-3 gap-3">
                      {MEMORY_TILES.map((label, index) => {
                        const isActive = memoryState.flashIndex === index;
                        const isLocked = memoryState.phase === "showing";
                        const isCursor = memoryCursor === index;
                        const symbol = SYMBOL_LIBRARY.find((s) => s.label === label);
                        return (
                          <button key={label} type="button" className={`relative flex flex-col items-center justify-center gap-1.5 h-24 lg:h-28 rounded-2xl border cursor-pointer transition-all duration-150 select-none overflow-hidden ${isActive ? "game-tile-active border-transparent" : "border-white/8 hover:border-white/20"} ${isCursor ? "game-tile-cursor" : ""}`} disabled={isLocked} onClick={() => handleMemoryPick(index)} style={!isActive ? { background: symbol?.background } as CSSProperties : undefined}>
                            {!isActive && <div className="absolute inset-0" style={symbol ? patternStyle(symbol) : undefined} />}
                            <span className="relative text-2xl" style={!isActive ? { color: symbol?.accent } : undefined}>{symbol?.icon ?? label[0]}</span>
                            <span className="relative text-xs font-semibold text-white/60">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3 pt-2">
                      <button type="button" data-tooltip="Sıfırdan yeni bir dizi başlat" data-tooltip-dir="top" className={gameBtn} style={{ background: "linear-gradient(135deg, #13b8ff, #8b5cf6)", boxShadow: "0 4px 20px rgba(19,184,255,0.4)" }} onClick={startMemoryGame}>Yeni Seri Başlat</button>
                      <button type="button" data-tooltip="Mevcut diziyi tekrar göster" data-tooltip-dir="top" className={gameBtnSec} onClick={replayMemorySequence} disabled={memoryState.sequence.length === 0}>Sırayı Tekrar Göster</button>
                    </div>
                  </section>
                )}

                {activeGame === "pairs" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(93,211,255,0.18)", boxShadow: "0 0 80px rgba(93,211,255,0.08), 0 24px 48px rgba(0,0,0,0.4)" }}>
                    {pairsState.phase === "finished" && (() => {
                      const mv = pairsState.moves;
                      const pairsStars = mv <= 12 ? 3 : mv <= 18 ? 2 : 1;
                      const pairsScore = Math.max(50, 280 - mv * 7);
                      return (
                        <GameResultOverlay
                          accent="#5dd3ff"
                          gradFrom="#5dd3ff"
                          gradTo="#2dd4bf"
                          gameName="Kart Eşle"
                          score={pairsScore}
                          bestScore={scoreboard.pairs.best}
                          stars={pairsStars}
                          stats={[
                            { label: "Eşleşen", value: pairsState.pairsFound },
                            { label: "Hamle", value: mv },
                            { label: "En İyi", value: scoreboard.pairs.best || "—" },
                          ]}
                          onReplay={startPairsGame}
                          onBack={() => setActiveAppView("dashboard")}
                          onSaveNote={async (note) => { setNoteForm({ date: getTodayString(), content: `[${GAME_LABELS[activeGame]}] ${note}` }); setNoteMode("free"); await handleAddNoteDB(); }}
                          hasActiveClient={!!activeClient}
                        />
                      );
                    })()}
                    <div className="absolute top-0 left-0 w-80 h-56 rounded-full pointer-events-none" style={{ background: "#5dd3ff", opacity: 0.06, filter: "blur(70px)", transform: "translate(-20%,-30%)" }} />
                    {/* HUD */}
                    <div className="relative flex gap-2 lg:gap-4 pb-5 border-b border-white/10">
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Eşleşen</p>
                        <strong className="text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight">{pairsState.pairsFound}</strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Hamle</p>
                        <strong className="text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight">{pairsState.moves}</strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(93,211,255,0.08)", border: "1px solid rgba(93,211,255,0.15)" }}>
                        <p className="text-[#5dd3ff]/60 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Durum</p>
                        <strong className="text-xl lg:text-2xl font-extrabold leading-tight" style={{ color: "#5dd3ff" }}>{getPhaseLabel(pairsState.phase)}</strong>
                      </div>
                      {gameTimerKey > 0 && (
                        <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold flex items-center gap-1"><Timer size={8} /> Süre</p>
                          <strong className="text-white text-xl lg:text-2xl font-extrabold tabular-nums leading-none">{Math.floor(gameElapsed / 60)}:{String(gameElapsed % 60).padStart(2, "0")}</strong>
                        </div>
                      )}
                    </div>
                    <p className="relative text-white/50 text-sm leading-relaxed m-0">{pairsState.message}</p>
                    <p className="relative text-white/30 text-xs m-0">On iki kartı 4×3 düzende gezebilirsin; seçili kart parlak çerçeveyle görünür.</p>
                    <div className="relative grid grid-cols-4 gap-2">
                      {pairsState.tiles.map((tile, index) => {
                        const isCursor = pairsCursor === index;
                        const isVisible = tile.revealed || tile.matched;
                        return (
                          <button key={tile.id} type="button" data-pairs-index={index} aria-label={isVisible ? `${tile.label} kartı` : `Kapalı kart ${index + 1}`} className={`relative flex flex-col items-center justify-center h-20 lg:h-24 rounded-xl cursor-pointer transition-all overflow-hidden border ${tile.matched ? "game-tile-matched" : ""} ${isCursor ? "game-tile-cursor" : ""} ${isVisible ? "border-white/15 hover:border-white/25" : "border-white/6 hover:border-white/12"}`} onClick={() => handlePairsPick(index)} style={isVisible && !tile.matched ? { background: tile.background } : { background: "rgba(10,16,30,0.9)" }}>
                            <div className="absolute inset-0 rounded-xl" style={patternStyle(isVisible ? tile : { pattern: "grid" } as typeof tile)} />
                            <div className="relative flex flex-col items-center justify-center gap-1">
                              {isVisible ? (
                                <><span className="text-2xl" style={{ color: tile.accent }}>{tile.icon}</span><span className="text-xs font-semibold text-white/60">{tile.label}</span></>
                              ) : (
                                <><span className="text-2xl text-white/15">?</span><span className="text-xs text-white/20">aç</span></>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" data-tooltip="Kartları karıştır, yeni oyun başlat" data-tooltip-dir="top" className={gameBtn} style={{ background: "linear-gradient(135deg, #5dd3ff, #2dd4bf)", boxShadow: "0 4px 20px rgba(93,211,255,0.35)" }} onClick={startPairsGame}>Yeni Deste Aç</button>
                    </div>
                  </section>
                )}

                {activeGame === "pulse" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(57,198,255,0.18)", boxShadow: "0 0 80px rgba(57,198,255,0.08), 0 24px 48px rgba(0,0,0,0.4)" }}>
                    {pulseState.phase === "finished" && (() => {
                      const pts = pulseState.points;
                      const pulseStars = pts >= 130 ? 3 : pts >= 80 ? 2 : 1;
                      return (
                        <GameResultOverlay
                          accent="#39c6ff"
                          gradFrom="#39c6ff"
                          gradTo="#818cf8"
                          gameName="Hedef Vur"
                          score={pts}
                          bestScore={scoreboard.pulse.best}
                          stars={pulseStars}
                          stats={[
                            { label: "Puan", value: pts },
                            { label: "İsabet", value: pulseState.hits },
                            { label: "Hata", value: pulseState.misses },
                          ]}
                          onReplay={startPulseGame}
                          onBack={() => setActiveAppView("dashboard")}
                          onSaveNote={async (note) => { setNoteForm({ date: getTodayString(), content: `[${GAME_LABELS[activeGame]}] ${note}` }); setNoteMode("free"); await handleAddNoteDB(); }}
                          hasActiveClient={!!activeClient}
                        />
                      );
                    })()}
                    <div className="absolute bottom-0 left-1/2 w-96 h-64 rounded-full pointer-events-none" style={{ background: "#39c6ff", opacity: 0.06, filter: "blur(80px)", transform: "translate(-50%,30%)" }} />
                    {/* HUD */}
                    <div className="relative flex gap-2 lg:gap-4 pb-5 border-b border-white/10">
                      <div className={`flex-1 rounded-2xl p-3 lg:p-3.5 relative overflow-hidden transition-all ${lastFeedback && activeGame === "pulse" ? (lastFeedback.correct ? "correct-glow" : "wrong-shake") : ""}`}
                        style={{ background: "rgba(57,198,255,0.08)", border: "1px solid rgba(57,198,255,0.15)" }}>
                        <p className="text-[#39c6ff]/60 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Puan</p>
                        <strong className="text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight" style={{ color: "#39c6ff" }}>{pulseState.points}</strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Tur</p>
                        <strong className="text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight">{pulseState.round}<span className="text-lg lg:text-xl text-white/30">/{PULSE_TOTAL_ROUNDS}</span></strong>
                      </div>
                      <div className={`flex-1 rounded-2xl p-3 lg:p-3.5 transition-all ${lastFeedback?.correct && lastFeedback.combo >= 3 && activeGame === "pulse" ? "combo-flash" : ""}`}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Seri</p>
                        <strong className={`text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight ${lastFeedback?.correct && lastFeedback.combo >= 3 && activeGame === "pulse" ? "combo-badge-enter" : ""}`}>
                          {pulseState.combo}
                          {pulseState.combo >= 3 && <span className="ml-1 text-xs lg:text-sm text-amber-400">🔥</span>}
                        </strong>
                      </div>
                      {gameTimerKey > 0 && (
                        <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold flex items-center gap-1"><Timer size={8} /> Süre</p>
                          <strong className="text-white text-xl lg:text-2xl font-extrabold tabular-nums leading-none">{Math.floor(gameElapsed / 60)}:{String(gameElapsed % 60).padStart(2, "0")}</strong>
                        </div>
                      )}
                    </div>
                    <p className="relative text-white/50 text-sm leading-relaxed m-0">{pulseState.message}</p>
                    <p className="relative text-white/30 text-xs m-0">Klavyede merkezden başla: yön tuşları seçimi taşır, <strong className="text-white/50">Enter</strong> aktif kareyi oynatır.</p>
                    <div className="relative grid grid-cols-3 gap-3">
                      {PULSE_LABELS.map((label, index) => {
                        const isActive = pulseState.activeIndex === index && pulseState.phase === "playing";
                        const isCursor = pulseCursor === index;
                        const wasJustPicked = lastFeedback && activeGame === "pulse" && !isActive && pulseState.activeIndex !== index && index === pulseCursor;
                        return (
                          <button key={label} type="button"
                            className={`h-24 rounded-xl border flex items-center justify-center text-sm cursor-pointer transition-all
                              ${isActive ? "game-tile-active border-transparent" : "border-white/8 hover:border-white/16"}
                              ${isCursor ? "game-tile-cursor" : ""}
                              ${wasJustPicked && lastFeedback?.correct ? "correct-glow" : ""}
                              ${wasJustPicked && !lastFeedback?.correct ? "wrong-shake" : ""}`}
                            style={!isActive ? { background: "rgba(10,18,34,0.9)", color: "rgba(148,163,184,0.8)" } : undefined}
                            onClick={() => handlePulsePick(index)}>
                            <span className="font-semibold text-xs">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" data-tooltip="Aktif hedef belirleme setini başlat" data-tooltip-dir="top" className={gameBtn} style={{ background: "linear-gradient(135deg, #39c6ff, #818cf8)", boxShadow: "0 4px 20px rgba(57,198,255,0.35)" }} onClick={startPulseGame}>Seti Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "route" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(74,207,255,0.18)", boxShadow: "0 0 80px rgba(74,207,255,0.08), 0 24px 48px rgba(0,0,0,0.4)" }}>
                    {routeState.phase === "finished" && (() => {
                      const rs = routeState.score;
                      const routeStars = rs >= 140 ? 3 : rs >= 80 ? 2 : 1;
                      return (
                        <GameResultOverlay
                          accent="#4acfff"
                          gradFrom="#4acfff"
                          gradTo="#6366f1"
                          gameName="Yön Komutu"
                          score={rs}
                          bestScore={scoreboard.route.best}
                          stars={routeStars}
                          stats={[
                            { label: "Puan", value: rs },
                            { label: "Seri", value: routeState.streak },
                            { label: "En İyi", value: scoreboard.route.best || "—" },
                          ]}
                          onReplay={startRouteGame}
                          onBack={() => setActiveAppView("dashboard")}
                          onSaveNote={async (note) => { setNoteForm({ date: getTodayString(), content: `[${GAME_LABELS[activeGame]}] ${note}` }); setNoteMode("free"); await handleAddNoteDB(); }}
                          hasActiveClient={!!activeClient}
                        />
                      );
                    })()}
                    <div className="absolute top-1/2 right-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: "#4acfff", opacity: 0.05, filter: "blur(70px)", transform: "translate(30%,-50%)" }} />
                    {/* HUD */}
                    <div className="relative flex gap-2 lg:gap-4 pb-5 border-b border-white/10">
                      <div className={`flex-1 rounded-2xl p-3 lg:p-3.5 transition-all ${lastFeedback && activeGame === "route" ? (lastFeedback.correct ? "correct-glow" : "wrong-shake") : ""}`}
                        style={{ background: "rgba(74,207,255,0.08)", border: "1px solid rgba(74,207,255,0.15)" }}>
                        <p className="text-[#4acfff]/60 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Puan</p>
                        <strong className="text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight" style={{ color: "#4acfff" }}>{routeState.score}</strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Tur</p>
                        <strong className="text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight">{routeState.round}<span className="text-lg lg:text-xl text-white/30">/{ROUTE_TOTAL_ROUNDS}</span></strong>
                      </div>
                      <div className={`flex-1 rounded-2xl p-3 lg:p-3.5 transition-all ${lastFeedback?.correct && lastFeedback.combo >= 3 && activeGame === "route" ? "combo-flash" : ""}`}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Seri</p>
                        <strong className={`text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight ${lastFeedback?.correct && lastFeedback.combo >= 3 && activeGame === "route" ? "combo-badge-enter" : ""}`}>
                          {routeState.streak}
                          {routeState.streak >= 3 && <span className="ml-1 text-xs lg:text-sm text-amber-400">🔥</span>}
                        </strong>
                      </div>
                      {gameTimerKey > 0 && (
                        <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold flex items-center gap-1"><Timer size={8} /> Süre</p>
                          <strong className="text-white text-xl lg:text-2xl font-extrabold tabular-nums leading-none">{Math.floor(gameElapsed / 60)}:{String(gameElapsed % 60).padStart(2, "0")}</strong>
                        </div>
                      )}
                    </div>
                    <p className="relative text-white/50 text-sm leading-relaxed m-0">{routeState.message}</p>
                    <div className="relative flex items-center gap-4">
                      <div className={`flex flex-col items-center rounded-2xl px-8 py-5 border min-w-[140px] transition-all ${lastFeedback && activeGame === "route" ? (lastFeedback.correct ? "correct-glow" : "wrong-shake") : ""}`}
                        style={{ background: "rgba(10,18,34,0.9)", borderColor: "rgba(74,207,255,0.2)" }}>
                        <span className="text-white/40 text-[10px] uppercase tracking-wider mb-1 font-bold">Aktif komut</span>
                        <strong className="text-white text-base font-bold mt-0.5">{routeCommandMeta?.label ?? "Hazır"}</strong>
                        <span className="text-3xl mt-1.5" style={{ color: "#4acfff" }}>{routeCommandMeta?.icon ?? "•"}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {routeState.history.slice(-6).map((item, index) => {
                          const meta = ROUTE_COMMANDS.find((command) => command.key === item);
                          const isLast = index === routeState.history.slice(-6).length - 1;
                          return (
                            <span key={`${item}-${index}`}
                              className={`text-sm font-semibold transition-all ${isLast ? "text-white/60" : "text-white/25"}`}>
                              {meta?.icon ?? item}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="relative grid grid-cols-2 gap-3">
                      {ROUTE_COMMANDS.map((command, index) => {
                        const isCursor = routeCursor === index;
                        return (
                          <button key={command.key} type="button"
                            className={`flex flex-col items-center justify-center gap-2 h-24 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5
                              ${isCursor ? "game-tile-cursor border-transparent" : "border-white/8 hover:border-white/20"}`}
                            style={{ background: "rgba(10,18,34,0.9)" }}
                            onClick={() => handleRoutePick(command.key)}>
                            <span className="text-3xl" style={{ color: "#4acfff" }}>{command.icon}</span>
                            <span className="text-xs font-semibold text-white/50">{command.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" data-tooltip="Rotayı takip et, komutları uygula" data-tooltip-dir="top" className={gameBtn} style={{ background: "linear-gradient(135deg, #4acfff, #6366f1)", boxShadow: "0 4px 20px rgba(74,207,255,0.35)" }} onClick={startRouteGame}>Komutları Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "difference" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(105,212,255,0.18)", boxShadow: "0 0 80px rgba(105,212,255,0.08), 0 24px 48px rgba(0,0,0,0.4)" }}>
                    {differenceState.phase === "finished" && (() => {
                      const ds = differenceState.score;
                      const diffStars = ds >= 7 ? 3 : ds >= 4 ? 2 : ds >= 1 ? 1 : 0;
                      return (
                        <GameResultOverlay
                          accent="#69d4ff"
                          gradFrom="#69d4ff"
                          gradTo="#a78bfa"
                          gameName="Farkı Bul"
                          score={ds}
                          bestScore={scoreboard.difference.best}
                          stars={diffStars}
                          stats={[
                            { label: "Skor", value: ds },
                            { label: "Tur", value: `${differenceState.round}/${DIFFERENCE_TOTAL_ROUNDS}` },
                            { label: "En İyi", value: scoreboard.difference.best || "—" },
                          ]}
                          onReplay={startDifferenceGame}
                          onBack={() => setActiveAppView("dashboard")}
                          onSaveNote={async (note) => { setNoteForm({ date: getTodayString(), content: `[${GAME_LABELS[activeGame]}] ${note}` }); setNoteMode("free"); await handleAddNoteDB(); }}
                          hasActiveClient={!!activeClient}
                        />
                      );
                    })()}
                    <div className="absolute top-0 left-1/2 w-96 h-56 rounded-full pointer-events-none" style={{ background: "#69d4ff", opacity: 0.06, filter: "blur(70px)", transform: "translate(-50%,-40%)" }} />
                    {/* HUD */}
                    <div className="relative flex gap-2 lg:gap-4 pb-5 border-b border-white/10">
                      <div className={`flex-1 rounded-2xl p-3 lg:p-3.5 transition-all ${lastFeedback && activeGame === "difference" ? (lastFeedback.correct ? "correct-glow" : "wrong-shake") : ""}`}
                        style={{ background: "rgba(105,212,255,0.08)", border: "1px solid rgba(105,212,255,0.15)" }}>
                        <p className="text-[#69d4ff]/60 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Skor</p>
                        <strong className="text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight" style={{ color: "#69d4ff" }}>{differenceState.score}</strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Tur</p>
                        <strong className="text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight">{differenceState.round}<span className="text-lg lg:text-xl text-white/30">/{DIFFERENCE_TOTAL_ROUNDS}</span></strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Durum</p>
                        <strong className={`text-xl lg:text-2xl font-extrabold leading-tight transition-all ${lastFeedback && activeGame === "difference" ? (lastFeedback.correct ? "text-emerald-400" : "text-red-400") : "text-white"}`}>
                          {lastFeedback && activeGame === "difference" ? (lastFeedback.correct ? "✓ Doğru" : "✗ Yanlış") : getPhaseLabel(differenceState.phase)}
                        </strong>
                      </div>
                      {gameTimerKey > 0 && (
                        <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold flex items-center gap-1"><Timer size={8} /> Süre</p>
                          <strong className="text-white text-xl lg:text-2xl font-extrabold tabular-nums leading-none">{Math.floor(gameElapsed / 60)}:{String(gameElapsed % 60).padStart(2, "0")}</strong>
                        </div>
                      )}
                    </div>
                    <p className="relative text-white/50 text-sm leading-relaxed m-0">{differenceState.message}</p>
                    <p className="relative text-white/30 text-xs m-0">Aynı dizilim klavyede de çalışır; seçili kart parlak kontur ile gösterilir.</p>
                    <div className="relative grid grid-cols-3 gap-3">
                      {differenceState.tiles.map((tile, index) => {
                        const reveal = differenceState.revealId === tile.id;
                        const isCursor = differenceCursor === index;
                        return (
                          <button key={tile.id} type="button" className={`relative flex flex-col items-center justify-center h-24 lg:h-28 rounded-2xl border cursor-pointer overflow-hidden transition-all hover:border-white/25 ${reveal ? "game-tile-reveal" : "border-white/8"} ${isCursor ? "game-tile-cursor" : ""}`} onClick={() => handleDifferencePick(tile.id)} style={{ background: tile.background, transform: `rotate(${tile.rotation}deg)` } as CSSProperties}>
                            <div className="absolute inset-0" style={patternStyle(tile)} />
                            <div className="relative flex flex-col items-center justify-center gap-1.5">
                              <span className="text-2xl" style={{ color: tile.accent }}>{tile.icon}</span>
                              <span className="text-xs font-semibold text-white/60">{tile.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" data-tooltip="Görseller arasındaki farkları bul" data-tooltip-dir="top" className={gameBtn} style={{ background: "linear-gradient(135deg, #69d4ff, #a78bfa)", boxShadow: "0 4px 20px rgba(105,212,255,0.35)" }} onClick={startDifferenceGame}>Turu Başlat</button>
                    </div>
                  </section>
                )}

                {activeGame === "scan" && (
                  <section className="relative rounded-3xl p-6 lg:p-8 flex flex-col gap-6 w-full overflow-hidden" style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(139,226,255,0.18)", boxShadow: "0 0 80px rgba(139,226,255,0.08), 0 24px 48px rgba(0,0,0,0.4)" }}>
                    {scanState.phase === "finished" && (() => {
                      const ss = scanState.score;
                      const scanStars = ss >= 7 ? 3 : ss >= 4 ? 2 : ss >= 1 ? 1 : 0;
                      return (
                        <GameResultOverlay
                          accent="#8be2ff"
                          gradFrom="#8be2ff"
                          gradTo="#34d399"
                          gameName="Hedef Tara"
                          score={ss}
                          bestScore={scoreboard.scan.best}
                          stars={scanStars}
                          stats={[
                            { label: "Skor", value: ss },
                            { label: "Tur", value: `${scanState.round}/${SCAN_TOTAL_ROUNDS}` },
                            { label: "En İyi", value: scoreboard.scan.best || "—" },
                          ]}
                          onReplay={startScanGame}
                          onBack={() => setActiveAppView("dashboard")}
                          onSaveNote={async (note) => { setNoteForm({ date: getTodayString(), content: `[${GAME_LABELS[activeGame]}] ${note}` }); setNoteMode("free"); await handleAddNoteDB(); }}
                          hasActiveClient={!!activeClient}
                        />
                      );
                    })()}
                    <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: "#8be2ff", opacity: 0.05, filter: "blur(70px)", transform: "translate(20%,20%)" }} />
                    {/* HUD */}
                    <div className="relative flex gap-2 lg:gap-4 pb-5 border-b border-white/10">
                      <div className={`flex-1 rounded-2xl p-3 lg:p-3.5 transition-all ${lastFeedback && activeGame === "scan" ? (lastFeedback.correct ? "correct-glow" : "wrong-shake") : ""}`}
                        style={{ background: "rgba(139,226,255,0.08)", border: "1px solid rgba(139,226,255,0.15)" }}>
                        <p className="text-[#8be2ff]/60 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Skor</p>
                        <strong className="text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight" style={{ color: "#8be2ff" }}>{scanState.score}</strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Tur</p>
                        <strong className="text-white text-3xl lg:text-4xl font-extrabold tabular-nums leading-none tracking-tight">{scanState.round}<span className="text-lg lg:text-xl text-white/30">/{SCAN_TOTAL_ROUNDS}</span></strong>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold">Durum</p>
                        <strong className={`text-xl lg:text-2xl font-extrabold leading-tight truncate transition-all ${lastFeedback && activeGame === "scan" ? (lastFeedback.correct ? "text-emerald-400" : "text-red-400") : "text-white"}`}>
                          {lastFeedback && activeGame === "scan" ? (lastFeedback.correct ? "✓ Bulundu!" : "✗ Yanlış") : (scanState.targetLabel || "Hazır")}
                        </strong>
                      </div>
                      {gameTimerKey > 0 && (
                        <div className="flex-1 rounded-2xl p-3 lg:p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-white/40 text-[9px] lg:text-[10px] uppercase tracking-widest m-0 mb-1 font-bold flex items-center gap-1"><Timer size={8} /> Süre</p>
                          <strong className="text-white text-xl lg:text-2xl font-extrabold tabular-nums leading-none">{Math.floor(gameElapsed / 60)}:{String(gameElapsed % 60).padStart(2, "0")}</strong>
                        </div>
                      )}
                    </div>
                    <p className="relative text-white/50 text-sm leading-relaxed m-0">{scanState.message}</p>
                    {/* Target highlight */}
                    {scanState.targetLabel && (() => {
                      const targetSymbol = SYMBOL_LIBRARY.find((s) => s.label === scanState.targetLabel);
                      return (
                        <div className={`relative rounded-2xl px-5 py-4 flex items-center gap-4 border transition-all ${lastFeedback?.correct && activeGame === "scan" ? "correct-glow" : ""}`}
                          style={{ background: "rgba(10,18,34,0.9)", borderColor: "rgba(139,226,255,0.2)" }}>
                          <span className="text-white/40 text-xs uppercase tracking-wider font-bold">Bu simgeyi bul</span>
                          <div className="flex items-center gap-3 ml-auto">
                            <span className="text-3xl" style={{ color: targetSymbol?.accent }}>{targetSymbol?.icon ?? "?"}</span>
                            <strong className="text-white text-sm font-bold">{scanState.targetLabel}</strong>
                          </div>
                        </div>
                      );
                    })()}
                    {!scanState.targetLabel && (
                      <div className="relative rounded-2xl px-5 py-4 flex items-center gap-3 border" style={{ background: "rgba(10,18,34,0.9)", borderColor: "rgba(139,226,255,0.1)" }}>
                        <span className="text-white/30 text-xs uppercase tracking-wider font-bold">Bu simgeyi bul</span>
                        <span className="text-white/20 text-sm ml-auto">Oyunu başlat</span>
                      </div>
                    )}
                    <div className="relative grid grid-cols-3 gap-3">
                      {scanState.tiles.map((tile, index) => {
                        const reveal = scanState.revealId === tile.id;
                        const isCursor = scanCursor === index;
                        return (
                          <button key={tile.id} type="button"
                            className={`relative flex flex-col items-center justify-center h-24 lg:h-28 rounded-2xl border cursor-pointer overflow-hidden transition-all hover:border-white/25
                              ${reveal ? "game-tile-reveal" : "border-white/8"}
                              ${isCursor ? "game-tile-cursor" : ""}`}
                            onClick={() => handleScanPick(tile.id)}
                            style={{ background: tile.background, transform: `rotate(${tile.rotation}deg)` } as CSSProperties}>
                            <div className="absolute inset-0" style={patternStyle(tile)} />
                            <div className="relative flex flex-col items-center justify-center gap-1.5">
                              <span className="text-2xl" style={{ color: tile.accent }}>{tile.icon}</span>
                              <span className="text-xs font-semibold text-white/60">{tile.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex gap-3">
                      <button type="button" data-tooltip="Ekranda görünen nesneleri tara ve say" data-tooltip-dir="top" className={gameBtn} style={{ background: "linear-gradient(135deg, #8be2ff, #34d399)", boxShadow: "0 4px 20px rgba(139,226,255,0.35)" }} onClick={startScanGame}>Taramayı Başlat</button>
                    </div>
                  </section>
                )}

                {/* ── Premium Game Details Card ── */}
                <details ref={gameDetailsRef} className="rounded-3xl border border-(--color-line) overflow-hidden w-full" style={{ background: "var(--color-surface-strong)" }}>
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none group select-none">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary)/15, #8b5cf6/10)", border: "1px solid var(--color-primary)/20" }}>
                        <div className="w-2 h-7 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, var(--color-primary), #8b5cf6)" }} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-0.5" style={{ color: "var(--color-primary)" }}>{activeCategory.title}</span>
                        <h3 className="text-(--color-text-strong) font-bold text-base m-0">{activeTab.title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[{l: "En iyi", v: activeScoreCard.best}, {l: "Tekrar", v: activeScoreCard.plays}].map(({l, v}) => (
                        <div key={l} className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl" style={{ background: "var(--color-primary)/8", border: "1px solid var(--color-primary)/15" }}>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-(--color-text-muted)">{l}</span>
                          <strong className="font-extrabold text-sm" style={{ color: "var(--color-primary)" }}>{v}</strong>
                        </div>
                      ))}
                      <span className="flex items-center gap-1 text-(--color-text-muted) text-xs font-semibold ml-2"><ChevronDown size={14} /> Detaylar</span>
                    </div>
                  </summary>
                  <div className="px-5 pb-6 space-y-4 border-t border-(--color-line) pt-4">
                    <p className="text-(--color-text-soft) text-sm m-0 leading-relaxed">{activeTab.blurb}</p>
                    <div className="flex flex-wrap gap-2">
                      {activeTab.goals.map((goal) => <span key={goal} className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "var(--color-primary)/10", color: "var(--color-primary)", border: "1px solid var(--color-primary)/20" }}>{goal}</span>)}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[{l: "En iyi", v: activeScoreCard.best}, {l: "Son", v: activeScoreCard.last}, {l: "Tekrar", v: activeScoreCard.plays}].map(({l, v}) => (
                        <div key={l} className="flex flex-col rounded-2xl px-4 py-3" style={{ background: "var(--color-primary)/5", border: "1px solid var(--color-primary)/10" }}>
                          <span className="text-(--color-text-muted) text-[10px] uppercase tracking-wider font-bold mb-1">{l}</span>
                          <strong className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--color-primary)" }}>{v}</strong>
                        </div>
                      ))}
                    </div>
                    {activeRemoteScore.best > 0 && (
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-(--color-text-soft) text-sm">
                          Sunucu en iyi: <strong className="text-(--color-text-strong)">{activeRemoteScore.best}</strong>
                          {activeRemoteScore.lastPlayedAt ? <span className="text-(--color-text-muted)"> · {formatPlayedAt(activeRemoteScore.lastPlayedAt)}</span> : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </details>

              </div>
                );
              })()}
              </section>
            </div>
          </div>
        )}

        {/* ── Reports & Analytics ── */}
        {activeAppView === "reports" && (() => {
          const GAME_COLORS: Record<string, string> = {
            memory: "#818cf8", pairs: "#2dd4bf", pulse: "#38bdf8",
            route: "#6366f1", difference: "#a78bfa", scan: "#34d399",
          };
          const allGameKeys = Object.keys(GAME_LABELS) as Array<keyof typeof GAME_LABELS>;
          const scoreEntries = allGameKeys.map((key) => {
            const rs = platformOverview.remoteScores[key];
            const local = scoreboard[key] ?? { best: 0, last: 0, plays: 0 };
            const best = Math.max(rs?.best ?? 0, local.best);
            const plays = Math.max(rs?.sessions ?? 0, local.plays);
            const last = rs?.last ?? local.last;
            return { key, label: GAME_LABELS[key], best, plays, last, color: GAME_COLORS[key] };
          });
          const totalSessions = scoreEntries.reduce((s, e) => s + e.plays, 0);
          const topGame = [...scoreEntries].sort((a, b) => b.plays - a.plays)[0];
          const maxBest = Math.max(...scoreEntries.map(e => e.best), 1);
          const maxPlays = Math.max(...scoreEntries.map(e => e.plays), 1);

          // Client performance table
          const clientRows = clientOptions.map((c) => {
            const sessions = platformOverview.recentSessions.filter((s) => s.clientName === c.displayName || s.clientId === c.id);
            const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((s, ss) => s + ss.score, 0) / sessions.length) : 0;
            const lastSession = sessions[0];
            return { ...c, sessionCount: sessions.length, avgScore, lastGame: lastSession?.gameLabel ?? "—", lastDate: lastSession?.playedAt?.slice(0, 10) ?? "—" };
          }).sort((a, b) => b.sessionCount - a.sessionCount);

          // Recent 7 sessions for activity feed
          const recentFeed = platformOverview.recentSessions.slice(0, 7);

          return (
            <div className="flex flex-col h-full overflow-hidden page-enter">
              {/* Header */}
              <div className="relative flex items-center justify-between gap-3 px-4 lg:px-6 py-3.5 lg:py-5 border-b border-(--color-line) overflow-hidden shrink-0" style={{ background: "var(--color-chrome-section)", backdropFilter: "blur(20px)" }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(245,158,11,0.06), transparent)" }} />
                <div className="relative flex items-center gap-2.5 lg:gap-3">
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 4px 14px rgba(245,158,11,0.4)" }}>
                    <BarChart3 size={15} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-extrabold text-(--color-text-strong) m-0 tracking-tight">Raporlar & Analitik</h1>
                    <p className="text-(--color-text-soft) text-xs lg:text-sm m-0 hidden sm:block">Seans verileri, oyun performansı ve danışan ilerleme özeti.</p>
                  </div>
                </div>
                <button type="button"
                  className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-bold text-white border-none cursor-pointer shrink-0"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}
                  onClick={() => { void loadPlatformOverview(); showToast("Veriler yenilendi", "info"); }}>
                  <RefreshCw size={13} /> <span className="hidden sm:inline">Yenile</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 lg:space-y-8">

                {/* ── KPI strip ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {[
                    { label: "Toplam Seans", value: totalSessions, icon: "🎮", color: "#818cf8", sub: "kayıt" },
                    { label: "Aktif Danışan", value: clientOptions.length, icon: "👥", color: "#34d399", sub: "profil" },
                    { label: "En Çok Oynanan", value: topGame?.label ?? "—", icon: "🏆", color: "#fbbf24", sub: "oyun", isText: true },
                    { label: "Bu Hafta", value: thisWeekCount, icon: "📅", color: "#f472b6", sub: "seans" },
                  ].map(({ label, value, icon, color, sub, isText }) => (
                    <div key={label} className="relative overflow-hidden rounded-2xl border border-(--color-line) p-3.5 lg:p-5" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
                      <div className="flex items-start justify-between mb-2 lg:mb-3">
                        <span className="text-xl lg:text-2xl">{icon}</span>
                        <span className="text-[9px] lg:text-[10px] font-bold px-1.5 lg:px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{sub}</span>
                      </div>
                      {isText
                        ? <p className="text-sm lg:text-lg font-extrabold m-0 leading-tight" style={{ color }}>{value}</p>
                        : <strong className="text-3xl lg:text-4xl font-extrabold tabular-nums block mb-0.5" style={{ color }}>{value}</strong>
                      }
                      <span className="text-(--color-text-muted) text-[10px] lg:text-xs">{label}</span>
                    </div>
                  ))}
                </div>

                {/* ── Game Performance Bar Chart ── */}
                <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4,transparent)" }} />
                  <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                        <Activity size={15} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Oyun Performans Grafiği</h3>
                        <span className="text-xs text-(--color-text-muted)">Her oyun için en yüksek skor ve toplam oynama sayısı</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-(--color-text-muted)">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />En İyi Skor</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(99,102,241,0.2)" }} />Oynama</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    {scoreEntries.map(({ key, label, best, plays, last, color }) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className="font-semibold text-(--color-text-strong)">{label}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-(--color-text-muted) tabular-nums">
                            <span>En iyi: <strong style={{ color }} className="font-bold">{best}</strong></span>
                            <span>Son: <strong className="text-(--color-text-body) font-semibold">{last}</strong></span>
                            <span className="px-2 py-0.5 rounded-full font-bold text-white text-[10px]" style={{ background: color }}>{plays}×</span>
                          </div>
                        </div>
                        {/* Best score bar */}
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.round((best / maxBest) * 100)}%`, background: `linear-gradient(90deg,${color},${color}aa)` }} />
                        </div>
                        {/* Plays bar */}
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.round((plays / maxPlays) * 100)}%`, background: `${color}44` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Two-col: Client Table + Activity Feed ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                  {/* Client Performance Table */}
                  <div className="lg:col-span-3 relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#34d399,#06b6d4,transparent)" }} />
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }}>
                        <Users size={14} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Danışan Performans Tablosu</h3>
                        <span className="text-xs text-(--color-text-muted)">{clientOptions.length} danışan · seans & skor özeti</span>
                      </div>
                    </div>
                    {clientRows.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-12 text-(--color-text-muted)">
                        <Users size={36} strokeWidth={1.5} />
                        <p className="text-sm m-0">Henüz danışan kaydı yok.</p>
                        <button type="button" className="text-xs font-bold px-3 py-1.5 rounded-xl text-white border-none cursor-pointer" style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }} onClick={() => { setShowAddClient(true); setActiveAppView("clients"); }}>Danışan Ekle</button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr style={{ background: "var(--color-surface-elevated)", borderBottom: "1px solid var(--color-line)" }}>
                              {["Danışan", "Seans", "Ort. Skor", "Son Oyun", "Son Tarih"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-(--color-text-muted)">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {clientRows.map((c, idx) => {
                              const initials = c.displayName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
                              const gradients = ["linear-gradient(135deg,#6366f1,#8b5cf6)","linear-gradient(135deg,#10b981,#06b6d4)","linear-gradient(135deg,#f59e0b,#ef4444)","linear-gradient(135deg,#ec4899,#8b5cf6)","linear-gradient(135deg,#14b8a6,#6366f1)"];
                              const grad = gradients[idx % gradients.length];
                              return (
                                <tr key={c.id}
                                  className="cursor-pointer transition-colors hover:bg-(--color-surface-elevated)"
                                  style={{ borderBottom: "1px solid var(--color-line-soft)" }}
                                  onClick={() => handleSelectClient(c.id)}>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: grad }}>{initials}</span>
                                      <div>
                                        <span className="font-semibold text-(--color-text-strong) block text-sm">{c.displayName}</span>
                                        <span className="text-[10px] text-(--color-text-muted)">{c.ageGroup || "—"}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="font-bold tabular-nums" style={{ color: "#818cf8" }}>{c.sessionCount}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold tabular-nums" style={{ color: c.avgScore >= 10 ? "#34d399" : c.avgScore >= 5 ? "#fbbf24" : "#f87171" }}>{c.avgScore}</span>
                                      {c.avgScore >= 10 && <ArrowUpRight size={12} style={{ color: "#34d399" }} />}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-(--color-text-soft) text-xs">{c.lastGame}</td>
                                  <td className="px-4 py-3 text-(--color-text-muted) text-xs tabular-nums">{c.lastDate}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Activity Timeline */}
                  <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#f472b6,#818cf8,transparent)" }} />
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#ec4899,#8b5cf6)" }}>
                        <Clock size={14} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Son Aktiviteler</h3>
                        <span className="text-xs text-(--color-text-muted)">Canlı seans akışı</span>
                      </div>
                    </div>
                    {recentFeed.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-12 text-(--color-text-muted) px-5 text-center">
                        <Activity size={36} strokeWidth={1.5} />
                        <p className="text-sm m-0">Henüz seans kaydı yok. İlk oyununuzu oynayın!</p>
                      </div>
                    ) : (
                      <div className="p-5 space-y-1 relative">
                        {/* Vertical line */}
                        <div className="absolute left-9 top-5 bottom-5 w-px" style={{ background: "var(--color-line)" }} />
                        {recentFeed.map((session, i) => {
                          const gc = GAME_COLORS[session.gameKey] ?? "#818cf8";
                          const timeAgo = (() => {
                            const d = new Date(session.playedAt);
                            const diff = Math.floor((Date.now() - d.getTime()) / 60000);
                            if (diff < 60) return `${diff}dk önce`;
                            if (diff < 1440) return `${Math.floor(diff / 60)}sa önce`;
                            return `${Math.floor(diff / 1440)}g önce`;
                          })();
                          return (
                            <div key={session.id} className="flex items-start gap-3 py-2.5 relative" style={{ animation: `result-stat-in 0.3s ease ${i * 0.05}s both` }}>
                              {/* Timeline dot */}
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 relative z-10 mt-0.5" style={{ background: gc, boxShadow: `0 0 8px ${gc}66` }}>
                                <Gamepad2 size={9} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-semibold text-(--color-text-strong) text-sm truncate">{session.clientName}</span>
                                  <span className="text-[10px] text-(--color-text-muted) shrink-0 tabular-nums">{timeAgo}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white" style={{ background: gc }}>{session.gameLabel}</span>
                                  <span className="text-[10px] text-(--color-text-muted)">Skor: <strong style={{ color: gc }} className="font-bold">{session.score}</strong></span>
                                </div>
                                {session.sessionNote && (
                                  <p className="text-[10px] text-(--color-text-muted) mt-1 m-0 italic truncate">"{session.sessionNote}"</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* ── Game distribution pie-style ── */}
                <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#fbbf24,#f59e0b,transparent)" }} />
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                      <Trophy size={14} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Oyun Dağılımı</h3>
                      <span className="text-xs text-(--color-text-muted)">Toplam {totalSessions} seans · oynama payları</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-3">
                      {scoreEntries.filter(e => e.plays > 0).map(({ key, label, plays, color }) => {
                        const pct = totalSessions > 0 ? Math.round((plays / totalSessions) * 100) : 0;
                        return (
                          <div key={key} className="flex items-center gap-3 flex-1 min-w-[180px] p-3.5 rounded-2xl border border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                            <div className="relative w-12 h-12 shrink-0">
                              <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                                <circle cx="18" cy="18" r="15.9155" fill="none" stroke={color} strokeWidth="3.5"
                                  strokeDasharray={`${pct} 100`} strokeLinecap="round" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color }}>{pct}%</span>
                            </div>
                            <div>
                              <strong className="text-(--color-text-strong) text-sm block">{label}</strong>
                              <span className="text-(--color-text-muted) text-xs">{plays} seans</span>
                            </div>
                          </div>
                        );
                      })}
                      {scoreEntries.every(e => e.plays === 0) && (
                        <div className="flex flex-col items-center gap-3 py-10 w-full text-center text-(--color-text-muted)">
                          <Trophy size={36} strokeWidth={1.5} />
                          <p className="text-sm m-0">Henüz oyun seansı kaydedilmedi.</p>
                          <button type="button" className="text-xs font-bold px-4 py-2 rounded-xl text-white border-none cursor-pointer" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }} onClick={() => setActiveAppView("games")}>
                            Oyun Başlat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* ── Therapy Program ── */}
        {activeAppView === "therapy-program" && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* ── Premium Header ── */}
            <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 px-4 lg:px-6 py-4 lg:py-5 border-b border-(--color-line) overflow-hidden" style={{ background: "var(--color-chrome-section)", backdropFilter: "blur(20px)" }}>
              {/* Background glow */}
              <div className="absolute top-0 left-0 w-64 h-32 rounded-full pointer-events-none" style={{ background: "var(--color-primary)", opacity: 0.04, filter: "blur(50px)", transform: "translate(-20%,-40%)" }} />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)", boxShadow: "0 2px 8px var(--color-primary)/30" }}>
                    <Stethoscope size={13} className="text-white" />
                  </div>
                  <h1 className="text-lg lg:text-xl font-extrabold text-(--color-text-strong) m-0 tracking-tight">Terapi Programı</h1>
                </div>
                <p className="text-(--color-text-soft) text-xs lg:text-sm m-0 max-w-lg leading-relaxed hidden sm:block">Kanıta dayalı ergoterapi alanlarına göre kişiselleştirilmiş aktivite önerileri ve oyun eşlemeleri.</p>
              </div>
              {clientOptions.length > 0 && (
                <div className="relative flex flex-col gap-1 shrink-0 sm:min-w-[180px] lg:min-w-[200px] w-full sm:w-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted)">Danışan Seç</span>
                  <select value={tpSelectedClientId ?? ""} onChange={(e) => setTpSelectedClientId(e.target.value || null)} className={inputCls}>
                    <option value="">Danışan seçin...</option>
                    {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* ── Premium Tabs ── */}
            <div className="tab-scroll flex gap-1 px-3 lg:px-4 py-2 lg:py-2.5 border-b border-(--color-line)" style={{ background: "var(--color-chrome-section)" }}>
              {([
                {key: "domains" as const, label: "Alanlar", labelFull: "Terapi Alanları", Icon: Stethoscope, disabled: false},
                {key: "activities" as const, label: "Aktivite", labelFull: "Aktiviteler", Icon: ClipboardList, disabled: !tpSelectedDomain},
                {key: "games" as const, label: "Oyunlar", labelFull: "Oyun Eşleme", Icon: Gamepad2, disabled: !tpSelectedDomain},
                {key: "plan" as const, label: "Plan", labelFull: "Haftalık Plan", Icon: CalendarDays, disabled: !tpSelectedDomain},
                {key: "progress" as const, label: "İlerleme", labelFull: "İlerleme", Icon: TrendingUp, disabled: !tpSelectedClientId},
              ] as {key: "domains" | "activities" | "games" | "plan" | "progress"; label: string; labelFull: string; Icon: LucideIcon; disabled: boolean}[]).map(({key, label, labelFull, Icon, disabled}) => (
                <button key={key} type="button"
                  className="shrink-0 flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold border-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: tpActiveTab === key ? "linear-gradient(135deg, var(--color-primary), #8b5cf6)" : "transparent",
                    color: tpActiveTab === key ? "white" : "var(--color-text-soft)",
                    boxShadow: tpActiveTab === key ? "0 4px 12px var(--color-primary)/30" : "none",
                  }}
                  onClick={() => setTpActiveTab(key)} disabled={disabled}>
                  <Icon size={13} className="shrink-0" />
                  <span className="hidden sm:inline">{labelFull}</span>
                  <span className="sm:hidden">{label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6">

              {/* ── Domains Tab ── */}
              {tpActiveTab === "domains" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-extrabold text-(--color-text-strong) mb-1 tracking-tight">Ergoterapi Uygulama Alanları</h2>
                    <p className="text-(--color-text-soft) text-sm">Danışanın ihtiyacına uygun terapi alanını seçin. Sistem alan bazında hedefler, aktiviteler ve oyun önerileri üretecektir.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {THERAPY_DOMAINS.map((domain) => {
                      const gameMappingCount = GAME_THERAPY_MAPPINGS.filter((m) => m.suitableDomains.includes(domain.key)).length;
                      const isSelected = tpSelectedDomain === domain.key;
                      return (
                        <button key={domain.key} type="button" className="flex flex-col gap-3 p-5 rounded-3xl border text-left cursor-pointer transition-all card-hover relative overflow-hidden" style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${domain.color}18 0%, ${domain.color}08 100%)`
                            : "var(--color-surface-strong)",
                          borderColor: isSelected ? domain.color : "var(--color-line)",
                          boxShadow: isSelected ? `0 0 24px ${domain.color}20, 0 8px 32px rgba(0,0,0,0.1)` : "none",
                        }} onClick={() => handleSelectDomain(domain.key)}>
                          {/* Top shimmer line when selected */}
                          {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, transparent)` }} />}
                          <div className="flex items-start justify-between">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${domain.color}20`, border: `1px solid ${domain.color}30` }}>
                              <DomainIcon iconKey={domain.icon} size={20} color={domain.color} />
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: domain.color }}>
                                <span className="text-white text-[10px] font-black">✓</span>
                              </div>
                            )}
                          </div>
                          <strong className="text-(--color-text-strong) font-bold">{domain.label}</strong>
                          <p className="text-(--color-text-soft) text-xs leading-relaxed m-0 line-clamp-2">{domain.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-(--color-text-muted)">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${domain.color}12`, color: domain.color }}><Target size={10} />{domain.goals.length} hedef</span>
                            <span className="flex items-center gap-1 text-(--color-text-muted)"><Gamepad2 size={10} />{gameMappingCount} oyun</span>
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

                return (
                  <div className="space-y-5">
                    {/* ── Premium Section Header ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-5" style={{ background: `linear-gradient(135deg, ${domain.color}10 0%, var(--color-surface-strong) 100%)` }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #8b5cf6, transparent)` }} />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: domain.color, boxShadow: `0 4px 12px ${domain.color}50` }}>
                              <DomainIcon iconKey={domain.icon} size={15} color="white" />
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: domain.color }}>{domain.label}</span>
                          </div>
                          <h2 className="text-xl font-extrabold text-(--color-text-strong) m-0 tracking-tight">Terapi Hedefleri ve Aktiviteler</h2>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button type="button"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-none cursor-pointer transition-all text-(--color-text-body) hover:text-(--color-text-strong)"
                            style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}
                            onClick={() => setTpActiveTab("games")}>
                            <Gamepad2 size={13} />Oyun Eşleme
                          </button>
                          <button type="button"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-none cursor-pointer text-white transition-all"
                            style={{ background: "linear-gradient(135deg,var(--color-primary),#8b5cf6)", boxShadow: "0 4px 12px var(--color-primary)/40" }}
                            onClick={handleGeneratePlan}>
                            <CalendarDays size={13} />Plan Üret →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Premium stat strip ── */}
                    <div className="grid grid-cols-4 gap-3">
                      {([
                        {v: domain.goals.length, l: "Hedef", emoji: "🎯", color: "#2563eb"},
                        {v: domain.activities.length, l: "Aktivite", emoji: "🧩", color: "#8b5cf6"},
                        {v: domain.subSkills.length, l: "Beceri Alanı", emoji: "⚡", color: "#10b981"},
                        {v: favoriteActivities.length, l: "Favori", emoji: "⭐", color: "#f59e0b"},
                      ]).map(({v, l, emoji, color}) => (
                        <div key={l} className="relative overflow-hidden rounded-2xl border border-(--color-line) p-4 text-center" style={{ background: "var(--color-surface-strong)" }}>
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                          <span className="text-2xl block mb-1">{emoji}</span>
                          <span className="text-2xl font-extrabold block" style={{ color }}>{v}</span>
                          <span className="text-(--color-text-muted) text-xs">{l}</span>
                        </div>
                      ))}
                    </div>

                    {/* ── Goals accordion ── */}
                    <details open className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                      <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none font-semibold text-sm text-(--color-text-strong)" style={{ background: "var(--color-surface-elevated)" }}>
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#2563eb,#06b6d4)", boxShadow: "0 2px 6px #2563eb40" }}>
                            <Target size={12} className="text-white" />
                          </span>
                          Terapi Hedefleri
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#2563eb" }}>{domain.goals.length}</span>
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                        {domain.goals.map((goal, gi) => (
                          <div key={goal.id} className="relative overflow-hidden rounded-xl border border-(--color-line) p-3.5" style={{ background: "var(--color-surface-elevated)" }}>
                            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,#2563eb40,transparent)" }} />
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#2563eb,#8b5cf6)" }}>{gi + 1}</span>
                              <strong className="text-(--color-text-strong) text-sm leading-snug">{goal.label}</strong>
                            </div>
                            <p className="text-(--color-text-soft) text-xs mt-1 m-0 pl-7 leading-relaxed">{goal.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* ── Challenges + SubSkills row ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <details open className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                        <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none font-semibold text-sm text-(--color-text-strong)" style={{ background: "var(--color-surface-elevated)" }}>
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 2px 6px #f59e0b40" }}>
                              <Zap size={12} className="text-white" />
                            </span>
                            Fonksiyonel Zorluklar
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#f59e0b" }}>{domain.challenges.length}</span>
                        </summary>
                        <div className="flex flex-wrap gap-2 p-4">
                          {domain.challenges.map((ch) => (
                            <span key={ch.id} className="text-xs px-3 py-1.5 rounded-full border font-medium" style={{ background: "#f59e0b10", borderColor: "#f59e0b30", color: "#f59e0b" }}>{ch.label}</span>
                          ))}
                        </div>
                      </details>

                      <details open className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                        <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none font-semibold text-sm text-(--color-text-strong)" style={{ background: "var(--color-surface-elevated)" }}>
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", boxShadow: "0 2px 6px #10b98140" }}>
                              <Puzzle size={12} className="text-white" />
                            </span>
                            Alt Beceriler
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#10b981" }}>{domain.subSkills.length}</span>
                        </summary>
                        <div className="grid grid-cols-1 gap-2 p-4">
                          {domain.subSkills.map((skill) => (
                            <div key={skill.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#10b981" }} />
                              <div>
                                <strong className="text-(--color-text-strong) text-sm">{skill.label}</strong>
                                <p className="text-(--color-text-soft) text-xs mt-0.5 m-0">{skill.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>

                    {/* ── Favorites strip ── */}
                    {favoriteActivities.length > 0 && (
                      <div className="rounded-2xl border border-amber-500/30 p-4 overflow-hidden relative" style={{ background: "color-mix(in srgb,#f59e0b 6%,var(--color-surface-strong))" }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#f59e0b,transparent)" }} />
                        <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-1.5">⭐ Favori Aktiviteler <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "#f59e0b" }}>{favoriteActivities.length}</span></h3>
                        <div className="flex flex-wrap gap-2">
                          {favoriteActivities.map((act) => (
                            <div key={act.id} className="flex items-center gap-2 rounded-full px-3 py-1.5 border" style={{ background: "#f59e0b12", borderColor: "#f59e0b30" }}>
                              <span className="text-xs font-medium text-(--color-text-body)">{act.label}</span>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${act.difficulty === "kolay" ? "bg-emerald-500" : act.difficulty === "orta" ? "bg-amber-500" : "bg-red-500"}`} />
                              <button type="button" className="text-(--color-text-muted) hover:text-red-400 bg-transparent border-none cursor-pointer text-xs transition-colors" onClick={() => toggleFavoriteActivity(act.id)} title="Favoriden çıkar">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Activity cards section ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #8b5cf6, transparent)` }} />
                      {/* Section header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${domain.color}, #8b5cf6)` }}>
                            <ClipboardList size={15} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Aktivite Önerileri</h3>
                            <span className="text-xs text-(--color-text-muted)">{filteredActivities.length} aktivite listeleniyor</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-1.5 text-xs text-(--color-text-body) cursor-pointer px-3 py-1.5 rounded-xl border border-(--color-line) hover:border-(--color-primary)/50 transition-colors">
                            <input type="checkbox" checked={tpShowHomeOnly} onChange={(e) => setTpShowHomeOnly(e.target.checked)} className="w-3.5 h-3.5" />
                            <Home size={11} />Ev ödevi
                          </label>
                        </div>
                      </div>

                      {/* Filter bar */}
                      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-(--color-line)" style={{ background: "var(--color-chrome-section)" }}>
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
                          <input type="search" placeholder="Aktivite ara..." value={tpActivitySearch} onChange={(e) => setTpActivitySearch(e.target.value)} className={`${inputCls} pl-8 max-w-52`} />
                        </div>
                        <div className="flex items-center gap-1 p-0.5 rounded-xl border border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                          {(["all", "kolay", "orta", "zor"] as const).map((level) => {
                            const levelColor = level === "kolay" ? "#10b981" : level === "orta" ? "#f59e0b" : level === "zor" ? "#ef4444" : undefined;
                            const isActive = tpDifficultyFilter === level;
                            return (
                              <button key={level} type="button"
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all"
                                style={{
                                  background: isActive ? (levelColor ?? "var(--color-primary)") : "transparent",
                                  color: isActive ? "white" : "var(--color-text-soft)",
                                  boxShadow: isActive ? `0 2px 8px ${levelColor ?? "var(--color-primary)"}50` : "none",
                                }}
                                onClick={() => setTpDifficultyFilter(level)}>
                                {level === "all" ? "Tümü" : level === "kolay" ? "Kolay" : level === "orta" ? "Orta" : "Zor"}
                              </button>
                            );
                          })}
                        </div>
                        <select value={tpSubSkillFilter} onChange={(e) => setTpSubSkillFilter(e.target.value)} className={`${inputCls} max-w-[160px] text-xs`}>
                          <option value="all">Tüm beceriler</option>
                          {subSkillNames.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Cards grid */}
                      <div className="p-5">
                        {filteredActivities.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 py-12 text-(--color-text-muted)">
                            <Search size={40} strokeWidth={1.5} />
                            <p className="text-sm">Seçili filtrelere uygun aktivite bulunamadı.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredActivities.map((activity) => {
                              const isFav = tpFavoriteActivities.includes(activity.id);
                              const isExpanded = tpExpandedActivity === activity.id;
                              const customNote = tpCustomNotes[activity.id] ?? "";
                              const diffBg = activity.difficulty === "kolay" ? "#10b981" : activity.difficulty === "orta" ? "#f59e0b" : "#ef4444";
                              const diffBgLight = activity.difficulty === "kolay" ? "#10b98115" : activity.difficulty === "orta" ? "#f59e0b15" : "#ef444415";
                              const diffBorder = activity.difficulty === "kolay" ? "#10b98130" : activity.difficulty === "orta" ? "#f59e0b30" : "#ef444430";
                              return (
                                <div key={activity.id} className="relative overflow-hidden rounded-2xl border transition-all card-hover flex flex-col" style={{ borderColor: isExpanded ? domain.color + "60" : "var(--color-line)", background: "var(--color-surface-elevated)", boxShadow: isExpanded ? `0 0 20px ${domain.color}15` : "none" }}>
                                  {/* Difficulty color bar */}
                                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${diffBg}, transparent)` }} />

                                  <div className="p-4 flex flex-col gap-3 flex-1">
                                    {/* Card header */}
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <strong className="text-(--color-text-strong) text-sm leading-snug block">{activity.label}</strong>
                                        <span className="text-[11px] mt-0.5 block" style={{ color: domain.color }}>{activity.subSkill}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button type="button"
                                          className="w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all"
                                          style={{ background: isFav ? "#f59e0b20" : "transparent", color: isFav ? "#f59e0b" : "var(--color-text-muted)" }}
                                          onClick={() => toggleFavoriteActivity(activity.id)} title={isFav ? "Favoriden çıkar" : "Favorilere ekle"}>
                                          {isFav ? "★" : "☆"}
                                        </button>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: diffBgLight, color: diffBg, border: `1px solid ${diffBorder}` }}>
                                          {activity.difficulty === "kolay" ? "Kolay" : activity.difficulty === "orta" ? "Orta" : "Zor"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-(--color-text-soft) text-xs leading-relaxed m-0">{activity.description}</p>

                                    {/* Meta pills */}
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-(--color-line) text-(--color-text-muted)"><Tag size={9} />{activity.activityType}</span>
                                      <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-(--color-line) text-(--color-text-muted)"><Clock size={9} />{activity.sessionMinutes} dk</span>
                                      {activity.homeExercise && <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg text-emerald-400 border border-emerald-500/20" style={{ background: "#10b98112" }}><Home size={9} />Ev ödevi</span>}
                                    </div>

                                    {/* Expand toggle */}
                                    <button type="button"
                                      className="flex items-center gap-1.5 text-xs font-semibold border-none cursor-pointer bg-transparent transition-all self-start py-1"
                                      style={{ color: "var(--color-primary)" }}
                                      onClick={() => setTpExpandedActivity(isExpanded ? null : activity.id)}>
                                      {isExpanded ? "▴ Kapat" : "▾ Detaylar"}
                                    </button>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                      <div className="space-y-3 pt-3 border-t border-(--color-line)">
                                        {activity.materials.length > 0 && (
                                          <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) block mb-1.5">🔧 Materyaller</span>
                                            <div className="flex flex-wrap gap-1">
                                              {activity.materials.map((m) => <span key={m} className="bg-(--color-surface-strong) border border-(--color-line) text-(--color-text-soft) text-xs px-2.5 py-1 rounded-full">{m}</span>)}
                                            </div>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) block mb-1.5">🎯 İlgili Hedefler</span>
                                          <div className="flex flex-wrap gap-1">
                                            {activity.goals.map((gId) => {
                                              const goal = domain.goals.find((g) => g.id === gId);
                                              return goal ? <span key={gId} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${domain.color}15`, color: domain.color, border: `1px solid ${domain.color}30` }}>{goal.label}</span> : null;
                                            })}
                                          </div>
                                        </div>
                                        {activity.evidenceBase && (
                                          <div className="rounded-xl border border-amber-500/25 p-3" style={{ background: "#f59e0b08" }}>
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1.5"><FlaskConical size={10} />Kanıt Temeli</span>
                                            <p className="text-xs text-(--color-text-soft) m-0 leading-relaxed">{activity.evidenceBase}</p>
                                          </div>
                                        )}
                                        {activity.therapistTips && activity.therapistTips.length > 0 && (
                                          <div className="rounded-xl border p-3" style={{ background: "var(--color-primary)/5", borderColor: "var(--color-primary)/20" }}>
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-(--color-primary) mb-2"><Lightbulb size={10} />Terapist İpuçları</span>
                                            <ul className="space-y-1.5 m-0 pl-0 list-none">
                                              {activity.therapistTips.map((tip, ti) => (
                                                <li key={ti} className="text-xs text-(--color-text-soft) flex gap-2 items-start leading-snug">
                                                  <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 text-white" style={{ background: "var(--color-primary)" }}>{ti + 1}</span>
                                                  {tip}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) block mb-1.5">📝 Terapist Notu</span>
                                          <textarea value={customNote} onChange={(e) => saveTpCustomNote(activity.id, e.target.value)} placeholder="Bu aktivite için notlarınızı yazın..." className={`${inputCls} resize-none text-xs`} rows={2} />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Games Mapping Tab ── */}
              {tpActiveTab === "games" && tpSelectedDomain && (() => {
                const domain = THERAPY_DOMAINS.find((d) => d.key === tpSelectedDomain);
                if (!domain) return null;
                const gameMappings = getGameMappingsForDomain(tpSelectedDomain);
                const diffBadge = (d: string) => d === "kolay"
                  ? { bg: "#10b98115", color: "#10b981", border: "#10b98130", label: "Kolay" }
                  : d === "orta"
                  ? { bg: "#f59e0b15", color: "#f59e0b", border: "#f59e0b30", label: "Orta" }
                  : { bg: "#ef444415", color: "#ef4444", border: "#ef444430", label: "Zor" };
                const gameIcon = (key: string) => { const Icon = GAME_ICON_MAP[key] ?? Gamepad2; return <Icon size={22} />; };
                const gameAccent: Record<string, string> = {
                  memory: "#2563eb", pairs: "#8b5cf6", pulse: "#10b981",
                  route: "#f59e0b", difference: "#ec4899", scan: "#06b6d4",
                };
                return (
                  <div className="space-y-6">
                    {/* ── Premium Header ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-6" style={{ background: `linear-gradient(135deg, ${domain.color}10 0%, var(--color-surface-strong) 100%)` }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #8b5cf6, transparent)` }} />
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: domain.color, boxShadow: `0 4px 12px ${domain.color}50` }}>
                          <DomainIcon iconKey={domain.icon} size={18} color="white" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-widest block" style={{ color: domain.color }}>{domain.label}</span>
                          <h2 className="text-xl font-extrabold text-(--color-text-strong) m-0 tracking-tight">Dijital Oyun Rehberi</h2>
                        </div>
                      </div>
                      <p className="text-(--color-text-soft) text-sm m-0 leading-relaxed max-w-2xl">Her oyunun kanıt temeli, önerilen seans dozu ve seansta kullanım rehberi. Ergoterapist olarak doğru oyunu doğru danışana eşleştirin.</p>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: domain.color }}>{gameMappings.length} Uyumlu Oyun</span>
                        <span className="text-xs text-(--color-text-muted)">{GAME_THERAPY_MAPPINGS.length} oyunun tamamı değerlendirildi</span>
                      </div>
                    </div>

                    {/* ── Game cards ── */}
                    <div className="space-y-5">
                      {gameMappings.map((mapping, mi) => {
                        const gameTab = GAME_TABS.find((g) => g.key === mapping.gameKey);
                        if (!gameTab) return null;
                        const accent = gameAccent[mapping.gameKey] ?? "var(--color-primary)";
                        return (
                          <div key={mapping.gameKey} className="relative overflow-hidden rounded-3xl border transition-all card-hover" style={{ borderColor: `${accent}40`, background: "var(--color-surface-strong)" }}>
                            {/* Top accent line */}
                            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${domain.color}, transparent)` }} />

                            {/* Card header */}
                            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-(--color-line)" style={{ background: `${accent}06` }}>
                              <div className="flex items-center gap-4">
                                {/* Game icon with glow */}
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${accent}25, ${accent}10)`, border: `1px solid ${accent}30`, boxShadow: `0 4px 16px ${accent}25`, color: accent }}>
                                  {gameIcon(mapping.gameKey)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: accent }}>#{mi + 1}</span>
                                    <strong className="text-(--color-text-strong) text-base font-extrabold">{gameTab.title}</strong>
                                  </div>
                                  <span className="text-(--color-text-muted) text-xs block mb-2">{gameTab.kicker}</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {mapping.purposes.map((p) => (
                                      <span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>{GAME_PURPOSE_LABELS[p]}</span>
                                    ))}
                                    {mapping.difficultyFit.map((d) => {
                                      const db = diffBadge(d);
                                      return <span key={d} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: db.bg, color: db.color, border: `1px solid ${db.border}` }}>{db.label}</span>;
                                    })}
                                  </div>
                                </div>
                              </div>
                              <button type="button" className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-none cursor-pointer text-white transition-all" style={{ background: `linear-gradient(135deg, ${accent}, ${domain.color})`, boxShadow: `0 4px 14px ${accent}50` }} onClick={() => openGameView(mapping.gameKey)}>
                                ▶ Oyna
                              </button>
                            </div>

                            {/* Card body: 2-col grid */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left */}
                              <div className="space-y-5">
                                <div>
                                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: accent }}>
                                    <span className="w-4 h-4 rounded flex items-center justify-center" style={{ background: `${accent}20` }}>⚡</span>
                                    Terapötik Etki
                                  </p>
                                  <p className="text-sm text-(--color-text-body) leading-relaxed m-0">{mapping.therapeuticRationale}</p>
                                </div>
                                <div>
                                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-(--color-text-muted) mb-2">
                                    <span className="w-4 h-4 rounded flex items-center justify-center bg-(--color-surface-elevated)">🎮</span>
                                    Seansta Kullanım
                                  </p>
                                  <p className="text-sm text-(--color-text-soft) leading-relaxed m-0">{mapping.howToUseInSession}</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/25 p-4" style={{ background: "#f59e0b08" }}>
                                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-500 mb-2"><BookOpen size={12} />Bilimsel Referans</p>
                                  <p className="text-xs text-(--color-text-soft) m-0 leading-relaxed italic">{mapping.researchBasis}</p>
                                </div>
                              </div>

                              {/* Right */}
                              <div className="space-y-5">
                                {/* Dosage HUD */}
                                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${accent}30` }}>
                                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: `${accent}15` }}>
                                    <Clock size={13} style={{ color: accent }} />
                                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: accent }}>Önerilen Doz</span>
                                  </div>
                                  <div className="flex" style={{ background: "var(--color-surface-elevated)" }}>
                                    <div className="flex-1 text-center py-4 border-r border-(--color-line)">
                                      <div className="text-3xl font-black leading-none" style={{ color: accent }}>{mapping.sessionDosage.minutesPerSession}</div>
                                      <div className="text-[10px] text-(--color-text-muted) mt-1 font-semibold uppercase tracking-wide">dk / seans</div>
                                    </div>
                                    <div className="flex-1 text-center py-4">
                                      <div className="text-3xl font-black leading-none" style={{ color: accent }}>{mapping.sessionDosage.sessionsPerWeek}<span className="text-xl">×</span></div>
                                      <div className="text-[10px] text-(--color-text-muted) mt-1 font-semibold uppercase tracking-wide">seans / hafta</div>
                                    </div>
                                  </div>
                                  <div className="px-4 py-3 border-t border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) mb-1">İlerleme Rehberi</p>
                                    <p className="text-xs text-(--color-text-soft) m-0 leading-relaxed">{mapping.sessionDosage.progressionNote}</p>
                                  </div>
                                </div>

                                {/* Outcome indicators */}
                                <div className="rounded-2xl border border-(--color-line) p-4" style={{ background: "var(--color-surface-elevated)" }}>
                                  <p className="text-[11px] font-black uppercase tracking-widest text-(--color-text-muted) mb-3">📊 Ölçüm Göstergeleri</p>
                                  <ul className="space-y-2 m-0 pl-0 list-none">
                                    {mapping.outcomeIndicators.map((oi, i) => (
                                      <li key={i} className="text-xs text-(--color-text-soft) flex gap-2.5 items-start leading-snug">
                                        <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5 text-white" style={{ background: accent }}>{i + 1}</span>
                                        {oi}
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

                    {/* ── Quick Reference Table ── */}
                    <details open className="overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-bold text-sm text-(--color-text-strong)" style={{ background: "var(--color-surface-elevated)" }}>
                        <span className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary),#8b5cf6)" }}>
                            <BarChart3 size={12} className="text-white" />
                          </span>
                          Tüm Oyun–Amaç Eşleme Tablosu (Hızlı Referans)
                        </span>
                        <span className="text-xs text-(--color-text-muted)">· alan uyumlu oyunlar vurgulandı</span>
                      </summary>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ background: "var(--color-surface-elevated)" }}>
                              <th className="text-left px-5 py-3 font-black uppercase tracking-wider text-(--color-text-strong) text-[11px]">Oyun</th>
                              <th className="text-left px-5 py-3 font-black uppercase tracking-wider text-(--color-text-strong) text-[11px]">Terapötik Amaçlar</th>
                              <th className="text-left px-5 py-3 font-black uppercase tracking-wider text-(--color-text-strong) text-[11px]">Süre</th>
                              <th className="text-left px-5 py-3 font-black uppercase tracking-wider text-(--color-text-strong) text-[11px]">Sıklık</th>
                              <th className="text-left px-5 py-3 font-black uppercase tracking-wider text-(--color-text-strong) text-[11px]">Zorluk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {GAME_THERAPY_MAPPINGS.map((m) => {
                              const gt = GAME_TABS.find((g) => g.key === m.gameKey);
                              const inDomain = m.suitableDomains.includes(tpSelectedDomain!);
                              const acc = gameAccent[m.gameKey] ?? "var(--color-primary)";
                              return (
                                <tr key={m.gameKey} className={`border-t border-(--color-line) transition-colors ${inDomain ? "hover:bg-(--color-surface-elevated)" : "opacity-35"}`}>
                                  <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                      {inDomain && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: acc }} />}
                                      <strong className="text-(--color-text-strong)" style={inDomain ? { color: acc } : {}}>{gt?.title ?? m.gameKey}</strong>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-(--color-text-soft)">{m.purposes.map((p) => GAME_PURPOSE_LABELS[p]).join(", ")}</td>
                                  <td className="px-5 py-3 font-semibold text-(--color-text-strong)">{m.sessionDosage.minutesPerSession} dk</td>
                                  <td className="px-5 py-3 font-semibold text-(--color-text-strong)">{m.sessionDosage.sessionsPerWeek}×/hafta</td>
                                  <td className="px-5 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {m.difficultyFit.map((d) => {
                                        const db = diffBadge(d);
                                        return <span key={d} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: db.bg, color: db.color }}>{db.label}</span>;
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
                const dayColors = ["#2563eb","#8b5cf6","#10b981","#f59e0b","#ec4899","#06b6d4","#ef4444"];
                return (
                  <div className="space-y-6">
                    {/* ── Header ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-6" style={{ background: `linear-gradient(135deg, ${domain.color}10 0%, var(--color-surface-strong) 100%)` }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #06b6d4, transparent)` }} />
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: domain.color, boxShadow: `0 4px 12px ${domain.color}50` }}>
                          <DomainIcon iconKey={domain.icon} size={18} color="white" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-widest block" style={{ color: domain.color }}>{domain.label}</span>
                          <h2 className="text-xl font-extrabold text-(--color-text-strong) m-0 tracking-tight">Haftalık Terapi Planı</h2>
                        </div>
                      </div>
                      <p className="text-(--color-text-soft) text-sm m-0">Seanslarınızı planlayın. Sistem, seçilen gün sayısına göre aktivite ve dijital oyun dağılımı oluşturur.</p>
                    </div>

                    {/* ── Day Selector ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-5" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,var(--color-primary),#8b5cf6,transparent)" }} />
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary),#8b5cf6)" }}>
                            <CalendarDays size={13} className="text-white" />
                          </div>
                          <span className="text-sm font-bold text-(--color-text-strong)">Seans Günleri</span>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: tpSelectedDays.length > 0 ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                          {tpSelectedDays.length} / 7 gün
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {ALL_DAYS.map((day, di) => {
                          const isSelected = tpSelectedDays.includes(day);
                          const dc = dayColors[di];
                          return (
                            <button key={day} type="button" onClick={() => togglePlanDay(day)}
                              className="px-4 py-2 rounded-xl text-xs font-bold border-none cursor-pointer transition-all"
                              style={{
                                background: isSelected ? dc : "var(--color-surface-elevated)",
                                color: isSelected ? "white" : "var(--color-text-soft)",
                                boxShadow: isSelected ? `0 4px 12px ${dc}50` : "none",
                                transform: isSelected ? "scale(1.05)" : "scale(1)",
                              }}>
                              {dayShort[day]}
                            </button>
                          );
                        })}
                      </div>
                      {tpSelectedDays.length === 0 && (
                        <p className="text-xs text-amber-500 mt-3 flex items-center gap-1.5">⚠️ En az 1 gün seçin.</p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <button type="button"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg,var(--color-primary),#8b5cf6)", boxShadow: "0 4px 14px var(--color-primary)/40" }}
                          onClick={handleGeneratePlan} disabled={tpSelectedDays.length === 0}>
                          {tpGeneratedPlan ? <><RefreshCw size={15} />Planı Güncelle</> : <><CalendarDays size={15} />Plan Oluştur</>}
                        </button>
                      </div>
                    </div>

                    {!tpGeneratedPlan ? (
                      <div className="flex flex-col items-center gap-4 py-16 text-center rounded-3xl border border-(--color-line) border-dashed" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary)/15,#8b5cf6/15)" }}>
                          <CalendarDays size={28} className="text-(--color-primary)" />
                        </div>
                        <h3 className="text-(--color-text-strong) font-extrabold text-lg m-0">Henüz plan oluşturulmadı</h3>
                        <p className="text-(--color-text-soft) text-sm m-0 max-w-sm">Yukarıdan gün seçin ve "Plan Oluştur" butonuna tıklayın. Sistem otomatik bir terapi planı oluşturacak.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Weekly summary cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { icon: "🎯", label: "Ana Hedef", content: tpGeneratedPlan.weeklyPlan.mainGoal, color: "#2563eb" },
                            { icon: "🏠", label: "Ev Ödevi", content: tpGeneratedPlan.weeklyPlan.homeExercise, color: "#10b981" },
                            { icon: "🧩", label: "Aktivite Sayısı", content: `${tpGeneratedPlan.weeklyPlan.keyActivities.length} aktivite`, color: "#8b5cf6" },
                            { icon: "🎮", label: "Dijital Oyun", content: `${tpGeneratedPlan.weeklyPlan.digitalGames.length} oyun`, color: "#f59e0b" },
                          ].map(({icon, label, content, color}) => (
                            <div key={label} className="relative overflow-hidden rounded-2xl border border-(--color-line) p-4" style={{ background: "var(--color-surface-elevated)" }}>
                              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                              <span className="text-2xl block mb-1.5">{icon}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) block mb-1">{label}</span>
                              <strong className="text-(--color-text-strong) text-xs leading-snug">{content}</strong>
                            </div>
                          ))}
                        </div>

                        {/* Key activities + digital games row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                            <div className="px-5 py-3 border-b border-(--color-line) flex items-center gap-2" style={{ background: "#2563eb12" }}>
                              <span className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ background: "#2563eb" }}>🧩</span>
                              <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#2563eb" }}>Anahtar Aktiviteler</span>
                            </div>
                            <ul className="p-4 space-y-2 m-0 pl-0 list-none">
                              {tpGeneratedPlan.weeklyPlan.keyActivities.map((a, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs text-(--color-text-soft)">
                                  <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5 text-white" style={{ background: "#2563eb" }}>{i + 1}</span>
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                            <div className="px-5 py-3 border-b border-(--color-line) flex items-center gap-2" style={{ background: "#8b5cf612" }}>
                              <span className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ background: "#8b5cf6" }}>🎮</span>
                              <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#8b5cf6" }}>Dijital Oyunlar</span>
                            </div>
                            <div className="p-4 flex flex-wrap gap-2">
                              {tpGeneratedPlan.weeklyPlan.digitalGames.map((gk) => {
                                const gt = GAME_TABS.find((g) => g.key === gk);
                                return (
                                  <button key={gk} type="button"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-none cursor-pointer text-white transition-all hover:opacity-90"
                                    style={{ background: "linear-gradient(135deg,#8b5cf6,#2563eb)", boxShadow: "0 2px 8px #8b5cf640" }}
                                    onClick={() => openGameView(gk)}>
                                    ▶ {gt?.title ?? gk}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Daily session cards */}
                        <div>
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary),#10b981)" }}>
                              <CalendarDays size={13} className="text-white" />
                            </div>
                            <h3 className="text-base font-extrabold text-(--color-text-strong) m-0">Günlük Yapı — {tpGeneratedPlan.dailyStructure.length} Seans</h3>
                          </div>
                          <div className={`grid gap-4 ${tpGeneratedPlan.dailyStructure.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : tpGeneratedPlan.dailyStructure.length <= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                            {tpGeneratedPlan.dailyStructure.map((day, i) => {
                              const gameTab = GAME_TABS.find((g) => g.key === day.game);
                              const dc = dayColors[i % dayColors.length];
                              return (
                                <div key={i} className="relative overflow-hidden rounded-2xl border transition-all card-hover" style={{ borderColor: `${dc}40`, background: "var(--color-surface-elevated)" }}>
                                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${dc}, transparent)` }} />
                                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-(--color-line)" style={{ background: `${dc}10` }}>
                                    <span className="w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 text-white" style={{ background: dc }}>{i + 1}</span>
                                    <span className="text-(--color-text-strong) text-sm font-bold">{day.dayLabel}</span>
                                  </div>
                                  <div className="p-4 flex flex-col gap-3">
                                    <div>
                                      <span className="text-[9px] font-black uppercase tracking-widest text-(--color-text-muted) block mb-1">🧩 Aktivite</span>
                                      <span className="text-xs text-(--color-text-body) leading-snug">{day.activity}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-black uppercase tracking-widest text-(--color-text-muted) block mb-1">🎮 Dijital Oyun</span>
                                      <button type="button"
                                        className="text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-white"
                                        style={{ background: dc, boxShadow: `0 2px 6px ${dc}50` }}
                                        onClick={() => openGameView(day.game)}>
                                        ▶ {gameTab?.title ?? day.game}
                                      </button>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-black uppercase tracking-widest text-(--color-text-muted) block mb-1">📝 Gözlem</span>
                                      <span className="text-xs text-(--color-text-soft)">{day.observation}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-amber-500/25 p-4 flex items-start gap-2.5" style={{ background: "#f59e0b08" }}>
                          <span className="text-base shrink-0">📌</span>
                          <p className="text-(--color-text-muted) text-xs m-0 italic leading-relaxed">{tpGeneratedPlan.weeklyPlan.sessionNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Progress Tab ── */}
              {tpActiveTab === "progress" && (() => {
                const selectedProgressClient = clientOptions.find((c) => c.id === tpSelectedClientId) ?? null;
                if (!selectedProgressClient) return (
                  <div className="flex flex-col items-center gap-4 py-16 text-center rounded-3xl border border-(--color-line) border-dashed" style={{ background: "var(--color-surface-strong)" }}>
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary)/15,#8b5cf6/15)" }}>
                      <BarChart3 size={28} className="text-(--color-primary)" />
                    </div>
                    <h3 className="text-(--color-text-strong) font-extrabold text-lg m-0">Danışan seçilmedi</h3>
                    <p className="text-(--color-text-soft) text-sm m-0">İlerleme takibi için sağ üstten bir danışan seçin.</p>
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
                  <div className="space-y-6">
                    {/* ── Header row ── */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-extrabold text-(--color-text-strong) m-0 tracking-tight">İlerleme Takibi</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-(--color-text-strong) font-semibold text-sm">{selectedProgressClient.displayName}</span>
                          {domain && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: domain.color }}><DomainIcon iconKey={domain.icon} size={10} />{domain.label}</span>}
                        </div>
                      </div>
                      <button type="button"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all"
                        style={{ background: "linear-gradient(135deg,var(--color-primary),#8b5cf6)", boxShadow: "0 4px 14px var(--color-primary)/40" }}
                        onClick={() => setTpShowProgressForm(!tpShowProgressForm)}>
                        + Kayıt Ekle
                      </button>
                    </div>

                    {/* ── Overall Progress Hero ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-6" style={{ background: "linear-gradient(135deg,var(--color-primary)/8 0%,#8b5cf6/5 100%)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,var(--color-primary),#8b5cf6,transparent)" }} />
                      <div className="flex items-center gap-6">
                        {/* Donut chart */}
                        <div className="relative w-24 h-24 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#progressGrad)" strokeWidth="3" strokeDasharray={`${overallAvg}, 100`} strokeLinecap="round" />
                            <defs><linearGradient id="progressGrad"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-(--color-text-strong)">{overallAvg}%</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-extrabold text-(--color-text-strong) m-0 mb-1">Genel İlerleme</h3>
                          <p className="text-(--color-text-soft) text-sm m-0">{clientProgress.length} kayıt · {goalAverages.filter((g) => g.count > 0).length}/{goals.length} hedef takipte</p>
                          {/* Mini bar */}
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${overallAvg}%`, background: "linear-gradient(90deg,var(--color-primary),#8b5cf6)" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Add Progress Form ── */}
                    {tpShowProgressForm && domain && (
                      <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,var(--color-primary),#8b5cf6,transparent)" }} />
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "var(--color-primary)/5" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary),#8b5cf6)" }}>
                            <TrendingUp size={15} className="text-white" />
                          </div>
                          <h4 className="text-(--color-text-strong) font-extrabold m-0">Yeni İlerleme Kaydı</h4>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <label className="flex flex-col gap-1.5 sm:col-span-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-(--color-text-muted)">Hedef</span>
                            <select value={tpProgressForm.goalId} onChange={(e) => setTpProgressForm((c) => ({ ...c, goalId: e.target.value }))} className={inputCls}>
                              <option value="">Hedef seçin...</option>
                              {goals.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                            </select>
                          </label>
                          <label className="flex flex-col gap-2 sm:col-span-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-(--color-text-muted)">Bağımsızlık Düzeyi</span>
                              <span className="text-lg font-black text-(--color-primary)">{tpProgressForm.value}%</span>
                            </div>
                            <input type="range" min={0} max={100} step={5} value={tpProgressForm.value} onChange={(e) => setTpProgressForm((c) => ({ ...c, value: Number(e.target.value) }))} className="w-full accent-blue-600" />
                            <div className="flex justify-between text-[10px] text-(--color-text-muted) font-semibold">
                              {INDEPENDENCE_LEVELS.map((lvl) => <span key={lvl.key}>{lvl.label}</span>)}
                            </div>
                          </label>
                          <label className="flex flex-col gap-1.5 sm:col-span-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-(--color-text-muted)">Not</span>
                            <textarea value={tpProgressForm.note} onChange={(e) => setTpProgressForm((c) => ({ ...c, note: e.target.value }))} placeholder="Gözlem veya değerlendirme notu..." className={`${inputCls} resize-none`} rows={3} />
                          </label>
                          <div className="flex gap-2 sm:col-span-2">
                            <button type="button"
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all"
                              style={{ background: "linear-gradient(135deg,var(--color-primary),#8b5cf6)", boxShadow: "0 4px 14px var(--color-primary)/40" }}
                              onClick={handleAddProgressEntry}>
                              Kaydet
                            </button>
                            <button type="button"
                              className="px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-text-strong)"
                              style={{ background: "var(--color-surface-elevated)" }}
                              onClick={() => setTpShowProgressForm(false)}>
                              İptal
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Goal Averages ── */}
                    {goalAverages.length > 0 && (
                      <div className="rounded-3xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#10b981,transparent)" }} />
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }}>
                            <Target size={13} className="text-white" />
                          </div>
                          <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Hedef Bazlı İlerleme</h3>
                          <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#10b981" }}>{goalAverages.filter(g => g.count > 0).length} hedef</span>
                        </div>
                        <div className="p-5 space-y-4">
                          {goalAverages.map((ga, i) => {
                            const barColor = ga.average >= 75 ? "#10b981" : ga.average >= 50 ? "#f59e0b" : ga.average >= 25 ? "#2563eb" : "#ef4444";
                            return (
                              <div key={ga.id}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-(--color-text-body) font-medium">{ga.label}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-(--color-text-muted)">{ga.count} kayıt</span>
                                    <span className="text-base font-black" style={{ color: barColor }}>{ga.average}%</span>
                                  </div>
                                </div>
                                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${ga.average}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}90)` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Progress History ── */}
                    <div className="relative rounded-3xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                          <BarChart3 size={13} className="text-white" />
                        </div>
                        <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">İlerleme Geçmişi</h3>
                        <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#f59e0b" }}>{clientProgress.length}</span>
                      </div>
                      {clientProgress.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                          <span className="text-4xl">📝</span>
                          <p className="text-sm text-(--color-text-muted)">Henüz ilerleme kaydı eklenmedi.<br />Yukarıdaki "Kayıt Ekle" butonunu kullanın.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-(--color-line)">
                          {clientProgress.map((entry) => {
                            const goal = goals.find((g) => g.id === entry.goalId);
                            const barColor = entry.value >= 75 ? "#10b981" : entry.value >= 50 ? "#f59e0b" : entry.value >= 25 ? "#2563eb" : "#ef4444";
                            return (
                              <div key={entry.id} className="px-5 py-4 flex items-center gap-4 hover:bg-(--color-surface-elevated) transition-colors">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-black text-white" style={{ background: `linear-gradient(135deg, ${barColor}, ${barColor}90)` }}>
                                  {entry.value}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <strong className="text-(--color-text-strong) text-sm block truncate">{goal?.label ?? entry.goalId}</strong>
                                  <span className="text-(--color-text-muted) text-xs">{formatDate(entry.date)}</span>
                                  {entry.note && <p className="text-(--color-text-soft) text-xs mt-0.5 m-0 truncate">{entry.note}</p>}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs text-(--color-text-muted)">%</span>
                                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                                      <div className="h-full rounded-full transition-all" style={{ width: `${entry.value}%`, background: barColor }} />
                                    </div>
                                  </div>
                                  <button type="button"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border-none cursor-pointer transition-colors text-(--color-text-muted) hover:text-red-400 hover:bg-red-500/10"
                                    style={{ background: "transparent" }}
                                    onClick={() => handleDeleteProgressEntry(entry.id)}>
                                    ✕
                                  </button>
                                </div>
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
      {/* ── Premium Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden" style={{ background: "var(--color-chrome-nav)", backdropFilter: "blur(24px)", borderTop: "1px solid var(--color-line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch h-16 px-2">
          {([
            { view: "dashboard" as AppView, Icon: LayoutDashboard, label: "Panel", gradient: "linear-gradient(135deg,#2563eb,#06b6d4)", tooltip: "Ana Panel" },
            { view: "clients" as AppView, Icon: Users, label: "Danışanlar", gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)", tooltip: "Danışan Listesi" },
            { view: "games" as AppView, Icon: Gamepad2, label: "Oyunlar", gradient: "linear-gradient(135deg,#10b981,#2563eb)", tooltip: "Oyun Seç" },
            { view: "therapy-program" as AppView, Icon: Stethoscope, label: "Terapi", gradient: "linear-gradient(135deg,#8b5cf6,#6366f1)", tooltip: "Terapi Programı" },
            { view: "reports" as AppView, Icon: BarChart3, label: "Rapor", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)", tooltip: "Raporlar & Analitik" },
          ]).map(({ view, Icon, label, gradient, tooltip }) => {
            const isActive = activeAppView === view || (view === "clients" && activeAppView === "client-detail");
            return (
              <button
                key={view}
                type="button"
                data-tooltip={tooltip}
                data-tooltip-dir="top"
                className="flex-1 flex flex-col items-center justify-center gap-0.5 border-none cursor-pointer transition-all relative"
                style={{ background: "transparent" }}
                onClick={() => setActiveAppView(view)}
              >
                {/* Active top indicator bar */}
                <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-300"
                  style={{
                    width: isActive ? "32px" : "0px",
                    height: "3px",
                    background: isActive ? gradient : "transparent",
                    boxShadow: isActive ? `0 2px 8px rgba(0,0,0,0.3)` : "none",
                    opacity: isActive ? 1 : 0,
                  }} />
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: isActive ? gradient : "transparent",
                    boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.25)" : "none",
                    transform: isActive ? "scale(1.12) translateY(-2px)" : "scale(1)",
                  }}>
                  <Icon size={18} className={isActive ? "text-white" : "text-(--color-text-muted)"} />
                </div>
                <span className={`text-[9px] font-bold leading-none tracking-wide transition-all duration-200 ${isActive ? "text-(--color-primary)" : "text-(--color-text-muted)"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <ToastContainer />
    </main>
  );
}

