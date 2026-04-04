import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400','600','700','800'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm', weight: ['300','400','500'] })

export const metadata: Metadata = {
  title: 'ASAN AI Hub — Müraciət',
  description: 'İnfrastruktur problemlərini bildirin, AI analiz etsin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-dm antialiased">{children}</body>
    </html>
  )
}
