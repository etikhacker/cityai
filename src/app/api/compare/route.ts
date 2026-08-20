import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CityAnalysisError, compareCityImages } from '@/lib/city-analysis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const beforeFile = formData.get('before')
    const afterFile = formData.get('after')
    const muracietId = formData.get('muraciet_id')

    if (!(beforeFile instanceof File) || !(afterFile instanceof File)) {
      return NextResponse.json({ error: 'Müqayisə üçün hər iki şəkil tələb olunur.', code: 'FILES_REQUIRED' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.has(beforeFile.type) || !ALLOWED_IMAGE_TYPES.has(afterFile.type)) {
      return NextResponse.json({ error: 'Yalnız dəstəklənən şəkil formatlarını müqayisə etmək olar.', code: 'UNSUPPORTED_FILE' }, { status: 415 })
    }

    if (beforeFile.size > MAX_IMAGE_SIZE_BYTES || afterFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Hər şəkil 10 MB-dan kiçik olmalıdır.', code: 'FILE_TOO_LARGE' }, { status: 413 })
    }

    const [beforeBase64, afterBase64] = await Promise.all([
      beforeFile.arrayBuffer().then((data) => Buffer.from(data).toString('base64')),
      afterFile.arrayBuffer().then((data) => Buffer.from(data).toString('base64')),
    ])

    const result = await compareCityImages({
      apiKey: process.env.GEMINI_API_KEY,
      beforeBase64,
      beforeMimeType: beforeFile.type,
      afterBase64,
      afterMimeType: afterFile.type,
    })

    if (typeof muracietId === 'string' && muracietId) {
      const ext = afterFile.name.split('.').pop() || 'jpg'
      const path = `after-${Date.now()}.${ext}`
      await supabase.storage.from('muraciet-media').upload(path, await afterFile.arrayBuffer())
      await supabase.from('media_fayllar').insert({ muraciet_id: muracietId, storage_path: path, file_type: 'image', is_before: false })
      const newStatus = result.is_resolved ? 'resolved' : 'in_progress'
      await supabase.from('muracietler').update({ status: newStatus }).eq('id', muracietId)
      await supabase.from('status_tarix').insert({ muraciet_id: muracietId, new_status: newStatus, note: result.summary })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    if (error instanceof CityAnalysisError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[CityAI compare] Unexpected error', error)
    return NextResponse.json({ error: 'Müqayisə zamanı gözlənilməyən xəta baş verdi.', code: 'COMPARISON_ERROR' }, { status: 500 })
  }
}
