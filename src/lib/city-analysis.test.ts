import { describe, expect, it, vi } from 'vitest'
import { analyzeCityImage, analyzeCityVideo, compareCityImages, createCityAnalysisRequest, createCityVideoAnalysisRequest, CityAnalysisError } from './city-analysis'

describe('CityAI Gemini image analysis', () => {
  it('keeps the API key out of the request body and sends it only as a server header', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        output_text: JSON.stringify({
          problem_type: 'Yol çuxuru',
          category_id: 'yol',
          severity: 'high',
          description: 'Yolda təmir tələb edən çuxur görünür.',
          tags: ['yol', 'təmir'],
          confidence: 0.93,
          is_infrastructure: true,
          recommended_department: 'Yol qurumu',
        }),
      }), { status: 200 }),
    )

    const result = await analyzeCityImage({
      apiKey: 'server-only-key',
      imageBase64: 'aW1hZ2U=',
      mimeType: 'image/jpeg',
      fetcher,
    })

    const [, init] = fetcher.mock.calls[0] as [string, RequestInit]
    expect(init.headers).toMatchObject({ 'x-goog-api-key': 'server-only-key' })
    expect(String(init.body)).not.toContain('server-only-key')
    expect(JSON.parse(String(init.body))).toMatchObject({ store: false })
    expect(result).toMatchObject({ problem_type: 'Yol çuxuru', severity: 'high' })
  })

  it('fails clearly when the server has no Gemini configuration', async () => {
    await expect(analyzeCityImage({ imageBase64: 'aW1hZ2U=', mimeType: 'image/jpeg' })).rejects.toMatchObject({
      code: 'CONFIGURATION_ERROR',
      status: 503,
    } satisfies Partial<CityAnalysisError>)
  })

  it('creates a JSON-constrained image analysis request', () => {
    const request = createCityAnalysisRequest('aW1hZ2U=', 'image/png')
    expect(request.response_format.mime_type).toBe('application/json')
    expect(request.input[1]).toMatchObject({ type: 'image', mime_type: 'image/png' })
  })

  it('sends an actual video input through Gemini and parses the full-video analysis', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output_text: JSON.stringify({
      problem_type: 'Yol örtüyündə çatlar', category_id: 'yol', severity: 'medium',
      description: 'Videoda yol səthində çatlar görünür.', tags: ['yol'], confidence: 0.87,
      is_infrastructure: true, recommended_department: 'Yol qurumu',
    }) }), { status: 200 }))

    const result = await analyzeCityVideo({ apiKey: 'server-only-key', videoBase64: 'c3ludGhldGljLXZpZGVv', mimeType: 'video/mp4', fetcher })
    const [, init] = fetcher.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(init.body))
    expect(body.input).toContainEqual(expect.objectContaining({ type: 'video', mime_type: 'video/mp4' }))
    expect(body.store).toBe(false)
    expect(String(init.body)).not.toContain('server-only-key')
    expect(result.category_id).toBe('yol')
  })

  it('makes the video prompt analyze the clip rather than one extracted frame', () => {
    const request = createCityVideoAnalysisRequest('c3ludGhldGljLXZpZGVv', 'video/webm')
    expect(request.input[1]).toMatchObject({ type: 'video', mime_type: 'video/webm' })
    expect(request.input[0].text).toContain('zaman ardıcıllığını')
  })

  it('uses the same server-only Gemini flow for before and after comparison', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        output_text: JSON.stringify({
          is_resolved: true,
          is_same_location: true,
          confidence: 0.88,
          resolution_score: 92,
          summary: 'Problem aradan qaldırılıb.',
          warning: null,
        }),
      }), { status: 200 }),
    )

    const result = await compareCityImages({
      apiKey: 'server-only-key',
      beforeBase64: 'YmVmb3Jl',
      beforeMimeType: 'image/jpeg',
      afterBase64: 'YWZ0ZXI=',
      afterMimeType: 'image/png',
      fetcher,
    })

    const [, init] = fetcher.mock.calls[0] as [string, RequestInit]
    expect(String(init.body)).not.toContain('server-only-key')
    expect(result).toMatchObject({ is_resolved: true, resolution_score: 92 })
  })
})
