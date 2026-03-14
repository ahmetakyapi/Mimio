import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const APP_URL = "http://127.0.0.1:4301";
const OUTPUT_DIR = path.join(process.cwd(), "output/playwright");
const PULSE_LABELS = ["Sol Üst", "Üst", "Sağ Üst", "Sol", "Merkez", "Sağ", "Sol Alt", "Alt", "Sağ Alt"];

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

async function readState(page) {
  const text = await page.evaluate(() => window.render_game_to_text?.() ?? "{}");
  return JSON.parse(text);
}

async function waitForReady(page) {
  await page.waitForFunction(() => typeof window.render_game_to_text === "function", null, {
    timeout: 45000,
  });
}

async function advance(page, times = 1) {
  for (let index = 0; index < times; index += 1) {
    await page.evaluate(async () => {
      if (typeof window.advanceTime === "function") {
        await window.advanceTime(1000 / 60);
      }
    });
  }
}

function findOddLabel(tiles) {
  const counts = new Map();

  for (const tile of tiles) {
    counts.set(tile.label, (counts.get(tile.label) ?? 0) + 1);
  }

  for (const tile of tiles) {
    if ((counts.get(tile.label) ?? 0) === 1) {
      return tile.label;
    }
  }

  return null;
}

async function clickButtonByName(page, name) {
  const roles = ["button", "tab", "link"];

  // Try exact match first, then partial match
  for (const exact of [true, false]) {
    for (const role of roles) {
      const locator = page.getByRole(role, { name, exact });
      if ((await locator.count()) > 0) {
        await locator.first().click();
        return;
      }
    }
  }

  throw new Error(`Kontrol bulunamadı: ${name}`);
}

async function openGamesView(page) {
  const state = await readState(page);
  if (state.activeAppView === "games") {
    return;
  }

  // Try both possible button names (sidebar uses "Oyun Alanı")
  const oyunAlani = page.getByRole("button", { name: "Oyun Alanı" });
  if ((await oyunAlani.count()) > 0) {
    await oyunAlani.first().click();
  } else {
    await clickButtonByName(page, "Oyunlar");
  }
  await page.getByRole("button", { name: "Yeni Seri Başlat", exact: true }).waitFor({ state: "visible", timeout: 10000 });
}

async function configureSessionDesk(page) {
  // New login flow: register a new therapist account
  // We're on the register screen after clicking "Ücretsiz Başla" from landing
  // Fill in the registration form using placeholder-based selectors
  const usernameInput = page.locator('input[placeholder*="Kullanıcı adı"]');
  const displayNameInput = page.locator('input[placeholder*="Ad soyad"]');
  const clinicInput = page.locator('input[placeholder*="Kurum"]');
  const specialtyInput = page.locator('input[placeholder*="Uzmanlık"]');

  await usernameInput.fill("testuzmani");
  await displayNameInput.fill("Erg. Test Uzmanı");
  await clinicInput.fill("Mimio Lab");
  await specialtyInput.fill("Motor planlama");
  await clickButtonByName(page, "Hesabı Oluştur ve Gir →");

  // Wait for app shell to load (dashboard)
  await page.waitForTimeout(1000);

  // Navigate to clients to add a client
  await clickButtonByName(page, "Danışanlar");
  await page.waitForTimeout(500);

  // Open add client form
  const addClientBtn = page.getByRole("button", { name: "+ Yeni Danışan" });
  if ((await addClientBtn.count()) > 0) {
    await addClientBtn.click();
    await page.waitForTimeout(300);
  }

  // Fill add client form (the fields are inputs inside addClientForm)
  const clientNameInput = page.locator('input[placeholder*="Danışan adı"]').or(page.locator('input[placeholder*="Ad soyad"]')).first();
  if ((await clientNameInput.count()) > 0) {
    await clientNameInput.fill("Test Danışanı");
    const ageInput = page.locator('input[placeholder*="Yaş"]').first();
    if ((await ageInput.count()) > 0) await ageInput.fill("8-10 yaş");
    const goalInput = page.locator('input[placeholder*="hedef"]').first();
    if ((await goalInput.count()) > 0) await goalInput.fill("Görsel tarama");
    const supportInput = page.locator('input[placeholder*="Destek"]').or(page.locator('input[placeholder*="destek"]')).first();
    if ((await supportInput.count()) > 0) await supportInput.fill("Kademeli ipucu");

    // Click save button for client
    const saveBtn = page.getByRole("button", { name: /Kaydet|Ekle/i }).first();
    if ((await saveBtn.count()) > 0) await saveBtn.click();
    await page.waitForTimeout(500);
  }

  // Navigate to games
  await clickButtonByName(page, "Oyun Alanı");
  await page.waitForTimeout(500);

  // Select therapist and client from dropdowns if available
  const selects = page.locator("select");
  if ((await selects.count()) >= 2) {
    try {
      await selects.nth(0).selectOption({ label: "Erg. Test Uzmanı" });
      await selects.nth(1).selectOption({ label: "Test Danışanı" });
    } catch { /* selectors might not have these options yet */ }
  }

  // Fill session note
  const textarea = page.locator("textarea").first();
  if ((await textarea.count()) > 0) {
    await textarea.fill("Görsel tarama odaklı ısınma ve kısa hafıza turu.");
  }
}

