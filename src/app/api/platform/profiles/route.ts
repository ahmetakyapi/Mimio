import { NextResponse } from "next/server";
import type { ClientCreatePayload, TherapistCreatePayload, LoginPayload } from "@/lib/platform-data";
import {
  archiveClient,
  authenticateTherapist,
  createClientProfile,
  createTherapistProfile,
  getPlatformOverviewFromDatabase,
  updateTherapistProfile,
} from "@/lib/server/platform-db";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePayload(body: unknown):
  | { kind: "therapist"; payload: TherapistCreatePayload }
  | { kind: "client"; payload: ClientCreatePayload }
  | { kind: "login"; payload: LoginPayload }
  | { kind: "archive-client"; payload: { clientId: string } }
  | { kind: "update-therapist"; payload: { therapistId: string; displayName?: string; clinicName?: string; specialty?: string } }
  | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as Record<string, unknown>;
  const kind = candidate.kind;

  if (kind === "login") {
    const username = normalizeText(candidate.username);
    const password = normalizeText(candidate.password);
    if (!username || !password) return null;
    return { kind, payload: { username, password } };
  }

  if (kind === "therapist") {
    const displayName = normalizeText(candidate.displayName);
    if (!displayName) return null;
    return {
      kind,
      payload: {
        username: normalizeText(candidate.username),
        password: normalizeText(candidate.password),
        displayName,
        clinicName: normalizeText(candidate.clinicName),
        specialty: normalizeText(candidate.specialty),
      },
    };
  }

  if (kind === "client") {
    const displayName = normalizeText(candidate.displayName);
    if (!displayName) return null;
    return {
      kind,
      payload: {
        displayName,
        ageGroup: normalizeText(candidate.ageGroup),
        primaryGoal: normalizeText(candidate.primaryGoal),
        supportLevel: normalizeText(candidate.supportLevel),
        difficultyLevel: normalizeText(candidate.difficultyLevel),
      },
    };
  }

  if (kind === "archive-client") {
    const clientId = normalizeText(candidate.clientId);
    if (!clientId) return null;
    return { kind, payload: { clientId } } as { kind: "archive-client"; payload: { clientId: string } };
  }

  if (kind === "update-therapist") {
    const therapistId = normalizeText(candidate.therapistId);
    if (!therapistId) return null;
    return {
      kind,
      payload: {
        therapistId,
        displayName: normalizeText(candidate.displayName),
        clinicName: normalizeText(candidate.clinicName),
        specialty: normalizeText(candidate.specialty),
      },
    } as { kind: "update-therapist"; payload: { therapistId: string; displayName?: string; clinicName?: string; specialty?: string } };
  }

  return null;
}

function loginStatusCode(reason: string): number {
  if (reason === "schema_missing") return 409;
  if (reason === "not_configured") return 503;
  return 401;
}

function persistErrorStatusCode(reason: string): number {
  if (reason === "schema_missing") return 409;
  if (reason === "duplicate") return 409;
  if (reason === "validation") return 400;
  return 503;
}

function persistErrorMessage(result: Record<string, unknown>): string {
  if (typeof result.message === "string" && result.message) return result.message;
  const reason = result.reason;
  if (reason === "schema_missing") return "Veritabanı bağlantısı var ancak profil şeması henüz kurulmamış.";
  if (reason === "duplicate") return "Bu kullanıcı adı zaten kullanılıyor.";
  if (reason === "validation") return "Geçersiz veri.";
  return "DATABASE_URL tanımlanmadığı için profil buluta yazılamadı.";
}

export const dynamic = "force-dynamic";

export async function GET() {
  const overview = await getPlatformOverviewFromDatabase();
  return NextResponse.json({
    database: overview.database,
    therapists: overview.therapists,
    clients: overview.clients,
  });
}

async function handleLogin(payload: LoginPayload) {
  try {
    const result = await authenticateTherapist(payload);
    if (!result.authenticated) {
      const reason = "reason" in result ? String(result.reason) : "unknown";
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: loginStatusCode(reason) }
      );
    }
    return NextResponse.json({ ok: true, profile: result.profile });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Giriş sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}

async function handleProfileCreate(
  kind: "therapist" | "client",
  payload: TherapistCreatePayload | ClientCreatePayload,
) {
  const result =
    kind === "therapist"
      ? await createTherapistProfile(payload as TherapistCreatePayload)
      : await createClientProfile(payload as ClientCreatePayload);

  if (!result.persisted) {
    const reason = "reason" in result ? String(result.reason) : "unknown";
    const message = persistErrorMessage(result as Record<string, unknown>);
    return NextResponse.json({ ok: false, message }, { status: persistErrorStatusCode(reason) });
  }

  return NextResponse.json({ ok: true, profile: result.profile });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parsePayload(body);

  if (!parsed) {
    return NextResponse.json(
      { ok: false, message: "Geçerli bir profil gövdesi bekleniyor." },
      { status: 400 }
    );
  }

  if (parsed.kind === "login") {
    return handleLogin(parsed.payload as LoginPayload);
  }

  if (parsed.kind === "archive-client") {
    const { clientId } = parsed.payload as { clientId: string };
    await archiveClient(clientId);
    return NextResponse.json({ ok: true });
  }

  if (parsed.kind === "update-therapist") {
    const { therapistId, ...fields } = parsed.payload as { therapistId: string; displayName?: string; clinicName?: string; specialty?: string };
    const profile = await updateTherapistProfile(therapistId, fields);
    if (!profile) return NextResponse.json({ ok: false, message: "Profil güncellenemedi." }, { status: 503 });
    return NextResponse.json({ ok: true, profile });
  }

  return handleProfileCreate(
    parsed.kind as "therapist" | "client",
    parsed.payload as TherapistCreatePayload | ClientCreatePayload
  );
}
