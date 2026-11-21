import { NextRequest, NextResponse } from 'next/server';
import { adminAuthConfigured, clearAdminCookie, hasAdminSession, issueAdminCookie, sameOrigin, verifyAdminPassword } from '@/lib/server/admin-auth';
import { applyRateLimit, hasOversizedBody } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: hasAdminSession(request) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'admin-login', 5, 15 * 60_000);
  if (limited) return limited;
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Sorğunun mənbəyi qəbul edilmir.' }, { status: 403 });
  if (!adminAuthConfigured()) return NextResponse.json({ error: 'Admin giriş məlumatları serverdə konfiqurasiya edilməyib.' }, { status: 503 });
  if (hasOversizedBody(request, 1024)) return NextResponse.json({ error: 'Sorğu çox böyükdür.' }, { status: 413 });
  try {
    const body = await request.json();
    if (!verifyAdminPassword(body?.password)) return NextResponse.json({ error: 'Daxil edilən şifrə yanlışdır.' }, { status: 401 });
    const response = NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
    issueAdminCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: 'Giriş sorğusu oxunmadı.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Sorğunun mənbəyi qəbul edilmir.' }, { status: 403 });
  const response = NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
  clearAdminCookie(response);
  return response;
}
