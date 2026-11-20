import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E2E8E8] bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <div className="font-display inline-flex items-center gap-2 text-base font-bold tracking-[-0.02em] text-[#102A35]">
            <span
              className="grid h-6 w-6 place-items-center rounded-md bg-[#087F70] text-[10px] font-bold text-white"
              aria-hidden="true"
            >
              CA
            </span>
            <span>CityAI</span>
          </div>
          <p className="mt-2 text-sm text-[#64748B]">
            Şəhər infrastruktur problemlərinin şəffaf qəbulu, ilkin təhlili və icra nəzarəti.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-[#475569]"
          aria-label="Alt naviqasiya"
        >
          <Link href="/muraciet" className="transition-colors hover:text-[#087F70]">
            Müraciət yarat
          </Link>
          <Link href="/izle" className="transition-colors hover:text-[#087F70]">
            Müraciəti izlə
          </Link>
          <Link href="/muqayise" className="transition-colors hover:text-[#087F70]">
            Əvvəl / Sonra müqayisə
          </Link>
          <Link href="/admin" className="transition-colors hover:text-[#087F70]">
            Operator paneli
          </Link>
        </nav>
      </div>
    </footer>
  );
}
