#!/usr/bin/env node
//
// Neon PostgreSQL şemasını oluşturur.
// Seed kullanıcıları uygulama arayüzündeki "Kayıt Ol" formuyla eklenir;
// bu script yalnızca tablo ve indeksleri hazırlar.
//
// Kullanım:
//   DATABASE_URL="postgres://..." node scripts/db-bootstrap.mjs
//   veya .env.local / .env dosyasından otomatik yüklenir.

import { existsSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

/* ── Env yükleme ── */

if (!process.env.DATABASE_URL) {
  try {
    for (const f of [".env.local", ".env"]) {
      if (existsSync(f)) {
        const content = readFileSync(f, "utf-8");
        for (const line of content.split("\n")) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match && !process.env[match[1]]) {
            let val = match[2] ?? "";
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            process.env[match[1]] = val;
          }
        }
      }
    }
  } catch {
    // ignore env loading errors
  }
}

if (!process.env.DATABASE_URL) {
  console.log(
    "⏭️  DATABASE_URL tanımlı değil — veritabanı bootstrap'ı atlanıyor.\n" +
      "    Bu normal bir durumdur, build devam edecek."
  );
  process.exit(0);
}

const sql = neon(process.env.DATABASE_URL);

/* ── Şema ── */

const SCHEMA_QUERIES = [
  "CREATE EXTENSION IF NOT EXISTS pgcrypto",

  `CREATE TABLE IF NOT EXISTS therapist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL UNIQUE,
    clinic_name TEXT,
    specialty TEXT,
    username TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS specialty TEXT",
  "ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS username TEXT",
  "ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT",
  `CREATE UNIQUE INDEX IF NOT EXISTS therapist_profiles_username_idx
     ON therapist_profiles (username)
     WHERE username IS NOT NULL AND username != ''`,

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

/* ── Çalıştır ── */

console.log("⏳  Şema oluşturuluyor…");

for (const query of SCHEMA_QUERIES) {
  await sql.query(query);
}

console.log("✅  Tablolar ve indeksler hazır.");
console.log("\n🎉  Mimio veritabanı hazır — Vercel deploy'a hazırsınız!");
console.log("    İlk terapist hesabını uygulamadaki Kayıt Ol formundan oluşturabilirsiniz.");
