import Link from 'next/link';
import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E2E8E8] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-display inline-flex items-center gap-2 text-base font-bold tracking-[-0.02em] text-[#102A35]">
              <Image src="/cityai-icon.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md object-cover" />
              <span>CityAI</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#64748B]">
              Vətəndaşların şəhər problemlərini bildirməsi və müraciətlərin gedişini izləməsi üçün platforma.
            </p>
          </div>

          <nav className="flex flex-col items-start gap-2.5 text-sm font-medium text-[#475569]" aria-label="Şəhər xidmətləri">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#102A35]">Şəhər xidmətləri</p>
            <Link href="/muraciet" className="transition-colors hover:text-[#087F70]">Problemi bildir</Link>
            <Link href="/izle" className="transition-colors hover:text-[#087F70]">Müraciətin statusu</Link>
            <Link href="/muqayise" className="transition-colors hover:text-[#087F70]">Əvvəl / Sonra müqayisə</Link>
          </nav>

          <nav className="flex flex-col items-start gap-2.5 text-sm font-medium text-[#475569]" aria-label="Platforma haqqında">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#102A35]">Məlumat</p>
            <Link href="/haqqimizda" className="transition-colors hover:text-[#087F70]">Layihə haqqında</Link>
            <Link href="/#imkanlar" className="transition-colors hover:text-[#087F70]">Platforma imkanları</Link>
            <Link href="/#proses" className="transition-colors hover:text-[#087F70]">Necə işləyir?</Link>
          </nav>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#102A35]">Məxfilik və AI</p>
            <p className="text-sm leading-relaxed text-[#64748B]">
              İzləmə kodu müraciətin statusu və tarixçəsini yoxlamağa imkan verir. AI təhlili ilkin təklifdir və istifadəçi tərəfindən nəzərdən keçirilə bilər.
            </p>
          </div>
        </div>
        <div className="mt-9 flex flex-col gap-2 border-t border-[#E2E8E8] pt-5 text-xs text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CityAI. Bütün hüquqlar qorunur.</span>
          <span>Şəhər problemlərinin bildirilməsi və izlənməsi</span>
        </div>
      </div>
    </footer>
  );
}

