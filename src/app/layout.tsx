import type { Metadata } from 'next'
import { SiteScrollReveal } from '@/components/SiteScrollReveal'
import './globals.css'

export const metadata: Metadata = {
  title: 'CityAI — Ağıllı şəhər problemi analizi',
  description: 'Şəhər problemlərini şəkillə bildirin, Gemini ilə strukturlaşdırılmış analiz əldə edin.',
  icons: { icon: '/cityai-icon.png', apple: '/cityai-icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body className="min-h-screen bg-[#F7F9FB] text-[#102A35] antialiased selection:bg-[#E6F5F1] selection:text-[#087F70]">
        {children}
        <SiteScrollReveal />
      </body>
    </html>
  )
}
