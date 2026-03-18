export const GAME_LABELS = {
  memory: "Sıra Hafızası",
  pairs: "Kart Eşle",
  pulse: "Mavi Nabız",
  route: "Komut Rotası",
  difference: "Fark Avcısı",
  scan: "Hedef Tarama",
} as const;

export type PlatformGameKey = keyof typeof GAME_LABELS;
export type DatabaseStatus = "not_configured" | "online" | "schema_missing" | "error";
export type ProfileSource = "cloud";

export interface RemoteScoreSummary {
  label: string;
  best: number;
  last: number;
  sessions: number;
  lastPlayedAt: string | null;
}

export interface TherapistProfile {
  id: string;
  username: string;
  displayName: string;
  clinicName: string;
  specialty: string;
  source: ProfileSource;
}

export interface ClientProfile {
  id: string;
  displayName: string;
  ageGroup: string;
  primaryGoal: string;
  supportLevel: string;
  source: ProfileSource;
}

export interface RecentSessionEntry {
  id: string;
  therapistId: string | null;
  therapistName: string;
  clientId: string | null;
  clientName: string;
  gameKey: PlatformGameKey;
  gameLabel: string;
  score: number;
  source: string;
  playedAt: string;
  sessionNote: string | null;
  durationSeconds: number | null;
}

export interface SessionInsight {
  averageScore: number;
  activeTherapists: number;
  activeClients: number;
  lastPlayedAt: string | null;
}

export interface PlatformOverviewPayload {
  database: {
    configured: boolean;
    status: DatabaseStatus;
    provider: string;
    message: string;
  };
  totals: {
    sessionCount: number;
    totalScore: number;
  };
  sessionInsight: SessionInsight;
  remoteScores: Record<PlatformGameKey, RemoteScoreSummary>;
  therapists: TherapistProfile[];
  clients: ClientProfile[];
  recentSessions: RecentSessionEntry[];
}

export interface SessionCreatePayload {
  therapistId?: string;
  therapistName?: string;
  clientId?: string;
  clientName?: string;
  gameKey: PlatformGameKey;
  score: number;
  source?: string;
  playedAt?: string;
  sessionNote?: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface TherapistCreatePayload {
  username: string;
  password: string;
  displayName: string;
  clinicName?: string;
  specialty?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ClientCreatePayload {
  displayName: string;
  ageGroup?: string;
  primaryGoal?: string;
  supportLevel?: string;
}

export function createEmptyRemoteScores(): Record<PlatformGameKey, RemoteScoreSummary> {
  return {
    memory: { label: GAME_LABELS.memory, best: 0, last: 0, sessions: 0, lastPlayedAt: null },
    pairs: { label: GAME_LABELS.pairs, best: 0, last: 0, sessions: 0, lastPlayedAt: null },
    pulse: { label: GAME_LABELS.pulse, best: 0, last: 0, sessions: 0, lastPlayedAt: null },
    route: { label: GAME_LABELS.route, best: 0, last: 0, sessions: 0, lastPlayedAt: null },
    difference: { label: GAME_LABELS.difference, best: 0, last: 0, sessions: 0, lastPlayedAt: null },
    scan: { label: GAME_LABELS.scan, best: 0, last: 0, sessions: 0, lastPlayedAt: null },
  };
}

export const EMPTY_PLATFORM_OVERVIEW: PlatformOverviewPayload = {
  database: {
    configured: false,
    status: "not_configured",
    provider: "PostgreSQL / Neon",
    message: "DATABASE_URL tanımlandığında bulut veri katmanı aktif olur.",
  },
  totals: {
    sessionCount: 0,
    totalScore: 0,
  },
  sessionInsight: {
    averageScore: 0,
    activeTherapists: 0,
    activeClients: 0,
    lastPlayedAt: null,
  },
  remoteScores: createEmptyRemoteScores(),
  therapists: [],
  clients: [],
  recentSessions: [],
};

export function isPlatformGameKey(value: string): value is PlatformGameKey {
  return value in GAME_LABELS;
}

// ── New multi-screen architecture types ──

export type AppView = "login" | "register" | "dashboard" | "clients" | "client-detail" | "games" | "therapy-program" | "reports";

export interface SessionNote {
  id: string;
  clientId: string;
  therapistId: string;
  date: string; // "2026-03-14"
  content: string;
  createdAt: string;
}

export interface WeeklyPlanEntry {
  gameKey: PlatformGameKey;
  goal: string;
}

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface WeeklyPlan {
  id: string;
  clientId: string;
  therapistId: string;
  weekStartDate: string;
  days: Record<DayKey, WeeklyPlanEntry[]>;
  updatedAt: string;
}
