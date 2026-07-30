/**
 * Klinik eşleştirme katmanı.
 *
 * `therapy-program-data.ts` "hangi aktiviteler var?" sorusunu yanıtlar.
 * Bu dosya "bu danışana hangisi uygun?" sorusunu yanıtlar — yaş, bağımsızlık
 * düzeyi, ortam, seans sıklığı ve oyun performans geçmişini birlikte
 * değerlendirir.
 *
 * Eski `generateWeeklyPlanSuggestion` yalnızca alan anahtarını alıyor ve
 * her danışana `activities.slice(0, 3)` döndürüyordu: 4 yaşındaki bir çocuk
 * ile 70 yaşındaki bir inme danışanı aynı planı görüyordu. Bu katman o
 * davranışı değiştirir.
 */

import { GAME_LABELS, type PlatformGameKey, type RecentSessionEntry } from "@/lib/platform-data";
import {
  THERAPY_DOMAINS,
  getDomainByKey,
  getGameMappingsForDomain,
  type AgeGroupKey,
  type IndependenceLevel,
  type EnvironmentType,
  type TherapyActivity,
  type TherapyDomainKey,
} from "@/lib/therapy-program-data";
import { getMeasuresForDomain, type OutcomeMeasure } from "@/lib/outcome-measures";
import { analyzeClientGames } from "@/lib/therapy-suggestions";

/* ────────────────────────────────────────────────────────────
   1. Aktivite uygunluk profili
   Her aktivitenin hangi yaşa, hangi bağımsızlık düzeyine ve hangi ortama
   uyduğu; ayrıca dozu ve varsa dikkat edilmesi gereken durumlar.
   ──────────────────────────────────────────────────────────── */

export interface ActivityFit {
  /** Aktivitenin anlamlı olduğu yaş grupları */
  readonly ageGroups: readonly AgeGroupKey[];
  /**
   * Uygun bağımsızlık aralığı (INDEPENDENCE_LEVELS skoru, 1-5).
   * min: bu düzeyin altındaki danışan için aktivite çok zor.
   * max: bu düzeyin üstündeki danışan için aktivite çok kolay, gelişim sağlamaz.
   */
  readonly independence: { readonly min: number; readonly max: number };
  /** Uygulanabileceği ortamlar */
  readonly environments: readonly EnvironmentType[];
  /** Önerilen haftalık tekrar sayısı */
  readonly sessionsPerWeek: number;
  /** Bir sonraki kademeye geçiş ölçütü — terapist bunu somut olarak izler */
  readonly progressionCriterion: string;
  /** Klinik uyarılar; boşsa yok */
  readonly precautions?: readonly string[];
  /** Bu aktivitenin ilerlemesini izlemek için uygun standart ölçüt id'leri */
  readonly measureIds?: readonly string[];
}

/**
 * Yaş grupları sırası — aralık kontrolü için.
 */
const AGE_ORDER: readonly AgeGroupKey[] = ["0-3", "3-6", "6-12", "12-18", "18-30", "30-50", "50-65", "65+"];
const CHILD: readonly AgeGroupKey[] = ["3-6", "6-12"];
const CHILD_TEEN: readonly AgeGroupKey[] = ["3-6", "6-12", "12-18"];
const SCHOOL_TEEN: readonly AgeGroupKey[] = ["6-12", "12-18"];
const ADULT: readonly AgeGroupKey[] = ["18-30", "30-50", "50-65", "65+"];
const TEEN_ADULT: readonly AgeGroupKey[] = ["12-18", "18-30", "30-50", "50-65", "65+"];
const OLDER: readonly AgeGroupKey[] = ["50-65", "65+"];

