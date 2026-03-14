import { NextResponse } from "next/server";
import { isPlatformGameKey, type SessionCreatePayload } from "@/lib/platform-data";
import { insertSessionRun } from "@/lib/server/platform-db";

function parsePayload(body: unknown): SessionCreatePayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.gameKey !== "string" || !isPlatformGameKey(candidate.gameKey)) {
    return null;
  }

  if (typeof candidate.score !== "number" || Number.isNaN(candidate.score) || candidate.score < 0) {
    return null;
  }

  return {
    therapistId: typeof candidate.therapistId === "string" ? candidate.therapistId : undefined,
    therapistName: typeof candidate.therapistName === "string" ? candidate.therapistName : undefined,
    clientId: typeof candidate.clientId === "string" ? candidate.clientId : undefined,
    clientName: typeof candidate.clientName === "string" ? candidate.clientName : undefined,
    gameKey: candidate.gameKey,
    score: Math.round(candidate.score),
    source: typeof candidate.source === "string" ? candidate.source : undefined,
    playedAt: typeof candidate.playedAt === "string" ? candidate.playedAt : undefined,
    sessionNote: typeof candidate.sessionNote === "string" ? candidate.sessionNote : undefined,
    durationSeconds:
      typeof candidate.durationSeconds === "number" && Number.isFinite(candidate.durationSeconds)
        ? candidate.durationSeconds
        : undefined,
    metadata:
      candidate.metadata && typeof candidate.metadata === "object"
        ? (candidate.metadata as Record<string, unknown>)
        : undefined,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const payload = parsePayload(body);

  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Geçerli bir oyun oturumu gövdesi bekleniyor.",
      },
      { status: 400 }
    );
  }

  const result = await insertSessionRun(payload);

  if (!result.persisted) {
    const status = result.reason === "schema_missing" ? 409 : 503;
    const message =
      result.reason === "schema_missing"
        ? "Veritabanı bağlantısı var ancak şema henüz kurulmamış."
        : "DATABASE_URL tanımlanmadığı için oturum buluta yazılamadı.";

    return NextResponse.json({ ok: false, message }, { status });
  }

  return NextResponse.json({
    ok: true,
    id: result.id,
    playedAt: result.playedAt,
  });
}