async function openGame(page, categoryName, gameName, startButton) {
  await clickButtonByName(page, categoryName);
  await clickButtonByName(page, gameName);

  if (startButton) {
    await page.getByRole("button", { name: startButton, exact: true }).waitFor({ state: "visible" });
  }
}

async function runDesktopFlow(consoleErrors) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(String(error));
  });

  await page.goto(APP_URL, { waitUntil: "networkidle" });

  // If landing page is shown, click register to enter the app
  const desktopRegisterBtn = page.getByRole("button", { name: "Ücretsiz Başla" });
  if ((await desktopRegisterBtn.count()) > 0) {
    await desktopRegisterBtn.first().click();
    await page.waitForTimeout(500);
  }

  await waitForReady(page);
  await configureSessionDesk(page);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "desktop-home.png"), fullPage: false });
  await openGamesView(page);
  await page.getByText("Görsel tarama odaklı ısınma ve kısa hafıza turu.", { exact: true }).waitFor({ state: "visible" });

  await openGame(page, "Hafıza Oyunları", "Sıra Hafızası", "Yeni Seri Başlat");
  await clickButtonByName(page, "Yeni Seri Başlat");
  await advance(page, 2);
  let state = await readState(page);
  const firstSequence = [...state.memory.sequence];
  for (const label of firstSequence) {
    await page.getByRole("button", { name: label, exact: true }).click();
  }
  await page.waitForTimeout(850);
  await advance(page, 2);
  state = await readState(page);
  const secondSequence = [...state.memory.sequence];
  for (const label of secondSequence) {
    await page.getByRole("button", { name: label, exact: true }).click();
  }
  await page.waitForTimeout(850);
  await advance(page, 2);
  state = await readState(page);
  const wrongLabel = ["Bulut", "Damlacık", "Kırık Çizgi", "Halka", "Işık", "Dalga"].find(
    (label) => label !== state.memory.sequence[0]
  );
  if (wrongLabel) {
    await page.getByRole("button", { name: wrongLabel, exact: true }).click();
  }
  await page.waitForTimeout(200);
  const memoryResult = await readState(page);

  await openGame(page, "Hafıza Oyunları", "Kart Eşle", "Yeni Deste Aç");
  await clickButtonByName(page, "Yeni Deste Aç");
  state = await readState(page);
  const pairsByLabel = new Map();
  for (const tile of state.pairs.tiles) {
    if (!pairsByLabel.has(tile.label)) {
      pairsByLabel.set(tile.label, []);
    }
    pairsByLabel.get(tile.label).push(tile.index);
  }
  for (const indexes of pairsByLabel.values()) {
    for (const index of indexes) {
      await page.locator(`[data-pairs-index="${index}"]`).click();
      await page.waitForTimeout(40);
    }
  }
  await page.waitForTimeout(120);
  const pairsResult = await readState(page);

  await openGame(page, "Motor Beceri Oyunları", "Mavi Nabız", "Seti Başlat");
  await clickButtonByName(page, "Seti Başlat");
  state = await readState(page);
  while (state.pulse.phase === "playing") {
    const label = PULSE_LABELS[state.pulse.activeIndex];
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(60);
    state = await readState(page);
  }
  const pulseResult = state;

  await openGame(page, "Motor Beceri Oyunları", "Komut Rotası", "Komutları Başlat");
  await clickButtonByName(page, "Komutları Başlat");
  state = await readState(page);
  while (state.route.phase === "playing") {
    await page.getByRole("button", { name: new RegExp(state.route.commandLabel) }).first().click();
    await page.waitForTimeout(60);
    state = await readState(page);
  }
  const routeResult = state;

  await openGame(page, "Görsel Algı Oyunları", "Fark Avcısı", "Turu Başlat");
  await clickButtonByName(page, "Turu Başlat");
  state = await readState(page);
  while (state.difference.phase === "playing") {
    const oddLabel = findOddLabel(state.difference.visibleTiles);
    if (!oddLabel) {
      break;
    }

    await page.getByRole("button", { name: new RegExp(oddLabel) }).first().click();
    await page.waitForTimeout(70);
    state = await readState(page);
  }
  const differenceResult = state;

  await openGame(page, "Görsel Algı Oyunları", "Hedef Tarama", "Taramayı Başlat");
  await clickButtonByName(page, "Taramayı Başlat");
  state = await readState(page);
  while (state.scan.phase === "playing") {
    await page.getByRole("button", { name: new RegExp(state.scan.targetLabel) }).first().click();
    await page.waitForTimeout(70);
    state = await readState(page);
  }
  const scanResult = state;

  await page.screenshot({ path: path.join(OUTPUT_DIR, "desktop-games.png"), fullPage: false });
  await browser.close();

  return {
    memoryResult,
    pairsResult,
    pulseResult,
    routeResult,
    differenceResult,
    scanResult,
  };
}

