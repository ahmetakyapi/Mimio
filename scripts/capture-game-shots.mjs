/**
 * Oyun tahtası görüntülerini gerçek uygulamadan yakalar.
 *
 * Tanıtım sayfasındaki oyun şeridi önce her oyun için aynı degrade kutuyu ve
 * bir ikon basıyordu: yedi kart yedi ayrı oyunu satıyor ama hiçbiri oyunun
 * neye benzediğini göstermiyordu. Bu betik tahtaları uygulamanın kendisinden
 * çeker, yani şeritteki görsel üründen gelir, çizimden değil.
 *
 * DÜRÜSTLÜK NOTU — taklit edilen tek şey oturum kapısıdır:
 * `/api/platform/overview` yanıtı `authenticated: true` dönecek şekilde
 * karşılanır, çünkü aksi hâlde uygulama girişe yönlendirir ve DATABASE_URL
 * olmadan giriş yapılamaz. Tahtaların içeriği taklit DEĞİLDİR: kareler,
 * semboller, ızgara ve yönerge metni `game-logic.ts` gerçekten çalışarak
 * üretir. Panel / rapor gibi veriye dayanan ekranlar bilerek yakalanmaz —
 * onlar gerçek veri olmadan uydurma ekran görüntüsü olurdu.
 *
 * Kullanım:
 *   npm run dev            # ayrı bir terminalde
 *   node scripts/capture-game-shots.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "public", "games");

/** Şerit kartı 4:3 ve en fazla 340px; 2x için 760px genişlik yeter. */
const OUTPUT_WIDTH = 760;
const WEBP_QUALITY = 82;

/**
 * `aria-label` kitaplık kartından, `key` de EXTENDED_GAMES ile birebir aynı.
 * `settle` oyunun tahtayı ilginç bir ana getirmesi için beklenen süre:
 * Sıra Hafızası'nda kareler sırayla yanar, diğerlerinde tahta bir turda dolar.
 */
const GAMES = [
  { key: "memory", label: "Sıra Hafızası", settle: 900 },
  { key: "pairs", label: "Kart Eşle", settle: 700 },
  { key: "pulse", label: "Mavi Nabız", settle: 700 },
  { key: "route", label: "Komut Rotası", settle: 700 },
  { key: "difference", label: "Fark Avcısı", settle: 700 },
  { key: "scan", label: "Hedef Tarama", settle: 700 },
  { key: "logic", label: "Dizi Mantık", settle: 700 },
];

const OVERVIEW_STUB = {
  authenticated: true,
  database: { configured: true, status: "ready", provider: "PostgreSQL / Neon", message: "" },
  totals: { sessionCount: 0, totalScore: 0 },
  sessionInsight: { averageScore: 0, activeTherapists: 1, activeClients: 0, lastPlayedAt: null },
  remoteScores: {},
  therapists: [],
  clients: [],
  recentSessions: [],
};

async function openApp(context) {
  const page = await context.newPage();
  await page.route("**/api/platform/overview*", (route) => route.fulfill({ json: OVERVIEW_STUB }));
  await page.route("**/api/platform/**", (route) => route.fulfill({ json: {} }));
  await page.addInitScript(() => {
    localStorage.setItem("mimio-theme", "light");
    localStorage.setItem("mimio-active-therapist-v2", JSON.stringify({ therapistId: "shot" }));
    localStorage.setItem("mimio-onboarding-completed-v1", new Date().toISOString());
  });
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Oyunlar" }).first().click();
  await page.getByRole("button", { name: `${GAMES[0].label} seansını başlat` }).waitFor({ timeout: 20000 });
  return page;
}

async function captureBoard(page, game) {
  await page.getByRole("button", { name: `${game.label} seansını başlat` }).click();
  const board = page.locator(".arena-board-inner");
  await board.waitFor({ state: "visible", timeout: 20000 });

  // Oyunu gerçekten başlat: GameArena'nın birincil eylemi her oyunda farklı
  // etiket taşır ("Yeni Seri Başlat", "Yeni Deste Aç", …) ama sınıfı aynıdır.
  const start = page.locator(".arena-btn-primary");
  if ((await start.count()) > 0 && (await start.first().isEnabled())) {
    await start.first().click();
  }
  await page.waitForTimeout(game.settle);

  const png = await board.screenshot();
  await sharp(png)
    .resize({ width: OUTPUT_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(path.join(OUT_DIR, `${game.key}.webp`));

  const { width, height } = await sharp(png).metadata();
  await page.getByRole("button", { name: "Seanstan Çık" }).click();
  await page.getByRole("button", { name: `${GAMES[0].label} seansını başlat` }).waitFor({ timeout: 20000 });
  return { width, height };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  try {
    const page = await openApp(context);
    for (const game of GAMES) {
      const size = await captureBoard(page, game);
      const bytes = fs.statSync(path.join(OUT_DIR, `${game.key}.webp`)).size;
      console.log(
        `✓ ${game.key.padEnd(11)} ${String(size.width).padStart(4)}×${String(size.height).padEnd(4)} → ${(bytes / 1024).toFixed(0)} kB`
      );
    }
  } finally {
    await browser.close();
  }
}

await main();
