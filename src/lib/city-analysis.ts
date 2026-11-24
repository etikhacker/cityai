export type CityAnalysis = {
  problem_type: string
  category_id: 'yol' | 'isiq' | 'zibil' | 'su' | 'yasilliq' | 'diger'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  tags: string[]
  confidence: number
  is_infrastructure: boolean
  recommended_department: string
}

export type CityComparison = {
  is_resolved: boolean
  is_same_location: boolean
  confidence: number
  resolution_score: number
  summary: string
  warning: string | null
}

type GeminiResponse = {
  output_text?: string
  error?: { message?: string; code?: number; status?: string }
}

export class CityAnalysisError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: 'CONFIGURATION_ERROR' | 'PROVIDER_ERROR' | 'INVALID_RESPONSE',
  ) {
    super(message)
    this.name = 'CityAnalysisError'
  }
}

const allowedSeverities = new Set<CityAnalysis['severity']>(['low', 'medium', 'high', 'critical'])
const allowedCategories = new Set<CityAnalysis['category_id']>(['yol', 'isiq', 'zibil', 'su', 'yasilliq', 'diger'])

// Model seçimi və endpoint tək yerdə saxlanılır.
const DEFAULT_MODEL = 'gemini-3.8-flash'
const DEFAULT_FALLBACK_MODEL = 'gemini-3.7-flash'
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions'

const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash'
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions'

export type Provider = 'gemini' | 'deepseek'

/** AI_PROVIDER açıq verilirsə o qalır; əks halda DeepSeek açarı varsa DeepSeek seçilir. */
export function activeProvider(): Provider {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase()
  if (forced === 'gemini' || forced === 'deepseek') return forced
  return process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'gemini'
}

const IMAGE_PROMPT = `Sən Azərbaycan şəhər infrastruktur problemlərini analiz edən peşəkar sistemsən.
Şəkli diqqətlə yoxla. Yol, küçə işıqlandırması, zibil, su/kanalizasiya, yaşıllıq və ya digər şəhər infrastrukturu ilə bağlı problemi müəyyən et.
Yalnız şemaya uyğun Azərbaycan dilində JSON qaytar. Şəkildə infrastruktur problemi yoxdursa, is_infrastructure false yaz və bunu təsvir et.`

const VIDEO_PROMPT = `Sən Azərbaycan şəhər infrastrukturu üzrə video analiz edən sistemsən. Videonun bütün zaman ardıcıllığını və görünən məzmununu təhlil et; yalnız bir kadrdan nəticə çıxarma. Yol, küçə işıqlandırması, tullantı, su/kanalizasiya, yaşıllıq və digər şəhər infrastrukturu problemlərini müəyyən et. Yalnız verilmiş JSON sxeminə uyğun cavab ver. Problem görünmürsə is_infrastructure false yaz, əmin olmadığın məlumatı uydurma.`

const COMPARISON_PROMPT = 'Birinci şəkil ilkin şəhər problemidir, ikinci şəkil isə həllindən sonrakı vəziyyətdir. Eyni məkan olub-olmadığını və problemin görünən əlamətlərinin aradan qalxıb-qalxmadığını qiymətləndir. Yalnız verilən sxemə uyğun Azərbaycan dilində JSON qaytar.'

const ANALYSIS_HINT = 'Cavabı yalnız JSON obyekti kimi ver: {"problem_type":"string (maks 120 simvol)","category_id":"yol|isiq|zibil|su|yasilliq|diger","severity":"low|medium|high|critical","description":"Azərbaycan dilində 1-2 cümlə","tags":["string"],"confidence":0.0,"is_infrastructure":true,"recommended_department":"string"}'

const COMPARISON_HINT = 'Cavabı yalnız JSON obyekti kimi ver: {"is_resolved":true,"is_same_location":true,"confidence":0.0,"resolution_score":0,"summary":"string","warning":null}'

const analysisSchema = {
  type: 'object',
  properties: {
    problem_type: { type: 'string', description: 'Şəkildəki şəhər problemi növü.' },
    category_id: { type: 'string', enum: ['yol', 'isiq', 'zibil', 'su', 'yasilliq', 'diger'] },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    description: { type: 'string', description: 'Azərbaycan dilində 1-2 cümləlik faktiki təsvir.' },
    tags: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    is_infrastructure: { type: 'boolean' },
    recommended_department: { type: 'string', description: 'Azərbaycanda məsul ola biləcək qurumun adı.' },
  },
  required: ['problem_type', 'category_id', 'severity', 'description', 'tags', 'confidence', 'is_infrastructure', 'recommended_department'],
} as const

