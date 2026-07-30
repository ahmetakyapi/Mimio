/**
 * Game-related constants for Mimio platform.
 * Extracted from MimioApp.tsx for maintainability.
 */

import { GAME_LABELS } from "@/lib/platform-data";
import type {
  GameKey,
  GameTab,
  GameCategory,
  Scoreboard,
  SessionSetPreset,
  SymbolVariant,
} from "@/lib/game-types";

// ── Storage Keys ──
export const STORAGE_KEY = "mimio-scoreboard-v2";
export const SESSION_CONTEXT_KEY = "mimio-session-context-v1";
export const ACTIVE_THERAPIST_KEY = "mimio-active-therapist-v2";
export const NOTES_KEY = "mimio-notes-v1";
export const WEEKLY_PLANS_KEY = "mimio-weekly-plans-v1";

// ── Game Config ──
export const MEMORY_START_LENGTH = 3;
export const PULSE_TOTAL_ROUNDS = 20;
export const ROUTE_TOTAL_ROUNDS = 18;
export const DIFFERENCE_TOTAL_ROUNDS = 12;
export const SCAN_TOTAL_ROUNDS = 15;
export const TOTAL_PAIR_MATCHES = 8;

export const MEMORY_TILES = ["Bulut", "Damlacık", "Kırık Çizgi", "Halka", "Işık", "Dalga"];

export const PULSE_LABELS = [
  "Sol Üst", "Üst", "Sağ Üst",
  "Sol", "Merkez", "Sağ",
  "Sol Alt", "Alt", "Sağ Alt",
];

export const ROUTE_COMMANDS = [
  { key: "up" as const, label: "Yukarı", icon: "↑" },
  { key: "right" as const, label: "Sağ", icon: "→" },
  { key: "down" as const, label: "Aşağı", icon: "↓" },
  { key: "left" as const, label: "Sol", icon: "←" },
];

export const SYMBOL_LIBRARY: SymbolVariant[] = [
  { label: "Bulut", icon: "☁", accent: "#7fb2cc", background: "linear-gradient(180deg, rgba(10,22,20,0.92), rgba(7,15,14,0.78))", pattern: "rings" },
  { label: "Damlacık", icon: "◔", accent: "#6aa6c4", background: "linear-gradient(180deg, rgba(9,20,18,0.92), rgba(6,13,12,0.80))", pattern: "grid" },
  { label: "Kırık Çizgi", icon: "〰", accent: "#6aa6c4", background: "linear-gradient(180deg, rgba(11,21,19,0.92), rgba(8,16,15,0.78))", pattern: "wave" },
  { label: "Halka", icon: "◎", accent: "#8fbdd6", background: "linear-gradient(180deg, rgba(10,23,21,0.92), rgba(7,17,16,0.78))", pattern: "rings" },
  { label: "Işık", icon: "✦", accent: "#a9d1e2", background: "linear-gradient(180deg, rgba(12,25,22,0.92), rgba(9,19,17,0.78))", pattern: "grid" },
  { label: "Dalga", icon: "≈", accent: "#7fb2cc", background: "linear-gradient(180deg, rgba(9,21,19,0.92), rgba(6,14,13,0.82))", pattern: "wave" },
  { label: "Çember", icon: "○", accent: "#4f93b5", background: "linear-gradient(180deg, rgba(8,21,19,0.92), rgba(6,15,14,0.82))", pattern: "rings" },
  { label: "Kare", icon: "□", accent: "#6aa6c4", background: "linear-gradient(180deg, rgba(10,20,18,0.92), rgba(7,15,14,0.80))", pattern: "grid" },
];

// ── Session Set Presets ──
export const SESSION_SET_PRESETS: readonly SessionSetPreset[] = [
  { id: "daily", label: "Günlük Rutin", games: ["memory", "pulse", "scan"] as GameKey[], emoji: "📅", description: "3 oyun · Temel egzersiz" },
  { id: "memory", label: "Hafıza Seti", games: ["memory", "pairs"] as GameKey[], emoji: "🧠", description: "2 oyun · Bellek güçlendirme" },
  { id: "motor", label: "Motor Seti", games: ["pulse", "route"] as GameKey[], emoji: "✋", description: "2 oyun · El-göz koordinasyonu" },
  { id: "visual", label: "Görsel Set", games: ["difference", "scan"] as GameKey[], emoji: "👁", description: "2 oyun · Dikkat ve tarama" },
  { id: "full", label: "Tam Set", games: ["memory", "pairs", "pulse", "route", "difference", "scan", "logic"] as GameKey[], emoji: "⚡", description: "7 oyun · Kapsamlı seans" },
];

