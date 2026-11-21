import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createMediaProof, verifyMediaProof } from '@/lib/server/media-proof';
import { applyRateLimit, hasOversizedBody } from '@/lib/server/rate-limit';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { sameOrigin } from '@/lib/server/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'media-upload-sign', 12, 60_000);
  if (limited) return limited;
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Sorğunun mənbəyi qəbul edilmir.' }, { status: 403 });
  if (hasOversizedBody(request, 8 * 1024)) return NextResponse.json({ error: 'Sorğu çox böyükdür.' }, { status: 413 });
  try {
    const body = await request.json();
    if (!Array.isArray(body?.files) || body.files.length < 1 || body.files.length > MAX_FILES) {
      return NextResponse.json({ error: '1–5 fayl əlavə edin.' }, { status: 400 });
    }
    const files = body.files as Array<{ type?: unknown; size?: unknown }>;
    let totalBytes = 0;
    const validated = files.map((file) => {
      if (typeof file.type !== 'string' || typeof file.size !== 'number' || !Number.isInteger(file.size) || file.size <= 0) return null;
      const image = IMAGE_TYPES.has(file.type);
      const video = VIDEO_TYPES.has(file.type);
      if (!image && !video) return null;
      const limit = image ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > limit) return null;
      totalBytes += file.size;
      return { type: file.type, size: file.size };
    });
    if (validated.some((file) => !file) || totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json({ error: 'Fayl formatını və ölçüsünü yoxlayın (cəmi maksimum 50 MB).' }, { status: 413 });
    }

    const storage = getSupabaseAdmin().storage.from('muraciet-media');
    const signedFiles = [];
    for (const file of validated as Array<{ type: string; size: number }>) {
      const ext = file.type === 'video/quicktime' ? 'mov' : file.type.split('/')[1];
      const path = `${randomUUID()}.${ext}`;
      const { data, error } = await storage.createSignedUploadUrl(path);
      if (error || !data?.token) throw error || new Error('Upload URL could not be created.');
      signedFiles.push({ path, token: data.token, type: file.type, size: file.size, proof: createMediaProof(path, file.type, file.size) });
    }
    return NextResponse.json({ files: signedFiles }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[CityAI upload URL]', error instanceof Error ? error.message : 'Unknown storage error');
    return NextResponse.json({ error: 'Fayl yükləmək üçün hazırlaşmaq alınmadı.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const limited = await applyRateLimit(request, 'media-upload-cleanup', 12, 60_000);
  if (limited) return limited;
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Sorğunun mənbəyi qəbul edilmir.' }, { status: 403 });
  if (hasOversizedBody(request, 8 * 1024)) return NextResponse.json({ error: 'Sorğu çox böyükdür.' }, { status: 413 });
  try {
    const body = await request.json();
    if (!Array.isArray(body?.files) || body.files.length > MAX_FILES) return NextResponse.json({ error: 'Faylları yoxlayın.' }, { status: 400 });
    const db = getSupabaseAdmin();
    const removable: string[] = [];
    for (const item of body.files as Array<Record<string, unknown>>) {
      if (typeof item.path !== 'string' || typeof item.type !== 'string' || typeof item.size !== 'number' || !verifyMediaProof(item.path, item.type, item.size, item.proof)) continue;
      const { count, error } = await db.from('media_fayllar').select('id', { count: 'exact', head: true }).eq('storage_path', item.path);
      if (error) throw error;
      if (!count) removable.push(item.path);
    }
    if (removable.length) {
      const { error } = await db.storage.from('muraciet-media').remove(removable);
      if (error) throw error;
    }
    return NextResponse.json({ removed: removable.length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[CityAI upload cleanup]', error instanceof Error ? error.message : 'Unknown storage error');
    return NextResponse.json({ error: 'Müvəqqəti media faylları təmizlənmədi.' }, { status: 500 });
  }
}
