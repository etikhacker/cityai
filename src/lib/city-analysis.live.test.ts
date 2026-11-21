import { describe, expect, it } from 'vitest'
import { analyzeCityImage } from './city-analysis'

const liveEnabled = process.env.CITYAI_RUN_GEMINI_LIVE === '1' && Boolean(process.env.GEMINI_API_KEY)

describe.skipIf(!liveEnabled)('Gemini live smoke test (explicit opt-in)', () => {
  it('analyzes a tiny synthetic image and returns the expected schema', async () => {
    // 1x1 transparent PNG; contains no user or production data.
    const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='
    const result = await analyzeCityImage({
      apiKey: process.env.GEMINI_API_KEY,
      imageBase64,
      mimeType: 'image/png',
    })

    expect(result.problem_type.length).toBeGreaterThan(0)
    expect(['low', 'medium', 'high', 'critical']).toContain(result.severity)
    expect(result.description.length).toBeGreaterThan(0)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(typeof result.is_infrastructure).toBe('boolean')
  }, 30_000)
})
