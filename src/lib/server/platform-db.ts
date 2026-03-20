import { neon } from "@neondatabase/serverless";
import {
  EMPTY_PLATFORM_OVERVIEW,
  GAME_LABELS,
  createEmptyRemoteScores,
  type ClientCreatePayload,
  type ClientGoal,
  type ClientGoalCreatePayload,
  type ClientGoalUpdatePayload,
  type LoginPayload,
  type NoteMode,
  type PlatformOverviewPayload,
  type SessionCreatePayload,
  type SessionNote,
  type SoapNoteContent,
  type TherapistCreatePayload,
  type TherapistProfile,
  type WeeklyPlan,
} from "@/lib/platform-data";

type SqlClient = ReturnType<typeof neon>;

const SCHEMA_QUERIES = [
  "CREATE EXTENSION IF NOT EXISTS pgcrypto",
  `CREATE TABLE IF NOT EXISTS therapist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL UNIQUE,
    clinic_name TEXT,
    specialty TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS specialty TEXT",
  "ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS username TEXT",
  "ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT",
  "CREATE UNIQUE INDEX IF NOT EXISTS therapist_profiles_username_idx ON therapist_profiles (username) WHERE username IS NOT NULL AND username != ''",
  `CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL UNIQUE,
    age_group TEXT,
    primary_goal TEXT,
    support_level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS session_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID,
    therapist_name TEXT NOT NULL DEFAULT 'Mimio Demo',
    client_id UUID,
    client_name TEXT NOT NULL DEFAULT 'Demo Danışan',
    game_key TEXT NOT NULL,
    game_label TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    source TEXT NOT NULL DEFAULT 'web-app',
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER,
    session_note TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
  )`,
  "ALTER TABLE session_runs ADD COLUMN IF NOT EXISTS therapist_id UUID",
  "ALTER TABLE session_runs ADD COLUMN IF NOT EXISTS client_id UUID",
  "ALTER TABLE session_runs ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT 'Demo Danışan'",
  "ALTER TABLE session_runs ADD COLUMN IF NOT EXISTS duration_seconds INTEGER",
  "ALTER TABLE session_runs ADD COLUMN IF NOT EXISTS session_note TEXT",
  "CREATE INDEX IF NOT EXISTS session_runs_game_key_idx ON session_runs (game_key, played_at DESC)",
  "CREATE INDEX IF NOT EXISTS session_runs_played_at_idx ON session_runs (played_at DESC)",
  "CREATE INDEX IF NOT EXISTS session_runs_therapist_name_idx ON session_runs (therapist_name, played_at DESC)",
  "CREATE INDEX IF NOT EXISTS session_runs_client_name_idx ON session_runs (client_name, played_at DESC)",

  // ── client_notes ──
  `CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    therapist_id UUID,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    note_mode TEXT NOT NULL DEFAULT 'free',
    soap_content JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "CREATE INDEX IF NOT EXISTS client_notes_client_id_idx ON client_notes (client_id, created_at DESC)",

  // ── weekly_plans ──
  `CREATE TABLE IF NOT EXISTS weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    therapist_id UUID,
    week_start_date TEXT NOT NULL,
    days JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id, week_start_date)
  )`,
  "CREATE INDEX IF NOT EXISTS weekly_plans_lookup_idx ON weekly_plans (client_id, week_start_date)",

  // ── client_goals ──
  `CREATE TABLE IF NOT EXISTS client_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    therapist_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    target_value INTEGER NOT NULL DEFAULT 100,
    current_value INTEGER NOT NULL DEFAULT 0,
    deadline TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "CREATE INDEX IF NOT EXISTS client_goals_client_id_idx ON client_goals (client_id, created_at DESC)",

  // ── New columns on existing tables ──
  "ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS difficulty_level TEXT",
  "ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ",
];

function getSqlClient(): SqlClient | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  return neon(connectionString);
}

function isSchemaMissingError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("does not exist") ||
    error.message.includes("relation") ||
    error.message.includes("undefined_table") ||
    error.message.includes("column")
  );
}

export async function bootstrapPlatformSchema(sql = getSqlClient()) {
  if (!sql) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  for (const query of SCHEMA_QUERIES) {
    await sql.query(query);
  }
}

export async function getPlatformOverviewFromDatabase(): Promise<PlatformOverviewPayload> {
  const sql = getSqlClient();

  if (!sql) {
    return EMPTY_PLATFORM_OVERVIEW;
  }

  try {
    // Seed is handled by db:bootstrap / vercel-build — no per-request seeding.

    const [totalsRow] = (await sql.query(
      `SELECT
        COUNT(*)::int AS session_count,
        COALESCE(SUM(score), 0)::int AS total_score,
        COALESCE(ROUND(AVG(score)), 0)::int AS average_score,
        COUNT(DISTINCT therapist_name)::int AS active_therapist_count,
        COUNT(DISTINCT client_name)::int AS active_client_count,
        MAX(played_at)::text AS last_played_at
      FROM session_runs`
    )) as Array<{
      session_count: number;
      total_score: number;
      average_score: number;
      active_therapist_count: number;
      active_client_count: number;
      last_played_at: string | null;
    }>;

    const scoreRows = (await sql.query(
      `SELECT
        game_key,
        game_label,
        MAX(score)::int AS best_score,
        COUNT(*)::int AS session_count,
        (ARRAY_AGG(score ORDER BY played_at DESC))[1]::int AS last_score,
        MAX(played_at)::text AS last_played_at
      FROM session_runs
      GROUP BY game_key, game_label`
    )) as Array<{
      game_key: keyof typeof GAME_LABELS;
      game_label: string;
      best_score: number;
      session_count: number;
      last_score: number;
      last_played_at: string | null;
    }>;

    const therapistRows = (await sql.query(
      `SELECT id::text, display_name, COALESCE(clinic_name, '') AS clinic_name, COALESCE(specialty, '') AS specialty, COALESCE(username, '') AS username
      FROM therapist_profiles
      ORDER BY display_name ASC`
    )) as Array<{
      id: string;
      display_name: string;
      clinic_name: string;
      specialty: string;
      username: string;
    }>;

    const clientRows = (await sql.query(
      `SELECT
        id::text,
        cp.id::text,
        cp.display_name,
        COALESCE(cp.age_group, '') AS age_group,
        COALESCE(cp.primary_goal, '') AS primary_goal,
        COALESCE(cp.support_level, '') AS support_level,
        COALESCE(cp.difficulty_level, '') AS difficulty_level,
        cp.archived_at::text AS archived_at,
        MAX(sr.played_at)::text AS last_active_at
      FROM client_profiles cp
      LEFT JOIN session_runs sr ON sr.client_id = cp.id
      WHERE cp.archived_at IS NULL
      GROUP BY cp.id, cp.display_name, cp.age_group, cp.primary_goal, cp.support_level, cp.difficulty_level, cp.archived_at
      ORDER BY cp.display_name ASC`
    )) as Array<{
      id: string;
      display_name: string;
      age_group: string;
      primary_goal: string;
      support_level: string;
      difficulty_level: string;
      archived_at: string | null;
      last_active_at: string | null;
    }>;

    const recentRows = (await sql.query(
      `SELECT
        id::text,
        therapist_id::text,
        therapist_name,
        client_id::text,
        client_name,
        game_key,
        game_label,
        score,
        source,
        played_at::text,
        session_note,
        duration_seconds
      FROM session_runs
      ORDER BY played_at DESC
      LIMIT 8`
    )) as Array<{
      id: string;
      therapist_id: string | null;
      therapist_name: string;
      client_id: string | null;
      client_name: string;
      game_key: keyof typeof GAME_LABELS;
      game_label: string;
      score: number;
      source: string;
      played_at: string;
      session_note: string | null;
      duration_seconds: number | null;
    }>;

    const remoteScores = createEmptyRemoteScores();
    for (const row of scoreRows) {
      if (!(row.game_key in remoteScores)) {
        continue;
      }

      remoteScores[row.game_key] = {
        label: row.game_label,
        best: row.best_score,
        last: row.last_score,
        sessions: row.session_count,
        lastPlayedAt: row.last_played_at,
      };
    }

    return {
      database: {
        configured: true,
        status: "online",
        provider: "PostgreSQL / Neon",
        message: "Bulut veri katmanı aktif. Seans bağlamı, profil listesi ve oturum geçmişi veritabanında tutuluyor.",
      },
      totals: {
        sessionCount: totalsRow?.session_count ?? 0,
        totalScore: totalsRow?.total_score ?? 0,
      },
      sessionInsight: {
        averageScore: totalsRow?.average_score ?? 0,
        activeTherapists: totalsRow?.active_therapist_count ?? therapistRows.length,
        activeClients: totalsRow?.active_client_count ?? clientRows.length,
        lastPlayedAt: totalsRow?.last_played_at ?? null,
      },
      remoteScores,
      therapists: therapistRows.map((row) => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        clinicName: row.clinic_name,
        specialty: row.specialty,
        source: "cloud",
      })),
      clients: clientRows.map((row) => ({
        id: row.id,
        displayName: row.display_name,
        ageGroup: row.age_group,
        primaryGoal: row.primary_goal,
        supportLevel: row.support_level,
        difficultyLevel: row.difficulty_level || undefined,
        archivedAt: row.archived_at ?? null,
        lastActiveAt: row.last_active_at ?? null,
        source: "cloud",
      })),
      recentSessions: recentRows.map((row) => ({
        id: row.id,
        therapistId: row.therapist_id,
        therapistName: row.therapist_name,
        clientId: row.client_id,
        clientName: row.client_name,
        gameKey: row.game_key,
        gameLabel: row.game_label,
        score: row.score,
        source: row.source,
        playedAt: row.played_at,
        sessionNote: row.session_note,
        durationSeconds: row.duration_seconds,
      })),
    };
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return {
        ...EMPTY_PLATFORM_OVERVIEW,
        database: {
          configured: true,
          status: "schema_missing",
          provider: "PostgreSQL / Neon",
          message: "Bağlantı var ancak şema kurulmamış. `npm run db:bootstrap` ile tabloları oluştur.",
        },
      };
    }

    return {
      ...EMPTY_PLATFORM_OVERVIEW,
      database: {
        configured: true,
        status: "error",
        provider: "PostgreSQL / Neon",
        message: error instanceof Error ? error.message : "Veritabanına erişilirken beklenmeyen bir hata oluştu.",
      },
    };
  }
}

export async function createTherapistProfile(payload: TherapistCreatePayload) {
  const sql = getSqlClient();

  if (!sql) {
    return {
      persisted: false,
      reason: "not_configured" as const,
    };
  }

  const username = payload.username?.trim().toLowerCase() ?? "";
  const password = payload.password?.trim() ?? "";

  if (!username) {
    return { persisted: false, reason: "validation" as const, message: "Kullanıcı adı zorunludur." };
  }
  if (!password || password.length < 4) {
    return { persisted: false, reason: "validation" as const, message: "Şifre en az 4 karakter olmalıdır." };
  }

  try {
    // Check if username already exists
    const existing = (await sql.query(
      `SELECT id::text FROM therapist_profiles WHERE username = $1`,
      [username]
    )) as Array<{ id: string }>;

    if (existing.length > 0) {
      return { persisted: false, reason: "duplicate" as const, message: "Bu kullanıcı adı zaten kullanılıyor." };
    }

    const [row] = (await sql.query(
      `INSERT INTO therapist_profiles (display_name, clinic_name, specialty, username, password_hash)
      VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf', 8)))
      RETURNING id::text, display_name, COALESCE(clinic_name, '') AS clinic_name, COALESCE(specialty, '') AS specialty, COALESCE(username, '') AS username`,
      [payload.displayName.trim(), payload.clinicName?.trim() ?? "", payload.specialty?.trim() ?? "", username, password]
    )) as Array<{ id: string; display_name: string; clinic_name: string; specialty: string; username: string }>;

    return {
      persisted: true,
      profile: {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        clinicName: row.clinic_name,
        specialty: row.specialty,
        source: "cloud" as const,
      },
    };
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return {
        persisted: false,
        reason: "schema_missing" as const,
      };
    }

    throw error;
  }
}

export async function createClientProfile(payload: ClientCreatePayload) {
  const sql = getSqlClient();

  if (!sql) {
    return {
      persisted: false,
      reason: "not_configured" as const,
    };
  }

  try {
    const [row] = (await sql.query(
      `INSERT INTO client_profiles (display_name, age_group, primary_goal, support_level, difficulty_level)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (display_name)
      DO UPDATE SET age_group = EXCLUDED.age_group, primary_goal = EXCLUDED.primary_goal, support_level = EXCLUDED.support_level, difficulty_level = EXCLUDED.difficulty_level, updated_at = NOW()
      RETURNING
        id::text,
        display_name,
        COALESCE(age_group, '') AS age_group,
        COALESCE(primary_goal, '') AS primary_goal,
        COALESCE(support_level, '') AS support_level,
        COALESCE(difficulty_level, '') AS difficulty_level`,
      [
        payload.displayName.trim(),
        payload.ageGroup?.trim() ?? "",
        payload.primaryGoal?.trim() ?? "",
        payload.supportLevel?.trim() ?? "",
        payload.difficultyLevel?.trim() ?? "",
      ]
    )) as Array<{
      id: string;
      display_name: string;
      age_group: string;
      primary_goal: string;
      support_level: string;
      difficulty_level: string;
    }>;

    return {
      persisted: true,
      profile: {
        id: row.id,
        displayName: row.display_name,
        ageGroup: row.age_group,
        primaryGoal: row.primary_goal,
        supportLevel: row.support_level,
        difficultyLevel: row.difficulty_level || undefined,
        source: "cloud" as const,
      },
    };
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return {
        persisted: false,
        reason: "schema_missing" as const,
      };
    }

    throw error;
  }
}

export async function insertSessionRun(payload: SessionCreatePayload) {
  const sql = getSqlClient();

  if (!sql) {
    return {
      persisted: false,
      reason: "not_configured" as const,
    };
  }

  const gameLabel = GAME_LABELS[payload.gameKey];
  const therapistName = payload.therapistName?.trim() || "Mimio Demo";
  const clientName = payload.clientName?.trim() || "Demo Danışan";
  const source = payload.source?.trim() || "web-app";
  const playedAt = payload.playedAt ? new Date(payload.playedAt) : new Date();
  const sessionNote = payload.sessionNote?.trim() || null;
  const durationSeconds =
    typeof payload.durationSeconds === "number" && payload.durationSeconds > 0
      ? Math.round(payload.durationSeconds)
      : null;
  const metadata = JSON.stringify(payload.metadata ?? {});

  try {
    const [row] = (await sql.query(
      `INSERT INTO session_runs (
        therapist_id,
        therapist_name,
        client_id,
        client_name,
        game_key,
        game_label,
        score,
        source,
        played_at,
        duration_seconds,
        session_note,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
      RETURNING id::text, played_at::text`,
      [
        payload.therapistId ?? null,
        therapistName,
        payload.clientId ?? null,
        clientName,
        payload.gameKey,
        gameLabel,
        payload.score,
        source,
        playedAt.toISOString(),
        durationSeconds,
        sessionNote,
        metadata,
      ]
    )) as Array<{ id: string; played_at: string }>;

    return {
      persisted: true,
      id: row?.id ?? null,
      playedAt: row?.played_at ?? playedAt.toISOString(),
    };
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return {
        persisted: false,
        reason: "schema_missing" as const,
      };
    }

    throw error;
  }
}

// ── Client Notes ──

export async function getClientNotes(clientId: string): Promise<SessionNote[]> {
  const sql = getSqlClient();
  if (!sql) return [];
  try {
    const rows = (await sql.query(
      `SELECT id::text, client_id::text AS "clientId", COALESCE(therapist_id::text, '') AS "therapistId",
        date, content, note_mode AS "noteMode", soap_content AS "soapContent", created_at::text AS "createdAt"
      FROM client_notes WHERE client_id = $1 ORDER BY created_at DESC`,
      [clientId]
    )) as Array<{ id: string; clientId: string; therapistId: string; date: string; content: string; noteMode: NoteMode; soapContent: SoapNoteContent | null; createdAt: string }>;
    return rows.map((r) => ({ ...r, soapContent: r.soapContent ?? undefined }));
  } catch { return []; }
}

export async function createClientNote(payload: {
  clientId: string;
  therapistId?: string;
  date: string;
  content: string;
  noteMode?: NoteMode;
  soapContent?: SoapNoteContent;
}): Promise<SessionNote | null> {
  const sql = getSqlClient();
  if (!sql) return null;
  try {
    const [row] = (await sql.query(
      `INSERT INTO client_notes (client_id, therapist_id, date, content, note_mode, soap_content)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id::text, client_id::text AS "clientId", COALESCE(therapist_id::text,'') AS "therapistId",
        date, content, note_mode AS "noteMode", soap_content AS "soapContent", created_at::text AS "createdAt"`,
      [
        payload.clientId,
        payload.therapistId ?? null,
        payload.date,
        payload.content,
        payload.noteMode ?? "free",
        payload.soapContent ? JSON.stringify(payload.soapContent) : null,
      ]
    )) as Array<{ id: string; clientId: string; therapistId: string; date: string; content: string; noteMode: NoteMode; soapContent: SoapNoteContent | null; createdAt: string }>;
    return { ...row, soapContent: row.soapContent ?? undefined };
  } catch { return null; }
}

export async function deleteClientNote(noteId: string): Promise<void> {
  const sql = getSqlClient();
  if (!sql) return;
  try { await sql.query(`DELETE FROM client_notes WHERE id = $1`, [noteId]); } catch { /* ignore */ }
}

// ── Weekly Plans ──

export async function getWeeklyPlan(clientId: string, weekStartDate: string): Promise<WeeklyPlan | null> {
  const sql = getSqlClient();
  if (!sql) return null;
  try {
    const rows = (await sql.query(
      `SELECT id::text, client_id::text AS "clientId", COALESCE(therapist_id::text,'') AS "therapistId",
        week_start_date AS "weekStartDate", days, updated_at::text AS "updatedAt"
      FROM weekly_plans WHERE client_id = $1 AND week_start_date = $2 LIMIT 1`,
      [clientId, weekStartDate]
    )) as Array<{ id: string; clientId: string; therapistId: string; weekStartDate: string; days: WeeklyPlan["days"]; updatedAt: string }>;
    if (rows.length === 0) return null;
    return rows[0];
  } catch { return null; }
}

export async function saveWeeklyPlan(payload: {
  clientId: string;
  therapistId?: string;
  weekStartDate: string;
  days: WeeklyPlan["days"];
}): Promise<WeeklyPlan | null> {
  const sql = getSqlClient();
  if (!sql) return null;
  try {
    const [row] = (await sql.query(
      `INSERT INTO weekly_plans (client_id, therapist_id, week_start_date, days, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, NOW())
      ON CONFLICT (client_id, week_start_date)
      DO UPDATE SET days = EXCLUDED.days, updated_at = NOW()
      RETURNING id::text, client_id::text AS "clientId", COALESCE(therapist_id::text,'') AS "therapistId",
        week_start_date AS "weekStartDate", days, updated_at::text AS "updatedAt"`,
      [payload.clientId, payload.therapistId ?? null, payload.weekStartDate, JSON.stringify(payload.days)]
    )) as Array<{ id: string; clientId: string; therapistId: string; weekStartDate: string; days: WeeklyPlan["days"]; updatedAt: string }>;
    return row;
  } catch { return null; }
}

// ── Client Goals ──

export async function getClientGoals(clientId: string): Promise<ClientGoal[]> {
  const sql = getSqlClient();
  if (!sql) return [];
  try {
    const rows = (await sql.query(
      `SELECT id::text, client_id::text AS "clientId", COALESCE(therapist_id::text,'') AS "therapistId",
        title, COALESCE(description,'') AS description, target_value AS "targetValue",
        current_value AS "currentValue", COALESCE(deadline,'') AS deadline,
        created_at::text AS "createdAt", updated_at::text AS "updatedAt"
      FROM client_goals WHERE client_id = $1 ORDER BY created_at ASC`,
      [clientId]
    )) as ClientGoal[];
    return rows;
  } catch { return []; }
}

export async function createClientGoal(payload: ClientGoalCreatePayload): Promise<ClientGoal | null> {
  const sql = getSqlClient();
  if (!sql) return null;
  try {
    const [row] = (await sql.query(
      `INSERT INTO client_goals (client_id, therapist_id, title, description, target_value, deadline)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id::text, client_id::text AS "clientId", COALESCE(therapist_id::text,'') AS "therapistId",
        title, COALESCE(description,'') AS description, target_value AS "targetValue",
        current_value AS "currentValue", COALESCE(deadline,'') AS deadline,
        created_at::text AS "createdAt", updated_at::text AS "updatedAt"`,
      [payload.clientId, payload.therapistId ?? null, payload.title.trim(), payload.description?.trim() ?? null, payload.targetValue ?? 100, payload.deadline?.trim() || null]
    )) as ClientGoal[];
    return row;
  } catch { return null; }
}

export async function updateClientGoal(payload: ClientGoalUpdatePayload): Promise<ClientGoal | null> {
  const sql = getSqlClient();
  if (!sql) return null;
  try {
    const sets: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let idx = 1;
    if (payload.currentValue !== undefined) { sets.push(`current_value = $${idx++}`); values.push(payload.currentValue); }
    if (payload.title !== undefined) { sets.push(`title = $${idx++}`); values.push(payload.title.trim()); }
    if (payload.description !== undefined) { sets.push(`description = $${idx++}`); values.push(payload.description.trim() || null); }
    if (payload.targetValue !== undefined) { sets.push(`target_value = $${idx++}`); values.push(payload.targetValue); }
    if (payload.deadline !== undefined) { sets.push(`deadline = $${idx++}`); values.push(payload.deadline.trim() || null); }
    values.push(payload.goalId);
    const [row] = (await sql.query(
      `UPDATE client_goals SET ${sets.join(", ")} WHERE id = $${idx}
      RETURNING id::text, client_id::text AS "clientId", COALESCE(therapist_id::text,'') AS "therapistId",
        title, COALESCE(description,'') AS description, target_value AS "targetValue",
        current_value AS "currentValue", COALESCE(deadline,'') AS deadline,
        created_at::text AS "createdAt", updated_at::text AS "updatedAt"`,
      values
    )) as ClientGoal[];
    return row ?? null;
  } catch { return null; }
}

export async function deleteClientGoal(goalId: string): Promise<void> {
  const sql = getSqlClient();
  if (!sql) return;
  try { await sql.query(`DELETE FROM client_goals WHERE id = $1`, [goalId]); } catch { /* ignore */ }
}

// ── Archive Client ──

export async function archiveClient(clientId: string): Promise<void> {
  const sql = getSqlClient();
  if (!sql) return;
  try { await sql.query(`UPDATE client_profiles SET archived_at = NOW() WHERE id = $1`, [clientId]); } catch { /* ignore */ }
}

// ── Update Therapist Profile ──

export async function updateTherapistProfile(therapistId: string, payload: { displayName?: string; clinicName?: string; specialty?: string }): Promise<TherapistProfile | null> {
  const sql = getSqlClient();
  if (!sql) return null;
  try {
    const sets: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let idx = 1;
    if (payload.displayName?.trim()) { sets.push(`display_name = $${idx++}`); values.push(payload.displayName.trim()); }
    if (payload.clinicName !== undefined) { sets.push(`clinic_name = $${idx++}`); values.push(payload.clinicName.trim()); }
    if (payload.specialty !== undefined) { sets.push(`specialty = $${idx++}`); values.push(payload.specialty.trim()); }
    values.push(therapistId);
    const [row] = (await sql.query(
      `UPDATE therapist_profiles SET ${sets.join(", ")} WHERE id = $${idx}
      RETURNING id::text, COALESCE(username,'') AS username, display_name, COALESCE(clinic_name,'') AS clinic_name, COALESCE(specialty,'') AS specialty`,
      values
    )) as Array<{ id: string; username: string; display_name: string; clinic_name: string; specialty: string }>;
    if (!row) return null;
    return { id: row.id, username: row.username, displayName: row.display_name, clinicName: row.clinic_name, specialty: row.specialty, source: "cloud" };
  } catch { return null; }
}

// ── Update Client Profile ──

export async function updateClientProfile(
  clientId: string,
  payload: { difficultyLevel?: string; displayName?: string; ageGroup?: string; primaryGoal?: string; supportLevel?: string }
): Promise<{ id: string; difficultyLevel: string } | null> {
  const sql = getSqlClient();
  if (!sql) return null;
  try {
    const sets: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let idx = 1;
    if (payload.difficultyLevel !== undefined) { sets.push(`difficulty_level = $${idx++}`); values.push(payload.difficultyLevel); }
    if (payload.displayName?.trim()) { sets.push(`display_name = $${idx++}`); values.push(payload.displayName.trim()); }
    if (payload.ageGroup !== undefined) { sets.push(`age_group = $${idx++}`); values.push(payload.ageGroup); }
    if (payload.primaryGoal !== undefined) { sets.push(`primary_goal = $${idx++}`); values.push(payload.primaryGoal); }
    if (payload.supportLevel !== undefined) { sets.push(`support_level = $${idx++}`); values.push(payload.supportLevel); }
    if (sets.length === 1) return null; // nothing to update
    values.push(clientId);
    const [row] = (await sql.query(
      `UPDATE client_profiles SET ${sets.join(", ")} WHERE id = $${idx}
       RETURNING id::text, COALESCE(difficulty_level,'') AS difficulty_level`,
      values
    )) as Array<{ id: string; difficulty_level: string }>;
    if (!row) return null;
    return { id: row.id, difficultyLevel: row.difficulty_level };
  } catch { return null; }
}

export async function authenticateTherapist(payload: LoginPayload) {
  const sql = getSqlClient();

  if (!sql) {
    return {
      authenticated: false,
      reason: "not_configured" as const,
      message: "Veritabanı bağlantısı yapılandırılmamış.",
    };
  }

  const username = payload.username?.trim().toLowerCase() ?? "";
  const password = payload.password?.trim() ?? "";

  if (!username || !password) {
    return {
      authenticated: false,
      reason: "validation" as const,
      message: "Kullanıcı adı ve şifre zorunludur.",
    };
  }

  try {
    const rows = (await sql.query(
      `SELECT
        id::text,
        display_name,
        COALESCE(clinic_name, '') AS clinic_name,
        COALESCE(specialty, '') AS specialty,
        COALESCE(username, '') AS username
      FROM therapist_profiles
      WHERE username = $1
        AND password_hash IS NOT NULL
        AND password_hash = crypt($2, password_hash)`,
      [username, password]
    )) as Array<{
      id: string;
      display_name: string;
      clinic_name: string;
      specialty: string;
      username: string;
    }>;

    if (rows.length === 0) {
      return {
        authenticated: false,
        reason: "invalid_credentials" as const,
        message: "Kullanıcı adı veya şifre hatalı.",
      };
    }

    const row = rows[0];
    return {
      authenticated: true,
      profile: {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        clinicName: row.clinic_name,
        specialty: row.specialty,
        source: "cloud" as const,
      },
    };
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return {
        authenticated: false,
        reason: "schema_missing" as const,
        message: "Veritabanı şeması henüz kurulmamış.",
      };
    }

    throw error;
  }
}
