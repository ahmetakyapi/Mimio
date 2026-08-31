/**
 * Tanıtım sayfasındaki ürün önizlemesini gerçek uygulamadan yakalar.
 *
 * `capture-game-shots.mjs`ten ayrı bir betik, çünkü koşulları farklı:
 * oyun tahtaları saf istemci mantığıyla çalışır ve veritabanı istemez;
 * panel ise ancak gerçek veriyle bir şey söyler. Boş bir panelin ekran
 * görüntüsü tanıtım sayfasında işe yaramaz, uydurma veriyle doldurmak ise
 * tam da kaldırdığımız sahte ekran görüntüsüne geri dönmek olurdu.
 *
 * Bu yüzden burada taklit YOKTUR: demo hesabıyla gerçekten giriş yapılır,
 * ekranda görünen her sayı `scripts/seed-demo.mjs`in yazdığı gerçek
 * kayıtlardan gelir. Danışan adları kurgusaldır (seed verisi).
 *
 * Ön koşullar:
 *   .env.local içinde DATABASE_URL
 *   npm run db:seed        # demo hesabı + 8 danışan + seans geçmişi
 *   npm run dev            # ayrı bir terminalde
 *
 * Kullanım:
 *   node scripts/capture-app-shots.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "public", "app");

/** Önizleme en fazla ~1100px basılıyor; 2x için 2200 yeter. */
const OUTPUT_WIDTH = 2200;
const WEBP_QUALITY = 80;

const SHOTS = [{ key: "dashboard", nav: null, label: "Bugün" }];

async function login(context, theme) {
  const page = await context.newPage();
  await page.addInitScript((t) => {
    localStorage.setItem("mimio-theme", t);
    localStorage.setItem("mimio-onboarding-completed-v1", new Date().toISOString());
  }, theme);
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Giriş Yap" }).first().click();
  await page.getByRole("button", { name: "Demo Hesapla Keşfet" }).click();
  await page.getByRole("button", { name: "Haftalık Plan" }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(2500);
  // Geliştirme katmanları görüntüye girmesin.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  return page;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await login(context, theme);

      for (const shot of SHOTS) {
        if (shot.nav) {
          await page.getByRole("button", { name: shot.nav }).first().click();
          await page.waitForTimeout(2800);
        }
        const png = await page.screenshot();
        const file = path.join(OUT_DIR, `${shot.key}-${theme}.webp`);
        await sharp(png)
          .resize({ width: OUTPUT_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(file);
        console.log(`✓ ${shot.key}-${theme}`.padEnd(26) + `${(fs.statSync(file).size / 1024).toFixed(0)} kB`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

await main();
