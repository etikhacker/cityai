import { NextRequest, NextResponse } from 'next/server'
import { analyzeCityImage, analyzeCityVideo, CityAnalysisError } from '@/lib/city-analysis'
import { applyRateLimit, hasOversizedBody } from '@/lib/server/rate-limit'
import { sameOrigin } from '@/lib/server/admin-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
// Keep the request below Vercel Hobby's serverless request-body ceiling after multipart/base64 overhead.
const MAX_ANALYSIS_FILE_SIZE_BYTES = 3 * 1024 * 1024
const MAX_ANALYSIS_BODY_BYTES = MAX_ANALYSIS_FILE_SIZE_BYTES + 64 * 1024

function hasExpectedVideoSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === 'video/webm') return bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  if (bytes.length < 12 || bytes.toString('ascii', 4, 8) !== 'ftyp') return false
  const brand = bytes.toString('ascii', 8, 12)
  return mimeType === 'video/quicktime' ? brand === 'qt  ' : brand !== 'qt  '
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'analyze', 8, 60_000)
  if (limited) return limited
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Sorğunun mənbəyi qəbul edilmir.' }, { status: 403 })
  if (hasOversizedBody(req, MAX_ANALYSIS_BODY_BYTES)) return NextResponse.json({ error: 'Analiz faylı 3 MB-dan kiçik olmalıdır.' }, { status: 413 })
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Analiz üçün şəkil və ya video əlavə edin.', code: 'FILE_REQUIRED' }, { status: 400 })
    }

    const isImage = ALLOWED_IMAGE_TYPES.has(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.has(file.type)
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'JPEG, PNG, WEBP, HEIC, HEIF, MP4, WEBM və MOV faylları dəstəklənir.', code: 'UNSUPPORTED_FILE' }, { status: 415 })
    }

    if (file.size <= 0 || file.size > MAX_ANALYSIS_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'AI analizi üçün fayl 3 MB-dan kiçik olmalıdır. Daha böyük faylı müraciətə əlavə edib təsviri əl ilə yaza bilərsiniz.', code: 'FILE_TOO_LARGE' }, { status: 413 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (isVideo && !hasExpectedVideoSignature(bytes, file.type)) {
      return NextResponse.json({ error: 'Video faylının məzmunu seçilmiş formatla uyğun gəlmir.', code: 'INVALID_FILE_CONTENT' }, { status: 415 })
    }
    const encoded = bytes.toString('base64')
    const analysis = isVideo
      ? await analyzeCityVideo({ apiKey: process.env.GEMINI_API_KEY, videoBase64: encoded, mimeType: file.type })
      : await analyzeCityImage({ apiKey: process.env.GEMINI_API_KEY, imageBase64: encoded, mimeType: file.type })

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    if (error instanceof CityAnalysisError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[CityAI analyze] Unexpected error', error instanceof Error ? error.message : 'Unknown analysis error')
    return NextResponse.json({ error: 'Analiz zamanı gözlənilməyən xəta baş verdi.', code: 'ANALYSIS_ERROR' }, { status: 500 })
  }
}
