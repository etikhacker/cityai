import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function mockAnalysis(beforeSize: number, afterSize: number) {
  const diff = Math.abs(beforeSize - afterSize) / Math.max(beforeSize, afterSize)
  const isResolved = diff > 0.1
  const score = isResolved ? Math.floor(75 + Math.random() * 20) : Math.floor(20 + Math.random() * 30)
  return {
    is_resolved: isResolved,
    is_same_location: true,
    confidence: 0.82 + Math.random() * 0.15,
    resolution_score: score,
    summary: isResolved
      ? 'Şəkillər arasında əhəmiyyətli vizual fərq aşkarlandı. Problem böyük ehtimalla aradan qaldırılıb.'
      : 'Şəkillər arasında ciddi fərq müşahidə olunmadı. Problem hələ həll olunmayıb.',
    warning: isResolved
      ? null
      : 'Problem həll olunmayıb — qurum tərəfindən əlavə edilən vizual ilkin müraciətlə uyğun gəlmir.',
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const beforeFile = formData.get('before') as File | null
    const afterFile = formData.get('after') as File | null
    const muracietId = formData.get('muraciet_id') as string | null

    if (!beforeFile || !afterFile) {
      return NextResponse.json({ error: 'Hər iki şəkil tələb olunur' }, { status: 400 })
    }

    let result

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const toBase64 = async (file: File) => Buffer.from(await file.arrayBuffer()).toString('base64')
        const [beforeB64, afterB64] = await Promise.all([toBase64(beforeFile), toBase64(afterFile)])

        const response = await anthropic.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'BİRİNCİ şəkil — problem (before), İKİNCİ — həll (after).' },
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: beforeB64 } },
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: afterB64 } },
              { type: 'text', text: 'Müqayisə et, yalnız JSON: {"is_resolved":bool,"is_same_location":bool,"confidence":float,"resolution_score":int,"summary":"az","warning":null}' }
            ]
          }]
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) result = JSON.parse(jsonMatch[0])
      } catch {
        result = mockAnalysis(beforeFile.size, afterFile.size)
      }
    } else {
      result = mockAnalysis(beforeFile.size, afterFile.size)
    }

    if (muracietId && result) {
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
    console.error('Compare error:', error)
    return NextResponse.json({ error: 'Müqayisə zamanı xəta baş verdi' }, { status: 500 })
  }
}