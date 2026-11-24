import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Klient tənbəl (lazy) yaradılır: build zamanı env dəyəri olmasa da
// statik səhifələr prerender oluna bilir, xəta yalnız real istifadədə görünür.
let cachedClient: SupabaseClient | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} konfiqurasiya edilməyib.`)
  return value
}

export function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient
  cachedClient = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  )
  return cachedClient
}

export type Muraciet = {
  id: string
  tracking_code: string
  category: string
  description: string | null
  priority: 'low' | 'medium' | 'high'
  location: string | null
  status: 'pending' | 'analyzing' | 'open' | 'in_progress' | 'resolved' | 'rejected'
  created_at: string
  updated_at: string
}

export type AiAnaliz = {
  id: string
  muraciet_id: string
  problem_type: string | null
  severity: string | null
  description: string | null
  tags: string[] | null
  confidence: number | null
  created_at: string
}
