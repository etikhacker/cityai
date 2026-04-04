'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

type CompareResult = {
  is_resolved: boolean
  is_same_location: boolean
  confidence: number
  resolution_score: number
  summary: string
  warning: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Gözləyir',     color: 'text-gray-400 border-gray-600' },
  analyzing:   { label: 'Analiz edilir', color: 'text-blue-400 border-blue-600' },
  open:        { label: 'Açıq',         color: 'text-amber-400 border-amber-600' },
  in_progress: { label: 'İcrada',       color: 'text-purple-400 border-purple-600' },
  resolved:    { label: 'Həll edilib',  color: 'text-[#00d4aa] border-[#00d4aa]' },
  rejected:    { label: 'Rədd edilib',  color: 'text-red-400 border-red-600' },
}

const PRIORITY_LABELS: Record<string, string> = {
  low: '🟢 Aşağı', medium: '🟡 Orta', high: '🔴 Yüksək', critical: '🚨 Kritik'
}

const CAT_LABELS: Record<string, string> = {
  yol: '🛣️ Yol', isiq: '💡 İşıq', zibil: '🗑️ Təmizlik',
  su: '💧 Su', yasilliq: '🌳 Yaşıllıq', diger: '📋 Digər'
}

export default function AdminPage() {
  const [muracietler, setMuracietler] = useState<Muraciet[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Muraciet | null>(null)
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforePreview, setBeforePreview] = useState('')
  const [afterPreview, setAfterPreview] = useState('')
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<CompareResult | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchMuracietler() }, [])

  async function fetchMuracietler() {
    setLoading(true)
    const { data } = await supabase
      .from('muracietler')
      .select('*')
      .order('created_at', { ascending: false })
    setMuracietler(data || [])
    setLoading(false)
  }

  function handleFile(file: File, type: 'before' | 'after') {
    const reader = new FileReader()
    reader.onload = e => {
      if (type === 'before') { setBeforeFile(file); setBeforePreview(e.target?.result as string) }
      else { setAfterFile(file); setAfterPreview(e.target?.result as string) }
    }
    reader.readAsDataURL(file)
  }

  function openDetail(m: Muraciet) {
    setSelected(m)
    setBeforeFile(null); setAfterFile(null)
    setBeforePreview(''); setAfterPreview('')
    setResult(null)
  }

  async function compare() {
    if (!beforeFile || !afterFile || !selected) return
    setComparing(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('before', beforeFile)
      fd.append('after', afterFile)
      fd.append('muraciet_id', selected.id)
      const res = await fetch('/api/compare', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setResult(data.result)
        fetchMuracietler()
        setSelected(prev => prev ? { ...prev, status: data.result.is_resolved ? 'resolved' : 'in_progress' } : prev)
      }
    } catch { alert('Xəta baş verdi') }
    finally { setComparing(false) }
  }

  const filtered = filter === 'all' ? muracietler : muracietler.filter(m => m.status === filter)

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#00d4aa 1px,transparent 1px),linear-gradient(90deg,#00d4aa 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 flex h-screen">

        {/* Sidebar */}
        <div className="w-80 border-r border-white/07 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-white/07">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#4f8cff] flex items-center justify-center font-bold text-[#0a0f1e] text-sm">AI</div>
              <div>
                <p className="font-bold text-sm">CityAI</p>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            {/* Filter */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-[#1a2235] border border-white/07 rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">Bütün müraciətlər</option>
              <option value="open">Açıq</option>
              <option value="in_progress">İcrada</option>
              <option value="resolved">Həll edilib</option>
            </select>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-5 text-gray-500 text-sm">Yüklənir...</div>
            ) : filtered.length === 0 ? (
              <div className="p-5 text-gray-500 text-sm">Müraciət yoxdur</div>
            ) : filtered.map(m => (
              <div
                key={m.id}
                onClick={() => openDetail(m)}
                className={`p-4 border-b border-white/05 cursor-pointer hover:bg-white/03 transition-colors
                  ${selected?.id === m.id ? 'bg-white/05 border-l-2 border-l-[#00d4aa]' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-[#00d4aa]">{m.tracking_code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_LABELS[m.status]?.color || ''}`}>
                    {STATUS_LABELS[m.status]?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-300 truncate">{m.description || '—'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{CAT_LABELS[m.category] || m.category}</span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-gray-500">{PRIORITY_LABELS[m.priority]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="p-4 border-t border-white/07 grid grid-cols-3 gap-2">
            {[
              { label: 'Açıq', count: muracietler.filter(m => m.status === 'open').length, color: 'text-amber-400' },
              { label: 'İcrada', count: muracietler.filter(m => m.status === 'in_progress').length, color: 'text-purple-400' },
              { label: 'Həll', count: muracietler.filter(m => m.status === 'resolved').length, color: 'text-[#00d4aa]' },
            ].map((s, i) => (
              <div key={i} className="bg-[#111827] rounded-lg p-2 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-500">Müraciət seçin</p>
              </div>
            </div>
          ) : (
            <div className="p-8 max-w-2xl">
              {/* Müraciət info */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[#00d4aa] font-bold text-lg">{selected.tracking_code}</span>
                  <span className={`text-sm px-3 py-1 rounded-full border ${STATUS_LABELS[selected.status]?.color}`}>
                    {STATUS_LABELS[selected.status]?.label}
                  </span>
                </div>
                <div className="bg-[#111827] border border-white/07 rounded-xl p-5 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Kateqoriya', value: CAT_LABELS[selected.category] || selected.category },
                    { label: 'Prioritet', value: PRIORITY_LABELS[selected.priority] },
                    { label: 'Yer', value: selected.location || '—' },
                    { label: 'Tarix', value: new Date(selected.created_at).toLocaleDateString('az-AZ') },
                  ].map((r, i) => (
                    <div key={i}>
                      <p className="text-xs text-gray-500 mb-1">{r.label}</p>
                      <p className="text-sm text-white">{r.value}</p>
                    </div>
                  ))}
                  {selected.description && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Təsvir</p>
                      <p className="text-sm text-white">{selected.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Before/After */}
              <div className="mb-5">
                <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Vizual Yoxlama</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { type: 'before' as const, label: 'Əvvəl (before)', preview: beforePreview, border: 'border-red-500/30' },
                    { type: 'after' as const, label: 'Sonra (after)', preview: afterPreview, border: 'border-[#00d4aa]/30' },
                  ].map(({ type, label, preview, border }) => (
                    <div key={type} className="bg-[#111827] border border-white/07 rounded-xl p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">{label}</p>
                      <label className="block cursor-pointer">
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], type)} />
                        {preview ? (
                          <img src={preview} alt={type} className="w-full aspect-square object-cover rounded-lg" />
                        ) : (
                          <div className={`w-full aspect-square rounded-lg border-2 border-dashed ${border} flex flex-col items-center justify-center gap-2 hover:opacity-80 transition-opacity`}>
                            <span className="text-2xl">{type === 'before' ? '📸' : '✅'}</span>
                            <span className="text-xs text-gray-500">Şəkil seçin</span>
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  onClick={compare}
                  disabled={comparing || !beforeFile || !afterFile}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-[#0a0f1e] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                >
                  {comparing ? '⏳ AI analiz edir...' : '🔍 Vizual uyğunluğu yoxla'}
                </button>
              </div>

              {/* Result */}
              {result && (
                <div className={`bg-[#111827] border rounded-xl p-5 ${result.is_resolved ? 'border-[#00d4aa]/30' : 'border-red-500/30'}`}>
                  <div className={`rounded-lg p-4 mb-4 flex items-center gap-3 ${result.is_resolved ? 'bg-[#00d4aa]/10' : 'bg-red-500/10'}`}>
                    <span className="text-2xl">{result.is_resolved ? '✅' : '⚠️'}</span>
                    <div>
                      <p className={`font-bold text-sm ${result.is_resolved ? 'text-[#00d4aa]' : 'text-red-400'}`}>
                        {result.is_resolved ? 'Problem həll edilib' : 'Problem həll edilməyib'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{result.summary}</p>
                    </div>
                  </div>
                  {result.warning && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 flex gap-2">
                      <span>🚨</span>
                      <p className="text-amber-400 text-xs">{result.warning}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Həll skoru', value: `${result.resolution_score}/100`, color: result.resolution_score > 60 ? '#00d4aa' : '#f87171' },
                      { label: 'Etibarlılıq', value: `${Math.round(result.confidence * 100)}%`, color: '#4f8cff' },
                      { label: 'Eyni məkan', value: result.is_same_location ? 'Bəli' : 'Xeyr', color: result.is_same_location ? '#00d4aa' : '#f87171' },
                    ].map((m, i) => (
                      <div key={i} className="bg-[#1a2235] rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                        <p className="text-base font-bold" style={{ color: m.color }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}