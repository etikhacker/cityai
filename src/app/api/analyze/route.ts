import { NextRequest, NextResponse } from 'next/server'
import { analyzeCityImage, CityAnalysisError } from '@/lib/city-analysis'

export const runtime = 'nodejs'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Analiz üçün şəkil əlavə edin.', code: 'FILE_REQUIRED' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Yalnız JPEG, PNG, WEBP, HEIC və ya HEIF şəkilləri analiz edilə bilər.', code: 'UNSUPPORTED_FILE' }, { status: 415 })
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Şəklin ölçüsü 10 MB-dan kiçik olmalıdır.', code: 'FILE_TOO_LARGE' }, { status: 413 })
    }

    const imageBase64 = Buffer.from(await file.arrayBuffer()).toString('base64')
    const analysis = await analyzeCityImage({
      apiKey: process.env.GEMINI_API_KEY,
      imageBase64,
      mimeType: file.type,
    })

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    if (error instanceof CityAnalysisError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[CityAI analyze] Unexpected error', error)
    return NextResponse.json({ error: 'Analiz zamanı gözlənilməyən xəta baş verdi.', code: 'ANALYSIS_ERROR' }, { status: 500 })
  }
}
