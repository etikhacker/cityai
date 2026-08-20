import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

const capabilities = [
  {
    number: '01',
    title: 'Şəkildən problemi anlayır',
    text: 'Yol, işıqlandırma, təmizlik, su və yaşıllıq problemlərini vizual siqnallardan ayırd edir.',
  },
  {
    number: '02',
    title: 'Aydın analiz qaytarır',
    text: 'Problemin növü, təcililiyi, qısa təsviri və etibar göstəricisi vahid nəticədə təqdim olunur.',
  },
  {
    number: '03',
    title: 'Müraciəti izləməyə kömək edir',
    text: 'Müraciət kodu ilə prosesə baxın və şəhərinizdəki məsələni görünən saxlayın.',
  },
]

const process = [
  ['01', 'Şəkli əlavə edin', 'Aydın və real vəziyyəti göstərən şəkil seçin.'],
  ['02', 'AI analizi alın', 'CityAI problemi strukturlaşdırılmış məlumat kimi oxuyur.'],
  ['03', 'Müraciəti göndərin', 'Təsviri yoxlayın, ünvanı qeyd edin və müraciəti tamamlayın.'],
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <SiteHeader />

      <section className="relative isolate">
        <div className="city-grid absolute inset-0 -z-20 opacity-70" />
        <div className="city-orb absolute -right-36 top-12 -z-10 h-80 w-80 rounded-full bg-cyan-400/20" />
        <div className="city-orb absolute -left-28 top-72 -z-10 h-80 w-80 rounded-full bg-teal-400/15" />

        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <div className="city-eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-teal-300" />Şəhər üçün vizual AI</div>
            <h1 className="font-syne mt-6 text-5xl font-bold leading-[.98] tracking-[-.055em] text-white sm:text-6xl lg:text-7xl">
              Şəhərinizdəki problemi <span className="bg-gradient-to-r from-teal-200 via-cyan-200 to-sky-300 bg-clip-text text-transparent">görünən edin.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              CityAI, şəhər infrastrukturundakı problemi şəkildən analiz etməyə və müraciəti daha aydın, ardıcıl formada göndərməyə kömək edir.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/muraciet" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-300 px-6 py-4 text-sm font-bold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-teal-200 active:scale-[.97]">
                Şəkli analiz et <span aria-hidden="true">→</span>
              </Link>
              <Link href="/izle" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[.035] px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-white/[.09]">
                Müraciəti izlə
              </Link>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-400">Şəkil analizi yalnız müraciəti sürətləndirmək üçün köməkçi nəticə yaradır; son məlumatı göndərməzdən əvvəl siz yoxlayırsınız.</p>
          </div>

          <div className="city-float city-surface relative overflow-hidden rounded-[28px] p-4 sm:p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-200/60 to-transparent" />
            <div className="rounded-[20px] border border-white/10 bg-[#071322] p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-200">Canlı analiz nümunəsi</p>
                  <p className="mt-1 text-sm text-slate-400">Şəkildən strukturlaşdırılmış nəticə</p>
                </div>
                <span className="rounded-full border border-teal-300/25 bg-teal-300/10 px-2.5 py-1 text-[11px] font-bold text-teal-200">AI hazır</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[.9fr_1.1fr]">
                <div className="relative min-h-48 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950">
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-[linear-gradient(155deg,transparent_49%,rgba(148,163,184,.45)_50%,rgba(148,163,184,.45)_52%,transparent_53%)] opacity-70" />
                  <div className="absolute left-[23%] top-[31%] h-12 w-16 rounded-[50%] border-4 border-amber-300/80 bg-slate-950/70 shadow-[0_0_0_6px_rgba(251,191,36,.13)]" />
                  <span className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-white">Yüklənən şəkil</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <div className="flex items-center justify-between"><span className="text-xs text-slate-400">Problem növü</span><span className="text-xs font-bold text-amber-200">Yüksək</span></div>
                  <p className="font-syne mt-2 text-lg font-bold text-white">Yol səthinin zədəsi</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">Səthdə nəqliyyat üçün risk yarada biləcək dərin çuxur görünür.</p>
                  <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-teal-300/10 px-2 py-1 text-[11px] text-teal-100">yol</span><span className="rounded-full bg-sky-300/10 px-2 py-1 text-[11px] text-sky-100">təmir</span><span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-200">0.93 etibar</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="imkanlar" className="border-y border-white/10 bg-[#0a1829] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl"><div className="city-eyebrow">Fokuslanmış axın</div><h2 className="font-syne mt-5 text-3xl font-bold tracking-[-.04em] text-white sm:text-4xl">Bir şəhər problemi. Daha aydın başlanğıc.</h2></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {capabilities.map((item) => (
              <article key={item.number} className="city-surface rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-1">
                <span className="font-syne text-sm font-bold text-teal-300">{item.number}</span>
                <h3 className="font-syne mt-9 text-xl font-bold tracking-[-.03em] text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proses" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div><div className="city-eyebrow">Sadə proses</div><h2 className="font-syne mt-5 text-3xl font-bold tracking-[-.04em] sm:text-4xl">Məsələni bildirmək üçün üç aydın addım.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">Texnologiya diqqəti yayındırmamalıdır. CityAI məlumatı daha tez toplamaq üçün arxa planda işləyir.</p></div>
          <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[.025] px-5 sm:px-7">
            {process.map(([number, title, text]) => <div key={number} className="grid gap-4 py-6 sm:grid-cols-[72px_1fr] sm:gap-6"><span className="font-syne text-2xl font-bold text-teal-300">{number}</span><div><h3 className="font-syne text-lg font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="mx-5 mb-12 overflow-hidden rounded-[28px] border border-teal-200/15 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,.19),transparent_38%),linear-gradient(135deg,#0d2639,#0a1829)] sm:mx-8 lg:mx-auto lg:max-w-7xl">
        <div className="grid gap-8 px-6 py-10 sm:px-10 sm:py-14 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-bold uppercase tracking-[.12em] text-teal-200">CityAI ilə başla</p><h2 className="font-syne mt-3 text-3xl font-bold tracking-[-.04em] text-white">Şəkli yükləyin, problemi birlikdə aydınlaşdıraq.</h2></div><Link href="/muraciet" className="inline-flex h-fit items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5 hover:bg-teal-100 active:scale-[.97]">Müraciətə keç →</Link></div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">CityAI · Şəhər problemləri üçün məsuliyyətli AI dəstəyi</footer>
    </main>
  )
}
