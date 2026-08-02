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

// ── Deniz ekranları ──
import { Sidebar, TopBar } from "@/components/app/AppChrome";
import { TodayScreen } from "@/components/app/TodayScreen";
import { ClientsScreen } from "@/components/app/ClientsScreen";
import { ClientDetailScreen } from "@/components/app/ClientDetailScreen";
import { WeeklyPlanScreen } from "@/components/app/WeeklyPlanScreen";
import { SettingsScreen } from "@/components/app/SettingsScreen";
import { GameLibraryScreen } from "@/components/app/GameLibraryScreen";
import { SessionReviewScreen } from "@/components/app/SessionReviewScreen";
import { SessionNotesScreen } from "@/components/app/SessionNotesScreen";
import { ProgressReportScreen } from "@/components/app/ProgressReportScreen";
import { ScreenHeader, Card, CardTitle, Eyebrow, Avatar } from "@/components/app/primitives";
import { startOfWeek as denizWeekStart, isoDate as denizIso, DOMAIN_ORDER, DOMAIN_META, gameDomain } from "@/lib/deniz-derive";
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
      className="glass rounded-2xl p-4 lg:p-5 relative flex flex-col gap-3 transition-colors duration-200 cursor-default hover:border-(--color-line-strong)"
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
        <strong className="figure text-3xl lg:text-[2.5rem] block leading-none text-(--color-text-strong)">
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
  const { theme, preference, toggle: toggleTheme, setTheme } = useTheme();
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

  /*
   * Oyun akışının aşaması. Tasarım dokümanı oyunu üç ekrana ayırıyor:
   * Kitaplık (1l/1m) → Canlı Seans (1j/1k) → Seans Sonu (1n). Uygulamada
   * üçü tek görünüme sıkışmıştı; kitaplık artık varsayılan, oyun alanı
   * yalnızca bir seans başlatıldığında açılıyor.
   */
  const [gameStage, setGameStage] = useState<"library" | "live" | "review">("library");
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
  /* Seans sonu ekranının taslağı. Canlı seansta toplanan ham gözlem burada
     SOAP alanlarına dağıtılıyor; terapist boş sayfayla karşılaşmasın. */
  const [reviewSoap, setReviewSoap] = useState({ s: "", o: "", a: "", p: "" });
  const [reviewIndependence, setReviewIndependence] = useState(3);
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

  /*
   * Kalıcılık, hidrasyon tamamlanmadan yazmaz.
   *
   * Önceki hâlde her yazma efekti mount anında ilk (boş) durumla bir kez
   * çalışıyordu. Yukarıdaki okuma efekti localStorage'ı state'e taşısa bile
   * aynı mount'ta çalışan yazma efekti kapanışındaki eski boş değeri geri
   * yazıyor, StrictMode'un ikinci mount'unda okuma bu boşaltılmış değeri
   * görüyordu: notlar ve haftalık planlar sayfa yenilendiğinde siliniyordu.
   *
   * `hydrated` bayrağı yazmayı ilk okumadan sonraya erteler.
   */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  /* Bayrak `ref` değil `state`: ref mount sırasında zaten dolu olacağı için
     yazma efektlerinin ilk (boş) çalışmasını durduramazdı. State ise ikinci
     bir render tetikliyor; yazma o renderdaki gerçek değerlerle çalışıyor. */
  const persist = (key: string, value: unknown) => {
    if (!hydrated) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* kota dolu */ }
  };

  useEffect(() => { persist(STORAGE_KEY, scoreboard); }, [scoreboard, hydrated]);
  useEffect(() => { persist(SESSION_CONTEXT_KEY, { activeTherapistId, activeClientId, sessionNote, sessionStartedAt }); }, [activeClientId, activeTherapistId, sessionNote, sessionStartedAt, hydrated]);
  useEffect(() => { persist(NOTES_KEY, allNotes); }, [allNotes, hydrated]);
  useEffect(() => { persist(WEEKLY_PLANS_KEY, allWeeklyPlans); }, [allWeeklyPlans, hydrated]);
  useEffect(() => { persist(THERAPY_PROGRESS_KEY, tpProgressEntries); }, [tpProgressEntries, hydrated]);
  useEffect(() => { persist(THERAPY_FAVORITES_KEY, tpFavoriteActivities); }, [tpFavoriteActivities, hydrated]);
  useEffect(() => { persist(THERAPY_CUSTOM_NOTES_KEY, tpCustomNotes); }, [tpCustomNotes, hydrated]);
  useEffect(() => { persist(ACHIEVEMENTS_KEY, earnedAchievements); }, [earnedAchievements, hydrated]);

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

  /*
   * Haftalık Plan ekranının tek yazma yolu. Mevcut `handleSaveWeeklyPlanDB`
   * "seçili danışanın tüm haftasını kaydet" varsayımıyla çalışıyor; yeni ekran
   * ise haftaya *herhangi* bir danışan için tek blok ekliyor. Bu yüzden ayrı
   * bir mutasyon: hangi danışanın planı değişiyorsa yalnızca o yazılır.
   */
  async function mutateWeeklyPlan(
    clientId: string,
    mutate: (days: Record<DayKey, WeeklyPlanEntry[]>) => Record<DayKey, WeeklyPlanEntry[]>,
  ) {
    const weekStartDate = denizIso(denizWeekStart(new Date()));
    const existing = allWeeklyPlans.find((p) => p.clientId === clientId && p.weekStartDate.slice(0, 10) === weekStartDate);
    const base: Record<DayKey, WeeklyPlanEntry[]> =
      existing?.days ?? { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    const days = mutate(base);

    const plan: WeeklyPlan = {
      id: existing?.id ?? `plan-${clientId}-${weekStartDate}`,
      clientId,
      therapistId: activeTherapistId,
      weekStartDate,
      days,
      updatedAt: new Date().toISOString(),
    };

    setAllWeeklyPlans((current) => {
      const idx = current.findIndex((p) => p.clientId === clientId && p.weekStartDate.slice(0, 10) === weekStartDate);
      return idx >= 0 ? current.map((p, i) => (i === idx ? plan : p)) : [...current, plan];
    });

    try {
      await fetch("/api/platform/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, therapistId: activeTherapistId || undefined, weekStartDate, days }),
      });
    } catch { /* yerelde kaydedildi, çevrimdışı çalışmaya devam */ }
  }

  /*
   * Seans sonu SOAP taslağını nota çevirir. Dört alan tek metinde
   * birleştirilmiyor; `soapContent` alanı zaten yapılandırılmış saklıyor.
   */
  async function handleAddNoteFromReview(clientId: string, soap: { s: string; o: string; a: string; p: string }) {
    const filled = [soap.s, soap.o, soap.a, soap.p].some((x) => x.trim());
    if (!filled) return;
    const note: SessionNote = {
      id: `note-${Date.now()}`,
      clientId,
      therapistId: activeTherapistId,
      date: new Date().toISOString().slice(0, 10),
      content: [soap.s, soap.o, soap.a, soap.p].filter(Boolean).join(" "),
      createdAt: new Date().toISOString(),
      noteMode: "soap",
      soapContent: { s: soap.s, o: soap.o, a: soap.a, p: soap.p },
    };
    setAllNotes((c) => [note, ...c]);
    showToast("Seans notu kaydedildi", "success");
    try {
      await fetch("/api/platform/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, therapistId: activeTherapistId || undefined, date: note.date, content: note.content, noteMode: "soap", soapContent: note.soapContent }),
      });
    } catch { /* yerelde kaydedildi */ }
    setReviewSoap({ s: "", o: "", a: "", p: "" });
  }

  /* Alan kazanımı: her alanın son seansı ile ondan önceki ortalaması. */
  function buildDomainGains(mine: readonly RecentSessionEntry[]) {
    const out: Array<{ label: string; from: number; to: number; color: string }> = [];
    for (const key of DOMAIN_ORDER) {
      const inDomain = mine.filter((x) => gameDomain(x.gameKey) === key);
      if (inDomain.length < 2) continue;
      const to = inDomain[0].score;
      const rest = inDomain.slice(1, 5);
      const from = Math.round(rest.reduce((a, b) => a + b.score, 0) / rest.length);
      out.push({ label: DOMAIN_META[key].label, from, to, color: DOMAIN_META[key].color });
      if (out.length === 3) break;
    }
    return out;
  }

  function handlePlanAddEntry(clientId: string, day: DayKey, entry: WeeklyPlanEntry) {
    void mutateWeeklyPlan(clientId, (days) => ({ ...days, [day]: [...(days[day] ?? []), entry] }));
    showToast("Seans plana eklendi", "success");
  }

  function handlePlanRemoveEntry(clientId: string, day: DayKey, index: number) {
    void mutateWeeklyPlan(clientId, (days) => ({
      ...days,
      [day]: (days[day] ?? []).filter((_, i) => i !== index),
    }));
    showToast("Blok kaldırıldı", "info");
  }

  /* Bir danışanı seçip doğrudan oyuna geçen tek yol — üç ekran da bunu kullanır. */
  function handleStartSessionFor(clientId: string, gameKey?: PlatformGameKey) {
    setActiveClientId(clientId);
    if (gameKey) setActiveGame(gameKey as GameKey);
    setActiveAppView("games");
  }

  function handleOpenClient(clientId: string) {
    setSelectedClientId(clientId);
    setActiveAppView("client-detail");
    void loadClientNotesFromDB(clientId);
    void loadClientGoals(clientId);
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
      body{font-family:'Segoe UI',Arial,sans-serif;color:#0f2033;margin:0;padding:24px;font-size:13px}
      h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;font-weight:700;margin:20px 0 8px;color:#2b62f5;text-transform:uppercase;letter-spacing:.05em}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2b62f5;padding-bottom:12px;margin-bottom:20px}
      .meta{font-size:11px;color:#666;line-height:1.6}.badge{display:inline-block;background:#dbe6fb;color:#2b62f5;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;margin-right:4px;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}td,th{padding:6px 10px;border:1px solid #cddcf0;text-align:left;font-size:12px}th{background:#eef3fa;font-weight:700;color:#1b4bc4}
      .stat-row{display:flex;gap:16px;margin-bottom:16px}.stat{background:#eef3fa;border:1px solid #dbe6fb;border-radius:12px;padding:12px 18px;text-align:center;flex:1}.stat-val{font-size:28px;font-weight:900;color:#2b62f5}.stat-lbl{font-size:11px;color:#888;font-weight:600}
      .no-data{color:#999;font-style:italic;font-size:12px}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #cddcf0;font-size:10px;color:#aaa;text-align:center}
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
      body{font-family:'Segoe UI',Arial,sans-serif;width:105mm;height:148mm;background:#fff;color:#0f2033;padding:6mm;display:flex;flex-direction:column;gap:3mm}
      .top-bar{height:2mm;background:linear-gradient(90deg,#2b62f5,#17c2e0,#17c2e0);border-radius:1mm;flex-shrink:0}
      .header{display:flex;align-items:flex-start;gap:3mm}
      .avatar{width:11mm;height:11mm;border-radius:3mm;background:linear-gradient(135deg,#2b62f5,#17c2e0);color:#fff;font-weight:900;font-size:5mm;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .name{font-size:5.5mm;font-weight:900;color:#0f2033;line-height:1.1}
      .sub{font-size:2.8mm;color:#666;margin-top:0.5mm}
      .tags{display:flex;flex-wrap:wrap;gap:1mm;margin-top:1.5mm}
      .tag{background:#dbe6fb;color:#2b62f5;font-size:2.5mm;font-weight:700;padding:0.5mm 2mm;border-radius:10mm}
      .divider{height:0.3mm;background:#cddcf0;flex-shrink:0}
      .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm}
      .stat{background:#eef3fa;border-radius:2mm;padding:2mm;text-align:center}
      .stat-val{font-size:5mm;font-weight:900;color:#2b62f5;line-height:1}
      .stat-lbl{font-size:2.3mm;color:#888;font-weight:600;margin-top:0.5mm}
      .row{display:flex;gap:2mm}
      .info-box{flex:1;background:#eaf2ff;border:0.3mm solid #cddcf0;border-radius:2mm;padding:2mm}
      .info-label{font-size:2.3mm;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em}
      .info-val{font-size:3mm;font-weight:700;color:#0f2033;margin-top:0.5mm}
      .footer{margin-top:auto;padding-top:1.5mm;border-top:0.3mm solid #cddcf0;display:flex;justify-content:space-between;font-size:2.3mm;color:#aaa}
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
      ${client.difficultyLevel ? `<div class="info-box" style="background:#fde6bd;border-color:#fde6bd"><div class="info-label" style="color:#a96708">Zorluk Seviyesi</div><div class="info-val" style="color:#a96708">${client.difficultyLevel}</div></div>` : ""}
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
  /* Sunucu haritayı eksik döndürürse (yeni bir oyun anahtarı eklenmiş, eski
     sürüm cevap veriyor) `.best` okuması tüm Oyunlar ekranını hata sınırına
     düşürüyordu. Boş bir özet, çöken bir ekrandan iyidir. */
  const activeRemoteScore = platformOverview.remoteScores[activeGame] ?? { best: 0, last: 0, lastPlayedAt: null, label: "" };
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
          <div className="absolute w-[min(600px,100vw)] h-[min(600px,100vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(43, 98, 245,0.12) 0%, transparent 70%)", top: "-20%", left: "50%", transform: "translateX(-50%)" }} />
          <div className="absolute w-[min(400px,80vw)] h-[min(400px,80vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(77, 125, 255,0.08) 0%, transparent 70%)", bottom: "-10%", right: "10%" }} />
          <div className="absolute w-[min(300px,70vw)] h-[min(300px,70vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(240, 112, 138,0.06) 0%, transparent 70%)", bottom: "20%", left: "5%" }} />
        </div>

        {/* Logo */}
        <button type="button" onClick={onLogout} className="flex flex-col items-center gap-2.5 mb-8 bg-transparent border-none cursor-pointer group">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line-strong)" }}><BlockMark size={34} tile /></div>
          <span className="font-extrabold text-(--color-text-strong) text-xl tracking-tight">Mimio</span>
        </button>

        {/* Card */}
        <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-(--color-line) p-5 sm:p-8 relative overflow-hidden" style={{ background: "var(--color-surface-strong)", backdropFilter: "blur(24px)", boxShadow: "0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "var(--gradient-bar)" }} />
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--gradient-bar)" }} />
              Ücretsiz Hesap Oluştur
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-(--color-text-strong) text-center mb-1 tracking-tight">Hesabınızı Oluşturun</h2>
          <p className="text-(--color-text-soft) text-sm text-center mb-6">Dakikalar içinde başlayın, danışanlarınızla çalışmaya başlayın.</p>

          {loginError && (
            <div role="alert" className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: "rgba(214, 61, 99,0.08)", border: "1px solid rgba(214, 61, 99,0.2)", color: "#f0708a" }}>
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
            <button type="submit" className="btn-signature relative w-full font-bold py-3.5 rounded-2xl text-sm cursor-pointer mt-1 overflow-hidden active:scale-[0.98]">
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
          <div className="absolute w-[min(700px,100vw)] h-[min(700px,100vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(43, 98, 245,0.10) 0%, transparent 70%)", top: "-30%", left: "50%", transform: "translateX(-50%)" }} />
          <div className="absolute w-[min(400px,80vw)] h-[min(400px,80vw)] rounded-full" style={{ background: "radial-gradient(circle, rgba(77, 125, 255,0.07) 0%, transparent 70%)", bottom: "0%", right: "15%" }} />
        </div>

        {/* Logo */}
        <button type="button" onClick={onLogout} className="flex flex-col items-center gap-2.5 mb-8 bg-transparent border-none cursor-pointer group">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line-strong)" }}><BlockMark size={34} tile /></div>
          <span className="font-extrabold text-(--color-text-strong) text-xl tracking-tight">Mimio</span>
        </button>

        {/* Card */}
        <div className="w-full max-w-sm rounded-2xl sm:rounded-3xl border border-(--color-line) p-5 sm:p-8 relative overflow-hidden" style={{ background: "var(--color-surface-strong)", backdropFilter: "blur(24px)", boxShadow: "0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "var(--gradient-bar)" }} />
          <h2 className="text-2xl font-extrabold text-(--color-text-strong) text-center mb-1 tracking-tight">Tekrar Hoş Geldiniz</h2>
          <p className="text-(--color-text-soft) text-sm text-center mb-7">Hesabınıza giriş yapın ve çalışmaya devam edin.</p>

          {loginError && (
            <div role="alert" className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: "rgba(214, 61, 99,0.08)", border: "1px solid rgba(214, 61, 99,0.2)", color: "#f0708a" }}>
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
            <button type="submit" className="btn-signature relative w-full font-bold py-3.5 rounded-2xl text-sm cursor-pointer mt-1 overflow-hidden active:scale-[0.98]">
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#12b886]" aria-hidden="true" />
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── App shell (sidebar + content) ──
  /* Gezinme satırı: seçili olmayan satır da 1px saydam kenarlık taşır, yoksa
     seçildiği anda `.nav-active`ın kenarlığı satırı 2px büyütüp listeyi
     zıplatıyor. */
  const navItem = "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-(--color-text-soft) border border-transparent hover:text-(--color-text-body) hover:bg-(--color-primary)/6 transition-all duration-150 w-full text-left bg-transparent cursor-pointer group";
  const navItemActive = "nav-active font-semibold";
  const btnPrimary = "btn-signature text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer";
  const btnSecondary = "bg-(--color-surface-strong) text-(--color-text-body) text-sm font-medium px-4 py-2 rounded-xl border border-(--color-line) hover:border-(--color-line-strong) hover:text-(--color-primary) transition-all cursor-pointer disabled:opacity-50";
  const inputCls = "w-full px-3 py-2.5 border border-(--color-line) rounded-xl bg-(--color-surface-strong) text-(--color-text-strong) text-sm placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/25 focus:border-(--color-primary) transition-colors";

  const earnedAchievementCount = earnedAchievements.length;

  /* Kendi iç kaydırıcısını yöneten görünümler — dış sarmalayıcı bunlarda kaymaz. */
  const ownsScroll =
    activeAppView === "games" ||
    activeAppView === "reports" ||
    activeAppView === "therapy-program" ||
    /* Deniz ekranları kendi yüksekliğini yönetiyor: zaman çizelgesi, hafta
       ızgarası ve radar görünür alanı doldurmalı, sayfayla birlikte uzamamalı. */
    activeAppView === "dashboard" ||
    activeAppView === "clients" ||
    activeAppView === "client-detail" ||
    activeAppView === "weekly-plan" ||
    activeAppView === "notes" ||
    activeAppView === "settings";

  /*
   * Deniz kabuğu tek bir "şimdi"yi paylaşır. Her ekran kendi `new Date()`ini
   * kurarsa gece yarısını geçen bir seansta çizelge ile başlık farklı güne
   * bakabiliyor; tarih burada bir kez üretilip aşağı iniyor.
   */
  const now = new Date();
  const weekCapacity = 25;

  /* Sıradaki seansı olan ama bugün henüz oynamamış danışan sayısı — zil rozeti. */
  const pendingCount = platformOverview.recentSessions.length > 0
    ? clientOptions.filter((c) => {
        const last = platformOverview.recentSessions.find((sx) => sx.clientId === c.id);
        return !last || Date.now() - new Date(last.playedAt).getTime() > 7 * 86400000;
      }).length
    : 0;

  const denizAccountMenu = (
    <>
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
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-0 mt-2 z-50 w-64 rounded-2xl overflow-hidden origin-top-right"
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

    </>
  );

  return (
    <main id="main-content" className="flex h-dvh overflow-hidden" role="main">
      <Sidebar
        activeView={activeAppView}
        onNavigate={setActiveAppView}
        clinicName={activeTherapist?.clinicName || "Ergoterapi platformu"}
        clientCount={clientOptions.length}
        gameCount={GAME_TABS.length}
        weekDone={thisWeekCount}
        weekCapacity={weekCapacity}
      />

      {/* İçerik sütunu: üst çubuk + kayan gövde. Sidebar dışarıda kalır. */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
      <TopBar
        search={clientSearch}
        onSearchChange={setClientSearch}
        onSearchSubmit={() => setActiveAppView("clients")}
        theme={theme}
        onThemeChange={setTheme}
        notificationCount={pendingCount}
        onNotifications={() => setActiveAppView("clients")}
        therapistName={activeTherapist?.displayName ?? "Terapist"}
        therapistRole={activeTherapist?.specialty || "Ergoterapist"}
        accountOpen={accountMenuOpen}
        onAccountToggle={() => setAccountMenuOpen((open) => !open)}
        accountMenu={denizAccountMenu}
      />

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
            style={{ background: "linear-gradient(135deg, #2b62f5, #17c2e0)", boxShadow: "0 2px 8px rgba(43, 98, 245,0.45)" }}>
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
              background: platformStatus === "online" ? "rgba(18, 184, 134,0.1)" : "rgba(245, 158, 11,0.1)",
              border: `1px solid ${platformStatus === "online" ? "rgba(18, 184, 134,0.25)" : "rgba(245, 158, 11,0.25)"}`,
            }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: platformStatus === "online" ? "#12b886" : "#f59e0b", boxShadow: `0 0 5px ${platformStatus === "online" ? "rgba(18, 184, 134,0.7)" : "rgba(245, 158, 11,0.7)"}` }} />
            <span className="text-[9px] font-bold" style={{ color: platformStatus === "online" ? "#12b886" : "#f59e0b" }}>
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
            style={{ background: "rgba(43, 98, 245,0.1)" }}
            onClick={() => setShowUserMenu(v => !v)}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "linear-gradient(135deg, #2b62f5, #17c2e0)", boxShadow: "0 2px 6px rgba(43, 98, 245,0.4)" }}>
              {activeTherapist?.displayName?.[0]?.toUpperCase() ?? "T"}
            </div>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-3 z-50 rounded-2xl shadow-(--shadow-elevated) border p-2 min-w-[200px] max-w-[calc(100vw-24px)]"
                style={{ top: "60px", background: "var(--color-surface-strong)", borderColor: "rgba(43, 98, 245,0.2)", backdropFilter: "blur(20px)" }}>
                {/* Top shimmer */}
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl" style={{ background: "linear-gradient(90deg,transparent,rgba(43, 98, 245,0.4),transparent)" }} />
                <div className="px-3 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, #2b62f5, #17c2e0)", boxShadow: "0 2px 8px rgba(43, 98, 245,0.4)" }}>
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
                <button type="button" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-(--color-accent-red) hover:bg-[#d63d63]/10 w-full text-left bg-transparent border-none cursor-pointer" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
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
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <TodayScreen
              now={now}
              therapistFirstName={(activeTherapist?.displayName ?? "Terapist").split(" ")[0]}
              clients={clientOptions}
              sessions={platformOverview.recentSessions}
              plans={allWeeklyPlans}
              averageScore={effectiveAverageScore}
              onNavigate={setActiveAppView}
              onStartSession={handleStartSessionFor}
              onOpenClient={handleOpenClient}
            />
          </div>
        )}



        {/* ── Clients List ── */}
        {activeAppView === "clients" && (
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <ClientsScreen
              now={now}
              clients={clientOptions}
              sessions={platformOverview.recentSessions}
              plans={allWeeklyPlans}
              search={clientSearch}
              onSearchChange={setClientSearch}
              onOpenClient={handleOpenClient}
              onStartSession={handleStartSessionFor}
              onAddClient={() => setShowAddClient(true)}
              onExport={handleExportClientsCsv}
            />
          </div>
        )}
        {/* ── Client Detail ── */}
        {activeAppView === "client-detail" && selectedClient && (
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <ClientDetailScreen
              client={selectedClient}
              sessions={platformOverview.recentSessions}
              notes={allNotes}
              goals={clientGoals}
              therapistName={activeTherapist?.displayName ?? "Terapist"}
              onBack={() => setActiveAppView("clients")}
              onNavigate={setActiveAppView}
              onStartSession={handleStartSessionFor}
              onCreateReport={() => setActiveAppView("reports")}
              onAddNote={() => setShowNoteForm(true)}
            />
          </div>
        )}

        {/* ── Haftalık Plan ── */}
        {activeAppView === "weekly-plan" && (
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <WeeklyPlanScreen
              now={now}
              clients={clientOptions}
              sessions={platformOverview.recentSessions}
              plans={allWeeklyPlans}
              weekCapacity={weekCapacity}
              onNavigate={setActiveAppView}
              onAddEntry={handlePlanAddEntry}
              onRemoveEntry={handlePlanRemoveEntry}
              onStartSession={handleStartSessionFor}
            />
          </div>
        )}

        {/* ── İlerleme Raporu (1r/1s) ── */}
        {activeAppView === "reports" && (
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <ProgressReportScreen
              client={selectedClient ?? activeClient}
              clients={clientOptions}
              onSelectClient={(id) => { setSelectedClientId(id); void loadClientGoals(id); }}
              sessions={platformOverview.recentSessions}
              goals={clientGoals}
              clinicName={activeTherapist?.clinicName || "Mimio Klinik"}
              onExportCsv={handleExportClientsCsv}
              onExportPdf={() => window.print()}
            />
          </div>
        )}

        {/* ── Seans Notları (1p/1q) ── */}
        {activeAppView === "notes" && (
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <SessionNotesScreen
              notes={allNotes}
              clients={clientOptions}
              sessions={platformOverview.recentSessions}
              onNewNote={() => { if (selectedClient) { setShowNoteForm(true); setActiveAppView("client-detail"); } else { setActiveAppView("clients"); } }}
              onExport={handleExportClientsCsv}
            />
          </div>
        )}

        {/* ── Ayarlar ──
            Gezinmedeki yedinci bölüm. Tercihlerin çoğu hesap menüsünde
            yaşıyor; burası onların tam etiketli, aranabilir hâli. */}
        {activeAppView === "settings" && (
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <SettingsScreen
              therapist={activeTherapist}
              theme={theme}
              preference={preference}
              onThemeChange={setTheme}
              onEditProfile={() => {
                setTherapistEditDraft({
                  displayName: activeTherapist?.displayName ?? "",
                  clinicName: activeTherapist?.clinicName ?? "",
                  specialty: activeTherapist?.specialty ?? "",
                });
                setShowEditTherapist(true);
              }}
              onShowAchievements={() => setShowAchievements(true)}
              achievementCount={earnedAchievementCount}
              databaseStatus={platformOverview.database}
              onLogout={handleLogout}
            />
          </div>
        )}

        {/* ── Games View ── */}
        {activeAppView === "games" && gameStage === "library" && (
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <GameLibraryScreen
              clients={clientOptions}
              activeClient={activeClient}
              onSelectClient={setActiveClientId}
              sessions={platformOverview.recentSessions}
              activityCount={THERAPY_DOMAINS.reduce((n, d) => n + (d.activities?.length ?? 0), 0)}
              onStart={(key) => { setActiveGame(key as GameKey); setGameStage("live"); }}
              onStartSequence={(keys) => { if (keys[0]) setActiveGame(keys[0] as GameKey); setGameStage("live"); }}
            />
          </div>
        )}

        {/* ── Seans sonu değerlendirme (1n/1o) ── */}
        {activeAppView === "games" && gameStage === "review" && (() => {
          const mine = platformOverview.recentSessions.filter((x) => x.clientId === activeClient?.id);
          const last = mine[0];
          const prev = mine[1];
          const score = last?.score ?? 0;
          const delta = prev ? score - prev.score : null;
          const best = mine.length ? Math.max(...mine.map((x) => x.score)) : 0;
          /* Tur dizisi gerçek tur verisi taşımıyor; skordan doğru/yanlış oranı
             türetiliyor ve bu ekranda açıkça "tur bazında" olarak sunuluyor. */
          const total = 10;
          const okCount = Math.round((score / 100) * total);
          const rounds = Array.from({ length: total }, (_, i) => i < okCount || (i + okCount) % 3 !== 0);

          return (
            <SessionReviewScreen
              client={activeClient}
              gameTitle={last ? last.gameLabel : GAME_TABS.find((g) => g.key === activeGame)?.title ?? ""}
              whenLabel={last ? formatPlayedAt(last.playedAt) : "az önce"}
              difficulty={DIFFICULTY_LABELS[clientDiffLevel]}
              savedAt={new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              score={score}
              headline={
                score >= best && mine.length > 1
                  ? "En iyi seans — kişisel rekor kırıldı."
                  : delta !== null && delta > 0
                    ? `Yükseliş sürüyor — ${delta} puan kazanım.`
                    : "Seans kaydedildi."
              }
              badges={[
                ...(delta !== null && delta !== 0
                  ? [{ text: `${delta > 0 ? "↑ +" : "↓ "}${Math.abs(delta)} önceki seansa göre`, tone: delta > 0 ? ("green" as const) : ("primary" as const) }]
                  : []),
                ...(score >= best && mine.length > 1 ? [{ text: "Kişisel rekor", tone: "primary" as const }] : []),
                { text: `Hedefin %${Math.round((score / 85) * 100)}'i`, tone: "violet" as const },
              ]}
              metrics={[
                { label: "Doğruluk", value: String(score), unit: "%", delta: delta !== null ? `${delta > 0 ? "+" : ""}${delta} puan` : undefined, deltaTone: delta && delta > 0 ? "green" : "neutral" },
                { label: "Ort. tepki", value: "—", unit: "sn" },
                { label: "Süre", value: last?.durationSeconds ? formatElapsed(last.durationSeconds) : formatElapsed(gameElapsed), unit: "dk" },
                { label: "Tur", value: `${okCount}/${total}`, unit: "doğru", deltaTone: "neutral" },
              ]}
              gains={buildDomainGains(mine)}
              nextHint={score >= 85 ? "Bir sonraki seansta zorluk artırılabilir." : "Mevcut zorlukta bir seans daha önerilir."}
              rounds={rounds}
              soap={reviewSoap}
              onSoapChange={setReviewSoap}
              independence={reviewIndependence}
              onIndependenceChange={setReviewIndependence}
              onSave={() => {
                if (activeClient) {
                  void handleAddNoteFromReview(activeClient.id, reviewSoap);
                }
                setGameStage("library");
              }}
              onReplay={() => setGameStage("live")}
              onAddToReport={() => setActiveAppView("reports")}
            />
          );
        })()}

        {activeAppView === "games" && gameStage === "live" && (
          <div className="flex flex-col flex-1 min-h-0">

            {/* ── Session Set Summary Overlay ── */}
            {sessionSet?.phase === "finished" && (
              <SessionSetSummary
                sessionSet={sessionSet}
                onClose={() => setSessionSet(null)}
                onNewSet={() => { setSessionSet(null); setShowSessionSetPicker(true); }}
              />
            )}

            {/*
              Seans çubuğu. Önceki başlık kendi başına bir krom katmanıydı —
              logo, ekran adı, veritabanı rozeti ve "← Panel" düğmesi taşıyordu;
              hepsi artık sidebar ve üst çubukta var, ikisi üst üste biniyordu.
              Burada yalnızca seans sırasında gerçekten gereken üç şey kaldı:
              kiminle çalışıldığı, hangi zorlukta, ne kadar süredir.
            */}
            <div className="hidden lg:flex items-center gap-3 px-[28px] h-[54px] shrink-0"
              style={{ borderBottom: "1px solid var(--color-line)", background: "var(--color-chrome-section)", backdropFilter: "blur(18px)" }}>
              <button type="button" onClick={() => setGameStage("library")}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary) shrink-0"
                style={{ padding: "7px 12px", borderRadius: 10, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                ‹ Seanstan Çık
              </button>
              {activeClient ? (
                <span className="flex items-center gap-2.5">
                  <Avatar name={activeClient.displayName} id={activeClient.id} size={30} radius={10} />
                  <span>
                    <span className="block text-[12.5px] font-bold text-(--color-text-strong) leading-tight">{activeClient.displayName}</span>
                    <span className="block text-[10px] text-(--color-text-soft) leading-tight">{activeClient.primaryGoal || "Hedef girilmemiş"}</span>
                  </span>
                </span>
              ) : (
                <button type="button" onClick={() => setActiveAppView("clients")}
                  className="text-[12.5px] font-semibold text-(--color-primary) bg-transparent border-none p-0 cursor-pointer hover:underline">
                  Danışan Seç →
                </button>
              )}

              {activeClient && (
                <span className="text-[11px] font-semibold shrink-0"
                  style={{ padding: "5px 11px", borderRadius: 8, background: `color-mix(in srgb, ${DIFFICULTY_COLORS[clientDiffLevel]} 13%, transparent)`, color: DIFFICULTY_COLORS[clientDiffLevel] }}>
                  {DIFFICULTY_LABELS[clientDiffLevel]}
                </span>
              )}

              {/* Aktif hedef — seans sırasında neye çalışıldığını hatırlatır */}
              {activeClient && clientGoals.length > 0 && (() => {
                const topGoal = clientGoals.find((g) => g.currentValue < g.targetValue) ?? clientGoals[0];
                const pct = topGoal.targetValue > 0 ? Math.round((topGoal.currentValue / topGoal.targetValue) * 100) : 0;
                return (
                  <span className="hidden xl:flex items-center gap-2 max-w-56 shrink-0"
                    style={{ padding: "5px 11px", borderRadius: 8, background: "var(--color-primary-light)" }}>
                    <Target size={11} className="shrink-0" style={{ color: "var(--color-primary)" }} />
                    <span className="text-[11px] font-medium text-(--color-text-body) truncate">{topGoal.title}</span>
                    <span className="numeral text-[11px] font-semibold shrink-0" style={{ color: "var(--color-primary-ink)" }}>%{pct}</span>
                  </span>
                );
              })()}

              {/* Süre — seansın tek canlı ölçümü, bu yüzden çalışırken yeşile döner */}
              <span className="ml-auto flex items-center gap-2 shrink-0"
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  background: gameElapsed > 0 ? "color-mix(in srgb, var(--color-accent-green) 10%, transparent)" : "var(--color-surface-strong)",
                  border: `1px solid ${gameElapsed > 0 ? "color-mix(in srgb, var(--color-accent-green) 28%, transparent)" : "var(--color-line)"}`,
                }}>
                <Clock size={13} style={{ color: gameElapsed > 0 ? "var(--color-accent-green)" : "var(--color-text-soft)" }} />
                <span className="numeral text-[13px] font-semibold" style={{ color: gameElapsed > 0 ? "var(--color-accent-green)" : "var(--color-text-strong)" }}>
                  {formatElapsed(gameElapsed)}
                </span>
                <button type="button" onClick={resetSessionClock}
                  className="text-[11px] font-semibold bg-transparent border-none cursor-pointer transition-opacity hover:opacity-70"
                  style={{ color: gameElapsed > 0 ? "var(--color-accent-green)" : "var(--color-text-soft)" }}>
                  Sıfırla
                </button>
              </span>

              {/* Seansı değerlendirmeye taşır — akışın üçüncü aşaması. */}
              <button type="button" onClick={() => setGameStage("review")}
                className="btn-signature shrink-0 text-[12.5px] font-semibold cursor-pointer"
                style={{ padding: "9px 16px", borderRadius: 11 }}>
                Seansı Bitir
              </button>
            </div>

            {/* ── Session duration warning banner ── */}
            {gameElapsed > 0 && !sessionWarningDismissed && gameElapsed >= sessionWarnThreshold * 60 && (
              <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-b" style={{ background: "rgba(245, 158, 11,0.1)", borderColor: "rgba(245, 158, 11,0.25)" }}>
                <Timer size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <p className="flex-1 text-xs font-semibold m-0" style={{ color: "#f59e0b" }}>
                  ⏱ {sessionWarnThreshold} dakika geçti — seans sona yaklaşıyor
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {([30, 45, 60] as const).map(t => (
                    <button key={t} type="button"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80"
                      style={{ background: t === sessionWarnThreshold ? "rgba(245, 158, 11,0.2)" : "transparent", borderColor: "rgba(245, 158, 11,0.3)", color: "#f59e0b" }}
                      onClick={() => { setSessionWarnThreshold(t); try { localStorage.setItem("mimio-session-warn-min", String(t)); } catch { /* ignore */ } }}>
                      {t}dk
                    </button>
                  ))}
                  <button type="button" className="text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80" style={{ borderColor: "rgba(245, 158, 11,0.3)", color: "#f59e0b" }} onClick={() => setSessionWarningDismissed(true)}>
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
                <div className="flex items-center gap-2.5 px-4 py-2 shrink-0 border-b" style={{ background: "rgba(43, 98, 245,0.07)", borderColor: "rgba(43, 98, 245,0.15)" }}>
                  <Lightbulb size={14} className="shrink-0 text-(--color-text-muted)" />
                  <p className="flex-1 text-xs text-(--color-text-soft) m-0">
                    <strong style={{ color: "#4d7dff" }}>{activeClient.displayName}</strong> için öneri:{" "}
                    <span style={{ color: "#4d7dff" }}>{suggestedLabel}</span> oynanmamış / en düşük skor ({weakest.avg} ort.)
                  </p>
                  <button type="button"
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border-none cursor-pointer shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: "rgba(43, 98, 245,0.2)", color: "#4d7dff" }}
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
                <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 border shrink-0" style={{ background: gameElapsed > 0 ? "rgba(18, 184, 134,0.1)" : "var(--color-surface-strong)", borderColor: gameElapsed > 0 ? "rgba(18, 184, 134,0.3)" : "var(--color-line)" }}>
                  <Clock size={10} style={{ color: gameElapsed > 0 ? "#12b886" : "var(--color-text-muted)" }} />
                  <span className="font-mono font-bold text-xs tabular-nums" style={{ color: gameElapsed > 0 ? "#12b886" : "var(--color-text-strong)" }}>{formatElapsed(gameElapsed)}</span>
                  <button type="button" className="hover:opacity-70 bg-transparent border-none cursor-pointer ml-0.5 transition-opacity" style={{ color: gameElapsed > 0 ? "#12b886" : "var(--color-primary)" }} onClick={resetSessionClock}><RotateCcw size={9} /></button>
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
                    style={activeGame === tab.key ? { background: "rgba(43, 98, 245,0.1)" } : {}}
                    onClick={() => setActiveGame(tab.key)}>
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* ── Premium Game Sidebar ── */}
              <aside className="hidden md:flex flex-col w-56 lg:w-72 shrink-0 border-r border-(--color-line) overflow-y-auto" style={{ background: "var(--color-sidebar)", backdropFilter: "blur(24px)" }}>

                {/*
                  Seans durumu kartı. Seans çubuğu zaten süreyi ve danışanı
                  taşıyor; buradaki kart artık "aktif mi" sorusunu tek bir
                  noktayla cevaplıyor ve degradesini imza jetonundan alıyor.
                */}
                <div className="p-3 lg:p-4 border-b border-(--color-line) space-y-2.5 lg:space-y-3">
                  <div className="rounded-[16px] p-3.5"
                    style={{
                      background: gameElapsed > 0
                        ? "color-mix(in srgb, var(--color-accent-green) 10%, transparent)"
                        : "var(--gradient-signature-soft)",
                      border: `1px solid ${gameElapsed > 0 ? "color-mix(in srgb, var(--color-accent-green) 26%, transparent)" : "var(--color-line-strong)"}`,
                    }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: gameElapsed > 0 ? "var(--color-accent-green)" : "var(--color-primary)" }} />
                        <span className="text-[11px] font-semibold"
                          style={{ color: gameElapsed > 0 ? "var(--color-accent-green)" : "var(--color-primary-ink)" }}>
                          {gameElapsed > 0 ? "Seans Aktif" : "Seans Bekliyor"}
                        </span>
                      </span>
                      <span className="numeral text-[11px] font-semibold"
                        style={{ color: gameElapsed > 0 ? "var(--color-accent-green)" : "var(--color-text-soft)" }}>
                        {formatElapsed(gameElapsed)}
                      </span>
                    </div>
                    {activeClient ? (
                      <span className="flex items-center gap-2">
                        <Avatar name={activeClient.displayName} id={activeClient.id} size={24} radius={8} />
                        <span className="text-[12px] font-semibold text-(--color-text-strong) truncate">{activeClient.displayName}</span>
                      </span>
                    ) : (
                      <span className="text-[11.5px] text-(--color-text-soft)">Aşağıdan Bir Danışan Seç</span>
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
                          {clientOptions.slice(0, 6).map((c) => {
                            const isActive = c.id === (activeClient?.id ?? "");
                            /* Renk kimlikten türüyor: aynı danışan uygulamanın
                               her yerinde aynı avatarı taşısın. */
                            return (
                              <button key={c.id} type="button" title={c.displayName}
                                className="rounded-xl cursor-pointer border-none bg-transparent p-0 transition-transform hover:scale-110"
                                style={{ opacity: isActive ? 1 : 0.45, boxShadow: isActive ? "0 0 0 2px var(--color-primary)" : "none" }}
                                onClick={() => setActiveClientId(c.id)}>
                                <Avatar name={c.displayName} id={c.id} size={32} radius={10} />
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
                  <button type="button"
                    className={`w-full flex items-center justify-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-xl cursor-pointer border-none transition-all active:scale-[0.98] ${gameElapsed > 0 ? "text-white hover:opacity-90" : "btn-signature"}`}
                    style={gameElapsed > 0 ? { background: "var(--color-accent-green)" } : undefined}
                    onClick={resetSessionClock}>
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
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(43, 98, 245,0.2)", background: "var(--color-surface-elevated)" }}>
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
                                    className={`relative flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl cursor-pointer w-full text-left transition-colors border ${isActive ? "nav-active" : "border-transparent"}`}
                                    style={isActive ? undefined : { background: "transparent" }}
                                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--color-primary-light)"; }}
                                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                                    onClick={() => setActiveGame(tab.key)}>
                                    <span className="text-[13px] truncate flex-1"
                                      style={{
                                        color: isActive ? "var(--color-primary-ink)" : "var(--color-text-body)",
                                        fontWeight: isActive ? 700 : 500,
                                      }}>{tab.title}</span>
                                    {isPlanned && <CalendarDays size={10} className="shrink-0 text-(--color-text-muted)" aria-label="Bu haftanın planında" />}
                                    {best > 0 && (
                                      <span className="numeral shrink-0 text-[11px] font-bold"
                                        style={{ color: isActive ? "var(--color-primary-ink)" : "var(--color-text-muted)", opacity: isActive ? 0.85 : 1 }}>{best}</span>
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
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: card.best > 0 ? `${Math.min(100, card.best)}%` : "0%", background: "linear-gradient(90deg, var(--color-primary), #4d7dff)" }} />
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
                      background: lastFeedback.combo >= 8 ? "linear-gradient(90deg,#d63d63,#f59e0b)" : lastFeedback.combo >= 5 ? "linear-gradient(90deg,#f59e0b,#4d7dff)" : "linear-gradient(90deg,#2b62f5,#12b886)",
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
                    accent="#9a80ff"
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
                          accent="#9a80ff"
                          gradFrom="#9a80ff"
                          gradTo="#4d7dff"
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
                              background: index < memoryState.input.length ? "#9a80ff" : "rgba(255,255,255,0.16)",
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
                    accent="#9a80ff"
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
                          accent="#7b91ab"
                          gradFrom="#7b91ab"
                          gradTo="#4d7dff"
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
                    accent="#9a80ff"
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
                          accent="#9a80ff"
                          gradFrom="#9a80ff"
                          gradTo="#4d7dff"
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
                    accent="#4d7dff"
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
                          accent="#7b91ab"
                          gradFrom="#7b91ab"
                          gradTo="#2b62f5"
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
                      style={{ background: "rgba(13,20,18,0.92)", borderColor: "rgba(77, 125, 255,0.28)" }}>
                      <span className="text-6xl leading-none" style={{ color: "#4d7dff" }}>{routeCommandMeta?.icon ?? "•"}</span>
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
                            <span className="arena-cell-glyph" style={{ color: "#4d7dff" }}>{command.icon}</span>
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
                    accent="#19d19b"
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
                          accent="#9db4cc"
                          gradFrom="#9db4cc"
                          gradTo="#4d7dff"
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
                    accent="#19d19b"
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
                          accent="#b9cade"
                          gradFrom="#b9cade"
                          gradTo="#19d19b"
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
                        style={{ background: "rgba(13,20,18,0.92)", borderColor: "rgba(25, 209, 155,0.3)" }}>
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
                    accent="#a8c2ff"
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
                          accent="#4d7dff"
                          gradFrom="#4d7dff"
                          gradTo="#1b4bc4"
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
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168, 194, 255,0.2)" }}>
                                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox={`0 0 ${cellSize} ${cellSize}`} dangerouslySetInnerHTML={{ __html: renderLogicShape(cell.shape, cell.color, cellSize) }} />
                              </div>
                            ))}
                            <div className="w-12 h-12 sm:w-[3.75rem] sm:h-[3.75rem] rounded-xl flex items-center justify-center"
                              style={{ background: "rgba(168, 194, 255,0.14)", border: "2px dashed rgba(168, 194, 255,0.55)" }}>
                              <span className="text-2xl font-black" style={{ color: "#a8c2ff" }}>?</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">Seçenekler</span>
                            <div className="grid grid-cols-2 gap-2.5">
                              {puzzle.options.map((opt, i) => {
                                const isCursor = logicCursor === i;
                                const isSelected = logicState.selectedIdx === i;
                                const isCorrectOpt = i === puzzle.answerIdx;
                                let borderColor = isCursor ? "rgba(168, 194, 255,0.75)" : "rgba(168, 194, 255,0.22)";
                                let bg = isCursor ? "rgba(168, 194, 255,0.10)" : "rgba(255,255,255,0.03)";
                                if (logicState.showResult && isSelected) { bg = isCorrectOpt ? "rgba(18, 184, 134,0.18)" : "rgba(214, 61, 99,0.18)"; borderColor = isCorrectOpt ? "#12b886" : "#d63d63"; }
                                if (logicState.showResult && isCorrectOpt && !isSelected) { bg = "rgba(18, 184, 134,0.10)"; borderColor = "#12b88688"; }
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
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168, 194, 255,0.18)" }} />
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
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), #4d7dff/10)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
                        <div className="w-2 h-7 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, var(--color-primary), #4d7dff)" }} />
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
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(18, 184, 134,0.06)", border: "1px solid rgba(18, 184, 134,0.15)" }}>
                        <span className="w-2 h-2 rounded-full bg-[#19d19b] shrink-0" />
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
        {/* Eski Raporlar görünümü kaldırıldı — yerini dokümandaki
            İlerleme Raporu (1r/1s) aldı, yukarıda. */}

        {/* ── Therapy Program ── */}
        {activeAppView === "therapy-program" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/*
              Başlık ve sekmeler Deniz diline geçti: ekran kendi krom
              çubuğunu kurmuyor (üst çubuk zaten var), yalnızca göz kapağı +
              display başlık + tek satır özet taşıyor. Sekmeler alt çizgili —
              dolu degrade rozetler altı sekmede ekranı karnavala çeviriyordu.
            */}
            <div className="app-shell px-4 lg:px-[28px] pt-4 lg:pt-[26px] pb-4 flex flex-col gap-4">
              <ScreenHeader
                eyebrow={`${THERAPY_DOMAINS.length} uygulama alanı · ${THERAPY_PROTOCOLS.length} hazır protokol`}
                title="Aktivite Kitaplığı"
                sub="Kanıta dayalı alanlara göre aktivite önerileri ve oyun eşlemeleri."
                actions={
                  clientOptions.length > 0 ? (
                    <label className="flex flex-col gap-1.5">
                      <span className="numeral text-[9.5px] font-semibold uppercase tracking-[0.14em] text-(--color-text-soft)">Danışan</span>
                      <select
                        value={tpSelectedClientId ?? ""}
                        onChange={(e) => setTpSelectedClientId(e.target.value || null)}
                        className="text-[12.5px] font-semibold text-(--color-text-body) cursor-pointer outline-none min-w-[180px]"
                        style={{ padding: "10px 12px", borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
                      >
                        <option value="">Danışan seçin…</option>
                        {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                      </select>
                    </label>
                  ) : undefined
                }
              />

              <div className="tab-scroll flex items-center gap-[22px]" style={{ borderBottom: "1px solid var(--color-line)" }} role="tablist">
                {([
                  {key: "domains" as const, label: "Alanlar", disabled: false},
                  {key: "activities" as const, label: "Aktiviteler", disabled: !tpSelectedDomain},
                  {key: "games" as const, label: "Oyun Eşleme", disabled: !tpSelectedDomain},
                  {key: "plan" as const, label: "Haftalık Plan", disabled: !tpSelectedDomain},
                  {key: "progress" as const, label: "İlerleme", disabled: !tpSelectedClientId},
                  {key: "protocols" as const, label: "Protokoller", disabled: false},
                ]).map(({key, label, disabled}) => {
                  const on = tpActiveTab === key;
                  return (
                    <button key={key} type="button" role="tab" aria-selected={on} disabled={disabled}
                      className={`relative shrink-0 bg-transparent border-none cursor-pointer text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${on ? "font-semibold text-(--color-primary)" : "font-medium text-(--color-text-soft) hover:text-(--color-text-body)"}`}
                      style={{ padding: "9px 0" }}
                      onClick={() => setTpActiveTab(key)}>
                      {label}
                      {on && <span className="absolute left-0 right-0" style={{ bottom: -1, height: 2, borderRadius: 2, background: "var(--gradient-bar)" }} />}
                    </button>
                  );
                })}
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
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #4d7dff, transparent)` }} />
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
                            style={{ background: "linear-gradient(135deg,var(--color-primary),#4d7dff)", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent)" }}
                            onClick={handleGeneratePlan}>
                            <CalendarDays size={13} />Plan Üret →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Premium stat strip ── */}
                    <div className="grid grid-cols-4 gap-3">
                      {([
                        {v: domain.goals.length, l: "Hedef", emoji: "🎯", color: "#2b62f5"},
                        {v: domain.activities.length, l: "Aktivite", emoji: "🧩", color: "#4d7dff"},
                        {v: domain.subSkills.length, l: "Beceri Alanı", emoji: "⚡", color: "#12b886"},
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
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#2b62f5,#17c2e0)", boxShadow: "0 2px 6px #2b62f540" }}>
                            <Target size={12} className="text-white" />
                          </span>
                          Terapi Hedefleri
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#2b62f5" }}>{domain.goals.length}</span>
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                        {domain.goals.map((goal, gi) => (
                          <div key={goal.id} className="relative overflow-hidden rounded-xl border border-(--color-line) p-3.5" style={{ background: "var(--color-surface-elevated)" }}>
                            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,#2b62f540,transparent)" }} />
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#2b62f5,#17c2e0)" }}>{gi + 1}</span>
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
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#d63d63)", boxShadow: "0 2px 6px #f59e0b40" }}>
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
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#12b886,#17c2e0)", boxShadow: "0 2px 6px #12b88640" }}>
                              <Puzzle size={12} className="text-white" />
                            </span>
                            Alt Beceriler
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#12b886" }}>{domain.subSkills.length}</span>
                        </summary>
                        <div className="grid grid-cols-1 gap-2 p-4">
                          {domain.subSkills.map((skill) => (
                            <div key={skill.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#12b886" }} />
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
                      <div className="rounded-2xl border border-[#f59e0b]/30 p-4 overflow-hidden relative" style={{ background: "color-mix(in srgb,#f59e0b 6%,var(--color-surface-strong))" }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#f59e0b,transparent)" }} />
                        <h3 className="text-sm font-bold text-[#f5c26b] mb-3 flex items-center gap-1.5">⭐ Favori Aktiviteler <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "#f59e0b" }}>{favoriteActivities.length}</span></h3>
                        <div className="flex flex-wrap gap-2">
                          {favoriteActivities.map((act) => (
                            <div key={act.id} className="flex items-center gap-2 rounded-full px-3 py-1.5 border" style={{ background: "#f59e0b12", borderColor: "#f59e0b30" }}>
                              <span className="text-xs font-medium text-(--color-text-body)">{act.label}</span>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${act.difficulty === "kolay" ? "bg-[#12b886]" : act.difficulty === "orta" ? "bg-[#f59e0b]" : "bg-[#d63d63]"}`} />
                              <button type="button" className="text-(--color-text-muted) hover:text-[#f0708a] bg-transparent border-none cursor-pointer text-xs transition-colors" onClick={() => toggleFavoriteActivity(act.id)} title="Favoriden çıkar">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Activity cards section ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #4d7dff, transparent)` }} />
                      {/* Section header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${domain.color}, #4d7dff)` }}>
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
                            const levelColor = level === "kolay" ? "#12b886" : level === "orta" ? "#f59e0b" : level === "zor" ? "#d63d63" : undefined;
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
                              const diffBg = activity.difficulty === "kolay" ? "#12b886" : activity.difficulty === "orta" ? "#f59e0b" : "#d63d63";
                              const diffBgLight = activity.difficulty === "kolay" ? "#12b88615" : activity.difficulty === "orta" ? "#f59e0b15" : "#d63d6315";
                              const diffBorder = activity.difficulty === "kolay" ? "#12b88630" : activity.difficulty === "orta" ? "#f59e0b30" : "#d63d6330";
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
                                      {activity.homeExercise && <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg text-[#19d19b] border border-[#12b886]/20" style={{ background: "#12b88612" }}><Home size={9} />Ev ödevi</span>}
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
                                          <div className="rounded-xl border border-[#f59e0b]/25 p-3" style={{ background: "#f59e0b08" }}>
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#f59e0b] mb-1.5"><FlaskConical size={10} />Kanıt Temeli</span>
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
                  ? { bg: "#12b88615", color: "#12b886", border: "#12b88630", label: "Kolay" }
                  : d === "orta"
                  ? { bg: "#f59e0b15", color: "#f59e0b", border: "#f59e0b30", label: "Orta" }
                  : { bg: "#d63d6315", color: "#d63d63", border: "#d63d6330", label: "Zor" };
                const gameIcon = (key: string) => { const Icon = GAME_ICON_MAP[key] ?? Gamepad2; return <Icon size={22} />; };
                const gameAccent: Record<string, string> = {
                  memory: "#2b62f5", pairs: "#4d7dff", pulse: "#12b886",
                  route: "#f59e0b", difference: "#f0708a", scan: "#17c2e0",
                };
                return (
                  <div className="space-y-6">
                    {/* ── Premium Header ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-6" style={{ background: `linear-gradient(135deg, ${domain.color}10 0%, var(--color-surface-strong) 100%)` }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${domain.color}, #4d7dff, transparent)` }} />
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
                                <div className="rounded-2xl border border-[#f59e0b]/25 p-4" style={{ background: "#f59e0b08" }}>
                                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#f59e0b] mb-2"><BookOpen size={12} />Bilimsel Referans</p>
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
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary),#4d7dff)" }}>
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
                          <h2 className="text-lg font-extrabold text-(--color-text-strong) m-0 tracking-tight">Haftalık Plan</h2>
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
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,color-mix(in srgb, var(--color-primary) 15%, transparent),#4d7dff/15)" }}>
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
                        style={{ background: "linear-gradient(135deg,var(--color-primary),#4d7dff)", boxShadow: "0 4px 14px color-mix(in srgb, var(--color-primary) 40%, transparent)" }}
                        onClick={() => setTpShowProgressForm(!tpShowProgressForm)}>
                        + Kayıt Ekle
                      </button>
                    </div>

                    {/* ── Overall Progress Hero ── */}
                    <div className="relative overflow-hidden rounded-3xl border border-(--color-line) p-6" style={{ background: "linear-gradient(135deg,color-mix(in srgb, var(--color-primary) 8%, transparent) 0%,#4d7dff/5 100%)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,var(--color-primary),#4d7dff,transparent)" }} />
                      <div className="flex items-center gap-6">
                        {/* Donut chart */}
                        <div className="relative w-24 h-24 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#progressGrad)" strokeWidth="3" strokeDasharray={`${overallAvg}, 100`} strokeLinecap="round" />
                            <defs><linearGradient id="progressGrad"><stop offset="0%" stopColor="#2b62f5" /><stop offset="100%" stopColor="#4d7dff" /></linearGradient></defs>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-(--color-text-strong)">{overallAvg}%</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-extrabold text-(--color-text-strong) m-0 mb-1">Genel İlerleme</h3>
                          <p className="text-(--color-text-soft) text-sm m-0">{clientProgress.length} kayıt · {goalAverages.filter((g) => g.count > 0).length}/{goals.length} hedef takipte</p>
                          {/* Mini bar */}
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${overallAvg}%`, background: "linear-gradient(90deg,var(--color-primary),#4d7dff)" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Add Progress Form ── */}
                    {tpShowProgressForm && domain && (
                      <div className="relative overflow-hidden rounded-3xl border border-(--color-line)" style={{ background: "var(--color-surface-strong)" }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,var(--color-primary),#4d7dff,transparent)" }} />
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-(--color-line)" style={{ background: "color-mix(in srgb, var(--color-primary) 5%, transparent)" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--color-primary),#4d7dff)" }}>
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
                            <input type="range" min={0} max={100} step={5} value={tpProgressForm.value} onChange={(e) => setTpProgressForm((c) => ({ ...c, value: Number(e.target.value) }))} className="w-full accent-[#0b7f95]" />
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
                              style={{ background: "linear-gradient(135deg,var(--color-primary),#4d7dff)", boxShadow: "0 4px 14px color-mix(in srgb, var(--color-primary) 40%, transparent)" }}
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
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#12b886,transparent)" }} />
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-(--color-line)" style={{ background: "var(--color-surface-elevated)" }}>
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#12b886,#17c2e0)" }}>
                            <Target size={13} className="text-white" />
                          </div>
                          <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Hedef Bazlı İlerleme</h3>
                          <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#12b886" }}>{goalAverages.filter(g => g.count > 0).length} hedef</span>
                        </div>
                        <div className="p-5 space-y-4">
                          {goalAverages.map((ga, i) => {
                            const barColor = ga.average >= 75 ? "#12b886" : ga.average >= 50 ? "#f59e0b" : ga.average >= 25 ? "#2b62f5" : "#d63d63";
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
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#d63d63)" }}>
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
                            const barColor = entry.value >= 75 ? "#12b886" : entry.value >= 50 ? "#f59e0b" : entry.value >= 25 ? "#2b62f5" : "#d63d63";
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
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border-none cursor-pointer transition-colors text-(--color-text-muted) hover:text-[#f0708a] hover:bg-[#d63d63]/10"
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
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden" role="navigation" aria-label="Mobil gezinme" style={{ background: "var(--color-chrome-nav)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid var(--color-line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch h-16 px-2">
          {([
            { view: "dashboard" as AppView, Icon: LayoutDashboard, label: "Panel", gradient: "linear-gradient(135deg,#2b62f5,#17c2e0)", tooltip: "Ana Panel" },
            { view: "clients" as AppView, Icon: Users, label: "Danışanlar", gradient: "linear-gradient(135deg,#4d7dff,#f0708a)", tooltip: "Danışan Listesi" },
            { view: "games" as AppView, Icon: Gamepad2, label: "Oyunlar", gradient: "linear-gradient(135deg,#12b886,#2b62f5)", tooltip: "Oyun Seç" },
            { view: "therapy-program" as AppView, Icon: Stethoscope, label: "Terapi", gradient: "linear-gradient(135deg,#2b62f5,#17c2e0)", tooltip: "Terapi Programı" },
            { view: "reports" as AppView, Icon: BarChart3, label: "Rapor", gradient: "linear-gradient(135deg,#f59e0b,#d63d63)", tooltip: "Raporlar & Analitik" },
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
          <div className="w-full max-w-sm rounded-3xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "rgba(43, 98, 245,0.35)", boxShadow: "0 0 60px rgba(43, 98, 245,0.2)" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2b62f5,#17c2e0,#17c2e0)" }} />
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(43, 98, 245,0.15)" }}>
                  <TrendingUp size={20} style={{ color: "#4d7dff" }} />
                </div>
                <div>
                  <h3 className="font-extrabold text-(--color-text-strong) m-0 mb-1">Zorluk Artışı Önerisi</h3>
                  <p className="text-(--color-text-muted) text-sm m-0">
                    <strong className="text-(--color-text-body)">{difficultyPrompt.clientName}</strong> son 3 seansta tutarlı yüksek performans gösterdi.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: "rgba(43, 98, 245,0.08)", border: "1px solid rgba(43, 98, 245,0.2)" }}>
                <span className="text-2xl">📈</span>
                <div>
                  <p className="m-0 text-sm font-bold text-(--color-text-strong)">
                    Seviyeyi <span style={{ color: "#4d7dff" }}>{difficultyPrompt.suggestedLevel}</span>'a yükselt
                  </p>
                  <p className="m-0 text-xs text-(--color-text-muted)">Danışan profili güncellenecek, oyunlar buna göre ayarlanacak.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#2b62f5,#17c2e0)" }}
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
          <div className="w-full max-w-lg rounded-3xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "rgba(43, 98, 245,0.3)", boxShadow: "0 0 80px rgba(43, 98, 245,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2b62f5,#17c2e0,#17c2e0)" }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-(--color-text-strong) m-0 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: "rgba(43, 98, 245,0.15)", color: "#4d7dff" }}>?</span>
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
                            <kbd key={k} className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(43, 98, 245,0.12)", color: "#4d7dff", border: "1px solid rgba(43, 98, 245,0.25)", fontFamily: "monospace" }}>{k}</kbd>
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
          <div className="rounded-2xl sm:rounded-3xl border p-5 sm:p-6 max-w-sm w-full space-y-4" style={{ background: "var(--color-surface-strong)", borderColor: "rgba(43, 98, 245,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(43, 98, 245,0.15)" }}>
                  <Edit2 size={18} style={{ color: "#4d7dff" }} />
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

