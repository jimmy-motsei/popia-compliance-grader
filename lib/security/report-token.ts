import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function secret(): string | null {
  return process.env.REPORT_SIGNING_SECRET ?? null;
}

export function createSignedReportToken(leadId: string, ttlSeconds = DEFAULT_TTL_SECONDS): string | null {
  const key = secret();
  if (!key) {
    return null;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${leadId}:${expiresAt}`;
  const signature = createHmac("sha256", key).update(payload).digest("hex");
  return `${expiresAt}.${signature}`;
}

export function verifySignedReportToken(leadId: string, token: string | null): boolean {
  const key = secret();
  if (!key) {
    return true;
  }
  if (!token) {
    return false;
  }

  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!expiresAtRaw || !signature || !Number.isFinite(expiresAt)) {
    return false;
  }

  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return false;
  }

  const payload = `${leadId}:${expiresAt}`;
  const expected = createHmac("sha256", key).update(payload).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
