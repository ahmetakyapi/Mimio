#!/usr/bin/env node
//
// `ahmetakyapi` terapisti için gerçekçi bir demo veri kümesi yazar:
// altı danışan, ~12 haftalık seans geçmişi, bu haftanın dolu takvimi,
// hedefler ve seans notları.
//
// Amaç boş ekranları doldurmak değil — ekranların çoğu ancak veri varken
// okunabilir bir şey söylüyor: eğilim çizgisi, plato tespiti, alan dengesi,
// bağımsızlık ölçeği. Seans skorları bu yüzden rastgele değil, danışan
// başına bir "öğrenme eğrisi" + gürültüden üretiliyor; kimi platoya girer,
// kimi yükselir, biri ara verir. Öneri motorunun her kuralı en az bir
// danışanda tetiklenir.
//
// Kullanım:
//   DATABASE_URL="postgres://..." node scripts/seed-demo.mjs
//   npm run db:seed
//
// Yeniden çalıştırılabilir: aynı terapistin demo verisi önce silinir.
// `--reset` ile terapist hesabı da yeniden kurulur.

import { existsSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

/* ── Env yükleme (db-bootstrap ile aynı davranış) ── */

if (!process.env.DATABASE_URL) {
  try {
    for (const f of [".env.local", ".env"]) {
      if (existsSync(f)) {
        for (const line of readFileSync(f, "utf-8").split("\n")) {
          const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (m && !process.env[m[1]]) {
            let v = m[2] ?? "";
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
            process.env[m[1]] = v;
          }
        }
      }
    }
  } catch { /* env dosyası yoksa sorun değil */ }
}

if (!process.env.DATABASE_URL) {
  console.error("✗  DATABASE_URL tanımlı değil. .env.local dosyasına ekleyin veya değişkeni verin.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const RESET = process.argv.includes("--reset");

/* ── Sabitler ── */

const THERAPIST = {
  displayName: "Ahmet Akyapı",
  username: "ahmetakyapi",
  password: "mimio2026",
  clinicName: "Serra Klinik",
  specialty: "Ergoterapist",
};

const GAMES = {
  memory:     { label: "Sıra Hafızası", domain: "memory" },
  pairs:      { label: "Kart Eşle",     domain: "visual" },
  pulse:      { label: "Mavi Nabız",    domain: "motor" },
  route:      { label: "Komut Rotası",  domain: "motor" },
  difference: { label: "Fark Avcısı",   domain: "visual" },
  scan:       { label: "Hedef Tarama",  domain: "attention" },
  logic:      { label: "Dizi Mantık",   domain: "cognitive" },
};

/*
 * Her danışanın bir "hikâyesi" var; ekranlar bu hikâyeleri okuyor:
 *   · trend "rise"    → gelişim eğrisi yukarı
 *   · trend "plateau" → son üç seans sabit, öneri motoru plato yakalar
 *   · trend "dip"     → yorgunluk / gerileme, zorluk düşürme önerisi
 *   · idleDays        → uzun süredir seans yok, "ara verdi" kuralı
 */
const CLIENTS = [
  {
    displayName: "Ela Selin", ageGroup: "6-8", primaryGoal: "Çalışma belleği",
    supportLevel: "Gözetim", difficultyLevel: "Orta", tags: ["Pediatrik"],
    birthDate: "2019-03-14",
    games: ["memory", "pairs", "logic"], base: 62, trend: "plateau", sessions: 14, idleDays: 0,
    goals: [
      { title: "Blok açıklığı 6", description: "Corsi blok testinde 6 birimlik sekans", target: 7, current: 6 },
      { title: "Dikkat süresi", description: "Kesintisiz odaklanma", target: 6, current: 4 },
      { title: "Yürütücü işlev", description: "3×3 matris örüntü tamamlama", target: 9, current: 4 },
    ],
    notes: [
      "Ev programı 3 aktiviteden oluşuyor; anne haftalık geri bildirim gönderiyor. Seans sonunda yorgunluk gözlendi, süre 20 dk'ya çekilebilir.",
      "Sekans uzunluğu 5'te takıldı. Görsel ipucu verildiğinde 6'ya çıkıyor — ipucu silikleştirme denenecek.",
    ],
  },
  {
    displayName: "Tuna Akarsu", ageGroup: "9-11", primaryGoal: "El-göz koordinasyonu",
    supportLevel: "Sözel ipucu", difficultyLevel: "Orta", tags: ["Nörolojik"],
    birthDate: "2016-06-02",
    games: ["pulse", "route", "scan"], base: 58, trend: "rise", sessions: 16, idleDays: 0,
    goals: [
      { title: "Reaksiyon süresi", description: "Hedefe dokunma gecikmesi", target: 10, current: 9 },
      { title: "Motor planlama", description: "Yön komutu takibi", target: 8, current: 6 },
    ],
    notes: ["Sağ el dominant; sol el görevlerinde 2 kat süre farkı var. Çift el aktiviteleri eklendi."],
  },
  {
    displayName: "Asya Demir", ageGroup: "6-8", primaryGoal: "Seçici dikkat",
    supportLevel: "Fiziksel yardım", difficultyLevel: "Kolay", tags: ["Otizm & DEHB"],
    birthDate: "2018-11-20",
    games: ["scan", "difference", "memory"], base: 48, trend: "rise", sessions: 12, idleDays: 0,
    goals: [{ title: "Tarama hızı", description: "Izgarada hedef bulma", target: 12, current: 7 }],
    notes: ["Kalabalık ızgarada dağılıyor. 4×4'ten başlanıp kademeli büyütülüyor."],
  },
  {
    displayName: "Mina Yıldız", ageGroup: "4-5", primaryGoal: "Görsel ayrım",
    supportLevel: "Bağımsız", difficultyLevel: "Zor", tags: ["Pediatrik"],
    birthDate: "2021-01-09",
    games: ["difference", "pairs"], base: 74, trend: "rise", sessions: 10, idleDays: 1,
    goals: [{ title: "Figür-zemin ayrımı", description: "Benzer kartlar arasında fark bulma", target: 15, current: 13 }],
    notes: ["Yaşına göre ileri seviyede; zorluk 'Zor'da tutuluyor."],
  },
  {
    displayName: "Kerem Arslan", ageGroup: "9-11", primaryGoal: "Örüntü tamamlama",
    supportLevel: "Gözetim", difficultyLevel: "Orta", tags: ["Nörolojik"],
    birthDate: "2016-02-11",
    games: ["logic", "memory", "scan"], base: 55, trend: "dip", sessions: 13, idleDays: 2,
    goals: [{ title: "Tümevarım", description: "Kural çıkarma", target: 10, current: 5 }],
    notes: ["Son iki seansta skor düştü; okul dönemi yorgunluğu olabilir. Zorluk bir kademe indirildi."],
  },
  {
    displayName: "Mert Yiğit", ageGroup: "12-14", primaryGoal: "Yürütücü işlev",
    supportLevel: "Bağımsız", difficultyLevel: "Zor", tags: ["Otizm & DEHB"],
    birthDate: "2013-08-27",
    /* Uzun süredir gelmiyor — "ara verdi" önerisini ve plandaki boş slotu tetikler. */
    games: ["logic", "route"], base: 70, trend: "plateau", sessions: 8, idleDays: 11,
    goals: [{ title: "Görev değiştirme", description: "Kural değişiminde uyum", target: 8, current: 6 }],
    notes: ["11 gündür seans yok. Aile ile iletişime geçilecek."],
  },
];

/* ── Yardımcılar ── */

const DAY = 86400000;
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function startOfWeek(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

/* Tohumlu üretici: her çalıştırmada aynı veri çıksın, ekran görüntüleri kaysın istemiyoruz. */
function rng(seed) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

/**
 * Danışanın skor eğrisi. Düz rastgele sayı kullanılmıyor: gelişim eğrisi
 * ekranı ancak bir eğilim varsa anlamlı okunuyor.
 */
function scoreCurve(client, i, total, rand) {
  const t = total > 1 ? i / (total - 1) : 1;
  let v = client.base;

  if (client.trend === "rise") v += 26 * t;
  if (client.trend === "plateau") v += 24 * Math.min(t * 1.9, 1);        // erken yüksel, sonra sabitlen
  if (client.trend === "dip") v += 22 * t - (t > 0.78 ? 16 * (t - 0.78) * 4.5 : 0);

  v += (rand() - 0.5) * 7;                                               // seans içi gürültü
  if (client.trend === "plateau" && t > 0.8) v = client.base + 24 + (rand() - 0.5) * 2.2;

  return Math.max(20, Math.min(99, Math.round(v)));
}

/* ── Çalıştır ── */

console.log("⏳  Demo verisi hazırlanıyor…");

await sql.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

/* 1 — Terapist */
if (RESET) {
  await sql.query("DELETE FROM therapist_profiles WHERE username = $1", [THERAPIST.username]);
}

let [therapist] = await sql.query(
  "SELECT id::text FROM therapist_profiles WHERE username = $1 LIMIT 1",
  [THERAPIST.username],
);

if (!therapist) {
  [therapist] = await sql.query(
    `INSERT INTO therapist_profiles (display_name, clinic_name, specialty, username, password_hash)
     VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf', 8)))
     RETURNING id::text`,
    [THERAPIST.displayName, THERAPIST.clinicName, THERAPIST.specialty, THERAPIST.username, THERAPIST.password],
  );
  console.log(`   • terapist oluşturuldu: ${THERAPIST.username} / ${THERAPIST.password}`);
} else {
  await sql.query(
    "UPDATE therapist_profiles SET display_name=$2, clinic_name=$3, specialty=$4 WHERE id=$1",
    [therapist.id, THERAPIST.displayName, THERAPIST.clinicName, THERAPIST.specialty],
  );
  console.log("   • terapist zaten var, bilgileri güncellendi");
}

const therapistId = therapist.id;

/* 2 — Bu terapiste ait eski demo verisini temizle (yeniden çalıştırılabilirlik) */
const existingClients = await sql.query(
  "SELECT id::text FROM client_profiles WHERE display_name = ANY($1)",
  [CLIENTS.map((c) => c.displayName)],
);
const oldIds = existingClients.map((r) => r.id);
if (oldIds.length) {
  await sql.query("DELETE FROM session_runs WHERE client_id = ANY($1)", [oldIds]);
  await sql.query("DELETE FROM client_notes  WHERE client_id = ANY($1)", [oldIds]);
  await sql.query("DELETE FROM client_goals  WHERE client_id = ANY($1)", [oldIds]);
  await sql.query("DELETE FROM weekly_plans  WHERE client_id = ANY($1)", [oldIds]);
  await sql.query("DELETE FROM client_profiles WHERE id = ANY($1)", [oldIds]);
  console.log(`   • önceki demo verisi temizlendi (${oldIds.length} danışan)`);
}

/* 3 — Danışanlar, seanslar, hedefler, notlar */
const now = new Date();
const clientIds = new Map();
let sessionCount = 0;

for (let ci = 0; ci < CLIENTS.length; ci += 1) {
  const c = CLIENTS[ci];
  const rand = rng(1000 + ci * 977);

  const [row] = await sql.query(
    `INSERT INTO client_profiles (display_name, age_group, primary_goal, support_level, difficulty_level, tags, birth_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id::text`,
    [c.displayName, c.ageGroup, c.primaryGoal, c.supportLevel, c.difficultyLevel, c.tags, c.birthDate],
  );
  clientIds.set(c.displayName, row.id);

  /* Seanslar — en eskiden yeniye, ~2,5 günde bir. */
  for (let i = 0; i < c.sessions; i += 1) {
    const fromEnd = c.sessions - 1 - i;
    const playedAt = new Date(now.getTime() - (c.idleDays + fromEnd * 2.5) * DAY);
    playedAt.setHours(9 + ((i * 3) % 8), (i % 4) * 15, 0, 0);

    const gameKey = c.games[i % c.games.length];
    const score = scoreCurve(c, i, c.sessions, rand);

    await sql.query(
      `INSERT INTO session_runs
        (therapist_id, therapist_name, client_id, client_name, game_key, game_label, score, source, played_at, duration_seconds)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        therapistId, THERAPIST.displayName, row.id, c.displayName,
        gameKey, GAMES[gameKey].label, score, "seed",
        playedAt.toISOString(), 240 + Math.round(rand() * 360),
      ],
    );
    sessionCount += 1;
  }

  for (const g of c.goals) {
    await sql.query(
      `INSERT INTO client_goals (client_id, therapist_id, title, description, target_value, current_value)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [row.id, therapistId, g.title, g.description, g.target, g.current],
    );
  }

  for (let ni = 0; ni < c.notes.length; ni += 1) {
    const d = new Date(now.getTime() - (c.idleDays + ni * 6) * DAY);
    await sql.query(
      `INSERT INTO client_notes (client_id, therapist_id, date, content, note_mode, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [row.id, therapistId, isoDate(d), c.notes[ni], "free", d.toISOString()],
    );
  }
}

console.log(`   • ${CLIENTS.length} danışan, ${sessionCount} seans, hedefler ve notlar yazıldı`);

/* 4 — Bu haftanın takvimi.
   Saatler çakışmasın diye danışan başına sabit bir slot veriliyor; Haftalık
   Plan ekranı bloğu saate göre sıralıyor, Bugün ekranı da çizelgeyi buradan
   kuruyor. Mert Yiğit bilinçli olarak plansız: "boş slot" önerisi görünsün. */
const weekStart = startOfWeek(now);
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const emptyWeek = () => ({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });

const SCHEDULE = {
  "Ela Selin":    [["mon", "09:30", "memory"], ["wed", "09:30", "pairs"], ["fri", "09:30", "logic"]],
  "Tuna Akarsu":  [["mon", "11:00", "pulse"], ["thu", "11:00", "route"]],
  "Asya Demir":   [["tue", "14:00", "scan"], ["fri", "14:00", "difference"]],
  "Mina Yıldız":  [["wed", "13:00", "difference"], ["sat", "10:30", "pairs"]],
  "Kerem Arslan": [["tue", "15:30", "logic"], ["thu", "15:30", "memory"]],
};

let blockCount = 0;
for (const [name, slots] of Object.entries(SCHEDULE)) {
  const clientId = clientIds.get(name);
  if (!clientId) continue;
  const days = emptyWeek();
  const client = CLIENTS.find((c) => c.displayName === name);

  for (const [day, time, gameKey] of slots) {
    /* Bugünden önceki bloklar tamamlanmış sayılır — çizelge geçmişi
       "planlandı" diye göstermesin. */
    const dayIndex = DAY_KEYS.indexOf(day);
    const dayDate = new Date(weekStart.getTime() + dayIndex * DAY);
    const past = dayDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

    days[day].push({ gameKey, goal: client?.primaryGoal ?? "", time, ...(past ? { completed: true } : {}) });
    blockCount += 1;
  }

  await sql.query(
    `INSERT INTO weekly_plans (client_id, therapist_id, week_start_date, days, updated_at)
     VALUES ($1,$2,$3,$4::jsonb,NOW())
     ON CONFLICT (client_id, week_start_date) DO UPDATE SET days = EXCLUDED.days, updated_at = NOW()`,
    [clientId, therapistId, isoDate(weekStart), JSON.stringify(days)],
  );
}

console.log(`   • ${isoDate(weekStart)} haftasına ${blockCount} seans bloğu planlandı`);

console.log("\n🎉  Demo verisi hazır.");
console.log(`    Giriş: ${THERAPIST.username} / ${THERAPIST.password}`);