const comparisonSchema = {
  type: 'object',
  properties: {
    is_resolved: { type: 'boolean' },
    is_same_location: { type: 'boolean' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    resolution_score: { type: 'integer', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    warning: { type: ['string', 'null'] },
  },
  required: ['is_resolved', 'is_same_location', 'confidence', 'resolution_score', 'summary', 'warning'],
} as const

function parseObject(text: string, errorMessage: string): Record<string, unknown> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  try {
    const value: unknown = JSON.parse(cleaned)
    if (value && typeof value === 'object') return value as Record<string, unknown>
  } catch {
    // The public error below avoids returning raw provider text.
  }
  throw new CityAnalysisError(errorMessage, 502, 'INVALID_RESPONSE')
}

function parseAnalysis(text: string): CityAnalysis {
  const raw = parseObject(text, 'Gemini analizi etibarlı formatda deyil.')
  const severity = typeof raw.severity === 'string' ? raw.severity : ''
  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === 'string') : []
  const confidence = typeof raw.confidence === 'number' ? raw.confidence : NaN

  if (
    typeof raw.problem_type !== 'string' ||
    raw.problem_type.trim().length > 120 ||
    typeof raw.category_id !== 'string' ||
    !allowedCategories.has(raw.category_id as CityAnalysis['category_id']) ||
    !allowedSeverities.has(severity as CityAnalysis['severity']) ||
    typeof raw.description !== 'string' ||
    raw.description.trim().length > 1000 ||
    tags.some((tag) => tag.length > 48) ||
    !Number.isFinite(confidence) ||
    typeof raw.is_infrastructure !== 'boolean' ||
    typeof raw.recommended_department !== 'string' ||
    raw.recommended_department.trim().length > 160
  ) {
    throw new CityAnalysisError('Gemini analizi gözlənilən sahələri qaytarmadı.', 502, 'INVALID_RESPONSE')
  }

  return {
    problem_type: raw.problem_type.trim(),
    category_id: raw.category_id as CityAnalysis['category_id'],
    severity: severity as CityAnalysis['severity'],
    description: raw.description.trim(),
    tags: tags.slice(0, 6),
    confidence: Math.max(0, Math.min(1, confidence)),
    is_infrastructure: raw.is_infrastructure,
    recommended_department: raw.recommended_department.trim(),
  }
}

function parseComparison(text: string): CityComparison {
  const raw = parseObject(text, 'Gemini müqayisə nəticəsi etibarlı formatda deyil.')
  const confidence = typeof raw.confidence === 'number' ? raw.confidence : NaN
  const score = typeof raw.resolution_score === 'number' ? raw.resolution_score : NaN

  if (
    typeof raw.is_resolved !== 'boolean' ||
    typeof raw.is_same_location !== 'boolean' ||
    !Number.isFinite(confidence) ||
    !Number.isFinite(score) ||
    typeof raw.summary !== 'string' ||
    raw.summary.trim().length > 1000 ||
    (typeof raw.warning !== 'string' && raw.warning !== null)
  ) {
    throw new CityAnalysisError('Gemini müqayisəsi gözlənilən sahələri qaytarmadı.', 502, 'INVALID_RESPONSE')
  }

  return {
    is_resolved: raw.is_resolved,
    is_same_location: raw.is_same_location,
    confidence: Math.max(0, Math.min(1, confidence)),
    resolution_score: Math.max(0, Math.min(100, Math.round(score))),
    summary: raw.summary.trim(),
    warning: typeof raw.warning === 'string' ? raw.warning.slice(0, 500) : null,
  }
}

export function createCityAnalysisRequest(imageBase64: string, mimeType: string) {
  return {
    store: false,
    input: [
      {
        type: 'text',
        text: IMAGE_PROMPT,
      },
      { type: 'image', data: imageBase64, mime_type: mimeType },
    ],
    response_format: { type: 'text', mime_type: 'application/json', schema: analysisSchema },
  }
}

export function createCityVideoAnalysisRequest(videoBase64: string, mimeType: string) {
  return {
    store: false,
    input: [
      {
        type: 'text',
        text: VIDEO_PROMPT,
      },
      { type: 'video', data: videoBase64, mime_type: mimeType },
    ],
    response_format: { type: 'text', mime_type: 'application/json', schema: analysisSchema },
  }
}