async function runMobileSnapshot(consoleErrors) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(String(error));
  });

  await page.goto(APP_URL, { waitUntil: "networkidle" });

  // If landing page is shown, click login to enter the app
  const mobileLoginBtn = page.getByRole("button", { name: "Giriş Yap" });
  const mobileRegisterBtn = page.getByRole("button", { name: "Ücretsiz Başla" });
  if ((await mobileRegisterBtn.count()) > 0) {
    await mobileRegisterBtn.first().click();
    await page.waitForTimeout(500);
    // Register quickly so we get into the app
    const usernameInput = page.locator('input[placeholder*="Kullanıcı adı"]');
    const displayNameInput = page.locator('input[placeholder*="Ad soyad"]');
    if ((await usernameInput.count()) > 0) {
      await usernameInput.fill("mobiltest");
      await displayNameInput.fill("Mobil Terapist");
      await clickButtonByName(page, "Hesabı Oluştur ve Gir →");
      await page.waitForTimeout(1000);
    }
  } else if ((await mobileLoginBtn.count()) > 0) {
    await mobileLoginBtn.first().click();
    await page.waitForTimeout(500);
  }

  await waitForReady(page);
  await openGamesView(page);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-games.png"), fullPage: false });
  await browser.close();
}

async function main() {
  ensureDir(OUTPUT_DIR);
  const consoleErrors = [];
  const desktop = await runDesktopFlow(consoleErrors);
  await runMobileSnapshot(consoleErrors);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "report.json"),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        consoleErrors,
        desktop,
      },
      null,
      2
    )
  );

  if (consoleErrors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
