'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type AiAnalysis = {
  problem_type: string
  severity: string
  description: string
  tags: string[]
  confidence: number
  is_infrastructure: boolean
}

type Priority = 'low' | 'medium' | 'high'

const CATEGORIES = [
  { id: 'yol', label: 'Yol', icon: '🛣️' },
  { id: 'isiq', label: 'İşıq', icon: '💡' },
  { id: 'zibil', label: 'Təmizlik', icon: '🗑️' },
  { id: 'su', label: 'Su/Kanalizasiya', icon: '💧' },
  { id: 'yasilliq', label: 'Yaşıllıq', icon: '🌳' },
  { id: 'diger', label: 'Digər', icon: '📋' },
]

export default function MuracietPage() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (!arr.length) return

    setFiles(prev => [...prev, ...arr])
    const newPreviews = await Promise.all(
      arr.map(f => new Promise<string>(res => {
        const r = new FileReader()
        r.onload = e => res(e.target?.result as string)
        r.readAsDataURL(f)
      }))
    )
    setPreviews(prev => [...prev, ...newPreviews])

    // Analyze first image
    const imageFile = arr.find(f => f.type.startsWith('image/'))
    if (imageFile) {
      setAnalyzing(true)
      setAnalysis(null)
      try {
        const fd = new FormData()
        fd.append('file', imageFile)
        const res = await fetch('/api/analyze', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.success) setAnalysis(data.analysis)
      } catch (e) {
        console.error(e)
      } finally {
        setAnalyzing(false)
      }
    }
  }, [])

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => setLocation('Bakı, Azərbaycan')
    )
  }

  const handleSubmit = async () => {
  if (!category) return alert('Kateqoriya seçin')
  setSubmitting(true)

  try {
    // Upload files
    const mediaUrls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('muraciet-media').upload(path, file)
      if (!error) mediaUrls.push(path)
    }

    // Submit — analysis xətası olsa da davam et
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        category, description, priority, location, 
        analysis: analysis || null,  // null olsa da göndər
        mediaUrls 
      }),
    })
    const data = await res.json()
    if (data.success) setTrackingCode(data.tracking_code)
    else alert(data.error || 'Xəta baş verdi')
  } catch (e) {
    console.error(e)
    alert('Xəta baş verdi')
  } finally {
    setSubmitting(false)
  }
}
  
  // Success screen
  if (trackingCode) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full border-2 border-[#00d4aa] bg-[#00d4aa]/10 flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce-once">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-white font-syne mb-3">Müraciət qəbul edildi!</h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            AI sistemi müraciətinizi analiz edir. Nəticə haqqında bildiriş alacaqsınız.
          </p>
          <div className="bg-[#111827] border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">İzləmə kodu</p>
            <p className="text-[#00d4aa] font-bold text-xl font-syne">{trackingCode}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#00d4aa 1px,transparent 1px),linear-gradient(90deg,#00d4aa 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 pb-20">

        {/* Header */}
        <header className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d4aa] to-[#4f8cff] flex items-center justify-center font-bold text-[#0a0f1e] text-lg font-syne">
            AI
          </div>
          <div>
            <h1 className="text-xl font-bold font-syne">ASAN AI Hub</h1>
            <p className="text-sm text-gray-500">İnfrastruktur problemlərini bildirin</p>
          </div>
        </header>

        {/* Status pills */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs border border-[#00d4aa]/30 text-[#00d4aa] bg-[#00d4aa]/07 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] inline-block" />AI aktiv
          </span>
          <span className="px-3 py-1 rounded-full text-xs border border-[#4f8cff]/30 text-[#4f8cff] bg-[#4f8cff]/07 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f8cff] inline-block" />Şəkil analizi hazır
          </span>
          <span className="px-3 py-1 rounded-full text-xs border border-white/10 text-gray-500">
            Son tarix: 20 aprel 2026
          </span>
        </div>

        {/* Upload card */}
        <div className="bg-[#111827] border border-white/07 rounded-2xl p-6 mb-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">Şəkil / Video</p>

          <div
            className={`border-dashed border-2 rounded-xl p-8 text-center cursor-pointer transition-all relative
              ${dragOver ? 'border-[#00d4aa] bg-[#00d4aa]/06' : 'border-[#00d4aa]/25 bg-[#00d4aa]/03 hover:border-[#00d4aa]/50'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          >
            <input
              type="file" multiple accept="image/*,video/*"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            <div className="w-11 h-11 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 flex items-center justify-center text-xl mx-auto mb-3">
              📎
            </div>
            <p className="font-semibold text-sm font-syne mb-1">Fayl əlavə edin</p>
            <p className="text-xs text-gray-500">Şəkil və ya video — drag & drop və ya klikləyin</p>
          </div>

          {/* Preview grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {previews.map((p, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#1a2235] border border-white/07 relative group">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={() => {
                      setFiles(prev => prev.filter((_, j) => j !== i))
                      setPreviews(prev => prev.filter((_, j) => j !== i))
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* AI analysis result */}
          {(analyzing || analysis) && (
            <div className="mt-4 border-t border-white/07 pt-4">
              <div className="bg-gradient-to-r from-[#00d4aa]/05 to-[#4f8cff]/05 border border-[#00d4aa]/15 rounded-xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#4f8cff] flex items-center justify-center text-sm flex-shrink-0">
                  🤖
                </div>
                <div>
                  <p className="text-[#00d4aa] text-sm font-semibold font-syne mb-1">AI Analizi</p>
                  {analyzing ? (
                    <p className="text-gray-400 text-sm animate-pulse">Şəkil analiz edilir...</p>
                  ) : analysis ? (
                    <>
                      <p className="text-gray-300 text-sm leading-relaxed">{analysis.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {analysis.tags?.map((t, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category card */}
        <div className="bg-[#111827] border border-white/07 rounded-2xl p-6 mb-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">Problem növü</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`p-3 rounded-xl border text-sm flex flex-col items-center gap-1.5 transition-all
                  ${category === c.id
                    ? 'border-[#00d4aa] text-[#00d4aa] bg-[#00d4aa]/07'
                    : 'border-white/07 text-gray-400 hover:border-white/18 hover:text-white'}`}
              >
                <span className="text-xl">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description + Priority */}
        <div className="bg-[#111827] border border-white/07 rounded-2xl p-6 mb-4">
          <div className="mb-5">
            <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase block mb-3">
              Təsvir
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Problemi ətraflı təsvir edin..."
              className="w-full bg-[#1a2235] border border-white/07 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00d4aa]/40 resize-none transition-colors"
            />
            <p className="text-right text-xs text-gray-600 mt-1">{description.length} / 500</p>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase block mb-3">
              Təcililik
            </label>
            <div className="flex gap-2">
              {[
                { val: 'low' as Priority, label: '🟢 Aşağı', cls: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/07' },
                { val: 'medium' as Priority, label: '🟡 Orta', cls: 'border-amber-500/40 text-amber-400 bg-amber-500/07' },
                { val: 'high' as Priority, label: '🔴 Yüksək', cls: 'border-red-500/40 text-red-400 bg-red-500/07' },
              ].map(p => (
                <button
                  key={p.val}
                  onClick={() => setPriority(p.val)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm transition-all
                    ${priority === p.val ? p.cls : 'border-white/07 text-gray-500 hover:border-white/15'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-[#111827] border border-white/07 rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Yer / Ünvan</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Küçə, bina nömrəsi, rayon..."
              className="flex-1 bg-[#1a2235] border border-white/07 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#4f8cff]/40 transition-colors"
            />
            <button
              onClick={getLocation}
              className="px-4 rounded-xl border border-[#4f8cff]/20 bg-[#4f8cff]/10 text-[#4f8cff] text-sm hover:bg-[#4f8cff]/18 transition-colors whitespace-nowrap"
            >
              📍 GPS
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !category}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-[#0a0f1e] font-bold font-syne text-base disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#00d4aa]/20 hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          {submitting ? '⏳ Göndərilir...' : 'Müraciəti göndər →'}
        </button>
      </div>
    </main>
  )
}
