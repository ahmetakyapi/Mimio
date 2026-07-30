"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  LayoutDashboard, Users, Gamepad2, Stethoscope, UserPlus, Brain, Hand, Eye, LogOut, Clock, ChevronDown, RotateCcw, Sun, Moon,
  Baby, Zap, Puzzle, PersonStanding, Briefcase, Handshake,
  Target, ClipboardList, Home, Tag, FlaskConical, Lightbulb, BookOpen, BarChart3, Search, RefreshCw, Map, CalendarDays, TrendingUp, Grid3X3,
  Bell, FileText, Award, Activity, ChevronRight, Star, Flame, Trophy, ArrowUpRight, ArrowDownRight,
  Plus, Minus, Check, Archive, Edit2, Timer, X, Download, Upload, CreditCard, Printer, Cake, Play,
  type LucideIcon,
} from "lucide-react";
import { printClientReport, exportSessionsCSV as exportSessionsCSVUtil, exportGoalsCSV } from "@/lib/export-utils";
import { motion } from "framer-motion";
import { GameArena } from "./game/GameArena";
import { BlockMark } from "./brand/BlockMark";
import { SessionTrendChart } from "./shared/SessionTrendChart";
import {
  ARENA_KEYBOARD_HINT,
  differenceCue,
  feedbackCue,
  logicCue,
  memoryCue,
  pairsCue,
  pulseCue,
  routeCue,
  scanCue,
  type GameCue,
} from "@/lib/game-cues";
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
  AGE_GROUPS,
  ENVIRONMENT_OPTIONS,
  GAME_PURPOSE_LABELS,
  generateWeeklyPlanSuggestion,
  getGameMappingsForDomain,
  type AgeGroupKey,
  type EnvironmentType,
  type TherapyDomainKey,
  type TherapyPlanSuggestion,
  type DifficultyLevel,
  type ProgressEntry,
} from "@/lib/therapy-program-data";
import { buildTherapyPlan, type ClientContext } from "@/lib/therapy-matching";
import { MEASURE_KIND_LABELS } from "@/lib/outcome-measures";

// ── Extracted modules ──
import type {
  GameKey, GameCategoryKey, CommandKey,
  MemoryState, PairsState, PulseState, RouteState,
  DifferenceState, ScanState, LogicState,
  Scoreboard, SessionSetState,
  TherapistDraftState, ClientDraftState,
  SymbolVariant, TherapyProtocol,
} from "@/lib/game-types";
import {
  STORAGE_KEY, SESSION_CONTEXT_KEY, ACTIVE_THERAPIST_KEY, NOTES_KEY, WEEKLY_PLANS_KEY,
  MEMORY_START_LENGTH, PULSE_TOTAL_ROUNDS, ROUTE_TOTAL_ROUNDS, DIFFERENCE_TOTAL_ROUNDS, SCAN_TOTAL_ROUNDS, TOTAL_PAIR_MATCHES,
  MEMORY_TILES, PULSE_LABELS, ROUTE_COMMANDS, SYMBOL_LIBRARY,
  SESSION_SET_PRESETS, GAME_TABS, GAME_CATEGORIES, CATEGORY_ACCENTS, gameAccent, EMPTY_SCOREBOARD,
  PHASE_LABELS, DAY_KEYS, DAY_LABELS,
  DIFFICULTY_LABELS, DIFFICULTY_COLORS, GAME_DIFF_CONFIG,
  LOGIC_SHAPES, LOGIC_COLORS,
  GAME_SCORE_SCALE,
} from "@/lib/game-constants";
import {
  randomIndex, shuffleArray, createMemorySequence, getDifficultyLevel,
  createPairsDeck, createRouteCommand, createDifferenceRound, createScanRound,
  mergeScoreboard, renderLogicShape, createLogicPuzzle, moveGridCursor,
} from "@/lib/game-logic";
import { THERAPY_PROTOCOLS, GOAL_PROTOCOL_MAP } from "@/lib/therapy-protocols";
import { analyzeClientGames, generateTherapySuggestions } from "@/lib/therapy-suggestions";
import {
  formatDuration, formatPlayedAt, formatDate, formatElapsed,
  getTodayString, getWeekStart, addDays, getPhaseLabel,
  getDatabaseStatusLabel, patternStyle,
  parseSessionNotes, parseWeeklyPlans,
} from "@/lib/format-utils";
import { ConfettiPieces } from "@/components/shared/ConfettiPieces";
import { StarRating } from "@/components/shared/StarRating";
import { GameResultOverlay } from "@/components/shared/GameResultOverlay";
import { SessionSetSummary } from "@/components/shared/SessionSetSummary";
import { ToastContainer, showToast } from "@/components/shared/ToastContainer";
import { MilestoneContainer, checkAndShowMilestones } from "@/components/shared/MilestoneToast";
import { WeeklySummaryCard, GameDistributionChart } from "@/components/shared/DashboardAnalytics";
import { AchievementPanel, ACHIEVEMENTS, type AchievementStats, type EarnedAchievement } from "@/components/shared/AchievementBadge";
import { QuickSessionStart } from "@/components/shared/QuickSessionStart";
import { ClientProgressRadar } from "@/components/shared/ClientProgressRadar";
import { SessionReminderBanner } from "@/components/shared/SessionReminder";
import { ClientComparison } from "@/components/shared/ClientComparison";
import { GameTrendChart } from "@/components/shared/GameTrendChart";
import { OnboardingTour } from "@/components/shared/OnboardingTour";
import { WeeklyProgressReport } from "@/components/shared/WeeklyProgressReport";
import { useCountUp } from "@/hooks/useCountUp";

// ── Remaining constants that depend on lucide-react icons ──
const CATEGORY_ICONS = { memorySkills: Brain, motorSkills: Hand, visualSkills: Eye, cognitiveSkills: Grid3X3 } as const;


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


/**
 * Ölçüm kartı.
 *
 * Önceki sürüm her kartı kendi renginde bir degradeyle boyuyor, dışına
 * 48px'lik renkli bir hâle koyuyor, sağ alta da bir kıvılcım grafiği
 * çiziyordu. Grafik `points="0,14 8,10 16,11 24,5 32,7 40,2"` sabitiydi —
 * dört kartın dördünde aynı, veriyle hiç ilgisi olmayan bir çizgi. Klinik
 * bir araçta uydurma grafik olmaz; ya gerçek veriyi çizer ya hiçbir şey.
 *
 * Yeni kart bir gösterge paneli hücresi gibi davranır: tek yüzey, kılcal
 * çerçeve, büyük mono rakam. Renk yalnızca ikon karesinde ve — varsa —
 * gerçek seri grafiğinde görünür.
 */
interface StatCardProps {
  v: number;
  l: string;
  sub: string;
  tooltip: string;
  accent: string;
  Icon: typeof LayoutDashboard;
  /** Gerçek veriden türetilmiş seri. Yoksa grafik çizilmez. */
  series?: readonly number[];
  /** Önceki döneme göre fark. null ise rozet gösterilmez. */
  delta?: number | null;
  deltaUnit?: string;
}
function StatCard({ v, l, sub, tooltip, accent, Icon, series, delta, deltaUnit }: StatCardProps) {
  const animated = useCountUp(v, 900);

  /* Seri en az iki nokta ve bir miktar değişim taşımıyorsa çizmiyoruz:
     düz bir çizgi bilgi değil gürültüdür. */
  const chart = (() => {
    if (!series || series.length < 3) return null;
    const max = Math.max(...series);
    const min = Math.min(...series);
    if (max === min) return null;
    const w = 100;
    const h = 26;
    const step = w / (series.length - 1);
    return series
      .map((val, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(h - ((val - min) / (max - min)) * h).toFixed(1)}`)
      .join(" ");
  })();

  return (
    <div
      data-tooltip={tooltip}
      data-tooltip-dir="bottom"
      className="rounded-2xl p-4 lg:p-5 relative flex flex-col gap-3 transition-colors duration-200 cursor-default hover:border-(--color-line-strong)"
      style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
      aria-label={`${l}: ${v} ${sub}`}>
      <div className="flex items-start justify-between gap-2">
        <span
          className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in srgb, ${accent} 13%, transparent)` }}>
          <Icon size={15} style={{ color: accent }} />
        </span>
        {typeof delta === "number" && delta !== 0 && (
          <span
            className="numeral text-[11px] font-bold flex items-center gap-0.5 shrink-0"
            style={{ color: delta > 0 ? "var(--color-accent-green)" : "var(--color-accent-red)" }}>
            {delta > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {delta > 0 ? "+" : "−"}{Math.abs(delta)}
            {deltaUnit ? <span className="font-medium text-(--color-text-muted)"> {deltaUnit}</span> : null}
          </span>
        )}
      </div>

      <div>
        <strong className="numeral text-3xl lg:text-[2.5rem] font-extrabold block leading-none text-(--color-text-strong)">
          {animated}
        </strong>
        <span className="text-(--color-text-body) text-xs lg:text-sm font-semibold block leading-tight mt-2">{l}</span>
        <span className="text-(--color-text-muted) text-[11px] block leading-tight mt-0.5">{sub}</span>
      </div>

      {chart && (
        <svg
          viewBox="0 0 100 26"
          preserveAspectRatio="none"
          className="w-full h-6 mt-auto"
          aria-hidden="true">
          <path
            d={chart}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.65}
          />
        </svg>
      )}
    </div>
  );
}

interface MimioAppProps {
  initialAppView?: "login" | "register";
  onLogout?: () => void;
}

