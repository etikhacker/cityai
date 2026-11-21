import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'cityai_admin_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function sessionSecret(): string | null {
  const value = process.env.CITYAI_SERVER_SECRET;
  return value && value.length >= 32 ? value : null;
}

function signature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function adminAuthConfigured(): boolean {
  const password = process.env.CITYAI_ADMIN_PASSWORD;
  return Boolean(password && password.length >= 12 && password.length <= 256 && sessionSecret());
}

export function verifyAdminPassword(candidate: unknown): boolean {
  const expected = process.env.CITYAI_ADMIN_PASSWORD;
  if (!expected || typeof candidate !== 'string' || candidate.length > 256) return false;
  const actualBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function issueAdminCookie(response: NextResponse): void {
  const secret = sessionSecret();
  if (!secret) throw new Error('CITYAI_SERVER_SECRET must contain at least 32 characters.');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  const value = `${payload}.${signature(payload, secret)}`;
  response.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api', maxAge: 0 });
}

export function hasAdminSession(request: NextRequest): boolean {
  const secret = sessionSecret();
  const value = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!secret || !value) return false;
  const [payload, suppliedSignature, extra] = value.split('.');
  if (!payload || !suppliedSignature || extra) return false;
  const expectedSignature = signature(payload, secret);
  const actualBytes = Buffer.from(suppliedSignature);
  const expectedBytes = Buffer.from(expectedSignature);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return Number.isInteger(decoded.exp) && (decoded.exp ?? 0) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (origin) return origin === request.nextUrl.origin;
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}
