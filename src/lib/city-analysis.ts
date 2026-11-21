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
  error?: { message?: string }
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
  try {
    const value: unknown = JSON.parse(text)
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
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    store: false,
    input: [
      {
        type: 'text',
        text: `Sən Azərbaycan şəhər infrastruktur problemlərini analiz edən peşəkar sistemsən.
Şəkli diqqətlə yoxla. Yol, küçə işıqlandırması, zibil, su/kanalizasiya, yaşıllıq və ya digər şəhər infrastrukturu ilə bağlı problemi müəyyən et.
Yalnız verilən şemaya uyğun Azərbaycan dilində JSON qaytar. Şəkildə infrastruktur problemi yoxdursa, is_infrastructure false yaz və bunu təsvir et.`,
      },
      { type: 'image', data: imageBase64, mime_type: mimeType },
    ],
    response_format: { type: 'text', mime_type: 'application/json', schema: analysisSchema },
  }
}

export function createCityVideoAnalysisRequest(videoBase64: string, mimeType: string) {
  return {
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    store: false,
    input: [
      {
        type: 'text',
        text: `Sən Azərbaycan şəhər infrastrukturu üzrə video analiz edən sistemsən. Videonun bütün zaman ardıcıllığını və görünən məzmununu təhlil et; yalnız bir kadrdan nəticə çıxarma. Yol, küçə işıqlandırması, tullantı, su/kanalizasiya, yaşıllıq və digər şəhər infrastrukturu problemlərini müəyyən et. Yalnız verilmiş JSON sxeminə uyğun cavab ver. Problem görünmürsə is_infrastructure false yaz, əmin olmadığın məlumatı uydurma.`,
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
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    store: false,
    input: [
      {
        type: 'text',
        text: 'Birinci şəkil ilkin şəhər problemidir, ikinci şəkil isə həllindən sonrakı vəziyyətdir. Eyni məkan olub-olmadığını və problemin görünən əlamətlərinin aradan qalxıb-qalxmadığını qiymətləndir. Yalnız verilən sxemə uyğun Azərbaycan dilində JSON qaytar.',
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
  timeoutMs = 20_000,
}: {
  apiKey?: string
  body: object
  fetcher: typeof fetch
  timeoutMs?: number
}): Promise<string> {
  if (!apiKey) {
    throw new CityAnalysisError('Gemini API açarı konfiqurasiya edilməyib.', 503, 'CONFIGURATION_ERROR')
  }

  const response = await fetcher('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const payload = (await response.json().catch(() => ({}))) as GeminiResponse

  if (!response.ok) {
    console.error('[CityAI Gemini] Provider request failed', { status: response.status })
    throw new CityAnalysisError('Şəkil analizi xidməti hazırda cavab vermir. Bir az sonra yenidən yoxlayın.', 502, 'PROVIDER_ERROR')
  }
  if (!payload.output_text) {
    throw new CityAnalysisError('Gemini analizi boş cavab qaytardı.', 502, 'INVALID_RESPONSE')
  }

  return payload.output_text
}

export async function analyzeCityImage({ apiKey, imageBase64, mimeType, fetcher = fetch }: {
  apiKey?: string
  imageBase64: string
  mimeType: string
  fetcher?: typeof fetch
}): Promise<CityAnalysis> {
  return parseAnalysis(await requestGemini({ apiKey, body: createCityAnalysisRequest(imageBase64, mimeType), fetcher }))
}

export async function analyzeCityVideo({ apiKey, videoBase64, mimeType, fetcher = fetch }: {
  apiKey?: string
  videoBase64: string
  mimeType: string
  fetcher?: typeof fetch
}): Promise<CityAnalysis> {
  return parseAnalysis(await requestGemini({
    apiKey,
    body: createCityVideoAnalysisRequest(videoBase64, mimeType),
    fetcher,
    timeoutMs: 50_000,
  }))
}

export async function compareCityImages({
  apiKey,
  beforeBase64,
  beforeMimeType,
  afterBase64,
  afterMimeType,
  fetcher = fetch,
}: {
  apiKey?: string
  beforeBase64: string
  beforeMimeType: string
  afterBase64: string
  afterMimeType: string
  fetcher?: typeof fetch
}): Promise<CityComparison> {
  return parseComparison(await requestGemini({
    apiKey,
    body: createCityComparisonRequest(beforeBase64, beforeMimeType, afterBase64, afterMimeType),
    fetcher,
  }))
}