export function createCityComparisonRequest(
  beforeBase64: string,
  beforeMimeType: string,
  afterBase64: string,
  afterMimeType: string,
) {
  return {
    store: false,
    input: [
      {
        type: 'text',
        text: COMPARISON_PROMPT,
      },
      { type: 'image', data: beforeBase64, mime_type: beforeMimeType },
      { type: 'image', data: afterBase64, mime_type: afterMimeType },
    ],
    response_format: { type: 'text', mime_type: 'application/json', schema: comparisonSchema },
  }
}

async function requestGemini({
  apiKey,
  body,
  fetcher,
  timeoutMs = 15_000,
  allowFallback = true,
}: {
  apiKey?: string
  body: object
  fetcher: typeof fetch
  timeoutMs?: number
  allowFallback?: boolean
}): Promise<string> {
  if (!apiKey) {
    throw new CityAnalysisError('Gemini API açarı konfiqurasiya edilməyib.', 503, 'CONFIGURATION_ERROR')
  }

  const primaryModel = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL
  const models = allowFallback && fallbackModel !== primaryModel
    ? [primaryModel, fallbackModel]
    : [primaryModel]
  let lastProviderStatus = 502

  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    const model = models[modelIndex]
    // Retry the primary model once for transient provider/network failures, then fail over.
    const attempts = modelIndex === 0 ? 2 : 1
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const requestBody = { ...body, model }
        const response = await fetcher(GEMINI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(timeoutMs),
        })
        const payload = (await response.json().catch(() => ({}))) as GeminiResponse

        if (response.ok && payload.output_text) {
          if (model !== primaryModel) {
            console.warn('[CityAI Gemini] Fallback model succeeded', { model })
          }
          return payload.output_text
        }

        if (response.ok) {
          throw new CityAnalysisError('Gemini analizi boş cavab qaytardı.', 502, 'INVALID_RESPONSE')
        }

        lastProviderStatus = response.status
        const transient = [408, 429, 500, 502, 503, 504].includes(response.status)
        console.error('[CityAI Gemini] Provider request failed', {
          model,
          status: response.status,
          providerCode: payload.error?.code ?? null,
          providerStatus: payload.error?.status ?? null,
          message: payload.error?.message?.slice(0, 240) ?? null,
          requestId: response.headers.get('x-goog-request-id') ?? response.headers.get('x-request-id') ?? null,
        })

        if (!transient) {
          throw new CityAnalysisError('Gemini sorğunu qəbul etmədi. API konfiqurasiyasını yoxlamaq lazımdır.', 502, 'PROVIDER_ERROR')
        }
      } catch (error) {
        if (error instanceof CityAnalysisError) throw error
        console.error('[CityAI Gemini] Network request failed', {
          model,
          error: error instanceof Error ? error.name : 'UnknownError',
        })
        lastProviderStatus = 504
      }

      if (attempt + 1 < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)))
      }
    }
  }

  console.error('[CityAI Gemini] All model attempts failed', { models, lastProviderStatus })
  throw new CityAnalysisError(
    'AI analizi hazırda əlçatan deyil. Fayl müraciətə əlavə olunub; təsviri əl ilə daxil edə və ya bir az sonra yenidən cəhd edə bilərsiniz.',
    503,
    'PROVIDER_ERROR',
  )
}

type DeepSeekImage = { base64: string; mimeType: string }

function deepSeekMessages(prompt: string, hint: string, images: DeepSeekImage[], instruction: string) {
  return [
    { role: 'system', content: prompt + '\n' + hint },
    {
      role: 'user',
      content: [
        { type: 'text', text: instruction },
        ...images.map((image) => ({
          type: 'image_url',
          image_url: { url: 'data:' + image.mimeType + ';base64,' + image.base64 },
        })),
      ],
    },
  ]
}

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

