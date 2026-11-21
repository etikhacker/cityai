import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession, sameOrigin } from '@/lib/server/admin-auth';
import { readAllComplaintsForAdmin } from '@/lib/server/complaints';
import { applyRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'admin-complaints', 30, 60_000);
  if (limited) return limited;
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Operator girişi tələb olunur.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    const complaints = await readAllComplaintsForAdmin();
    return NextResponse.json({ complaints }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[CityAI admin complaints]', error instanceof Error ? error.message : 'Unknown database error');
    return NextResponse.json({ error: 'Müraciətlər yüklənərkən xəta baş verdi.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