// ── Game Tabs ──
export const GAME_TABS: readonly GameTab[] = [
  { key: "memory", category: "memorySkills", title: "Sıra Hafızası", kicker: "Çalışma belleği", blurb: "Art arda yanan mavi alanları aynı sırayla tekrar et. Her doğru tur sekansı bir adım daha uzatır.", goals: ["Sekans hafızası", "Odak sürdürme", "Görsel izleme"], teaser: "Kısa süreli hatırlama için katmanlı sekans oyunu.", accent: "#7fb2cc", preview: ["Deseni izle", "Aynı sırayı gir", "Seriyi büyüt"] },
  { key: "pairs", category: "memorySkills", title: "Kart Eşle", kicker: "Görsel hatırlama", blurb: "On iki kart içindeki eş çiftleri en az hamleyle bul. Açılan kartların konumunu akılda tutman gerekir.", goals: ["Kısa süreli hatırlama", "Görsel yer bellek", "Planlı seçim"], teaser: "Kapalı kartlar arasında eş çift bulmaya odaklanan hafıza görevi.", accent: "#8fbdd6", preview: ["Kart aç", "Konumu hatırla", "Çiftleri tamamla"] },
  { key: "pulse", category: "motorSkills", title: "Mavi Nabız", kicker: "Hedefe dokunma", blurb: "Işıklanan hedefe hızlı ama kontrollü dokun. Doğruluk ve seri performansı birlikte puan üretir.", goals: ["El-göz koordinasyonu", "Hedefleme", "Tepki kalitesi"], teaser: "Ritim ve doğruluğu bir arada tutan dinamik hedef oyunu.", accent: "#7fb2cc", preview: ["Hedef görünür", "Doğru kareye dokun", "Seriyi koru"] },
  { key: "route", category: "motorSkills", title: "Komut Rotası", kicker: "Motor yanıt", blurb: "Ekranda verilen yön komutuna uygun oka bas. Hızlı karar verme ile kontrollü yön seçimi aynı oyunda birleşir.", goals: ["Motor planlama", "Yön komutu takibi", "Hızlı karar"], teaser: "Dört yönlü pad ile çalışan kontrollü komut oyunu.", accent: "#8fbdd6", preview: ["Komutu gör", "Doğru yönü seç", "Seriyi uzat"] },
  { key: "difference", category: "visualSkills", title: "Fark Avcısı", kicker: "Görsel ayrım", blurb: "Benzer kartlar içinden farklı olanı bul. Dikkatli tarama ve hızlı karşılaştırma gerekir.", goals: ["Görsel ayrım", "Figür-zemin farkı", "Tarama rutini"], teaser: "Benzer kartlar arasında tek farkı bulmaya odaklanan görev.", accent: "#9ac7dc", preview: ["Kartları tara", "Farkı ayıkla", "Turu tamamla"] },
  { key: "scan", category: "visualSkills", title: "Hedef Tarama", kicker: "Seçici dikkat", blurb: "Üstte gösterilen hedef simgeyi kalabalık ızgara içinde seç. Her tur yeni hedef gelir ve dikkat filtrelemesi gerekir.", goals: ["Seçici dikkat", "Tarama hızı", "Hedef bulma"], teaser: "Belirli simgeyi ızgara içinde aratan dikkat oyunu.", accent: "#a9d1e2", preview: ["Hedefi gör", "Izgarayı tara", "Doğru simgeyi seç"] },
  { key: "logic", category: "cognitiveSkills", title: "Dizi Mantık", kicker: "Örüntü tamamlama", blurb: "3×3 matristeki şekil-renk örüntüsünü analiz et, eksik hücreyi 4 seçenek arasından bul. Her tur yeni bir kural, yeni bir zorluk.", goals: ["Tümevarımsal akıl yürütme", "Örüntü tanıma", "Çalışma belleği"], teaser: "Şekil ve renk kurallarını çözerek eksik hücreyi tamamlayan mantık oyunu.", accent: "#35b0a0", preview: ["Matrisi incele", "Kuralı çöz", "Doğru seçeneği seç"] },
];

// ── Game Categories ──
export const GAME_CATEGORIES: readonly GameCategory[] = [
  { key: "memorySkills", title: "Hafıza Oyunları", kicker: "Bellek alanı", icon: "◎", description: "Sekans, eşleme ve kısa süreli hatırlama görevleri aynı modül altında toplanır." },
  { key: "motorSkills", title: "Motor Beceri Oyunları", kicker: "Motor alanı", icon: "✦", description: "Hedefleme, yön takibi ve ritim odaklı yanıtlar daha kontrollü bir çalışma akışı sunar." },
  { key: "visualSkills", title: "Görsel Algı Oyunları", kicker: "Algı alanı", icon: "◌", description: "Görsel ayrım, tarama ve seçici dikkat görevleri aynı görsel sistem içinde ilerler." },
  { key: "cognitiveSkills", title: "Bilişsel Beceri Oyunları", kicker: "Mantık alanı", icon: "◈", description: "Tümevarım, örüntü çözme ve soyut akıl yürütme görevleri problem çözme kapasitesini artırır." },
];

