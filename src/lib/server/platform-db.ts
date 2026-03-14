import { neon } from "@neondatabase/serverless";
import {
  DEMO_CLIENTS,
  DEMO_THERAPISTS,
  SEED_USER_PASSWORDS,
  EMPTY_PLATFORM_OVERVIEW,
  GAME_LABELS,
  createEmptyRemoteScores,
  type ClientCreatePayload,
  type LoginPayload,
  type PlatformOverviewPayload,
  type SessionCreatePayload,
  type TherapistCreatePayload,
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

async function seedProfileLibrary(sql: SqlClient) {
  for (const therapist of DEMO_THERAPISTS) {
    const plainPassword = SEED_USER_PASSWORDS[therapist.username] ?? null;
    if (plainPassword) {
      // Upsert with password hash using pgcrypto's crypt + bf
      await sql.query(
        `INSERT INTO therapist_profiles (display_name, clinic_name, specialty, username, password_hash)
        VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf', 8)))
        ON CONFLICT (display_name)
        DO UPDATE SET clinic_name = EXCLUDED.clinic_name, specialty = EXCLUDED.specialty,
                      username = EXCLUDED.username,
                      password_hash = COALESCE(EXCLUDED.password_hash, therapist_profiles.password_hash),
                      updated_at = NOW()`,
        [therapist.displayName, therapist.clinicName, therapist.specialty, therapist.username, plainPassword]
      );
    } else {
      await sql.query(
        `INSERT INTO therapist_profiles (display_name, clinic_name, specialty, username)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (display_name)
        DO UPDATE SET clinic_name = EXCLUDED.clinic_name, specialty = EXCLUDED.specialty,
                      username = COALESCE(EXCLUDED.username, therapist_profiles.username),
                      updated_at = NOW()`,
        [therapist.displayName, therapist.clinicName, therapist.specialty, therapist.username]
      );
    }
  }

  for (const client of DEMO_CLIENTS) {
    await sql.query(
      `INSERT INTO client_profiles (display_name, age_group, primary_goal, support_level)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (display_name)
      DO UPDATE SET age_group = EXCLUDED.age_group, primary_goal = EXCLUDED.primary_goal, support_level = EXCLUDED.support_level, updated_at = NOW()`,
      [client.displayName, client.ageGroup, client.primaryGoal, client.supportLevel]
    );
  }
}

export async function bootstrapPlatformSchema(sql = getSqlClient()) {
  if (!sql) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  for (const query of SCHEMA_QUERIES) {
    await sql.query(query);
  }

  await seedProfileLibrary(sql);
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
        display_name,
        COALESCE(age_group, '') AS age_group,
        COALESCE(primary_goal, '') AS primary_goal,
        COALESCE(support_level, '') AS support_level
      FROM client_profiles
      ORDER BY display_name ASC`
    )) as Array<{
      id: string;
      display_name: string;
      age_group: string;
      primary_goal: string;
      support_level: string;
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
      `INSERT INTO client_profiles (display_name, age_group, primary_goal, support_level)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (display_name)
      DO UPDATE SET age_group = EXCLUDED.age_group, primary_goal = EXCLUDED.primary_goal, support_level = EXCLUDED.support_level, updated_at = NOW()
      RETURNING
        id::text,
        display_name,
        COALESCE(age_group, '') AS age_group,
        COALESCE(primary_goal, '') AS primary_goal,
        COALESCE(support_level, '') AS support_level`,
      [
        payload.displayName.trim(),
        payload.ageGroup?.trim() ?? "",
        payload.primaryGoal?.trim() ?? "",
        payload.supportLevel?.trim() ?? "",
      ]
    )) as Array<{
      id: string;
      display_name: string;
      age_group: string;
      primary_goal: string;
      support_level: string;
    }>;

    return {
      persisted: true,
      profile: {
        id: row.id,
        displayName: row.display_name,
        ageGroup: row.age_group,
        primaryGoal: row.primary_goal,
        supportLevel: row.support_level,
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
