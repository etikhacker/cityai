'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Muraciet = {
  id: string
  tracking_code: string
  category: string
  description: string | null
  priority: string
  location: string | null
  status: string
  created_at: string
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  pending:     { label: 'Gözləyir',      color: '#6b7280', icon: '⏳', desc: 'Müraciətiniz qəbul edilib, emal gözləyir.' },
  analyzing:   { label: 'Analiz edilir', color: '#3b82f6', icon: '🔍', desc: 'AI sistemi müraciətinizi analiz edir.' },
  open:        { label: 'Baxılır',          color: '#f59e0b', icon: '📋', desc: 'Müraciətiniz aidiyyəti qurama göndərilib.' },
  in_progress: { label: 'İcrada',        color: '#8b5cf6', icon: '🔧', desc: 'Problem üzərində iş aparılır.' },
  resolved:    { label: 'Həll edilib',   color: '#00d4aa', icon: '✅', desc: 'Problemin həll edildiyi təsdiqlənib.' },
  rejected:    { label: 'Rədd edilib',   color: '#ef4444', icon: '❌', desc: 'Müraciət rədd edilib.' },
}

const CAT_LABELS: Record<string, string> = {
  yol: '🛣️ Yol', isiq: '💡 İşıq', zibil: '🗑️ Təmizlik',
  su: '💧 Su', yasilliq: '🌳 Yaşıllıq', diger: '📋 Digər'
}

const PRIORITY_LABELS: Record<string, string> = {
  low: '🟢 Aşağı', medium: '🟡 Orta', high: '🔴 Yüksək', critical: '🚨 Kritik'
}

export default function IzlePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [muraciet, setMuraciet] = useState<Muraciet | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!code.trim()) return
    setLoading(true)
    setNotFound(false)
    setMuraciet(null)
    setSearched(true)

    const { data } = await supabase
      .from('muracietler')
      .select('*')
      .eq('tracking_code', code.trim().toUpperCase())
      .single()

    if (data) setMuraciet(data)
    else setNotFound(true)
    setLoading(false)
  }

  const status = muraciet ? STATUS_INFO[muraciet.status] : null

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#00d4aa 1px,transparent 1px),linear-gradient(90deg,#00d4aa 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-10">

        {/* Header */}
        <header className="flex items-center gap-4 mb-10">
          <button onClick={() => router.push('/')} className="w-10 h-10 rounded-lg bg-[#111827] border border-white/07 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold">Müraciəti izlə</h1>
            <p className="text-sm text-gray-500">İzləmə kodunuzu daxil edin</p>
          </div>
        </header>

        {/* Search */}
        <div className="bg-[#111827] border border-white/07 rounded-2xl p-6 mb-5">
          <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase block mb-3">
            İzləmə kodu
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="MZB-XXXXXX"
              className="flex-1 bg-[#1a2235] border border-white/07 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00d4aa]/40 transition-colors font-mono tracking-wider"
            />
            <button
              onClick={search}
              disabled={loading || !code.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-[#0a0f1e] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
            >
              {loading ? '...' : 'Axtar'}
            </button>
          </div>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="bg-[#111827] border border-red-500/20 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <h2 className="font-bold text-lg mb-2">Müraciət tapılmadı</h2>
            <p className="text-gray-500 text-sm mb-5">
              Bu izləmə koduna uyğun müraciət yoxdur. Kodu düzgün yazdığınızdan əmin olun.
            </p>
            <button
              onClick={() => router.push('/muraciet')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-[#0a0f1e] font-bold text-sm hover:-translate-y-0.5 transition-all"
            >
              Yeni müraciət et →
            </button>
          </div>
        )}

        {/* Result */}
        {muraciet && status && (
          <div className="space-y-4">
            {/* Status card */}
            <div className="bg-[#111827] border rounded-2xl p-6" style={{ borderColor: status.color + '40' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{ background: status.color + '20', border: `1px solid ${status.color}40` }}>
                  {status.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="font-bold text-lg" style={{ color: status.color }}>{status.label}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{status.desc}</p>
            </div>

            {/* Details */}
            <div className="bg-[#111827] border border-white/07 rounded-2xl p-6">
              <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">Müraciət məlumatları</p>
              <div className="space-y-3">
                {[
                  { label: 'İzləmə kodu', value: muraciet.tracking_code, mono: true },
                  { label: 'Kateqoriya', value: CAT_LABELS[muraciet.category] || muraciet.category },
                  { label: 'Prioritet', value: PRIORITY_LABELS[muraciet.priority] },
                  { label: 'Yer', value: muraciet.location || '—' },
                  { label: 'Tarix', value: new Date(muraciet.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-start gap-4 py-2 border-b border-white/05 last:border-0">
                    <span className="text-xs text-gray-500 flex-shrink-0">{r.label}</span>
                    <span className={`text-sm text-right ${r.mono ? 'font-mono text-[#00d4aa]' : 'text-white'}`}>{r.value}</span>
                  </div>
                ))}
                {muraciet.description && (
                  <div className="py-2">
                    <p className="text-xs text-gray-500 mb-1">Təsvir</p>
                    <p className="text-sm text-white leading-relaxed">{muraciet.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Initial state - not searched yet */}
        {!searched && !muraciet && (
          <div className="text-center py-10">
            <p className="text-5xl mb-4">📬</p>
            <p className="text-gray-500 text-sm">Müraciətinizin statusunu öyrənmək üçün<br />izləmə kodunuzu daxil edin</p>
            <div className="mt-6 pt-6 border-t border-white/07">
              <p className="text-gray-600 text-xs mb-3">Müraciət etməmisinizsə</p>
              <button
                onClick={() => router.push('/muraciet')}
                className="px-6 py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                Müraciət et →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}