/**
 * Rule-based therapy suggestion engine for Mimio platform.
 * Analyzes client game sessions and generates evidence-based recommendations.
 * Extracted from MimioApp.tsx for maintainability.
 */

import { GAME_LABELS, type ClientProfile, type RecentSessionEntry } from "@/lib/platform-data";
import type { GameAnalysis, GameKey, GameTrend, TherapySuggestion } from "@/lib/game-types";
import { normalizeScore } from "@/lib/game-constants";
import { THERAPY_PROTOCOLS, GOAL_PROTOCOL_MAP } from "@/lib/therapy-protocols";

/**
 * Eğilim eşiği: son üç seansın ortalaması, önceki seansların ortalamasından
 * en az bu oranda saparsa "gelişiyor" / "geriliyor" denir.
 *
 * Sabit puan farkı kullanılamaz: 3 puanlık değişim "Sıra Hafızası"nda
 * (ölçek ≈12) belirgin bir sıçramayken "Kart Eşle"de (ölçek 280) ölçüm
 * gürültüsüdür. Bu yüzden karşılaştırma normalize skor üzerinden, göreli
 * olarak yapılır.
 */
const TREND_RELATIVE_THRESHOLD = 0.1;

/** Anlamlı bir eğilim için gereken en az seans sayısı. */
const MIN_SESSIONS_FOR_TREND = 4;

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function analyzeClientGames(
  clientId: string,
  recentSessions: RecentSessionEntry[],
): GameAnalysis[] {
  const allGames: GameKey[] = ["memory", "pairs", "pulse", "route", "difference", "scan", "logic"];
  const clientSessions = recentSessions.filter(s => s.clientId === clientId);
  const now = Date.now();

  return allGames.map(gameKey => {
    const gameSessions = clientSessions
      .filter(s => s.gameKey === gameKey)
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

    const plays = gameSessions.length;
    const scores = gameSessions.map(s => s.score);
    const best = plays > 0 ? Math.max(...scores) : 0;
    const last3Avg = mean(scores.slice(0, 3));
    const last5Avg = mean(scores.slice(0, 5));

    /*
     * Eğilim: son 3 seans ile ondan önceki seanslar karşılaştırılır.
     * Önceki kod son 3'ü, son 5'in içinde son 3'ü de barındıran ortalamayla
     * kıyaslıyordu; bu, gerçek değişimi sistematik olarak küçültüyordu.
     */
    let trend: GameTrend = "new";
    if (plays >= MIN_SESSIONS_FOR_TREND) {
      const recentMean = mean(scores.slice(0, 3));
      const priorMean = mean(scores.slice(3));
      const recentNorm = normalizeScore(gameKey, recentMean);
      const priorNorm = normalizeScore(gameKey, priorMean);
      const delta = recentNorm - priorNorm;
      if (delta > TREND_RELATIVE_THRESHOLD) trend = "improving";
      else if (delta < -TREND_RELATIVE_THRESHOLD) trend = "declining";
      else trend = "stable";
    } else if (plays >= 2) {
      trend = "stable";
    }

    const lastPlayedAt = gameSessions.length > 0 ? new Date(gameSessions[0].playedAt).getTime() : null;
    const daysSinceLastPlay = lastPlayedAt !== null ? Math.floor((now - lastPlayedAt) / (1000 * 60 * 60 * 24)) : null;

    /* Oyunun kendi ölçeğine göre 0–1; alanlar arası karşılaştırma için. */
    const relativeScore = normalizeScore(gameKey, last3Avg);

    return { gameKey, label: GAME_LABELS[gameKey], plays, best, last3Avg, last5Avg, trend, relativeScore, daysSinceLastPlay };
  });
}

