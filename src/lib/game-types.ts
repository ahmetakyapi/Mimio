/**
 * Game-specific type definitions for Mimio platform.
 * Extracted from MimioApp.tsx for maintainability.
 */

import type { PlatformGameKey } from "@/lib/platform-data";

export type GameKey = PlatformGameKey;
export type GameCategoryKey = "memorySkills" | "motorSkills" | "visualSkills" | "cognitiveSkills";
export type PatternKey = "rings" | "grid" | "wave";
export type CommandKey = "up" | "right" | "down" | "left";
export type MemoryPhase = "idle" | "showing" | "ready" | "success" | "finished";
export type PairsPhase = "idle" | "playing" | "finished";
export type PulsePhase = "idle" | "playing" | "finished";
export type RoutePhase = "idle" | "playing" | "finished";
export type DifferencePhase = "idle" | "playing" | "finished";
export type ScanPhase = "idle" | "playing" | "finished";
export type LogicPhase = "idle" | "playing" | "finished";
export type LogicShape = "circle" | "square" | "triangle" | "diamond";

export interface LogicCell {
  shape: LogicShape;
  color: string;
}

export interface LogicPuzzle {
  grid: LogicCell[];
  options: LogicCell[];
  answerIdx: number;
  ruleHint: string;
}

export interface LogicState {
  puzzle: LogicPuzzle | null;
  round: number;
  score: number;
  phase: LogicPhase;
  message: string;
  selectedIdx: number | null;
  showResult: boolean;
}

export interface ScoreRecord {
  label: string;
  best: number;
  last: number;
  plays: number;
}

export interface Scoreboard {
  memory: ScoreRecord;
  pairs: ScoreRecord;
  pulse: ScoreRecord;
  route: ScoreRecord;
  difference: ScoreRecord;
  scan: ScoreRecord;
  logic: ScoreRecord;
}

export interface SymbolVariant {
  label: string;
  icon: string;
  accent: string;
  background: string;
  pattern: PatternKey;
}

export interface MemoryState {
  sequence: number[];
  input: number[];
  flashIndex: number | null;
  score: number;
  phase: MemoryPhase;
  message: string;
}

export interface PairsTile extends SymbolVariant {
  id: string;
  matched: boolean;
  revealed: boolean;
}

export interface PairsState {
  tiles: PairsTile[];
  moves: number;
  pairsFound: number;
  locked: boolean;
  phase: PairsPhase;
  message: string;
}

export interface PulseState {
  activeIndex: number | null;
  round: number;
  hits: number;
  misses: number;
  combo: number;
  points: number;
  phase: PulsePhase;
  message: string;
}

export interface RouteState {
  command: CommandKey | null;
  round: number;
  score: number;
  streak: number;
  phase: RoutePhase;
  history: CommandKey[];
  message: string;
}

export interface DifferenceTile extends SymbolVariant {
  id: string;
  odd: boolean;
  rotation: number;
}

export interface DifferenceState {
  tiles: DifferenceTile[];
  oddId: string | null;
  round: number;
  score: number;
  phase: DifferencePhase;
  revealId: string | null;
  message: string;
}

export interface ScanTile extends SymbolVariant {
  id: string;
  target: boolean;
  rotation: number;
}

export interface ScanState {
  tiles: ScanTile[];
  targetLabel: string;
  targetId: string | null;
  round: number;
  score: number;
  phase: ScanPhase;
  revealId: string | null;
  message: string;
}

export interface TherapistDraftState {
  username: string;
  password: string;
  displayName: string;
  clinicName: string;
  specialty: string;
}

export interface ClientDraftState {
  displayName: string;
  ageGroup: string;
  primaryGoal: string;
  supportLevel: string;
}

export interface SessionSetState {
  presetLabel: string;
  games: GameKey[];
  currentIndex: number;
  entries: Array<{ gameKey: GameKey; score: number; label: string }>;
  phase: "running" | "finished";
}

// Therapy suggestion types
export type GameTrend = "improving" | "stable" | "declining" | "new";

export interface GameAnalysis {
  gameKey: GameKey;
  label: string;
  plays: number;
  best: number;
  last3Avg: number;
  last5Avg: number;
  trend: GameTrend;
  relativeScore: number;
  daysSinceLastPlay: number | null;
}

export interface TherapySuggestion {
  strengths: Array<{ gameKey: GameKey; label: string; trend: GameTrend; last3Avg: number }>;
  attentionAreas: Array<{ gameKey: GameKey; label: string; reason: string; trend: GameTrend }>;
  recommendedSet: GameKey[];
  protocolId: string | null;
  protocolName: string | null;
  soapDraft: { s: string; o: string; a: string; p: string };
  performanceSummary: string;
  overallTrend: "improving" | "stable" | "declining" | "insufficient_data";
}

// Therapy protocol types
export interface TherapyProtocolWeek {
  week: number;
  focus: string;
  games: GameKey[];
  activities: string[];
  targetScore: number;
}

export interface TherapyProtocol {
  id: string;
  name: string;
  emoji: string;
  domain: string;
  color: string;
  duration: number;
  description: string;
  targetGroup: string;
  frequency: string;
  weeks: TherapyProtocolWeek[];
  outcomes: string[];
}

// Game tab / category types
export interface GameTab {
  key: GameKey;
  category: GameCategoryKey;
  title: string;
  kicker: string;
  blurb: string;
  goals: string[];
  teaser: string;
  accent: string;
  preview: string[];
}

export interface GameCategory {
  key: GameCategoryKey;
  title: string;
  kicker: string;
  icon: string;
  description: string;
}

export interface SessionSetPreset {
  id: string;
  label: string;
  games: GameKey[];
  emoji: string;
  description: string;
}
