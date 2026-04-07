"use client";

import { useMemo } from "react";
import { Printer, Download, TrendingUp, TrendingDown, Minus, Calendar, Target, Clock } from "lucide-react";
import type { ClientProfile, RecentSessionEntry, PlatformGameKey, ClientGoal } from "@/lib/platform-data";
import { GAME_LABELS } from "@/lib/platform-data";
import { formatDuration, getTodayString } from "@/lib/format-utils";

interface WeeklyProgressReportProps {
  client: ClientProfile;
  sessions: RecentSessionEntry[];
  goals: ClientGoal[];
  therapistName: string;
  clinicName?: string;
  allNotes: Array<{ date: string; content: string }>;
}

export function WeeklyProgressReport({ client, sessions, goals, therapistName, clinicName, allNotes }: WeeklyProgressReportProps) {
  const report = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = sessions.filter(s => new Date(s.playedAt) >= weekAgo);
    const lastWeek = sessions.filter(s => {
      const d = new Date(s.playedAt);
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const thisWeekAvg = thisWeek.length > 0 ? Math.round(thisWeek.reduce((s, x) => s + x.score, 0) / thisWeek.length) : 0;
    const lastWeekAvg = lastWeek.length > 0 ? Math.round(lastWeek.reduce((s, x) => s + x.score, 0) / lastWeek.length) : 0;
    const scoreDelta = lastWeekAvg > 0 ? Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100) : 0;

    // Per game performance
    const gamePerformance: Array<{ key: PlatformGameKey; label: string; count: number; avg: number; best: number; trend: string }> = [];
    const gameKeys = Array.from(new Set(thisWeek.map(s => s.gameKey)));
    for (const key of gameKeys) {
      const gameSessions = thisWeek.filter(s => s.gameKey === key);
      const lastWeekGame = lastWeek.filter(s => s.gameKey === key);
      const avg = Math.round(gameSessions.reduce((s, x) => s + x.score, 0) / gameSessions.length);
      const lastAvg = lastWeekGame.length > 0 ? Math.round(lastWeekGame.reduce((s, x) => s + x.score, 0) / lastWeekGame.length) : 0;
      const trend = lastAvg > 0 ? (avg > lastAvg * 1.1 ? "up" : avg < lastAvg * 0.9 ? "down" : "stable") : "new";
      gamePerformance.push({
        key: key as PlatformGameKey,
        label: GAME_LABELS[key as PlatformGameKey] ?? key,
        count: gameSessions.length,
        avg,
        best: Math.max(...gameSessions.map(s => s.score)),
        trend,
      });
    }

    const totalDuration = thisWeek.reduce((s, x) => s + (x.durationSeconds ?? 0), 0);
    const weekNotes = allNotes.filter(n => {
      const d = new Date(n.date);
      return d >= weekAgo;
    });

    // Goal progress
    const activeGoals = goals.filter(g => g.currentValue < g.targetValue);
    const completedGoals = goals.filter(g => g.currentValue >= g.targetValue);

    return {
      thisWeekCount: thisWeek.length,
      lastWeekCount: lastWeek.length,
      thisWeekAvg,
      lastWeekAvg,
      scoreDelta,
      gamePerformance,
      totalDuration,
      weekNotes,
      activeGoals,
      completedGoals,
      weekStart: weekAgo.toISOString().slice(0, 10),
      weekEnd: now.toISOString().slice(0, 10),
    };
  }, [sessions, goals, allNotes]);

  function handlePrint() {
    const trendIcons: Record<string, string> = { up: "↑", down: "↓", stable: "→", new: "★" };
    const trendColors: Record<string, string> = { up: "#10b981", down: "#ef4444", stable: "#f59e0b", new: "#6366f1" };

    const gameRows = report.gamePerformance.map(g =>
      `<tr><td>${g.label}</td><td>${g.count}</td><td>${g.avg}</td><td>${g.best}</td><td style="color:${trendColors[g.trend]}; font-weight:700">${trendIcons[g.trend]} ${g.trend === "up" ? "Gelişiyor" : g.trend === "down" ? "Düşüş" : g.trend === "new" ? "Yeni" : "Stabil"}</td></tr>`
    ).join("");

    const goalRows = [...report.activeGoals, ...report.completedGoals].map(g => {
      const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
      const isComplete = g.currentValue >= g.targetValue;
      return `<tr><td>${g.title}</td><td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${isComplete ? "#10b981" : "#6366f1"};border-radius:4px"></div></div><span style="font-weight:700;color:${isComplete ? "#10b981" : "#6366f1"}">${pct}%</span></div></td><td>${g.deadline ?? "—"}</td></tr>`;
    }).join("");

    const noteItems = report.weekNotes.slice(0, 8).map(n => `<li style="margin-bottom:4px"><strong>${n.date}</strong> — ${n.content}</li>`).join("");

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Haftalık İlerleme — ${client.displayName}</title><style>
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;margin:0;padding:28px;font-size:13px;line-height:1.5}
      h1{font-size:22px;margin:0 0 4px;color:#1e293b}
      h2{font-size:13px;font-weight:800;margin:24px 0 8px;color:#6366f1;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #e0e7ff;padding-bottom:4px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #6366f1;padding-bottom:16px;margin-bottom:24px}
      .badge{display:inline-block;background:#ede9fe;color:#6366f1;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-right:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}td,th{padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:12px}th{background:#f5f3ff;font-weight:700;color:#4f46e5}
      .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
      .stat{background:#f5f3ff;border:1px solid #e0e7ff;border-radius:12px;padding:14px;text-align:center}
      .stat-val{font-size:28px;font-weight:900;color:#6366f1}.stat-lbl{font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
      .trend-up{color:#10b981}.trend-down{color:#ef4444}.trend-stable{color:#f59e0b}
      .note-list{padding-left:18px;font-size:12px;color:#475569}
      .footer{margin-top:32px;padding-top:12px;border-top:2px solid #e5e7eb;font-size:10px;color:#94a3b8;text-align:center}
      @media print{body{padding:0}button{display:none}}
    </style></head><body>
      <div class="header">
        <div>
          <h1>Haftalık İlerleme Raporu</h1>
          <p style="color:#6366f1;font-weight:700;font-size:14px;margin:4px 0">${client.displayName}</p>
          <div style="margin-top:6px">
            ${client.ageGroup ? `<span class="badge">${client.ageGroup}</span>` : ""}
            ${client.primaryGoal ? `<span class="badge">${client.primaryGoal}</span>` : ""}
            ${client.supportLevel ? `<span class="badge">${client.supportLevel}</span>` : ""}
          </div>
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b">
          <strong style="font-size:13px;color:#1e293b">${therapistName}</strong>
          ${clinicName ? `<br>${clinicName}` : ""}
          <br>${report.weekStart} — ${report.weekEnd}
        </div>
      </div>

      <h2>Haftalık Özet</h2>
      <div class="stat-grid">
        <div class="stat"><div class="stat-val">${report.thisWeekCount}</div><div class="stat-lbl">Seans</div></div>
        <div class="stat"><div class="stat-val">${report.thisWeekAvg || "—"}</div><div class="stat-lbl">Ort. Skor</div></div>
        <div class="stat"><div class="stat-val">${report.scoreDelta >= 0 ? "+" : ""}${report.scoreDelta}%</div><div class="stat-lbl">Değişim</div></div>
        <div class="stat"><div class="stat-val">${formatDuration(report.totalDuration)}</div><div class="stat-lbl">Toplam Süre</div></div>
      </div>

      ${gameRows ? `<h2>Oyun Performansı</h2><table><thead><tr><th>Oyun</th><th>Seans</th><th>Ortalama</th><th>En İyi</th><th>Trend</th></tr></thead><tbody>${gameRows}</tbody></table>` : ""}

      ${goalRows ? `<h2>Hedef İlerlemesi</h2><table><thead><tr><th>Hedef</th><th>İlerleme</th><th>Son Tarih</th></tr></thead><tbody>${goalRows}</tbody></table>` : ""}

      ${noteItems ? `<h2>Bu Haftanın Notları</h2><ul class="note-list">${noteItems}</ul>` : ""}

      <div class="footer">
        <p style="margin:0">Mimio Ergoterapi Platformu — Haftalık İlerleme Raporu</p>
        <p style="margin:4px 0 0">Oluşturulma: ${getTodayString()}</p>
      </div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;

    const win = window.open("", "_blank", "width=800,height=1000");
    if (win) { win.document.write(html); win.document.close(); }
  }

  const trendIcon = report.scoreDelta > 5 ? TrendingUp : report.scoreDelta < -5 ? TrendingDown : Minus;
  const trendColor = report.scoreDelta > 5 ? "#10b981" : report.scoreDelta < -5 ? "#ef4444" : "#f59e0b";
  const TrendIcon = trendIcon;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface-strong)", borderColor: "var(--color-line)" }}>
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
              <Calendar size={15} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-(--color-text-strong) m-0">Haftalık İlerleme</h3>
              <p className="text-[10px] text-(--color-text-muted) m-0">{report.weekStart} — {report.weekEnd}</p>
            </div>
          </div>
          <button type="button" onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-none cursor-pointer transition-all hover:opacity-90"
            style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Printer size={12} /> Yazdır
          </button>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Seans", value: report.thisWeekCount, prev: report.lastWeekCount },
            { label: "Ort. Skor", value: report.thisWeekAvg, prev: report.lastWeekAvg },
            { label: "Süre", value: formatDuration(report.totalDuration), prev: null },
            { label: "Notlar", value: report.weekNotes.length, prev: null },
          ].map(({ label, value, prev }) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: "var(--color-surface-elevated)" }}>
              <strong className="text-base font-extrabold block tabular-nums text-(--color-text-strong)">{value}</strong>
              <span className="text-[9px] text-(--color-text-muted) font-semibold">{label}</span>
              {typeof prev === "number" && prev > 0 && typeof value === "number" && (
                <span className="text-[8px] block font-bold" style={{ color: value > prev ? "#10b981" : value < prev ? "#ef4444" : "#f59e0b" }}>
                  {value > prev ? "↑" : value < prev ? "↓" : "→"} önceki: {prev}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Game performance bars */}
        {report.gamePerformance.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0">Oyun Performansı</p>
            {report.gamePerformance.map(g => {
              const maxAvg = Math.max(...report.gamePerformance.map(x => x.avg), 1);
              const pct = Math.round((g.avg / maxAvg) * 100);
              const tColor = g.trend === "up" ? "#10b981" : g.trend === "down" ? "#ef4444" : "#f59e0b";
              return (
                <div key={g.key} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-(--color-text-soft) w-16 truncate">{g.label}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded-full flex items-center justify-end pr-1.5 bar-animated" style={{ "--bar-width": `${Math.max(pct, 8)}%`, background: "linear-gradient(90deg, rgba(99,102,241,0.5), #6366f1)" } as React.CSSProperties}>
                      <span className="text-[8px] font-extrabold text-white/80">{g.avg}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold w-6 text-center" style={{ color: tColor }}>
                    {g.trend === "up" ? "↑" : g.trend === "down" ? "↓" : g.trend === "new" ? "★" : "→"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Goals summary */}
        {(report.activeGoals.length > 0 || report.completedGoals.length > 0) && (
          <div className="rounded-xl p-3 mb-3" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-line-soft)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-(--color-text-muted) m-0 mb-2">
              <Target size={10} className="inline mr-1" style={{ verticalAlign: "middle" }} />
              Hedefler
            </p>
            <div className="space-y-1.5">
              {report.activeGoals.slice(0, 3).map(g => {
                const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
                return (
                  <div key={g.id} className="flex items-center gap-2">
                    <span className="text-xs text-(--color-text-soft) flex-1 truncate">{g.title}</span>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#6366f1" }} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: "#6366f1" }}>%{pct}</span>
                  </div>
                );
              })}
              {report.completedGoals.length > 0 && (
                <p className="text-[10px] text-(--color-accent-green) font-bold m-0 mt-1">
                  {report.completedGoals.length} hedef tamamlandı
                </p>
              )}
            </div>
          </div>
        )}

        {/* Overall trend */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
          background: `${trendColor}08`,
          border: `1px solid ${trendColor}18`,
        }}>
          <TrendIcon size={14} style={{ color: trendColor }} />
          <span className="text-xs text-(--color-text-soft)">
            {report.scoreDelta > 5
              ? `Bu hafta geçen haftaya göre %${report.scoreDelta} daha iyi performans gösterildi.`
              : report.scoreDelta < -5
              ? `Bu hafta geçen haftaya göre %${Math.abs(report.scoreDelta)} düşüş var.`
              : "Performans geçen haftayla benzer seviyede."}
          </span>
        </div>
      </div>
    </div>
  );
}
