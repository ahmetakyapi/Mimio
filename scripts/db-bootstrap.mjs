#!/usr/bin/env node
// filepath: /Users/ahmet/Documents/Projects/personal-projects/MimiTherapy/scripts/db-bootstrap.mjs
//
// Neon PostgreSQL şemasını oluşturur ve seed kullanıcılarını ekler.
// Kullanım:
//   DATABASE_URL="postgres://..." node scripts/db-bootstrap.mjs
//   veya .env.local / .env dosyasından otomatik yüklenir.

import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

/* ── Seed verisi ── */

const SEED_THERAPISTS = [
  {
    username: "kubrabayat",
    password: "kubra1907",
    displayName: "Uzm. Erg. Kübra Bayat",
    clinicName: "Mimio Studio",
    specialty: "Dikkat ve görsel algı",
  },
  {
    username: "ahmetakyapi",
    password: "ahmet1907",
    displayName: "Ahmet Akyapı",
    clinicName: "Mimio Studio",
    specialty: "Motor planlama ve koordinasyon",
  },
  {
    username: "ozankose",
    password: "ozan1907",
    displayName: "Ozan Köse",
    clinicName: "Mimio Studio",
    specialty: "Bilişsel rehabilitasyon",
  },
];

const SEED_CLIENTS = [
  {
    displayName: "Deniz A.",
    ageGroup: "7-9 yaş",
    primaryGoal: "Seçici dikkat ve görsel tarama",
    supportLevel: "Orta destek",
  },
  {
    displayName: "Lina K.",
    ageGroup: "6-8 yaş",
    primaryGoal: "Sıralama hafızası ve yönerge takibi",
    supportLevel: "Kademeli ipucu",
  },
  {
    displayName: "Kaan T.",
    ageGroup: "8-10 yaş",
    primaryGoal: "El-göz koordinasyonu",
    supportLevel: "Düşük destek",
  },
];

/* ── Env yükleme ── */

if (!process.env.DATABASE_URL) {
  for (const f of [".env.local", ".env"]) {
    if (existsSync(f)) {
      process.loadEnvFile(f);
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    "❌  DATABASE_URL tanımlı değil.\n" +
      "    .env.local dosyasına Neon bağlantı dizesini ekleyin veya\n" +
      "    DATABASE_URL=... node scripts/db-bootstrap.mjs şeklinde çalıştırın."
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

/* ── Şema ── */

const SCHEMA_QUERIES = [
  // pgcrypto → crypt() & gen_salt()
  "CREATE EXTENSION IF NOT EXISTS pgcrypto",

  // Terapist profilleri
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

  // Danışan profilleri
  `CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL UNIQUE,
    age_group TEXT,
    primary_goal TEXT,
    support_level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // Seans kayıtları
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

/* ── Seed: terapistler (şifreli) ── */

for (const t of SEED_THERAPISTS) {
  await sql.query(
    `INSERT INTO therapist_profiles (display_name, clinic_name, specialty, username, password_hash)
     VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf', 8)))
     ON CONFLICT (display_name)
     DO UPDATE SET
       clinic_name     = EXCLUDED.clinic_name,
       specialty       = EXCLUDED.specialty,
       username        = EXCLUDED.username,
       password_hash   = crypt($5, gen_salt('bf', 8)),
       updated_at      = NOW()`,
    [t.displayName, t.clinicName, t.specialty, t.username, t.password]
  );
  console.log(`   👤  ${t.displayName} (${t.username})`);
}

/* ── Seed: danışanlar ── */

for (const c of SEED_CLIENTS) {
  await sql.query(
    `INSERT INTO client_profiles (display_name, age_group, primary_goal, support_level)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (display_name)
     DO UPDATE SET
       age_group     = EXCLUDED.age_group,
       primary_goal  = EXCLUDED.primary_goal,
       support_level = EXCLUDED.support_level,
       updated_at    = NOW()`,
    [c.displayName, c.ageGroup, c.primaryGoal, c.supportLevel]
  );
  console.log(`   🧒  ${c.displayName}`);
}

console.log("\n🎉  MimiTherapy veritabanı hazır — Vercel deploy'a hazırsınız!");
