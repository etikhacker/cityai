import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { CityAnalysisError, compareCityImages } from '@/lib/city-analysis';
import { hasAdminSession, sameOrigin } from '@/lib/server/admin-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { applyRateLimit, hasOversizedBody } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const admin = hasAdminSession(request);
  const limited = await applyRateLimit(request, admin ? 'admin-compare' : 'compare', admin ? 20 : 5, 60_000);
  if (limited) return limited;
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Sorğunun mənbəyi qəbul edilmir.' }, { status: 403 });
  if (hasOversizedBody(request, MAX_IMAGE_SIZE_BYTES * 2 + 1024 * 1024)) return NextResponse.json({ error: 'Müqayisə faylları çox böyükdür.' }, { status: 413 });

  try {
    const formData = await request.formData();
    const beforeFile = formData.get('before');
    const afterFile = formData.get('after');
    const complaintId = formData.get('muraciet_id');
    if (complaintId && !admin) return NextResponse.json({ error: 'Müraciəti yeniləmək üçün operator girişi tələb olunur.' }, { status: 401 });
    if (complaintId && (typeof complaintId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(complaintId))) {
      return NextResponse.json({ error: 'Müraciət identifikatoru etibarlı deyil.' }, { status: 400 });
    }
    if (!(beforeFile instanceof File) || !(afterFile instanceof File)) return NextResponse.json({ error: 'Müqayisə üçün hər iki şəkil tələb olunur.' }, { status: 400 });
    if (!ALLOWED_IMAGE_TYPES.has(beforeFile.type) || !ALLOWED_IMAGE_TYPES.has(afterFile.type)) return NextResponse.json({ error: 'Yalnız dəstəklənən şəkil formatlarını müqayisə etmək olar.' }, { status: 415 });
    if (beforeFile.size <= 0 || afterFile.size <= 0 || beforeFile.size > MAX_IMAGE_SIZE_BYTES || afterFile.size > MAX_IMAGE_SIZE_BYTES) return NextResponse.json({ error: 'Hər şəkil 10 MB-dan kiçik olmalıdır.' }, { status: 413 });

    const [beforeBytes, afterBytes] = await Promise.all([beforeFile.arrayBuffer(), afterFile.arrayBuffer()]);
    const result = await compareCityImages({
      apiKey: process.env.GEMINI_API_KEY,
      beforeBase64: Buffer.from(beforeBytes).toString('base64'), beforeMimeType: beforeFile.type,
      afterBase64: Buffer.from(afterBytes).toString('base64'), afterMimeType: afterFile.type,
    });

    if (typeof complaintId === 'string') {
      const db = getSupabaseAdmin();
      const { data: complaint, error: complaintError } = await db.from('muracietler').select('id,status').eq('id', complaintId).maybeSingle();
      if (complaintError) throw complaintError;
      if (!complaint) return NextResponse.json({ error: 'Müraciət tapılmadı.' }, { status: 404 });

      const ext = afterFile.type === 'image/jpeg' ? 'jpg' : afterFile.type.split('/')[1];
      const path = `after/${complaintId}/${randomUUID()}.${ext}`;
      const { error: uploadError } = await db.storage.from('muraciet-media').upload(path, afterBytes, { contentType: afterFile.type, upsert: false });
      if (uploadError) throw uploadError;
      const newStatus = result.is_resolved ? 'resolved' : 'in_progress';
      const { error: mediaError } = await db.from('media_fayllar').insert({ muraciet_id: complaintId, storage_path: path, file_type: 'image', is_before: false });
      if (mediaError) {
        await db.storage.from('muraciet-media').remove([path]);
        throw mediaError;
      }
      const { data: historyEntry, error: historyError } = await db.from('status_tarix').insert({ muraciet_id: complaintId, old_status: complaint.status, new_status: newStatus, note: result.summary }).select('id').single();
      if (historyError || !historyEntry) {
        await db.from('media_fayllar').delete().eq('muraciet_id', complaintId).eq('storage_path', path);
        await db.storage.from('muraciet-media').remove([path]);
        throw historyError || new Error('Status history could not be created.');
      }
      const { error: updateError } = await db.from('muracietler').update({ status: newStatus }).eq('id', complaintId);
      if (updateError) {
        await db.from('status_tarix').delete().eq('id', historyEntry.id);
        await db.from('media_fayllar').delete().eq('muraciet_id', complaintId).eq('storage_path', path);
        await db.storage.from('muraciet-media').remove([path]);
        throw updateError;
      }
    }

    return NextResponse.json({ success: true, result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CityAnalysisError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('[CityAI compare] Unexpected error', error instanceof Error ? error.message : 'Unknown comparison error');
    return NextResponse.json({ error: 'Müqayisə zamanı gözlənilməyən xəta baş verdi.' }, { status: 500 });
  }
}