export function MimioApp({ initialAppView = "login", onLogout }: MimioAppProps = {}) {
  const { theme, toggle: toggleTheme, setTheme } = useTheme();
  // ── New multi-screen state ──
  const [activeAppView, setActiveAppView] = useState<AppView>(initialAppView);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [allNotes, setAllNotes] = useState<SessionNote[]>([]);
  const [allWeeklyPlans, setAllWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [clientDetailTab, setClientDetailTab] = useState<"notes" | "plan" | "scores" | "progress" | "suggestions">("notes");
  const [noteForm, setNoteForm] = useState({ date: getTodayString(), content: "" });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvImportText, setCsvImportText] = useState("");
  const [csvImportError, setCsvImportError] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [noteFilterFrom, setNoteFilterFrom] = useState("");
  const [noteFilterTo, setNoteFilterTo] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [showShortcutGuide, setShowShortcutGuide] = useState(false);
  const [planEdits, setPlanEdits] = useState<Record<DayKey, WeeklyPlanEntry[]>>({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
  const [planWeekStart, setPlanWeekStart] = useState(getWeekStart());
  const [addClientDraft, setAddClientDraft] = useState<ClientDraftState>({ displayName: "", ageGroup: "", primaryGoal: "", supportLevel: "" });

  // ── Therapy Program state ──
  const THERAPY_PROGRESS_KEY = "mimio-therapy-progress-v1";
  const THERAPY_FAVORITES_KEY = "mimio-therapy-favorites-v1";
  const THERAPY_CUSTOM_NOTES_KEY = "mimio-therapy-custom-notes-v1";
  const [tpSelectedDomain, setTpSelectedDomain] = useState<TherapyDomainKey | null>(null);
  const [tpSelectedClientId, setTpSelectedClientId] = useState<string | null>(null);
  const [tpActiveTab, setTpActiveTab] = useState<"domains" | "activities" | "games" | "plan" | "progress" | "protocols">("domains");
  const [tpDifficultyFilter, setTpDifficultyFilter] = useState<DifficultyLevel | "all">("all");
  const [tpGeneratedPlan, setTpGeneratedPlan] = useState<TherapyPlanSuggestion | null>(null);
  /* Plan girdileri — danışan profilinden türetilir, terapist elle değiştirebilir. */
  const [tpAgeOverride, setTpAgeOverride] = useState<AgeGroupKey | null>(null);
  const [tpIndependence, setTpIndependence] = useState<number | null>(null);
  const [tpEnvironments, setTpEnvironments] = useState<EnvironmentType[]>(["klinik"]);
  const [tpSessionsPerWeek, setTpSessionsPerWeek] = useState<number>(3);
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
  const [logicCursor, setLogicCursor] = useState(0);
  const [logicState, setLogicState] = useState<LogicState>({ puzzle: null, round: 0, score: 0, phase: "idle", message: "Matrisi analiz et ve eksik hücreyi bul.", selectedIdx: null, showResult: false });
  const [sessionSet, setSessionSet] = useState<SessionSetState | null>(null);
  const [showSessionSetPicker, setShowSessionSetPicker] = useState(false);
  const [tpSelectedProtocol, setTpSelectedProtocol] = useState<TherapyProtocol | null>(null);
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
  const [difficultyPrompt, setDifficultyPrompt] = useState<{ clientId: string; clientName: string; suggestedLevel: string } | null>(null);
  const [compareClientA, setCompareClientA] = useState("");
  const [compareClientB, setCompareClientB] = useState("");
  const [sessionWarningDismissed, setSessionWarningDismissed] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [sessionWarnThreshold, setSessionWarnThreshold] = useState<number>(() => {
    try { return Number(localStorage.getItem("mimio-session-warn-min") ?? "45"); } catch { return 45; }
  });
  const [clientSearch, setClientSearch] = useState("");
  const [clientFilterAge, setClientFilterAge] = useState("");
  const [clientFilterSupport, setClientFilterSupport] = useState("");
  const [clientFilterActivity, setClientFilterActivity] = useState<"all" | "inactive" | "new">("all");
  const [noteMode, setNoteMode] = useState<NoteMode>("free");
  const [soapDraft, setSoapDraft] = useState<SoapNoteContent>({ s: "", o: "", a: "", p: "" });
  const [clientGoals, setClientGoals] = useState<ClientGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalDraft, setGoalDraft] = useState({ title: "", description: "", targetValue: 100, deadline: "" });
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [showEditTherapist, setShowEditTherapist] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [savingTherapist, setSavingTherapist] = useState(false);
  const announcedAchievementsRef = useRef<Set<string>>(new Set());
  const [therapistEditDraft, setTherapistEditDraft] = useState({ displayName: "", clinicName: "", specialty: "" });
  const [postGameNote, setPostGameNote] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(false);

  // ── Achievement & new feature states ──
  const ACHIEVEMENTS_KEY = "mimio-achievements-v1";
  const [earnedAchievements, setEarnedAchievements] = useState<EarnedAchievement[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  // ── In-game feedback ──
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; combo: number; timestamp: number } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const [floatScores, setFloatScores] = useState<Array<{ id: number; value: number; correct: boolean }>>([]);
  const floatTimersRef = useRef<Record<number, number>>({});

  function triggerFeedback(correct: boolean, combo = 0, points?: number) {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    setLastFeedback({ correct, combo, timestamp: Date.now() });
    feedbackTimerRef.current = window.setTimeout(() => setLastFeedback(null), 700);
    if (typeof points === "number" && points !== 0) {
      const id = Date.now() + Math.random();
      setFloatScores(prev => [...prev, { id, value: points, correct }]);
      const timer = window.setTimeout(() => {
        setFloatScores(prev => prev.filter(s => s.id !== id));
        delete floatTimersRef.current[id];
      }, 900);
      floatTimersRef.current[id] = timer;
    }
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
      const storedAchievements = window.localStorage.getItem(ACHIEVEMENTS_KEY);
      if (storedAchievements) { const p = JSON.parse(storedAchievements); if (Array.isArray(p)) setEarnedAchievements(p); }
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
  useEffect(() => { try { window.localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(earnedAchievements)); } catch { /* ignore */ } }, [earnedAchievements]);

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
    // Sunucudaki oturum cookie'sini temizle (sonucu beklemeye gerek yok)
    void fetch("/api/platform/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "logout" }),
    }).catch(() => { /* çevrimdışı olabilir */ });
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
    showToast("Haftalık plan kaydedildi", "success");
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
    showToast("Haftalık plan kaydedildi", "success");
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
        const payload = (await res.json()) as { notes?: SessionNote[] } | null;
        /* Beklenmedik gövde ekranı çökertmemeli: `notes` yoksa dizi olarak
           okumak `undefined.map` ile tüm görünümü hata sınırına düşürüyordu. */
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];
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
        const payload = (await res.json()) as { plan?: WeeklyPlan | null } | null;
        const plan = payload?.plan;
        if (plan?.days) {
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
        const payload = (await res.json()) as { goals?: ClientGoal[] } | null;
        setClientGoals(Array.isArray(payload?.goals) ? payload.goals : []);
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
        showToast("Hedef eklendi", "success");
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
        showToast(`İlerleme güncellendi — %${currentValue}`, "success");
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
    /*
     * Önceki sürüm oturum yoksa sessizce return ediyor, hatalı yanıtta da
     * hiçbir şey söylemiyordu: düğmeye basınca "hiçbir işlem olmuyor" gibi
     * görünmesinin sebebi buydu. Artık her yol bir geri bildirim üretir.
     */
    const name = therapistEditDraft.displayName.trim();
    if (!activeTherapistId) {
      showToast("Oturum bilgisi okunamadı. Çıkış yapıp tekrar girin.", "warning");
      return;
    }
    if (!name) {
      showToast("Ad soyad boş bırakılamaz.", "warning");
      return;
    }
    setSavingTherapist(true);
    try {
      const res = await fetch("/api/platform/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "update-therapist",
          therapistId: activeTherapistId,
          displayName: name,
          clinicName: therapistEditDraft.clinicName,
          specialty: therapistEditDraft.specialty,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { profile?: TherapistProfile; message?: string } | null;
      if (!res.ok) {
        showToast(payload?.message ?? "Profil güncellenemedi.", "warning");
        return;
      }
      await loadPlatformOverview();
      setShowEditTherapist(false);
      showToast(`Profil güncellendi — ${payload?.profile?.displayName ?? name}`, "success");
    } catch {
      showToast("Sunucuya ulaşılamadı, profil güncellenemedi.", "warning");
    } finally {
      setSavingTherapist(false);
    }
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
      body{font-family:'Segoe UI',Arial,sans-serif;color:#0d2137;margin:0;padding:24px;font-size:13px}
      h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;font-weight:700;margin:20px 0 8px;color:#1d5a8c;text-transform:uppercase;letter-spacing:.05em}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1d5a8c;padding-bottom:12px;margin-bottom:20px}
      .meta{font-size:11px;color:#666;line-height:1.6}.badge{display:inline-block;background:#d9e9f6;color:#1d5a8c;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;margin-right:4px;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}td,th{padding:6px 10px;border:1px solid #dde4ea;text-align:left;font-size:12px}th{background:#eff6fc;font-weight:700;color:#17456e}
      .stat-row{display:flex;gap:16px;margin-bottom:16px}.stat{background:#eff6fc;border:1px solid #d9e9f6;border-radius:12px;padding:12px 18px;text-align:center;flex:1}.stat-val{font-size:28px;font-weight:900;color:#1d5a8c}.stat-lbl{font-size:11px;color:#888;font-weight:600}
      .no-data{color:#999;font-style:italic;font-size:12px}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #dde4ea;font-size:10px;color:#aaa;text-align:center}
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

  function handlePrintSummaryCard(client: ClientProfile) {
    const sessions = platformOverview.recentSessions.filter(s => s.clientId === client.id);
    const bestScore = sessions.length > 0 ? Math.max(...sessions.map(s => s.score)) : 0;
    const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;
    const favGame = (() => {
      const counts: Record<string, number> = {};
      sessions.forEach(s => { counts[s.gameKey] = (counts[s.gameKey] ?? 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return top ? (GAME_LABELS[top[0] as PlatformGameKey] ?? top[0]) : "—";
    })();
    const completedGoals = clientGoals.filter(g => g.currentValue >= g.targetValue).length;
    const therapistName = activeTherapist?.displayName ?? "Terapist";
    const today = getTodayString();
    const tagBadges = (client.tags ?? []).map(t => `<span class="tag">${t}</span>`).join("");

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Mimio Özet Kart — ${client.displayName}</title><style>
      @page{size:105mm 148mm;margin:0}
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;width:105mm;height:148mm;background:#fff;color:#0d2137;padding:6mm;display:flex;flex-direction:column;gap:3mm}
      .top-bar{height:2mm;background:linear-gradient(90deg,#1d5a8c,#2a72ac,#5b7183);border-radius:1mm;flex-shrink:0}
      .header{display:flex;align-items:flex-start;gap:3mm}
      .avatar{width:11mm;height:11mm;border-radius:3mm;background:linear-gradient(135deg,#1d5a8c,#2a72ac);color:#fff;font-weight:900;font-size:5mm;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .name{font-size:5.5mm;font-weight:900;color:#0d2137;line-height:1.1}
      .sub{font-size:2.8mm;color:#666;margin-top:0.5mm}
      .tags{display:flex;flex-wrap:wrap;gap:1mm;margin-top:1.5mm}
      .tag{background:#d9e9f6;color:#1d5a8c;font-size:2.5mm;font-weight:700;padding:0.5mm 2mm;border-radius:10mm}
      .divider{height:0.3mm;background:#dde4ea;flex-shrink:0}
      .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm}
      .stat{background:#eff6fc;border-radius:2mm;padding:2mm;text-align:center}
      .stat-val{font-size:5mm;font-weight:900;color:#1d5a8c;line-height:1}
      .stat-lbl{font-size:2.3mm;color:#888;font-weight:600;margin-top:0.5mm}
      .row{display:flex;gap:2mm}
      .info-box{flex:1;background:#f7fafd;border:0.3mm solid #dde4ea;border-radius:2mm;padding:2mm}
      .info-label{font-size:2.3mm;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em}
      .info-val{font-size:3mm;font-weight:700;color:#0d2137;margin-top:0.5mm}
      .footer{margin-top:auto;padding-top:1.5mm;border-top:0.3mm solid #dde4ea;display:flex;justify-content:space-between;font-size:2.3mm;color:#aaa}
      @media print{html,body{width:105mm;height:148mm}button{display:none}}
    </style></head><body>
      <div class="top-bar"></div>
      <div class="header">
        <div class="avatar">${client.displayName[0]?.toUpperCase() ?? "?"}</div>
        <div>
          <div class="name">${client.displayName}</div>
          <div class="sub">${[client.ageGroup, client.primaryGoal].filter(Boolean).join(" · ") || "—"}</div>
          ${tagBadges ? `<div class="tags">${tagBadges}</div>` : ""}
        </div>
      </div>
      <div class="divider"></div>
      <div class="stats">
        <div class="stat"><div class="stat-val">${sessions.length}</div><div class="stat-lbl">Seans</div></div>
        <div class="stat"><div class="stat-val">${bestScore || "—"}</div><div class="stat-lbl">En İyi</div></div>
        <div class="stat"><div class="stat-val">${avgScore || "—"}</div><div class="stat-lbl">Ortalama</div></div>
      </div>
      <div class="row">
        <div class="info-box"><div class="info-label">Favori Oyun</div><div class="info-val">${favGame}</div></div>
        <div class="info-box"><div class="info-label">Tamamlanan Hedef</div><div class="info-val">${completedGoals}/${clientGoals.length || 0}</div></div>
        <div class="info-box"><div class="info-label">Destek</div><div class="info-val">${client.supportLevel || "—"}</div></div>
      </div>
      ${client.difficultyLevel ? `<div class="info-box" style="background:#f2ddc2;border-color:#f2ddc2"><div class="info-label" style="color:#8f5626">Zorluk Seviyesi</div><div class="info-val" style="color:#8f5626">${client.difficultyLevel}</div></div>` : ""}
      <div class="footer">
        <span>Mimio Ergoterapi</span>
        <span>${therapistName}</span>
        <span>${today}</span>
      </div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;

    const win = window.open("", "_blank", "width=420,height=600");
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

  // ── Update client tags ──
  async function handleUpdateClientTags(clientId: string, tags: string[]) {
    try {
      await fetch("/api/platform/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "update-client", clientId, tags }),
      });
      await loadPlatformOverview();
    } catch { /* ignore */ }
  }

  // ── Export all sessions as CSV ──
  function handleExportSessionsCSV() {
    const headers = ["Tarih", "Saat", "Terapist", "Danışan", "Oyun", "Skor", "Süre (sn)", "Not"];
    const rows = platformOverview.recentSessions.map(s => {
      const d = new Date(s.playedAt);
      const date = d.toLocaleDateString("tr-TR");
      const time = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      return [
        date, time,
        s.therapistName,
        s.clientName,
        s.gameLabel,
        s.score,
        s.durationSeconds ?? "",
        (s.sessionNote ?? "").replace(/"/g, '""'),
      ].map(v => `"${v}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mimio-seanslar-${getTodayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${rows.length} seans CSV olarak indirildi`, "success");
  }

  // ── Save satisfaction rating ──
  async function handleSaveSatisfaction(rating: number) {
    if (!lastSessionId) return;
    try {
      await fetch("/api/platform/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: lastSessionId, satisfactionRating: rating }),
      });
    } catch { /* ignore */ }
  }

  // ── Update client birth date ──
  async function handleUpdateClientBirthDate(clientId: string, birthDate: string | null) {
    try {
      await fetch("/api/platform/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "update-client", clientId, birthDate }),
      });
      await loadPlatformOverview();
    } catch { /* ignore */ }
  }

  // ── Update client difficulty ──
  async function handleUpdateClientDifficulty(clientId: string, difficultyLevel: string) {
    try {
      await fetch("/api/platform/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "update-client", clientId, difficultyLevel }),
      });
      await loadPlatformOverview();
      showToast(`Zorluk düzeyi "${difficultyLevel}" olarak güncellendi`, "success");
    } catch { /* ignore */ }
    setDifficultyPrompt(null);
  }

  // ── CSV export ──
  function handleExportClientsCsv() {
    const headers = ["Ad", "Yaş Grubu", "Birincil Hedef", "Destek Düzeyi", "Zorluk Düzeyi", "Seans Sayısı", "Son Aktif"];
    const rows = clientOptions.map(c => {
      const sessions = platformOverview.recentSessions.filter(s => s.clientId === c.id);
      return [
        `"${c.displayName}"`,
        `"${c.ageGroup ?? ""}"`,
        `"${c.primaryGoal ?? ""}"`,
        `"${c.supportLevel ?? ""}"`,
        `"${c.difficultyLevel ?? ""}"`,
        sessions.length,
        `"${c.lastActiveAt?.slice(0, 10) ?? ""}"`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mimio-danisanlar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV dışa aktarıldı", "success");
  }

  // ── CSV import ──
  async function handleImportCsv() {
    setCsvImportError("");
    const lines = csvImportText.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { setCsvImportError("En az bir veri satırı gerekli (başlık + 1 danışan)."); return; }
    const dataLines = lines.slice(1); // skip header
    let importedCount = 0;
    for (const line of dataLines) {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      const [displayName, ageGroup, primaryGoal, supportLevel] = cols;
      if (!displayName) continue;
      await createProfileInBackend(
        { kind: "client", displayName, ageGroup: ageGroup ?? "", primaryGoal: primaryGoal ?? "", supportLevel: supportLevel ?? "" },
        ""
      );
      importedCount++;
    }
    if (importedCount > 0) {
      await loadPlatformOverview();
      showToast(`${importedCount} danışan içe aktarıldı`, "success");
      setShowCsvImport(false);
      setCsvImportText("");
    } else {
      setCsvImportError("Hiç geçerli danışan satırı bulunamadı.");
    }
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
    showToast(`İlerleme kaydedildi — %${entry.value}`, "success");
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
      // Yerelde oturum görünüyor ama sunucu cookie'si geçersizse (süre dolmuş
      // veya eski sürümden kalma) kullanıcıyı girişe yönlendir.
      if (payload.authenticated === false) {
        let hasLocalSession = false;
        try { hasLocalSession = Boolean(window.localStorage.getItem(ACTIVE_THERAPIST_KEY)); } catch { /* ignore */ }
        if (hasLocalSession) {
          try { window.localStorage.removeItem(ACTIVE_THERAPIST_KEY); } catch { /* ignore */ }
          setActiveTherapistId("");
          setActiveAppView("login");
        }
      }
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

  function resetSessionClock() { setSessionStartedAt(Date.now()); setGameTimerKey(0); setGameElapsed(0); setSessionWarningDismissed(false); setProfileFeedback("Seans süresi sıfırlandı."); }

  /**
   * Danışan profilini plan motorunun girdisine çevirir.
   *
   * Danışan kaydındaki serbest metin alanları ("6-8", "Sözel İpucu") normalize
   * edilir; terapistin panelden yaptığı seçimler kayıttaki değeri ezer.
   */
  function buildPlanContext(client: ClientProfile | null): ClientContext {
    /* Danışan kaydındaki yaş aralığı ("6-8", "9-12") ile terapi kataloğunun
       yaş grupları ("6-12") aynı kırılımda değil; alt sınırdan eşleştirilir. */
    function toAgeGroup(raw: string | undefined): AgeGroupKey | null {
      if (!raw) return null;
      const lower = Number(raw.split(/[-–+]/)[0]);
      if (!Number.isFinite(lower)) return null;
      if (lower < 3) return "0-3";
      if (lower < 6) return "3-6";
      if (lower < 12) return "6-12";
      if (lower < 18) return "12-18";
      if (lower < 30) return "18-30";
      if (lower < 50) return "30-50";
      if (lower < 65) return "50-65";
      return "65+";
    }

    function toIndependence(raw: string | undefined): number | null {
      if (!raw) return null;
      const normalized = raw.toLocaleLowerCase("tr").replace(/\s+/g, "_");
      const match = INDEPENDENCE_LEVELS.find(
        (level) => level.key === normalized || level.label.toLocaleLowerCase("tr") === raw.toLocaleLowerCase("tr"),
      );
      return match?.score ?? null;
    }

    return {
      clientId: client?.id ?? "",
      displayName: client?.displayName ?? "Danışan seçilmedi",
      ageGroup: tpAgeOverride ?? toAgeGroup(client?.ageGroup),
      independenceScore: tpIndependence ?? toIndependence(client?.supportLevel),
      environments: tpEnvironments,
      sessionsPerWeek: tpSessionsPerWeek,
      primaryGoal: client?.primaryGoal ?? "",
    };
  }

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
      const data = (await response.json().catch(() => null)) as { id?: string } | null;
      if (data?.id) setLastSessionId(data.id);
      await loadPlatformOverview();
    } catch {
      setPlatformStatus("error");
    }
  }

  // Approximate high-score thresholds per game (≥ this = strong performance)
  const ADAPTIVE_THRESHOLDS: Record<GameKey, number> = {
    memory: 8, pairs: 10, pulse: 14, route: 12, difference: 9, scan: 10, logic: 10,
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
        showToast(`Yeni rekor — ${GAME_LABELS[game]}: ${nextScore}`, "success");
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
        .slice(-2);
      const allHigh = recentForGame.length >= 2 && recentForGame.every(s => s.score >= threshold) && nextScore >= threshold;
      if (allHigh) {
        const currentLevel = getDifficultyLevel(activeClient.difficultyLevel);
        if (currentLevel < 3) {
          const nextLabel = DIFFICULTY_LABELS[(currentLevel + 1) as 1 | 2 | 3];
          setTimeout(() => setDifficultyPrompt({ clientId: activeClient.id, clientName: activeClient.displayName, suggestedLevel: nextLabel }), 2200);
        }
      }
    }
    void syncScoreToBackend(game, nextScore, metadata, sessionEntry);
    // ── Session Set tracking ──
    setSessionSet(cur => {
      if (!cur || cur.phase === "finished") return cur;
      if (cur.games[cur.currentIndex] !== game) return cur;
      const newEntry = { gameKey: game, score: nextScore, label: GAME_LABELS[game] };
      const newEntries = [...cur.entries, newEntry];
      const isLast = cur.currentIndex >= cur.games.length - 1;
      if (isLast) return { ...cur, entries: newEntries, phase: "finished" };
      return { ...cur, entries: newEntries };
    });
  }

  function startSessionSet(preset: typeof SESSION_SET_PRESETS[number]) {
    setShowSessionSetPicker(false);
    setSessionSet({ presetLabel: preset.label, games: preset.games as GameKey[], currentIndex: 0, entries: [], phase: "running" });
    setActiveGame(preset.games[0] as GameKey);
  }

  function startCustomSessionSet(label: string, games: GameKey[]) {
    setSessionSet({ presetLabel: label, games, currentIndex: 0, entries: [], phase: "running" });
    setActiveGame(games[0]);
  }

  function advanceSessionSet() {
    if (!sessionSet) return;
    const nextIndex = sessionSet.currentIndex + 1;
    if (nextIndex >= sessionSet.games.length) return;
    const nextGame = sessionSet.games[nextIndex];
    setSessionSet(cur => cur ? { ...cur, currentIndex: nextIndex } : null);
    setActiveGame(nextGame);
    setTimeout(() => {
      if (nextGame === "memory") startMemoryGame();
      else if (nextGame === "pairs") startPairsGame();
      else if (nextGame === "pulse") startPulseGame();
      else if (nextGame === "route") startRouteGame();
      else if (nextGame === "difference") startDifferenceGame();
      else if (nextGame === "scan") startScanGame();
      else if (nextGame === "logic") startLogicGame();
    }, 350);
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

  function startMemoryGame() { setGameTimerKey(k => k + 1); setMemoryCursor(0); playMemorySequence(createMemorySequence(GAME_DIFF_CONFIG.memory.startLength[clientDiffLevel - 1]), 0); }
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

  function startPairsGame() {
    const cfg = GAME_DIFF_CONFIG.pairs;
    const pairCount = cfg.pairCount[clientDiffLevel - 1];
    setGameTimerKey(k => k + 1); clearPairTimers(); setPairsCursor(0);
    setPairsState({ tiles: createPairsDeck(pairCount), moves: 0, pairsFound: 0, locked: false, phase: "playing", message: "Kartları aç ve aynı simgeleri eşleştir." });
  }

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
      const totalPairs = pairsState.tiles.length / 2;
      if (nextPairsFound >= totalPairs) {
        const finalScore = Math.max(50, 280 - nextMoves * 7);
        commitScore("pairs", finalScore, { phase: "finished", moves: nextMoves, pairsFound: nextPairsFound });
        setPairsState({ tiles: matchedTiles, moves: nextMoves, pairsFound: nextPairsFound, locked: false, phase: "finished", message: `Tüm çiftler bulundu. Final skor ${finalScore}.` });
        return;
      }
      setPairsState({ tiles: matchedTiles, moves: nextMoves, pairsFound: nextPairsFound, locked: false, phase: "playing", message: `Doğru çift bulundu. ${nextPairsFound}/${totalPairs} tamamlandı.` });
      return;
    }
    setPairsState({ tiles: nextTiles, moves: nextMoves, pairsFound: pairsState.pairsFound, locked: true, phase: "playing", message: "Eşleşme olmadı. Kartlar birazdan kapanacak." });
    pairTimersRef.current.push(window.setTimeout(() => hideMismatchedPairs(), GAME_DIFF_CONFIG.pairs.hideMs[clientDiffLevel - 1]));
  }

  function startPulseGame() {
    setGameTimerKey(k => k + 1); setPulseCursor(4);
    setPulseState({ activeIndex: randomIndex(PULSE_LABELS.length), round: 1, hits: 0, misses: 0, combo: 0, points: 0, phase: "playing", message: "Işıklanan hedefe ritmi bozmadan dokun." });
  }

  function handlePulsePick(index: number) {
    if (pulseState.phase !== "playing" || pulseState.activeIndex === null) return;
    const isHit = index === pulseState.activeIndex;
    const nextRound = pulseState.round + 1;
    const nextHits = pulseState.hits + (isHit ? 1 : 0);
    const nextMisses = pulseState.misses + (isHit ? 0 : 1);
    const nextCombo = isHit ? pulseState.combo + 1 : 0;
    const nextPoints = Math.max(0, pulseState.points + (isHit ? 12 + pulseState.combo * 2 : -4));
    triggerFeedback(isHit, nextCombo, isHit ? 12 + pulseState.combo * 2 : -4);
    const pulseRounds = GAME_DIFF_CONFIG.pulse.rounds[clientDiffLevel - 1];
    if (nextRound > pulseRounds) {
      commitScore("pulse", nextPoints, { phase: "finished", round: pulseRounds, hits: nextHits, misses: nextMisses });
      setPulseState({ activeIndex: pulseState.activeIndex, round: pulseRounds, hits: nextHits, misses: nextMisses, combo: nextCombo, points: nextPoints, phase: "finished", message: `Set tamamlandı. ${nextHits} doğru hedef ve ${nextPoints} puan toplandı.` });
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
    triggerFeedback(isCorrect, nextStreak, isCorrect ? 14 + routeState.streak * 3 : -5);
    const routeRounds = GAME_DIFF_CONFIG.route.rounds[clientDiffLevel - 1];
    if (nextRound > routeRounds) {
      commitScore("route", nextScore, { phase: "finished", round: routeRounds, streak: nextStreak, historyLength: nextHistory.length });
      setRouteState({ command: routeState.command, round: routeRounds, score: nextScore, streak: nextStreak, phase: "finished", history: nextHistory, message: `Komut seti tamamlandı. Final skor ${nextScore}.` });
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
    triggerFeedback(isCorrect, 0, isCorrect ? 1 : 0);
    if (!isCorrect) {
      commitScore("difference", differenceState.score, { phase: "finished", round: differenceState.round, revealId: differenceState.oddId });
      setDifferenceState((current) => ({ ...current, phase: "finished", revealId: current.oddId, message: `Tur bitti. Kaydedilen skor ${current.score}. İşaretlenen kart doğru değildi.` }));
      return;
    }
    const diffRounds = GAME_DIFF_CONFIG.difference.rounds[clientDiffLevel - 1];
    if (differenceState.round >= diffRounds) {
      const finalScore = differenceState.score + 1;
      commitScore("difference", finalScore, { phase: "finished", round: diffRounds, revealId: differenceState.oddId });
      setDifferenceState((current) => ({ ...current, score: finalScore, phase: "finished", revealId: current.oddId, message: `Tüm turları geçtin. Final skor ${finalScore}.` }));
      return;
    }
    const nextRoundNumber = differenceState.round + 1;
    const nextRound = createDifferenceRound(nextRoundNumber);
    setDifferenceState({ ...nextRound, round: nextRoundNumber, score: differenceState.score + 1, phase: "playing", revealId: null, message: `Doğru seçim. ${nextRoundNumber}. tura geçildi.` });
  }

  function startScanGame() {
    setGameTimerKey(k => k + 1);
    const tileCount = GAME_DIFF_CONFIG.scan.tileCount[clientDiffLevel - 1];
    const round = createScanRound(1, tileCount);
    setScanCursor(0);
    setScanState({ ...round, round: 1, score: 0, phase: "playing", revealId: null, message: "Üstteki hedef simgeyi ızgara içinde bul." });
  }

  function handleScanPick(tileId: string) {
    if (scanState.phase !== "playing") return;
    const isCorrect = tileId === scanState.targetId;
    triggerFeedback(isCorrect, 0, isCorrect ? 1 : 0);
    const scanRounds = GAME_DIFF_CONFIG.scan.rounds[clientDiffLevel - 1];
    const tileCount = GAME_DIFF_CONFIG.scan.tileCount[clientDiffLevel - 1];
    if (!isCorrect) {
      commitScore("scan", scanState.score, { phase: "finished", round: scanState.round, targetLabel: scanState.targetLabel });
      setScanState((current) => ({ ...current, phase: "finished", revealId: current.targetId, message: `Tur bitti. Kaydedilen skor ${current.score}. Doğru hedef işaretlenemedi.` }));
      return;
    }
    if (scanState.round >= scanRounds) {
      const finalScore = scanState.score + 1;
      commitScore("scan", finalScore, { phase: "finished", round: scanRounds, targetLabel: scanState.targetLabel });
      setScanState((current) => ({ ...current, score: finalScore, phase: "finished", revealId: current.targetId, message: `Tüm hedefler bulundu. Final skor ${finalScore}.` }));
      return;
    }
    const nextRoundNumber = scanState.round + 1;
    const nextRound = createScanRound(nextRoundNumber, tileCount);
    setScanState({ ...nextRound, round: nextRoundNumber, score: scanState.score + 1, phase: "playing", revealId: null, message: `Doğru hedef bulundu. ${nextRoundNumber}. tura geçildi.` });
  }

  function startLogicGame() {
    setGameTimerKey(k => k + 1);
    setLogicCursor(0);
    const puzzle = createLogicPuzzle();
    setLogicState({ puzzle, round: 1, score: 0, phase: "playing", message: "Matrisi analiz et, eksik hücreyi seç.", selectedIdx: null, showResult: false });
  }

  function handleLogicPick(optionIdx: number) {
    if (logicState.phase !== "playing" || !logicState.puzzle || logicState.showResult) return;
    const isCorrect = optionIdx === logicState.puzzle.answerIdx;
    const nextScore = logicState.score + (isCorrect ? 10 : 0);
    triggerFeedback(isCorrect, 0);
    const logicRounds = GAME_DIFF_CONFIG.logic.rounds[clientDiffLevel - 1];
    setLogicState(cur => ({ ...cur, selectedIdx: optionIdx, showResult: true, score: nextScore, message: isCorrect ? "Doğru! Sonraki bulmaca geliyor..." : "Yanlış seçim. Devam ediliyor..." }));
    setTimeout(() => {
      if (logicState.round >= logicRounds) {
        commitScore("logic", nextScore, { phase: "finished", round: logicRounds, correct: isCorrect ? 1 : 0 });
        setLogicState(cur => ({ ...cur, phase: "finished", showResult: false, message: `Tüm turlar tamamlandı. Final skor ${nextScore}.` }));
        return;
      }
      const nextPuzzle = createLogicPuzzle();
      setLogicState({ puzzle: nextPuzzle, round: logicState.round + 1, score: nextScore, phase: "playing", message: "Yeni bulmaca! Matrisi analiz et.", selectedIdx: null, showResult: false });
      setLogicCursor(0);
    }, 900);
  }

  useEffect(() => {
    function moveCursor(key: string) {
      if (activeAppView !== "games") return;
      if (activeGame === "pulse") { setPulseCursor((current) => moveGridCursor(current, key, 3, PULSE_LABELS.length)); return; }
      if (activeGame === "route") { setRouteCursor((current) => moveGridCursor(current, key, 2, ROUTE_COMMANDS.length)); return; }
      if (activeGame === "pairs") { setPairsCursor((current) => moveGridCursor(current, key, 4, SYMBOL_LIBRARY.length * 2)); return; }
      if (activeGame === "scan") { setScanCursor((current) => moveGridCursor(current, key, 3, 9)); return; }
      if (activeGame === "difference") { setDifferenceCursor((current) => moveGridCursor(current, key, 3, 6)); return; }
      if (activeGame === "logic") { setLogicCursor((current) => moveGridCursor(current, key, 2, 4)); return; }
      setMemoryCursor((current) => moveGridCursor(current, key, 3, 6));
    }
    function activateCurrentSelection() {
      if (activeAppView !== "games") return;
      if (activeGame === "memory") { if (memoryState.phase === "idle" || memoryState.phase === "finished") { startMemoryGame(); return; } if (memoryState.phase === "ready") { handleMemoryPick(memoryCursor); return; } if (memoryState.phase === "showing") replayMemorySequence(); return; }
      if (activeGame === "pairs") { if (pairsState.phase !== "playing") { startPairsGame(); return; } handlePairsPick(pairsCursor); return; }
      if (activeGame === "pulse") { if (pulseState.phase !== "playing") { startPulseGame(); return; } handlePulsePick(pulseCursor); return; }
      if (activeGame === "route") { if (routeState.phase !== "playing") { startRouteGame(); return; } const command = ROUTE_COMMANDS[routeCursor]; if (command) handleRoutePick(command.key); return; }
      if (activeGame === "difference") { if (differenceState.phase !== "playing") { startDifferenceGame(); return; } const activeTile = differenceState.tiles[differenceCursor]; if (activeTile) handleDifferencePick(activeTile.id); return; }
      if (activeGame === "logic") { if (logicState.phase !== "playing") { startLogicGame(); return; } handleLogicPick(logicCursor); return; }
      if (scanState.phase !== "playing") { startScanGame(); return; }
      const activeTile = scanState.tiles[scanCursor];
      if (activeTile) handleScanPick(activeTile.id);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "?" && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName ?? "")) {
        event.preventDefault();
        setShowShortcutGuide(v => !v);
        return;
      }
      if (event.key === "Escape") { setShowShortcutGuide(false); }
      if (activeAppView !== "games") return;
      const normalizedKey = event.key.toLowerCase();
      // Logic game: 1-4 keys to pick option directly
      if (activeGame === "logic" && logicState.phase === "playing") {
        if (["1","2","3","4"].includes(event.key)) { event.preventDefault(); handleLogicPick(Number(event.key) - 1); return; }
      }
      const currentIndex = GAME_TABS.findIndex((tab) => tab.key === activeGame);
      if (normalizedKey === "a") { event.preventDefault(); const nextIndex = currentIndex === 0 ? GAME_TABS.length - 1 : currentIndex - 1; setActiveGame(GAME_TABS[nextIndex].key); return; }
      if (normalizedKey === "b") { event.preventDefault(); const nextIndex = currentIndex === GAME_TABS.length - 1 ? 0 : currentIndex + 1; setActiveGame(GAME_TABS[nextIndex].key); return; }
      if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); moveCursor(event.key); return; }
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activateCurrentSelection(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGame, activeAppView, differenceCursor, differenceState, logicCursor, logicState, memoryCursor, memoryState, pairsCursor, pairsState, pulseCursor, pulseState, routeCursor, routeState, scanCursor, scanState]);

  // ── Achievement handler ──
  /*
   * Bildirim, tekrar koruması olan state güncellemesinin dışındaydı:
   * StrictMode'da efekt iki kez koştuğunda aynı başarım için iki toast
   * düşüyordu. Duyuru artık ref ile bir kez yapılır.
   */
  function handleEarnAchievement(achievementId: string) {
    if (announcedAchievementsRef.current.has(achievementId)) return;
    announcedAchievementsRef.current.add(achievementId);
    setEarnedAchievements(prev => {
      if (prev.some(e => e.id === achievementId)) return prev;
      return [...prev, { id: achievementId, earnedAt: new Date().toISOString() }];
    });
    const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (ach) showToast(`Başarım kazanıldı — ${ach.title}`, "success");
  }

  // ── Derived values ──
  const activeTab = GAME_TABS.find((tab) => tab.key === activeGame) ?? GAME_TABS[0];
  const activeCategory = GAME_CATEGORIES.find((category) => category.key === activeTab.category) ?? GAME_CATEGORIES[0];
  const therapistOptions = platformOverview.therapists;
  const clientOptions = platformOverview.clients;
  const activeTherapist = therapistOptions.find((profile) => profile.id === activeTherapistId) ?? therapistOptions[0] ?? null;
  const activeClient = clientOptions.find((profile) => profile.id === activeClientId) ?? clientOptions[0] ?? null;
  // ── Adaptive difficulty derived from active client ──
  const clientDiffLevel = getDifficultyLevel(activeClient?.difficultyLevel);
  const visibleTabs = GAME_TABS.filter((tab) => tab.category === activeTab.category);
  // Compute nextInSet for the current game's result overlay
  const sessionSetNextInSet = sessionSet?.phase === "running" && sessionSet.currentIndex < sessionSet.games.length - 1
    ? { gameName: GAME_LABELS[sessionSet.games[sessionSet.currentIndex + 1]], onNext: advanceSessionSet }
    : null;
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

  const sessionStreak = (() => {
    const days = new Set(
      platformOverview.recentSessions.map(s => new Date(s.playedAt).toISOString().slice(0, 10))
    );
    let streak = 0;
    const d = new Date();
    // start from today; if today has no session, start from yesterday
    const todayStr = d.toISOString().slice(0, 10);
    if (!days.has(todayStr)) { d.setDate(d.getDate() - 1); }
    while (days.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();

  // ── Achievement stats (computed) ──
  const achievementStats: AchievementStats = {
    totalSessions: effectiveSessionCount,
    totalScore: platformOverview.totals.totalScore,
    bestScore: Math.max(...Object.values(scoreboard).map(s => s.best), 0),
    uniqueGamesPlayed: new Set(platformOverview.recentSessions.map(s => s.gameKey)).size,
    sessionStreak,
    perfectGames: 0, // tracked in commitScore
    thisWeekSessions: thisWeekCount,
    totalClients: clientOptions.length,
    notesWritten: allNotes.length,
    goalsCompleted: clientGoals.filter(g => g.currentValue >= g.targetValue).length,
  };

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
          <div className="absolute w-[min(600px,100vw)] h-[min(600px,100vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(29, 90, 140,0.12) 0%, transparent 70%)", top: "-20%", left: "50%", transform: "translateX(-50%)" }} />
          <div className="absolute w-[min(400px,80vw)] h-[min(400px,80vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(42, 114, 172,0.08) 0%, transparent 70%)", bottom: "-10%", right: "10%" }} />
          <div className="absolute w-[min(300px,70vw)] h-[min(300px,70vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(184, 80, 63,0.06) 0%, transparent 70%)", bottom: "20%", left: "5%" }} />
        </div>

        {/* Logo */}
        <button type="button" onClick={onLogout} className="flex flex-col items-center gap-2.5 mb-8 bg-transparent border-none cursor-pointer group">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line-strong)" }}><BlockMark size={34} tile /></div>
          <span className="font-extrabold text-(--color-text-strong) text-xl tracking-tight">Mimio</span>
        </button>

        {/* Card */}
        <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-(--color-line) p-5 sm:p-8 relative overflow-hidden" style={{ background: "var(--color-surface-strong)", backdropFilter: "blur(24px)", boxShadow: "0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "var(--color-primary)" }} />
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-primary)" }} />
              Ücretsiz Hesap Oluştur
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-(--color-text-strong) text-center mb-1 tracking-tight">Hesabınızı Oluşturun</h2>
          <p className="text-(--color-text-soft) text-sm text-center mb-6">Dakikalar içinde başlayın, danışanlarınızla çalışmaya başlayın.</p>

          {loginError && (
            <div role="alert" className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: "rgba(168, 57, 44,0.08)", border: "1px solid rgba(168, 57, 44,0.2)", color: "#e2705f" }}>
              {loginError}
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
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-(--color-text-soft)">Kullanıcı Adı</span>
              <input value={therapistDraft.username} onChange={(e) => { setLoginError(""); setTherapistDraft((c) => ({ ...c, username: e.target.value.replace(/\s/g, "").toLocaleLowerCase("tr-TR") })); }} placeholder="Boşluksuz, Benzersiz" className={authInp} required autoComplete="username" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-(--color-text-soft)">Şifre</span>
              <input type="password" value={therapistDraft.password} onChange={(e) => { setLoginError(""); setTherapistDraft((c) => ({ ...c, password: e.target.value })); }} placeholder="En Az 4 Karakter" className={authInp} required autoComplete="new-password" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-(--color-text-soft)">Ad Soyad</span>
              <input value={therapistDraft.displayName} onChange={(e) => setTherapistDraft((c) => ({ ...c, displayName: e.target.value }))} placeholder="Örn. Uzm. Erg. Elif Kara" className={authInp} required />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-(--color-text-soft)">Kurum / Klinik</span>
                <input value={therapistDraft.clinicName} onChange={(e) => setTherapistDraft((c) => ({ ...c, clinicName: e.target.value }))} placeholder="Opsiyonel" className={authInp} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-(--color-text-soft)">Uzmanlık</span>
                <input value={therapistDraft.specialty} onChange={(e) => setTherapistDraft((c) => ({ ...c, specialty: e.target.value }))} placeholder="Opsiyonel" className={authInp} />
              </label>
            </div>
            <button type="submit" className="relative w-full text-white font-bold py-3.5 rounded-2xl transition-all text-sm border-none cursor-pointer mt-1 overflow-hidden hover:opacity-90 active:scale-[0.98]" style={{ background: "var(--color-primary)", boxShadow: "0 6px 20px rgba(29, 90, 140,0.32)" }}>
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
            <button type="button" className="font-bold hover:underline bg-transparent border-none cursor-pointer" style={{ color: "var(--color-primary)" }} onClick={() => { setActiveAppView("login"); setLoginError(""); }}>Giriş Yapın</button>
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
          <div className="absolute w-[min(700px,100vw)] h-[min(700px,100vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(29, 90, 140,0.10) 0%, transparent 70%)", top: "-30%", left: "50%", transform: "translateX(-50%)" }} />
          <div className="absolute w-[min(400px,80vw)] h-[min(400px,80vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(42, 114, 172,0.07) 0%, transparent 70%)", bottom: "0%", right: "15%" }} />
        </div>

        {/* Logo */}
        <button type="button" onClick={onLogout} className="flex flex-col items-center gap-2.5 mb-8 bg-transparent border-none cursor-pointer group">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line-strong)" }}><BlockMark size={34} tile /></div>
          <span className="font-extrabold text-(--color-text-strong) text-xl tracking-tight">Mimio</span>
        </button>

        {/* Card */}
        <div className="w-full max-w-sm rounded-2xl sm:rounded-3xl border border-(--color-line) p-5 sm:p-8 relative overflow-hidden" style={{ background: "var(--color-surface-strong)", backdropFilter: "blur(24px)", boxShadow: "0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "var(--color-primary)" }} />
          <h2 className="text-2xl font-extrabold text-(--color-text-strong) text-center mb-1 tracking-tight">Tekrar Hoş Geldiniz</h2>
          <p className="text-(--color-text-soft) text-sm text-center mb-7">Hesabınıza giriş yapın ve çalışmaya devam edin.</p>

          {loginError && (
            <div role="alert" className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: "rgba(168, 57, 44,0.08)", border: "1px solid rgba(168, 57, 44,0.2)", color: "#e2705f" }}>
              {loginError}
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
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-(--color-text-soft)">Kullanıcı Adı</span>
              <input value={loginUsername} onChange={(e) => { setLoginError(""); setLoginUsername(e.target.value.replace(/\s/g, "").toLocaleLowerCase("tr-TR")); }} placeholder="Kullanıcı Adınız" className={authInp} required autoComplete="username" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-(--color-text-soft)">Şifre</span>
              <input type="password" value={loginPassword} onChange={(e) => { setLoginError(""); setLoginPassword(e.target.value); }} placeholder="Şifreniz" className={authInp} required autoComplete="current-password" />
            </label>
            <button type="submit" className="relative w-full text-white font-bold py-3.5 rounded-2xl transition-all text-sm border-none cursor-pointer mt-1 overflow-hidden hover:opacity-90 active:scale-[0.98]" style={{ background: "var(--color-primary)", boxShadow: "0 6px 20px rgba(29, 90, 140,0.32)" }}>
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
            <button type="button" className="font-bold hover:underline bg-transparent border-none cursor-pointer" style={{ color: "var(--color-primary)" }} onClick={() => { setActiveAppView("register"); setLoginError(""); }}>Ücretsiz Kayıt Olun</button>
          </p>
        </div>

        {onLogout && (
          <button type="button" className="mt-5 text-(--color-text-muted) text-sm bg-transparent border-none cursor-pointer hover:text-(--color-text-body) transition-colors" onClick={onLogout}>
            ← Ana Sayfaya Dön
          </button>
        )}

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-[10px] sm:text-xs text-(--color-text-muted)">
          {["Ücretsiz Başla", "Kurulum Yok", "Veri Güvenliği"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3f7d4f]" aria-hidden="true" />
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

  const earnedAchievementCount = earnedAchievements.length;

  /* Kendi iç kaydırıcısını yöneten görünümler — dış sarmalayıcı bunlarda kaymaz. */
  const ownsScroll = activeAppView === "games" || activeAppView === "reports" || activeAppView === "therapy-program";

  return (
    <main id="main-content" className="flex h-dvh overflow-hidden bg-(--color-page-bg)" role="main">
      {/* ── Sidebar Navigation ── */}
      {/*
        Sidebar üç bölgeye ayrıldı: sabit başlık, kayan link listesi, sabit
        profil bloğu. Önceden tüm nav `overflow-y-auto` idi; CSS spec gereği
        bir eksen `visible` değilse diğeri de `auto` olur, bu yüzden tooltip
        pseudo-elementleri sidebar'ı yatayda kaydırıyordu.
      */}
      <nav className="hidden lg:flex flex-col w-64 shrink-0 relative overflow-hidden" role="navigation" aria-label="Ana gezinme"
        style={{
          background: "var(--color-sidebar)",
          borderRight: "1px solid var(--color-line)",
          backdropFilter: "blur(24px)",
        }}>
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(29, 90, 140,0.12), transparent)" }} />

        {/* Logo area */}
        <div className="relative flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid var(--color-line)" }}>
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            <BlockMark size={32} color="var(--color-primary)" />
          </div>
          <div>
            <p className="font-extrabold text-(--color-text-strong) text-sm leading-tight m-0 tracking-tight">Mimio</p>
            <p className="text-(--color-text-muted) text-[11px] m-0 font-medium">Ergoterapi platformu</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(63, 125, 79,0.1)", border: "1px solid rgba(63, 125, 79,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#6fb87f]" style={{ boxShadow: "0 0 6px rgba(63, 125, 79,0.7)" }} />
            <span className="text-[10px] font-bold text-[#6fb87f]">Aktif</span>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-0.5 p-3 flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) px-3 py-1 mt-1 mb-0.5">Ana Menü</p>
          {navLinks.map(({ view, icon: Icon, label, tooltip, matchViews, badge }) => {
            const isActive = matchViews ? matchViews.includes(activeAppView) : activeAppView === view;
            return (
              <button key={view} type="button"
                title={tooltip}
                aria-current={isActive ? "page" : undefined}
                className={`${navItem} ${isActive ? navItemActive : ""}`}
                onClick={() => setActiveAppView(view)}>
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-(--color-primary)"
                    style={{ boxShadow: "0 0 8px rgba(29, 90, 140,0.6)" }} />
                )}
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${isActive ? "bg-(--color-primary)/15" : "bg-transparent group-hover:bg-(--color-surface-elevated)"}`}>
                  <Icon size={15} />
                </span>
                <span className="font-semibold text-sm flex-1">{label}</span>
                {badge !== undefined && !isActive && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums"
                    style={{
                      background: view === "reports" ? "rgba(184, 118, 58,0.15)" : view === "clients" ? "rgba(63, 125, 79,0.12)" : "rgba(29, 90, 140,0.12)",
                      color: view === "reports" ? "#b8763a" : view === "clients" ? "#6fb87f" : "#4a95cc",
                      border: `1px solid ${view === "reports" ? "rgba(184, 118, 58,0.2)" : view === "clients" ? "rgba(63, 125, 79,0.18)" : "rgba(29, 90, 140,0.18)"}`,
                    }}>
                    {badge}
                  </span>
                )}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-(--color-primary) shrink-0"
                    style={{ boxShadow: "0 0 6px rgba(29, 90, 140,0.5)" }} />
                )}
              </button>
            );
          })}

          {/* Achievements button */}
          <button type="button"
            title="Başarımlar & rozetler"
            className={`${navItem} mt-2`}
            onClick={() => setShowAchievements(true)}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-transparent group-hover:bg-(--color-surface-elevated)">
              <Award size={15} />
            </span>
            <span className="font-semibold text-sm flex-1">Başarımlar</span>
            {earnedAchievementCount > 0 && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums"
                style={{ background: "rgba(184, 118, 58,0.15)", color: "#b8763a", border: "1px solid rgba(184, 118, 58,0.2)" }}>
                {earnedAchievementCount}
              </span>
            )}
          </button>
        </div>

        {/*
          Bugün kartı. Sidebar'ın ortası boştu; terapistin seans sırasında en
          çok ihtiyaç duyduğu iki bilgi buraya kondu: bugün kaç seans yapıldı
          ve şu an hangi danışan seçili. Danışan seçiliyse tek tıkla oyuna gider.
        */}
        {(() => {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const todayCount = platformOverview.recentSessions.filter(
            (session) => new Date(session.playedAt).getTime() >= today.getTime(),
          ).length;
          return (
            <div className="shrink-0 mx-3 mb-3 rounded-xl overflow-hidden"
              style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}>
              <div className="flex items-stretch">
                <div className="flex-1 px-3 py-2.5" style={{ borderRight: "1px solid var(--color-line)" }}>
                  <span className="numeral block text-xl font-bold leading-none text-(--color-text-strong)">{todayCount}</span>
                  <span className="text-[10px] text-(--color-text-muted)">bugün</span>
                </div>
                <div className="flex-1 px-3 py-2.5">
                  <span className="numeral block text-xl font-bold leading-none text-(--color-text-strong)">{thisWeekCount}</span>
                  <span className="text-[10px] text-(--color-text-muted)">bu hafta</span>
                </div>
              </div>
              <button type="button"
                onClick={() => setActiveAppView("games")}
                className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer text-left transition-colors hover:bg-(--color-primary-light) bg-transparent"
                style={{ borderTop: "1px solid var(--color-line)" }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: activeClient ? "var(--color-accent-green)" : "var(--color-text-disabled)" }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[10px] text-(--color-text-muted) leading-tight">
                    {activeClient ? "Seçili danışan" : "Danışan seçilmedi"}
                  </span>
                  <span className="block text-xs font-semibold text-(--color-text-strong) truncate leading-tight">
                    {activeClient?.displayName ?? "Oyun alanından seç"}
                  </span>
                </span>
                <ChevronRight size={13} className="shrink-0 text-(--color-text-muted)" />
              </button>
            </div>
          );
        })()}

        {/*
          Hesap bloğu. Önceki sürümde üç daraltılmış düğme (Açık/Düzenle/Çıkış)
          yan yana sıkışıyor, etiketler kırpılıyordu. Artık: profil satırına
          basınca açılan bir menü — her eylem tam etiketiyle ve çalışır hâlde.
        */}
        <div className="relative shrink-0 p-3" style={{ borderTop: "1px solid var(--color-line)" }}>
          {accountMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Menüyü kapat"
                className="fixed inset-0 z-40 cursor-default bg-transparent border-none"
                onClick={() => setAccountMenuOpen(false)}
              />
              {/*
                Hesap menüsü.

                Düzen bilinçli olarak "satır" temelli: her satır tek bir iş
                yapar, hepsi aynı yükseklikte, aralarında kılcal ayraç var.
                Önceki sürümde tema seçici tam genişlikte iri bir blok olduğu
                için menünün ağırlık merkezi oraya kayıyor, geri kalanı
                iliştirilmiş gibi duruyordu. Artık tema, kendi satırında
                sağa yaslı küçük bir segment.
              */}
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-full left-3 right-3 mb-2 z-50 rounded-2xl overflow-hidden origin-bottom"
                style={{
                  background: "var(--color-surface-strong)",
                  border: "1px solid var(--color-line-strong)",
                  boxShadow: "var(--shadow-lg)",
                }}
                role="menu"
              >
                {/* Kimlik */}
                <div className="flex items-center gap-2.5 px-3 py-3">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
                  >
                    {activeTherapist?.displayName?.[0]?.toLocaleUpperCase("tr") ?? "T"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[13px] font-bold text-(--color-text-strong) truncate leading-tight">
                      {activeTherapist?.displayName ?? "Terapist"}
                    </strong>
                    <span className="block text-[11px] text-(--color-text-muted) truncate leading-tight mt-0.5">
                      {activeTherapist?.clinicName || "Bağımsız terapist"}
                    </span>
                  </span>
                </div>

                {/* Uzmanlık — varsa rozet, yoksa doldurmaya davet eden satır.
                    Boş durumu "Uzmanlık girilmemiş" diye pasif yazmak yerine
                    tıklanabilir bir eylem yapıyoruz. */}
                {activeTherapist?.specialty ? (
                  <div className="px-3 pb-3 -mt-0.5">
                    <span
                      className="inline-block text-[10px] font-bold px-2 py-1 rounded-md"
                      style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
                    >
                      {activeTherapist.specialty}
                    </span>
                  </div>
                ) : null}

                <div style={{ height: 1, background: "var(--color-line)" }} />

                <div className="p-1">
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-row"
                    onClick={() => {
                      setTherapistEditDraft({
                        displayName: activeTherapist?.displayName ?? "",
                        clinicName: activeTherapist?.clinicName ?? "",
                        specialty: activeTherapist?.specialty ?? "",
                      });
                      setShowEditTherapist(true);
                      setAccountMenuOpen(false);
                    }}
                  >
                    <Edit2 size={14} className="shrink-0 text-(--color-text-muted)" />
                    <span className="flex-1 text-left">
                      {activeTherapist?.specialty ? "Profili düzenle" : "Profili tamamla"}
                    </span>
                    {!activeTherapist?.specialty && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "var(--color-signal)" }}
                        title="Uzmanlık alanı girilmemiş"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className="menu-row"
                    onClick={() => { setAccountMenuOpen(false); setShowAchievements(true); }}
                  >
                    <Award size={14} className="shrink-0 text-(--color-text-muted)" />
                    <span className="flex-1 text-left">Başarımlar</span>
                    {earnedAchievementCount > 0 && (
                      <span className="numeral text-[11px] text-(--color-text-muted)">
                        {earnedAchievementCount}
                      </span>
                    )}
                  </button>
                </div>

                <div style={{ height: 1, background: "var(--color-line)" }} />

                {/* Tema — kendi satırında, sağa yaslı segment */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="flex-1 text-[13px] font-medium text-(--color-text-body)">Görünüm</span>
                  <div
                    className="relative flex p-0.5 rounded-lg shrink-0"
                    style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}
                    role="radiogroup"
                    aria-label="Tema"
                  >
                    {([
                      { key: "light", label: "Açık tema", Icon: Sun },
                      { key: "dark", label: "Koyu tema", Icon: Moon },
                      { key: "high-contrast", label: "Yüksek kontrast", Icon: Eye },
                    ] as const).map(({ key, label, Icon }) => {
                      const on = theme === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={label}
                          title={label}
                          onClick={() => setTheme(key)}
                          className="relative w-7 h-6 flex items-center justify-center rounded-md cursor-pointer border-none bg-transparent transition-colors"
                          style={{ color: on ? "var(--color-text-inverse)" : "var(--color-text-muted)" }}
                        >
                          {on && (
                            <motion.span
                              layoutId="theme-pill"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                              className="absolute inset-0 rounded-md"
                              style={{ background: "var(--color-primary)" }}
                            />
                          )}
                          <Icon size={13} className="relative" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height: 1, background: "var(--color-line)" }} />

                <div className="p-1">
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-row menu-row-danger"
                    onClick={() => { setAccountMenuOpen(false); handleLogout(); }}
                  >
                    <LogOut size={14} className="shrink-0" />
                    <span className="flex-1 text-left">Çıkış yap</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}

          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            onClick={() => setAccountMenuOpen((open) => !open)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-left hover:bg-(--color-surface-elevated)"
            style={{
              background: accountMenuOpen ? "var(--color-surface-elevated)" : "transparent",
              border: "1px solid var(--color-line)",
            }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
            >
              {activeTherapist?.displayName?.[0]?.toLocaleUpperCase("tr") ?? "T"}
            </span>
            <span className="flex flex-col flex-1 min-w-0">
              <strong className="text-(--color-text-strong) text-xs font-semibold truncate leading-tight">
                {activeTherapist?.displayName ?? "Terapist"}
              </strong>
              <span className="text-(--color-text-muted) text-[10px] truncate">
                {activeTherapist?.clinicName || "Bağımsız terapist"}
              </span>
            </span>
            <ChevronDown
              size={14}
              className="shrink-0 text-(--color-text-muted) transition-transform"
              style={{ transform: accountMenuOpen ? "rotate(180deg)" : "none" }}
            />
          </button>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <header className="flex lg:hidden items-center justify-between px-4 shrink-0 fixed top-0 left-0 right-0 z-30"
        style={{
          height: "calc(56px + env(safe-area-inset-top, 0px))",
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: "var(--color-chrome-nav)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--color-line)",
        }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shrink-0"
            style={{ background: "linear-gradient(135deg, #1d5a8c, #4a95cc)", boxShadow: "0 2px 8px rgba(29, 90, 140,0.45)" }}>
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
              background: platformStatus === "online" ? "rgba(63, 125, 79,0.1)" : "rgba(184, 118, 58,0.1)",
              border: `1px solid ${platformStatus === "online" ? "rgba(63, 125, 79,0.25)" : "rgba(184, 118, 58,0.25)"}`,
            }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: platformStatus === "online" ? "#3f7d4f" : "#b8763a", boxShadow: `0 0 5px ${platformStatus === "online" ? "rgba(63, 125, 79,0.7)" : "rgba(184, 118, 58,0.7)"}` }} />
            <span className="text-[9px] font-bold" style={{ color: platformStatus === "online" ? "#3f7d4f" : "#b8763a" }}>
              {platformStatus === "online" ? "Canlı" : "Lokal"}
            </span>
          </div>
          {/* Theme toggle */}
          <button type="button"
            className="w-8 h-8 rounded-xl flex items-center justify-center border-none cursor-pointer bg-transparent text-(--color-text-muted) hover:text-(--color-text-body) transition-colors"
            onClick={toggleTheme}>
            {theme === "dark" || theme === "high-contrast" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {/* Avatar / menu */}
          <button type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all active:scale-95"
            style={{ background: "rgba(29, 90, 140,0.1)" }}
            onClick={() => setShowUserMenu(v => !v)}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "linear-gradient(135deg, #1d5a8c, #4a95cc)", boxShadow: "0 2px 6px rgba(29, 90, 140,0.4)" }}>
              {activeTherapist?.displayName?.[0]?.toUpperCase() ?? "T"}
            </div>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-3 z-50 rounded-2xl shadow-(--shadow-elevated) border p-2 min-w-[200px] max-w-[calc(100vw-24px)]"
                style={{ top: "60px", background: "var(--color-surface-strong)", borderColor: "rgba(29, 90, 140,0.2)", backdropFilter: "blur(20px)" }}>
                {/* Top shimmer */}
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl" style={{ background: "linear-gradient(90deg,transparent,rgba(29, 90, 140,0.4),transparent)" }} />
                <div className="px-3 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, #1d5a8c, #4a95cc)", boxShadow: "0 2px 8px rgba(29, 90, 140,0.4)" }}>
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
                  {theme === "dark" || theme === "high-contrast" ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === "dark" || theme === "high-contrast" ? "Açık Tema" : "Koyu Tema"}
                </button>
                <button type="button" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-(--color-text-body) hover:bg-(--color-surface-elevated) w-full text-left bg-transparent border-none cursor-pointer" onClick={() => { setShowUserMenu(false); setTheme(theme === "high-contrast" ? "dark" : "high-contrast"); }}>
                  <span className="text-sm font-black" style={{ color: theme === "high-contrast" ? "#ffff00" : "inherit" }}>⊙</span>
                  {theme === "high-contrast" ? "Normal Mod" : "Yüksek Kontrast"}
                </button>
                <button type="button" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-(--color-accent-red) hover:bg-[#a8392c]/10 w-full text-left bg-transparent border-none cursor-pointer" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                  <LogOut size={14} /> Çıkış Yap
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/*
        Tek kaydırma kuralı.

        Oyun alanı, Raporlar ve Terapi kendi iç kaydırıcılarını yönetir; bu
        görünümlerde dış sarmalayıcı kaymaz, aksi hâlde iç içe iki kaydırma
        çubuğu oluşuyordu. Diğer görünümlerde kaydırma dış sarmalayıcıdadır.

        Üstteki 56 px yalnızca mobil başlık çubuğu için: o çubuk `lg:hidden`
        olduğundan masaüstünde padding de kaldırılır — daha önce sabit
        veriliyordu ve masaüstünde üstte ölü bir bant bırakıp içeriğin son
        56 px'ini görünür alanın dışına itiyordu.
      */}
      <div
        className={`flex-1 min-h-0 pt-[calc(56px+env(safe-area-inset-top,0px))] lg:pt-0 ${
          ownsScroll ? "overflow-hidden flex flex-col" : "overflow-y-auto pb-20 lg:pb-0 safe-scroll-bottom"
        }`}
        style={{ paddingLeft: "env(safe-area-inset-left, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }}
      >

        {/* ── Dashboard ── */}
        {activeAppView === "dashboard" && (
          <div className="app-shell p-4 lg:p-6 space-y-5 lg:space-y-8">

            {/* Header — degrade metin ve emoji kaldırıldı. Bir klinik
                aracın ana ekranı selamlaşma değil, günün durumu ile
                açılmalı: tarih, bağlantı durumu, sonra kim olduğun. */}
            <div className="flex items-start justify-between pt-1 gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) hidden sm:inline">{formatDate(getTodayString())}</span>
                  <span className="w-1 h-1 rounded-full bg-(--color-text-muted) hidden sm:inline-block" />
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: platformStatus === "online" ? "var(--color-accent-green)" : "var(--color-signal)" }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ background: platformStatus === "online" ? "var(--color-accent-green)" : "var(--color-signal)" }} />
                    {getDatabaseStatusLabel(platformStatus)}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-4xl font-extrabold m-0 leading-tight truncate text-(--color-text-strong)">
                  Merhaba, {activeTherapist?.displayName?.split(" ")[0] ?? "Terapist"}
                </h1>
                <p className="text-(--color-text-soft) text-xs lg:text-sm mt-1.5 m-0">
                  {clientOptions.length} danışan · {effectiveSessionCount} toplam seans
                </p>
              </div>
              <button type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-semibold border-none cursor-pointer transition-all hover:-translate-y-0.5 shrink-0"
                style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)", boxShadow: "var(--shadow-sm)" }}
                onClick={() => setActiveAppView("games")}>
                <Gamepad2 size={14} /> <span className="hidden sm:inline">Oyun Başlat</span><span className="sm:hidden">Oyna</span>
              </button>
            </div>

            {/* Stats */}
            {(() => {
              const avgScore = effectiveSessionCount > 0
                ? Math.round(platformOverview.totals.totalScore / effectiveSessionCount)
                : 0;

              /* ── Kart grafikleri gerçek seans kaydından türetilir ──
                 Son 14 günün günlük seans sayısı ve günlük ortalama skoru.
                 Veri yoksa StatCard grafiği hiç çizmez. */
              const DAY_MS = 86_400_000;
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              const dayBuckets = Array.from({ length: 14 }, (_, i) => {
                const start = todayStart.getTime() - (13 - i) * DAY_MS;
                const sessions = platformOverview.recentSessions.filter((s) => {
                  const t = new Date(s.playedAt).getTime();
                  return t >= start && t < start + DAY_MS;
                });
                return {
                  count: sessions.length,
                  avg: sessions.length > 0
                    ? sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length
                    : 0,
                };
              });
              const countSeries = dayBuckets.map((d) => d.count);
              /* Ortalama skor serisinde boş günler seriyi sıfıra çekip
                 grafiği yanıltıyordu; yalnızca seans olan günler alınıyor. */
              const scoreSeries = dayBuckets.filter((d) => d.count > 0).map((d) => Math.round(d.avg));

              /* Geçen haftaya göre seans farkı — uydurma "trend: up" oku
                 yerine gerçek bir karşılaştırma. */
              const nowMs = Date.now();
              const lastWeekCount = platformOverview.recentSessions.filter((s) => {
                const age = nowMs - new Date(s.playedAt).getTime();
                return age >= 7 * DAY_MS && age < 14 * DAY_MS;
              }).length;
              const weekDelta = lastWeekCount > 0 || thisWeekCount > 0 ? thisWeekCount - lastWeekCount : null;

              const statItems = [
                {
                  v: effectiveSessionCount, l: "Toplam Seans", sub: "tüm zamanlar",
                  tooltip: "Tüm zamanlarda kaydedilen toplam oyun seansı sayısı",
                  Icon: Gamepad2,
                  accent: "var(--color-domain-motor)",
                  series: countSeries,
                },
                {
                  v: clientOptions.length, l: "Danışan", sub: "kayıtlı profil",
                  tooltip: "Sisteme kayıtlı toplam danışan profili",
                  Icon: Users,
                  accent: "var(--color-accent-green)",
                },
                {
                  v: thisWeekCount, l: "Bu Hafta", sub: "son 7 gün",
                  tooltip: "Son 7 gün içinde oynanan seans sayısı; rozet geçen haftayla farkı gösterir",
                  Icon: TrendingUp,
                  accent: "var(--color-signal)",
                  series: countSeries.slice(7),
                  delta: weekDelta,
                  deltaUnit: "seans",
                },
                {
                  v: avgScore, l: "Ort. Skor", sub: "seans başına",
                  tooltip: "Tüm seansların skor ortalaması",
                  Icon: Award,
                  /* Nötr mavi-gri: ortalama skor bir uyarı değil, bir okuma. */
                  accent: "var(--color-accent-teal)",
                  series: scoreSeries,
                },
              ];
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  {statItems.map((item) => (
                    <StatCard key={item.l} {...item} />
                  ))}
                </div>
              );
            })()}

            {/* Quick Actions —
                Kartlar artık degrade yıkanmış renkli kutular değil; tek
                yüzey, kılcal çerçeve ve renkli bir ikon karesi. Renk yalnız
                hangi modüle gittiğini söyler, kartı boyamaz. */}
            {(() => {
              const actions = [
                {
                  Icon: UserPlus, title: "Yeni Danışan Ekle", sub: "Profil oluştur ve seans başlat",
                  action: () => { setShowAddClient(true); setActiveAppView("clients"); },
                  accent: "var(--color-accent-green)",
                  meta: null as string | null,
                },
                {
                  Icon: Gamepad2, title: "Oyun Alanını Aç", sub: "Seans çalışma alanı",
                  action: () => setActiveAppView("games"),
                  accent: "var(--color-domain-motor)",
                  /* Sayı GAME_TABS'tan gelir; elle yazılan "6 Oyun" rozeti
                     oyun eklenince yanlışa düşüyordu. */
                  meta: `${GAME_TABS.length} oyun` as string | null,
                },
                {
                  Icon: Stethoscope, title: "Terapi Programı", sub: "Aktivite önerileri ve haftalık plan",
                  action: () => setActiveAppView("therapy-program"),
                  accent: "var(--color-accent-teal)",
                  meta: null as string | null,
                },
                {
                  Icon: BarChart3, title: "Raporlar & Analitik", sub: "Skor grafikleri, danışan gelişimi",
                  action: () => setActiveAppView("reports"),
                  accent: "var(--color-signal)",
                  meta: null as string | null,
                },
              ] as const;
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  {actions.map(({ Icon, title, sub, action, accent, meta }) => (
                    <button key={title} type="button" onClick={action}
                      aria-label={`${title} — ${sub}`}
                      className="flex flex-col gap-2 p-4 lg:p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-(--color-line-strong) hover:shadow-(--shadow-sm) group relative active:translate-y-0"
                      style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `color-mix(in srgb, ${accent} 13%, transparent)` }}>
                          <Icon size={17} style={{ color: accent }} />
                        </span>
                        <ArrowUpRight
                          size={15}
                          className="shrink-0 text-(--color-text-disabled) transition-all duration-200 group-hover:text-(--color-text-soft) group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </span>
                      <strong className="text-(--color-text-strong) text-sm font-semibold leading-tight mt-1">{title}</strong>
                      <span className="text-(--color-text-muted) text-[11px] lg:text-xs leading-snug">
                        {sub}{meta ? ` · ${meta}` : ""}
                      </span>
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
              {/* Kategori kartları hızlı eylemlerle aynı dili konuşur:
                  tek yüzey, kılcal çerçeve, renkli ikon karesi. Kategori
                  rengi alan jetonlarından gelir — uygulamanın her yerinde
                  aynı beceri alanı aynı rengi taşır. */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                {GAME_CATEGORIES.map((cat, catIdx) => {
                  const count = GAME_TABS.filter((g) => g.category === cat.key).length;
                  const CatIcon = CATEGORY_ICONS[cat.key];
                  const accent = CATEGORY_ACCENTS[cat.key];
                  return (
                    <button key={cat.key} type="button"
                      className="flex sm:flex-col flex-row items-center sm:items-start gap-3 sm:gap-2.5 p-3.5 sm:p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-(--color-line-strong) hover:shadow-(--shadow-sm) group relative"
                      style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
                      onClick={() => { openCategory(cat.key); }}>
                      <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `color-mix(in srgb, ${accent} 13%, transparent)` }}>
                        <CatIcon size={18} style={{ color: accent }} />
                      </span>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <strong className="text-(--color-text-strong) text-sm font-semibold">{cat.title}</strong>
                        <span className="text-[11px] text-(--color-text-muted)">
                          <span className="numeral">{count}</span> oyun
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Weekly comparison widget ── */}
            {effectiveSessionCount > 0 && (() => {
              const now = Date.now();
              const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
              const thisWeekSessions = platformOverview.recentSessions.filter(s => now - new Date(s.playedAt).getTime() < oneWeekMs);
              const lastWeekSessions = platformOverview.recentSessions.filter(s => {
                const age = now - new Date(s.playedAt).getTime();
                return age >= oneWeekMs && age < 2 * oneWeekMs;
              });
              const thisAvg = thisWeekSessions.length > 0 ? Math.round(thisWeekSessions.reduce((a, s) => a + s.score, 0) / thisWeekSessions.length) : 0;
              const lastAvg = lastWeekSessions.length > 0 ? Math.round(lastWeekSessions.reduce((a, s) => a + s.score, 0) / lastWeekSessions.length) : 0;
              const countDelta = thisWeekSessions.length - lastWeekSessions.length;
              const avgDelta = thisAvg - lastAvg;
              const cols = [
                { label: "Bu Hafta Seans", this: thisWeekSessions.length, last: lastWeekSessions.length, delta: countDelta, unit: "seans" },
                { label: "Bu Hafta Ort. Skor", this: thisAvg, last: lastAvg, delta: avgDelta, unit: "puan" },
              ];
              return (
                <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-line)" }}>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={13} className="text-(--color-text-muted)" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">Haftalık Karşılaştırma</span>
                    </div>
                    <span className="text-[10px] text-(--color-text-muted)">Bu hafta / geçen hafta</span>
                  </div>
                  <div className="grid grid-cols-2">
                    {cols.map((col, i) => (
                      <div key={col.label} className="p-4 space-y-1.5" style={{ borderLeft: i > 0 ? "1px solid var(--color-line)" : undefined }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) m-0">{col.label}</p>
                        <div className="flex items-end gap-2">
                          <strong className="numeral text-3xl font-extrabold leading-none text-(--color-text-strong)">{col.this}</strong>
                          <div className="flex items-center gap-1 pb-0.5">
                            {col.delta !== 0 && (
                              <span className="numeral text-[11px] font-bold" style={{ color: col.delta > 0 ? "var(--color-accent-green)" : "var(--color-accent-red)" }}>
                                {col.delta > 0 ? "+" : "−"}{Math.abs(col.delta)} <span className="font-medium text-(--color-text-muted)">{col.unit}</span>
                              </span>
                            )}
                            {col.delta === 0 && col.last > 0 && <span className="text-[10px] text-(--color-text-muted)">değişmedi</span>}
                          </div>
                        </div>
                        <p className="text-[10px] text-(--color-text-muted) m-0">
                          Geçen hafta <span className="numeral">{col.last}</span> {col.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Birthday reminders ── */}
            {(() => {
              const today = new Date();
              const todayMD = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              const upcomingDays = 7;
              const upcoming = clientOptions.filter(c => {
                if (!c.birthDate) return false;
                const bd = c.birthDate.slice(5); // MM-DD
                const bdDate = new Date(today.getFullYear(), parseInt(bd.slice(0, 2)) - 1, parseInt(bd.slice(3)));
                if (bdDate < today) bdDate.setFullYear(today.getFullYear() + 1);
                const diff = Math.round((bdDate.getTime() - today.getTime()) / 86400000);
                return diff >= 0 && diff <= upcomingDays;
              }).map(c => {
                const bd = c.birthDate!.slice(5);
                const bdDate = new Date(today.getFullYear(), parseInt(bd.slice(0, 2)) - 1, parseInt(bd.slice(3)));
                if (bdDate < today) bdDate.setFullYear(today.getFullYear() + 1);
                const diff = Math.round((bdDate.getTime() - today.getTime()) / 86400000);
                return { ...c, daysUntil: diff };
              }).sort((a, b) => a.daysUntil - b.daysUntil);
              if (upcoming.length === 0) return null;
              return (
                <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--color-line)" }}>
                    <Cake size={13} style={{ color: "var(--color-signal)" }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">Yaklaşan Doğum Günleri</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {upcoming.map(c => (
                      <div key={c.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-(--color-text-body) truncate">{c.displayName}</span>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0"
                          style={{
                            background: c.daysUntil === 0 ? "var(--color-signal-light)" : "var(--color-surface-elevated)",
                            color: c.daysUntil === 0 ? "var(--color-signal)" : "var(--color-text-muted)",
                          }}>
                          {c.daysUntil === 0 ? "Bugün" : `${c.daysUntil} gün kaldı`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Streak widget ──
                Emoji üçlüsü (🏆/🔥/⚡) ve tebrik cümleleri kaldırıldı:
                bir klinik aracın ana ekranı terapisti tebrik etmez, ritmini
                gösterir. Kalan şey son yedi günün nokta dizisi ve sayı. */}
            {sessionStreak > 0 && (
              <div className="rounded-2xl flex items-center gap-4 px-4 py-3.5"
                style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "color-mix(in srgb, var(--color-signal) 13%, transparent)" }}>
                  <Flame size={16} style={{ color: "var(--color-signal)" }} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-semibold text-(--color-text-strong)">
                    <span className="numeral">{sessionStreak}</span> günlük seans serisi
                  </p>
                  <p className="m-0 text-[11px] text-(--color-text-muted) mt-0.5">
                    Art arda seans kaydı girilen gün sayısı
                  </p>
                </div>
                <div className="flex gap-1 shrink-0" aria-hidden="true">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className="w-1.5 h-4 rounded-full"
                      style={{
                        background: i < Math.min(sessionStreak, 7) ? "var(--color-signal)" : "var(--color-line-strong)",
                      }} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Session Reminder Banner ── */}
            <SessionReminderBanner
              clients={clientOptions}
              sessions={platformOverview.recentSessions}
              onSelectClient={(cid) => { handleSelectClient(cid); }}
            />

            {/* ── Quick Session Start ── */}
            {activeClient && (
              <QuickSessionStart
                clients={clientOptions}
                activeClientId={activeClientId}
                recentSessions={platformOverview.recentSessions}
                onSelectClient={setActiveClientId}
                onStartGame={(key) => { openGameView(key); }}
                onStartSessionSet={() => { setShowSessionSetPicker(true); setActiveAppView("games"); }}
              />
            )}

            {/* ── Weekly Summary Analytics ── */}
            {effectiveSessionCount > 0 && (
              <WeeklySummaryCard
                sessions={platformOverview.recentSessions}
                totalClients={clientOptions.length}
                totalGoals={clientGoals.length}
              />
            )}

            {/* ── Game Distribution Chart ── */}
            {effectiveSessionCount > 3 && (
              <GameDistributionChart sessions={platformOverview.recentSessions} />
            )}

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
                    style={{ background: "var(--color-primary-light)" }}>
                    <Gamepad2 size={24} strokeWidth={1.5} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <p className="text-(--color-text-strong) text-sm font-semibold m-0 mb-1">Henüz seans kaydı yok</p>
                    <p className="text-(--color-text-muted) text-xs m-0">Oyun alanına geçerek ilk seansını başlatabilirsin.</p>
                  </div>
                  <button type="button" className={btnPrimary} onClick={() => setActiveAppView("games")}>Oyun Alanını Aç</button>
                </div>
              ) : (
                /*
                  Seans akışı.

                  Önceki sürümde her satırın rengi elle yazılmış bir tablodan
                  geliyordu; "pairs" turkuaz bir zemin ile mavi bir metni
                  eşleştiriyor, "memory" ile "difference" ise birbirinin aynısı
                  oluyordu. Renk artık oyunun kendi beceri alanından türüyor —
                  kategori kartlarındakiyle aynı üç jeton. İkon da öyle: her
                  satırda aynı gamepad yerine alanın simgesi.
                */
                <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                  <div className="flex flex-col">
                    {recentSessionFeed.map((session, idx) => {
                      const tab = GAME_TABS.find((g) => g.key === session.gameKey);
                      const accent = tab ? CATEGORY_ACCENTS[tab.category] : "var(--color-primary)";
                      const RowIcon = tab ? CATEGORY_ICONS[tab.category] : Gamepad2;
                      const isLast = idx === recentSessionFeed.length - 1;
                      return (
                        <div key={session.id}
                          className="relative flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-150 hover:bg-(--color-surface-elevated) group cursor-pointer"
                          style={{ borderBottom: !isLast ? "1px solid var(--color-line-soft)" : "none" }}
                          onClick={() => { const c = clientOptions.find(cl => cl.id === session.clientId); if (c) handleSelectClient(c.id); }}>
                          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `color-mix(in srgb, ${accent} 13%, transparent)` }}>
                            <RowIcon size={15} style={{ color: accent }} />
                          </span>

                          <div className="flex-1 min-w-0">
                            <strong className="text-(--color-text-strong) text-sm font-semibold block truncate leading-tight">{session.gameLabel}</strong>
                            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                              <span className="text-(--color-text-muted) text-xs">{session.clientName}</span>
                              {session.durationSeconds && (
                                <span className="flex items-center gap-1 text-(--color-text-muted) text-[11px] tabular-nums">
                                  <Clock size={9} />
                                  {formatDuration(session.durationSeconds)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <span className="flex items-baseline gap-1">
                              <strong className="numeral text-base font-bold leading-none text-(--color-text-strong)">{session.score}</strong>
                              <span className="text-[10px] text-(--color-text-muted)">puan</span>
                            </span>
                            <span className="text-[11px] text-(--color-text-muted)">{formatPlayedAt(session.playedAt)}</span>
                          </div>

                          <ChevronRight size={14} className="text-(--color-text-disabled) opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--color-line)" }}>
                    <span className="text-xs text-(--color-text-muted)">
                      <span className="numeral">{effectiveSessionCount}</span> toplam seans kaydı
                    </span>
                    <button type="button"
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-(--color-surface-elevated)"
                      style={{ background: "transparent", border: "1px solid var(--color-line-strong)", color: "var(--color-text-body)" }}
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
          <div className="app-shell p-4 lg:p-6 space-y-5 lg:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-(--color-text-strong) m-0" style={{
                  background: "linear-gradient(135deg, var(--color-text-strong) 0%, #7db8e0 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>Danışanlar</h1>
                <span className="text-(--color-text-muted) text-xs lg:text-sm">{clientOptions.length} kayıtlı danışan</span>
              </div>
              <div className="flex items-center gap-2">
                {clientOptions.length > 0 && (
                  <button type="button" title="CSV Dışa Aktar"
                    className="w-9 h-9 rounded-xl flex items-center justify-center border cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: "rgba(111, 184, 127,0.1)", borderColor: "rgba(111, 184, 127,0.25)", color: "#6fb87f" }}
                    onClick={handleExportClientsCsv}>
                    <Download size={14} />
                  </button>
                )}
                <button type="button" title="CSV İçe Aktar"
                  className="w-9 h-9 rounded-xl flex items-center justify-center border cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(29, 90, 140,0.1)", borderColor: "rgba(29, 90, 140,0.25)", color: "#4a95cc" }}
                  onClick={() => setShowCsvImport(true)}>
                  <Upload size={14} />
                </button>
                <button type="button"
                  className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-all hover:scale-105 shrink-0"
                  style={{ background: "linear-gradient(135deg, #1d5a8c, #4a95cc)", boxShadow: "0 4px 14px rgba(29, 90, 140,0.4)" }}
                  onClick={() => setShowAddClient(!showAddClient)}>
                  <UserPlus size={14} />
                  <span className="hidden sm:inline">Yeni Danışan</span>
                  <span className="sm:hidden">Ekle</span>
                </button>
              </div>
            </div>

            {showAddClient && (
              <div className="rounded-2xl border p-4 lg:p-6 relative overflow-hidden"
                style={{ background: "var(--color-surface-strong)", borderColor: "rgba(29, 90, 140,0.25)", boxShadow: "0 0 40px rgba(29, 90, 140,0.08)" }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(29, 90, 140,0.5), transparent)" }} />
                <h3 className="text-(--color-text-strong) font-bold mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(29, 90, 140,0.15)" }}>
                    <UserPlus size={14} style={{ color: "#4a95cc" }} />
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

            {/* Filters */}
            {clientOptions.length > 0 && (() => {
              const ageOptions = Array.from(new Set(clientOptions.map(c => c.ageGroup).filter(Boolean)));
              const supportOptions = Array.from(new Set(clientOptions.map(c => c.supportLevel).filter(Boolean)));
              const hasFilters = clientFilterAge || clientFilterSupport || clientFilterActivity !== "all";
              if (ageOptions.length === 0 && supportOptions.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center gap-2">
                  {ageOptions.length > 0 && (
                    <select value={clientFilterAge} onChange={e => setClientFilterAge(e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer"
                      style={{ background: clientFilterAge ? "rgba(29, 90, 140,0.12)" : "var(--color-surface-strong)", borderColor: clientFilterAge ? "rgba(29, 90, 140,0.4)" : "var(--color-line)", color: clientFilterAge ? "#4a95cc" : "var(--color-text-soft)", outline: "none" }}>
                      <option value="">Tüm yaş grupları</option>
                      {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  )}
                  {supportOptions.length > 0 && (
                    <select value={clientFilterSupport} onChange={e => setClientFilterSupport(e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer"
                      style={{ background: clientFilterSupport ? "rgba(29, 90, 140,0.12)" : "var(--color-surface-strong)", borderColor: clientFilterSupport ? "rgba(29, 90, 140,0.4)" : "var(--color-line)", color: clientFilterSupport ? "#4a95cc" : "var(--color-text-soft)", outline: "none" }}>
                      <option value="">Tüm destek düzeyleri</option>
                      {supportOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  <select value={clientFilterActivity} onChange={e => setClientFilterActivity(e.target.value as "all" | "inactive" | "new")}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer"
                    style={{ background: clientFilterActivity !== "all" ? "rgba(29, 90, 140,0.12)" : "var(--color-surface-strong)", borderColor: clientFilterActivity !== "all" ? "rgba(29, 90, 140,0.4)" : "var(--color-line)", color: clientFilterActivity !== "all" ? "#4a95cc" : "var(--color-text-soft)", outline: "none" }}>
                    <option value="all">Tüm aktivite</option>
                    <option value="inactive">14+ gün inaktif</option>
                    <option value="new">Hiç oynanmadı</option>
                  </select>
                  {hasFilters && (
                    <button type="button" onClick={() => { setClientFilterAge(""); setClientFilterSupport(""); setClientFilterActivity("all"); }}
                      className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer flex items-center gap-1 hover:opacity-80 transition-opacity"
                      style={{ background: "rgba(168, 57, 44,0.1)", borderColor: "rgba(168, 57, 44,0.25)", color: "#a8392c" }}>
                      <X size={9} /> Filtreleri temizle
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Archive confirm modal */}
            {archiveTargetId && (() => {
              const archiveTarget = clientOptions.find((c) => c.id === archiveTargetId);
              return (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="archive-dialog-title" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setArchiveTargetId(null)}>
                  <div className="rounded-2xl sm:rounded-3xl border p-5 sm:p-6 max-w-sm w-full space-y-4 result-overlay-in" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(184, 118, 58,0.15)" }}>
                        <Archive size={18} style={{ color: "#b8763a" }} />
                      </div>
                      <div>
                        <h3 id="archive-dialog-title" className="font-extrabold text-(--color-text-strong) m-0">Danışanı Arşivle</h3>
                        <p className="text-(--color-text-muted) text-xs m-0">Bu işlem geri alınabilir</p>
                      </div>
                    </div>
                    <p className="text-(--color-text-body) text-sm m-0"><strong>{archiveTarget?.displayName}</strong> arşive taşınacak. Seans verileri korunur.</p>
                    <div className="flex gap-2">
                      <button type="button" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all active:scale-95" style={{ background: "linear-gradient(135deg,#b8763a,#a8392c)" }} onClick={() => { void handleArchiveClient(archiveTargetId); }}>Arşivle</button>
                      <button type="button" className="flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all active:scale-95" style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }} onClick={() => setArchiveTargetId(null)}>İptal</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CSV Import Modal */}
            {showCsvImport && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => { setShowCsvImport(false); setCsvImportError(""); setCsvImportText(""); }}>
                <div className="rounded-2xl sm:rounded-3xl border p-5 sm:p-6 max-w-md w-full space-y-4" style={{ background: "var(--color-surface-strong)", borderColor: "rgba(29, 90, 140,0.25)" }} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(29, 90, 140,0.15)" }}>
                        <Upload size={18} style={{ color: "#4a95cc" }} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-(--color-text-strong) m-0">CSV İçe Aktar</h3>
                        <p className="text-(--color-text-muted) text-xs m-0">Ad, Yaş Grubu, Birincil Hedef, Destek Düzeyi</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setShowCsvImport(false); setCsvImportError(""); setCsvImportText(""); }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center border-none cursor-pointer hover:opacity-80 bg-transparent"
                      style={{ color: "var(--color-text-muted)" }}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-(--color-text-muted) p-3 rounded-xl" style={{ background: "var(--color-surface-elevated)", borderLeft: "3px solid rgba(29, 90, 140,0.5)" }}>
                    <p className="m-0 font-bold mb-1">Format (başlık satırı zorunlu):</p>
                    <code className="text-[10px]">Ad,Yaş Grubu,Birincil Hedef,Destek Düzeyi<br />Ada Y.,7-9 yaş,Görsel tarama,Orta destek</code>
                  </div>
                  <textarea value={csvImportText} onChange={e => setCsvImportText(e.target.value)}
                    placeholder={"Ad,Yaş Grubu,Birincil Hedef,Destek Düzeyi\nAda Y.,7-9 yaş,Görsel tarama,Orta destek"}
                    rows={6}
                    className="w-full text-xs font-mono p-3 rounded-xl border resize-none outline-none"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-text-body)" }} />
                  {csvImportError && (
                    <p className="text-[11px] text-[#e2705f] m-0 px-1">{csvImportError}</p>
                  )}
                  <div className="flex gap-2">
                    <button type="button" className={`${btnPrimary} flex-1 justify-center`} onClick={() => void handleImportCsv()}>
                      <Upload size={13} /> İçe Aktar
                    </button>
                    <button type="button" className={`${btnSecondary} flex-1 justify-center`} onClick={() => { setShowCsvImport(false); setCsvImportError(""); setCsvImportText(""); }}>İptal</button>
                  </div>
                </div>
              </div>
            )}



            {(() => {
              const filtered = clientOptions.filter((c) => {
                if (clientSearch.trim()) {
                  const q = clientSearch.toLowerCase();
                  if (!c.displayName.toLowerCase().includes(q) && !c.primaryGoal?.toLowerCase().includes(q)) return false;
                }
                if (clientFilterAge && c.ageGroup !== clientFilterAge) return false;
                if (clientFilterSupport && c.supportLevel !== clientFilterSupport) return false;
                if (clientFilterActivity === "inactive") {
                  if (!c.lastActiveAt) return false;
                  const days = Math.floor((Date.now() - new Date(c.lastActiveAt).getTime()) / 86400000);
                  if (days < 14) return false;
                }
                if (clientFilterActivity === "new" && c.lastActiveAt) return false;
                return true;
              });
              return clientOptions.length === 0 ? (
              <div className="rounded-2xl border border-(--color-line) p-12 text-center flex flex-col items-center gap-4"
                style={{ background: "var(--color-surface-strong)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(29, 90, 140,0.1)", border: "1px solid rgba(29, 90, 140,0.2)" }}>
                  <Users size={28} strokeWidth={1.5} style={{ color: "#4a95cc" }} />
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
                  /* Kart rengi listedeki sıradan geliyordu — aynı danışan
                     filtre değişince renk değiştiriyordu, yani renk hiçbir şey
                     anlatmıyordu. Tek nötr jeton seti. */
                  const palette = {
                    bg: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                    border: "var(--color-line)",
                    glow: "transparent",
                    gradLine: "transparent",
                  };
                  return (
                    <div key={client.id}
                      className="rounded-2xl border flex flex-col gap-3 lg:gap-4 p-4 lg:p-5 card-hover group relative overflow-hidden cursor-pointer"
                      style={{ background: "var(--color-surface-strong)", borderColor: palette.border }}
                      onClick={() => handleSelectClient(client.id)}>
                      {/* Header row */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl font-extrabold flex items-center justify-center text-lg shrink-0"
                          style={{ background: palette.bg, color: palette.color }}>
                          {client.displayName[0]?.toLocaleUpperCase("tr")}
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
                        {client.lastActiveAt && (() => {
                          const daysSince = Math.floor((Date.now() - new Date(client.lastActiveAt!).getTime()) / 86400000);
                          if (daysSince < 14) return null;
                          return (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(184, 118, 58,0.1)", color: "#b8763a", border: "1px solid rgba(184, 118, 58,0.25)" }}>
                              {daysSince}g inaktif
                            </span>
                          );
                        })()}
                        {!client.lastActiveAt && (() => (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(156,163,175,0.1)", color: "#8fa1b2", border: "1px solid rgba(156,163,175,0.2)" }}>
                            hiç oynanmadı
                          </span>
                        ))()}
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
                              style={{ width: `${Math.min(100, (sessionCount / 10) * 100)}%`, background: "var(--color-primary)" }} />
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
                          style={{ background: "rgba(184, 118, 58,0.1)", borderColor: "rgba(184, 118, 58,0.25)", color: "#b8763a" }}
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
          /*
           * Danışan başına dönen beş renkli palet kaldırıldı. Renk listedeki
           * sıraya göre seçiliyordu — yani hiçbir şey anlatmıyordu; üstelik
           * beşincisi palet dışı bir mordu (#a855f7) ve metin rengiyle
           * uyuşmuyordu. Ekran artık uygulamanın geri kalanıyla aynı tek
           * yüzey + kılcal çerçeve dilini konuşuyor.
           *
           * `palette` yerinde duruyor ama artık tek ve sabit: aşağıdaki
           * kırk küstur kullanım noktasını tek noktadan besler.
           */
          const isLight = theme === "light";
          const palette = {
            bg: "var(--color-primary-light)",
            color: "var(--color-primary)",
            border: "var(--color-line)",
            glow: "transparent",
            gradientFrom: "var(--color-surface-elevated)",
          };
          const clientSessions = platformOverview.recentSessions.filter((s) => s.clientId === selectedClientId);
          const bestScore = clientSessions.length > 0 ? Math.max(...clientSessions.map((s) => s.score)) : 0;
          return (
            <div className="app-shell p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">

              {/* ── Back button ── */}
              <button type="button" className="flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all hover:opacity-80" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-primary)" }} onClick={() => setActiveAppView("clients")}>
                ← Danışanlar
              </button>

              {/* ── Hero card ── */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                <div className="p-4 lg:p-6">
                  {/* Top row: avatar + name + meta */}
                  <div className="flex items-start gap-3 lg:gap-4 mb-5">
                    <span className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl font-bold flex items-center justify-center text-2xl shrink-0"
                      style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                      {selectedClient.displayName[0]?.toLocaleUpperCase("tr")}
                    </span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h1 className="text-xl lg:text-2xl font-extrabold m-0 mb-2 text-(--color-text-strong) truncate">{selectedClient.displayName}</h1>
                      {/* Künye satırı: nötr jetonlar. Zorluk seviyesi tek
                          vurgulu olan — klinik bir ayar, kimlik değil. */}
                      <div className="flex flex-wrap gap-1.5">
                        {selectedClient.ageGroup && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-body)", border: "1px solid var(--color-line)" }}>{selectedClient.ageGroup} yaş</span>}
                        {selectedClient.primaryGoal && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md hidden sm:inline-flex" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-body)", border: "1px solid var(--color-line)" }}>{selectedClient.primaryGoal}</span>}
                        {selectedClient.supportLevel && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md hidden sm:inline-flex" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-body)", border: "1px solid var(--color-line)" }}>{selectedClient.supportLevel}</span>}
                        {selectedClient.difficultyLevel && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md hidden sm:inline-flex items-center gap-1.5"
                            style={{ background: "var(--color-signal-light)", color: "var(--color-signal)" }}>
                            <Target size={11} /> {selectedClient.difficultyLevel}
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

                  {/* Mini stat row — emoji yerine ikon, mono rakam */}
                  <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-5" style={{ background: "var(--color-line)", border: "1px solid var(--color-line)" }}>
                    {[
                      { label: "Seans", value: String(clientSessions.length), Icon: Gamepad2 },
                      { label: "En İyi", value: bestScore ? String(bestScore) : "—", Icon: Award },
                      { label: "Not", value: String(clientNotes.length), Icon: FileText },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="px-3 py-3" style={{ background: "var(--color-surface-strong)" }}>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">
                          <Icon size={11} /> {label}
                        </span>
                        <strong className="numeral block text-2xl font-extrabold leading-none mt-1.5 text-(--color-text-strong)">{value}</strong>
                      </div>
                    ))}
                  </div>

                  {/* ── Kilometre taşları ──
                      Emoji rozetleri (🎯🔥⭐🏆💡🚀✅📋) her biri farklı boy ve
                      renkte geliyor, sekiz taneye kadar çıkınca satır
                      kalabalıklaşıyordu. Artık tek biçimli jetonlar: ikon
                      alanı taşır, geri kalanı sakin. */}
                  {(() => {
                    const badges: { label: string; Icon: LucideIcon; done?: boolean }[] = [];
                    if (clientSessions.length >= 1)  badges.push({ label: "İlk seans", Icon: Check });
                    if (clientSessions.length >= 5)  badges.push({ label: "5 seans", Icon: Flame });
                    if (clientSessions.length >= 10) badges.push({ label: "10 seans", Icon: Star });
                    if (clientSessions.length >= 25) badges.push({ label: "25 seans", Icon: Trophy });
                    if (bestScore >= 10)  badges.push({ label: "Yüksek skor", Icon: TrendingUp });
                    if (bestScore >= 20)  badges.push({ label: "Üst düzey", Icon: Award });
                    if (clientGoals.some(g => g.currentValue >= g.targetValue)) badges.push({ label: "Hedef tamamlandı", Icon: Target, done: true });
                    if (clientNotes.length >= 5) badges.push({ label: "5+ seans notu", Icon: FileText });
                    if (badges.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {badges.map(({ label, Icon, done }) => (
                          <span key={label}
                            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md"
                            style={done
                              ? { background: "color-mix(in srgb, var(--color-accent-green) 12%, transparent)", color: "var(--color-accent-green)" }
                              : { background: "var(--color-surface-elevated)", color: "var(--color-text-soft)", border: "1px solid var(--color-line)" }}>
                            <Icon size={11} className="shrink-0" /> {label}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* ── Tags ── */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(selectedClient.tags ?? []).map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                          style={{ background: "var(--color-primary-light)", color: "var(--color-primary)", borderColor: "transparent" }}>
                          {tag}
                          <button type="button" className="cursor-pointer bg-transparent border-none p-0 leading-none opacity-60 hover:opacity-100 transition-opacity"
                            style={{ color: "var(--color-primary)" }}
                            onClick={() => {
                              const newTags = (selectedClient.tags ?? []).filter(t => t !== tag);
                              void handleUpdateClientTags(selectedClient.id, newTags);
                            }}>×</button>
                        </span>
                      ))}
                      {showTagInput ? (
                        <input
                          autoFocus
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const val = tagInput.trim().replace(/,$/, "");
                              if (val && !(selectedClient.tags ?? []).includes(val)) {
                                const newTags = [...(selectedClient.tags ?? []), val];
                                void handleUpdateClientTags(selectedClient.id, newTags);
                              }
                              setTagInput("");
                              setShowTagInput(false);
                            } else if (e.key === "Escape") {
                              setTagInput("");
                              setShowTagInput(false);
                            }
                          }}
                          onBlur={() => {
                            const val = tagInput.trim();
                            if (val && !(selectedClient.tags ?? []).includes(val)) {
                              void handleUpdateClientTags(selectedClient.id, [...(selectedClient.tags ?? []), val]);
                            }
                            setTagInput("");
                            setShowTagInput(false);
                          }}
                          placeholder="Etiket yaz, Enter ile ekle"
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full outline-none w-36"
                          style={{ background: "var(--color-primary-light)", color: "var(--color-primary)", border: "1px dashed var(--color-primary)" }}
                        />
                      ) : (
                        <button type="button"
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer border-none transition-opacity hover:opacity-100 opacity-50"
                          style={{ background: "transparent", color: "var(--color-text-muted)", border: "1px dashed var(--color-line-strong)" }}
                          onClick={() => setShowTagInput(true)}>
                          + Etiket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Birth date ── */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-(--color-text-muted) font-semibold shrink-0"><Cake size={12} /> Doğum tarihi</span>
                    <input
                      type="date"
                      value={selectedClient.birthDate ?? ""}
                      onChange={e => void handleUpdateClientBirthDate(selectedClient.id, e.target.value || null)}
                      className="text-[11px] font-semibold rounded-lg px-2 py-0.5 border outline-none"
                      style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-text-body)" }}
                    />
                    {selectedClient.birthDate && (
                      <span className="text-[11px] text-(--color-text-muted)">
                        ({(() => {
                          const today = new Date();
                          const bd = new Date(selectedClient.birthDate!);
                          const age = today.getFullYear() - bd.getFullYear() - (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate()) ? 1 : 0);
                          return `${age} yaş`;
                        })()})
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button type="button" className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl cursor-pointer border-none transition-all hover:-translate-y-0.5" style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)", boxShadow: "var(--shadow-sm)" }} onClick={() => { setActiveClientId(selectedClient.id); setActiveAppView("games"); }}>
                      <Gamepad2 size={15} /> Bu Danışanla Oyna
                    </button>
                    <button type="button" data-tooltip="Özet Kart (A6)" data-tooltip-dir="top"
                      className="flex items-center justify-center gap-1.5 font-bold text-sm px-4 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl cursor-pointer border-none transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)", color: "var(--color-text-soft)" }}
                      onClick={() => handlePrintSummaryCard(selectedClient)}>
                      <CreditCard size={14} />
                    </button>
                    <button type="button" data-tooltip="Tam Rapor Al" data-tooltip-dir="top"
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
                  { key: "notes",       label: "Notlar", Icon: FileText },
                  { key: "plan",        label: "Plan", Icon: CalendarDays },
                  { key: "scores",      label: "Skorlar", Icon: BarChart3 },
                  { key: "progress",    label: "İlerleme", Icon: TrendingUp },
                  { key: "suggestions", label: "Öneri", Icon: Lightbulb },
                ] as const).map(({ key, label, Icon }) => {
                  const on = clientDetailTab === (key as typeof clientDetailTab);
                  return (
                    <button key={key} type="button"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 border-none cursor-pointer"
                      style={{
                        background: on ? "var(--color-surface-strong)" : "transparent",
                        color: on ? "var(--color-text-strong)" : "var(--color-text-soft)",
                        boxShadow: on ? "var(--shadow-sm)" : "none",
                      }}
                      onClick={() => setClientDetailTab(key as typeof clientDetailTab)}>
                      <Icon size={13} className="shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ── Notes ── */}
              {clientDetailTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-(--color-text-muted) m-0">Seans Notları</h3>
                    <div className="flex gap-2 shrink-0">
                      {/* Auto Clinical Summary generator */}
                      <button type="button"
                        data-tooltip="Seans verilerinden SOAP özeti üret"
                        data-tooltip-dir="top"
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer border transition-all hover:opacity-80 active:scale-95"
                        style={{ background: "transparent", borderColor: "var(--color-line-strong)", color: "var(--color-text-body)" }}
                        onClick={() => {
                          const suggestion = generateTherapySuggestions(selectedClient, platformOverview.recentSessions);
                          const s = suggestion.soapDraft;
                          setSoapDraft({ s: s.s, o: s.o, a: s.a, p: s.p });
                          setNoteForm({ date: getTodayString(), content: "" });
                          setNoteMode("soap");
                          setShowNoteForm(true);
                        }}>
                        <FileText size={13} /> Özet Üret
                      </button>
                      <button type="button" className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer border-none transition-colors hover:opacity-90" style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }} onClick={() => setShowNoteForm(!showNoteForm)}>+ Not Ekle</button>
                    </div>
                  </div>

                  {/* Note search + date filter */}
                  {clientNotes.length > 2 && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
                        <input type="text" value={noteSearch} onChange={e => setNoteSearch(e.target.value)} placeholder="Notlarda ara…"
                          className="w-full pl-8 pr-3 py-2 rounded-xl text-sm border outline-none"
                          style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-text-body)" }} />
                        {noteSearch && <button type="button" onClick={() => setNoteSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer p-0"><X size={12} style={{ color: "var(--color-text-muted)" }} /></button>}
                      </div>
                      <input type="date" value={noteFilterFrom} onChange={e => setNoteFilterFrom(e.target.value)} title="Başlangıç tarihi"
                        className="px-3 py-2 rounded-xl text-xs border outline-none"
                        style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-text-body)" }} />
                      <input type="date" value={noteFilterTo} onChange={e => setNoteFilterTo(e.target.value)} title="Bitiş tarihi"
                        className="px-3 py-2 rounded-xl text-xs border outline-none"
                        style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-text-body)" }} />
                      {(noteSearch || noteFilterFrom || noteFilterTo) && (
                        <button type="button" onClick={() => { setNoteSearch(""); setNoteFilterFrom(""); setNoteFilterTo(""); }}
                          className="px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer hover:opacity-80"
                          style={{ background: "rgba(168, 57, 44,0.1)", borderColor: "rgba(168, 57, 44,0.25)", color: "#a8392c" }}>
                          Temizle
                        </button>
                      )}
                    </div>
                  )}

                  {showNoteForm && (
                    <div className="rounded-2xl border p-5 space-y-3 relative overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: palette.border }}>
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
                              onClick={() => {
                                setNoteMode(m);
                                if (m === "soap" && !soapDraft.o) {
                                  // Auto-populate O field with today's planned game goals
                                  const todayKey = (["sun","mon","tue","wed","thu","fri","sat"] as DayKey[])[new Date().getDay()];
                                  const thisWeekPlan = allWeeklyPlans.find(p => p.clientId === selectedClientId && p.weekStartDate === getWeekStart());
                                  const todayEntries = thisWeekPlan?.days[todayKey] ?? [];
                                  if (todayEntries.length > 0) {
                                    const goalText = todayEntries.map(e => `${GAME_LABELS[e.gameKey as GameKey] ?? e.gameKey}${e.goal ? ` — ${e.goal}` : ""}`).join("; ");
                                    setSoapDraft(d => ({ ...d, o: `Planlı seans: ${goalText}` }));
                                  }
                                }
                              }}>
                              {m === "free" ? "Serbest" : "SOAP"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input type="date" value={noteForm.date} onChange={(e) => setNoteForm((c) => ({ ...c, date: e.target.value }))} className={inputCls} />
                      {noteMode === "free" ? (
                        <>
                          {/* Note templates */}
                          <div className="flex flex-wrap gap-1.5">
                            {([
                              { label: "🌱 Başlangıç", text: "İlk seans. Danışan oyunları tanıdı, temel performans düzeyi belirlendi. Adaptasyon süreci başladı." },
                              { label: "Değerlendirme", text: "Değerlendirme seansı. Performans ölçüldü, hedef güncellendi. Gelişim izleniyor." },
                              { label: "İyi Gün", text: "Danışan yüksek motivasyon gösterdi. Tüm hedefler başarıyla tamamlandı. Zorluk artırılabilir." },
                              { label: "😔 Zor Gün", text: "Danışan dikkat güçlüğü yaşadı, süre kısaltıldı. Bir sonraki seans daha kısa tutulabilir." },
                              { label: "Gelişim Notu", text: "Önceki seansa kıyasla belirgin gelişim gözlemlendi. Hedef başarı oranı arttı." },
                            ] as const).map(({ label, text }) => (
                              <button key={label} type="button"
                                className="text-[10px] font-semibold px-2 py-1 rounded-lg border cursor-pointer transition-all hover:opacity-80"
                                style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }}
                                onClick={() => setNoteForm(c => ({ ...c, content: c.content ? `${c.content}\n${text}` : text }))}>
                                {label}
                              </button>
                            ))}
                          </div>
                          <textarea value={noteForm.content} onChange={(e) => setNoteForm((c) => ({ ...c, content: e.target.value }))} placeholder="Seans notu, gözlem veya hedef..." className={`${inputCls} resize-none`} rows={4} />
                        </>
                      ) : (
                        <div className="space-y-2">
                          {(["s", "o", "a", "p"] as (keyof SoapNoteContent)[]).map((field) => {
                            const labels = { s: "S — Subjektif", o: "O — Objektif", a: "A — Assessment", p: "P — Plan" };
                            const hints = {
                              s: "Danışan ne hissetti / söyledi? (ör. 'Yoruldum ama eğlendim')",
                              o: "Skor, hata sayısı, süre, hedef başarı oranı (ör. 'Pairs: 245p / 12 hata')",
                              a: "Bu sonuç terapötik amaca ulaşmada ne gösteriyor?",
                              p: "Sonraki seans önerileri, zorluk ayarı veya ev ödevi",
                            };
                            const snippets: Record<keyof SoapNoteContent, string[]> = {
                              s: ["Yoruldum ama eğlendim", "Çok beğendim, tekrar oynayalım", "Zor geldi", "Dikkatim dağıldı", "Heyecanlandım"],
                              o: ["Hedef %100 tamamlandı", "Hata sayısı azaldı", "Süre kısaldı", "İlk denemede başarılı", "3 tekrar gerekti"],
                              a: ["Dikkat süresi gelişiyor", "Motor koordinasyon iyileşiyor", "Görsel tarama hızlandı", "Zorluk artırılabilir", "Mevcut seviye uygun"],
                              p: ["Sonraki seans zorluk artır", "Aynı aktiviteye devam", "Ev ödevi: günlük 10 dk", "Aile bilgilendirildi", "Bir sonraki seans planlandı"],
                            };
                            return (
                              <div key={field} className="space-y-1">
                                <p className="text-[10px] font-extrabold uppercase tracking-wider m-0" style={{ color: palette.color }}>{labels[field]}</p>
                                <textarea value={soapDraft[field]} onChange={(e) => setSoapDraft((c) => ({ ...c, [field]: e.target.value }))} placeholder={hints[field]} className={`${inputCls} resize-none`} rows={2} />
                                <div className="flex flex-wrap gap-1">
                                  {snippets[field].map(s => (
                                    <button key={s} type="button"
                                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity"
                                      style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-line)", color: "var(--color-text-muted)" }}
                                      onClick={() => setSoapDraft(d => ({ ...d, [field]: d[field] ? `${d[field]}. ${s}` : s }))}>
                                      + {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button type="button" disabled={isNotesLoading} className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white cursor-pointer border-none transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }} onClick={() => { void handleAddNoteDB(); }}>Kaydet</button>
                        <button type="button" className={btnSecondary} onClick={() => { setShowNoteForm(false); setNoteMode("free"); setSoapDraft({ s: "", o: "", a: "", p: "" }); }}>İptal</button>
                      </div>
                    </div>
                  )}

                  {clientNotes.length === 0 ? (
                    <div className="rounded-2xl border border-(--color-line) p-12 text-center" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: "var(--color-surface-elevated)" }}><FileText size={20} className="text-(--color-text-muted)" /></div>
                      <p className="text-(--color-text-muted) text-sm m-0 font-medium">Henüz not eklenmedi.</p>
                      <p className="text-(--color-text-muted) text-xs mt-1 m-0">İlk seans notunu eklemek için yukarıdaki butona tıklayın.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline vertical line */}
                      <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: "var(--color-line)" }} />
                      <div className="space-y-3">
                        {clientNotes.filter(note => {
                          if (noteSearch && !note.content.toLowerCase().includes(noteSearch.toLowerCase())) return false;
                          if (noteFilterFrom && note.date < noteFilterFrom) return false;
                          if (noteFilterTo && note.date > noteFilterTo) return false;
                          return true;
                        }).map((note) => {
                          // Find sessions on the same date
                          const sameDaySessions = clientSessions.filter(s => s.playedAt?.slice(0, 10) === note.date);
                          const noteTypeLabel = note.noteMode === "soap" ? "SOAP" : null;
                          return (
                            <div key={note.id} className="flex gap-4">
                              {/* Timeline dot */}
                              <div className="relative shrink-0 mt-3.5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center z-10 relative" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}>
                                  <FileText size={14} className="text-(--color-text-muted)" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
                                                                <div className="px-4 py-3.5">
                                  <div className="flex items-center justify-between mb-2 gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-semibold text-(--color-text-strong)">{formatDate(note.date)}</span>
                                      {noteTypeLabel && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{noteTypeLabel}</span>
                                      )}
                                      {sameDaySessions.length > 0 && sameDaySessions.map(s => (
                                        <span key={s.id} className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-muted)", border: "1px solid var(--color-line)" }}>
                                          {s.gameLabel} · {s.score}p{s.durationSeconds ? ` · ${Math.round(s.durationSeconds / 60)}dk` : ""}
                                        </span>
                                      ))}
                                    </div>
                                    <button type="button" title="Notu sil" aria-label="Notu sil" className="w-7 h-7 flex items-center justify-center rounded-lg border-none cursor-pointer shrink-0 bg-transparent text-(--color-text-disabled) transition-colors hover:text-(--color-accent-red) hover:bg-(--color-surface-elevated)" onClick={() => { void handleDeleteNoteDB(note.id); }}><X size={13} /></button>
                                  </div>
                                  <p className="text-(--color-text-body) text-sm m-0 leading-relaxed">{note.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Weekly Plan ── */}
              {clientDetailTab === "plan" && (
                <div className="space-y-4">

                  {/* ── Weekly Completion Summary ── */}
                  {(() => {
                    const allEntries = Object.values(planEdits).flat();
                    const totalPlan = allEntries.length;
                    const totalDone = allEntries.filter(e => e.completed).length;
                    if (totalPlan === 0) return null;
                    const pct = Math.round((totalDone / totalPlan) * 100);
                    return (
                      <div className="rounded-2xl border border-(--color-line) p-4" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted)">Haftalık Tamamlanma</span>
                          <span className="text-sm font-extrabold tabular-nums" style={{ color: totalDone === totalPlan ? "#3f7d4f" : pct > 50 ? "#b8763a" : "var(--color-primary)" }}>
                            {totalDone}/{totalPlan} · %{pct}
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-elevated)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{
                            width: `${pct}%`,
                            background: totalDone === totalPlan ? "linear-gradient(90deg,#3f7d4f,#33663f)" : pct > 50 ? "linear-gradient(90deg,#b8763a,#3f7d4f)" : "linear-gradient(90deg,var(--color-primary),#2a72ac)",
                          }} />
                        </div>
                        {totalDone === totalPlan && totalPlan > 0 && (
                          <p className="text-xs text-[#3f7d4f] font-bold m-0 mt-2">🎉 Haftalık plan tamamlandı!</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Week navigation */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button type="button"
                      className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border text-(--color-text-soft) hover:text-(--color-text-strong) transition-all cursor-pointer shrink-0 text-base"
                      style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}
                      aria-label="Önceki hafta"
                      onClick={() => setPlanWeekStart(addDays(planWeekStart, -7))}>
                      ←
                    </button>
                    <div className="flex-1 text-center min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) m-0 mb-0.5">Haftalık Plan</p>
                      <strong className="text-xs sm:text-sm font-bold text-(--color-text-strong)">{formatDate(planWeekStart)} – {formatDate(addDays(planWeekStart, 6))}</strong>
                    </div>
                    <button type="button"
                      className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border text-(--color-text-soft) hover:text-(--color-text-strong) transition-all cursor-pointer shrink-0 text-base"
                      style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}
                      aria-label="Sonraki hafta"
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
                            ? "var(--color-primary-light)"
                            : "var(--color-surface-strong)",
                          boxShadow: isToday && !isLight ? `0 0 24px ${palette.glow}` : "none",
                          opacity: isWeekend && !isToday ? 0.75 : 1,
                        }}>

                          {/* Row header */}
                          <div className="flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3">
                            {/* Date badge */}
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex flex-col items-center justify-center shrink-0" style={{
                              background: isToday ? palette.bg : (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"),
                              border: `1px solid ${isToday ? palette.border : "var(--color-line)"}`,
                            }}>
                              <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider leading-none" style={{ color: isToday ? palette.color : "var(--color-text-muted)" }}>
                                {DAY_LABELS[day]}
                              </span>
                              <strong className="text-base sm:text-lg font-extrabold leading-tight" style={{ color: isToday ? palette.color : "var(--color-text-strong)" }}>
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
                              {entries.length > 0 && (() => {
                                const completedCount = entries.filter(e => e.completed).length;
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-(--color-text-muted)">{entries.length} aktivite</span>
                                    {completedCount > 0 && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(63, 125, 79,0.12)", color: "#3f7d4f" }}>
                                        {completedCount}/{entries.length} ✓
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Add button */}
                            <button type="button"
                              className="shrink-0 text-xs font-semibold px-3 py-2 sm:py-1.5 rounded-xl border cursor-pointer transition-all hover:opacity-75"
                              style={{
                                background: isToday ? palette.bg : (isLight ? "rgba(29, 90, 140,0.08)" : "rgba(29, 90, 140,0.1)"),
                                borderColor: isToday ? palette.border : (isLight ? "rgba(29, 90, 140,0.2)" : "rgba(29, 90, 140,0.18)"),
                                color: isToday ? palette.color : (isLight ? "#123252" : "#4a95cc"),
                              }}
                              onClick={() => { setPlanEdits((current) => ({ ...current, [day]: [...current[day], { gameKey: "memory" as PlatformGameKey, goal: "" }] })); }}>
                              + Oyun Ekle
                            </button>
                          </div>

                          {/* Entries */}
                          {entries.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
                              <div className="h-px" style={{ background: isToday ? palette.border : "var(--color-line)" }} />
                              <div className="pt-1 space-y-2">
                                {entries.map((entry, entryIndex) => (
                                  <div key={entryIndex} className="flex items-start gap-2.5 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2.5 transition-all" style={{
                                    background: entry.completed ? "rgba(63, 125, 79,0.06)" : (isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"),
                                    border: `1px solid ${entry.completed ? "rgba(63, 125, 79,0.2)" : (isToday ? palette.border : "var(--color-line)")}`,
                                    opacity: entry.completed ? 0.75 : 1,
                                  }}>
                                    {/* Completed checkbox */}
                                    <button type="button"
                                      className="w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-none cursor-pointer transition-all"
                                      style={{
                                        background: entry.completed ? palette.color : palette.bg,
                                        border: `1.5px solid ${palette.border}`,
                                      }}
                                      title={entry.completed ? "Tamamlandı" : "Tamamlandı işaretle"}
                                      aria-label={entry.completed ? `${GAME_LABELS[entry.gameKey] ?? entry.gameKey} tamamlandı` : `${GAME_LABELS[entry.gameKey] ?? entry.gameKey} tamamlandı işaretle`}
                                      onClick={() => {
                                        setPlanEdits((current) => {
                                          const updated = [...current[day]];
                                          updated[entryIndex] = { ...updated[entryIndex], completed: !updated[entryIndex].completed };
                                          return { ...current, [day]: updated };
                                        });
                                      }}>
                                      {entry.completed ? <Check size={12} className="text-white" /> : <span className="text-[9px] sm:text-[8px] font-extrabold" style={{ color: palette.color }}>{entryIndex + 1}</span>}
                                    </button>

                                    {/* Game select + goal input */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                      <select
                                        value={entry.gameKey}
                                        className="w-full text-sm font-semibold bg-transparent border-none outline-none cursor-pointer"
                                        style={{ color: "var(--color-text-strong)", textDecoration: entry.completed ? "line-through" : "none" }}
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
                                      className="shrink-0 w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center border-none cursor-pointer text-sm sm:text-xs font-bold transition-opacity hover:opacity-70"
                                      style={{ background: "rgba(168, 57, 44,0.1)", color: "#a8392c" }}
                                      aria-label={`${GAME_LABELS[entry.gameKey] ?? entry.gameKey} aktivitesini sil`}
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

                  {/* ── Goal-Based Session Planner ── */}
                  {clientGoals.length > 0 && (() => {
                    const GOAL_GAME_MAP: Record<string, GameKey[]> = {
                      dikkat:         ["scan", "difference", "logic"],
                      odak:           ["scan", "difference", "logic"],
                      hafıza:         ["memory", "pairs"],
                      bellek:         ["memory", "pairs"],
                      motor:          ["pulse", "route"],
                      koordinasyon:   ["pulse", "route"],
                      görsel:         ["difference", "scan"],
                      algı:           ["difference", "scan"],
                      planlama:       ["route", "logic"],
                      mantık:         ["logic", "route"],
                      yürütücü:       ["route", "logic"],
                    };
                    function getGoalGames(goalTitle: string): GameKey[] {
                      const lower = goalTitle.toLowerCase();
                      for (const [kw, games] of Object.entries(GOAL_GAME_MAP)) {
                        if (lower.includes(kw)) return games;
                      }
                      return ["memory", "scan", "pulse"];
                    }
                    const activeGoals = clientGoals.filter(g => g.currentValue < g.targetValue);
                    if (activeGoals.length === 0) return null;
                    return (
                      <div className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="px-4 py-3 border-b border-(--color-line)" style={{ background: "rgba(29, 90, 140,0.06)" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) m-0">Hedef Bazlı Oyun Önerisi</p>
                        </div>
                        <div className="p-4 space-y-3">
                          {activeGoals.slice(0, 3).map(goal => {
                            const games = getGoalGames(goal.title);
                            return (
                              <div key={goal.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-(--color-text-strong) truncate flex-1">{goal.title}</span>
                                  <span className="text-[10px] text-(--color-text-muted) shrink-0 ml-2">{Math.round((goal.currentValue / Math.max(goal.targetValue, 1)) * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {games.map(g => (
                                    <button key={g} type="button"
                                      onClick={() => {
                                        const entry: WeeklyPlanEntry = { gameKey: g as PlatformGameKey, goal: goal.title };
                                        setPlanEdits(cur => {
                                          const updated = { ...cur };
                                          for (const day of DAY_KEYS) {
                                            if (!updated[day].some(e => e.gameKey === g)) {
                                              updated[day] = [...updated[day], entry];
                                            }
                                          }
                                          return updated;
                                        });
                                      }}
                                      className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all hover:opacity-80"
                                      style={{ background: "rgba(29, 90, 140,0.08)", borderColor: "rgba(29, 90, 140,0.2)", color: "var(--color-primary)" }}>
                                      + {GAME_LABELS[g]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          <p className="text-[10px] text-(--color-text-muted) m-0">Butona tıklayarak ilgili oyunu haftanın tüm planlanmış günlerine ekleyebilirsiniz.</p>
                        </div>
                      </div>
                    );
                  })()}

                  <button type="button" className={btnPrimary} onClick={() => { void handleSaveWeeklyPlanDB(); }}>
                    Planı Kaydet
                  </button>
                </div>
              )}

              {/* ── Score History ── */}
              {clientDetailTab === "scores" && (
                <div className="space-y-4">
                  {/* ── Skill Radar Chart ── */}
                  {selectedClientId && clientSessions.length > 0 && (
                    <ClientProgressRadar sessions={platformOverview.recentSessions} clientId={selectedClientId} />
                  )}

                  {/* ── Weekly Progress Report ── */}
                  {selectedClient && clientSessions.length > 0 && (
                    <WeeklyProgressReport
                      client={selectedClient}
                      sessions={clientSessions}
                      goals={clientGoals}
                      therapistName={activeTherapist?.displayName ?? "Terapist"}
                      clinicName={activeTherapist?.clinicName}
                      allNotes={clientNotes}
                    />
                  )}

                  {/* ── Overall score summary strip ── */}
                  {clientSessions.length > 0 && (() => {
                    const avgScore = Math.round(clientSessions.reduce((s,ss) => s + ss.score, 0) / clientSessions.length);
                    const maxS = Math.max(...clientSessions.map(s => s.score));
                    const minS = Math.min(...clientSessions.map(s => s.score));
                    return (
                      <div className="relative overflow-hidden rounded-3xl border p-5" style={{ borderColor: "var(--color-line)", background: "var(--color-surface-strong)" }}>
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
                              { l: "Ortalama", v: avgScore },
                              { l: "En Yüksek", v: maxS },
                              { l: "En Düşük", v: minS },
                            ].map(({ l, v }) => (
                              <div key={l} className="text-center">
                                <strong className="numeral text-2xl font-extrabold text-(--color-text-strong)">{v}</strong>
                                <span className="text-[10px] text-(--color-text-muted) block mt-1">{l}</span>
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
                    const W = 420; const H = 90; const PAD = 8;
                    const xs = sorted.map((_, i) => PAD + (i / Math.max(sorted.length - 1, 1)) * (W - PAD * 2));
                    const ys = sorted.map(s => H - PAD - ((s.score / maxV) * (H - PAD * 2)));
                    const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
                    const areaPath = `${linePath} L${xs[xs.length-1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;
                    const gradId = `trend-${selectedClientId}`;
                    // 3-session moving average
                    const MA = 3;
                    const maPoints = sorted.map((_, i) => {
                      if (i < MA - 1) return null;
                      const avg = sorted.slice(i - MA + 1, i + 1).reduce((s, x) => s + x.score, 0) / MA;
                      return { x: xs[i], y: H - PAD - ((avg / maxV) * (H - PAD * 2)) };
                    }).filter((p): p is { x: number; y: number } => p !== null);
                    const maPath = maPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                    // Trend label: compare first half avg vs second half avg
                    const half = Math.ceil(sorted.length / 2);
                    const firstHalfAvg = sorted.slice(0, half).reduce((s, x) => s + x.score, 0) / half;
                    const secondHalfAvg = sorted.slice(half).reduce((s, x) => s + x.score, 0) / Math.max(sorted.length - half, 1);
                    const trendPct = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
                    const trendLabel = trendPct >= 8 ? "↑ Gelişiyor" : trendPct <= -8 ? "↓ Düşüş" : "→ Stabil";
                    const trendColor = trendPct >= 8 ? "#3f7d4f" : trendPct <= -8 ? "#a8392c" : "#b8763a";
                    return (
                      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
                        <div className="px-4 pt-4 pb-1 flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-(--color-text-muted)">Skor Trendi</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${trendColor}18`, color: trendColor, border: `1px solid ${trendColor}33` }}>{trendLabel}</span>
                            <span className="text-[10px] text-(--color-text-muted)">Son {sorted.length} seans</span>
                          </div>
                        </div>
                        <div className="px-4 pb-2">
                          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "90px" }}>
                            <defs>
                              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={palette.color} stopOpacity="0.2" />
                                <stop offset="100%" stopColor={palette.color} stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path d={areaPath} fill={`url(#${gradId})`} />
                            <path d={linePath} fill="none" stroke={palette.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
                            {maPoints.length >= 2 && (
                              <path d={maPath} fill="none" stroke={palette.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0" />
                            )}
                            {xs.map((x, i) => (
                              <circle key={i} cx={x} cy={ys[i]} r="2.5" fill={palette.color} fillOpacity="0.7" />
                            ))}
                            {/* MA dots */}
                            {maPoints.map((p, i) => (
                              <circle key={`ma-${i}`} cx={p.x} cy={p.y} r="3.5" fill="none" stroke={palette.color} strokeWidth="1.5" />
                            ))}
                          </svg>
                        </div>
                        <div className="px-4 pb-3 flex items-center justify-between">
                          <span className="text-[9px] text-(--color-text-muted)">{sorted[0]?.playedAt?.slice(0, 10) ?? ""}</span>
                          <div className="flex items-center gap-3 text-[9px] text-(--color-text-muted)">
                            <span className="flex items-center gap-1"><span className="w-5 h-0.5 inline-block rounded opacity-60" style={{ background: palette.color }} /> ham skor</span>
                            <span className="flex items-center gap-1"><span className="w-5 h-0.5 inline-block rounded" style={{ background: palette.color }} /> 3 seans ort.</span>
                          </div>
                          <span className="text-[9px] text-(--color-text-muted)">{sorted[sorted.length-1]?.playedAt?.slice(0, 10) ?? ""}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Oyun bazlı skor trendi — kendi bileşeninde; içindeki
                      useState MimioApp'in kanca sırasını bozuyordu. */}
                  <GameTrendChart sessions={clientSessions} />

                  {/* ── Session Duration Analysis ── */}
                  {clientSessions.filter(s => s.durationSeconds).length >= 2 && (() => {
                    const withDur = clientSessions.filter(s => s.durationSeconds).sort((a, b) => (a.playedAt ?? "").localeCompare(b.playedAt ?? ""));
                    const avgDur = Math.round(withDur.reduce((s, x) => s + (x.durationSeconds ?? 0), 0) / withDur.length);
                    const recent3Avg = withDur.length >= 3 ? Math.round(withDur.slice(-3).reduce((s, x) => s + (x.durationSeconds ?? 0), 0) / 3) : null;
                    const isFatiguing = recent3Avg !== null && recent3Avg < avgDur * 0.75;
                    const isImproving = recent3Avg !== null && recent3Avg > avgDur * 1.1;
                    return (
                      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: isFatiguing ? "rgba(184, 118, 58,0.3)" : "var(--color-line)" }}>
                        {isFatiguing && <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,#b8763a,transparent)" }} />}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-(--color-text-muted)">Seans Süresi</span>
                            {isFatiguing && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(184, 118, 58,0.12)", color: "#b8763a", border: "1px solid rgba(184, 118, 58,0.25)" }}>
                                Yorgunluk olabilir
                              </span>
                            )}
                            {isImproving && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(63, 125, 79,0.12)", color: "#3f7d4f", border: "1px solid rgba(63, 125, 79,0.25)" }}>
                                ↗ Süre artıyor
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3">
                            {[
                              { label: "Ortalama", value: formatDuration(avgDur) },
                              { label: "Son 3 Seans", value: recent3Avg ? formatDuration(recent3Avg) : "—" },
                              { label: "Toplam", value: formatDuration(withDur.reduce((s, x) => s + (x.durationSeconds ?? 0), 0)) },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex-1 text-center rounded-xl p-3" style={{ background: "var(--color-surface-elevated)" }}>
                                <strong className="text-sm font-bold tabular-nums text-(--color-text-strong)">{value}</strong>
                                <span className="text-[10px] text-(--color-text-muted) block mt-1">{label}</span>
                              </div>
                            ))}
                          </div>
                          {isFatiguing && recent3Avg !== null && (
                            <p className="text-xs text-(--color-text-muted) m-0 italic">Son 3 seans ortalaması ({formatDuration(recent3Avg)}) genel ortalamanın %25+ altında — danışan yorulmuş olabilir.</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Activity heatmap (12 weeks) ── */}
                  {clientSessions.length > 0 && (() => {
                    const WEEKS = 12;
                    const DAYS = WEEKS * 7;
                    const today = new Date();
                    // Build day cells from oldest (left-top) to today (right-bottom)
                    const cells: { date: string; count: number }[] = [];
                    for (let i = DAYS - 1; i >= 0; i--) {
                      const d = new Date(today);
                      d.setDate(today.getDate() - i);
                      const dateStr = d.toISOString().slice(0, 10);
                      const count = clientSessions.filter(s => (s.playedAt ?? "").startsWith(dateStr)).length;
                      cells.push({ date: dateStr, count });
                    }
                    const maxCount = Math.max(...cells.map(c => c.count), 1);
                    const cellSize = 10; const gap = 2; const totalW = WEEKS * (cellSize + gap) - gap;
                    const weekDayLabels = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
                    return (
                      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-(--color-text-muted)">Aktivite Isı Haritası</span>
                          <span className="text-[10px] text-(--color-text-muted)">Son 12 hafta</span>
                        </div>
                        <div className="px-4 pb-4 overflow-x-auto">
                          <svg viewBox={`0 0 ${totalW} ${7 * (cellSize + gap) - gap}`} style={{ width: "100%", minWidth: `${totalW}px`, height: `${7 * (cellSize + gap) - gap}px` }}>
                            {cells.map((cell, idx) => {
                              const weekIdx = Math.floor(idx / 7);
                              const dayIdx = idx % 7;
                              const x = weekIdx * (cellSize + gap);
                              const y = dayIdx * (cellSize + gap);
                              const intensity = cell.count === 0 ? 0 : 0.2 + (cell.count / maxCount) * 0.8;
                              const fill = cell.count === 0
                                ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)")
                                : palette.color;
                              return (
                                <rect key={cell.date} x={x} y={y} width={cellSize} height={cellSize} rx="2" fill={fill} opacity={cell.count === 0 ? 1 : intensity}>
                                  <title>{cell.date}: {cell.count} seans</title>
                                </rect>
                              );
                            })}
                          </svg>
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <span className="text-[9px] text-(--color-text-muted)">Az</span>
                            {[0.15, 0.35, 0.6, 0.85, 1].map(op => (
                              <span key={op} className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: palette.color, opacity: op }} />
                            ))}
                            <span className="text-[9px] text-(--color-text-muted)">Çok</span>
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
                      <div key={game.key} className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
                                                <div className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <strong className="text-(--color-text-strong) font-bold">{game.title}</strong>
                            <div className="flex items-center gap-2">
                              <span className="numeral text-xs font-bold px-3 py-1.5 rounded-md" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{gameScore.best}</span>
                              <span className="text-(--color-text-muted) text-xs font-semibold">{gameScore.plays}× oynadı</span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
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
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: "var(--color-surface-elevated)" }}><Gamepad2 size={20} className="text-(--color-text-muted)" /></div>
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
                    <div className="relative overflow-hidden rounded-3xl border p-6" style={{ borderColor: "var(--color-line)", background: "var(--color-surface-strong)" }}>
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
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallAvg}%`, background: "var(--color-primary)" }} />
                          </div>
                          {clientProgress.length === 0 && (
                            <button type="button"
                              className="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl text-white border-none cursor-pointer transition-all"
                              style={{ background: "var(--color-primary)" }}
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
                          const barColor = ga.average >= 75 ? "#3f7d4f" : ga.average >= 50 ? "#b8763a" : ga.average >= 25 ? "#1d5a8c" : "#a8392c";
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
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: "var(--color-surface-elevated)" }}><TrendingUp size={20} className="text-(--color-text-muted)" /></div>
                        <p className="text-(--color-text-muted) text-sm m-0 mb-3">İlerleme takibi için önce Terapi Programından bir alan seçin.</p>
                        <button type="button"
                          className="text-xs font-bold px-4 py-2 rounded-xl text-white border-none cursor-pointer"
                          style={{ background: "var(--color-primary)" }}
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
                          const barColor = entry.value >= 75 ? "#3f7d4f" : entry.value >= 50 ? "#b8763a" : "#1d5a8c";
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
                          style={{ background: "var(--color-primary)" }}>
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
                              style={{ background: "var(--color-primary)" }}>
                              Kaydet
                            </button>
                          </div>
                        </div>
                      )}

                      {clientGoals.length === 0 && !showGoalForm && (
                        <div className="rounded-2xl border border-dashed border-(--color-line) p-8 text-center" style={{ background: "var(--color-surface-strong)" }}>
                          <div className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center" style={{ background: "var(--color-surface-elevated)" }}><Target size={20} className="text-(--color-text-muted)" /></div>
                          <p className="text-(--color-text-muted) text-sm m-0">Bu danışan için henüz SMART hedef tanımlanmadı.</p>
                        </div>
                      )}

                      {clientGoals.map((g, i) => {
                        const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
                        const clampedPct = Math.min(pct, 100);
                        const goalColor = clampedPct >= 100 ? "#3f7d4f" : clampedPct >= 60 ? "#b8763a" : palette.color;
                        const isOverdue = g.deadline && g.deadline < getTodayString() && clampedPct < 100;
                        return (
                          <div key={g.id} className="rounded-2xl border border-(--color-line) p-4 space-y-3" style={{ background: "var(--color-surface-strong)", animation: `result-stat-in 0.3s ease ${i * 0.06}s both` }}>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-(--color-text-strong)">{g.title}</span>
                                  {clampedPct >= 100 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#3f7d4f" }}>✓ Tamamlandı</span>}
                                  {isOverdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#a8392c" }}>Gecikmiş</span>}
                                </div>
                                {g.description && <p className="text-xs text-(--color-text-muted) m-0 mt-0.5">{g.description}</p>}
                                {g.deadline && <p className="text-[10px] text-(--color-text-muted) m-0 mt-0.5">Son tarih: {g.deadline}</p>}
                              </div>
                              <button type="button" onClick={() => handleDeleteGoal(g.id)}
                                className="text-(--color-text-muted) hover:text-[#e2705f] transition-colors cursor-pointer border-none bg-transparent p-1 shrink-0">
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
                                className="flex-1 h-1.5 rounded-full cursor-pointer accent-[#2a72ac]" />
                              <span className="text-[10px] text-(--color-text-muted) shrink-0 w-16 text-right tabular-nums">{g.currentValue}/{g.targetValue}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── AI Suggestions Tab (Rule-Based) ── */}
              {clientDetailTab === "suggestions" && (() => {
                const suggestion = generateTherapySuggestions(selectedClient, platformOverview.recentSessions);
                const TrendIcon = suggestion.overallTrend === "improving" ? TrendingUp : suggestion.overallTrend === "declining" ? ArrowDownRight : suggestion.overallTrend === "insufficient_data" ? Search : Minus;
                const trendColor = suggestion.overallTrend === "improving" ? "var(--color-accent-green)" : suggestion.overallTrend === "declining" ? "var(--color-accent-red)" : "var(--color-text-muted)";
                return (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="rounded-2xl p-4" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--color-primary-light)" }}>
                          <Lightbulb size={17} style={{ color: "var(--color-primary)" }} />
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-(--color-text-strong) m-0 mb-1">Seans Verisi Analizi</h3>
                          <p className="text-(--color-text-soft) text-xs m-0 leading-relaxed">{suggestion.performanceSummary}</p>
                        </div>
                      </div>
                    </div>

                    {/* Overall trend */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${trendColor} 13%, transparent)` }}>
                        <TrendIcon size={16} style={{ color: trendColor }} />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider m-0 text-(--color-text-muted)">Genel Trend</p>
                        <p className="text-sm font-semibold text-(--color-text-strong) m-0">
                          {suggestion.overallTrend === "improving" ? "Gelişme görülüyor" : suggestion.overallTrend === "declining" ? "Düşüş var — ek destek öneriliyor" : suggestion.overallTrend === "insufficient_data" ? "Yeterli veri bekleniyor" : "Stabil seyir"}
                        </p>
                      </div>
                    </div>

                    {/* Strengths */}
                    {suggestion.strengths.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--color-accent-green)" }}><Check size={12} /> Güçlü Alanlar</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {suggestion.strengths.map(s => (
                            <div key={s.gameKey} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                              <span className="w-1.5 h-8 rounded-full shrink-0" style={{ background: "var(--color-accent-green)" }} />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-(--color-text-strong)">{s.label}</span>
                                <span className="text-[11px] text-(--color-text-muted) ml-2">{s.trend === "improving" ? "gelişiyor" : "stabil"}</span>
                              </div>
                              <span className="numeral text-sm font-bold" style={{ color: "var(--color-accent-green)" }}>~{s.last3Avg}p</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attention areas */}
                    {suggestion.attentionAreas.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--color-signal)" }}><Target size={12} /> Dikkat Gereken Alanlar</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {suggestion.attentionAreas.map(a => (
                            <div key={a.gameKey} className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl" style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                              <span className="w-1.5 h-8 rounded-full shrink-0" style={{ background: "var(--color-signal)" }} />
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-(--color-text-strong) block">{a.label}</span>
                                <span className="text-[11px] text-(--color-text-muted)">{a.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended session set */}
                    {suggestion.recommendedSet.length > 0 && (
                      <div className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="px-4 py-3 border-b border-(--color-line)">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) m-0">Önerilen Seans Seti</p>
                        </div>
                        <div className="p-4 space-y-2">
                          {suggestion.recommendedSet.map((k, i) => (
                            <div key={k} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "var(--color-surface-elevated)" }}>
                              <span className="numeral w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{i + 1}</span>
                              <span className="text-xs font-semibold text-(--color-text-strong)">{GAME_LABELS[k]}</span>
                            </div>
                          ))}
                          <button type="button"
                            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs border-none cursor-pointer transition-opacity hover:opacity-90"
                            style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
                            onClick={() => {
                              startCustomSessionSet("Öneri seti", suggestion.recommendedSet);
                              setActiveAppView("games");
                            }}>
                            <Play size={13} /> Bu Seti Oyna
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Protocol recommendation */}
                    {suggestion.protocolName && (
                      <div className="px-4 py-3.5 rounded-2xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) m-0 mb-1.5">Protokol Önerisi</p>
                        <p className="text-sm font-bold text-(--color-text-strong) m-0 mb-1">{suggestion.protocolName}</p>
                        <p className="text-xs text-(--color-text-muted) m-0">Danışanın hedefleriyle eşleşen hazır protokol şablonu.</p>
                        <button type="button"
                          onClick={() => { setActiveAppView("therapy-program"); setTpActiveTab("protocols"); }}
                          className="mt-2.5 text-xs font-bold cursor-pointer border-none bg-transparent p-0 underline"
                          style={{ color: "var(--color-primary)" }}>
                          Protokolleri Görüntüle →
                        </button>
                      </div>
                    )}

                    {/* SOAP draft */}
                    <div className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="px-4 py-3 border-b border-(--color-line)">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) m-0">Otomatik SOAP Taslağı</p>
                      </div>
                      <div className="p-4 space-y-3">
                        {(["s", "o", "a", "p"] as const).map(key => (
                          <div key={key}>
                            <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: "var(--color-primary)" }}>
                              {key === "s" ? "S — Subjektif" : key === "o" ? "O — Objektif" : key === "a" ? "A — Analiz" : "P — Plan"}
                            </span>
                            <p className="text-xs text-(--color-text-soft) m-0 leading-relaxed">{suggestion.soapDraft[key]}</p>
                          </div>
                        ))}
                        <button type="button"
                          onClick={() => {
                            const s = suggestion.soapDraft;
                            const text = `S: ${s.s}\n\nO: ${s.o}\n\nA: ${s.a}\n\nP: ${s.p}`;
                            setNoteForm({ date: getTodayString(), content: text });
                            setNoteMode("free");
                            setClientDetailTab("notes");
                            setShowNoteForm(true);
                          }}
                          className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs border cursor-pointer transition-all hover:opacity-80"
                          style={{ background: "transparent", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }}>
                          Not Olarak Kaydet
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          );
        })()}

        {/* ── Games View ── */}
        {activeAppView === "games" && (
          <div className="flex flex-col flex-1 min-h-0">

            {/* ── Session Set Summary Overlay ── */}
            {sessionSet?.phase === "finished" && (
              <SessionSetSummary
                sessionSet={sessionSet}
                onClose={() => setSessionSet(null)}
                onNewSet={() => { setSessionSet(null); setShowSessionSetPicker(true); }}
              />
            )}

            {/* ── Premium Desktop Game Header ── */}
            <div className="hidden lg:flex items-center justify-between px-6 h-16 border-b border-(--color-line) sticky top-0 z-20" style={{
              background: "var(--color-chrome-header)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 1px 0 var(--color-line), 0 4px 24px rgba(0,0,0,0.08)",
            }}>
              {/* Left: title + session info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), #2a72ac)", boxShadow: "0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent)" }}>
                    <Gamepad2 size={15} className="text-white" />
                  </div>
                  <span className="font-bold text-(--color-text-strong) text-sm tracking-tight">Oyun Alanı</span>
                </div>
                <div className="w-px h-5 shrink-0" style={{ background: "var(--color-line)" }} />
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: gameElapsed > 0 ? "rgba(63, 125, 79,0.08)" : "color-mix(in srgb, var(--color-primary) 8%, transparent)", border: gameElapsed > 0 ? "1px solid rgba(63, 125, 79,0.25)" : "1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)" }}>
                  <span className="w-2 h-2 rounded-full shrink-0 transition-all" style={{ background: gameElapsed > 0 ? "#3f7d4f" : "var(--color-primary)", boxShadow: gameElapsed > 0 ? "0 0 6px rgba(63, 125, 79,0.7)" : "none" }} />
                  <span className="text-xs font-semibold max-w-56 truncate" style={{ color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-primary)" }}>
                    {activeTherapist?.displayName ?? "—"}&nbsp;·&nbsp;{activeClient?.displayName ?? "Danışan seç"}
                  </span>
                </div>
                {activeClient && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: `${DIFFICULTY_COLORS[clientDiffLevel]}18`, color: DIFFICULTY_COLORS[clientDiffLevel], border: `1px solid ${DIFFICULTY_COLORS[clientDiffLevel]}33` }}>
                    {DIFFICULTY_LABELS[clientDiffLevel]}
                  </span>
                )}
                {/* Active goal HUD */}
                {activeClient && clientGoals.length > 0 && (() => {
                  const topGoal = clientGoals.find(g => g.currentValue < g.targetValue) ?? clientGoals[0];
                  const pct = topGoal.targetValue > 0 ? Math.round((topGoal.currentValue / topGoal.targetValue) * 100) : 0;
                  return (
                    <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full border max-w-48"
                      style={{ background: "rgba(29, 90, 140,0.08)", borderColor: "rgba(29, 90, 140,0.2)" }}>
                      <Target size={10} style={{ color: "#4a95cc", flexShrink: 0 }} />
                      <span className="text-[10px] font-semibold truncate" style={{ color: "var(--color-text-soft)" }}>{topGoal.title}</span>
                      <span className="text-[10px] font-extrabold shrink-0" style={{ color: "#4a95cc" }}>{pct}%</span>
                    </div>
                  );
                })()}
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${platformStatus === "online" ? "bg-[#3f7d4f]/10 text-[#6fb87f] border-[#3f7d4f]/20" : platformStatus === "schema_missing" ? "bg-[#b8763a]/10 text-[#dda05e] border-[#b8763a]/20" : platformStatus === "error" ? "bg-[#a8392c]/10 text-[#e2705f] border-[#a8392c]/20" : "bg-(--color-surface-elevated) text-(--color-text-muted) border-(--color-line)"}`}>
                  {getDatabaseStatusLabel(platformStatus)}
                </span>
              </div>
              {/* Right: timer + back */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-2xl px-3 py-1.5 border" style={{
                  background: gameElapsed > 0 ? "rgba(63, 125, 79,0.08)" : "var(--color-surface-strong)",
                  borderColor: gameElapsed > 0 ? "rgba(63, 125, 79,0.25)" : "var(--color-line)",
                }}>
                  <Clock size={13} style={{ color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-primary)" }} />
                  <span className="font-mono font-bold text-sm tabular-nums" style={{ color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-text-strong)", letterSpacing: "-0.02em" }}>{formatElapsed(gameElapsed)}</span>
                  <button type="button" className="text-[11px] font-semibold hover:opacity-70 bg-transparent border-none cursor-pointer ml-0.5 transition-opacity" style={{ color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-primary)" }} onClick={resetSessionClock}>Sıfırla</button>
                </div>
                <button type="button" className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border cursor-pointer transition-all hover:opacity-80" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }} onClick={() => setActiveAppView("dashboard")}>
                  ← Panel
                </button>
              </div>
            </div>

            {/* ── Session duration warning banner ── */}
            {gameElapsed > 0 && !sessionWarningDismissed && gameElapsed >= sessionWarnThreshold * 60 && (
              <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-b" style={{ background: "rgba(184, 118, 58,0.1)", borderColor: "rgba(184, 118, 58,0.25)" }}>
                <Timer size={14} style={{ color: "#b8763a", flexShrink: 0 }} />
                <p className="flex-1 text-xs font-semibold m-0" style={{ color: "#b8763a" }}>
                  ⏱ {sessionWarnThreshold} dakika geçti — seans sona yaklaşıyor
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {([30, 45, 60] as const).map(t => (
                    <button key={t} type="button"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80"
                      style={{ background: t === sessionWarnThreshold ? "rgba(184, 118, 58,0.2)" : "transparent", borderColor: "rgba(184, 118, 58,0.3)", color: "#b8763a" }}
                      onClick={() => { setSessionWarnThreshold(t); try { localStorage.setItem("mimio-session-warn-min", String(t)); } catch { /* ignore */ } }}>
                      {t}dk
                    </button>
                  ))}
                  <button type="button" className="text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80" style={{ borderColor: "rgba(184, 118, 58,0.3)", color: "#b8763a" }} onClick={() => setSessionWarningDismissed(true)}>
                    Kapat
                  </button>
                </div>
              </div>
            )}

            {/* ── Game suggestion HUD ── */}
            {activeClient && (() => {
              const clientSess = platformOverview.recentSessions.filter(s => s.clientId === activeClient.id);
              if (clientSess.length < 3) return null;
              // Find weakest game (lowest avg score among played games)
              const gameAvgs: { key: string; avg: number; plays: number }[] = Object.entries(
                clientSess.reduce<Record<string, { sum: number; count: number }>>((acc, s) => {
                  if (!acc[s.gameKey]) acc[s.gameKey] = { sum: 0, count: 0 };
                  acc[s.gameKey].sum += s.score;
                  acc[s.gameKey].count++;
                  return acc;
                }, {})
              ).map(([key, { sum, count }]) => ({ key, avg: Math.round(sum / count), plays: count }));
              const weakest = gameAvgs.length > 0 ? gameAvgs.slice().sort((a, b) => a.avg - b.avg)[0] : null;
              if (!weakest || weakest.key === activeGame) return null;
              const suggestedLabel = GAME_LABELS[weakest.key as PlatformGameKey] ?? weakest.key;
              return (
                <div className="flex items-center gap-2.5 px-4 py-2 shrink-0 border-b" style={{ background: "rgba(29, 90, 140,0.07)", borderColor: "rgba(29, 90, 140,0.15)" }}>
                  <Lightbulb size={14} className="shrink-0 text-(--color-text-muted)" />
                  <p className="flex-1 text-xs text-(--color-text-soft) m-0">
                    <strong style={{ color: "#4a95cc" }}>{activeClient.displayName}</strong> için öneri:{" "}
                    <span style={{ color: "#4a95cc" }}>{suggestedLabel}</span> oynanmamış / en düşük skor ({weakest.avg} ort.)
                  </p>
                  <button type="button"
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border-none cursor-pointer shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: "rgba(29, 90, 140,0.2)", color: "#4a95cc" }}
                    onClick={() => setActiveGame(weakest.key as PlatformGameKey)}>
                    Geç →
                  </button>
                </div>
              );
            })()}

            {/* ── Mobile game nav ── */}
            <div className="flex md:hidden flex-col gap-1.5 px-3 py-2.5 border-b border-(--color-line) shrink-0" style={{ background: "var(--color-chrome-header)", backdropFilter: "blur(20px)" }}>
              {/* Row 1: selectors + timer */}
              <div className="flex items-center gap-1.5">
                <select value={activeTherapist?.id ?? ""} onChange={(event) => setActiveTherapistId(event.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-(--color-line) rounded-lg bg-(--color-surface-strong) text-(--color-text-body) min-w-0">
                  {therapistOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                </select>
                <select value={activeClient?.id ?? ""} onChange={(event) => setActiveClientId(event.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-(--color-line) rounded-lg bg-(--color-surface-strong) text-(--color-text-body) min-w-0">
                  {clientOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                </select>
                <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 border shrink-0" style={{ background: gameElapsed > 0 ? "rgba(63, 125, 79,0.1)" : "var(--color-surface-strong)", borderColor: gameElapsed > 0 ? "rgba(63, 125, 79,0.3)" : "var(--color-line)" }}>
                  <Clock size={10} style={{ color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-text-muted)" }} />
                  <span className="font-mono font-bold text-xs tabular-nums" style={{ color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-text-strong)" }}>{formatElapsed(gameElapsed)}</span>
                  <button type="button" className="hover:opacity-70 bg-transparent border-none cursor-pointer ml-0.5 transition-opacity" style={{ color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-primary)" }} onClick={resetSessionClock}><RotateCcw size={9} /></button>
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
                    style={activeGame === tab.key ? { background: "rgba(29, 90, 140,0.1)" } : {}}
                    onClick={() => setActiveGame(tab.key)}>
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* ── Premium Game Sidebar ── */}
              <aside className="hidden md:flex flex-col w-56 lg:w-72 shrink-0 border-r border-(--color-line) overflow-y-auto" style={{ background: "var(--color-sidebar)", backdropFilter: "blur(24px)" }}>

                {/* Session card */}
                <div className="p-3 lg:p-4 border-b border-(--color-line) space-y-2.5 lg:space-y-3">
                  {/* Status indicator */}
                  <div className="rounded-xl lg:rounded-2xl p-3 lg:p-3.5 relative overflow-hidden" style={{
                    background: gameElapsed > 0 ? "linear-gradient(135deg, rgba(63, 125, 79,0.12) 0%, rgba(63, 125, 79,0.04) 100%)" : "linear-gradient(135deg, rgba(29, 90, 140,0.08) 0%, rgba(29, 90, 140,0.02) 100%)",
                    border: gameElapsed > 0 ? "1px solid rgba(63, 125, 79,0.25)" : "1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)",
                  }}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none" style={{ background: gameElapsed > 0 ? "#3f7d4f" : "var(--color-primary)", opacity: 0.06, filter: "blur(20px)", transform: "translate(30%,-30%)" }} />
                    <div className="relative flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: gameElapsed > 0 ? "#3f7d4f" : "#65788a", boxShadow: gameElapsed > 0 ? "0 0 8px rgba(63, 125, 79,0.8)" : "none" }} />
                        <span className="text-xs font-bold" style={{ color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-text-muted)" }}>
                          {gameElapsed > 0 ? "Seans Aktif" : "Seans Bekliyor"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs tabular-nums" style={{ background: gameElapsed > 0 ? "rgba(63, 125, 79,0.15)" : "rgba(255,255,255,0.04)", color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-text-muted)" }}>
                        <Clock size={10} />
                        {formatElapsed(gameElapsed)}
                      </div>
                    </div>
                    {activeClient && (
                      <div className="relative flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0" style={{ background: gameElapsed > 0 ? "rgba(63, 125, 79,0.2)" : "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: gameElapsed > 0 ? "#3f7d4f" : "var(--color-primary)" }}>
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
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-(--color-text-muted) font-extrabold uppercase tracking-widest">Danışan</span>
                      {/* Quick client avatar row */}
                      {clientOptions.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {clientOptions.slice(0, 6).map((c, i) => {
                            const isActive = c.id === (activeClient?.id ?? "");
                            const colors = ["#4a95cc","#6fb87f","#b8763a","#8ba0b0","#4a95cc","#b8503f"];
                            const col = colors[i % colors.length];
                            return (
                              <button key={c.id} type="button" title={c.displayName}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-extrabold text-white cursor-pointer border-2 transition-all hover:scale-110"
                                style={{ background: isActive ? col : `${col}30`, borderColor: isActive ? col : "transparent", color: isActive ? "#fff" : col }}
                                onClick={() => setActiveClientId(c.id)}>
                                {c.displayName[0]?.toUpperCase()}
                              </button>
                            );
                          })}
                          {clientOptions.length > 6 && (
                            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
                              +{clientOptions.length - 6}
                            </span>
                          )}
                        </div>
                      )}
                      <select value={activeClient?.id ?? ""} onChange={(event) => setActiveClientId(event.target.value)} className={inputCls}>
                        {clientOptions.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* CTA */}
                  <button type="button" className="w-full flex items-center justify-center gap-2 font-bold text-sm px-4 py-2.5 rounded-2xl text-white cursor-pointer border-none transition-all hover:opacity-90 active:scale-[0.98]" style={{ background: gameElapsed > 0 ? "var(--color-accent-green)" : "var(--color-primary)", boxShadow: "var(--shadow-sm)" }} onClick={resetSessionClock}>
                    {gameElapsed > 0 ? <RotateCcw size={14} /> : <Play size={14} />}
                    {gameElapsed > 0 ? "Yeni Seans" : "Seansı Başlat"}
                  </button>

                  {/* Session Set trigger */}
                  {sessionSet?.phase === "running" ? (
                    <div className="rounded-2xl p-3" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line-strong)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-primary)">Seri Aktif</span>
                        <button type="button" onClick={() => setSessionSet(null)} className="text-(--color-text-muted) hover:text-(--color-text-body) text-xs font-bold cursor-pointer border-none bg-transparent" title="Seriyi iptal et">✕</button>
                      </div>
                      <p className="text-(--color-text-strong) text-sm font-semibold m-0 mb-2.5">{sessionSet.presetLabel}</p>
                      <div className="flex gap-1">
                        {sessionSet.games.map((g, i) => (
                          <div key={g} className="flex-1 h-1.5 rounded-full" style={{ background: i < sessionSet.entries.length ? "var(--color-accent-green)" : i === sessionSet.currentIndex ? "var(--color-primary)" : "var(--color-line-strong)" }} />
                        ))}
                      </div>
                      <p className="text-(--color-text-muted) text-[11px] mt-2 m-0"><span className="numeral">{sessionSet.entries.length}/{sessionSet.games.length}</span> tamamlandı</p>
                    </div>
                  ) : (
                    <button type="button"
                      onClick={() => setShowSessionSetPicker(prev => !prev)}
                      className="w-full flex items-center justify-center gap-2 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer border transition-colors hover:bg-(--color-surface-elevated)"
                      style={{ background: "transparent", borderColor: "var(--color-line-strong)", color: "var(--color-primary)" }}>
                      <Zap size={13} /> Seri Modu
                    </button>
                  )}

                  {/* Session Set preset picker */}
                  {showSessionSetPicker && !sessionSet && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(29, 90, 140,0.2)", background: "var(--color-surface-elevated)" }}>
                      <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--color-line)" }}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">Set Seç</span>
                      </div>
                      <div className="p-2 space-y-1">
                        {SESSION_SET_PRESETS.map(preset => (
                          <button key={preset.id} type="button"
                            onClick={() => startSessionSet(preset)}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer border-none transition-colors hover:bg-(--color-surface-elevated) text-left">
                            <span className="text-base shrink-0">{preset.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-(--color-text-strong) block truncate">{preset.label}</span>
                              <span className="text-[10px] text-(--color-text-muted)">{preset.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Oyun listesi — kategoriler ayrı bir blok değil, listenin başlıkları.
                    Böylece yedi oyunun tamamı kaydırma olmadan görünür. */}
                <div className="p-3 lg:p-4 border-b border-(--color-line)">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted) block mb-2 px-1">Oyunlar</span>
                  {(() => {
                    const thisWeekPlan = allWeeklyPlans.find(p => p.clientId === (activeClient?.id ?? "") && p.weekStartDate === getWeekStart());
                    const plannedGameKeys = new Set(
                      thisWeekPlan ? Object.values(thisWeekPlan.days).flat().map(e => e.gameKey) : []
                    );
                    return (
                      <div className="flex flex-col gap-2">
                        {GAME_CATEGORIES.map((category) => {
                          const tabs = GAME_TABS.filter((tab) => tab.category === category.key);
                          if (tabs.length === 0) return null;
                          const CatIcon = CATEGORY_ICONS[category.key];
                          return (
                            <div key={category.key} className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 px-1 pt-1">
                                <CatIcon size={11} className="text-(--color-text-muted) shrink-0" />
                                <span className="text-[10px] font-bold text-(--color-text-muted) truncate">{category.title}</span>
                              </div>
                              {tabs.map((tab) => {
                                const isActive = activeGame === tab.key;
                                const isPlanned = plannedGameKeys.has(tab.key as PlatformGameKey);
                                const best = scoreboard[tab.key].best;
                                return (
                                  /*
                                    Aktif oyun dolu bir kapsülle işaretlenir.
                                    Önceki hâlde yalnızca ince bir çubuk ve
                                    renk değişimi vardı; hangi oyunda olduğun
                                    listeye bakınca anlaşılmıyordu.
                                  */
                                  <button key={tab.key} type="button" aria-pressed={isActive}
                                    className="relative flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl cursor-pointer w-full text-left transition-colors"
                                    style={{
                                      background: isActive ? "var(--color-primary)" : "transparent",
                                      boxShadow: isActive ? "var(--shadow-sm)" : "none",
                                    }}
                                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--color-surface-elevated)"; }}
                                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                                    onClick={() => setActiveGame(tab.key)}>
                                    <span className="text-[13px] truncate flex-1"
                                      style={{
                                        color: isActive ? "var(--color-text-inverse)" : "var(--color-text-body)",
                                        fontWeight: isActive ? 700 : 500,
                                      }}>{tab.title}</span>
                                    {isPlanned && <CalendarDays size={10} className="shrink-0 text-(--color-text-muted)" aria-label="Bu haftanın planında" />}
                                    {best > 0 && (
                                      <span className="numeral shrink-0 text-[11px] font-bold"
                                        style={{ color: isActive ? "var(--color-text-inverse)" : "var(--color-text-muted)", opacity: isActive ? 0.8 : 1 }}>{best}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Score summary */}
                <div className="p-3 lg:p-4 border-b border-(--color-line)">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted) block mb-2 lg:mb-3 px-1">Skor Özeti</span>
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
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: card.best > 0 ? `${Math.min(100, card.best)}%` : "0%", background: "linear-gradient(90deg, var(--color-primary), #2a72ac)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sessions */}
                {recentSessionFeed.length > 0 && (
                  <div className="p-3 lg:p-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-(--color-text-muted) block mb-2 lg:mb-3 px-1">Son Oturumlar</span>
                    <div className="flex flex-col gap-2">
                      {recentSessionFeed.slice(0, 3).map((session) => (
                        <div key={session.id}
                          data-tooltip={`${session.clientName} · Skor: ${session.score}`}
                          data-tooltip-dir="right"
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 border border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-extrabold" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" }}>
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

              <section className="relative flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: "var(--color-page-bg)" }}>

                {/* ── Float Score Overlay ── */}
                {floatScores.map(fs => (
                  <span
                    key={fs.id}
                    className={`score-pop${fs.correct ? "" : " negative"}`}
                    style={{ left: "50%", top: "28%", transform: "translateX(-50%)" }}
                  >
                    {fs.correct ? `+${fs.value}` : `-${Math.abs(fs.value)}`}
                  </span>
                ))}

                {/* ── Combo Milestone Badge ── */}
                {lastFeedback && lastFeedback.combo >= 3 && (
                  <div
                    className="combo-badge-enter"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "20%",
                      transform: "translateX(-50%)",
                      zIndex: 50,
                      pointerEvents: "none",
                      padding: "6px 16px",
                      borderRadius: "999px",
                      background: lastFeedback.combo >= 8 ? "linear-gradient(90deg,#a8392c,#b8763a)" : lastFeedback.combo >= 5 ? "linear-gradient(90deg,#b8763a,#4a95cc)" : "linear-gradient(90deg,#1d5a8c,#3f7d4f)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      letterSpacing: "0.03em",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lastFeedback.combo >= 8 ? "💥" : lastFeedback.combo >= 5 ? "⚡" : "🔥"} {lastFeedback.combo}x Seri!
                  </div>
                )}

              {(() => {
                const gameBtn = "flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-2xl transition-all cursor-pointer border-none active:scale-95";
                const gameBtnSec = "flex items-center gap-2 text-white/80 text-sm font-semibold px-6 py-3 rounded-2xl transition-colors cursor-pointer border border-white/25 hover:border-white/45 hover:text-white";
                /* Geri bildirim yönergesi, faz yönergesinin önüne geçer. */
                const fbCue = lastFeedback ? feedbackCue(lastFeedback.correct, lastFeedback.combo) : null;
                const withFeedback = (base: GameCue): GameCue => fbCue ?? base;
                const elapsedLabel = `${Math.floor(gameElapsed / 60)}:${String(gameElapsed % 60).padStart(2, "0")}`;
                return (
              <div className="flex-1 min-h-0 flex flex-col px-3 pt-4 pb-3 lg:px-5 lg:pt-6 lg:pb-4">
                {activeGame === "memory" && (() => {
                  const cue = withFeedback(memoryCue(memoryState.phase, memoryState.sequence.length));
                  return (
                  <GameArena
                    name={activeTab.title}
                    kicker={activeTab.kicker}
                    accent="#8ba0b0"
                    cue={cue.title}
                    cueNote={cue.note}
                    cueState={cue.state}
                    hint={ARENA_KEYBOARD_HINT}
                    stats={[
                      { label: "Seri", value: memoryState.score, tone: "accent" },
                      { label: "Uzunluk", value: memoryState.sequence.length || "—" },
                      { label: "En iyi", value: scoreboard.memory.best || "—", optional: true },
                      { label: "Süre", value: elapsedLabel, optional: true },
                    ]}
                    primaryAction={{
                      label: memoryState.phase === "idle" ? "Başlat" : "Yeniden başlat",
                      onClick: startMemoryGame,
                    }}
                    secondaryAction={{
                      label: "Sırayı tekrar göster",
                      onClick: replayMemorySequence,
                      disabled: memoryState.sequence.length === 0 || memoryState.phase === "showing",
                    }}
                    overlay={memoryState.phase === "finished" ? (() => {
                      const s = memoryState.score;
                      const memStars = s >= 6 ? 3 : s >= 3 ? 2 : s >= 1 ? 1 : 0;
                      return (
                        <GameResultOverlay
                          accent="#8ba0b0"
                          gradFrom="#8ba0b0"
                          gradTo="#2a72ac"
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
                          onSatisfaction={handleSaveSatisfaction}
                          hasActiveClient={!!activeClient}
                          durationSeconds={Math.max(30, Math.round((Date.now() - sessionStartedAt) / 1000))}
                          sessionAvg={(() => { const gs = platformOverview.recentSessions.filter(s => s.gameKey === activeGame && s.clientId === (activeClient?.id ?? "")); return gs.length > 0 ? Math.round(gs.reduce((a, s) => a + s.score, 0) / gs.length) : 0; })()}
                          nextInSet={sessionSetNextInSet}
                        />
                      );
                    })() : null}
                  >
                    {/* Girilen adımlar — danışan diziyi nereye kadar tekrarladığını görür */}
                    {memoryState.sequence.length > 0 && (
                      <div className="flex items-center gap-1.5" aria-hidden="true">
                        {memoryState.sequence.map((_, index) => (
                          <span key={index} className="rounded-full transition-all duration-200"
                            style={{
                              width: index < memoryState.input.length ? 22 : 8,
                              height: 8,
                              background: index < memoryState.input.length ? "#8ba0b0" : "rgba(255,255,255,0.16)",
                            }} />
                        ))}
                      </div>
                    )}
                    <div className="arena-grid" style={{ ["--cols" as string]: 3, ["--rows" as string]: 2, ["--reserve" as string]: "32px" }}>
                      {MEMORY_TILES.map((label, index) => {
                        const isActive = memoryState.flashIndex === index;
                        const isLocked = memoryState.phase === "showing" || memoryState.phase === "idle";
                        const isCursor = memoryCursor === index;
                        const symbol = SYMBOL_LIBRARY.find((s) => s.label === label);
                        return (
                          <button key={label} type="button"
                            className={`arena-cell ${isActive ? "game-tile-active" : ""} ${isCursor ? "game-tile-cursor" : ""}`}
                            disabled={isLocked} onClick={() => handleMemoryPick(index)}
                            style={!isActive ? { background: symbol?.background } as CSSProperties : undefined}
                            aria-label={`${label} karesi${isActive ? " — yanıyor" : ""}`}>
                            {!isActive && <div className="absolute inset-0" style={symbol ? patternStyle(symbol) : undefined} />}
                            <span className="relative arena-cell-glyph" style={!isActive ? { color: symbol?.accent } : undefined}>{symbol?.icon ?? label[0]}</span>
                            <span className="relative arena-cell-label">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </GameArena>
                  );
                })()}

                {activeGame === "pairs" && (() => {
                  const openCount = pairsState.tiles.filter((t) => t.revealed && !t.matched).length;
                  const totalPairs = pairsState.tiles.length / 2 || TOTAL_PAIR_MATCHES;
                  const cue = pairsCue(pairsState.phase, openCount, totalPairs, pairsState.pairsFound);
                  return (
                  <GameArena
                    name={activeTab.title}
                    kicker={activeTab.kicker}
                    accent="#8ba0b0"
                    boardSize="wide"
                    cue={cue.title}
                    cueNote={cue.note}
                    cueState={cue.state}
                    hint={ARENA_KEYBOARD_HINT}
                    progress={pairsState.phase === "playing" ? { current: pairsState.pairsFound, total: totalPairs } : undefined}
                    stats={[
                      { label: "Çift", value: `${pairsState.pairsFound}/${totalPairs}`, tone: "accent" },
                      { label: "Hamle", value: pairsState.moves },
                      { label: "Süre", value: elapsedLabel, optional: true },
                    ]}
                    primaryAction={{
                      label: pairsState.phase === "idle" ? "Başlat" : "Yeni deste",
                      onClick: startPairsGame,
                    }}
                    overlay={pairsState.phase === "finished" ? (() => {
                      const mv = pairsState.moves;
                      const pairsStars = mv <= 12 ? 3 : mv <= 18 ? 2 : 1;
                      const pairsScore = Math.max(50, 280 - mv * 7);
                      return (
                        <GameResultOverlay
                          accent="#9db0be"
                          gradFrom="#9db0be"
                          gradTo="#4a95cc"
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
                          onSatisfaction={handleSaveSatisfaction}
                          hasActiveClient={!!activeClient}
                          durationSeconds={Math.max(30, Math.round((Date.now() - sessionStartedAt) / 1000))}
                          sessionAvg={(() => { const gs = platformOverview.recentSessions.filter(s => s.gameKey === activeGame && s.clientId === (activeClient?.id ?? "")); return gs.length > 0 ? Math.round(gs.reduce((a, s) => a + s.score, 0) / gs.length) : 0; })()}
                          nextInSet={sessionSetNextInSet}
                        />
                      );
                    })() : null}
                  >
                    {pairsState.tiles.length === 0 ? (
                      <p className="text-sm text-white/60 m-0">Deste henüz açılmadı.</p>
                    ) : (
                    <div className="arena-grid" style={{ ["--cols" as string]: 4, ["--rows" as string]: Math.ceil(pairsState.tiles.length / 4) }}>
                      {pairsState.tiles.map((tile, index) => {
                        const isCursor = pairsCursor === index;
                        const isVisible = tile.revealed || tile.matched;
                        return (
                          <button key={tile.id} type="button" data-pairs-index={index}
                            aria-label={isVisible ? `${tile.label} kartı` : `Kapalı kart ${index + 1}`}
                            className={`arena-cell ${tile.matched ? "game-tile-matched" : ""} ${isCursor ? "game-tile-cursor" : ""}`}
                            onClick={() => handlePairsPick(index)}
                            style={isVisible && !tile.matched ? { background: tile.background } : { background: "rgba(13,19,17,0.92)" }}>
                            <div className="absolute inset-0" style={patternStyle(isVisible ? tile : { pattern: "grid" } as typeof tile)} />
                            {isVisible ? (
                              <>
                                <span className="relative arena-cell-glyph" style={{ color: tile.accent }}>{tile.icon}</span>
                                <span className="relative arena-cell-label">{tile.label}</span>
                              </>
                            ) : (
                              <span className="relative arena-cell-glyph text-white/25">?</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </GameArena>
                  );
                })()}

                {activeGame === "pulse" && (() => {
                  const cue = withFeedback(pulseCue(pulseState.phase, pulseState.activeIndex !== null));
                  const accuracy = pulseState.hits + pulseState.misses > 0
                    ? Math.round((pulseState.hits / (pulseState.hits + pulseState.misses)) * 100)
                    : 0;
                  return (
                  <GameArena
                    name={activeTab.title}
                    kicker={activeTab.kicker}
                    accent="#8ba0b0"
                    cue={cue.title}
                    cueNote={cue.note}
                    cueState={cue.state}
                    hint={ARENA_KEYBOARD_HINT}
                    progress={pulseState.phase === "playing" ? { current: pulseState.round, total: PULSE_TOTAL_ROUNDS } : undefined}
                    stats={[
                      { label: "Puan", value: pulseState.points, tone: "accent" },
                      { label: "Tur", value: `${pulseState.round}/${PULSE_TOTAL_ROUNDS}` },
                      { label: "Seri", value: pulseState.combo },
                      { label: "İsabet", value: `%${accuracy}`, optional: true },
                    ]}
                    primaryAction={{
                      label: pulseState.phase === "idle" ? "Başlat" : "Yeniden başlat",
                      onClick: startPulseGame,
                    }}
                    overlay={pulseState.phase === "finished" ? (() => {
                      const pts = pulseState.points;
                      const pulseStars = pts >= 130 ? 3 : pts >= 80 ? 2 : 1;
                      return (
                        <GameResultOverlay
                          accent="#8ba0b0"
                          gradFrom="#8ba0b0"
                          gradTo="#4a95cc"
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
                          onSatisfaction={handleSaveSatisfaction}
                          hasActiveClient={!!activeClient}
                          durationSeconds={Math.max(30, Math.round((Date.now() - sessionStartedAt) / 1000))}
                          sessionAvg={(() => { const gs = platformOverview.recentSessions.filter(s => s.gameKey === activeGame && s.clientId === (activeClient?.id ?? "")); return gs.length > 0 ? Math.round(gs.reduce((a, s) => a + s.score, 0) / gs.length) : 0; })()}
                          nextInSet={sessionSetNextInSet}
                        />
                      );
                    })() : null}
                  >
                    <div className="arena-grid" style={{ ["--cols" as string]: 3, ["--rows" as string]: 3 }}>
                      {PULSE_LABELS.map((label, index) => {
                        const isActive = pulseState.activeIndex === index && pulseState.phase === "playing";
                        const isCursor = pulseCursor === index;
                        const wasJustPicked = lastFeedback && activeGame === "pulse" && !isActive && pulseState.activeIndex !== index && index === pulseCursor;
                        return (
                          <button key={label} type="button"
                            aria-label={`${label} karesi${isActive ? " — hedef" : ""}`}
                            className={`arena-cell
                              ${isActive ? "game-tile-active" : ""}
                              ${isCursor ? "game-tile-cursor" : ""}
                              ${wasJustPicked && lastFeedback?.correct ? "correct-glow" : ""}
                              ${wasJustPicked && !lastFeedback?.correct ? "wrong-shake" : ""}`}
                            style={!isActive ? { background: "rgba(13,20,18,0.9)" } : undefined}
                            onClick={() => handlePulsePick(index)}>
                            <span className="arena-cell-label">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </GameArena>
                  );
                })()}

                {activeGame === "route" && (() => {
                  const cue = withFeedback(routeCue(routeState.phase, routeCommandMeta?.label ?? null));
                  return (
                  <GameArena
                    name={activeTab.title}
                    kicker={activeTab.kicker}
                    accent="#4a95cc"
                    cue={cue.title}
                    cueNote={cue.note}
                    cueState={cue.state}
                    hint={ARENA_KEYBOARD_HINT}
                    progress={routeState.phase === "playing" ? { current: routeState.round, total: ROUTE_TOTAL_ROUNDS } : undefined}
                    stats={[
                      { label: "Puan", value: routeState.score, tone: "accent" },
                      { label: "Tur", value: `${routeState.round}/${ROUTE_TOTAL_ROUNDS}` },
                      { label: "Seri", value: routeState.streak },
                      { label: "Süre", value: elapsedLabel, optional: true },
                    ]}
                    primaryAction={{
                      label: routeState.phase === "idle" ? "Başlat" : "Yeniden başlat",
                      onClick: startRouteGame,
                    }}
                    overlay={routeState.phase === "finished" ? (() => {
                      const rs = routeState.score;
                      const routeStars = rs >= 140 ? 3 : rs >= 80 ? 2 : 1;
                      return (
                        <GameResultOverlay
                          accent="#9db0be"
                          gradFrom="#9db0be"
                          gradTo="#1d5a8c"
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
                          onSatisfaction={handleSaveSatisfaction}
                          hasActiveClient={!!activeClient}
                          durationSeconds={Math.max(30, Math.round((Date.now() - sessionStartedAt) / 1000))}
                          sessionAvg={(() => { const gs = platformOverview.recentSessions.filter(s => s.gameKey === activeGame && s.clientId === (activeClient?.id ?? "")); return gs.length > 0 ? Math.round(gs.reduce((a, s) => a + s.score, 0) / gs.length) : 0; })()}
                          nextInSet={sessionSetNextInSet}
                        />
                      );
                    })() : null}
                  >
                    {/* Komut kartı — okunması gereken tek şey */}
                    <div className={`flex flex-col items-center justify-center rounded-2xl px-10 py-4 border w-full max-w-xs transition-all ${lastFeedback && activeGame === "route" ? (lastFeedback.correct ? "correct-glow" : "wrong-shake") : ""}`}
                      style={{ background: "rgba(13,20,18,0.92)", borderColor: "rgba(74, 149, 204,0.28)" }}>
                      <span className="text-6xl leading-none" style={{ color: "#4a95cc" }}>{routeCommandMeta?.icon ?? "•"}</span>
                      <strong className="text-white text-lg font-extrabold mt-2">{routeCommandMeta?.label ?? "Hazır"}</strong>
                    </div>
                    {/* Dört yön padi */}
                    <div className="arena-grid" style={{ ["--cols" as string]: 4, ["--rows" as string]: 1, ["--reserve" as string]: "170px", maxWidth: "24rem" }}>
                      {ROUTE_COMMANDS.map((command, index) => {
                        const isCursor = routeCursor === index;
                        return (
                          <button key={command.key} type="button"
                            aria-label={`${command.label} yönü`}
                            className={`arena-cell ${isCursor ? "game-tile-cursor" : ""}`}
                            style={{ background: "rgba(13,20,18,0.9)" }}
                            onClick={() => handleRoutePick(command.key)}>
                            <span className="arena-cell-glyph" style={{ color: "#4a95cc" }}>{command.icon}</span>
                            <span className="arena-cell-label">{command.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {routeState.history.length > 0 && (
                      <div className="flex items-center gap-1.5" aria-hidden="true">
                        {routeState.history.slice(-8).map((item, index, arr) => {
                          const meta = ROUTE_COMMANDS.find((command) => command.key === item);
                          return (
                            <span key={`${item}-${index}`}
                              className={`text-sm ${index === arr.length - 1 ? "text-white/75" : "text-white/35"}`}>
                              {meta?.icon ?? item}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </GameArena>
                  );
                })()}

                {activeGame === "difference" && (() => {
                  const cue = withFeedback(differenceCue(differenceState.phase));
                  return (
                  <GameArena
                    name={activeTab.title}
                    kicker={activeTab.kicker}
                    accent="#6fb87f"
                    cue={cue.title}
                    cueNote={cue.note}
                    cueState={cue.state}
                    hint={ARENA_KEYBOARD_HINT}
                    progress={differenceState.phase === "playing" ? { current: differenceState.round, total: DIFFERENCE_TOTAL_ROUNDS } : undefined}
                    stats={[
                      { label: "Doğru", value: differenceState.score, tone: "accent" },
                      { label: "Tur", value: `${differenceState.round}/${DIFFERENCE_TOTAL_ROUNDS}` },
                      { label: "Süre", value: elapsedLabel, optional: true },
                    ]}
                    primaryAction={{
                      label: differenceState.phase === "idle" ? "Başlat" : "Yeniden başlat",
                      onClick: startDifferenceGame,
                    }}
                    overlay={differenceState.phase === "finished" ? (() => {
                      const ds = differenceState.score;
                      const diffStars = ds >= 7 ? 3 : ds >= 4 ? 2 : ds >= 1 ? 1 : 0;
                      return (
                        <GameResultOverlay
                          accent="#a9bac6"
                          gradFrom="#a9bac6"
                          gradTo="#4a95cc"
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
                          onSatisfaction={handleSaveSatisfaction}
                          hasActiveClient={!!activeClient}
                          durationSeconds={Math.max(30, Math.round((Date.now() - sessionStartedAt) / 1000))}
                          sessionAvg={(() => { const gs = platformOverview.recentSessions.filter(s => s.gameKey === activeGame && s.clientId === (activeClient?.id ?? "")); return gs.length > 0 ? Math.round(gs.reduce((a, s) => a + s.score, 0) / gs.length) : 0; })()}
                          nextInSet={sessionSetNextInSet}
                        />
                      );
                    })() : null}
                  >
                    {differenceState.tiles.length === 0 ? (
                      <p className="text-sm text-white/60 m-0">Tur henüz başlamadı.</p>
                    ) : (
                    <div className="arena-grid" style={{ ["--cols" as string]: 3, ["--rows" as string]: 2 }}>
                      {differenceState.tiles.map((tile, index) => {
                        const reveal = differenceState.revealId === tile.id;
                        const isCursor = differenceCursor === index;
                        return (
                          <button key={tile.id} type="button" aria-label={`Kart ${index + 1}`}
                            className={`arena-cell ${reveal ? "game-tile-reveal" : ""} ${isCursor ? "game-tile-cursor" : ""}`}
                            onClick={() => handleDifferencePick(tile.id)}
                            style={{ background: tile.background, transform: `rotate(${tile.rotation}deg)` } as CSSProperties}>
                            <div className="absolute inset-0" style={patternStyle(tile)} />
                            <span className="relative arena-cell-glyph" style={{ color: tile.accent }}>{tile.icon}</span>
                            <span className="relative arena-cell-label">{tile.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </GameArena>
                  );
                })()}

                {activeGame === "scan" && (() => {
                  const cue = withFeedback(scanCue(scanState.phase, scanState.targetLabel));
                  const targetSymbol = SYMBOL_LIBRARY.find((s) => s.label === scanState.targetLabel);
                  return (
                  <GameArena
                    name={activeTab.title}
                    kicker={activeTab.kicker}
                    accent="#6fb87f"
                    boardSize={scanState.tiles.length > 9 ? "wide" : "default"}
                    cue={cue.title}
                    cueNote={cue.note}
                    cueState={cue.state}
                    hint={ARENA_KEYBOARD_HINT}
                    progress={scanState.phase === "playing" ? { current: scanState.round, total: SCAN_TOTAL_ROUNDS } : undefined}
                    stats={[
                      { label: "Doğru", value: scanState.score, tone: "accent" },
                      { label: "Tur", value: `${scanState.round}/${SCAN_TOTAL_ROUNDS}` },
                      { label: "Süre", value: elapsedLabel, optional: true },
                    ]}
                    primaryAction={{
                      label: scanState.phase === "idle" ? "Başlat" : "Yeniden başlat",
                      onClick: startScanGame,
                    }}
                    overlay={scanState.phase === "finished" ? (() => {
                      const ss = scanState.score;
                      const scanStars = ss >= 7 ? 3 : ss >= 4 ? 2 : ss >= 1 ? 1 : 0;
                      return (
                        <GameResultOverlay
                          accent="#b6c4cf"
                          gradFrom="#b6c4cf"
                          gradTo="#6fb87f"
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
                          onSatisfaction={handleSaveSatisfaction}
                          hasActiveClient={!!activeClient}
                          durationSeconds={Math.max(30, Math.round((Date.now() - sessionStartedAt) / 1000))}
                          sessionAvg={(() => { const gs = platformOverview.recentSessions.filter(s => s.gameKey === activeGame && s.clientId === (activeClient?.id ?? "")); return gs.length > 0 ? Math.round(gs.reduce((a, s) => a + s.score, 0) / gs.length) : 0; })()}
                          nextInSet={sessionSetNextInSet}
                        />
                      );
                    })() : null}
                  >
                    {/* Aranan simge — ızgaranın hemen üstünde, referans olarak durur */}
                    {scanState.targetLabel && (
                      <div className={`flex items-center gap-3 rounded-full pl-4 pr-5 py-2 border transition-all ${lastFeedback?.correct && activeGame === "scan" ? "correct-glow" : ""}`}
                        style={{ background: "rgba(13,20,18,0.92)", borderColor: "rgba(111, 184, 127,0.3)" }}>
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">Aranan</span>
                        <span className="text-3xl leading-none" style={{ color: targetSymbol?.accent }}>{targetSymbol?.icon ?? "?"}</span>
                        <strong className="text-white text-sm font-bold">{scanState.targetLabel}</strong>
                      </div>
                    )}
                    {scanState.tiles.length > 0 && (
                    <div className="arena-grid" style={{ ["--cols" as string]: scanState.tiles.length > 9 ? 4 : 3, ["--rows" as string]: Math.ceil(scanState.tiles.length / (scanState.tiles.length > 9 ? 4 : 3)), ["--reserve" as string]: "64px" }}>
                      {scanState.tiles.map((tile, index) => {
                        const reveal = scanState.revealId === tile.id;
                        const isCursor = scanCursor === index;
                        return (
                          <button key={tile.id} type="button"
                            aria-label={tile.label}
                            className={`arena-cell ${reveal ? "game-tile-reveal" : ""} ${isCursor ? "game-tile-cursor" : ""}`}
                            onClick={() => handleScanPick(tile.id)}
                            style={{ background: tile.background, transform: `rotate(${tile.rotation}deg)` } as CSSProperties}>
                            <div className="absolute inset-0" style={patternStyle(tile)} />
                            <span className="relative arena-cell-glyph" style={{ color: tile.accent }}>{tile.icon}</span>
                            <span className="relative arena-cell-label">{tile.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </GameArena>
                  );
                })()}

                {/* ── Logic Game ── */}
                {activeGame === "logic" && (() => {
                  const logicRoundTotal = GAME_DIFF_CONFIG.logic.rounds[clientDiffLevel - 1];
                  const cue = logicCue(logicState.phase, logicState.puzzle?.ruleHint ?? null);
                  return (
                  <GameArena
                    name={activeTab.title}
                    kicker={activeTab.kicker}
                    accent="#7db8e0"
                    boardSize="wide"
                    cue={cue.title}
                    cueNote={cue.note}
                    cueState={cue.state}
                    hint="1–4 tuşları seçenekleri seçer"
                    progress={logicState.phase === "playing" ? { current: logicState.round, total: logicRoundTotal } : undefined}
                    stats={[
                      { label: "Puan", value: logicState.score, tone: "accent" },
                      { label: "Tur", value: `${logicState.round}/${logicRoundTotal}` },
                      { label: "Süre", value: elapsedLabel, optional: true },
                    ]}
                    primaryAction={{
                      label: logicState.phase === "idle" ? "Başlat" : "Yeniden başlat",
                      onClick: startLogicGame,
                    }}
                    overlay={logicState.phase === "finished" ? (() => {
                      const ls = logicState.score;
                      const logicRounds = GAME_DIFF_CONFIG.logic.rounds[clientDiffLevel - 1];
                      const logicStars = ls >= logicRounds * 8 ? 3 : ls >= logicRounds * 5 ? 2 : ls >= logicRounds * 2 ? 1 : 0;
                      return (
                        <GameResultOverlay
                          accent="#4a95cc"
                          gradFrom="#4a95cc"
                          gradTo="#17456e"
                          gameName="Dizi Mantık"
                          score={ls}
                          bestScore={scoreboard.logic.best}
                          stars={logicStars}
                          stats={[
                            { label: "Skor", value: ls },
                            { label: "Tur", value: `${logicState.round}/${logicRounds}` },
                            { label: "En İyi", value: scoreboard.logic.best || "—" },
                          ]}
                          onReplay={startLogicGame}
                          onBack={() => setActiveAppView("dashboard")}
                          onSaveNote={async (note) => { setNoteForm({ date: getTodayString(), content: `[${GAME_LABELS[activeGame]}] ${note}` }); setNoteMode("free"); await handleAddNoteDB(); }}
                          onSatisfaction={handleSaveSatisfaction}
                          hasActiveClient={!!activeClient}
                          durationSeconds={Math.max(30, Math.round((Date.now() - sessionStartedAt) / 1000))}
                          sessionAvg={(() => { const gs = platformOverview.recentSessions.filter(s => s.gameKey === activeGame && s.clientId === (activeClient?.id ?? "")); return gs.length > 0 ? Math.round(gs.reduce((a, s) => a + s.score, 0) / gs.length) : 0; })()}
                          nextInSet={sessionSetNextInSet}
                        />
                      );
                    })() : null}
                  >
                    {logicState.phase === "playing" && logicState.puzzle ? (() => {
                      const { puzzle } = logicState;
                      const cellSize = 56;
                      return (
                        <div className="flex flex-col sm:flex-row gap-5 sm:gap-9 items-center justify-center w-full">
                          {/* 3×3 matris — son hücre soru işareti */}
                          <div className="grid grid-cols-3 gap-2">
                            {puzzle.grid.map((cell, i) => (
                              <div key={i} className="w-12 h-12 sm:w-[3.75rem] sm:h-[3.75rem] rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(125, 184, 224,0.2)" }}>
                                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox={`0 0 ${cellSize} ${cellSize}`} dangerouslySetInnerHTML={{ __html: renderLogicShape(cell.shape, cell.color, cellSize) }} />
                              </div>
                            ))}
                            <div className="w-12 h-12 sm:w-[3.75rem] sm:h-[3.75rem] rounded-xl flex items-center justify-center"
                              style={{ background: "rgba(125, 184, 224,0.14)", border: "2px dashed rgba(125, 184, 224,0.55)" }}>
                              <span className="text-2xl font-black" style={{ color: "#7db8e0" }}>?</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">Seçenekler</span>
                            <div className="grid grid-cols-2 gap-2.5">
                              {puzzle.options.map((opt, i) => {
                                const isCursor = logicCursor === i;
                                const isSelected = logicState.selectedIdx === i;
                                const isCorrectOpt = i === puzzle.answerIdx;
                                let borderColor = isCursor ? "rgba(125, 184, 224,0.75)" : "rgba(125, 184, 224,0.22)";
                                let bg = isCursor ? "rgba(125, 184, 224,0.10)" : "rgba(255,255,255,0.03)";
                                if (logicState.showResult && isSelected) { bg = isCorrectOpt ? "rgba(63, 125, 79,0.18)" : "rgba(168, 57, 44,0.18)"; borderColor = isCorrectOpt ? "#3f7d4f" : "#a8392c"; }
                                if (logicState.showResult && isCorrectOpt && !isSelected) { bg = "rgba(63, 125, 79,0.10)"; borderColor = "#3f7d4f88"; }
                                return (
                                  <button key={i} type="button" aria-label={`Seçenek ${i + 1}`}
                                    className="relative w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:cursor-default"
                                    style={{ background: bg, border: `2px solid ${borderColor}` }}
                                    onClick={() => handleLogicPick(i)}
                                    disabled={logicState.showResult}>
                                    <span className="numeral absolute top-1.5 left-2 text-[10px] font-bold text-white/55">{i + 1}</span>
                                    <svg className="w-11 h-11" viewBox={`0 0 ${cellSize} ${cellSize}`} dangerouslySetInnerHTML={{ __html: renderLogicShape(opt.shape, opt.color, cellSize) }} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="grid grid-cols-3 gap-2 opacity-25" aria-hidden="true">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="w-12 h-12 sm:w-[3.75rem] sm:h-[3.75rem] rounded-xl"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(125, 184, 224,0.18)" }} />
                        ))}
                      </div>
                    )}
                  </GameArena>
                  );
                })()}

                {/* ── Oyunun klinik künyesi — kapalıyken tek satır, açıkken kendi içinde kayar ── */}
                <details ref={gameDetailsRef} className="mt-3 shrink-0 rounded-2xl border border-(--color-line) overflow-y-auto w-full max-h-[46%]" style={{ background: "var(--color-surface-strong)" }}>
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none group select-none">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), #2a72ac/10)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
                        <div className="w-2 h-7 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, var(--color-primary), #2a72ac)" }} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-0.5" style={{ color: "var(--color-primary)" }}>{activeCategory.title}</span>
                        <h3 className="text-(--color-text-strong) font-bold text-base m-0">{activeTab.title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[{l: "En iyi", v: activeScoreCard.best}, {l: "Tekrar", v: activeScoreCard.plays}].map(({l, v}) => (
                        <div key={l} className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl" style={{ background: "color-mix(in srgb, var(--color-primary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)" }}>
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
                      {activeTab.goals.map((goal) => <span key={goal} className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>{goal}</span>)}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[{l: "En iyi", v: activeScoreCard.best}, {l: "Son", v: activeScoreCard.last}, {l: "Tekrar", v: activeScoreCard.plays}].map(({l, v}) => (
                        <div key={l} className="flex flex-col rounded-2xl px-4 py-3" style={{ background: "color-mix(in srgb, var(--color-primary) 5%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
                          <span className="text-(--color-text-muted) text-[10px] uppercase tracking-wider font-bold mb-1">{l}</span>
                          <strong className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--color-primary)" }}>{v}</strong>
                        </div>
                      ))}
                    </div>
                    {activeRemoteScore.best > 0 && (
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(63, 125, 79,0.06)", border: "1px solid rgba(63, 125, 79,0.15)" }}>
                        <span className="w-2 h-2 rounded-full bg-[#6fb87f] shrink-0" />
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
          const allGameKeys = Object.keys(GAME_LABELS) as Array<keyof typeof GAME_LABELS>;
          const scoreEntries = allGameKeys.map((key) => {
            const rs = platformOverview.remoteScores[key];
            const local = scoreboard[key] ?? { best: 0, last: 0, plays: 0 };
            const best = Math.max(rs?.best ?? 0, local.best);
            const plays = Math.max(rs?.sessions ?? 0, local.plays);
            const last = rs?.last ?? local.last;
            /* Renk oyunun beceri alanından türer; buradaki elle yazılmış
               tablo "logic" oyununu hiç tanımıyor, iki oyuna da aynı mavi
               veriyordu. */
            return { key, label: GAME_LABELS[key], best, plays, last, color: gameAccent(key) };
          });
          const totalSessions = scoreEntries.reduce((s, e) => s + e.plays, 0);
          const topGame = [...scoreEntries].sort((a, b) => b.plays - a.plays)[0];

          /* Beceri alanı dökümü: son 3 seansın ortalaması, oyunun kendi
             puan ölçeğine oranlanır — oyunlar arasında karşılaştırılabilir. */
          const gameBreakdown = allGameKeys.map((key) => {
            const runs = platformOverview.recentSessions
              .filter((s) => s.gameKey === key)
              .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
            const recent = runs.slice(0, 3).map((s) => s.score);
            const recentAvg = recent.length > 0
              ? Math.round(recent.reduce((t, v) => t + v, 0) / recent.length)
              : 0;
            const scale = GAME_SCORE_SCALE[key];
            /* Tavan, beklenen ölçek ile fiilen gözlenen en yüksek skorun
               büyüğüdür: eski kayıtlarda beklenenin üstünde bir skor varsa
               çubuk %100'ü aşmış gibi görünmez. */
            const observedMax = runs.length > 0 ? Math.max(...runs.map((s) => s.score)) : 0;
            const scaleMax = Math.max(scale.typicalMax, observedMax);
            return {
              key,
              label: GAME_LABELS[key],
              color: gameAccent(key),
              plays: runs.length,
              recentAvg,
              scaleMax,
              unit: scale.unit,
              percent: scaleMax > 0 ? Math.round(Math.min(1, recentAvg / scaleMax) * 100) : 0,
            };
          }).sort((a, b) => b.percent - a.percent);

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
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden page-enter">
              {/* Header */}
              <div className="relative border-b border-(--color-line) overflow-hidden shrink-0" style={{ background: "var(--color-chrome-section)", backdropFilter: "blur(20px)" }}>
                <div className="app-shell flex items-center justify-between gap-3 px-4 lg:px-6 py-3.5 lg:py-5">
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(184, 118, 58,0.06), transparent)" }} />
                <div className="relative">
                  <h1 className="text-lg lg:text-xl font-extrabold text-(--color-text-strong) m-0 tracking-tight">Raporlar & Analitik</h1>
                  <p className="text-(--color-text-soft) text-xs lg:text-sm m-0 hidden sm:block">Seans verileri, oyun performansı ve danışan ilerleme özeti.</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {platformOverview.recentSessions.length > 0 && (
                    <>
                      <button type="button"
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all active:scale-95"
                        style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }}
                        onClick={handleExportSessionsCSV}
                        aria-label="Seansları CSV olarak indir">
                        <Download size={13} /> <span className="hidden sm:inline">CSV</span>
                      </button>
                      <button type="button"
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all active:scale-95"
                        style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }}
                        onClick={() => {
                          const selClient = selectedClientId ? clientOptions.find(c => c.id === selectedClientId) : null;
                          const targetName = selClient?.displayName ?? activeTherapist?.displayName ?? "Tüm Danışanlar";
                          const sessions = platformOverview.recentSessions
                            .filter(s => !selectedClientId || s.clientId === selectedClientId || s.clientName === selClient?.displayName)
                            .map(s => ({
                              date: new Date(s.playedAt).toLocaleDateString("tr-TR"),
                              client: s.clientName,
                              game: s.gameLabel,
                              score: s.score,
                              duration: s.durationSeconds ?? 0,
                              note: s.sessionNote ?? undefined,
                            }));
                          printClientReport({
                            clientName: targetName,
                            therapistName: activeTherapist?.displayName ?? "Terapist",
                            sessions,
                            goals: clientGoals.map(g => ({
                              client: targetName,
                              title: g.title,
                              target: g.targetValue,
                              current: g.currentValue,
                              deadline: g.deadline,
                            })),
                            dateRange: {
                              from: sessions.at(-1)?.date ?? "—",
                              to: sessions[0]?.date ?? "—",
                            },
                          });
                        }}
                        aria-label="Raporu yazdır">
                        <Printer size={13} /> <span className="hidden sm:inline">Yazdır</span>
                      </button>
                    </>
                  )}
                  <button type="button"
                    className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-bold text-white border-none cursor-pointer transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg,#1d5a8c,#2a72ac)", boxShadow: "0 4px 12px rgba(29, 90, 140,0.4)" }}
                    onClick={() => { void loadPlatformOverview(); showToast("Veriler yenilendi", "info"); }}>
                    <RefreshCw size={13} /> <span className="hidden sm:inline">Yenile</span>
                  </button>
                </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="app-shell p-4 lg:p-6 space-y-6 lg:space-y-8">

                {/* ── KPI strip ──
                    Emoji ikonlar (🎮 👥 🏆 📅), degrade üst şerit ve renkli
                    hap rozetleri kaldırıldı; panel kartlarıyla aynı dil. */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {[
                    { label: "Toplam Seans", value: String(totalSessions), sub: "kayıt", Icon: Gamepad2, accent: "var(--color-domain-motor)", isText: false },
                    { label: "Aktif Danışan", value: String(clientOptions.length), sub: "profil", Icon: Users, accent: "var(--color-accent-green)", isText: false },
                    { label: "En Çok Oynanan", value: topGame?.label ?? "—", sub: "oyun", Icon: Trophy, accent: "var(--color-signal)", isText: true },
                    { label: "Bu Hafta", value: String(thisWeekCount), sub: "seans", Icon: CalendarDays, accent: "var(--color-accent-teal)", isText: false },
                  ].map(({ label, value, sub, Icon, accent, isText }) => (
                    <div key={label} className="rounded-2xl p-4 lg:p-5 flex flex-col gap-3"
                      style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `color-mix(in srgb, ${accent} 13%, transparent)` }}>
                        <Icon size={15} style={{ color: accent }} />
                      </span>
                      <div>
                        {isText
                          ? <p className="text-base lg:text-lg font-bold m-0 leading-tight text-(--color-text-strong)">{value}</p>
                          : <strong className="numeral text-3xl lg:text-[2.5rem] font-extrabold block leading-none text-(--color-text-strong)">{value}</strong>
                        }
                        <span className="text-(--color-text-body) text-xs lg:text-sm font-semibold block mt-2">{label}</span>
                        <span className="text-(--color-text-muted) text-[11px] block mt-0.5">{sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Zaman içinde skor eğilimi ── */}
                <SessionTrendChart sessions={platformOverview.recentSessions} />

                {/* ── Beceri alanı dökümü ──
                    Önceki sürüm her oyunun en iyi skorunu kendi maksimumuna
                    göre çizdiği için bütün çubuklar dolu görünüyor, hiçbir şey
                    ayırt edilmiyordu. Artık ölçek her oyunun kendi puan aralığı
                    (GAME_SCORE_SCALE) ve gösterilen değer son 3 seansın
                    ortalaması — yani "şu an nerede", "en iyi gün" değil. */}
                <div className="surface overflow-hidden">
                  <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-(--color-line)">
                    <div>
                      <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Beceri alanı dökümü</h3>
                      <p className="text-xs text-(--color-text-muted) m-0 mt-0.5">
                        Son 3 seans ortalaması, her oyunun kendi puan ölçeğine göre
                      </p>
                    </div>
                    <span className="text-xs text-(--color-text-muted)">
                      Toplam <span className="numeral font-bold text-(--color-text-body)">{totalSessions}</span> seans
                    </span>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    {gameBreakdown.map((row) => (
                      <div key={row.key} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                            <span className="font-semibold text-(--color-text-strong) truncate">{row.label}</span>
                            {row.plays === 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
                                oynanmadı
                              </span>
                            )}
                          </div>
                          {row.plays > 0 && (
                            <div className="flex items-baseline gap-3 shrink-0 text-xs text-(--color-text-muted)">
                              <span className="numeral font-bold text-base" style={{ color: row.color }}>{row.recentAvg}</span>
                              <span>/ {row.scaleMax} {row.unit}</span>
                              <span className="numeral">{row.plays}×</span>
                            </div>
                          )}
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                          <div className="h-full rounded-full transition-[width] duration-700"
                            style={{ width: `${row.percent}%`, background: row.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Two-col: Client Table + Activity Feed ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                  {/* Client Performance Table */}
                  <div className="lg:col-span-3 relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#6fb87f,#5b7183,transparent)" }} />
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3f7d4f,#5b7183)" }}>
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
                        <button type="button" className="text-xs font-bold px-3 py-1.5 rounded-xl text-white border-none cursor-pointer" style={{ background: "linear-gradient(135deg,#3f7d4f,#5b7183)" }} onClick={() => { setShowAddClient(true); setActiveAppView("clients"); }}>Danışan Ekle</button>
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
                              const gradients = ["linear-gradient(135deg,#1d5a8c,#2a72ac)","linear-gradient(135deg,#3f7d4f,#5b7183)","linear-gradient(135deg,#b8763a,#a8392c)","linear-gradient(135deg,#b8503f,#2a72ac)","linear-gradient(135deg,#1d5a8c,#1d5a8c)"];
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
                                    <span className="font-bold tabular-nums" style={{ color: "#4a95cc" }}>{c.sessionCount}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold tabular-nums" style={{ color: c.avgScore >= 10 ? "#6fb87f" : c.avgScore >= 5 ? "#dda05e" : "#e2705f" }}>{c.avgScore}</span>
                                      {c.avgScore >= 10 && <ArrowUpRight size={12} style={{ color: "#6fb87f" }} />}
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
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#e2705f,#4a95cc,transparent)" }} />
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#b8503f,#2a72ac)" }}>
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
                          const gc = gameAccent(session.gameKey ?? "");
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

                {/* ── Domain Radar Chart ── */}
                {(() => {
                  const RADAR_DOMAINS = [
                    { key: "memory",     label: "Hafıza",       angle: -90 },
                    { key: "pairs",      label: "Görsel Eşl.",  angle: -30 },
                    { key: "difference", label: "Görsel Algı",  angle: 30  },
                    { key: "scan",       label: "Tarama",       angle: 90  },
                    { key: "pulse",      label: "Reaksiyon",    angle: 150 },
                    { key: "route",      label: "Planlama",     angle: 210 },
                  ] as const;
                  const cx = 130; const cy = 130; const R = 90;
                  const toRad = (deg: number) => (deg * Math.PI) / 180;
                  const axisPoint = (deg: number, r: number) => ({
                    x: cx + r * Math.cos(toRad(deg)),
                    y: cy + r * Math.sin(toRad(deg)),
                  });
                  const globalMax = Math.max(...scoreEntries.map(e => e.best), 1);
                  const dataPoints = RADAR_DOMAINS.map(d => {
                    const entry = scoreEntries.find(e => e.key === d.key);
                    const pct = entry ? entry.best / globalMax : 0;
                    const pt = axisPoint(d.angle, pct * R);
                    return pt;
                  });
                  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
                  const hasData = scoreEntries.some(e => e.best > 0);
                  return (
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#4a95cc,#4a95cc,transparent)" }} />
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4a95cc,#4a95cc)" }}>
                          <Activity size={15} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Alan Performans Radarı</h3>
                          <span className="text-xs text-(--color-text-muted)">Terapi alanlarına göre en yüksek skor dağılımı</span>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                        {/* SVG radar */}
                        <svg viewBox="0 0 260 260" className="w-52 h-52 shrink-0">
                          {/* Grid rings */}
                          {[0.25, 0.5, 0.75, 1].map(f => {
                            const pts = RADAR_DOMAINS.map(d => {
                              const p = axisPoint(d.angle, f * R);
                              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                            }).join(" ");
                            return <polygon key={f} points={pts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
                          })}
                          {/* Axis lines */}
                          {RADAR_DOMAINS.map(d => {
                            const tip = axisPoint(d.angle, R);
                            return <line key={d.key} x1={cx} y1={cy} x2={tip.x.toFixed(1)} y2={tip.y.toFixed(1)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
                          })}
                          {/* Data polygon */}
                          {hasData && (
                            <>
                              <path d={polygonPath} fill="rgba(29, 90, 140,0.2)" stroke="#4a95cc" strokeWidth="2" strokeLinejoin="round" />
                              {dataPoints.map((p, i) => (
                                <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#4a95cc" stroke="var(--color-surface-strong)" strokeWidth="1.5" />
                              ))}
                            </>
                          )}
                          {!hasData && (
                            <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">veri yok</text>
                          )}
                          {/* Labels */}
                          {RADAR_DOMAINS.map(d => {
                            const p = axisPoint(d.angle, R + 18);
                            return <text key={d.key} x={p.x.toFixed(1)} y={(p.y + 3).toFixed(1)} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="8.5" fontWeight="600">{d.label}</text>;
                          })}
                        </svg>
                        {/* Legend */}
                        <div className="flex-1 grid grid-cols-2 gap-2.5">
                          {RADAR_DOMAINS.map(d => {
                            const entry = scoreEntries.find(e => e.key === d.key);
                            const pct = entry && globalMax > 0 ? Math.round((entry.best / globalMax) * 100) : 0;
                            return (
                              <div key={d.key} className="flex items-center gap-2.5 p-2.5 rounded-xl border" style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-line)" }}>
                                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: gameAccent(d.key) }} />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-(--color-text-muted) m-0 uppercase tracking-wide truncate">{d.label}</p>
                                  <p className="text-sm font-extrabold m-0" style={{ color: gameAccent(d.key) }}>{entry?.best ?? 0} <span className="text-[9px] font-normal text-(--color-text-muted)">({pct}%)</span></p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Game distribution pie-style ── */}
                <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#dda05e,#b8763a,transparent)" }} />
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#b8763a,#a8392c)" }}>
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
                          <button type="button" className="text-xs font-bold px-4 py-2 rounded-xl text-white border-none cursor-pointer" style={{ background: "linear-gradient(135deg,#b8763a,#a8392c)" }} onClick={() => setActiveAppView("games")}>
                            Oyun Başlat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Client Comparison ── */}
                {clientOptions.length >= 2 && (() => {
                  const cA = clientOptions.find(c => c.id === compareClientA) ?? null;
                  const cB = clientOptions.find(c => c.id === compareClientB) ?? null;
                  const sessA = cA ? platformOverview.recentSessions.filter(s => s.clientId === cA.id) : [];
                  const sessB = cB ? platformOverview.recentSessions.filter(s => s.clientId === cB.id) : [];
                  const avgA = sessA.length ? Math.round(sessA.reduce((s, x) => s + x.score, 0) / sessA.length) : 0;
                  const avgB = sessB.length ? Math.round(sessB.reduce((s, x) => s + x.score, 0) / sessB.length) : 0;
                  const bestA = sessA.length ? Math.max(...sessA.map(s => s.score)) : 0;
                  const bestB = sessB.length ? Math.max(...sessB.map(s => s.score)) : 0;
                  const favA = sessA.length ? (Object.entries(sessA.reduce((acc: Record<string, number>, s) => { acc[s.gameLabel] = (acc[s.gameLabel] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—") : "—";
                  const favB = sessB.length ? (Object.entries(sessB.reduce((acc: Record<string, number>, s) => { acc[s.gameLabel] = (acc[s.gameLabel] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—") : "—";
                  const metrics = [
                    { label: "Toplam Seans", a: sessA.length, b: sessB.length, fmt: (v: number) => String(v) },
                    { label: "En Yüksek Skor", a: bestA, b: bestB, fmt: (v: number) => String(v) },
                    { label: "Ortalama Skor", a: avgA, b: avgB, fmt: (v: number) => String(v) },
                    { label: "Favori Oyun", a: -1, b: -1, labelA: favA, labelB: favB, fmt: (v: number) => String(v) },
                  ];
                  return (
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#4a95cc,#e2705f,transparent)" }} />
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4a95cc,#e2705f)" }}>
                          <Users size={15} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Danışan Karşılaştırma</h3>
                          <span className="text-xs text-(--color-text-muted)">İki danışanı yan yana karşılaştır</span>
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        {/* Selector row */}
                        <div className="grid grid-cols-2 gap-3">
                          {([{ val: compareClientA, set: setCompareClientA, color: "#4a95cc", label: "Danışan A" }, { val: compareClientB, set: setCompareClientB, color: "#e2705f", label: "Danışan B" }] as const).map(col => (
                            <div key={col.label}>
                              <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: col.color }}>{col.label}</p>
                              <select value={col.val} onChange={e => col.set(e.target.value)}
                                className="w-full text-sm px-3 py-2 rounded-xl border outline-none cursor-pointer"
                                style={{ background: "var(--color-surface)", borderColor: col.val ? col.color + "55" : "var(--color-line)", color: "var(--color-text-body)" }}>
                                <option value="">Danışan seç…</option>
                                {clientOptions.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                        {/* Comparison table */}
                        {cA && cB && (
                          <div className="rounded-2xl overflow-hidden border border-(--color-line)">
                            <div className="grid grid-cols-3 text-[10px] font-extrabold uppercase tracking-wider" style={{ background: "var(--color-surface-elevated)" }}>
                              <div className="px-4 py-2.5 text-(--color-text-muted)">Metrik</div>
                              <div className="px-4 py-2.5 text-center" style={{ color: "#4a95cc" }}>{cA.displayName}</div>
                              <div className="px-4 py-2.5 text-center" style={{ color: "#e2705f" }}>{cB.displayName}</div>
                            </div>
                            {metrics.map(m => {
                              const isNum = m.a >= 0;
                              const aWins = isNum && m.a > m.b;
                              const bWins = isNum && m.b > m.a;
                              return (
                                <div key={m.label} className="grid grid-cols-3 border-t text-sm" style={{ borderColor: "var(--color-line-soft)" }}>
                                  <div className="px-4 py-3 text-(--color-text-muted) text-xs font-semibold">{m.label}</div>
                                  <div className="px-4 py-3 text-center font-bold tabular-nums" style={{ color: aWins ? "#4a95cc" : "var(--color-text-body)", background: aWins ? "rgba(74, 149, 204,0.06)" : "transparent" }}>
                                    {isNum ? m.a : (m as { labelA?: string }).labelA ?? "—"}
                                    {aWins && <span className="ml-1 text-[10px]">↑</span>}
                                  </div>
                                  <div className="px-4 py-3 text-center font-bold tabular-nums" style={{ color: bWins ? "#e2705f" : "var(--color-text-body)", background: bWins ? "rgba(226, 112, 95,0.06)" : "transparent" }}>
                                    {isNum ? m.b : (m as { labelB?: string }).labelB ?? "—"}
                                    {bWins && <span className="ml-1 text-[10px]">↑</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {cA && cB && (
                          <button type="button"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] mt-2"
                            style={{ background: "linear-gradient(135deg, #4a95cc, #e2705f)", boxShadow: "0 4px 16px rgba(74, 149, 204,0.3)" }}
                            onClick={() => setShowComparison(true)}>
                            <Users size={14} /> Detaylı Karşılaştırma
                          </button>
                        )}
                        {(!cA || !cB) && (
                          <p className="text-xs text-(--color-text-muted) text-center py-4 m-0">Her iki danışanı da seçin.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Therapy Program ── */}
        {activeAppView === "therapy-program" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* ── Premium Header ── */}
            <div className="relative border-b border-(--color-line) overflow-hidden" style={{ background: "var(--color-chrome-section)", backdropFilter: "blur(20px)" }}>
              <div className="app-shell flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 px-4 lg:px-6 py-4 lg:py-5">
              {/* Background glow */}
              <div className="absolute top-0 left-0 w-64 h-32 rounded-full pointer-events-none" style={{ background: "var(--color-primary)", opacity: 0.04, filter: "blur(50px)", transform: "translate(-20%,-40%)" }} />
              <div className="relative">
                <h1 className="text-lg lg:text-xl font-extrabold text-(--color-text-strong) m-0 mb-1 tracking-tight">Terapi Programı</h1>
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
            </div>

            {/* ── Premium Tabs ── */}
            <div className="border-b border-(--color-line)" style={{ background: "var(--color-chrome-section)" }}>
            <div className="app-shell tab-scroll flex gap-1 px-3 lg:px-4 py-2 lg:py-2.5">
              {([
                {key: "domains" as const, label: "Alanlar", labelFull: "Terapi Alanları", Icon: Stethoscope, disabled: false},
                {key: "activities" as const, label: "Aktivite", labelFull: "Aktiviteler", Icon: ClipboardList, disabled: !tpSelectedDomain},
                {key: "games" as const, label: "Oyunlar", labelFull: "Oyun Eşleme", Icon: Gamepad2, disabled: !tpSelectedDomain},
                {key: "plan" as const, label: "Plan", labelFull: "Haftalık Plan", Icon: CalendarDays, disabled: !tpSelectedDomain},
                {key: "progress" as const, label: "İlerleme", labelFull: "İlerleme", Icon: TrendingUp, disabled: !tpSelectedClientId},
                {key: "protocols" as const, label: "Protokol", labelFull: "Protokoller", Icon: BookOpen, disabled: false},
              ] as {key: "domains" | "activities" | "games" | "plan" | "progress" | "protocols"; label: string; labelFull: string; Icon: LucideIcon; disabled: boolean}[]).map(({key, label, labelFull, Icon, disabled}) => (
                <button key={key} type="button"
                  className="shrink-0 flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold border-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: tpActiveTab === key ? "linear-gradient(135deg, var(--color-primary), #2a72ac)" : "transparent",
                    color: tpActiveTab === key ? "white" : "var(--color-text-soft)",
                    boxShadow: tpActiveTab === key ? "0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent)" : "none",
                  }}
                  onClick={() => setTpActiveTab(key)} disabled={disabled}>
                  <Icon size={13} className="shrink-0" />
                  <span className="hidden sm:inline">{labelFull}</span>
                  <span className="sm:hidden">{label}</span>
                </button>
              ))}
            </div>
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
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #2a72ac, transparent)` }} />
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
                            style={{ background: "linear-gradient(135deg,var(--color-primary),#2a72ac)", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent)" }}
                            onClick={handleGeneratePlan}>
                            <CalendarDays size={13} />Plan Üret →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Premium stat strip ── */}
                    <div className="grid grid-cols-4 gap-3">
                      {([
                        {v: domain.goals.length, l: "Hedef", emoji: "🎯", color: "#1d5a8c"},
                        {v: domain.activities.length, l: "Aktivite", emoji: "🧩", color: "#2a72ac"},
                        {v: domain.subSkills.length, l: "Beceri Alanı", emoji: "⚡", color: "#3f7d4f"},
                        {v: favoriteActivities.length, l: "Favori", emoji: "⭐", color: "#b8763a"},
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
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d5a8c,#5b7183)", boxShadow: "0 2px 6px #1d5a8c40" }}>
                            <Target size={12} className="text-white" />
                          </span>
                          Terapi Hedefleri
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#1d5a8c" }}>{domain.goals.length}</span>
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                        {domain.goals.map((goal, gi) => (
                          <div key={goal.id} className="relative overflow-hidden rounded-xl border border-(--color-line) p-3.5" style={{ background: "var(--color-surface-elevated)" }}>
                            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,#1d5a8c40,transparent)" }} />
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#1d5a8c,#2a72ac)" }}>{gi + 1}</span>
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
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#b8763a,#a8392c)", boxShadow: "0 2px 6px #b8763a40" }}>
                              <Zap size={12} className="text-white" />
                            </span>
                            Fonksiyonel Zorluklar
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#b8763a" }}>{domain.challenges.length}</span>
                        </summary>
                        <div className="flex flex-wrap gap-2 p-4">
                          {domain.challenges.map((ch) => (
                            <span key={ch.id} className="text-xs px-3 py-1.5 rounded-full border font-medium" style={{ background: "#b8763a10", borderColor: "#b8763a30", color: "#b8763a" }}>{ch.label}</span>
                          ))}
                        </div>
                      </details>

                      <details open className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                        <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none font-semibold text-sm text-(--color-text-strong)" style={{ background: "var(--color-surface-elevated)" }}>
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3f7d4f,#5b7183)", boxShadow: "0 2px 6px #3f7d4f40" }}>
                              <Puzzle size={12} className="text-white" />
                            </span>
                            Alt Beceriler
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#3f7d4f" }}>{domain.subSkills.length}</span>
                        </summary>
                        <div className="grid grid-cols-1 gap-2 p-4">
                          {domain.subSkills.map((skill) => (
                            <div key={skill.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#3f7d4f" }} />
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
                      <div className="rounded-2xl border border-[#b8763a]/30 p-4 overflow-hidden relative" style={{ background: "color-mix(in srgb,#b8763a 6%,var(--color-surface-strong))" }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#b8763a,transparent)" }} />
                        <h3 className="text-sm font-bold text-[#dda05e] mb-3 flex items-center gap-1.5">⭐ Favori Aktiviteler <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "#b8763a" }}>{favoriteActivities.length}</span></h3>
                        <div className="flex flex-wrap gap-2">
                          {favoriteActivities.map((act) => (
                            <div key={act.id} className="flex items-center gap-2 rounded-full px-3 py-1.5 border" style={{ background: "#b8763a12", borderColor: "#b8763a30" }}>
                              <span className="text-xs font-medium text-(--color-text-body)">{act.label}</span>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${act.difficulty === "kolay" ? "bg-[#3f7d4f]" : act.difficulty === "orta" ? "bg-[#b8763a]" : "bg-[#a8392c]"}`} />
                              <button type="button" className="text-(--color-text-muted) hover:text-[#e2705f] bg-transparent border-none cursor-pointer text-xs transition-colors" onClick={() => toggleFavoriteActivity(act.id)} title="Favoriden çıkar">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Activity cards section ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #2a72ac, transparent)` }} />
                      {/* Section header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${domain.color}, #2a72ac)` }}>
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
                            const levelColor = level === "kolay" ? "#3f7d4f" : level === "orta" ? "#b8763a" : level === "zor" ? "#a8392c" : undefined;
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
                              const diffBg = activity.difficulty === "kolay" ? "#3f7d4f" : activity.difficulty === "orta" ? "#b8763a" : "#a8392c";
                              const diffBgLight = activity.difficulty === "kolay" ? "#3f7d4f15" : activity.difficulty === "orta" ? "#b8763a15" : "#a8392c15";
                              const diffBorder = activity.difficulty === "kolay" ? "#3f7d4f30" : activity.difficulty === "orta" ? "#b8763a30" : "#a8392c30";
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
                                          style={{ background: isFav ? "#b8763a20" : "transparent", color: isFav ? "#b8763a" : "var(--color-text-muted)" }}
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
                                      {activity.homeExercise && <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg text-[#6fb87f] border border-[#3f7d4f]/20" style={{ background: "#3f7d4f12" }}><Home size={9} />Ev ödevi</span>}
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
                                          <div className="rounded-xl border border-[#b8763a]/25 p-3" style={{ background: "#b8763a08" }}>
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#b8763a] mb-1.5"><FlaskConical size={10} />Kanıt Temeli</span>
                                            <p className="text-xs text-(--color-text-soft) m-0 leading-relaxed">{activity.evidenceBase}</p>
                                          </div>
                                        )}
                                        {activity.therapistTips && activity.therapistTips.length > 0 && (
                                          <div className="rounded-xl border p-3" style={{ background: "color-mix(in srgb, var(--color-primary) 5%, transparent)", borderColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
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
                  ? { bg: "#3f7d4f15", color: "#3f7d4f", border: "#3f7d4f30", label: "Kolay" }
                  : d === "orta"
                  ? { bg: "#b8763a15", color: "#b8763a", border: "#b8763a30", label: "Orta" }
                  : { bg: "#a8392c15", color: "#a8392c", border: "#a8392c30", label: "Zor" };
                const gameIcon = (key: string) => { const Icon = GAME_ICON_MAP[key] ?? Gamepad2; return <Icon size={22} />; };
                const gameAccent: Record<string, string> = {
                  memory: "#1d5a8c", pairs: "#2a72ac", pulse: "#3f7d4f",
                  route: "#b8763a", difference: "#b8503f", scan: "#5b7183",
                };
                return (
                  <div className="space-y-6">
                    {/* ── Premium Header ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-6" style={{ background: `linear-gradient(135deg, ${domain.color}10 0%, var(--color-surface-strong) 100%)` }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #2a72ac, transparent)` }} />
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
                                <div className="rounded-2xl border border-[#b8763a]/25 p-4" style={{ background: "#b8763a08" }}>
                                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#b8763a] mb-2"><BookOpen size={12} />Bilimsel Referans</p>
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
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary),#2a72ac)" }}>
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

                const planClient = tpSelectedClientId ? clientOptions.find((c) => c.id === tpSelectedClientId) ?? null : null;
                const planContext = buildPlanContext(planClient);
                const plan = buildTherapyPlan(tpSelectedDomain, planContext, platformOverview.recentSessions);
                if (!plan) return null;

                const verdictStyle: Record<string, { label: string; color: string }> = {
                  ideal:      { label: "İdeal zorluk", color: "var(--color-accent-green)" },
                  uygun:      { label: "Uygun",        color: "var(--color-primary)" },
                  kolay:      { label: "Fazla kolay",  color: "var(--color-text-muted)" },
                  zor:        { label: "Destek gerekir", color: "var(--color-accent-amber)" },
                  "yaş-dışı": { label: "Yaş dışı",     color: "var(--color-accent-red)" },
                };

                return (
                  <div className="space-y-5">
                    {/* ── Plan girdileri ── */}
                    <div className="surface p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-widest block" style={{ color: domain.color }}>{domain.label}</span>
                          <h2 className="text-lg font-extrabold text-(--color-text-strong) m-0 tracking-tight">Haftalık plan</h2>
                          <p className="text-(--color-text-soft) text-sm m-0 mt-1">
                            Plan; danışanın yaşı, bağımsızlık düzeyi, ortamı ve oyun geçmişine göre üretilir.
                          </p>
                        </div>
                        {!planClient && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ background: "color-mix(in srgb, var(--color-accent-amber) 12%, transparent)", color: "var(--color-accent-amber)", border: "1px solid var(--color-accent-amber)" }}>
                            Danışan seçilmedi — genel plan gösteriliyor
                          </span>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">Yaş grubu</span>
                          <select className={inputCls} value={tpAgeOverride ?? planContext.ageGroup ?? ""}
                            onChange={(e) => setTpAgeOverride((e.target.value || null) as AgeGroupKey | null)}>
                            <option value="">Seçilmedi</option>
                            {AGE_GROUPS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">Bağımsızlık düzeyi</span>
                          <select className={inputCls} value={tpIndependence ?? planContext.independenceScore ?? ""}
                            onChange={(e) => setTpIndependence(e.target.value ? Number(e.target.value) : null)}>
                            <option value="">Seçilmedi</option>
                            {INDEPENDENCE_LEVELS.map((l) => <option key={l.key} value={l.score}>{l.score} · {l.label}</option>)}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">Haftalık seans</span>
                          <select className={inputCls} value={tpSessionsPerWeek}
                            onChange={(e) => setTpSessionsPerWeek(Number(e.target.value))}>
                            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n} seans</option>)}
                          </select>
                        </label>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">Ortam</span>
                          <div className="flex flex-wrap gap-1.5">
                            {ENVIRONMENT_OPTIONS.map((env) => {
                              const on = tpEnvironments.includes(env.key);
                              return (
                                <button key={env.key} type="button"
                                  onClick={() => setTpEnvironments((cur) => on ? cur.filter((e) => e !== env.key) : [...cur, env.key])}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                                  style={{
                                    background: on ? "var(--color-primary)" : "var(--color-surface-elevated)",
                                    color: on ? "#fff" : "var(--color-text-soft)",
                                    border: `1px solid ${on ? "var(--color-primary)" : "var(--color-line)"}`,
                                  }}>
                                  {env.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Planın dayandığı girdiler — terapist güvenmeden önce görmeli */}
                      <div className="mt-4 pt-4 border-t border-(--color-line) flex flex-wrap gap-x-4 gap-y-1.5">
                        {plan.basis.map((b) => (
                          <span key={b} className="text-[11px] text-(--color-text-muted) flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-(--color-text-disabled)" />{b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* ── Uyarılar ── */}
                    {plan.precautions.length > 0 && (
                      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--color-accent-amber)", background: "color-mix(in srgb, var(--color-accent-amber) 8%, transparent)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Bell size={14} style={{ color: "var(--color-accent-amber)" }} />
                          <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--color-accent-amber)" }}>
                            Klinik uyarılar
                          </span>
                        </div>
                        <ul className="m-0 pl-4 space-y-1">
                          {plan.precautions.map((p) => (
                            <li key={p} className="text-xs text-(--color-text-body) leading-relaxed">{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ── Haftalık takvim ── */}
                    <div className="surface overflow-hidden">
                      <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-(--color-line)">
                        <div>
                          <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">
                            Haftalık akış — {plan.days.length} seans
                          </h3>
                          <p className="text-xs text-(--color-text-muted) m-0 mt-0.5">{plan.performanceNote}</p>
                        </div>
                        <span className="text-xs text-(--color-text-muted)">
                          Toplam <span className="numeral font-bold text-(--color-text-body)">{plan.weeklyMinutes}</span> dk/hafta
                        </span>
                      </div>
                      <div className="divide-y divide-(--color-line)">
                        {plan.days.map((day) => (
                          <div key={day.dayKey} className="flex items-start gap-4 px-5 py-3.5">
                            <span className="w-16 shrink-0 text-xs font-bold text-(--color-text-strong) pt-0.5">{day.dayLabel}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-(--color-text-strong)">
                                  {day.activity?.label ?? "Aktivite seçilmedi"}
                                </span>
                                {day.activity && (
                                  <span className="numeral text-[11px] text-(--color-text-muted)">{day.minutes} dk</span>
                                )}
                              </div>
                              <p className="text-xs text-(--color-text-soft) m-0 mt-0.5 leading-relaxed">{day.focus}</p>
                            </div>
                            {day.game && (
                              <button type="button"
                                onClick={() => openGameView(day.game as PlatformGameKey)}
                                className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-85"
                                style={{ background: "var(--color-primary)", color: "#fff", border: "none" }}>
                                ▶ {day.gameLabel}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Önerilen aktiviteler, öncelik sırasıyla ── */}
                    <div className="surface overflow-hidden">
                      <div className="px-5 py-4 border-b border-(--color-line)">
                        <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">
                          Aktivite önerileri
                        </h3>
                        <p className="text-xs text-(--color-text-muted) m-0 mt-0.5">
                          Öncelik sırası; danışanın bağımsızlık düzeyinin bir kademe üstündeki aktiviteler öne alınır.
                        </p>
                      </div>
                      <div className="divide-y divide-(--color-line)">
                        {plan.recommended.map(({ activity, fit, verdict, rationale }) => {
                          const vs = verdictStyle[verdict];
                          return (
                            <div key={activity.id} className="px-5 py-4">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-bold text-(--color-text-strong)">{activity.label}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                      style={{ background: `${vs.color}1a`, color: vs.color, border: `1px solid ${vs.color}33` }}>
                                      {vs.label}
                                    </span>
                                    <span className="text-[10px] text-(--color-text-muted)">{activity.subSkill}</span>
                                  </div>
                                  <p className="text-xs text-(--color-text-soft) m-0 leading-relaxed">{activity.description}</p>
                                  <p className="text-[11px] text-(--color-text-muted) m-0 mt-1.5">
                                    <span className="font-semibold">Neden bu sırada:</span> {rationale}
                                  </p>
                                  {fit && (
                                    <p className="text-[11px] text-(--color-text-muted) m-0 mt-1">
                                      <span className="font-semibold">İlerleme ölçütü:</span> {fit.progressionCriterion}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="numeral text-xs text-(--color-text-muted)">{activity.sessionMinutes} dk</span>
                                  {fit && (
                                    <span className="numeral text-[11px] text-(--color-text-muted)">
                                      hafta × {fit.sessionsPerWeek}
                                    </span>
                                  )}
                                  {activity.homeExercise && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                      style={{ background: "color-mix(in srgb, var(--color-accent-green) 12%, transparent)", color: "var(--color-accent-green)" }}>
                                      ev programı
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Elenen aktiviteler — şeffaflık ── */}
                    {plan.excluded.length > 0 && (
                      <details className="surface overflow-hidden">
                        <summary className="px-5 py-3.5 cursor-pointer list-none flex items-center justify-between">
                          <span className="text-xs font-bold text-(--color-text-soft)">
                            Bu danışan için elenen {plan.excluded.length} aktivite
                          </span>
                          <ChevronDown size={14} className="text-(--color-text-muted)" />
                        </summary>
                        <div className="px-5 pb-4 pt-1 border-t border-(--color-line) flex flex-col gap-1.5">
                          {plan.excluded.map(({ activity, rationale }) => (
                            <p key={activity.id} className="text-xs text-(--color-text-muted) m-0">
                              <span className="font-semibold text-(--color-text-soft)">{activity.label}</span> — {rationale}
                            </p>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* ── Standart çıktı ölçütleri ── */}
                    {plan.measures.length > 0 && (
                      <div className="surface overflow-hidden">
                        <div className="px-5 py-4 border-b border-(--color-line)">
                          <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">İlerlemeyi nasıl ölçersiniz?</h3>
                          <p className="text-xs text-(--color-text-muted) m-0 mt-0.5">
                            Bu alan ve yaş grubu için uygun standart araçlar; eşikler kaynağıyla birlikte verilmiştir.
                          </p>
                        </div>
                        <div className="divide-y divide-(--color-line)">
                          {plan.measures.map((measure) => (
                            <details key={measure.id} className="px-5 py-3.5">
                              <summary className="cursor-pointer list-none flex items-baseline gap-2 flex-wrap">
                                <span className="text-sm font-bold text-(--color-text-strong)">{measure.abbr}</span>
                                <span className="text-xs text-(--color-text-soft)">{measure.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shrink-0"
                                  style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" }}>
                                  {MEASURE_KIND_LABELS[measure.kind]}
                                </span>
                              </summary>
                              <div className="mt-2.5 flex flex-col gap-2">
                                <p className="text-xs text-(--color-text-body) m-0 leading-relaxed">{measure.measures}</p>
                                <p className="text-xs text-(--color-text-soft) m-0 leading-relaxed">
                                  <span className="font-semibold">Uygulama:</span> {measure.administration}
                                </p>
                                <ul className="m-0 pl-4 space-y-0.5">
                                  {measure.interpretation.map((line) => (
                                    <li key={line} className="text-xs text-(--color-text-soft) leading-relaxed">{line}</li>
                                  ))}
                                </ul>
                                {measure.caveat && (
                                  <p className="text-xs m-0 leading-relaxed px-3 py-2 rounded-lg"
                                    style={{ background: "color-mix(in srgb, var(--color-accent-amber) 10%, transparent)", color: "var(--color-text-body)" }}>
                                    <span className="font-semibold">Sınırlılık:</span> {measure.caveat}
                                  </p>
                                )}
                                <p className="text-[11px] text-(--color-text-muted) m-0 italic">Kaynak: {measure.source}</p>
                              </div>
                            </details>
                          ))}
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
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,color-mix(in srgb, var(--color-primary) 15%, transparent),#2a72ac/15)" }}>
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
                        style={{ background: "linear-gradient(135deg,var(--color-primary),#2a72ac)", boxShadow: "0 4px 14px color-mix(in srgb, var(--color-primary) 40%, transparent)" }}
                        onClick={() => setTpShowProgressForm(!tpShowProgressForm)}>
                        + Kayıt Ekle
                      </button>
                    </div>

                    {/* ── Overall Progress Hero ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-6" style={{ background: "linear-gradient(135deg,color-mix(in srgb, var(--color-primary) 8%, transparent) 0%,#2a72ac/5 100%)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,var(--color-primary),#2a72ac,transparent)" }} />
                      <div className="flex items-center gap-6">
                        {/* Donut chart */}
                        <div className="relative w-24 h-24 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#progressGrad)" strokeWidth="3" strokeDasharray={`${overallAvg}, 100`} strokeLinecap="round" />
                            <defs><linearGradient id="progressGrad"><stop offset="0%" stopColor="#1d5a8c" /><stop offset="100%" stopColor="#2a72ac" /></linearGradient></defs>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-(--color-text-strong)">{overallAvg}%</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-extrabold text-(--color-text-strong) m-0 mb-1">Genel İlerleme</h3>
                          <p className="text-(--color-text-soft) text-sm m-0">{clientProgress.length} kayıt · {goalAverages.filter((g) => g.count > 0).length}/{goals.length} hedef takipte</p>
                          {/* Mini bar */}
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${overallAvg}%`, background: "linear-gradient(90deg,var(--color-primary),#2a72ac)" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Add Progress Form ── */}
                    {tpShowProgressForm && domain && (
                      <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,var(--color-primary),#2a72ac,transparent)" }} />
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "color-mix(in srgb, var(--color-primary) 5%, transparent)" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary),#2a72ac)" }}>
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
                            <input type="range" min={0} max={100} step={5} value={tpProgressForm.value} onChange={(e) => setTpProgressForm((c) => ({ ...c, value: Number(e.target.value) }))} className="w-full accent-[#465a6b]" />
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
                              style={{ background: "linear-gradient(135deg,var(--color-primary),#2a72ac)", boxShadow: "0 4px 14px color-mix(in srgb, var(--color-primary) 40%, transparent)" }}
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
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#3f7d4f,transparent)" }} />
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3f7d4f,#5b7183)" }}>
                            <Target size={13} className="text-white" />
                          </div>
                          <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Hedef Bazlı İlerleme</h3>
                          <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#3f7d4f" }}>{goalAverages.filter(g => g.count > 0).length} hedef</span>
                        </div>
                        <div className="p-5 space-y-4">
                          {goalAverages.map((ga, i) => {
                            const barColor = ga.average >= 75 ? "#3f7d4f" : ga.average >= 50 ? "#b8763a" : ga.average >= 25 ? "#1d5a8c" : "#a8392c";
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
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#b8763a,#a8392c)" }}>
                          <BarChart3 size={13} className="text-white" />
                        </div>
                        <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">İlerleme Geçmişi</h3>
                        <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#b8763a" }}>{clientProgress.length}</span>
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
                            const barColor = entry.value >= 75 ? "#3f7d4f" : entry.value >= 50 ? "#b8763a" : entry.value >= 25 ? "#1d5a8c" : "#a8392c";
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
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border-none cursor-pointer transition-colors text-(--color-text-muted) hover:text-[#e2705f] hover:bg-[#a8392c]/10"
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

              {/* ── Protocols Tab ── */}
              {tpActiveTab === "protocols" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-extrabold text-(--color-text-strong) mb-1 tracking-tight">Terapi Protokol Şablonları</h2>
                    <p className="text-(--color-text-soft) text-sm m-0">Kanıta dayalı hazır protokol şablonları. Bir şablonu seçerek hafta hafta terapi planına dönüştürün.</p>
                  </div>

                  {/* Protocol grid */}
                  {!tpSelectedProtocol ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {THERAPY_PROTOCOLS.map((proto) => (
                        <button key={proto.id} type="button"
                          className="flex flex-col gap-3 p-5 rounded-3xl border text-left cursor-pointer transition-all card-hover relative overflow-hidden group"
                          style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = proto.color; (e.currentTarget as HTMLButtonElement).style.background = `${proto.color}0a`; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-line)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-strong)"; }}
                          onClick={() => setTpSelectedProtocol(proto)}>
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${proto.color}18`, border: `1px solid ${proto.color}30` }}>
                              {proto.emoji}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: `${proto.color}18`, color: proto.color }}>{proto.duration} hafta</span>
                              <span className="text-[10px] text-(--color-text-muted) font-medium">{proto.frequency}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: proto.color }}>{proto.domain}</span>
                            <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0 mb-1.5 leading-tight">{proto.name}</h3>
                            <p className="text-(--color-text-muted) text-xs m-0 leading-relaxed line-clamp-2">{proto.description}</p>
                          </div>
                          <div className="pt-2 border-t border-(--color-line)">
                            <span className="text-[10px] text-(--color-text-muted) font-medium">👥 {proto.targetGroup}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    // Protocol detail view
                    <div className="space-y-5">
                      {/* Back + header */}
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setTpSelectedProtocol(null)}
                          className="flex items-center gap-1.5 text-xs font-bold cursor-pointer border-none px-3 py-1.5 rounded-xl transition-all"
                          style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
                          ← Protokoller
                        </button>
                      </div>

                      {/* Protocol header card */}
                      <div className="relative overflow-hidden rounded-3xl border p-6" style={{ background: `linear-gradient(135deg, ${tpSelectedProtocol.color}12 0%, var(--color-surface-strong) 100%)`, borderColor: `${tpSelectedProtocol.color}30` }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${tpSelectedProtocol.color}, transparent)` }} />
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: `${tpSelectedProtocol.color}18` }}>
                            {tpSelectedProtocol.emoji}
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: tpSelectedProtocol.color }}>{tpSelectedProtocol.domain} · {tpSelectedProtocol.duration} haftalık protokol</span>
                            <h2 className="text-lg font-extrabold text-(--color-text-strong) m-0 mb-2">{tpSelectedProtocol.name}</h2>
                            <p className="text-(--color-text-soft) text-sm m-0 mb-3">{tpSelectedProtocol.description}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>👥 {tpSelectedProtocol.targetGroup}</span>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>📅 {tpSelectedProtocol.frequency}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Week-by-week timeline */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-extrabold text-(--color-text-strong) tracking-tight">Haftalık Program</h3>
                        {tpSelectedProtocol.weeks.map((week) => (
                          <div key={week.week} className="relative flex gap-4 items-start">
                            {/* Timeline line */}
                            {week.week < tpSelectedProtocol.weeks.length && (
                              <div className="absolute left-5 top-11 bottom-0 w-0.5" style={{ background: "var(--color-line)" }} />
                            )}
                            {/* Week badge */}
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 z-10" style={{ background: `${tpSelectedProtocol.color}18`, color: tpSelectedProtocol.color, border: `1px solid ${tpSelectedProtocol.color}30` }}>
                              {week.week}
                            </div>
                            {/* Week content */}
                            <div className="flex-1 pb-4">
                              <div className="rounded-2xl border border-(--color-line) overflow-hidden" style={{ background: "var(--color-surface-strong)" }}>
                                <div className="px-4 py-3 border-b border-(--color-line)" style={{ background: `${tpSelectedProtocol.color}08` }}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-(--color-text-strong)">{week.focus}</span>
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: `${tpSelectedProtocol.color}20`, color: tpSelectedProtocol.color }}>
                                      Hedef: {week.targetScore}p
                                    </span>
                                  </div>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-2">🎮 Oyunlar</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {week.games.map(g => (
                                        <span key={g} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-soft)", border: "1px solid var(--color-line)" }}>
                                          {GAME_LABELS[g]}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-2">🧩 Aktiviteler</p>
                                    <div className="space-y-0.5">
                                      {week.activities.map(a => (
                                        <p key={a} className="text-xs text-(--color-text-soft) m-0">• {a}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Expected outcomes */}
                      <div className="rounded-2xl border border-(--color-line) p-4" style={{ background: "var(--color-surface-strong)" }}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-3">📊 Beklenen Çıktılar</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tpSelectedProtocol.outcomes.map(o => (
                            <div key={o} className="flex items-start gap-2">
                              <span className="text-xs shrink-0 mt-0.5" style={{ color: tpSelectedProtocol!.color }}>✓</span>
                              <span className="text-xs text-(--color-text-soft)">{o}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Apply button */}
                      <button type="button"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.99]"
                        style={{ background: `linear-gradient(135deg, ${tpSelectedProtocol.color}, var(--color-primary))`, boxShadow: `0 4px 20px ${tpSelectedProtocol.color}40` }}
                        onClick={() => {
                          setTpActiveTab("plan");
                          showToast(`📋 ${tpSelectedProtocol!.name} planı Haftalık Plan'a aktarıldı`, "success");
                          setTpSelectedProtocol(null);
                        }}>
                        <BookOpen size={15} /> Bu Protokolü Planla
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden" role="navigation" aria-label="Mobil gezinme" style={{ background: "var(--color-chrome-nav)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid var(--color-line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch h-16 px-2">
          {([
            { view: "dashboard" as AppView, Icon: LayoutDashboard, label: "Panel", gradient: "linear-gradient(135deg,#1d5a8c,#5b7183)", tooltip: "Ana Panel" },
            { view: "clients" as AppView, Icon: Users, label: "Danışanlar", gradient: "linear-gradient(135deg,#2a72ac,#b8503f)", tooltip: "Danışan Listesi" },
            { view: "games" as AppView, Icon: Gamepad2, label: "Oyunlar", gradient: "linear-gradient(135deg,#3f7d4f,#1d5a8c)", tooltip: "Oyun Seç" },
            { view: "therapy-program" as AppView, Icon: Stethoscope, label: "Terapi", gradient: "linear-gradient(135deg,#2a72ac,#1d5a8c)", tooltip: "Terapi Programı" },
            { view: "reports" as AppView, Icon: BarChart3, label: "Rapor", gradient: "linear-gradient(135deg,#b8763a,#a8392c)", tooltip: "Raporlar & Analitik" },
          ]).map(({ view, Icon, label, gradient, tooltip }) => {
            const isActive = activeAppView === view || (view === "clients" && activeAppView === "client-detail");
            return (
              <button
                key={view}
                type="button"
                data-tooltip={tooltip}
                data-tooltip-dir="top"
                aria-label={tooltip}
                aria-current={isActive ? "page" : undefined}
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
      <MilestoneContainer />
      <OnboardingTour />

      {/* ── Achievement Panel Modal ── */}
      {showAchievements && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }} onClick={() => setShowAchievements(false)}>
          {/*
            Geniş, iki sütunlu panel. Önceki hâli max-w-md idi; on iki rozet
            dar bir sütuna sıkışıyor, etiketler satır atlıyor ve hepsi kilitli
            gri ikonlar olarak görünüyordu.
          */}
          <div
            className="w-full max-w-3xl max-h-[86vh] flex flex-col rounded-2xl overflow-hidden"
            style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label="Başarımlar"
          >
            <header className="flex items-center gap-3 px-5 sm:px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--color-line)" }}>
              <Award size={17} className="shrink-0" style={{ color: "var(--color-signal)" }} />
              <h3 className="font-display text-base font-extrabold text-(--color-text-strong) m-0 tracking-tight flex-1">Başarımlar</h3>
              <button
                type="button"
                onClick={() => setShowAchievements(false)}
                aria-label="Kapat"
                className="w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer bg-transparent text-(--color-text-muted) hover:text-(--color-text-strong) hover:bg-(--color-surface-elevated) transition-colors"
              >
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5">
              <AchievementPanel stats={achievementStats} earned={earnedAchievements} onEarn={handleEarnAchievement} />
            </div>
          </div>
        </div>
      )}

      {/* ── Client Comparison Modal ── */}
      {showComparison && compareClientA && compareClientB && (() => {
        const cA = clientOptions.find(c => c.id === compareClientA);
        const cB = clientOptions.find(c => c.id === compareClientB);
        if (!cA || !cB) return null;
        return <ClientComparison clientA={cA} clientB={cB} sessions={platformOverview.recentSessions} onClose={() => setShowComparison(false)} />;
      })()}

      {/* ── Difficulty upgrade prompt ── */}
      {difficultyPrompt && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-3xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "rgba(29, 90, 140,0.35)", boxShadow: "0 0 60px rgba(29, 90, 140,0.2)" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#1d5a8c,#2a72ac,#5b7183)" }} />
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(29, 90, 140,0.15)" }}>
                  <TrendingUp size={20} style={{ color: "#4a95cc" }} />
                </div>
                <div>
                  <h3 className="font-extrabold text-(--color-text-strong) m-0 mb-1">Zorluk Artışı Önerisi</h3>
                  <p className="text-(--color-text-muted) text-sm m-0">
                    <strong className="text-(--color-text-body)">{difficultyPrompt.clientName}</strong> son 3 seansta tutarlı yüksek performans gösterdi.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: "rgba(29, 90, 140,0.08)", border: "1px solid rgba(29, 90, 140,0.2)" }}>
                <span className="text-2xl">📈</span>
                <div>
                  <p className="m-0 text-sm font-bold text-(--color-text-strong)">
                    Seviyeyi <span style={{ color: "#4a95cc" }}>{difficultyPrompt.suggestedLevel}</span>'a yükselt
                  </p>
                  <p className="m-0 text-xs text-(--color-text-muted)">Danışan profili güncellenecek, oyunlar buna göre ayarlanacak.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#1d5a8c,#2a72ac)" }}
                  onClick={() => void handleUpdateClientDifficulty(difficultyPrompt.clientId, difficultyPrompt.suggestedLevel)}>
                  Evet, güncelle
                </button>
                <button type="button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: "transparent", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }}
                  onClick={() => setDifficultyPrompt(null)}>
                  Şimdi değil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyboard Shortcut Guide ── */}
      {showShortcutGuide && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowShortcutGuide(false)}>
          <div className="w-full max-w-lg rounded-3xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "rgba(29, 90, 140,0.3)", boxShadow: "0 0 80px rgba(29, 90, 140,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#1d5a8c,#2a72ac,#5b7183)" }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-(--color-text-strong) m-0 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: "rgba(29, 90, 140,0.15)", color: "#4a95cc" }}>?</span>
                  Klavye Kısayolları
                </h3>
                <button type="button" className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer border-none text-(--color-text-muted) hover:text-(--color-text-body) transition-colors" style={{ background: "var(--color-surface)" }} onClick={() => setShowShortcutGuide(false)}>✕</button>
              </div>
              {([
                { section: "Genel", rows: [
                  { keys: ["?"], desc: "Kısayol rehberini aç / kapat" },
                  { keys: ["Esc"], desc: "Açık pencereyi kapat" },
                ] },
                { section: "Oyun Ekranı", rows: [
                  { keys: ["A"], desc: "Önceki oyuna geç" },
                  { keys: ["B"], desc: "Sonraki oyuna geç" },
                  { keys: ["↑", "↓", "←", "→"], desc: "Seçimi hareket ettir" },
                  { keys: ["Enter", "Boşluk"], desc: "Seçimi onayla / oyunu başlat" },
                ] },
              ] as { section: string; rows: { keys: string[]; desc: string }[] }[]).map(({ section, rows }) => (
                <div key={section} className="mb-4 last:mb-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-2">{section}</p>
                  <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--color-line)" }}>
                    {rows.map(({ keys, desc }, i) => (
                      <div key={desc} className="flex items-center justify-between px-4 py-2.5 gap-4" style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-line)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.08)" }}>
                        <span className="text-sm text-(--color-text-body)">{desc}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {keys.map(k => (
                            <kbd key={k} className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(29, 90, 140,0.12)", color: "#4a95cc", border: "1px solid rgba(29, 90, 140,0.25)", fontFamily: "monospace" }}>{k}</kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-(--color-text-muted) text-center m-0 mt-3">Herhangi bir yere tıklayarak kapat</p>
            </div>
          </div>
        </div>
      )}

      {/* Profil düzenleme — görünümden bağımsız, üst seviyede.
          Önceden `activeAppView === "clients"` bloğunun içindeydi; sidebar'daki
          "Profili düzenle" düğmesi diğer sekmelerde sessizce hiçbir şey yapmıyordu. */}
      {showEditTherapist && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowEditTherapist(false)}>
          <div className="rounded-2xl sm:rounded-3xl border p-5 sm:p-6 max-w-sm w-full space-y-4" style={{ background: "var(--color-surface-strong)", borderColor: "rgba(29, 90, 140,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(29, 90, 140,0.15)" }}>
                  <Edit2 size={18} style={{ color: "#4a95cc" }} />
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
            {!activeTherapistId && (
              <div className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
                style={{ background: "color-mix(in srgb, var(--color-accent-amber) 10%, transparent)", color: "var(--color-text-body)", border: "1px solid color-mix(in srgb, var(--color-accent-amber) 30%, transparent)" }}>
                Oturum bilgisi okunamadı, bu yüzden kayıt yapılamaz. Çıkış yapıp
                yeniden giriş yaptıktan sonra tekrar deneyin.
              </div>
            )}
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
                disabled={!activeTherapistId || !therapistEditDraft.displayName.trim() || savingTherapist}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed"
                style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
                onClick={() => void handleUpdateTherapist()}>
                {savingTherapist ? "Kaydediliyor…" : "Kaydet"}
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
    </main>
  );
}

