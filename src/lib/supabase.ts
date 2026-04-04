import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