// ── Empty / Default Scoreboard ──
export const EMPTY_SCOREBOARD: Scoreboard = {
  memory: { label: GAME_LABELS.memory, best: 0, last: 0, plays: 0 },
  pairs: { label: GAME_LABELS.pairs, best: 0, last: 0, plays: 0 },
  pulse: { label: GAME_LABELS.pulse, best: 0, last: 0, plays: 0 },
  route: { label: GAME_LABELS.route, best: 0, last: 0, plays: 0 },
  difference: { label: GAME_LABELS.difference, best: 0, last: 0, plays: 0 },
  scan: { label: GAME_LABELS.scan, best: 0, last: 0, plays: 0 },
  logic: { label: GAME_LABELS.logic, best: 0, last: 0, plays: 0 },
};

// ── Phase Labels ──
export const PHASE_LABELS: Record<string, string> = {
  idle: "Hazır", showing: "Gösterim", ready: "Yanıt", success: "Başarılı tur",
  playing: "Oynanıyor", finished: "Tamamlandı",
};

// ── Day Keys / Labels ──
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const DAY_LABELS: Record<typeof DAY_KEYS[number], string> = {
  mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt", sun: "Paz",
};

// ── Difficulty Config ──
export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = { 1: "Kolay", 2: "Orta", 3: "Zor" };
export const DIFFICULTY_COLORS: Record<1 | 2 | 3, string> = { 1: "#7aac3a", 2: "#c07c2c", 3: "#d1503c" };

export const GAME_DIFF_CONFIG = {
  memory:     { startLength: [2, 3, 4] as const },
  pairs:      { pairCount:   [5, 8, 8] as const, hideMs: [1000, 700, 450] as const },
  pulse:      { rounds:      [14, 20, 26] as const },
  route:      { rounds:      [12, 18, 24] as const },
  difference: { rounds:      [8,  12, 16] as const },
  scan:       { tileCount:   [9,  9,  16] as const, rounds: [10, 15, 20] as const },
  logic:      { rounds:      [8,  12, 16] as const },
} as const;

/**
 * Her oyunun skor ölçeği.
 *
 * Oyunların puanlaması aynı birimde değil: "Sıra Hafızası" ulaşılan dizi
 * uzunluğunu (≈3-12) verirken "Kart Eşle" hamle cezasından türeyen bir puan
 * (50-280) üretir. Bu yüzden iki oyunun skoru doğrudan karşılaştırılamaz ve
 * "3 puan arttı" ifadesi oyundan oyuna farklı anlam taşır.
 *
 * `typicalMax`, skorları 0–1 aralığına indirmek için kullanılır; böylece
 * eğilim analizi ve alanlar arası karşılaştırma tek bir ölçekte yapılır.
 * Değerler oyun mantığındaki puanlama formüllerinden ve üç yıldız
 * eşiklerinden türetilmiştir.
 */
export const GAME_SCORE_SCALE: Record<GameKey, { typicalMax: number; unit: string }> = {
  memory:     { typicalMax: 12,  unit: "dizi uzunluğu" },
  pairs:      { typicalMax: 280, unit: "puan" },
  pulse:      { typicalMax: 200, unit: "puan" },
  route:      { typicalMax: 200, unit: "puan" },
  difference: { typicalMax: 16,  unit: "doğru tur" },
  scan:       { typicalMax: 20,  unit: "doğru tur" },
  logic:      { typicalMax: 128, unit: "puan" },
};

/** Skoru 0–1 aralığına indirger; oyunlar arası karşılaştırmayı mümkün kılar. */
export function normalizeScore(gameKey: GameKey, score: number): number {
  const scale = GAME_SCORE_SCALE[gameKey];
  if (!scale || scale.typicalMax <= 0) return 0;
  return Math.max(0, Math.min(1, score / scale.typicalMax));
}

// ── Logic Game Constants ──
export const LOGIC_SHAPES: readonly ("circle" | "square" | "triangle" | "diamond")[] = ["circle", "square", "triangle", "diamond"];
export const LOGIC_COLORS = ["#4f93b5", "#7aac3a", "#c07c2c", "#35b0a0", "#d1503c"];
