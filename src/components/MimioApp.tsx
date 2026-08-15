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
import { motion } from "framer-motion";
import { GameArena } from "./game/GameArena";
import { BlockMark } from "./brand/BlockMark";
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
import { NewClientFlow, type NewClientDraft } from "@/components/app/NewClientFlow";
import { DEFAULT_PREFS, type AppPrefs } from "@/components/app/SettingsScreen";
import { AuthScreen } from "@/components/app/AuthScreen";
import { ActivityLibraryScreen } from "@/components/app/ActivityLibraryScreen";
import { MobileTabBar, MobileMoreSheet, MobileTopBar } from "@/components/app/MobileChrome";
import { LiveSessionScreen, type SupportKind } from "@/components/app/LiveSessionScreen";
import { ScreenHeader, Card, CardTitle, Eyebrow, Avatar } from "@/components/app/primitives";
import { startOfWeek as denizWeekStart, isoDate as denizIso, DOMAIN_ORDER, DOMAIN_META, gameDomain, INDEPENDENCE_STEPS, buildAgenda } from "@/lib/deniz-derive";
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
  GAME_SCORE_SCALE, normalizeScore,
} from "@/lib/game-constants";
import {
  randomIndex, shuffleArray, createMemorySequence, getDifficultyLevel,
  createPairsDeck, createRouteCommand, createDifferenceRound, createScanRound,
  mergeScoreboard, renderLogicShape, createLogicPuzzle, moveGridCursor,
} from "@/lib/game-logic";
import { THERAPY_PROTOCOLS } from "@/lib/therapy-protocols";
import {
  formatPlayedAt, formatElapsed,
  getTodayString, getWeekStart,
  patternStyle,
  parseSessionNotes, parseWeeklyPlans,
} from "@/lib/format-utils";
import { GameResultOverlay } from "@/components/shared/GameResultOverlay";
import { SessionSetSummary } from "@/components/shared/SessionSetSummary";
import { ToastContainer, showToast } from "@/components/shared/ToastContainer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MilestoneContainer, checkAndShowMilestones } from "@/components/shared/MilestoneToast";
import { AchievementPanel, ACHIEVEMENTS, type AchievementStats, type EarnedAchievement } from "@/components/shared/AchievementBadge";
import { ClientComparison } from "@/components/shared/ClientComparison";
import { OnboardingTour } from "@/components/shared/OnboardingTour";



interface MimioAppProps {
  initialAppView?: "login" | "register";
  onLogout?: () => void;
}

