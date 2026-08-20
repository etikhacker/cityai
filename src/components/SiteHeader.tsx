'use client'

import Link from 'next/link'
import { useState } from 'react'

const navigation = [
  { href: '/#imkanlar', label: 'İmkanlar' },
  { href: '/#proses', label: 'Necə işləyir' },
  { href: '/izle', label: 'İzləmə' },
]

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 via-teal-300 to-emerald-300 text-xs font-black tracking-tight text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,.22)] transition-transform duration-200 group-hover:-rotate-6">
            AI
          </span>
          <span className="font-syne text-[18px] font-bold tracking-tight text-white">
            City<span className="text-teal-300">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Əsas naviqasiya">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link href="/muraciet" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-teal-200 active:scale-[.97]">
            Problemi bildir
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white transition-colors hover:bg-white/10 md:hidden"
          aria-label={isOpen ? 'Menyunu bağla' : 'Menyunu aç'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="text-xl leading-none">{isOpen ? '×' : '☰'}</span>
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-white/10 bg-[#091625] px-5 py-4 md:hidden" aria-label="Mobil naviqasiya">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/10">
                {item.label}
              </Link>
            ))}
            <Link href="/muraciet" onClick={() => setIsOpen(false)} className="mt-2 rounded-xl bg-teal-300 px-4 py-3 text-center text-sm font-bold text-slate-950">
              Problemi bildir
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
