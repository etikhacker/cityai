'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Ana səhifə' },
  { href: '/#proses', label: 'Necə işləyir?' },
  { href: '/muraciet', label: 'Müraciət et' },
  { href: '/izle', label: 'Müraciətimi izlə' },
  { href: '/profil', label: 'İzləmə kodları' },
  { href: '/haqqimizda', label: 'Haqqımızda' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return false;
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#E2E8E8] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="font-display inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-lg font-bold tracking-[-0.02em] text-[#102A35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F70]"
        >
          <Image src="/cityai-icon.png" alt="" width={40} height={44} priority className="h-10 w-10 rounded-lg object-cover" />
          <span>CityAI</span>
        </Link>

        {/* Zone 2: Clean Inline Navigation Links */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Əsas naviqasiya">
          {NAV_LINKS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative shrink-0 whitespace-nowrap py-1 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F70] ${
                  active ? 'text-[#087F70]' : 'text-[#475569] hover:text-[#102A35]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-0 -bottom-[21px] h-[2px] bg-[#087F70]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/muraciet"
            className="hidden h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#087F70] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#06695E] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#087F70]/30 md:inline-flex"
          >
            <span>Müraciət et</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E2E8E8] bg-white text-[#102A35] transition-colors hover:bg-[#F1F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F70] md:hidden"
            aria-label={mobileOpen ? 'Menyunu bağla' : 'Menyunu aç'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          className="border-b border-[#E2E8E8] bg-white px-4 py-4 shadow-[0_8px_24px_-4px_rgba(16,42,53,0.08)] md:hidden"
          aria-label="Mobil naviqasiya"
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-1">
            {NAV_LINKS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#E6F5F1] text-[#087F70]'
                      : 'text-[#102A35] hover:bg-[#F1F5F5]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/muraciet"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-lg bg-[#087F70] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#06695E]"
            >
              <span>Müraciət et</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