export const ACTIVITY_FIT: Record<string, ActivityFit> = {
  // ── Pediatrik ──
  "ped-a1": { ageGroups: ["3-6", "6-12"], independence: { min: 2, max: 4 }, environments: ["klinik", "ev", "okul"], sessionsPerWeek: 3, progressionCriterion: "10 boncuğu 2 dakikadan kısa sürede, sözel ipucu olmadan dizebilme", measureIds: ["mabc2", "gas"] },
  "ped-a2": { ageGroups: ["3-6", "6-12"], independence: { min: 1, max: 4 }, environments: ["klinik", "ev"], sessionsPerWeek: 3, progressionCriterion: "Hamuru iki elle koordineli yuvarlayıp şekil verebilme", measureIds: ["sp2", "gas"] },
  "ped-a3": { ageGroups: ["0-3", "3-6", "6-12"], independence: { min: 1, max: 3 }, environments: ["klinik", "ev"], sessionsPerWeek: 3, progressionCriterion: "Kutuya gözü kapalı uzanıp istenen dokuyu ayırt edebilme", precautions: ["Dokunsal savunuculuk varsa girdiyi kademeli sunun; zorlamayın."], measureIds: ["sp2"] },
  "ped-a4": { ageGroups: ["3-6", "6-12"], independence: { min: 2, max: 4 }, environments: ["klinik", "okul", "ev"], sessionsPerWeek: 2, progressionCriterion: "Düz çizgiyi 6 mm sapma içinde kesebilme; sonra eğri ve köşeli şekiller", precautions: ["Makas güvenliği gözetim gerektirir."], measureIds: ["mabc2", "gas"] },
  "ped-a5": { ageGroups: ["3-6", "6-12"], independence: { min: 2, max: 4 }, environments: ["klinik", "okul"], sessionsPerWeek: 2, progressionCriterion: "Tahta üzerinde nesne taşırken 10 saniye düşmeden ilerleyebilme", precautions: ["Nöbet öyküsü veya vestibüler hassasiyet varsa vestibüler girdiyi hekimle görüşmeden yoğunlaştırmayın.", "Düşme koruması için mat kullanın."], measureIds: ["mabc2"] },
  "ped-a6": { ageGroups: ["3-6", "6-12"], independence: { min: 1, max: 4 }, environments: ["ev", "klinik"], sessionsPerWeek: 5, progressionCriterion: "Görsel sekans desteği olmadan giyinme basamaklarını sırayla tamamlayabilme", measureIds: ["copm", "gas"] },
  "ped-a7": { ageGroups: ["3-6", "6-12"], independence: { min: 2, max: 4 }, environments: ["okul", "klinik", "ev"], sessionsPerWeek: 3, progressionCriterion: "Tripod kavramayı 5 dakika boyunca bozulmadan sürdürebilme", measureIds: ["mabc2", "gas"] },

  // ── Ruh sağlığı ──
  "mh-a1": { ageGroups: ["6-12", "12-18", "18-30", "30-50", "50-65"], independence: { min: 2, max: 5 }, environments: ["klinik", "ev", "okul"], sessionsPerWeek: 5, progressionCriterion: "Gün içinde duygu yoğunluğunu hatırlatma olmadan kendi başına derecelendirebilme", measureIds: ["copm", "gas"] },
  "mh-a2": { ageGroups: ["12-18", "18-30", "30-50", "50-65", "65+"], independence: { min: 3, max: 5 }, environments: ["ev", "klinik", "toplum"], sessionsPerWeek: 1, progressionCriterion: "Planlanan haftalık keyifli etkinliklerin en az %70'ini gerçekleştirebilme", measureIds: ["copm"] },
  "mh-a3": { ageGroups: ["6-12", "12-18", "18-30", "30-50", "50-65", "65+"], independence: { min: 2, max: 5 }, environments: ["ev", "klinik", "iş_yeri"], sessionsPerWeek: 7, progressionCriterion: "Kaygı yükseldiğinde tekniği kendiliğinden başlatabilme", precautions: ["Panik bozukluğunda derin nefes bazı danışanlarda hiperventilasyonu tetikleyebilir; tempoyu yavaş tutun."], measureIds: ["gas"] },
  "mh-a4": { ageGroups: ["6-12", "12-18", "18-30", "30-50", "50-65", "65+"], independence: { min: 1, max: 5 }, environments: ["klinik", "ev"], sessionsPerWeek: 1, progressionCriterion: "Ürettiği çalışmayı duyguyla ilişkilendirip sözel olarak açıklayabilme", measureIds: ["copm"] },
  "mh-a5": { ageGroups: ["12-18", "18-30", "30-50", "50-65", "65+"], independence: { min: 3, max: 5 }, environments: ["klinik", "toplum"], sessionsPerWeek: 1, progressionCriterion: "Grup içinde yönlendirme olmadan en az iki kez söz alabilme", measureIds: ["copm", "gas"] },
  "mh-a6": { ageGroups: ["12-18", "18-30", "30-50", "50-65", "65+"], independence: { min: 3, max: 5 }, environments: ["ev", "klinik"], sessionsPerWeek: 5, progressionCriterion: "10 dakikalık uygulamayı dikkat kayması olmadan sürdürebilme", measureIds: ["gas"] },

  // ── Nörolojik ──
  "nr-a1": { ageGroups: ["18-30", "30-50", "50-65", "65+"], independence: { min: 2, max: 4 }, environments: ["klinik"], sessionsPerWeek: 5, progressionCriterion: "Etkilenen üst ekstremiteyle hedef görevi %80 başarıyla tamamlayabilme", precautions: ["Sağlam ekstremiteyi kısıtlama günde 6 saati aşmamalı ve düşme riski değerlendirilmeli.", "Omuz subluksasyonu veya ağrı varsa protokolü uyarlayın."], measureIds: ["copm", "gas"] },
  "nr-a2": { ageGroups: ["18-30", "30-50", "50-65", "65+"], independence: { min: 2, max: 5 }, environments: ["klinik", "ev"], sessionsPerWeek: 3, progressionCriterion: "Dikkat görevinde hata oranını iki ardışık seansta koruyarak zorluk kademesini yükseltebilme", measureIds: ["moca", "gas"] },
  "nr-a3": { ageGroups: ["18-30", "30-50", "50-65", "65+"], independence: { min: 2, max: 4 }, environments: ["klinik", "ev"], sessionsPerWeek: 5, progressionCriterion: "Sol yarı alandaki hedeflerin en az %90'ını ipucu olmadan bulabilme", precautions: ["İhmal varlığında güvenlik için çevre düzenlemesi ve refakat gerekir."], measureIds: ["copm", "gas"] },
  "nr-a4": { ageGroups: ["18-30", "30-50", "50-65", "65+"], independence: { min: 3, max: 5 }, environments: ["klinik", "ev"], sessionsPerWeek: 2, progressionCriterion: "Çok basamaklı mutfak görevini gözetim düzeyinde tamamlayabilme", precautions: ["Sıcak yüzey ve kesici alet kullanımı gözetim gerektirir.", "Yutma güçlüğü varsa tadım basamaklarını çıkarın."], measureIds: ["copm", "gas"] },
  "nr-a5": { ageGroups: ["18-30", "30-50", "50-65", "65+"], independence: { min: 1, max: 3 }, environments: ["klinik", "ev"], sessionsPerWeek: 5, progressionCriterion: "Ayna geri bildirimiyle etkilenen elde istemli hareket başlatabilme", measureIds: ["gas"] },

  // ── Nöroçeşitlilik ──
  "nd-a1": { ageGroups: ["3-6", "6-12", "12-18"], independence: { min: 1, max: 4 }, environments: ["okul", "klinik", "ev"], sessionsPerWeek: 5, progressionCriterion: "Devre sonrası 15 dakika boyunca masa başı göreve katılabilme", precautions: ["Duyusal diyet bireysel profile göre kurulmalı; genel bir reçete değildir."], measureIds: ["sp2", "gas"] },
  "nd-a2": { ageGroups: ["3-6", "6-12", "12-18"], independence: { min: 2, max: 4 }, environments: ["okul", "ev", "klinik"], sessionsPerWeek: 3, progressionCriterion: "Hedef sosyal durumda hikayedeki davranışı ipucu olmadan uygulayabilme", measureIds: ["gas", "copm"] },
  "nd-a3": { ageGroups: ["6-12", "12-18"], independence: { min: 2, max: 5 }, environments: ["klinik", "okul"], sessionsPerWeek: 3, progressionCriterion: "Dur işaretinde yanlış yanıt oranını %10'un altına indirebilme", measureIds: ["gas"] },
  "nd-a4": { ageGroups: ["6-12", "12-18"], independence: { min: 3, max: 5 }, environments: ["klinik", "okul"], sessionsPerWeek: 1, progressionCriterion: "Grup içinde rolünü sürdürüp akranıyla iş birliği kurabilme", measureIds: ["copm", "gas"] },
  "nd-a5": { ageGroups: ["3-6", "6-12", "12-18"], independence: { min: 1, max: 4 }, environments: ["okul", "ev"], sessionsPerWeek: 7, progressionCriterion: "Geçişlerde tepki süresinin ve itirazın belirgin azalması", measureIds: ["gas"] },

  // ── Geriatrik ──
  "ge-a1": { ageGroups: ["50-65", "65+"], independence: { min: 2, max: 4 }, environments: ["klinik", "ev", "toplum"], sessionsPerWeek: 3, progressionCriterion: "Sandalyeden desteksiz 5 kez kalkabilme, ardından ayakta programa geçiş", precautions: ["Ortostatik hipotansiyon ve kardiyak kısıtlılık açısından değerlendirin.", "Denge programına geçmeden önce düşme riskini ölçün."], measureIds: ["bbs", "copm"] },
  "ge-a2": { ageGroups: ["50-65", "65+"], independence: { min: 2, max: 5 }, environments: ["klinik", "ev"], sessionsPerWeek: 3, progressionCriterion: "Aynı zorluk kademesinde iki ardışık seansta performansı koruyabilme", measureIds: ["moca"] },
  "ge-a3": { ageGroups: ["50-65", "65+"], independence: { min: 3, max: 5 }, environments: ["ev"], sessionsPerWeek: 2, progressionCriterion: "Öğün hazırlığını yorgunluk artışı olmadan tamamlayabilme", precautions: ["Ocak ve sıcak su güvenliği önce değerlendirilmeli."], measureIds: ["copm", "gas"] },
  "ge-a4": { ageGroups: ["50-65", "65+"], independence: { min: 2, max: 4 }, environments: ["ev", "klinik"], sessionsPerWeek: 5, progressionCriterion: "Kavrama kuvvetinde ölçülebilir artış ve kavanoz açma gibi işlevsel görevde bağımsızlık", precautions: ["Aktif artrit alevlenmesinde direnç uygulamayın."], measureIds: ["copm"] },
  "ge-a5": { ageGroups: ["50-65", "65+"], independence: { min: 2, max: 5 }, environments: ["toplum", "klinik"], sessionsPerWeek: 1, progressionCriterion: "Gruba düzenli katılım ve etkinlik seçiminde kendi tercihini belirtebilme", measureIds: ["copm"] },

  // ── İş & okul katılımı ──
  "wp-a1": { ageGroups: ["12-18", "18-30", "30-50", "50-65"], independence: { min: 3, max: 5 }, environments: ["iş_yeri", "okul", "ev"], sessionsPerWeek: 5, progressionCriterion: "Kesintisiz 25 dakikalık bloğu hatırlatma olmadan tamamlayabilme", measureIds: ["copm", "gas"] },
  "wp-a2": { ageGroups: ["18-30", "30-50", "50-65"], independence: { min: 3, max: 5 }, environments: ["iş_yeri", "ev"], sessionsPerWeek: 1, progressionCriterion: "Düzenleme sonrası gün sonu ağrı/yorgunluk bildiriminde azalma", measureIds: ["copm"] },
  "wp-a3": { ageGroups: ["12-18", "18-30", "30-50", "50-65"], independence: { min: 3, max: 5 }, environments: ["ev", "okul", "iş_yeri"], sessionsPerWeek: 1, progressionCriterion: "Planlanan görevlerin en az %70'ini haftalık olarak tamamlayabilme", measureIds: ["copm", "gas"] },
  "wp-a4": { ageGroups: ["6-12", "12-18", "18-30", "30-50"], independence: { min: 2, max: 5 }, environments: ["okul", "iş_yeri", "ev"], sessionsPerWeek: 5, progressionCriterion: "Görev sırasında kendiliğinden bölünme sayısının belirgin azalması", measureIds: ["gas"] },

  // ── Toplum & sosyal katılım ──
  "cs-a1": { ageGroups: ["12-18", "18-30", "30-50", "50-65", "65+"], independence: { min: 3, max: 5 }, environments: ["toplum"], sessionsPerWeek: 1, progressionCriterion: "Planlanan geziyi refakatsiz, planladığı bütçe ve sürede tamamlayabilme", precautions: ["İlk gezilerde refakat şart; güzergâh önceden birlikte planlanmalı."], measureIds: ["copm", "gas"] },
  "cs-a2": { ageGroups: ["12-18", "18-30", "30-50", "50-65", "65+"], independence: { min: 2, max: 5 }, environments: ["toplum", "klinik"], sessionsPerWeek: 1, progressionCriterion: "En az bir hobiyi seansların dışında sürdürmeye başlaması", measureIds: ["copm"] },
  "cs-a3": { ageGroups: ["12-18", "18-30", "30-50", "50-65", "65+"], independence: { min: 2, max: 4 }, environments: ["klinik", "toplum"], sessionsPerWeek: 2, progressionCriterion: "Gerçek alışverişte para üstünü doğru hesaplayabilme", measureIds: ["copm", "gas"] },
};

