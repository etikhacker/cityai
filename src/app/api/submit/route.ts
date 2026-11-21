import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, hasOversizedBody } from '@/lib/server/rate-limit';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { verifyMediaProof } from '@/lib/server/media-proof';
import { sameOrigin } from '@/lib/server/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORIES = new Set(['yol', 'isiq', 'zibil', 'su', 'yasilliq', 'diger']);
const PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_BODY_BYTES = 12 * 1024;
const MAX_MEDIA = 5;

function safeAnalysis(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.problem_type !== 'string' || item.problem_type.length > 120 ||
    typeof item.description !== 'string' || item.description.length > 1000 ||
    typeof item.severity !== 'string' || !PRIORITIES.has(item.severity) ||
    typeof item.confidence !== 'number' || !Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1 ||
    typeof item.is_infrastructure !== 'boolean' || !Array.isArray(item.tags) || item.tags.length > 6 ||
    item.tags.some((tag) => typeof tag !== 'string' || tag.length > 48)
  ) return null;
  return {
    problem_type: item.problem_type.trim(), severity: item.severity, description: item.description.trim(),
    confidence: item.confidence, tags: item.tags.map((tag: string) => tag.trim()),
  };
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'submit', 5, 60 * 60_000);
  if (limited) return limited;
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Sorğunun mənbəyi qəbul edilmir.' }, { status: 403 });
  if (hasOversizedBody(request, MAX_BODY_BYTES)) return NextResponse.json({ error: 'Müraciət məlumatları çox böyükdür.' }, { status: 413 });

  let createdId: string | null = null;
  let uploadedPaths: string[] = [];
  let mediaLinkConflict = false;
  try {
    const body = await request.json();
    const { category, description, priority, location, analysis, media } = body ?? {};
    if (typeof category !== 'string' || !CATEGORIES.has(category)) return NextResponse.json({ error: 'Problem kateqoriyasını yoxlayın.' }, { status: 400 });
    if (typeof description !== 'string' || !description.trim() || description.trim().length > 500) return NextResponse.json({ error: 'Təsvir 1–500 simvol olmalıdır.' }, { status: 400 });
    if (typeof priority !== 'string' || !PRIORITIES.has(priority)) return NextResponse.json({ error: 'Təciliyi yoxlayın.' }, { status: 400 });
    if (typeof location !== 'string' || location.length > 300) return NextResponse.json({ error: 'Məkan məlumatı çox uzundur.' }, { status: 400 });
    if (analysis != null && !safeAnalysis(analysis)) return NextResponse.json({ error: 'AI təhlil məlumatı etibarlı deyil.' }, { status: 400 });
    if (!Array.isArray(media) || media.length > MAX_MEDIA) return NextResponse.json({ error: 'Media fayllarının sayını yoxlayın.' }, { status: 400 });

    let totalMediaBytes = 0;
    const parsedMedia = media.map((item: unknown) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const file = item as Record<string, unknown>;
      if (typeof file.path !== 'string' || !/^[0-9a-f-]{36}\.(?:jpeg|png|webp|heic|heif|mp4|webm|mov)$/.test(file.path)) return null;
      if (typeof file.type !== 'string' || typeof file.size !== 'number' || !Number.isInteger(file.size)) return null;
      const isImage = IMAGE_TYPES.has(file.type);
      const isVideo = VIDEO_TYPES.has(file.type);
      if (!isImage && !isVideo) return null;
      if (file.size <= 0 || file.size > (isImage ? 10 : 20) * 1024 * 1024) return null;
      if (!verifyMediaProof(file.path, file.type, file.size, file.proof)) return null;
      totalMediaBytes += file.size;
      return { path: file.path, type: file.type, size: file.size, file_type: isVideo ? 'video' : 'image' };
    });
    if (parsedMedia.some((item: unknown) => !item) || totalMediaBytes > 50 * 1024 * 1024) return NextResponse.json({ error: 'Media fayllarının formatını və ölçüsünü yoxlayın.' }, { status: 400 });
    const verifiedMedia = parsedMedia as Array<{ path: string; type: string; size: number; file_type: 'image' | 'video' }>;
    if (new Set(verifiedMedia.map((item) => item.path)).size !== verifiedMedia.length) {
      return NextResponse.json({ error: 'Eyni media faylı müraciətə bir dəfədən çox əlavə edilə bilməz.' }, { status: 400 });
    }
    const safe = safeAnalysis(analysis);
    const db = getSupabaseAdmin();
    const storage = db.storage.from('muraciet-media');

    // Upload proofs are single-use: a previously attached object cannot be
    // replayed to create another complaint. The unique DB index added by the
    // privacy migration closes the concurrent-request race as well.
    if (verifiedMedia.length) {
      const { data: linkedMedia, error: linkedMediaError } = await db.from('media_fayllar')
        .select('storage_path').in('storage_path', verifiedMedia.map((item) => item.path));
      if (linkedMediaError) throw linkedMediaError;
      if (linkedMedia?.length) return NextResponse.json({ error: 'Media faylı artıq başqa müraciətə əlavə edilib.' }, { status: 409 });
    }

    // Confirm all signed uploads exist and still match the metadata signed by this server.
    for (const mediaItem of verifiedMedia) {
      const { data: objects, error } = await storage.list('', { search: mediaItem.path, limit: 10 });
      const object = objects?.find((entry) => entry.name === mediaItem.path);
      if (error || !object || Number(object.metadata?.size) !== mediaItem.size) {
        return NextResponse.json({ error: 'Yüklənmiş media faylı tapılmadı və ya ölçüsü fərqlidir.' }, { status: 400 });
      }
    }

    uploadedPaths = verifiedMedia.map((item) => item.path);
    const trackingCode = `MZB-${randomBytes(16).toString('hex').toUpperCase()}`;
    const { data: complaint, error: complaintError } = await db.from('muracietler').insert({
      tracking_code: trackingCode, category, description: description.trim(), priority,
      location: location.trim() || null, status: 'open',
    }).select('id').single();
    if (complaintError || !complaint?.id) throw complaintError || new Error('Complaint could not be created.');
    createdId = complaint.id;

    if (safe) {
      const { error } = await db.from('ai_analizler').insert({
        muraciet_id: createdId, problem_type: safe.problem_type, severity: safe.severity,
        description: safe.description, tags: safe.tags, confidence: safe.confidence,
      });
      if (error) throw error;
    }
    if (verifiedMedia.length) {
      const { error } = await db.from('media_fayllar').insert(verifiedMedia.map((item) => ({
        muraciet_id: createdId, storage_path: item.path, file_type: item.file_type, is_before: true,
      })));
      if (error) {
        mediaLinkConflict = (error as { code?: string }).code === '23505';
        throw error;
      }
    }
    const { error: historyError } = await db.from('status_tarix').insert({
      muraciet_id: createdId, old_status: null, new_status: 'open', note: 'Müraciət qəbul edildi',
    });
    if (historyError) throw historyError;

    return NextResponse.json({ success: true, tracking_code: trackingCode }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (createdId) {
      const db = getSupabaseAdmin();
      await db.from('status_tarix').delete().eq('muraciet_id', createdId);
      await db.from('media_fayllar').delete().eq('muraciet_id', createdId);
      await db.from('ai_analizler').delete().eq('muraciet_id', createdId);
      await db.from('muracietler').delete().eq('id', createdId);
    }
    if (uploadedPaths.length) {
      const db = getSupabaseAdmin();
      const { data: linkedMedia, error: linkedMediaError } = await db.from('media_fayllar')
        .select('storage_path').in('storage_path', uploadedPaths);
      if (!linkedMediaError) {
        const linkedPaths = new Set((linkedMedia || []).map((item) => item.storage_path));
        const unlinkedPaths = uploadedPaths.filter((path) => !linkedPaths.has(path));
        if (unlinkedPaths.length) await db.storage.from('muraciet-media').remove(unlinkedPaths);
      }
    }
    if (mediaLinkConflict) {
      return NextResponse.json({ error: 'Media faylı artıq başqa müraciətə əlavə edilib.' }, { status: 409 });
    }
    console.error('[CityAI submit]', error instanceof Error ? error.message : 'Unknown submission error');
    return NextResponse.json({ error: 'Müraciət göndərilə bilmədi.' }, { status: 500 });
  }
}
