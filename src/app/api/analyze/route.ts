import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fayl tapılmadı' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Sən Azərbaycan şəhər infrastruktur problemlərini analiz edən AI sistemisin.
Bu şəkli analiz et və aşağıdakı JSON formatında cavab ver (yalnız JSON, heç bir izah yox):

{
  "problem_type": "Problem növü (məs: Yol çuxuru, Işıq problemi, Zibil, Su sızıntısı, Yaşıllıq, Digər)",
  "severity": "Şiddət dərəcəsi: low | medium | high | critical",
  "description": "Problemin Azərbaycan dilində qısa təsviri (1-2 cümlə)",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.0-1.0,
  "is_infrastructure": true/false
}

Şəkildə infrastruktur problemi yoxdursa, is_infrastructure: false qoy.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI cavabı parse edilə bilmədi' }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, analysis: result })

  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Analiz zamanı xəta baş verdi' }, { status: 500 })
  }
}