/* ────────────────────────────────────────────────────────────
   2. Danışan bağlamı ve uygunluk puanlama
   ──────────────────────────────────────────────────────────── */

export interface ClientContext {
  readonly clientId: string;
  readonly displayName: string;
  readonly ageGroup: AgeGroupKey | null;
  /** INDEPENDENCE_LEVELS skoru, 1-5 */
  readonly independenceScore: number | null;
  readonly environments: readonly EnvironmentType[];
  readonly sessionsPerWeek: number;
  readonly primaryGoal: string;
}

export type FitVerdict = "ideal" | "uygun" | "kolay" | "zor" | "yaş-dışı";

export interface ScoredActivity {
  readonly activity: TherapyActivity;
  readonly fit: ActivityFit | null;
  readonly verdict: FitVerdict;
  /** 0-100; sıralama için */
  readonly score: number;
  /** Neden bu sırada olduğunun tek cümlelik açıklaması */
  readonly rationale: string;
  readonly blocked: boolean;
}

function ageIndex(age: AgeGroupKey | null): number {
  return age ? AGE_ORDER.indexOf(age) : -1;
}

/**
 * Bir aktiviteyi danışan bağlamına göre puanlar.
 *
 * Puan, "ne kadar uygun" değil "şu an ne kadar öncelikli" demektir:
 * yaşa uymayan aktivite elenir, çok kolay olan geri plana düşer, danışanın
 * bağımsızlık düzeyinin bir kademe üstündeki aktivite öne çıkar (yakınsal
 * gelişim alanı mantığı).
 */
