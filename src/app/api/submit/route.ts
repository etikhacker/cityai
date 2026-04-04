import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateTrackingCode(): string {
  const prefix = 'MZB'
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${random}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, description, priority, location, analysis, mediaUrls } = body

    if (!category) {
      return NextResponse.json({ error: 'Kateqoriya seçilməyib' }, { status: 400 })
    }

    const trackingCode = generateTrackingCode()

    // 1. Insert müraciət
    const { data: muraciet, error: muracietError } = await supabase
      .from('muracietler')
      .insert({
        tracking_code: trackingCode,
        category,
        description: description || null,
        priority: priority || 'medium',
        location: location || null,
        status: 'open',
      })
      .select()
      .single()

    if (muracietError) throw muracietError

    // 2. Insert AI analizi (əgər varsa)
    if (analysis && muraciet) {
      await supabase.from('ai_analizler').insert({
        muraciet_id: muraciet.id,
        problem_type: analysis.problem_type || null,
        severity: analysis.severity || null,
        description: analysis.description || null,
        tags: analysis.tags || [],
        confidence: analysis.confidence || null,
      })
    }

    // 3. Insert media fayllar (əgər varsa)
    if (mediaUrls && mediaUrls.length > 0 && muraciet) {
      const mediaRows = mediaUrls.map((path: string) => ({
        muraciet_id: muraciet.id,
        storage_path: path,
        file_type: 'image',
        is_before: true,
      }))
      await supabase.from('media_fayllar').insert(mediaRows)
    }

    // 4. Status tarixə qeyd et
    await supabase.from('status_tarix').insert({
      muraciet_id: muraciet.id,
      old_status: null,
      new_status: 'open',
      note: 'Müraciət qəbul edildi',
    })

    return NextResponse.json({
      success: true,
      tracking_code: trackingCode,
      muraciet_id: muraciet.id,
    })

  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: 'Müraciət göndərilə bilmədi' }, { status: 500 })
  }
}
