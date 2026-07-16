import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "mimio_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 gün

/**
 * İmza anahtarı önceliği: SESSION_SECRET > DATABASE_URL türevi.
 * DATABASE_URL fallback'i, ek env var tanımlanmadan da production'da
 * tahmin edilemez bir anahtar sağlar; yine de SESSION_SECRET önerilir.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET veya DATABASE_URL tanımlı olmalı.");
  }
  return "mimio-dev-only-secret";
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createSessionToken(therapistId: string): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const data = `${therapistId}|${expiresAt}`;
  return `${Buffer.from(data, "utf8").toString("base64url")}.${sign(data)}`;
}

export function verifySessionToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex < 1) return null;
  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  let data: string;
  try {
    data = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(data);
  const givenBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (givenBuf.length !== expectedBuf.length || !timingSafeEqual(givenBuf, expectedBuf)) {
    return null;
  }
  const sepIndex = data.lastIndexOf("|");
  if (sepIndex < 1) return null;
  const therapistId = data.slice(0, sepIndex);
  const expiresAt = Number(data.slice(sepIndex + 1));
  if (!therapistId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  return therapistId;
}

/** Geçerli oturumun terapist id'sini döndürür; oturum yoksa null. */
export async function getSessionTherapistId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie(therapistId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(therapistId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