export function scoreActivity(activity: TherapyActivity, context: ClientContext): ScoredActivity {
  const fit = ACTIVITY_FIT[activity.id] ?? null;

  if (!fit) {
    return {
      activity, fit: null, verdict: "uygun", score: 40,
      rationale: "Uygunluk profili tanımlı değil; klinik değerlendirmenizle seçin.",
      blocked: false,
    };
  }

  // Yaş dışıysa öneriden çıkar.
  if (context.ageGroup && !fit.ageGroups.includes(context.ageGroup)) {
    return {
      activity, fit, verdict: "yaş-dışı", score: 0,
      rationale: `${context.ageGroup} yaş grubu için tasarlanmamış.`,
      blocked: true,
    };
  }

  let score = 50;
  const reasons: string[] = [];

  // Bağımsızlık uyumu — asıl sinyal burada.
  const ind = context.independenceScore;
  let verdict: FitVerdict = "uygun";
  if (ind !== null) {
    if (ind < fit.independence.min) {
      score -= 30;
      verdict = "zor";
      reasons.push("bağımsızlık düzeyinin üstünde, ek destekle uygulanmalı");
    } else if (ind > fit.independence.max) {
      score -= 20;
      verdict = "kolay";
      reasons.push("mevcut düzey için fazla kolay, gelişim sağlamayabilir");
    } else if (ind === fit.independence.max) {
      score += 25;
      verdict = "ideal";
      reasons.push("bir sonraki kademeye hazırlayan zorluk düzeyinde");
    } else {
      score += 15;
      verdict = "uygun";
      reasons.push("bağımsızlık düzeyiyle uyumlu");
    }
  }

  // Ortam uyumu
  if (context.environments.length > 0) {
    const overlap = fit.environments.filter((env) => context.environments.includes(env));
    if (overlap.length > 0) {
      score += 10;
    } else {
      score -= 15;
      reasons.push("seçilen ortamlarda uygulanması zor");
    }
  }

  // Haftalık sıklık gerçekçiliği
  if (fit.sessionsPerWeek <= context.sessionsPerWeek || fit.sessionsPerWeek >= 5) {
    score += 5;
  } else {
    score -= 8;
    reasons.push(`önerilen sıklık haftada ${fit.sessionsPerWeek}, planlanan sıklığın üstünde`);
  }

  // Ev programına verilebiliyorsa değerli
  if (activity.homeExercise) score += 6;
  // Kanıt künyesi olan aktivite tercih edilir
  if (activity.evidenceBase) score += 4;

  return {
    activity,
    fit,
    verdict,
    score: Math.max(0, Math.min(100, score)),
    rationale: reasons.length > 0 ? reasons.join("; ") : "Profil ile uyumlu",
    blocked: false,
  };
}