/* Mobil üst çubuktaki ekran adları — sidebar telefonda yok, başlık onun yerini alır. */
const MOBILE_TITLES: Partial<Record<AppView, string>> = {
  dashboard: "Bugün",
  clients: "Danışanlar",
  "client-detail": "Danışan",
  "weekly-plan": "Haftalık Plan",
  games: "Oyunlar",
  notes: "Seans Notları",
  reports: "İlerleme Raporu",
  "therapy-program": "Aktivite Kitaplığı",
  settings: "Ayarlar",
};

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
  const [showShortcutGuide, setShowShortcutGuide] = useState(false);
  const [planWeekStart, setPlanWeekStart] = useState(getWeekStart());

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
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
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
  const [moreOpen, setMoreOpen] = useState(false);

  /*
   * Seans sırasında kabuk gizlenir. Doküman canlı seansı ve seans sonunu
   * tam ekran veriyor: seans bir "yer" değil bir "an" — terapist o sırada
   * başka bölüme gitmiyor, çocuk ekrana bakıyor. Gezinme görünürse hem
   * dikkat dağıtıyor hem yanlışlıkla seansı terk etme riski doğuyor.
   */
  const sessionFullscreen = activeAppView === "games" && (gameStage === "live" || gameStage === "review");

  /* ── Canlı seans durumu (1j/1k) ── */
  const [sessionPaused, setSessionPaused] = useState(false);
  /* Zorluk seans içinde geçici olarak değiştirilebilir; danışan profilindeki
     varsayılanı kalıcı değiştirmiyor — terapist "bugün biraz kolaylaştıralım"
     diyebilmeli, bu bir profil kararı değil. */
  const [clientDiffOverride, setClientDiffOverride] = useState<1 | 2 | 3 | null>(null);
  const [supportCounts, setSupportCounts] = useState<Record<SupportKind, number>>({ verbal: 0, visual: 0, physical: 0 });
  /* Tur tur doğru/yanlış — sağ raydaki tepki izi bunu çiziyor. */
  const [sessionTrace, setSessionTrace] = useState<boolean[]>([]);
  /* Turlar arası gerçek tepki süreleri (ms). "Ort. tepki" ölçümünün kaynağı. */
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const lastRoundAtRef = useRef<number | null>(null);
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

  /* Uygulama tercihleri — cihaz başına, hidrasyondan sonra yazılır. */
  const PREFS_KEY = "mimio-prefs-v1";
  const [prefs, setPrefs] = useState<AppPrefs>(DEFAULT_PREFS);
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
  const [noteMode, setNoteMode] = useState<NoteMode>("free");
  const [soapDraft, setSoapDraft] = useState<SoapNoteContent>({ s: "", o: "", a: "", p: "" });
  const [clientGoals, setClientGoals] = useState<ClientGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalDraft, setGoalDraft] = useState({ title: "", description: "", targetValue: 100, deadline: "" });
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [showComparePicker, setShowComparePicker] = useState(false);
  /* loadPlatformOverview'un bayat yanıt koruması — açıklama fonksiyonda. */
  const overviewSeqRef = useRef(0);
  const [showEditTherapist, setShowEditTherapist] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [savingTherapist, setSavingTherapist] = useState(false);
  const announcedAchievementsRef = useRef<Set<string>>(new Set());
  const [therapistEditDraft, setTherapistEditDraft] = useState({ displayName: "", clinicName: "", specialty: "" });
  const [postGameNote, setPostGameNote] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(false);

  // ── Achievement & new feature states ──
  const ACHIEVEMENTS_KEY = "mimio-achievements-v1";
  const PERFECT_GAMES_KEY = "mimio-perfect-games-v1";
  const [earnedAchievements, setEarnedAchievements] = useState<EarnedAchievement[]>([]);
  /* Tüm turları doğru tamamlanan seans sayısı — "Kusursuz Oyun" başarımının
     girdisi. Cihaz başına saklanır, skor tahtasıyla aynı ömürde. */
  const [perfectGameCount, setPerfectGameCount] = useState(0);
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
    /* Tepki izi buradan besleniyor: her geri bildirim bir tur. Son 16 tur
       tutuluyor — sağ raydaki çubuk grafik o kadarını gösteriyor. */
    setSessionTrace((t) => [...t, correct].slice(-16));
    /*
     * Tepki süresi: bir önceki turdan bu yana geçen süre. Seans Sonu'ndaki
     * "Ort. tepki" alanı bugüne kadar sabit "—" gösteriyordu çünkü bu ölçüm
     * hiçbir yerde alınmıyordu. İlk tur atlanır (öncesi yok) ve 30 sn üstü
     * değerler dışarıda bırakılır: o aralık tepki değil, ara verme.
     */
    const now = Date.now();
    const since = lastRoundAtRef.current;
    lastRoundAtRef.current = now;
    if (since !== null) {
      const ms = now - since;
      if (ms > 0 && ms < 30000) setResponseTimes((r) => [...r, ms].slice(-40));
    }
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
      const storedPrefs = window.localStorage.getItem("mimio-prefs-v1");
      if (storedPrefs) { const pp = JSON.parse(storedPrefs); if (pp && typeof pp === "object") setPrefs({ ...DEFAULT_PREFS, ...pp }); }
      const storedAchievements = window.localStorage.getItem(ACHIEVEMENTS_KEY);
      if (storedAchievements) { const p = JSON.parse(storedAchievements); if (Array.isArray(p)) setEarnedAchievements(p); }
      const storedPerfect = window.localStorage.getItem(PERFECT_GAMES_KEY);
      if (storedPerfect) { const p = JSON.parse(storedPerfect); if (typeof p === "number" && Number.isFinite(p)) setPerfectGameCount(p); }
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
  useEffect(() => { persist(PERFECT_GAMES_KEY, perfectGameCount); }, [perfectGameCount, hydrated]);
  useEffect(() => { persist(PREFS_KEY, prefs); }, [prefs, hydrated]);

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
  const [authBusy, setAuthBusy] = useState(false);

  /* Giriş ve kayıt tek yerde — iki ayrı form bloğu aynı çağrıyı iki kez
     yazıyordu, hata mesajları da birbirinden ayrı düşüyordu. */
  async function submitLogin(username: string, password: string) {
    if (!username) { setLoginError("Kullanıcı adı zorunludur."); return; }
    if (!password) { setLoginError("Şifre zorunludur."); return; }
    setAuthBusy(true);
    try {
      const res = await fetch("/api/platform/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "login", username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; profile?: { id: string } };
      if (!res.ok || !data.profile) { setLoginError(data.message ?? "Giriş yapılamadı."); return; }
      setLoginError("");
      handleLogin(data.profile.id);
    } catch {
      setLoginError("Sunucuya ulaşılamadı.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitRegister(v: { username: string; password: string; displayName: string; clinicName: string }) {
    if (!v.username) { setLoginError("Kullanıcı adı zorunludur."); return; }
    if (!v.password || v.password.length < 4) { setLoginError("Şifre en az 4 karakter olmalıdır."); return; }
    if (!v.displayName) { setLoginError("Ad soyad zorunludur."); return; }
    setAuthBusy(true);
    try {
      const res = await fetch("/api/platform/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "therapist", username: v.username, password: v.password, displayName: v.displayName, clinicName: v.clinicName }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; profile?: { id: string } };
      if (!res.ok || !data.profile) { setLoginError(data.message ?? "Kayıt oluşturulamadı."); return; }
      setLoginError("");
      handleLogin(data.profile.id);
    } catch {
      setLoginError("Sunucuya ulaşılamadı.");
    } finally {
      setAuthBusy(false);
    }
  }

  function handleLogin(therapistId: string) {
    try { window.localStorage.setItem(ACTIVE_THERAPIST_KEY, JSON.stringify({ therapistId })); } catch { /* ignore */ }
    setActiveTherapistId(therapistId);
    setActiveAppView("dashboard");
    /*
     * Genel bakış yalnızca mount'ta çekiliyordu; o an oturum cookie'si henüz
     * yoktu ve sunucu boş yük dönüyordu. Giriş yapan kullanıcı, sayfayı elle
     * yenileyene kadar panelde sıfır görüyordu. Oturum kurulduktan sonra
     * yeniden çekmek şart.
     */
    void loadPlatformOverview();
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

  /*
   * Haftalık Plan ekranının tek yazma yolu: haftaya *herhangi* bir danışan
   * için tek blok ekler ya da çıkarır; hangi danışanın planı değişiyorsa
   * yalnızca o yazılır.
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
  /*
   * Alan kazanımı: her alanın son seansı ile ondan önceki ortalaması.
   *
   * Değerler normalize edilir. Bir alanda farklı ölçekli oyunlar bir arada
   * olabiliyor — "Görsel" altında hem Fark Avcısı (0-16 doğru tur) hem Kart
   * Eşle (50-280 puan) var. Ham puanlarla çubuk genişliği yüzde olarak
   * çizilince Kart Eşle her zaman taşıyor, Fark Avcısı hep sıfıra yapışıyordu.
   */
  function buildDomainGains(mine: readonly RecentSessionEntry[]) {
    const out: Array<{ label: string; from: number; to: number; color: string }> = [];
    const norm = (s: RecentSessionEntry) => Math.round(normalizeScore(s.gameKey as GameKey, s.score) * 100);
    for (const key of DOMAIN_ORDER) {
      const inDomain = mine.filter((x) => gameDomain(x.gameKey) === key);
      if (inDomain.length < 2) continue;
      const to = norm(inDomain[0]);
      const rest = inDomain.slice(1, 5);
      const from = Math.round(rest.reduce((a, b) => a + norm(b), 0) / rest.length);
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

  /*
   * Bir danışanı seçip oyuna geçen tek yol — Bugün, Danışanlar, Danışan
   * Detayı ve Haftalık Plan bunu kullanır.
   *
   * "Seansı Başlat" derken düğme kitaplığa değil doğrudan canlı seansa
   * açılmalı — oyun belliyse ara ekran yalnızca bir tıklama vergisiydi.
   * Oyun belirtilmemişse (profil kartındaki genel düğme) kitaplık açılır,
   * seçim orada yapılır. Her iki durumda önceki seansın ölçüm izleri
   * (tepki izi, ipucu sayaçları, duraklatma) temizlenir; taşınsalardı
   * yeni seansın kaydı yanlış olurdu.
   */
  function handleStartSessionFor(clientId: string, gameKey?: PlatformGameKey) {
    setActiveClientId(clientId);
    setSessionTrace([]); setResponseTimes([]); lastRoundAtRef.current = null; setSessionWarningDismissed(false);
    setSupportCounts({ verbal: 0, visual: 0, physical: 0 });
    setClientDiffOverride(null);
    setSessionPaused(false);
    if (gameKey) {
      setActiveGame(gameKey as GameKey);
      setGameStage("live");
    } else {
      setGameStage("library");
    }
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

  /*
   * Üç adımlı sihirbazın çıktısı. Eski tek-form akışı yalnızca dört alan
   * topluyordu; sihirbaz doğum tarihi, uygulama alanı (etiket), sıklık ve
   * bağımsızlık düzeyini de getiriyor.
   */
  async function handleCreateClientFromFlow(draft: NewClientDraft) {
    const displayName = draft.displayName.trim();
    if (!displayName) return;

    const created = await createProfileInBackend(
      {
        kind: "client",
        displayName,
        ageGroup: draft.ageGroup,
        primaryGoal: draft.primaryGoal,
        supportLevel: INDEPENDENCE_STEPS[draft.independence - 1] ?? "Sözel ipucu",
      },
      "Danışan kaydedilemedi.",
    );

    if (created) {
      /*
       * Sihirbazın topladığı ama create uç noktasının almadığı alanlar:
       * doğum tarihi, uygulama alanı (etiket) ve zorluk. Daha önce burada
       * sessizce çöpe gidiyordu — üç adımlık formu dolduran terapist,
       * profili açınca alanların yarısını boş buluyordu.
       */
      try {
        await fetch("/api/platform/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "update-client",
            clientId: created.id,
            tags: draft.area ? [draft.area] : [],
            birthDate: draft.birthDate || null,
            difficultyLevel: draft.difficultyLevel,
          }),
        });
      } catch { /* profil oluştu; kalan alanlar detaydan tamamlanabilir */ }
      await loadPlatformOverview();
      showToast(`${displayName} eklendi`, "success");
    }
    setShowAddClient(false);
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

  /*
   * Seans Notları ekranının dışa aktarımı. Ekran daha önce "PDF Olarak İndir"
   * deyip danışan listesinin CSV'sini indiriyordu — etiket de içerik de
   * yanlıştı. Notların kendisi SOAP alanlarıyla birlikte iner.
   */
  function handleExportNotesCsv() {
    const headers = ["Tarih", "Danışan", "Biçim", "Sübjektif", "Objektif", "Değerlendirme", "Plan", "Not"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = allNotes.map((n) => {
      const clientName = clientOptions.find((c) => c.id === n.clientId)?.displayName ?? "";
      return [
        n.date.slice(0, 10),
        clientName,
        n.noteMode === "soap" ? "SOAP" : "Serbest",
        n.soapContent?.s ?? "",
        n.soapContent?.o ?? "",
        n.soapContent?.a ?? "",
        n.soapContent?.p ?? "",
        n.soapContent ? "" : n.content,
      ].map(esc).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mimio-notlar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${rows.length} not CSV olarak indirildi`, "success");
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

  // ── Danışan/hafta değişince planı tazele (DB → allWeeklyPlans) ──
  useEffect(() => {
    if (!selectedClientId) return;
    void loadWeeklyPlanFromDB(selectedClientId, planWeekStart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, planWeekStart]);

  // ── Existing helpers ──
  function clearMemoryTimers() { memoryTimersRef.current.forEach((timer) => window.clearTimeout(timer)); memoryTimersRef.current = []; }
  function clearPairTimers() { pairTimersRef.current.forEach((timer) => window.clearTimeout(timer)); pairTimersRef.current = []; }

  /*
   * Bu haftanın TÜM planları. Daha önce plan yalnızca bir danışanın
   * detayına girildiğinde (`loadWeeklyPlanFromDB`) tek tek geliyordu;
   * Bugün'ün çizelgesi, Danışanlar'daki "Sıradaki" sütunu ve Haftalık
   * Plan ızgarası girişte boş kalıyordu.
   */
  async function loadWeekPlansFromDB() {
    const weekStartDate = denizIso(denizWeekStart(new Date()));
    try {
      const res = await fetch(`/api/platform/plans?weekStartDate=${weekStartDate}`);
      if (!res.ok) return;
      const payload = (await res.json()) as { plans?: WeeklyPlan[] } | null;
      const plans = Array.isArray(payload?.plans) ? payload.plans : [];
      if (plans.length === 0) return;
      setAllWeeklyPlans((current) => {
        const merged = [...current];
        for (const p of plans) {
          const idx = merged.findIndex(
            (x) => x.clientId === p.clientId && x.weekStartDate.slice(0, 10) === p.weekStartDate.slice(0, 10),
          );
          if (idx >= 0) merged[idx] = p;
          else merged.push(p);
        }
        return merged;
      });
    } catch { /* çevrimdışı — yerel plan durumu geçerli kalır */ }
  }

  /* Tüm danışanların notları — Seans Notları akışı zaman bazlı okur; yalnızca
     detayı açılmış danışanın notlarıyla akış eksik kalıyordu. */
  async function loadAllNotesFromDB() {
    try {
      const res = await fetch("/api/platform/notes");
      if (!res.ok) return;
      const payload = (await res.json()) as { notes?: SessionNote[] } | null;
      const notes = Array.isArray(payload?.notes) ? payload.notes : [];
      if (notes.length === 0) return;
      setAllNotes((current) => {
        const ids = new Set(notes.map((n) => n.id));
        const local = current.filter((n) => !ids.has(n.id));
        return [...notes, ...local].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      });
    } catch { /* çevrimdışı — yereldekiler geçerli */ }
  }

  async function loadPlatformOverview() {
    /*
     * Bayat yanıt koruması. Mount'taki oturumsuz istek (Neon soğuksa) saniyeler
     * sürebiliyor; kullanıcı bu arada giriş yaptıysa geç gelen "authenticated:
     * false" yanıtı taze oturumu görüp login ekranına geri fırlatıyordu —
     * giriş bazen tutuyor, bazen sessizce geri sekiyordu. Yalnızca en son
     * başlatılan isteğin yanıtı state'e işlenir.
     */
    const seq = ++overviewSeqRef.current;
    try {
      const response = await fetch("/api/platform/overview", { cache: "no-store" });
      if (!response.ok) throw new Error("Platform overview alınamadı.");
      const payload = (await response.json()) as PlatformOverviewPayload;
      if (seq !== overviewSeqRef.current) return payload;
      setPlatformOverview(payload);
      setPlatformStatus(payload.database.status);
      if (payload.authenticated !== false) {
        void loadWeekPlansFromDB();
        void loadAllNotesFromDB();
      }
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
      if (seq !== overviewSeqRef.current) return null;
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
    /*
     * Kusursuz oyun: seansın tüm turları doğru. `perfectGames` sayacı daha
     * önce sabit 0 yazılıyordu — "Kusursuz Oyun" başarımı hiç kazanılamıyordu.
     * Gerçek tur izinden hesaplanıyor; en az üç tur şartı, tek turluk bir
     * seansın kusursuz sayılmasını engelliyor.
     */
    const perfectRun = sessionTrace.length >= 3 && sessionTrace.every(Boolean);
    if (perfectRun) setPerfectGameCount((n) => n + 1);

    const wasNewBest = nextScore > scoreboard[game].best;
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

    /*
     * Kilometre taşı bildirimleri. `checkAndShowMilestones` yazılmış ama
     * hiçbir yerden çağrılmıyordu; 10./25./50. seans, seri ve yeni rekor
     * kutlamalarının hiçbiri görünmüyordu. Seans sayısı bu kaydı da
     * içermeli, o yüzden +1.
     */
    if (nextScore > 0) {
      checkAndShowMilestones({
        totalSessions: effectiveSessionCount + 1,
        sessionStreak,
        uniqueGamesPlayed: new Set([...platformOverview.recentSessions.map((s) => s.gameKey), game]).size,
        isNewBest: wasNewBest,
        gameName: GAME_LABELS[game],
      });
    }
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
  const clientDiffLevel = clientDiffOverride ?? getDifficultyLevel(activeClient?.difficultyLevel);
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
    perfectGames: perfectGameCount,
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

  /*
   * Ayarlar → "Seans Hatırlatması". Anahtar daha önce hiçbir yerde
   * okunmuyordu — kapatınca da açınca da hiçbir şey değişmiyordu. Artık
   * planlı seanstan 15 dk önce uygulama içi uyarı düşer; aynı blok için
   * bir kez (ref) hatırlatılır.
   */
  /*
   * Uzun seans uyarısı. Eşik (`sessionWarnThreshold`) ve "kapatıldı" bayrağı
   * yazılmış ama hiçbir yerde okunmuyordu — uyarı hiç görünmüyordu. Çocuk
   * yorulduğunda ölçüm bozulur; süre klinik bir değişkendir, sessizce
   * geçilmemeli. Seans başına bir kez uyarır.
   */
  useEffect(() => {
    if (gameStage !== "live" || sessionPaused || sessionWarningDismissed) return;
    if (gameElapsed < sessionWarnThreshold * 60) return;
    setSessionWarningDismissed(true);
    showToast(`Seans ${sessionWarnThreshold} dakikayı geçti — yorgunluk ölçümü etkileyebilir.`, "warning");
  }, [gameElapsed, gameStage, sessionPaused, sessionWarnThreshold, sessionWarningDismissed]);

  const remindedSlotsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!prefs.sessionReminder) return;
    const check = () => {
      const nowDate = new Date();
      const agenda = buildAgenda(nowDate, allWeeklyPlans, platformOverview.recentSessions, clientOptions);
      for (const item of agenda) {
        if (item.status === "done" || !item.time) continue;
        const [h, m] = item.time.split(":").map(Number);
        if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
        const slot = new Date(nowDate);
        slot.setHours(h, m, 0, 0);
        const minutesLeft = (slot.getTime() - nowDate.getTime()) / 60000;
        if (minutesLeft > 0 && minutesLeft <= 15 && !remindedSlotsRef.current.has(item.key)) {
          remindedSlotsRef.current.add(item.key);
          showToast(`${item.time} — ${item.clientName} seansına ${Math.max(1, Math.round(minutesLeft))} dk kaldı`, "info");
        }
      }
    };
    check();
    const id = window.setInterval(check, 60000);
    return () => window.clearInterval(id);
  }, [prefs.sessionReminder, allWeeklyPlans, platformOverview.recentSessions, clientOptions]);

  // ── Shared auth layout wrapper ──
  const authInp = "w-full px-4 py-3 border border-(--color-line) rounded-2xl bg-(--color-surface-strong) text-(--color-text-strong) text-sm placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/25 focus:border-(--color-primary) transition-colors";

  // ── Register view ──
  if (activeAppView === "login" || activeAppView === "register") {
    const mode = activeAppView === "login" ? "login" : "register";
    return (
      <AuthScreen
        mode={mode}
        onModeChange={(m) => { setLoginError(""); setActiveAppView(m); }}
        error={loginError}
        busy={authBusy}
        greeting="Tekrar hoş geldin."
        subline={
          platformOverview.clients.length > 0
            ? `${platformOverview.clients.length} danışan kayıtlı.`
            : "Hesabına giriş yap ve çalışmaya devam et."
        }
        stats={[
          { value: String(GAME_TABS.length), label: "terapi oyunu" },
          { value: String(THERAPY_DOMAINS.reduce((n, d) => n + (d.activities?.length ?? 0), 0)), label: "kanıtlı aktivite" },
          { value: String(THERAPY_PROTOCOLS.length), label: "hazır protokol" },
        ]}
        dbOnline={platformOverview.database.configured}
        onLogin={(username, password) => { void submitLogin(username, password); }}
        onRegister={(v) => { void submitRegister(v); }}
        onDemo={() => { void submitLogin("demo", "demo1234"); }}
        onHome={() => { if (onLogout) onLogout(); }}
      />
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

  /*
   * Canlı ölçümler. Skor tahtası ve son geri bildirimden türetiliyor —
   * seans sırasında gerçekten değişen dört değer. Elde olmayanı boş
   * bırakıyoruz; "0" yazmak ölçüm alınmış izlenimi verirdi.
   */
  const liveScore = scoreboard[activeGame];
  const liveTrace = sessionTrace;
  const liveAccuracy = liveTrace.length
    ? Math.round((liveTrace.filter(Boolean).length / liveTrace.length) * 100)
    : null;
  const liveAvgResponse = responseTimes.length
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) / 1000
    : null;
  const liveMetrics = [
    { label: "Doğruluk", value: liveAccuracy === null ? "—" : String(liveAccuracy), unit: "%", tone: "green" as const },
    { label: "Seri", value: String(lastFeedback?.combo ?? 0), unit: "tur", tone: "primary" as const },
    /* Ölçüm rayı seans sırasında değişen değerleri gösterir; "En iyi" seansla
       değişmiyordu. Yerine gerçek tepki süresi geldi. */
    { label: "Ort. tepki", value: liveAvgResponse === null ? "—" : liveAvgResponse.toFixed(1), unit: "sn", tone: "primary" as const },
    { label: "Hata", value: String(liveTrace.filter((x) => !x).length), unit: "tur", tone: "amber" as const },
  ];

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
      {!sessionFullscreen && (
      <Sidebar
        activeView={activeAppView}
        onNavigate={setActiveAppView}
        clinicName={activeTherapist?.clinicName || "Ergoterapi platformu"}
        clientCount={clientOptions.length}
        gameCount={GAME_TABS.length}
        weekDone={thisWeekCount}
        weekCapacity={weekCapacity}
      />
      )}

      {/* İçerik sütunu: üst çubuk + kayan gövde. Sidebar dışarıda kalır. */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {!sessionFullscreen && (
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
      )}

      {/* ── Mobil üst çubuk (2a–2v) ──
          Doküman telefonda kromu sadeleştiriyor: arama ve tema masaüstünde
          kalıyor, üstte yalnızca ekran adı ve hesap erişimi duruyor. Küçük
          ekranda krom, içeriğin payına giriyor. */}
      {!sessionFullscreen && (
      <MobileTopBar
        title={MOBILE_TITLES[activeAppView] ?? "Mimio"}
        action={
          <button
            type="button"
            onClick={() => setActiveAppView("settings")}
            aria-label="Ayarlar"
            className="grid place-items-center shrink-0 cursor-pointer border-none font-bold text-white text-[11px]"
            style={{ width: 30, height: 30, borderRadius: 10, background: "var(--gradient-avatar-3)" }}
          >
            {(activeTherapist?.displayName ?? "T").trim()[0]?.toLocaleUpperCase("tr-TR")}
          </button>
        }
      />
      )}

      {/*
        Tek kaydırma kuralı.

        Oyun alanı, Raporlar ve Terapi kendi iç kaydırıcılarını yönetir; bu
        görünümlerde dış sarmalayıcı kaymaz, aksi hâlde iç içe iki kaydırma
        çubuğu oluşuyordu. Diğer görünümlerde kaydırma dış sarmalayıcıdadır.

        Mobil krom payı (üst çubuk + alt sekme + güvenli alan) `.app-scroll`
        sınıfından, `--chrome-top` / `--chrome-bottom` değişkenleriyle tek
        yerden geliyor; masaüstünde ikisi de 0. Daha önce pay iki yerde
        veriliyordu — hem burada (56px) hem `.app-shell`de (52+12) — ve
        telefonda başlığın altında ~120px'lik ölü bir bant kalıyordu.

        Tam ekran seansta krom hiç basılmaz, dolayısıyla pay da sıfırlanır.
      */}
      <div
        className={`flex-1 min-h-0 ${sessionFullscreen ? "" : "app-scroll"} ${
          ownsScroll ? "overflow-hidden flex flex-col" : "overflow-y-auto"
        }`}
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
              plateauAlert={prefs.plateauAlert}
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
              onCompare={() => setShowComparePicker(true)}
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
              /* SOAP varsayılan: ekranın kendi alt başlığı "SOAP formatı" diyor,
                 seed ve seans sonu da bu formatta yazıyor. */
              onAddNote={() => { setNoteMode("soap"); setShowNoteForm(true); }}
              onDeleteNote={(id) => setDeleteNoteId(id)}
              onAddGoal={() => setShowGoalForm(true)}
              onUpdateGoal={(goalId, value) => void handleUpdateGoalProgress(goalId, value)}
              onDeleteGoal={(goalId) => void handleDeleteGoal(goalId)}
              onArchive={() => setArchiveTargetId(selectedClient.id)}
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
              maskNames={prefs.maskClientNames}
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
              onNewNote={() => { if (selectedClient) { setNoteMode("soap"); setShowNoteForm(true); setActiveAppView("client-detail"); } else { showToast("Önce bir danışan seç", "info"); setActiveAppView("clients"); } }}
              onExport={handleExportNotesCsv}
              onDeleteNote={(id) => setDeleteNoteId(id)}
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
              clientCount={clientOptions.length}
              theme={theme}
              preference={preference}
              onThemeChange={setTheme}
              prefs={prefs}
              onPrefsChange={setPrefs}
              onExportAll={handleExportSessionsCSV}
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
              onImportCsv={() => setShowCsvImport(true)}
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
              onStart={(key) => {
                /* Yeni seans temiz ölçümle başlar; önceki seansın izi ve
                   ipucu sayaçları taşınırsa kayıt yanlış olur. */
                setSessionTrace([]); setResponseTimes([]); lastRoundAtRef.current = null; setSessionWarningDismissed(false);
                setSupportCounts({ verbal: 0, visual: 0, physical: 0 });
                setClientDiffOverride(null);
                setSessionPaused(false);
                setActiveGame(key as GameKey);
                setGameStage("live");
              }}
              onStartSequence={(keys) => {
                /* Sıra başlatmak da tek oyun başlatmakla aynı temizliği ister.
                   Sıra bir "oyun seti" olarak kurulur: önceki hâl yalnızca ilk
                   oyunu açıyor, "sıra" hiçbir zaman ikinci oyuna geçmiyordu. */
                setSessionTrace([]); setResponseTimes([]); lastRoundAtRef.current = null; setSessionWarningDismissed(false);
                setSupportCounts({ verbal: 0, visual: 0, physical: 0 });
                setClientDiffOverride(null);
                setSessionPaused(false);
                startCustomSessionSet("Önerilen Sıra", keys as GameKey[]);
                setGameStage("live");
              }}
              onOpenSetPicker={() => setShowSessionSetPicker(true)}
            />
          </div>
        )}

        {/* ── Seans sonu değerlendirme (1n/1o) ── */}
        {activeAppView === "games" && gameStage === "review" && (() => {
          const mine = platformOverview.recentSessions.filter((x) => x.clientId === activeClient?.id);
          const last = mine[0];
          const prev = mine[1];
          const rawScore = last?.score ?? 0;
          const gameKey = (last?.gameKey ?? activeGame) as GameKey;

          /*
           * Skorlar oyundan oyuna aynı birimde değil: Sıra Hafızası dizi
           * uzunluğu (≈3-12), Kart Eşle hamle cezasından türeyen bir puan
           * (50-280) veriyor. Bu ekran bugüne kadar ham puanı 0-100'lük bir
           * yüzdeymiş gibi gösteriyordu — Kart Eşle'de "%280 doğruluk" ve
           * taşan bir skor halkası anlamına geliyordu. `normalizeScore` tam
           * bu iş için yazılmış ve üç ekranda zaten kullanılıyor; burada da
           * kullanılıyor artık. Ham puan da kaybolmuyor, kendi biriminde
           * ayrı bir ölçüm olarak duruyor.
           */
          const scale = GAME_SCORE_SCALE[gameKey];
          const normalized = Math.round(normalizeScore(gameKey, rawScore) * 100);
          const prevNormalized = prev ? Math.round(normalizeScore(prev.gameKey as GameKey, prev.score) * 100) : null;
          const delta = prevNormalized !== null ? normalized - prevNormalized : null;
          const best = mine.length
            ? Math.max(...mine.map((x) => Math.round(normalizeScore(x.gameKey as GameKey, x.score) * 100)))
            : 0;

          /*
           * Turlar gerçek: `sessionTrace` seans boyunca her geri bildirimde
           * dolduruluyor. Önceki sürüm bu diziyi hiç kullanmayıp turları
           * skordan uyduruyordu — sonuç, aynı ekranda "Tur 0/10" metriğinin
           * yanında "6/10 doğru" başlığının durmasıydı. Henüz tur işlenmemiş
           * bir seansta (terapist hemen bitirdiyse) grafik hiç çizilmez.
           */
          const rounds = sessionTrace;
          const okCount = rounds.filter(Boolean).length;
          const avgResponse = responseTimes.length
            ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) / 1000
            : null;

          return (
            <SessionReviewScreen
              client={activeClient}
              gameTitle={last ? last.gameLabel : GAME_TABS.find((g) => g.key === activeGame)?.title ?? ""}
              whenLabel={last ? formatPlayedAt(last.playedAt) : "az önce"}
              difficulty={DIFFICULTY_LABELS[clientDiffLevel]}
              savedAt={new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              score={normalized}
              headline={
                normalized >= best && mine.length > 1
                  ? "En iyi seans — kişisel rekor kırıldı."
                  : delta !== null && delta > 0
                    ? `Yükseliş sürüyor — ${delta} puan kazanım.`
                    : "Seans kaydedildi."
              }
              badges={[
                ...(delta !== null && delta !== 0
                  ? [{ text: `${delta > 0 ? "↑ +" : "↓ "}${Math.abs(delta)} önceki seansa göre`, tone: delta > 0 ? ("green" as const) : ("primary" as const) }]
                  : []),
                ...(normalized >= best && mine.length > 1 ? [{ text: "Kişisel rekor", tone: "primary" as const }] : []),
                { text: `Hedefin %${Math.min(100, Math.round((normalized / 85) * 100))}'i`, tone: "violet" as const },
              ]}
              metrics={[
                /* Ham puan kendi biriminde: "12 dizi uzunluğu", "184 puan". */
                { label: "Ham Puan", value: String(rawScore), unit: scale?.unit ?? "puan", delta: delta !== null ? `${delta > 0 ? "+" : ""}${delta} normalize` : undefined, deltaTone: delta && delta > 0 ? "green" : "neutral" },
                { label: "Ort. tepki", value: avgResponse === null ? "—" : avgResponse.toFixed(1), unit: "sn" },
                { label: "Süre", value: last?.durationSeconds ? formatElapsed(last.durationSeconds) : formatElapsed(gameElapsed), unit: "dk:sn" },
                { label: "Tur", value: rounds.length ? `${okCount}/${rounds.length}` : "—", unit: "doğru", deltaTone: "neutral" },
              ]}
              gains={buildDomainGains(mine)}
              nextHint={normalized >= 85 ? "Bir sonraki seansta zorluk artırılabilir." : "Mevcut zorlukta bir seans daha önerilir."}
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
              Canlı Seans kabuğu (1j/1k). Oyun alanı `board` olarak içeri
              veriliyor; `variant="bare"` çünkü GameArena kendi başlığını,
              yönergesini ve ipucu satırını zaten üretiyor — dokümandaki tur
              çipi + yönerge satırını da basmak ikisini üst üste koyardı.
            */}
            <LiveSessionScreen
              client={activeClient}
              gameTitle={activeTab.title}
              gameSubtitle={activeTab.kicker}
              elapsed={formatElapsed(gameElapsed)}
              paused={sessionPaused}
              onTogglePause={() => setSessionPaused((v) => !v)}
              difficulty={DIFFICULTY_LABELS[clientDiffLevel]}
              difficultyOptions={[DIFFICULTY_LABELS[1], DIFFICULTY_LABELS[2], DIFFICULTY_LABELS[3]]}
              onDifficultyChange={(d) => {
                const idx = [DIFFICULTY_LABELS[1], DIFFICULTY_LABELS[2], DIFFICULTY_LABELS[3]].indexOf(d);
                if (idx >= 0) setClientDiffOverride((idx + 1) as 1 | 2 | 3);
              }}
              onExit={() => setGameStage("library")}
              onFinish={() => setGameStage("review")}
              roundLabel=""
              instruction=""
              variant="bare"
              metrics={liveMetrics}
              trace={liveTrace}
              supports={supportCounts}
              onAddSupport={(k) => setSupportCounts((c) => ({ ...c, [k]: c[k] + 1 }))}
              note={sessionNote}
              onNoteChange={setSessionNote}
              board={
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
                          onBack={() => { setGameStage("library"); setActiveAppView("dashboard"); }}
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
                          onBack={() => { setGameStage("library"); setActiveAppView("dashboard"); }}
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
                          onBack={() => { setGameStage("library"); setActiveAppView("dashboard"); }}
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
                          onBack={() => { setGameStage("library"); setActiveAppView("dashboard"); }}
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
                          onBack={() => { setGameStage("library"); setActiveAppView("dashboard"); }}
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
                          onBack={() => { setGameStage("library"); setActiveAppView("dashboard"); }}
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
                          onBack={() => { setGameStage("library"); setActiveAppView("dashboard"); }}
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
                {/* Telefonda künye şeridi kapalıyken tek satıra iner: 40px'lik
                    marka döşemesi, iki satırlık başlık ve kalın iç boşluk
                    seans ekranından ~130px çalıyor, oyun tahtası eziliyordu.
                    Bilgi kaybolmuyor — açıldığında hepsi yerinde. */}
                <details ref={gameDetailsRef} className="mt-3 max-lg:mt-2 shrink-0 rounded-2xl max-lg:rounded-xl border border-(--color-line) overflow-y-auto w-full max-h-[46%]" style={{ background: "var(--color-surface-strong)" }}>
                  <summary className="flex items-center justify-between px-5 py-4 max-lg:px-3 max-lg:py-2.5 cursor-pointer list-none group select-none">
                    <div className="flex items-center gap-4 max-lg:gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 max-lg:hidden" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), #4d7dff/10)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
                        <div className="w-2 h-7 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, var(--color-primary), #4d7dff)" }} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 max-lg:hidden" style={{ color: "var(--color-primary)" }}>{activeCategory.title}</span>
                        <h3 className="text-(--color-text-strong) font-bold text-base max-lg:text-[13px] m-0 truncate">{activeTab.title}</h3>
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
              }
            />
          </div>
        )}

        {/* ── Reports & Analytics ── */}
        {/* Eski Raporlar görünümü kaldırıldı — yerini dokümandaki
            İlerleme Raporu (1r/1s) aldı, yukarıda. */}

        {/* ── Therapy Program ── */}
        {activeAppView === "therapy-program" && (
          <div className="app-shell h-full p-4 lg:p-[26px_28px]">
            <ActivityLibraryScreen
              onAddToPlan={(a) => {
                /* Aktivite planı doğrudan değiştirmiyor; terapisti haftalık
                   plana taşıyor ki hangi güne düşeceğine orada karar versin. */
                showToast(`${a.label} — plana eklemek için gün seç`, "info");
                setActiveAppView("weekly-plan");
              }}
            />
          </div>
        )}

      </div>
      </div>

      {/* ── Mobil kabuk (2a–2v) ── */}
      {!sessionFullscreen && (
      <MobileTabBar
        activeView={activeAppView}
        onNavigate={setActiveAppView}
        onMore={() => setMoreOpen(true)}
      />
      )}
      {moreOpen && (
        <MobileMoreSheet
          activeView={activeAppView}
          onNavigate={setActiveAppView}
          onClose={() => setMoreOpen(false)}
        />
      )}
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

      {showAddClient && (
        <NewClientFlow
          clinicName={activeTherapist?.clinicName || "Mimio Klinik"}
          onClose={() => setShowAddClient(false)}
          onSubmit={(d) => { void handleCreateClientFromFlow(d); }}
        />
      )}

      {/* ── Arşiv onayı — yıkıcı eylem, ConfirmDialog'dan geçer ── */}
      <ConfirmDialog
        open={Boolean(archiveTargetId)}
        title="Danışanı Arşivle"
        description={`${clientOptions.find((c) => c.id === archiveTargetId)?.displayName ?? "Danışan"} listeden kaldırılacak; seans geçmişi ve notları silinmez, arşivden geri alınabilir.`}
        confirmLabel="Arşivle"
        cancelLabel="Vazgeç"
        variant="danger"
        onConfirm={() => {
          const id = archiveTargetId;
          if (id) {
            void handleArchiveClient(id);
            if (selectedClientId === id) { setSelectedClientId(null); setActiveAppView("clients"); }
          }
        }}
        onCancel={() => setArchiveTargetId(null)}
      />

      {/* ── Not silme onayı ── */}
      <ConfirmDialog
        open={Boolean(deleteNoteId)}
        title="Notu Sil"
        description="Bu seans notu kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        variant="danger"
        onConfirm={() => {
          if (deleteNoteId) void handleDeleteNoteDB(deleteNoteId);
          setDeleteNoteId(null);
        }}
        onCancel={() => setDeleteNoteId(null)}
      />

      {/* ── Hedef formu — Danışan Detayı'ndaki "Hedef Ekle" buraya açılır.
          Hedefler daha önce yalnızca seed'den gelebiliyordu: form state'i ve
          handler'lar vardı ama hiçbir düğme bu formu açmıyordu. ── */}
      {showGoalForm && selectedClient && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Hedef ekle">
          <button type="button" aria-label="Kapat" onClick={() => setShowGoalForm(false)} className="absolute inset-0 cursor-default border-none" style={{ background: "rgba(5,11,22,0.5)", backdropFilter: "blur(4px)" }} />
          <div className="relative w-full max-w-md rounded-[18px]" style={{ padding: 22, background: "var(--color-surface-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Eyebrow>{selectedClient.displayName}</Eyebrow>
                <CardTitle className="block mt-1">Yeni Hedef</CardTitle>
              </div>
              <button type="button" onClick={() => setShowGoalForm(false)} aria-label="Kapat" className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-text-strong)" style={{ width: 30, height: 30 }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Başlık</span>
                <input value={goalDraft.title} onChange={(e) => setGoalDraft((d) => ({ ...d, title: e.target.value }))} placeholder="ör. Blok Açıklığı 6" className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Açıklama</span>
                <input value={goalDraft.description} onChange={(e) => setGoalDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Neyi, hangi koşulda ölçüyorsun? (isteğe bağlı)" className={inputCls} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Hedef Değer</span>
                  <input type="number" min={1} value={goalDraft.targetValue} onChange={(e) => setGoalDraft((d) => ({ ...d, targetValue: Math.max(1, Number(e.target.value) || 1) }))} className={`${inputCls} numeral`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Son Tarih</span>
                  <input type="date" value={goalDraft.deadline} onChange={(e) => setGoalDraft((d) => ({ ...d, deadline: e.target.value }))} className={`${inputCls} numeral`} />
                </label>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button type="button" onClick={() => setShowGoalForm(false)} className="flex-1 text-[12.5px] font-semibold text-(--color-text-body) cursor-pointer transition-colors hover:text-(--color-primary)" style={{ padding: 11, borderRadius: 11, background: "transparent", border: "1px solid var(--color-line)" }}>
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!goalDraft.title.trim()}
                onClick={() => void handleAddGoal()}
                className="btn-signature flex-1 text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: 11, borderRadius: 11 }}
              >
                Hedefi Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Oyun seti seçici — kitaplıktaki "Oyun Seti" ve set özetindeki
          "Yeni Set" buraya açılır. Daha önce `showSessionSetPicker` true
          oluyor ama karşılığında hiçbir şey render edilmiyordu. ── */}
      {showSessionSetPicker && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Oyun seti seç">
          <button type="button" aria-label="Kapat" onClick={() => setShowSessionSetPicker(false)} className="absolute inset-0 cursor-default border-none" style={{ background: "rgba(5,11,22,0.5)", backdropFilter: "blur(4px)" }} />
          <div className="relative w-full max-w-md rounded-[18px]" style={{ padding: 22, background: "var(--color-surface-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center justify-between mb-1">
              <CardTitle>Oyun Seti Seç</CardTitle>
              <button type="button" onClick={() => setShowSessionSetPicker(false)} aria-label="Kapat" className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-text-strong)" style={{ width: 30, height: 30 }}>
                <X size={16} />
              </button>
            </div>
            <p className="m-0 mb-4 text-[11.5px] text-(--color-text-soft)">
              Set, oyunları arka arkaya zincirler; her oyunun sonunda bir sonrakine geçilir.
            </p>
            <div className="flex flex-col gap-2">
              {SESSION_SET_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSessionTrace([]); setResponseTimes([]); lastRoundAtRef.current = null; setSessionWarningDismissed(false);
                    setSupportCounts({ verbal: 0, visual: 0, physical: 0 });
                    setSessionPaused(false);
                    startSessionSet(preset);
                    setGameStage("live");
                    setActiveAppView("games");
                  }}
                  className="flex items-center gap-3 text-left cursor-pointer transition-colors hover:border-(--color-line-strong)"
                  style={{ padding: "12px 14px", borderRadius: 13, background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}
                >
                  <span className="text-[20px] shrink-0" aria-hidden="true">{preset.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-(--color-text-strong)">{preset.label}</span>
                    <span className="block text-[10.5px] text-(--color-text-soft) mt-0.5">{preset.description}</span>
                  </span>
                  <ChevronRight size={15} className="shrink-0 text-(--color-text-muted)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Karşılaştırma seçici — Danışanlar'daki "Karşılaştır" buraya açılır ── */}
      {showComparePicker && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Danışan karşılaştır">
          <button type="button" aria-label="Kapat" onClick={() => setShowComparePicker(false)} className="absolute inset-0 cursor-default border-none" style={{ background: "rgba(5,11,22,0.5)", backdropFilter: "blur(4px)" }} />
          <div className="relative w-full max-w-md rounded-[18px]" style={{ padding: 22, background: "var(--color-surface-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}>
            <CardTitle className="block mb-1">Danışan Karşılaştır</CardTitle>
            <p className="m-0 mb-4 text-[11.5px] text-(--color-text-soft)">
              İki danışanın seans ölçümleri yan yana kıyaslanır.
            </p>
            {(() => {
              const a = compareClientA || clientOptions[0]?.id || "";
              const b = compareClientB || clientOptions.find((c) => c.id !== a)?.id || "";
              const selectCls = "w-full text-[13px] text-(--color-text-strong) outline-none cursor-pointer";
              const selectStyle = { padding: "11px 12px", borderRadius: 11, background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" } as const;
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Danışan A</span>
                      <select value={a} onChange={(e) => setCompareClientA(e.target.value)} className={selectCls} style={selectStyle}>
                        {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Danışan B</span>
                      <select value={b} onChange={(e) => setCompareClientB(e.target.value)} className={selectCls} style={selectStyle}>
                        {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex gap-2.5 mt-5">
                    <button type="button" onClick={() => setShowComparePicker(false)} className="flex-1 text-[12.5px] font-semibold text-(--color-text-body) cursor-pointer transition-colors hover:text-(--color-primary)" style={{ padding: 11, borderRadius: 11, background: "transparent", border: "1px solid var(--color-line)" }}>
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      disabled={!a || !b || a === b}
                      onClick={() => {
                        setCompareClientA(a);
                        setCompareClientB(b);
                        setShowComparePicker(false);
                        setShowComparison(true);
                      }}
                      className="btn-signature flex-1 text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ padding: 11, borderRadius: 11 }}
                    >
                      Karşılaştır
                    </button>
                  </div>
                  {a === b && <p className="m-0 mt-2 text-[11px] text-(--color-accent-amber)">İki farklı danışan seç.</p>}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── CSV içe aktarma — Ayarlar'daki "CSV İçe Aktar" buraya açılır ── */}
      {showCsvImport && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="CSV içe aktar">
          <button type="button" aria-label="Kapat" onClick={() => { setShowCsvImport(false); setCsvImportError(""); }} className="absolute inset-0 cursor-default border-none" style={{ background: "rgba(5,11,22,0.5)", backdropFilter: "blur(4px)" }} />
          <div className="relative w-full max-w-lg rounded-[18px]" style={{ padding: 22, background: "var(--color-surface-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center justify-between mb-1">
              <CardTitle>Danışanları CSV ile İçe Aktar</CardTitle>
              <button type="button" onClick={() => { setShowCsvImport(false); setCsvImportError(""); }} aria-label="Kapat" className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-text-strong)" style={{ width: 30, height: 30 }}>
                <X size={16} />
              </button>
            </div>
            <p className="m-0 mb-3 text-[11.5px] leading-[1.55] text-(--color-text-soft)">
              İlk satır başlık, sonraki her satır bir danışan:{" "}
              <code className="numeral text-[10.5px]">Ad,Yaş Grubu,Birincil Hedef,Destek Düzeyi</code>
            </p>
            <textarea
              value={csvImportText}
              onChange={(e) => setCsvImportText(e.target.value)}
              rows={7}
              placeholder={"Ad,Yaş Grubu,Birincil Hedef,Destek Düzeyi\nAli Kaya,6-8,Çalışma belleği,Sözel ipucu"}
              className="numeral w-full resize-none outline-none text-[12px] leading-[1.6] text-(--color-text-strong) placeholder:text-(--color-text-muted)"
              style={{ padding: "12px 14px", borderRadius: 12, background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}
            />
            {csvImportError && <p className="m-0 mt-2 text-[11.5px] text-(--color-accent-red)">{csvImportError}</p>}
            <div className="flex gap-2.5 mt-4">
              <button type="button" onClick={() => { setShowCsvImport(false); setCsvImportError(""); }} className="flex-1 text-[12.5px] font-semibold text-(--color-text-body) cursor-pointer transition-colors hover:text-(--color-primary)" style={{ padding: 11, borderRadius: 11, background: "transparent", border: "1px solid var(--color-line)" }}>
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!csvImportText.trim()}
                onClick={() => void handleImportCsv()}
                className="btn-signature flex-1 text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: 11, borderRadius: 11 }}
              >
                İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        Not formu — Danışan Detayı'ndaki "Not Ekle" ve Seans Notları'ndaki
        "Yeni Not" buraya açılır. Bu modal daha önce hiç render edilmiyordu:
        iki düğme de `showNoteForm`u true yapıyor ama karşılığında hiçbir şey
        açılmıyordu. Form, seans sonu ekranıyla aynı SOAP dilini konuşur;
        serbest metin de mümkün — kısa gözlemler için dört alan fazla tören.
      */}
      {showNoteForm && selectedClient && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Seans notu ekle">
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setShowNoteForm(false)}
            className="absolute inset-0 cursor-default border-none"
            style={{ background: "rgba(5,11,22,0.5)", backdropFilter: "blur(4px)" }}
          />
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[18px]"
            style={{ padding: 22, background: "var(--color-surface-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Avatar name={selectedClient.displayName} id={selectedClient.id} size={34} radius={11} />
                <div>
                  <Eyebrow>{selectedClient.displayName}</Eyebrow>
                  <CardTitle className="block mt-0.5">Seans Notu</CardTitle>
                </div>
              </div>
              <button type="button" onClick={() => setShowNoteForm(false)} aria-label="Kapat" className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-text-strong)" style={{ width: 30, height: 30 }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              {/* Not biçimi — SOAP klinik varsayılan, serbest metin hızlı gözlem için */}
              <div className="flex p-[3px] rounded-[10px]" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }} role="radiogroup" aria-label="Not biçimi">
                {([{ key: "soap" as NoteMode, label: "SOAP" }, { key: "free" as NoteMode, label: "Serbest" }]).map(({ key, label }) => {
                  const on = noteMode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setNoteMode(key)}
                      className={`text-[11.5px] font-semibold cursor-pointer border-none transition-colors ${on ? "text-white" : "text-(--color-text-soft) bg-transparent hover:text-(--color-text-body)"}`}
                      style={{ padding: "6px 13px", borderRadius: 7, background: on ? "var(--gradient-signature)" : undefined }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                value={noteForm.date}
                onChange={(e) => setNoteForm((f) => ({ ...f, date: e.target.value }))}
                aria-label="Not tarihi"
                className="numeral ml-auto text-[12px] text-(--color-text-strong) outline-none cursor-pointer"
                style={{ padding: "7px 11px", borderRadius: 10, background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}
              />
            </div>

            {noteMode === "soap" ? (
              <div className="flex flex-col gap-3">
                {([
                  { key: "s" as const, letter: "S", label: "Sübjektif", ph: "Danışanın / ailenin ifadesi…" },
                  { key: "o" as const, letter: "O", label: "Objektif", ph: "Gözlenen performans, ölçümler…" },
                  { key: "a" as const, letter: "A", label: "Değerlendirme", ph: "Klinik yorum…" },
                  { key: "p" as const, letter: "P", label: "Plan", ph: "Sonraki adım…" },
                ]).map(({ key, letter, label, ph }) => (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="numeral grid place-items-center text-[10px] font-bold shrink-0" style={{ width: 20, height: 20, borderRadius: 6, background: "var(--color-primary-light)", color: "var(--color-primary-ink)" }}>
                        {letter}
                      </span>
                      <span className="text-[11px] font-semibold text-(--color-text-body)">{label}</span>
                    </div>
                    <textarea
                      value={soapDraft[key]}
                      onChange={(e) => setSoapDraft((d) => ({ ...d, [key]: e.target.value }))}
                      rows={2}
                      placeholder={ph}
                      className="w-full resize-none outline-none text-[12px] leading-[1.55] text-(--color-text-strong) placeholder:text-(--color-text-muted)"
                      style={{ padding: "10px 12px", borderRadius: 11, background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                value={noteForm.content}
                onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))}
                rows={6}
                placeholder="Gözlemini yaz…"
                className="w-full resize-none outline-none text-[12.5px] leading-[1.6] text-(--color-text-strong) placeholder:text-(--color-text-muted)"
                style={{ padding: "12px 14px", borderRadius: 12, background: "var(--color-surface-elevated)", border: "1px solid var(--color-line)" }}
              />
            )}

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowNoteForm(false)}
                className="flex-1 text-[12.5px] font-semibold text-(--color-text-body) cursor-pointer transition-colors hover:text-(--color-primary)"
                style={{ padding: 11, borderRadius: 11, background: "transparent", border: "1px solid var(--color-line)" }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isNotesLoading || (noteMode === "soap" ? ![soapDraft.s, soapDraft.o, soapDraft.a, soapDraft.p].some((x) => x.trim()) : !noteForm.content.trim())}
                onClick={() => void handleAddNoteDB()}
                className="btn-signature flex-1 text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: 11, borderRadius: 11 }}
              >
                {isNotesLoading ? "Kaydediliyor…" : "Notu Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

