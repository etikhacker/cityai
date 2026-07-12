'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <motion.div
          className="fixed top-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'rgba(0, 212, 170, 0.3)', filter: 'blur(120px)' }}
          animate={mounted ? {
            x: [0, 30, 0],
            y: [0, 20, 0],
          } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="fixed bottom-[-100px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'rgba(79, 140, 255, 0.2)', filter: 'blur(120px)' }}
          animate={mounted ? {
            x: [0, -30, 0],
            y: [0, -20, 0],
          } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(0,212,170,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,170,0.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Navbar */}
      <nav className="relative z-20 border-b border-subtle px-6 py-4 backdrop-blur-md bg-background/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 rounded-lg gradient-teal-blue flex items-center justify-center font-bold text-background text-sm">AI</div>
            <span className="font-syne font-bold text-xl">City<span className="gradient-text">AI</span></span>
          </motion.div>
          <div className="flex items-center gap-8">
            <a href="#haqqinda" className="text-sm text-muted hover:text-primary transition-colors hidden md:block font-medium">Haqqında</a>
            <a href="#xususiyyetler" className="text-sm text-muted hover:text-primary transition-colors hidden md:block font-medium">Xüsusiyyətlər</a>
            <a href="#nece" className="text-sm text-muted hover:text-primary transition-colors hidden md:block font-medium">Necə işləyir</a>
            <motion.button
              onClick={() => router.push('/muraciet')}
              className="px-6 py-2 rounded-lg gradient-teal-blue text-background font-bold text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Müraciət et
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* Hero Section */}
        <section className="py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/[0.07] text-primary text-xs mb-8">
            <motion.span className="w-2 h-2 rounded-full bg-primary" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            ASAN AI Hub Challenge 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-syne font-bold mb-8 leading-tight">
            Şəhər problemlərini<br />
            <span className="gradient-text">AI ilə həll edək</span>
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
            CityAI — vətəndaşların şəhər infrastruktur problemlərini şəkil ilə bildirməsi, Claude AI vasitəsilə
            avtomatik analiz edilməsi və icra nəticələrinin real-time yoxlanılması üçün akıllı platforma.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={() => router.push('/muraciet')}
              className="px-8 py-4 rounded-lg gradient-teal-blue text-background font-bold text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Müraciət et →
            </motion.button>
            <motion.button
              onClick={() => router.push('/izle')}
              className="px-8 py-4 rounded-lg border border-subtle text-foreground font-bold text-base hover:bg-card transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔍 Müraciəti izlə
            </motion.button>
            <motion.a
              href="#nece"
              className="px-8 py-4 rounded-lg border border-subtle font-bold text-base hover:bg-card transition-colors text-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Necə işləyir?
            </motion.a>
          </div>
        </section>

        {/* Stats Section */}
        <motion.section
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          {[
            { value: '80%+', label: 'Avtomatik təsnifat dəqiqliyi' },
            { value: '3', label: 'AI analiz modulu' },
            { value: '24/7', label: 'Sistem əlçatanlığı' },
            { value: '100%', label: 'Şəffaf hesabat' },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="card-elevated p-6 text-center"
              variants={itemVariants}
              whileHover={{ translateY: -4 }}
            >
              <p className="text-3xl md:text-4xl font-bold mb-2 text-primary">{s.value}</p>
              <p className="text-xs md:text-sm text-muted">{s.label}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* About Section */}
        <motion.section id="haqqinda" className="mb-32 scroll-mt-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div variants={itemVariants}>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Haqqında</p>
              <h2 className="text-4xl font-syne font-bold mb-8">ASAN Müraciət sistemini daha ağıllı edək</h2>
              <div className="space-y-5">
                <p className="text-muted leading-relaxed">
                  ASAN müraciət sisteminə daxil olan müraciətlərin böyük hissəsi şəkil və video ilə müşayiət olunur.
                  Hazırda bu vizual materiallar əməkdaşlar tərəfindən əl ilə yoxlanılır — bu isə vaxt itkisinə və
                  subyektivliyə gətirib çıxarır.
                </p>
                <p className="text-muted leading-relaxed">
                  CityAI bu prosesi avtomatlaşdırır: vətəndaşın yüklədiyi şəkil Claude Vision AI tərəfindən
                  saniyələr içində analiz edilir, problem növü müəyyənləşdirilir, kateqoriyaya salınır və
                  prioritet təyin olunur.
                </p>
                <p className="text-muted leading-relaxed">
                  İcra mərhələsində qurum tərəfindən yüklənən nəticə şəkli ilkin müraciətlə avtomatik
                  müqayisə edilir — problemin həqiqətən həll olunub-olmadığı yoxlanılır.
                </p>
              </div>
            </motion.div>

            <motion.div className="space-y-4" variants={itemVariants}>
              {[
                { icon: '⚡', title: 'Sürətli emal', desc: 'Manual yoxlama əvəzinə saniyələr içində AI analizi' },
                { icon: '🎯', title: 'Obyektiv qərar', desc: 'İnsan faktorundan qaynaqlanan subyektivliyin aradan qaldırılması' },
                { icon: '🔍', title: 'Şəffaflıq', desc: 'Hər müraciətin izləmə kodu ilə real vaxt statusu' },
                { icon: '🔒', title: 'Təhlükəsizlik', desc: 'Supabase RLS ilə məlumat məxfiliyi təmin edilir' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="card-elevated p-5"
                  whileHover={{ translateX: 8 }}
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(0, 212, 170, 0.1)', border: '1px solid rgba(0, 212, 170, 0.2)' }}>
                      {f.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{f.title}</p>
                      <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section id="xususiyyetler" className="mb-32 scroll-mt-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Xüsusiyyətlər</p>
            <h2 className="text-4xl font-syne font-bold">Sistemin imkanları</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📸', title: 'Şəkil / Video analizi', desc: 'Claude Vision API ilə avtomatik problem aşkarlanması. Problem növü, şiddəti və ətraflı təsvir müəyyən edilir.' },
              { icon: '🗂️', title: 'Avtomatik təsnifat', desc: 'Müraciət kateqoriyaya salınır, təcililik dərəcəsi avtomatik təyin olunur.' },
              { icon: '✅', title: 'Həll yoxlaması', desc: 'Before/After şəkil müqayisəsi ilə icra nəzarəti. Uyğunsuzluq halında xəbərdarlıq.' },
              { icon: '📍', title: 'GPS məkan', desc: 'Müraciətin GPS koordinatları avtomatik əldə edilir.' },
              { icon: '📊', title: 'Admin panel', desc: 'Bütün müraciətlər status və prioritetə görə idarə olunur.' },
              { icon: '🔔', title: 'İzləmə kodu', desc: 'Hər müraciətə unikal izləmə kodu verilir.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                className="card-elevated p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ translateY: -8 }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-5" style={{ background: 'rgba(0, 212, 170, 0.1)', border: '1px solid rgba(0, 212, 170, 0.3)' }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-3">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section id="nece" className="mb-32 scroll-mt-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Proses</p>
            <h2 className="text-4xl font-syne font-bold">Necə işləyir?</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div className="card-elevated p-8" variants={itemVariants}>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-6">Vətəndaş üçün</p>
              <div className="space-y-5">
                {[
                  'Şəkil və ya video çəkib sistemə yükləyir',
                  'AI problemi analiz edib kateqoriya və təsvir təklif edir',
                  'GPS ilə yer məlumatı avtomatik əldə edilir',
                  'Müraciət göndərilir, izləmə kodu alınır',
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-primary" style={{ background: 'rgba(0, 212, 170, 0.1)', border: '2px solid rgba(0, 212, 170, 0.3)' }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground pt-1.5">{s}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="card-elevated p-8" variants={itemVariants}>
              <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-6">Admin / Qurum üçün</p>
              <div className="space-y-5">
                {[
                  'Admin paneldə bütün müraciətlər siyahısı görünür',
                  'Müraciət seçilir, AI analiz nəticəsi oxunur',
                  'Problem həll edildikdən sonra nəticə şəkli yüklənir',
                  'AI before/after müqayisə aparır, uyğunsuzluq varsa xəbərdarlıq edir',
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-accent" style={{ background: 'rgba(79, 140, 255, 0.1)', border: '2px solid rgba(79, 140, 255, 0.3)' }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground pt-1.5">{s}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          className="mb-32"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="card-elevated p-12 md:p-16 text-center backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.08), rgba(79,140,255,0.08))' }}>
            <h2 className="text-3xl md:text-4xl font-syne font-bold mb-6">Müraciətinizi indi göndərin</h2>
            <p className="text-muted mb-10 max-w-2xl mx-auto text-lg">Şəhərdə gördüyünüz problemi bildirin — AI sistemi saniyələr içində analiz edəcək və şəhər idarəsinə yönləndirəcək</p>
            <motion.button
              onClick={() => router.push('/muraciet')}
              className="px-10 py-4 rounded-lg gradient-teal-blue text-background font-bold text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              İndi müraciət et →
            </motion.button>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-subtle py-12 text-center mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm text-muted mb-6">Şəhərin gələcəyini birlikdə inşa edək</p>
          <p className="text-xs text-muted/60">CityAI · ASAN AI Hub Challenge 2026 · Ömər Babayev</p>
          <div className="flex justify-center gap-6 mt-6">
            <motion.button
              onClick={() => router.push('/muraciet')}
              className="text-xs text-muted hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              Müraciət
            </motion.button>
            <motion.button
              onClick={() => router.push('/izle')}
              className="text-xs text-muted hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              İzlə
            </motion.button>
            <motion.button
              onClick={() => router.push('/admin')}
              className="text-xs text-muted hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              Admin
            </motion.button>
          </div>
        </div>
      </footer>
    </main>
  )
}