/* ────────────────────────────────────────────────────────────
   3. Haftalık plan üretimi
   ──────────────────────────────────────────────────────────── */

export interface PlannedDay {
  readonly dayKey: string;
  readonly dayLabel: string;
  readonly activity: TherapyActivity | null;
  readonly game: PlatformGameKey | null;
  readonly gameLabel: string | null;
  /** Bu günün amacı — sadece "gözlem yapılacak" değil, somut hedef */
  readonly focus: string;
  readonly minutes: number;
}

export interface TherapyPlan {
  readonly domainKey: TherapyDomainKey;
  readonly domainLabel: string;
  readonly context: ClientContext;
  /** Öncelik sırasına dizilmiş, uygulanabilir aktiviteler */
  readonly recommended: readonly ScoredActivity[];
  /** Yaş veya profil nedeniyle elenenler — şeffaflık için gösterilir */
  readonly excluded: readonly ScoredActivity[];
  readonly days: readonly PlannedDay[];
  /** Haftalık toplam seans dakikası */
  readonly weeklyMinutes: number;
  /** Bu alan + yaş için uygun standart ölçütler */
  readonly measures: readonly OutcomeMeasure[];
  /** Tüm önerilerdeki benzersiz uyarılar */
  readonly precautions: readonly string[];
  /** Oyun geçmişinden gelen, alana özgü not */
  readonly performanceNote: string;
  /** Planın hangi girdilerle üretildiği — terapist güvenmeden önce görmeli */
  readonly basis: readonly string[];
}

