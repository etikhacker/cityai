const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export type TrackingEmailResult = { sent: boolean; reason?: string }

/**
 * İzləmə kodunu e-poçtla göndərir. RESEND_API_KEY yoxdursa heç nə etmir —
 * müraciətin göndərilməsi heç vaxt bu addımdan asılı olmamalıdır.
 */
export async function sendTrackingCodeEmail({
  to,
  code,
  category,
  fetcher = fetch,
}: {
  to?: string | null
  code: string
  category: string
  fetcher?: typeof fetch
}): Promise<TrackingEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CITYAI_EMAIL_FROM
  if (!to || !apiKey || !from) return { sent: false, reason: 'not-configured' }

  try {
    const response = await fetcher(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'CityAI müraciət kodunuz: ' + code,
        text: [
          'Müraciətiniz qeydə alındı.',
          '',
          'İzləmə kodu: ' + code,
          'Kateqoriya: ' + category,
          '',
          'Statusu yoxlamaq üçün: https://cityai-asan.vercel.app/izle?kod=' + code,
          '',
          'Bu kodu saxlayın — müraciətin gedişatını yalnız onunla izləmək olar.',
        ].join('\n'),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      console.error('[CityAI email] Provider rejected the message', { status: response.status })
      return { sent: false, reason: 'provider-error' }
    }
    return { sent: true }
  } catch (error) {
    console.error('[CityAI email] Send failed', error instanceof Error ? error.name : 'UnknownError')
    return { sent: false, reason: 'network' }
  }
}