export function generateTherapySuggestions(
  client: ClientProfile,
  recentSessions: RecentSessionEntry[],
): TherapySuggestion {
  const analyses = analyzeClientGames(client.id, recentSessions);
  const playedGames = analyses.filter(a => a.plays > 0);
  const totalPlays = playedGames.reduce((sum, a) => sum + a.plays, 0);

  if (totalPlays < 3) {
    return {
      strengths: [], attentionAreas: [], recommendedSet: ["memory", "pulse", "scan"],
      protocolId: null, protocolName: null,
      performanceSummary: "Henüz yeterli veri yok. Danışanla en az 3 seans tamamlayın.",
      overallTrend: "insufficient_data",
      soapDraft: {
        s: `Danışan ${client.displayName} değerlendirme sürecinde. Yeterli seans verisi bekleniyor.`,
        o: "Toplam tamamlanan seans sayısı yetersiz (< 3). Sistematik değerlendirme için daha fazla oyun verisi gerekli.",
        a: "Taban ölçümü tamamlanmamış. İlk 3-5 seans taban değerlendirmesi olarak kullanılacak.",
        p: "Başlangıç protokolü: Sıra Hafızası, Mavi Nabız, Hedef Tarama oyunları ile taban ölçümü al. Haftada 2-3 seans önerisi.",
      },
    };
  }

  const strengths = analyses.filter(a =>
    a.plays >= 3 &&
    a.trend !== "declining" &&
    a.best > 0 &&
    a.last3Avg >= a.best * 0.6
  ).sort((a, b) => b.last3Avg - a.last3Avg).slice(0, 3);

  const attentionAreas = analyses.filter(a => {
    if (a.trend === "declining" && a.plays >= 3) return true;
    if (a.plays === 0) return true;
    if (a.plays >= 3 && a.last3Avg < a.best * 0.45) return true;
    if (a.daysSinceLastPlay !== null && a.daysSinceLastPlay > 14) return true;
    return false;
  }).map(a => {
    let reason = "";
    if (a.plays === 0) reason = "Henüz oynanmadı";
    else if (a.trend === "declining") reason = `Son 3 seans ortalaması düşüyor (${Math.round(a.last3Avg)})`;
    else if (a.daysSinceLastPlay !== null && a.daysSinceLastPlay > 14) reason = `${a.daysSinceLastPlay} gündür oynanmadı`;
    else reason = `Performans potansiyelin altında (%${Math.round((a.last3Avg / Math.max(a.best, 1)) * 100)})`;
    return { gameKey: a.gameKey, label: a.label, reason, trend: a.trend };
  }).slice(0, 4);

  const recSet: GameKey[] = [];
  if (strengths.length > 0) recSet.push(strengths[0].gameKey);
  const attentionUnplayed = attentionAreas.filter(a => a.trend === "new");
  const attentionWeak = attentionAreas.filter(a => a.trend !== "new");
  if (attentionWeak.length > 0) recSet.push(attentionWeak[0].gameKey);
  if (attentionUnplayed.length > 0 && recSet.length < 3) recSet.push(attentionUnplayed[0].gameKey);
  if (recSet.length < 3 && strengths.length > 1) recSet.push(strengths[1].gameKey);
  if (recSet.length === 0) recSet.push("memory", "scan", "difference");

  const goalText = (client.primaryGoal ?? "").toLowerCase() + " " + (client.ageGroup ?? "").toLowerCase();
  let matchedProto: typeof THERAPY_PROTOCOLS[number] | null = null;
  for (const [keyword, protoId] of Object.entries(GOAL_PROTOCOL_MAP)) {
    if (goalText.includes(keyword)) {
      matchedProto = THERAPY_PROTOCOLS.find(p => p.id === protoId) ?? null;
      if (matchedProto) break;
    }
  }

  const improvingCount = playedGames.filter(a => a.trend === "improving").length;
  const decliningCount = playedGames.filter(a => a.trend === "declining").length;
  const overallTrend: TherapySuggestion["overallTrend"] =
    playedGames.length < 2 ? "insufficient_data" :
    improvingCount > decliningCount ? "improving" :
    decliningCount > improvingCount ? "declining" : "stable";

  /*
   * Alanlar arası genel başarı, ham skorların ortalaması olamaz — oyunların
   * puan ölçekleri farklı. Her oyunun normalize skoru (0–1) ortalanır ve
   * yüzde olarak sunulur.
   */
  const overallPercent = playedGames.length > 0
    ? Math.round((playedGames.reduce((sum, a) => sum + a.relativeScore, 0) / playedGames.length) * 100)
    : 0;
  const trendLabel = overallTrend === "improving" ? "gelişme gösteriyor" : overallTrend === "declining" ? "geri düşüş görülüyor" : "stabil seyrediyor";
  const performanceSummary = `${client.displayName}, ${playedGames.length} oyun alanında toplam ${totalPlays} seans tamamladı. Genel performans ${trendLabel}. Alanlar arası ortalama başarı: %${overallPercent}.`;

  const strengthList = strengths.map(s => `${s.label} (son 3 seans ort. ${Math.round(s.last3Avg)})`).join(", ");
  const attentionList = attentionAreas.slice(0, 2).map(a => a.label).join(", ");
  const recSetLabels = recSet.map(k => GAME_LABELS[k]).join(", ");

  const soapDraft = {
    s: `Danışan ${client.displayName} seans için hazır. ${client.primaryGoal ? `Birincil hedef: ${client.primaryGoal}.` : ""} Danışanın genel motivasyonu ve katılım düzeyi değerlendirildi.`,
    o: `Son ${totalPlays} seans verisi analiz edildi. Güçlü alanlar: ${strengthList || "henüz yok"}. Dikkat gereken alanlar: ${attentionList || "yok"}. Alanlar arası ortalama başarı: %${overallPercent}.`,
    a: `${performanceSummary} ${strengths.length > 0 ? `${strengths[0].label} alanında tutarlı başarı görülüyor.` : ""} ${attentionAreas.length > 0 ? `${attentionAreas[0].label} alanında ek çalışma öneriliyor.` : ""}`,
    p: `Önerilen bir sonraki seans seti: ${recSetLabels}. ${matchedProto ? `Uzun vadeli protokol önerisi: ${matchedProto.name} (${matchedProto.duration} hafta).` : ""} Güçlü alanlarda zorluk kademeli artırılabilir.`,
  };

  return {
    strengths: strengths.map(s => ({ gameKey: s.gameKey, label: s.label, trend: s.trend, last3Avg: Math.round(s.last3Avg) })),
    attentionAreas,
    recommendedSet: recSet,
    protocolId: matchedProto?.id ?? null,
    protocolName: matchedProto?.name ?? null,
    soapDraft,
    performanceSummary,
    overallTrend,
  };
}