const DAY_SEQUENCE = [
  { key: "mon", label: "Pazartesi" },
  { key: "tue", label: "Salı" },
  { key: "wed", label: "Çarşamba" },
  { key: "thu", label: "Perşembe" },
  { key: "fri", label: "Cuma" },
  { key: "sat", label: "Cumartesi" },
  { key: "sun", label: "Pazar" },
] as const;

/** Seans sıklığına göre haftaya en dengeli dağılan günler. */
function pickDays(sessionsPerWeek: number): typeof DAY_SEQUENCE[number][] {
  const n = Math.max(1, Math.min(7, sessionsPerWeek));
  if (n === 1) return [DAY_SEQUENCE[2]];
  if (n === 2) return [DAY_SEQUENCE[1], DAY_SEQUENCE[3]];
  if (n === 3) return [DAY_SEQUENCE[0], DAY_SEQUENCE[2], DAY_SEQUENCE[4]];
  if (n === 4) return [DAY_SEQUENCE[0], DAY_SEQUENCE[1], DAY_SEQUENCE[3], DAY_SEQUENCE[4]];
  if (n === 5) return DAY_SEQUENCE.slice(0, 5) as unknown as typeof DAY_SEQUENCE[number][];
  if (n === 6) return DAY_SEQUENCE.slice(0, 6) as unknown as typeof DAY_SEQUENCE[number][];
  return [...DAY_SEQUENCE];
}

