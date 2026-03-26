/**
 * Session data export utilities.
 * Supports CSV and JSON export for session data, notes, and goals.
 */

interface ExportSession {
  date: string;
  client: string;
  game: string;
  score: number;
  duration: number;
  note?: string;
}

interface ExportGoal {
  client: string;
  title: string;
  target: number;
  current: number;
  deadline?: string;
}

/** Convert sessions to CSV string */
export function sessionsToCSV(sessions: ExportSession[]): string {
  const headers = ["Tarih", "Danışan", "Oyun", "Skor", "Süre (sn)", "Not"];
  const rows = sessions.map((s) => [
    s.date,
    escapeCSV(s.client),
    escapeCSV(s.game),
    String(s.score),
    String(s.duration),
    escapeCSV(s.note ?? ""),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/** Convert goals to CSV string */
export function goalsToCSV(goals: ExportGoal[]): string {
  const headers = ["Danışan", "Hedef", "Hedef Değer", "Mevcut Değer", "Son Tarih"];
  const rows = goals.map((g) => [
    escapeCSV(g.client),
    escapeCSV(g.title),
    String(g.target),
    String(g.current),
    g.deadline ?? "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/** Trigger a file download in the browser */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Export sessions as CSV download */
export function exportSessionsCSV(sessions: ExportSession[]): void {
  const csv = sessionsToCSV(sessions);
  const date = new Date().toISOString().split("T")[0];
  downloadFile(csv, `mimio-seanslar-${date}.csv`, "text/csv");
}

/** Export sessions as JSON download */
export function exportSessionsJSON(sessions: ExportSession[]): void {
  const json = JSON.stringify(sessions, null, 2);
  const date = new Date().toISOString().split("T")[0];
  downloadFile(json, `mimio-seanslar-${date}.json`, "application/json");
}

/** Export goals as CSV download */
export function exportGoalsCSV(goals: ExportGoal[]): void {
  const csv = goalsToCSV(goals);
  const date = new Date().toISOString().split("T")[0];
  downloadFile(csv, `mimio-hedefler-${date}.csv`, "text/csv");
}

/** Generate a printable HTML report for a client */
export function generateClientReport(data: {
  clientName: string;
  therapistName: string;
  sessions: ExportSession[];
  goals: ExportGoal[];
  dateRange: { from: string; to: string };
}): string {
  const totalSessions = data.sessions.length;
  const avgScore =
    totalSessions > 0
      ? Math.round(data.sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions)
      : 0;
  const totalDuration = data.sessions.reduce((sum, s) => sum + s.duration, 0);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Mimio — ${data.clientName} Raporu</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #1e293b; padding: 2rem; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1.1rem; margin-top: 2rem; margin-bottom: 0.75rem; color: #6366f1; }
    .meta { color: #64748b; font-size: 0.85rem; margin-bottom: 2rem; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat { background: #f1f5f9; border-radius: 12px; padding: 1rem; text-align: center; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: #6366f1; }
    .stat-label { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: #f1f5f9; text-align: left; padding: 0.5rem 0.75rem; font-weight: 600; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 0.75rem; text-align: center; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>${data.clientName} — Terapi Raporu</h1>
  <p class="meta">
    Terapist: ${data.therapistName} &bull;
    Dönem: ${data.dateRange.from} — ${data.dateRange.to} &bull;
    Oluşturulma: ${new Date().toLocaleDateString("tr-TR")}
  </p>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${totalSessions}</div>
      <div class="stat-label">Toplam Seans</div>
    </div>
    <div class="stat">
      <div class="stat-value">${avgScore}</div>
      <div class="stat-label">Ortalama Skor</div>
    </div>
    <div class="stat">
      <div class="stat-value">${Math.round(totalDuration / 60)}</div>
      <div class="stat-label">Toplam Süre (dk)</div>
    </div>
  </div>

  <h2>Seans Detayları</h2>
  <table>
    <thead><tr><th>Tarih</th><th>Oyun</th><th>Skor</th><th>Süre</th><th>Not</th></tr></thead>
    <tbody>
      ${data.sessions
        .map(
          (s) =>
            `<tr><td>${s.date}</td><td>${s.game}</td><td>${s.score}</td><td>${s.duration}s</td><td>${s.note ?? ""}</td></tr>`
        )
        .join("\n      ")}
    </tbody>
  </table>

  ${
    data.goals.length > 0
      ? `<h2>Hedefler</h2>
  <table>
    <thead><tr><th>Hedef</th><th>Hedef Değer</th><th>Mevcut</th><th>İlerleme</th></tr></thead>
    <tbody>
      ${data.goals
        .map(
          (g) =>
            `<tr><td>${g.title}</td><td>${g.target}</td><td>${g.current}</td><td>${Math.round((g.current / g.target) * 100)}%</td></tr>`
        )
        .join("\n      ")}
    </tbody>
  </table>`
      : ""
  }

  <div class="footer">
    Bu rapor Mimio Ergoterapi Platformu tarafından otomatik oluşturulmuştur.
  </div>
</body>
</html>`;
}

/** Open printable report in new tab */
export function printClientReport(data: Parameters<typeof generateClientReport>[0]): void {
  const html = generateClientReport(data);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    // Auto-trigger print dialog after short delay
    setTimeout(() => win.print(), 500);
  }
}

function escapeCSV(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
