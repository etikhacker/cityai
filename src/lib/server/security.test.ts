import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, clearAdminCookie, hasAdminSession, issueAdminCookie, sameOrigin, verifyAdminPassword } from '@/lib/server/admin-auth';
import { createMediaProof, verifyMediaProof } from '@/lib/server/media-proof';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/lib/server/supabase-admin', () => ({ getSupabaseAdmin: () => ({ rpc }) }));

const originalPassword = process.env.CITYAI_ADMIN_PASSWORD;
const originalSecret = process.env.CITYAI_SERVER_SECRET;

afterEach(() => {
  vi.unstubAllEnvs();
  rpc.mockReset();
  if (originalPassword === undefined) delete process.env.CITYAI_ADMIN_PASSWORD;
  else process.env.CITYAI_ADMIN_PASSWORD = originalPassword;
  if (originalSecret === undefined) delete process.env.CITYAI_SERVER_SECRET;
  else process.env.CITYAI_SERVER_SECRET = originalSecret;
});

describe('server security helpers', () => {
  it('rejects an admin session after its eight-hour expiry', () => {
    process.env.CITYAI_SERVER_SECRET = 'unit-test-server-secret-with-32-plus-characters';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-21T10:00:00Z'));
    const response = NextResponse.json({ authenticated: true });
    issueAdminCookie(response);
    const cookie = response.cookies.get(ADMIN_COOKIE)?.value;
    const request = new NextRequest('https://cityai.test/api/admin/complaints', { headers: { cookie: `${ADMIN_COOKIE}=${cookie}` } });

    expect(hasAdminSession(request)).toBe(true);
    vi.advanceTimersByTime(8 * 60 * 60 * 1000 + 1);
    expect(hasAdminSession(request)).toBe(false);
    vi.useRealTimers();
  });

  it('signs an expiring HttpOnly admin cookie and rejects tampering', () => {
    process.env.CITYAI_ADMIN_PASSWORD = 'test-password-for-unit-tests';
    process.env.CITYAI_SERVER_SECRET = 'unit-test-server-secret-with-32-plus-characters';
    expect(verifyAdminPassword('test-password-for-unit-tests')).toBe(true);
    expect(verifyAdminPassword('wrong')).toBe(false);

    vi.stubEnv('NODE_ENV', 'production');
    const response = NextResponse.json({ authenticated: true });
    issueAdminCookie(response);
    const cookie = response.cookies.get(ADMIN_COOKIE)?.value;
    const cookieOptions = response.cookies.get(ADMIN_COOKIE);
    expect(cookieOptions?.httpOnly).toBe(true);
    expect(cookieOptions?.secure).toBe(true);
    expect(cookieOptions?.sameSite).toBe('strict');
    expect(cookieOptions?.path).toBe('/api');
    expect(cookie).toBeTruthy();
    const request = new NextRequest('https://cityai.test/api/admin/complaints', { headers: { cookie: `${ADMIN_COOKIE}=${cookie}` } });
    expect(hasAdminSession(request)).toBe(true);
    const tamperedRequest = new NextRequest('https://cityai.test/api/admin/complaints', { headers: { cookie: `${ADMIN_COOKIE}=${cookie}x` } });
    expect(hasAdminSession(tamperedRequest)).toBe(false);
    clearAdminCookie(response);
  });

  it('rejects missing or cross-origin browser request origins', () => {
    expect(sameOrigin(new NextRequest('https://cityai.test/api/admin/session'))).toBe(false);
    expect(sameOrigin(new NextRequest('https://cityai.test/api/admin/session', { headers: { origin: 'https://attacker.test' } }))).toBe(false);
    expect(sameOrigin(new NextRequest('https://cityai.test/api/admin/session', { headers: { referer: 'https://cityai.test/admin' } }))).toBe(true);
  });

  it('binds temporary media proofs to path, MIME, and size', () => {
    process.env.CITYAI_SERVER_SECRET = 'unit-test-server-secret-with-32-plus-characters';
    const proof = createMediaProof('ea1cc9f4-5904-4c2d-8242-5dd4113876a0.png', 'image/png', 1234);
    expect(verifyMediaProof('ea1cc9f4-5904-4c2d-8242-5dd4113876a0.png', 'image/png', 1234, proof)).toBe(true);
    expect(verifyMediaProof('ea1cc9f4-5904-4c2d-8242-5dd4113876a0.png', 'image/png', 1235, proof)).toBe(false);
    expect(verifyMediaProof('another.png', 'image/png', 1234, proof)).toBe(false);
  });

  it('keeps the media proof valid for the signed-upload window and expires it afterward', () => {
    process.env.CITYAI_SERVER_SECRET = 'unit-test-server-secret-with-32-plus-characters';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-21T10:00:00Z'));
    const path = 'ea1cc9f4-5904-4c2d-8242-5dd4113876a0.mp4';
    const proof = createMediaProof(path, 'video/mp4', 1234);
    vi.advanceTimersByTime(119 * 60 * 1000);
    expect(verifyMediaProof(path, 'video/mp4', 1234, proof)).toBe(true);
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(verifyMediaProof(path, 'video/mp4', 1234, proof)).toBe(false);
    vi.useRealTimers();
  });

  it('uses the shared atomic limiter and returns its retry-after value', async () => {
    const { applyRateLimit } = await import('@/lib/server/rate-limit');
    const request = new NextRequest('https://cityai.test/api/test', { headers: { 'x-real-ip': '192.0.2.41' } });
    rpc.mockResolvedValueOnce({ data: [{ allowed: true, retry_after_seconds: 30 }], error: null });
    expect(await applyRateLimit(request, 'unit', 2, 60_000)).toBeNull();
    expect(rpc).toHaveBeenLastCalledWith('cityai_check_rate_limit', expect.objectContaining({ p_limit: 2, p_window_seconds: 60 }));

    rpc.mockResolvedValueOnce({ data: [{ allowed: false, retry_after_seconds: 19 }], error: null });
    const limited = await applyRateLimit(request, 'unit', 2, 60_000);
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get('retry-after')).toBe('19');
  });

  it('fails closed when the shared rate-limit migration is unavailable', async () => {
    const { applyRateLimit } = await import('@/lib/server/rate-limit');
    rpc.mockResolvedValueOnce({ data: null, error: new Error('function missing') });
    const limited = await applyRateLimit(new NextRequest('https://cityai.test/api/test'), 'unit', 2, 60_000);
    expect(limited?.status).toBe(503);
  });
});