/**
 * Danışana özel haftalık terapi planı üretir.
 *
 * Girdi olarak yalnızca alan değil, danışanın yaşı, bağımsızlık düzeyi,
 * ortamı, seans sıklığı ve gerçek oyun geçmişi kullanılır.
 */
export function buildTherapyPlan(
  domainKey: TherapyDomainKey,
  context: ClientContext,
  recentSessions: readonly RecentSessionEntry[] = [],
): TherapyPlan | null {
  const domain = getDomainByKey(domainKey);
  if (!domain) return null;

  const scored = domain.activities
    .map((activity) => scoreActivity(activity, context))
    .sort((a, b) => b.score - a.score);

  const recommended = scored.filter((s) => !s.blocked);
  const excluded = scored.filter((s) => s.blocked);

  /* Oyun seçimi: alanla eşleşen oyunlar arasından, danışanın en zayıf
     olduğu alan öne alınır. Böylece plan geçmiş performansa tepki verir. */
  const mappings = getGameMappingsForDomain(domainKey);
  const analyses = analyzeClientGames(context.clientId, [...recentSessions]);
  const analysisByKey = new Map(analyses.map((a) => [a.gameKey, a]));

  const rankedGames = mappings
    .map((mapping) => {
      const analysis = analysisByKey.get(mapping.gameKey);
      /* Hiç oynanmamış oyun taban ölçümü için değerlidir; düşük performanslı
         oyun çalışma gerektirir. İkisi de öne alınır. */
      const priority = !analysis || analysis.plays === 0 ? 0.75 : 1 - analysis.relativeScore;
      return { gameKey: mapping.gameKey, priority, analysis };
    })
    .sort((a, b) => b.priority - a.priority);

  const days = pickDays(context.sessionsPerWeek).map((day, index) => {
    const pick = recommended[index % Math.max(1, recommended.length)] ?? null;
    const game = rankedGames[index % Math.max(1, rankedGames.length)] ?? null;
    const activity = pick?.activity ?? null;
    return {
      dayKey: day.key,
      dayLabel: day.label,
      activity,
      game: game?.gameKey ?? null,
      gameLabel: game ? GAME_LABELS[game.gameKey] : null,
      focus: activity
        ? `${activity.subSkill} — ${pick?.fit?.progressionCriterion ?? "ilerleme ölçütü klinik olarak belirlenecek"}`
        : "Aktivite seçilmedi",
      minutes: activity?.sessionMinutes ?? 0,
    };
  });

  const weeklyMinutes = days.reduce((total, day) => total + day.minutes, 0);

  const precautions = Array.from(
    new Set(recommended.flatMap((s) => s.fit?.precautions ?? [])),
  );

  const measures = getMeasuresForDomain(domainKey, context.ageGroup ?? undefined);

  const playedInDomain = rankedGames.filter((g) => (g.analysis?.plays ?? 0) > 0);
  const weakest = rankedGames.find((g) => (g.analysis?.plays ?? 0) > 0);
  const performanceNote =
    playedInDomain.length === 0
      ? `Bu alandaki oyunlar henüz oynanmadı. İlk hafta taban ölçümü olarak planlandı.`
      : weakest
        ? `${GAME_LABELS[weakest.gameKey]} bu alandaki en düşük performanslı oyun (son 3 seans ort. %${Math.round((weakest.analysis?.relativeScore ?? 0) * 100)}); plan bu oyunla başlıyor.`
        : "Alan içi oyun performansı dengeli.";

  const basis: string[] = [
    context.ageGroup ? `Yaş grubu: ${context.ageGroup}` : "Yaş grubu girilmemiş — yaş filtresi uygulanamadı",
    context.independenceScore !== null
      ? `Bağımsızlık düzeyi: ${context.independenceScore}/5`
      : "Bağımsızlık düzeyi girilmemiş — zorluk eşleşmesi yapılamadı",
    `Haftada ${context.sessionsPerWeek} seans`,
    context.environments.length > 0 ? `Ortam: ${context.environments.join(", ")}` : "Ortam seçilmemiş",
    `${recentSessions.filter((s) => s.clientId === context.clientId).length} oyun seansı geçmişi`,
  ];

  return {
    domainKey,
    domainLabel: domain.label,
    context,
    recommended,
    excluded,
    days,
    weeklyMinutes,
    measures,
    precautions,
    performanceNote,
    basis,
  };
}

