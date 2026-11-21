import { createHmac, timingSafeEqual } from 'node:crypto';

// Supabase signed upload URLs are valid for two hours. Keep the metadata proof
// valid for the same window so users can finish a long complaint form.
const PROOF_TTL_SECONDS = 2 * 60 * 60;

function secret(): string | null {
  const value = process.env.CITYAI_SERVER_SECRET;
  return value && value.length >= 32 ? value : null;
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function createMediaProof(path: string, type: string, size: number): string {
  const key = secret();
  if (!key) throw new Error('CITYAI_SERVER_SECRET must contain at least 32 characters.');
  const payload = Buffer.from(JSON.stringify({ path, type, size, exp: Math.floor(Date.now() / 1000) + PROOF_TTL_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload, key)}`;
}

export function verifyMediaProof(path: string, type: string, size: number, proof: unknown): boolean {
  const key = secret();
  if (!key || typeof proof !== 'string') return false;
  const [payload, supplied, extra] = proof.split('.');
  if (!payload || !supplied || extra) return false;
  const expected = sign(payload, key);
  const givenBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (givenBytes.length !== expectedBytes.length || !timingSafeEqual(givenBytes, expectedBytes)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { path?: string; type?: string; size?: number; exp?: number };
    return parsed.path === path && parsed.type === type && parsed.size === size && Number.isInteger(parsed.exp) && (parsed.exp ?? 0) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
