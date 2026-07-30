/**
 * Platform istatistikleri — tanıtım yüzeylerinde gösterilen her sayı
 * buradan, gerçek veri kaynaklarından türetilir. Elle yazılmış sayı yok.
 *
 * Bir domain / aktivite / oyun eklendiğinde landing sayfasındaki rakamlar
 * kendiliğinden güncellenir; böylece pazarlama metni ile ürün asla ayrışmaz.
 */

import { GAME_TABS } from "@/lib/game-constants";
import { GAME_LABELS } from "@/lib/platform-data";
import {
  GAME_THERAPY_MAPPINGS,
  THERAPY_DOMAINS,
  type TherapyActivity,
} from "@/lib/therapy-program-data";
import { THERAPY_PROTOCOLS } from "@/lib/therapy-protocols";

const allActivities: TherapyActivity[] = THERAPY_DOMAINS.flatMap((domain) => domain.activities);

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

export const PLATFORM_STATS = {
  /** Oynanabilir terapi oyunu sayısı */
  gameCount: GAME_TABS.length,
  /** Ergoterapi uygulama alanı (domain) sayısı */
  domainCount: THERAPY_DOMAINS.length,
  /** Kütüphanedeki toplam kanıt temelli aktivite sayısı */
  activityCount: allActivities.length,
  /** Ev programına verilebilecek aktivite sayısı */
  homeExerciseCount: allActivities.filter((activity) => activity.homeExercise).length,
  /** Tanımlı terapi hedefi sayısı */
  goalCount: THERAPY_DOMAINS.reduce((total, domain) => total + domain.goals.length, 0),
  /** Alt beceri (sub-skill) sayısı */
  subSkillCount: THERAPY_DOMAINS.reduce((total, domain) => total + domain.subSkills.length, 0),
  /** Haftalık protokol şablonu sayısı */
  protocolCount: THERAPY_PROTOCOLS.length,
  /** Protokollerin kapsadığı toplam hafta sayısı */
  protocolWeekCount: THERAPY_PROTOCOLS.reduce((total, protocol) => total + protocol.weeks.length, 0),
  /** Oyun–terapi eşlemesi bulunan oyun sayısı */
  mappedGameCount: unique(GAME_THERAPY_MAPPINGS.map((mapping) => mapping.gameKey)).length,
  /** Aktivitelerin kapsadığı toplam seans dakikası */
  activityMinutes: allActivities.reduce((total, activity) => total + activity.sessionMinutes, 0),
  /** Literatür atfı taşıyan aktivite sayısı */
  citedActivityCount: allActivities.filter((activity) => Boolean(activity.evidenceBase)).length,
  /** Yaş aralığı kapsaması */
  ageGroupCount: unique(THERAPY_DOMAINS.flatMap((domain) => domain.suitableAgeGroups)).length,
} as const;

/** Landing sayfasındaki "rakamlarla Mimio" şeridi. */
export const HERO_STATS = [
  {
    value: String(PLATFORM_STATS.gameCount),
    label: "Terapi oyunu",
    hint: "Her biri belirli bir bilişsel veya motor paradigmaya dayanır",
  },
  {
    value: String(PLATFORM_STATS.activityCount),
    label: "Kanıt temelli aktivite",
    hint: `${PLATFORM_STATS.citedActivityCount} tanesi literatür atfı taşır`,
  },
  {
    value: String(PLATFORM_STATS.domainCount),
    label: "Uygulama alanı",
    hint: "Pediatriden geriatriye AOTA çerçevesiyle uyumlu",
  },
  {
    value: String(PLATFORM_STATS.protocolCount),
    label: "Hazır protokol",
    hint: `Toplam ${PLATFORM_STATS.protocolWeekCount} haftalık yapılandırılmış program`,
  },
] as const;

export const GAME_COUNT_LABEL = `${PLATFORM_STATS.gameCount} oyun`;

export type GameLabelKey = keyof typeof GAME_LABELS;
