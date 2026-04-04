'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#00d4aa 1px,transparent 1px),linear-gradient(90deg,#00d4aa 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed top-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: '#00d4aa', filter: 'blur(120px)' }} />
      <div className="fixed bottom-[-100px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{ background: '#4f8cff', filter: 'blur(120px)' }} />

      <nav className="relative z-20 border-b border-white/[0.07] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#4f8cff] flex items-center justify-center font-bold text-[#0a0f1e] text-sm">AI</div>
            <span className="font-bold text-lg">City<span style={{color:'#00d4aa'}}>AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#haqqinda" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Haqqında</a>
            <a href="#xususiyyetler" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Xüsusiyyətlər</a>
            <a href="#nece" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Necə işləyir</a>
              className="px-4 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/05 transition-colors">Admin</button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6">

        <section className="py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/[0.07] text-[#00d4aa] text-xs mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] inline-block" />
            ASAN AI Hub Challenge 2026
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Şəhər problemlərini<br />
            <span style={{color:'#00d4aa'}}>AI ilə həll edək</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            CityAI — vətəndaşların şəhər infrastruktur problemlərini bildirməsi, süni intellekt vasitəsilə 
            avtomatik analiz edilməsi və icra nəticələrinin yoxlanılması üçün platforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/muraciet')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-[#0a0f1e] font-bold text-base hover:-translate-y-0.5 transition-all">
              Müraciət et →
            </button>
            <a href="#nece"
              className="px-8 py-4 rounded-xl border border-white/10 font-bold text-base hover:bg-white/05 hover:-translate-y-0.5 transition-all text-center">
              Necə işləyir?
            </a>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
          {[
            { value: '80%+', label: 'Avtomatik təsnifat dəqiqliyi' },
            { value: '3', label: 'AI analiz modulu' },
            { value: '24/7', label: 'Sistem əlçatanlığı' },
            { value: '100%', label: 'Şəffaf hesabat' },
          ].map((s, i) => (
            <div key={i} className="bg-[#111827] border border-white/[0.07] rounded-xl p-5 text-center">
              <p className="text-3xl font-bold mb-1" style={{color:'#00d4aa'}}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </section>

        <section id="haqqinda" className="mb-24 scroll-mt-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#00d4aa] uppercase mb-3">Haqqında</p>
              <h2 className="text-3xl font-bold mb-5">ASAN Müraciət sistemini daha ağıllı edək</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                ASAN müraciət sisteminə daxil olan müraciətlərin böyük hissəsi şəkil və video ilə müşayiət olunur. 
                Hazırda bu vizual materiallar əməkdaşlar tərəfindən əl ilə yoxlanılır — bu isə vaxt itkisinə və 
                subyektivliyə gətirib çıxarır.
              </p>
              <p className="text-gray-400 leading-relaxed mb-4">
                CityAI bu prosesi avtomatlaşdırır: vətəndaşın yüklədiyi şəkil Claude Vision AI tərəfindən 
                saniyələr içində analiz edilir, problem növü müəyyənləşdirilir, kateqoriyaya salınır və 
                prioritet təyin olunur.
              </p>
              <p className="text-gray-400 leading-relaxed">
                İcra mərhələsində qurum tərəfindən yüklənən nəticə şəkli ilkin müraciətlə avtomatik 
                müqayisə edilir — problemin həqiqətən həll olunub-olmadığı yoxlanılır.
              </p>
            </div>
            <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              {[
                { icon: '⚡', title: 'Sürətli emal', desc: 'Manual yoxlama əvəzinə saniyələr içində AI analizi' },
                { icon: '🎯', title: 'Obyektiv qərar', desc: 'İnsan faktorundan qaynaqlanan subyektivliyin aradan qaldırılması' },
                { icon: '🔍', title: 'Şəffaflıq', desc: 'Hər müraciətin izləmə kodu ilə real vaxt statusu' },
                { icon: '🔒', title: 'Təhlükəsizlik', desc: 'Supabase RLS ilə məlumat məxfiliyi təmin edilir' },
              ].map((f, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#1a2235] flex items-center justify-center text-xl flex-shrink-0">{f.icon}</div>
                  <div>
                    <p className="font-semibold text-sm mb-0.5">{f.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="xususiyyetler" className="mb-24 scroll-mt-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#00d4aa] uppercase mb-3">Xüsusiyyətlər</p>
            <h2 className="text-3xl font-bold">Sistemin imkanları</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: '📸', title: 'Şəkil / Video analizi', desc: 'Claude Vision API ilə avtomatik problem aşkarlanması. Problem növü, şiddəti və ətraflı təsvir müəyyən edilir.', color: '#00d4aa' },
              { icon: '🗂️', title: 'Avtomatik təsnifat', desc: 'Müraciət kateqoriyaya salınır, təcililik dərəcəsi avtomatik təyin olunur.', color: '#4f8cff' },
              { icon: '✅', title: 'Həll yoxlaması', desc: 'Before/After şəkil müqayisəsi ilə icra nəzarəti. Uyğunsuzluq halında xəbərdarlıq.', color: '#f59e0b' },
              { icon: '📍', title: 'GPS məkan', desc: 'Müraciətin GPS koordinatları avtomatik əldə edilir.', color: '#00d4aa' },
              { icon: '📊', title: 'Admin panel', desc: 'Bütün müraciətlər status və prioritetə görə idarə olunur.', color: '#4f8cff' },
              { icon: '🔔', title: 'İzləmə kodu', desc: 'Hər müraciətə unikal izləmə kodu verilir.', color: '#f59e0b' },
            ].map((f, i) => (
              <div key={i} className="bg-[#111827] border border-white/[0.07] rounded-xl p-6 hover:border-white/[0.15] transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{background: f.color + '20', border: `1px solid ${f.color}40`}}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="nece" className="mb-24 scroll-mt-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#00d4aa] uppercase mb-3">Proses</p>
            <h2 className="text-3xl font-bold">Necə işləyir?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6">
              <p className="text-xs font-semibold tracking-widest text-[#00d4aa] uppercase mb-5">Vətəndaş üçün</p>
              <div className="space-y-5">
                {[
                  'Şəkil və ya video çəkib sistemə yükləyir',
                  'AI problemi analiz edib kateqoriya və təsvir təklif edir',
                  'GPS ilə yer məlumatı avtomatik əldə edilir',
                  'Müraciət göndərilir, izləmə kodu alınır',
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{background:'#00d4aa20',border:'1px solid #00d4aa40',color:'#00d4aa'}}>{i+1}</div>
                    <p className="text-sm text-gray-300 pt-1.5">{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6">
              <p className="text-xs font-semibold tracking-widest text-[#4f8cff] uppercase mb-5">Admin / Qurum üçün</p>
              <div className="space-y-5">
                {[
                  'Admin paneldə bütün müraciətlər siyahısı görünür',
                  'Müraciət seçilir, AI analiz nəticəsi oxunur',
                  'Problem həll edildikdən sonra nəticə şəkli yüklənir',
                  'AI before/after müqayisə aparır, uyğunsuzluq varsa xəbərdarlıq edir',
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{background:'#4f8cff20',border:'1px solid #4f8cff40',color:'#4f8cff'}}>{i+1}</div>
                    <p className="text-sm text-gray-300 pt-1.5">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24">
          <div className="rounded-2xl p-12 text-center"
            style={{background:'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(79,140,255,0.1))', border:'1px solid rgba(0,212,170,0.2)'}}>
            <h2 className="text-3xl font-bold mb-4">Müraciətinizi indi göndərin</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">Şəhərdə gördüyünüz problemi bildirin — AI sistemi saniyələr içində analiz edəcək</p>
            <button onClick={() => router.push('/muraciet')}
              className="px-10 py-4 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-[#0a0f1e] font-bold text-base hover:-translate-y-0.5 transition-all">
              İndi müraciət et →
            </button>
          </div>
        </section>
      </div>

      <footer className="relative z-10 border-t border-white/[0.07] py-8 text-center">
        <p className="text-sm text-gray-600">CityAI · ASAN AI Hub Challenge 2026 · Ömər Babayev</p>
        <div className="flex justify-center gap-6 mt-3">
          <button onClick={() => router.push('/muraciet')} className="text-xs text-gray-600 hover:text-[#00d4aa] transition-colors">Müraciət</button>
           className="text-xs text-gray-600 hover:text-[#00d4aa] transition-colors">Admin</button>
        </div>
      </footer>
    </main>
  )
}