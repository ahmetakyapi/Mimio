/**
 * Rule-based therapy suggestion engine for Mimio platform.
 * Analyzes client game sessions and generates evidence-based recommendations.
 * Extracted from MimioApp.tsx for maintainability.
 */

import { GAME_LABELS, type ClientProfile, type RecentSessionEntry } from "@/lib/platform-data";
import type { GameAnalysis, GameKey, GameTrend, TherapySuggestion } from "@/lib/game-types";
import { THERAPY_PROTOCOLS, GOAL_PROTOCOL_MAP } from "@/lib/therapy-protocols";

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
    const best = plays > 0 ? Math.max(...gameSessions.map(s => s.score)) : 0;
    const last3 = gameSessions.slice(0, 3).map(s => s.score);
    const last5 = gameSessions.slice(0, 5).map(s => s.score);
    const last3Avg = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0;
    const last5Avg = last5.length > 0 ? last5.reduce((a, b) => a + b, 0) / last5.length : 0;

    let trend: GameTrend = "new";
    if (plays >= 5) {
      const diff = last3Avg - last5Avg;
      if (diff > 1.5) trend = "improving";
      else if (diff < -1.5) trend = "declining";
      else trend = "stable";
    } else if (plays >= 2) {
      trend = "stable";
    }

    const lastPlayedAt = gameSessions.length > 0 ? new Date(gameSessions[0].playedAt).getTime() : null;
    const daysSinceLastPlay = lastPlayedAt !== null ? Math.floor((now - lastPlayedAt) / (1000 * 60 * 60 * 24)) : null;

    const maxPotential = 20;
    const relativeScore = best > 0 ? Math.min(1, best / maxPotential) : 0;

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

  const avgScore = playedGames.length > 0
    ? Math.round(playedGames.reduce((sum, a) => sum + a.last3Avg, 0) / playedGames.length)
    : 0;
  const trendLabel = overallTrend === "improving" ? "gelişme gösteriyor" : overallTrend === "declining" ? "geri düşüş görülüyor" : "stabil seyrediyor";
  const performanceSummary = `${client.displayName}, ${playedGames.length} oyun alanında toplam ${totalPlays} seans tamamladı. Genel performans ${trendLabel}. Ortalama skor: ${avgScore}.`;

  const strengthList = strengths.map(s => `${s.label} (ort. ${Math.round(s.last3Avg)})`).join(", ");
  const attentionList = attentionAreas.slice(0, 2).map(a => a.label).join(", ");
  const recSetLabels = recSet.map(k => GAME_LABELS[k]).join(", ");

  const soapDraft = {
    s: `Danışan ${client.displayName} seans için hazır. ${client.primaryGoal ? `Birincil hedef: ${client.primaryGoal}.` : ""} Danışanın genel motivasyonu ve katılım düzeyi değerlendirildi.`,
    o: `Son ${totalPlays} seans verisi analiz edildi. Güçlü alanlar: ${strengthList || "henüz yok"}. Dikkat gereken alanlar: ${attentionList || "yok"}. Genel skor ortalaması: ${avgScore}.`,
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
