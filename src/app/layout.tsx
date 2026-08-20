import type { Metadata } from 'next'
import { Averia_Serif_Libre, DM_Sans, Syne } from 'next/font/google'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '600', '700', '800'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm', weight: ['400', '500', '700'] })
const averia = Averia_Serif_Libre({ subsets: ['latin'], variable: '--font-averia', weight: ['300', '400', '700'] })

export const metadata: Metadata = {
  title: 'CityAI — Ağıllı şəhər problemi analizi',
  description: 'Şəhər problemlərini şəkillə bildirin, Gemini ilə strukturlaşdırılmış analiz əldə edin.',
  icons: { icon: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${syne.variable} ${dmSans.variable} ${averia.variable}`}>
      <body className="font-dm antialiased">{children}</body>
    </html>
  )
}
