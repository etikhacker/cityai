import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

type RateLimitResult = { allowed: boolean; retry_after_seconds: number };

/** Atomic, shared rate limits backed by the existing Supabase Postgres project. */
export async function applyRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  // Vercel overwrites x-real-ip at the trusted edge. Avoid client-controlled
  // forwarded-for values that could let callers rotate their own buckets.
  const ip = request.headers.get('x-real-ip')?.trim() || 'unknown';
  const key = createHash('sha256').update(`${scope}\0${ip}`).digest('hex');

  try {
    const { data, error } = await getSupabaseAdmin().rpc('cityai_check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000),
    });
    if (error) throw error;
    const result = (Array.isArray(data) ? data[0] : data) as RateLimitResult | null;
    if (!result || typeof result.allowed !== 'boolean') throw new Error('Invalid rate-limit RPC response.');
    if (result.allowed) return null;
    const retryAfter = Math.max(1, Number(result.retry_after_seconds) || 1);
    return NextResponse.json(
      { error: 'Sorğu limiti keçildi. Bir az sonra yenidən yoxlayın.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[CityAI rate limit] Shared limiter unavailable', error instanceof Error ? error.message : 'Unknown database error');
    return NextResponse.json(
      { error: 'Sorğu təhlükəsizlik xidməti hazırda əlçatan deyil.' },
      { status: 503, headers: { 'Retry-After': '30', 'Cache-Control': 'no-store' } },
    );
  }
}

export function hasOversizedBody(request: NextRequest, limitBytes: number): boolean {
  const length = Number(request.headers.get('content-length'));
  return Number.isFinite(length) && length > limitBytes;
}
