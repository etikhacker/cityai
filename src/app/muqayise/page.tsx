'use client'

import { useState } from 'react'

type CompareResult = {
  is_resolved: boolean
  is_same_location: boolean
  confidence: number
  resolution_score: number
  summary: string
  warning: string | null
}

export default function MüqayisəPage() {
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforePreview, setBeforePreview] = useState('')
  const [afterPreview, setAfterPreview] = useState('')
  const [muracietId, setMuracietId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompareResult | null>(null)

  const handleFile = (file: File, type: 'before' | 'after') => {
    const reader = new FileReader()
    reader.onload = e => {
      if (type === 'before') { setBeforeFile(file); setBeforePreview(e.target?.result as string) }
      else { setAfterFile(file); setAfterPreview(e.target?.result as string) }
    }
    reader.readAsDataURL(file)
  }

  const compare = async () => {
    if (!beforeFile || !afterFile) return alert('Hər iki şəkli seçin')
    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('before', beforeFile)
      fd.append('after', afterFile)
      if (muracietId) fd.append('muraciet_id', muracietId)

      const res = await fetch('/api/compare', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) setResult(data.result)
      else alert(data.error)
    } catch {
      alert('Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#00d4aa 1px,transparent 1px),linear-gradient(90deg,#00d4aa 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 pb-20">

        {/* Header */}
        <header className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d4aa] to-[#4f8cff] flex items-center justify-center font-bold text-[#0a0f1e] text-lg">
            AI
          </div>
          <div>
            <h1 className="text-xl font-bold">ASAN AI Hub</h1>
            <p className="text-sm text-gray-500">Before / After vizual müqayisə</p>
          </div>
        </header>

        {/* Müraciət ID */}
        <div className="bg-[#111827] border border-white/07 rounded-2xl p-6 mb-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Müraciət ID (isteğe bağlı)</p>
          <input
            type="text"
            value={muracietId}
            onChange={e => setMuracietId(e.target.value)}
            placeholder="Supabase müraciət UUID-i..."
            className="w-full bg-[#1a2235] border border-white/07 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00d4aa]/40 transition-colors"
          />
        </div>

        {/* Image upload grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Before */}
          <div className="bg-[#111827] border border-white/07 rounded-2xl p-5">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Əvvəl (before)</p>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'before')} />
              {beforePreview ? (
                <img src={beforePreview} alt="before" className="w-full aspect-square object-cover rounded-xl" />
              ) : (
                <div className="w-full aspect-square rounded-xl border-2 border-dashed border-red-500/30 bg-red-500/03 flex flex-col items-center justify-center gap-2 hover:border-red-500/50 transition-colors">
                  <span className="text-2xl">📸</span>
                  <span className="text-xs text-gray-500">Problem şəkli</span>
                </div>
              )}
            </label>
          </div>

          {/* After */}
          <div className="bg-[#111827] border border-white/07 rounded-2xl p-5">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Sonra (after)</p>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'after')} />
              {afterPreview ? (
                <img src={afterPreview} alt="after" className="w-full aspect-square object-cover rounded-xl" />
              ) : (
                <div className="w-full aspect-square rounded-xl border-2 border-dashed border-[#00d4aa]/30 bg-[#00d4aa]/03 flex flex-col items-center justify-center gap-2 hover:border-[#00d4aa]/50 transition-colors">
                  <span className="text-2xl">✅</span>
                  <span className="text-xs text-gray-500">Həll şəkli</span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Compare button */}
        <button
          onClick={compare}
          disabled={loading || !beforeFile || !afterFile}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-[#0a0f1e] font-bold text-base mb-6 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#00d4aa]/20 hover:-translate-y-0.5 transition-all"
        >
          {loading ? '⏳ AI analiz edir...' : '🔍 Müqayisə et'}
        </button>

        {/* Result */}
        {result && (
          <div className={`bg-[#111827] border rounded-2xl p-6 ${result.is_resolved ? 'border-[#00d4aa]/30' : 'border-red-500/30'}`}>

            {/* Status banner */}
            <div className={`rounded-xl p-4 mb-5 flex items-center gap-3 ${result.is_resolved ? 'bg-[#00d4aa]/10' : 'bg-red-500/10'}`}>
              <span className="text-3xl">{result.is_resolved ? '✅' : '⚠️'}</span>
              <div>
                <p className={`font-bold text-base ${result.is_resolved ? 'text-[#00d4aa]' : 'text-red-400'}`}>
                  {result.is_resolved ? 'Problem həll edilib' : 'Problem həll edilməyib'}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">{result.summary}</p>
              </div>
            </div>

            {/* Warning */}
            {result.warning && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5 flex gap-3">
                <span className="text-xl">🚨</span>
                <p className="text-amber-400 text-sm">{result.warning}</p>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Həll skoru', value: `${result.resolution_score}/100`, color: result.resolution_score > 60 ? '#00d4aa' : '#f87171' },
                { label: 'Etibarlılıq', value: `${Math.round(result.confidence * 100)}%`, color: '#4f8cff' },
                { label: 'Eyni məkan', value: result.is_same_location ? 'Bəli' : 'Xeyr', color: result.is_same_location ? '#00d4aa' : '#f87171' },
              ].map((m, i) => (
                <div key={i} className="bg-[#1a2235] rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}