/**
 * Danışanın profiline en uygun terapi alanlarını puanlar.
 * "Hangi alandan başlamalıyım?" sorusunu yanıtlar.
 */
export function rankDomainsForClient(context: ClientContext): Array<{
  readonly domainKey: TherapyDomainKey;
  readonly label: string;
  readonly score: number;
  readonly reason: string;
}> {
  const goalText = context.primaryGoal.toLocaleLowerCase("tr");

  return THERAPY_DOMAINS.map((domain) => {
    let score = 0;
    const reasons: string[] = [];

    if (context.ageGroup && domain.suitableAgeGroups.includes(context.ageGroup)) {
      score += 40;
      reasons.push("yaş grubuna uygun");
    }

    /* Danışanın birincil hedefi, alanın hedef ve alt beceri etiketleriyle
       kelime düzeyinde eşleşiyor mu? */
    const haystack = [
      ...domain.goals.map((g) => g.label),
      ...domain.subSkills.map((s) => s.label),
      ...domain.challenges.map((c) => c.label),
    ]
      .join(" ")
      .toLocaleLowerCase("tr");
    const goalWords = goalText.split(/\s+/).filter((w) => w.length > 3);
    const hits = goalWords.filter((w) => haystack.includes(w)).length;
    if (hits > 0) {
      score += Math.min(40, hits * 20);
      reasons.push("birincil hedefle örtüşüyor");
    }

    /* Uygulanabilir aktivite sayısı — alan seçilirse gerçekten iş çıkar mı? */
    const usable = domain.activities.filter(
      (a) => !scoreActivity(a, context).blocked,
    ).length;
    score += Math.min(20, usable * 3);
    if (usable === 0) reasons.push("bu yaş için uygulanabilir aktivite yok");

    return {
      domainKey: domain.key,
      label: domain.label,
      score,
      reason: reasons.length > 0 ? reasons.join(", ") : "profil ile sınırlı örtüşme",
    };
  }).sort((a, b) => b.score - a.score);
}

export { AGE_ORDER, ageIndex, CHILD, CHILD_TEEN, SCHOOL_TEEN, ADULT, TEEN_ADULT, OLDER };
