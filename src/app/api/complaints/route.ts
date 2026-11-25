import { NextRequest, NextResponse } from 'next/server';
import { readComplaintByTrackingCode } from '@/lib/server/complaints';
import { applyRateLimit } from '@/lib/server/rate-limit';
import { isValidTrackingCode, normalizeTrackingCode } from '@/lib/tracking-code';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'tracking', 20, 60_000);
  if (limited) return limited;
  const rawCode = request.nextUrl.searchParams.get('code')?.replace(/^#/, '') ?? '';
  const code = normalizeTrackingCode(rawCode);
  if (!code || !isValidTrackingCode(code)) {
    return NextResponse.json({ error: 'Düzgün izləmə kodu daxil edin.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const complaint = await readComplaintByTrackingCode(code);
    return complaint
      ? NextResponse.json({ complaint }, { headers: { 'Cache-Control': 'no-store' } })
      : NextResponse.json({ error: 'Bu izləmə koduna uyğun müraciət tapılmadı.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[CityAI tracking]', error instanceof Error ? error.message : 'Unknown database error');
    return NextResponse.json({ error: 'Müraciət yüklənərkən xəta baş verdi.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
