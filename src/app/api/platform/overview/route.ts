import { NextResponse } from "next/server";
import { getPlatformOverviewFromDatabase } from "@/lib/server/platform-db";
import { getSessionTherapistId } from "@/lib/server/session";
import { createEmptyRemoteScores } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionTherapistId = await getSessionTherapistId();
  const overview = await getPlatformOverviewFromDatabase();

  // Oturum yoksa yalnızca veritabanı durumu paylaşılır; danışan/terapist
  // verileri ve seans kayıtları sızdırılmaz.
  if (!sessionTherapistId) {
    return NextResponse.json({
      authenticated: false,
      database: overview.database,
      totals: { sessionCount: 0, totalScore: 0 },
      sessionInsight: { averageScore: 0, activeTherapists: 0, activeClients: 0, lastPlayedAt: null },
      remoteScores: createEmptyRemoteScores(),
      therapists: [],
      clients: [],
      recentSessions: [],
    });
  }

  return NextResponse.json({ authenticated: true, ...overview });
}