async function requestDeepSeek({
  apiKey,
  messages,
  fetcher,
  timeoutMs = 30_000,
}: {
  apiKey?: string
  messages: unknown[]
  fetcher: typeof fetch
  timeoutMs?: number
}): Promise<string> {
  if (!apiKey) {
    throw new CityAnalysisError('DeepSeek API açarı konfiqurasiya edilməyib.', 503, 'CONFIGURATION_ERROR')
  }

  const model = process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL
  const attempts = 2

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetcher(DEEPSEEK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({ model, messages, response_format: { type: 'json_object' }, stream: false }),
        signal: AbortSignal.timeout(timeoutMs),
      })
      const payload = (await response.json().catch(() => ({}))) as DeepSeekResponse
      const content = payload.choices?.[0]?.message?.content

      if (response.ok && typeof content === 'string' && content.trim()) return content
      if (response.ok) {
        throw new CityAnalysisError('DeepSeek boş cavab qaytardı.', 502, 'INVALID_RESPONSE')
      }

      console.error('[CityAI DeepSeek] Provider request failed', {
        model,
        status: response.status,
        message: payload.error?.message?.slice(0, 240) ?? null,
      })

      if (![408, 429, 500, 502, 503, 504].includes(response.status)) {
        throw new CityAnalysisError('DeepSeek sorğunu qəbul etmədi. API konfiqurasiyasını yoxlamaq lazımdır.', 502, 'PROVIDER_ERROR')
      }
    } catch (error) {
      if (error instanceof CityAnalysisError) throw error
      console.error('[CityAI DeepSeek] Network request failed', {
        model,
        error: error instanceof Error ? error.name : 'UnknownError',
      })
    }

    if (attempt + 1 < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)))
    }
  }

  throw new CityAnalysisError(
    'AI analizi hazırda əlçatan deyil. Fayl müraciətə əlavə olunub; təsviri əl ilə daxil edə və ya bir az sonra yenidən cəhd edə bilərsiniz.',
    503,
    'PROVIDER_ERROR',
  )
}

export async function analyzeCityImage({
  apiKey,
  deepseekApiKey,
  imageBase64,
  mimeType,
  fetcher = fetch,
  provider = activeProvider(),
}: {
  apiKey?: string
  deepseekApiKey?: string
  imageBase64: string
  mimeType: string
  fetcher?: typeof fetch
  provider?: Provider
}): Promise<CityAnalysis> {
  const text = provider === 'deepseek'
    ? await requestDeepSeek({
        apiKey: deepseekApiKey,
        messages: deepSeekMessages(IMAGE_PROMPT, ANALYSIS_HINT, [{ base64: imageBase64, mimeType }], 'Şəkli analiz et və yalnız JSON qaytar.'),
        fetcher,
      })
    : await requestGemini({ apiKey, body: createCityAnalysisRequest(imageBase64, mimeType), fetcher })

  return parseAnalysis(text)
}

export async function analyzeCityVideo({
  apiKey,
  videoBase64,
  mimeType,
  fetcher = fetch,
  provider = activeProvider(),
}: {
  apiKey?: string
  videoBase64: string
  mimeType: string
  fetcher?: typeof fetch
  provider?: Provider
}): Promise<CityAnalysis> {
  // DeepSeek video qəbul etmir; video analizi müvəqqəti dayandırılıb.
  if (provider === 'deepseek') {
    throw new CityAnalysisError('Video analizi müvəqqəti dayandırılıb.', 503, 'PROVIDER_ERROR')
  }

  return parseAnalysis(await requestGemini({
    apiKey,
    body: createCityVideoAnalysisRequest(videoBase64, mimeType),
    fetcher,
    timeoutMs: 45_000,
    allowFallback: false,
  }))
}

export async function compareCityImages({
  apiKey,
  deepseekApiKey,
  beforeBase64,
  beforeMimeType,
  afterBase64,
  afterMimeType,
  fetcher = fetch,
  provider = activeProvider(),
}: {
  apiKey?: string
  deepseekApiKey?: string
  beforeBase64: string
  beforeMimeType: string
  afterBase64: string
  afterMimeType: string
  fetcher?: typeof fetch
  provider?: Provider
}): Promise<CityComparison> {
  const text = provider === 'deepseek'
    ? await requestDeepSeek({
        apiKey: deepseekApiKey,
        messages: deepSeekMessages(COMPARISON_PROMPT, COMPARISON_HINT, [
          { base64: beforeBase64, mimeType: beforeMimeType },
          { base64: afterBase64, mimeType: afterMimeType },
        ], 'Birinci şəkil əvvəlki, ikinci şəkil sonrakı vəziyyətdir. Yalnız JSON qaytar.'),
        fetcher,
      })
    : await requestGemini({
        apiKey,
        body: createCityComparisonRequest(beforeBase64, beforeMimeType, afterBase64, afterMimeType),
        fetcher,
      })

  return parseComparison(text)
}
