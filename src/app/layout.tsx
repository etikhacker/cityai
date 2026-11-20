import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { SiteScrollReveal } from '@/components/SiteScrollReveal'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-display', weight: ['500', '600', '700'], display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', weight: ['400', '500', '600'], display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-mono', weight: ['400', '500', '600'], display: 'swap' })

export const metadata: Metadata = {
  title: 'CityAI — Ağıllı şəhər problemi analizi',
  description: 'Şəhər problemlərini şəkillə bildirin, Gemini ilə strukturlaşdırılmış analiz əldə edin.',
  icons: { icon: '/cityai-icon.png', apple: '/cityai-icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#F7F9FB] text-[#102A35] antialiased selection:bg-[#E6F5F1] selection:text-[#087F70]">
        {children}
        <SiteScrollReveal />
      </body>
    </html>
  )
}
