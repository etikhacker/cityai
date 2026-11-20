import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  GitCompareArrows,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HeroInteractivePreview } from '@/components/HeroInteractivePreview';
import { RecentComplaints } from '@/components/RecentComplaints';

const CAPABILITIES = [
  {
    number: '01',
    icon: Camera,
    title: 'Şəkildən avtomatik problem təsnifatı',
    description:
      'Yol, küçə işıqlandırması, təmizlik, su sızması və yaşıllıq problemlərini foto sübut əsasında dərhal ayırd edir.',
    outcome: 'Dəqiq texniki təsvir və açar sözlər saniyələr ərzində formalaşır.',
  },
  {
    number: '02',
    icon: ShieldCheck,
    title: 'Süni intellekt təklifi, vətəndaş təsdiqi',
    description:
      'AI yalnız ilkin təhlil təqdim edir; kateqoriya, təcililik və ünvan məlumatlarını göndərməzdən əvvəl istədiyiniz kimi dəyişə bilərsiniz.',
    outcome: 'Yanlış yönləndirmə azalır, məsul qurum ilk addımda düzgün seçilir.',
  },
  {
    number: '03',
    icon: Route,
    title: 'Şəffaf mərhələli izləmə xətti',
    description:
      'Hər müraciətə unikal AZ-XXXX-X kodu verilir. Qəbul, baxış, icra və həll mərhələləri tarixçə ilə izlənilir.',
    outcome: 'Vətəndaş müraciətin hansı qurumda və nə vaxtdan baxıldığını görür.',
  },
  {
    number: '04',
    icon: GitCompareArrows,
    title: 'Əvvəl və sonra vizual həll təsdiqi',
    description:
      'İcra tamamlandıqdan sonra ərazinin sonrakı fotosu ilkin foto ilə müqayisə edilərək eyni məkan və həll keyfiyyəti yoxlanılır.',
    outcome: 'Formal bağlanmaların qarşısı alınır, real bərpa təsdiqlənir.',
  },
];

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Şəkil əlavə edin və ya problemi qeyd edin',
    detail:
      'Çəkdiyiniz fotoşəkli yükləyin (JPEG, PNG, WEBP). İstəsəniz GPS ilə mövcud ünvanı avtomatik əlavə edə bilərsiniz.',
  },
  {
    step: '02',
    title: 'Süni intellekt ilkin təhlilini yoxlayın',
    detail:
      'CityAI problemin növünü, təcililik dərəcəsini və məsul dövlət qurumunu təklif edir. Siz mətnə düzəliş edib təsdiqləyirsiniz.',
  },
  {
    step: '03',
    title: 'İzləmə kodunu alın və nəticəni izləyin',
    detail:
      'Müraciət göndərildikdən sonra dərhal izləmə kodu təqdim olunur. Bütün yenilikləri izləmə səhifəsindən yoxlaya bilərsiniz.',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FB] text-[#102A35]">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-[#E2E8E8] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="flex flex-col justify-between lg:col-span-7">
                <div>
                  <p className="text-sm font-medium text-[#087F70]">
                    Şəhər infrastrukturu üçün rəqəmsal müraciət sistemi
                  </p>
                  <h1 className="motion-heading font-display mt-4 max-w-2xl text-balance text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.03em] text-[#102A35]">
                    Şəhərdəki problemi görünən edin.
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-[#475569] sm:text-lg">
                    CityAI yol, işıqlandırma, su və təmizlik problemlərini şəkildən təhlil
                    etməyə, düzgün quruma yönləndirməyə və müraciətin həllini sonadək izləməyə
                    imkan verir.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/muraciet"
                      className="inline-flex h-[52px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#087F70] px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-[#06695E] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#087F70]/30"
                    >
                      <span>Müraciət yarat</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>

                    <Link
                      href="/izle"
                      className="inline-flex h-[52px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#E2E8E8] bg-white px-6 text-base font-medium text-[#102A35] transition-colors duration-150 hover:bg-[#F1F5F5] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#087F70]/20"
                    >
                      <span>Müraciəti izlə</span>
                    </Link>
                  </div>
                </div>

                <div className="mt-8 flex items-start gap-2.5 border-t border-[#E2E8E8] pt-5 text-xs leading-relaxed text-[#64748B]">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#087F70]"
                    aria-hidden="true"
                  />
                  <span>
                    Şəkil analizi müraciəti sürətləndirmək üçün ilkin təklif yaradır; yekun
                    kateqoriya və təsviri göndərməzdən əvvəl siz təsdiqləyirsiniz.
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <HeroInteractivePreview />
              </div>
            </div>

            {/* Full-width Operational Metrics Strip */}
            <div className="mt-12 grid grid-cols-2 divide-y divide-[#E2E8E8] border-t border-[#E2E8E8] pt-8 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="pb-4 sm:pr-6 sm:pb-0">
                <p className="font-display tabular-nums text-2xl font-bold tracking-[-0.02em] text-[#102A35]">
                  6 sahə
                </p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Yol, işıq, su, təmizlik, yaşıllıq və digər
                </p>
              </div>
              <div className="pb-4 sm:px-6 sm:pb-0">
                <p className="font-display tabular-nums text-2xl font-bold tracking-[-0.02em] text-[#102A35]">
                  &lt; 4 san
                </p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Orta ilkin AI foto təhlil müddəti
                </p>
              </div>
              <div className="pt-4 sm:px-6 sm:pt-0">
                <p className="font-display tabular-nums text-2xl font-bold tracking-[-0.02em] text-[#102A35]">
                  5 mərhələ
                </p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Qəbuldan həllədək tam tarixçə izləməsi
                </p>
              </div>
              <div className="pt-4 sm:pl-6 sm:pt-0">
                <p className="font-display tabular-nums text-2xl font-bold tracking-[-0.02em] text-[#102A35]">
                  0–100 bal
                </p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Əvvəl / sonra vizual həll qiymətləndirməsi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section id="imkanlar" className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#087F70]">Platforma imkanları</p>
            <h2 className="font-display mt-2 text-balance text-3xl font-bold tracking-[-0.025em] text-[#102A35] sm:text-[36px]">
              Bir şəhər problemi üçün aydın və etibarlı axın.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#475569]">
              Müraciətin yaradılmasından bərpa işlərinin yoxlanılmasına qədər bütün mərhələlər
              vahid standart üzrə qurulub.
            </p>
          </div>

          <div className="mt-10 grid divide-y divide-[#E2E8E8] border-y border-[#E2E8E8] bg-white md:grid-cols-2 md:divide-x md:divide-y-0">
            {CAPABILITIES.map((cap, idx) => {
              const Icon = cap.icon;
              const isBottomRow = idx >= 2;
              return (
                <article
                  key={cap.number}
                  className={`p-6 sm:p-8 ${isBottomRow ? 'md:border-t md:border-[#E2E8E8]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono-tabular text-sm font-semibold text-[#087F70]">
                      {cap.number}
                    </span>
                    <div className="grid h-9 w-9 place-items-center rounded-lg border border-[#E2E8E8] bg-[#F7F9FB] text-[#087F70]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="font-display mt-5 text-xl font-semibold tracking-[-0.015em] text-[#102A35]">
                    {cap.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                    {cap.description}
                  </p>
                  <p className="mt-4 border-t border-[#E2E8E8] pt-3 text-xs font-medium text-[#07564F]">
                    Nəticə: {cap.outcome}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="proses" className="border-y border-[#E2E8E8] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <p className="text-sm font-semibold text-[#087F70]">Necə işləyir?</p>
                <h2 className="font-display mt-2 text-balance text-3xl font-bold tracking-[-0.025em] text-[#102A35]">
                  Məsələni bildirmək üçün üç sadə addım.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#475569]">
                  Uzun formalar doldurmağa ehtiyac yoxdur. Şəkil əlavə edildikdə sistem mətni və
                  kateqoriyanı hazırlayır, siz isə yalnız təsdiqləyirsiniz.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/muraciet"
                    className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#087F70] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#06695E]"
                  >
                    <span>İndi müraciət yarat</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/muqayise"
                    className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#E2E8E8] bg-white px-5 text-sm font-medium text-[#102A35] transition-colors hover:bg-[#F1F5F5]"
                  >
                    <span>Əvvəl / Sonra yoxla</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="divide-y divide-[#E2E8E8] rounded-[14px] border border-[#E2E8E8] bg-[#F7F9FB]">
                  {PROCESS_STEPS.map((item) => (
                    <div
                      key={item.step}
                      className="grid gap-3 p-6 sm:grid-cols-[64px_1fr] sm:gap-5"
                    >
                      <span className="font-mono-tabular text-2xl font-bold text-[#087F70]">
                        {item.step}
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-[#102A35]">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Tracked Complaints Section */}
        <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#087F70]">İctimai izləmə reyestri</p>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.02em] text-[#102A35] sm:text-3xl">
                Son qeydə alınmış müraciətlər
              </h2>
            </div>
            <Link
              href="/izle"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#087F70] transition-colors hover:text-[#06695E]"
            >
              <span>Kod ilə axtarış et</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <RecentComplaints />
          </div>
        </section>

        {/* Bottom CTA Band */}
        <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[14px] border border-[#087F70]/25 bg-[#E6F5F1] px-6 py-8 sm:flex-row sm:items-center sm:px-10 sm:py-10">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-[#087F70]">CityAI ilə şəhər nəzarəti</p>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.02em] text-[#102A35] sm:text-3xl">
                Məhəllənizdəki problemi bir dəqiqəyə bildirin.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#3E4946]">
                Şəkil əlavə edin, süni intellektin ilkin təhlilini yoxlayın və izləmə kodu ilə
                həll prosesini nəzarətdə saxlayın.
              </p>
            </div>

            <Link
              href="/muraciet"
              className="inline-flex h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#087F70] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#06695E]"
            >
              <span>Müraciət et</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
