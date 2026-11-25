import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession, sameOrigin } from '@/lib/server/admin-auth';
import { readAllComplaintsForAdmin, updateComplaint } from '@/lib/server/complaints';
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
    const body = (await request.json().catch(() => null)) as { id?: unknown; status?: unknown; note?: unknown; department?: unknown } | null;
    const id = typeof body?.id === 'string' ? body.id : '';
    const status = typeof body?.status === 'string' && body.status ? body.status : undefined;
    const note = typeof body?.note === 'string' ? body.note.slice(0, 300) : null;
    const department = typeof body?.department === 'string' ? body.department.trim().slice(0, 160) : undefined;

    if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Müraciət identifikatoru etibarlı deyil.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    if (status && !ADMIN_STATUSES.has(status)) return NextResponse.json({ error: 'Status dəyəri etibarlı deyil.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    if (department === '') return NextResponse.json({ error: 'Qurum adı boş ola bilməz.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    if (!status && department === undefined) return NextResponse.json({ error: 'Yenilənəcək sahə göstərilməyib.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });

    const complaint = await updateComplaint({
      id,
      status: status as 'open' | 'in_progress' | 'resolved' | 'rejected' | undefined,
      department,
      note,
    });
    if (!complaint) return NextResponse.json({ error: 'Müraciət tapılmadı.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ complaint }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[CityAI admin update]', error instanceof Error ? error.message : 'Unknown admin update error');
    return NextResponse.json({ error: 'Müraciət yenilənərkən xəta baş verdi.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
