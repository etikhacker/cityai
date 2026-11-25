import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession, sameOrigin } from '@/lib/server/admin-auth';
import { readAllComplaintsForAdmin, updateComplaintStatus } from '@/lib/server/complaints';
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

const ADMIN_STATUSES = new Set(['open', 'in_progress', 'resolved', 'rejected']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest) {
  const limited = await applyRateLimit(request, 'admin-complaints-write', 60, 60_000);
  if (limited) return limited;
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Operator girişi tələb olunur.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Sorğunun mənbəyi qəbul edilmir.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });

  try {
    const body = (await request.json().catch(() => null)) as { id?: unknown; status?: unknown; note?: unknown } | null;
    const id = typeof body?.id === 'string' ? body.id : '';
    const status = typeof body?.status === 'string' ? body.status : '';
    const note = typeof body?.note === 'string' ? body.note.slice(0, 300) : null;

    if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Müraciət identifikatoru etibarlı deyil.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    if (!ADMIN_STATUSES.has(status)) return NextResponse.json({ error: 'Status dəyəri etibarlı deyil.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });

    const complaint = await updateComplaintStatus({ id, status: status as 'open' | 'in_progress' | 'resolved' | 'rejected', note });
    if (!complaint) return NextResponse.json({ error: 'Müraciət tapılmadı.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ complaint }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[CityAI admin status]', error instanceof Error ? error.message : 'Unknown status update error');
    return NextResponse.json({ error: 'Status yenilənərkən xəta baş verdi.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
