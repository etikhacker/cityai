import Link from 'next/link';
import {
  ArrowRight,
  Eye,
  FileCheck2,
  HeartHandshake,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

const PRINCIPLES = [
  {
    icon: Eye,
    eyebrow: '01 / Şəffaflıq',
    title: 'Müraciətin gedişini izləyin',
    text: 'Hər müraciət üçün verilən izləmə kodu ilə onun mövcud statusunu və tarixçəsini yoxlamaq mümkündür.',
  },
  {
    icon: ScanSearch,
    eyebrow: '02 / Süni intellekt',
    title: 'AI ilkin köməkçidir',
    text: 'Sistem media əsasında kateqoriya və təsvir təklif edə bilər. Təklifə baxıb düzəliş etmək və müraciəti necə göndərəcəyinizə qərar vermək sizə aiddir.',
  },
  {
    icon: HeartHandshake,
    eyebrow: '03 / İştirak',
    title: 'Şəhər qayğısı hamımızdan başlayır',
    text: 'Küçə, işıqlandırma, su, təmizlik və digər infrastruktur problemləri barədə məlumat aidiyyəti üzrə baxılmasına kömək edir.',
  },
];

const STEPS = [
  { title: 'Foto və ya video əlavə edin', text: 'Problemi göstərən uyğun media faylını seçin. Ünvanı yazın və ya cihazınızın məkan icazəsi ilə koordinat əlavə edin.' },
  { title: 'Məlumatı nəzərdən keçirin', text: 'AI təhlilindən istifadə etmək istəsəniz, ilkin nəticəni yoxlayın; kateqoriya və təsviri özünüz də düzəldə bilərsiniz.' },
  { title: 'Göndərin və izləyin', text: 'Müraciət təsdiqləndikdən sonra təqdim olunan kodu saxlayın və statusu izləmə səhifəsində yoxlayın.' },
];

export default function AboutPage() {
  return (
    <div className="site-page flex min-h-screen flex-col text-[#102A35]">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-[#E2E8E8] bg-white/70">
          <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
              <div className="max-w-4xl">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#E6F5F1] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#07564F]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> CityAI haqqında
                </p>
                <h1 className="motion-heading font-display mt-5 text-balance text-4xl font-bold leading-tight tracking-[-0.035em] text-[#102A35] sm:text-5xl lg:text-6xl">
                  Şəhər problemlərini bildirmək üçün daha aydın yol.
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#475569] sm:text-lg">
                  CityAI sakinlərə şəhər infrastrukturu ilə bağlı problemi foto və ya video ilə
                  təqdim etməyə, müraciətin gedişini isə şəxsi izləmə kodu ilə yoxlamağa kömək edir.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:w-[330px]">
                <div className="rounded-xl border border-[#E2E8E8] bg-white p-4">
                  <ScanSearch className="h-5 w-5 text-[#087F70]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-[#102A35]">İlkin təhlil</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#64748B]">AI təklifi, istifadəçi yoxlaması ilə</p>
                </div>
                <div className="rounded-xl border border-[#E2E8E8] bg-white p-4">
                  <FileCheck2 className="h-5 w-5 text-[#087F70]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-[#102A35]">İzləmə kodu</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#64748B]">Müraciət statusunu yoxlamaq üçün</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.06em] text-[#087F70]">Əsas prinsiplərimiz</p>
              <h2 className="font-display mt-2 text-3xl font-bold tracking-[-0.03em] text-[#102A35] sm:text-4xl">Aydın, faydalı və insan nəzarətində</h2>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-[#64748B] sm:text-base">
              Platforma müraciətin hazırlanmasına və izlənməsinə kömək edir; AI nəticəsi rəsmi qərar deyil.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, eyebrow, title, text: description }) => (
              <article key={eyebrow} className="civic-surface rounded-2xl p-6 sm:p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#E6F5F1] text-[#087F70]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.06em] text-[#087F70]">{eyebrow}</p>
                <h3 className="font-display mt-2 text-xl font-semibold tracking-[-0.02em] text-[#102A35]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#475569]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="proses" className="border-y border-[#E2E8E8] bg-white/80">
          <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.06em] text-[#087F70]">Müraciət axını</p>
              <h2 className="font-display mt-2 text-3xl font-bold tracking-[-0.03em] text-[#102A35] sm:text-4xl">Problemdən izləmə kodunadək</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <article key={step.title} className="rounded-2xl border border-[#E2E8E8] bg-[#F7F9FB]/90 p-6">
                  <span className="font-mono-tabular text-2xl font-bold text-[#087F70]">0{index + 1}</span>
                  <h3 className="font-display mt-4 text-lg font-semibold text-[#102A35]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#475569]">{step.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#087F70] p-6 text-white sm:flex-row sm:items-center sm:p-8">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-white/80">İctimai iştirak</p>
                <h2 className="font-display mt-1 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Şəhərinizdə gördüyünüz problemi paylaşın.</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/85">Müraciət yaradın və verilən kodu saxlayaraq sonrakı yenilikləri izləyin.</p>
              </div>
              <Link href="/muraciet" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#07564F] transition-colors hover:bg-[#E6F5F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Müraciət yarat <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.06em] text-[#087F70]">Məxfilik və nəzarət</p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-[-0.03em] text-[#102A35]">Qərar insanda qalır</h2>
          </div>
          <div className="mt-7 rounded-2xl border border-[#E2E8E8] bg-white/90 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E6F5F1] text-[#087F70]"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h3 className="font-display text-lg font-semibold text-[#102A35]">AI təklifini yoxlayın</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">Təsnifat və mətn təklifi avtomatik yarana bilər, amma göndərməzdən əvvəl məlumatları nəzərdən keçirib redaktə edə bilərsiniz. İzləmə kodunu müraciətinizə baxmaq üçün təhlükəsiz saxlayın.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

