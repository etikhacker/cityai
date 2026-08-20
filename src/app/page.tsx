import { LiquidMetalLink } from '@/components/LiquidMetalLink'
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

      <section className="city-immersive-hero relative isolate flex min-h-[calc(100svh-72px)] items-center justify-center overflow-hidden px-5 py-20 sm:px-8">
        <div className="city-hero-grain absolute inset-0 -z-10" aria-hidden="true" />
        <div className="city-hero-content mx-auto max-w-4xl text-center">
          <div className="city-hero-eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />Şəhər üçün vizual AI</div>
          <h1 className="font-averia mt-6 text-balance text-[clamp(3.25rem,9vw,7rem)] font-normal leading-[.92] tracking-[-.055em] text-white">
            Şəhərdəki problemi <span className="city-hero-accent">görünən edin.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-8 text-white/78 sm:text-lg">
            CityAI, şəhər infrastrukturundakı problemi şəkildən analiz etməyə və müraciəti daha aydın, ardıcıl formada göndərməyə kömək edir.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LiquidMetalLink href="/muraciet" label="Şəkli analiz et" trailing="→" className="min-w-[164px]" />
            <LiquidMetalLink href="/izle" label="Müraciəti izlə" className="min-w-[164px] liquid-metal-button--quiet" />
          </div>
          <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-white/55">Şəkil analizi müraciəti sürətləndirmək üçün köməkçi nəticə yaradır; son məlumatı göndərməzdən əvvəl siz yoxlayırsınız.</p>
        </div>
        <a href="#imkanlar" className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[11px] font-medium uppercase tracking-[.18em] text-white/55 transition-colors hover:text-white sm:flex">
          Kəşf et <span aria-hidden="true" className="animate-bounce">↓</span>
        </a>
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
        <div className="grid gap-8 px-6 py-10 sm:px-10 sm:py-14 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-bold uppercase tracking-[.12em] text-teal-200">CityAI ilə başla</p><h2 className="font-syne mt-3 text-3xl font-bold tracking-[-.04em] text-white">Şəkli yükləyin, problemi birlikdə aydınlaşdıraq.</h2></div><LiquidMetalLink href="/muraciet" label="Müraciətə keç" trailing="→" className="h-fit justify-self-start md:justify-self-end" /></div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">CityAI · Şəhər problemləri üçün məsuliyyətli AI dəstəyi</footer>
    </main>
  )
}
