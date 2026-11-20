'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { CategoryIcon, StatusBadge } from './StatusBadge';
import type { CategoryId, ComplaintStatus } from '@/lib/types';

type PreviewCase = {
  id: string;
  code: string;
  tabLabel: string;
  category: CategoryId;
  title: string;
  district: string;
  address: string;
  status: ComplaintStatus;
  confidence: number;
  department: string;
  summary: string;
  tags: string[];
  step: number;
};

const PREVIEW_CASES: PreviewCase[] = [
  {
    id: 'yol',
    code: 'AZ-8942-B',
    tabLabel: 'Yol təmiri',
    category: 'yol',
    title: 'Asfalt örtüyünün çökməsi',
    district: 'Nəsimi rayonu',
    address: 'Cəfər Cabbarlı küçəsi 44',
    status: 'resolved',
    confidence: 94,
    department: 'Azərbaycan Avtomobil Yolları Dövlət Agentliyi',
    summary:
      'Sağ hərəkət zolağında 60 sm diametrində asfalt çökməsi müəyyən edildi. İcra sonrası bərpa təsdiqləndi.',
    tags: ['Asfalt çuxuru', 'Hərəkət zolağı', 'Yüksək təcililik'],
    step: 4,
  },
  {
    id: 'isiq',
    code: 'AZ-7314-K',
    tabLabel: 'İşıqlandırma',
    category: 'isiq',
    title: 'Küçə işıqlandırmasının nasazlığı',
    district: 'Yasamal rayonu',
    address: 'Şərifzadə küçəsi 118',
    status: 'in_progress',
    confidence: 91,
    department: 'Bakı Şəhər İşıqlandırma İdarəsi',
    summary:
      'Piyada keçidi yaxınlığında 3 işıq dirəyinin enerji təchizatında fasilə qeydə alınıb. Sahə qrupu icradadır.',
    tags: ['Küçə fənəri', 'Piyada keçidi', 'Elektrik xətti'],
    step: 3,
  },
  {
    id: 'su',
    code: 'AZ-6105-M',
    tabLabel: 'Su xətti',
    category: 'su',
    title: 'Su xəttində aktiv sızma',
    district: 'Səbail rayonu',
    address: 'Bülbül prospekti 19',
    status: 'open',
    confidence: 96,
    department: 'Birləşmiş Su Təchizatı Xidməti',
    summary:
      'Səki sərhədindən təzyiqli su sızması aşkarlandı. Operativ qəza briqadasına yönləndirilib.',
    tags: ['Su sızması', 'Boru xətti', 'Kritik'],
    step: 2,
  },
];

const STEPS = ['Qəbul', 'AI Təhlil', 'Yönləndirmə', 'İcra', 'Həll'];

export function HeroInteractivePreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = PREVIEW_CASES[activeIndex];

  return (
    <div className="civic-surface flex h-full flex-col justify-between rounded-[14px] p-5 sm:p-6">
      <div>
        {/* Segmented Case Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8E8] pb-4">
          <div className="flex items-center gap-1 rounded-lg bg-[#F2F4F6] p-1">
            {PREVIEW_CASES.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  idx === activeIndex
                    ? 'bg-white text-[#102A35] shadow-xs'
                    : 'text-[#64748B] hover:text-[#102A35]'
                }`}
              >
                {item.tabLabel}
              </button>
            ))}
          </div>

          <span className="font-mono-tabular text-xs font-semibold text-[#087F70]">
            #{current.code}
          </span>
        </div>

        {/* Case Header */}
        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#E2E8E8] bg-[#F7F9FB] text-[#087F70]">
              <CategoryIcon category={current.category} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-[#102A35]">
                {current.title}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" aria-hidden="true" />
                <span>
                  {current.district} · {current.address}
                </span>
              </p>
            </div>
          </div>
          <StatusBadge status={current.status} />
        </div>

        {/* Preliminary AI Analysis Banner */}
        <div className="mt-5 rounded-[12px] border border-[#087F70]/25 bg-[#E6F5F1] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#087F70]">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Süni intellekt tərəfindən ilkin təhlil</span>
            </div>
            <span className="font-mono-tabular text-xs font-semibold text-[#07564F]">
              {current.confidence}% uyğunluq
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#102A35]">{current.summary}</p>
          <p className="mt-2.5 text-xs text-[#3E4946]">
            {current.tags.join(' · ')}
          </p>
        </div>

        {/* Assigned Department */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#E2E8E8] bg-[#F7F9FB] px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#087F70]" aria-hidden="true" />
            <span>Məsul qurum:</span>
          </div>
          <span className="truncate text-right text-xs font-semibold text-[#102A35]">
            {current.department}
          </span>
        </div>
      </div>

      {/* Mini Progress Rail & Direct Link */}
      <div className="mt-5 border-t border-[#E2E8E8] pt-4">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((label, idx) => {
            const done = idx <= current.step;
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full items-center">
                  <div
                    className={`h-[2px] flex-1 ${
                      idx === 0 ? 'bg-transparent' : done ? 'bg-[#087F70]' : 'bg-[#E2E8E8]'
                    }`}
                  />
                  <div
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                      done
                        ? 'bg-[#087F70] text-white'
                        : 'border border-[#E2E8E8] bg-white text-[#94A3B8]'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : idx + 1}
                  </div>
                  <div
                    className={`h-[2px] flex-1 ${
                      idx === STEPS.length - 1
                        ? 'bg-transparent'
                        : idx < current.step
                          ? 'bg-[#087F70]'
                          : 'bg-[#E2E8E8]'
                    }`}
                  />
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    done ? 'text-[#102A35]' : 'text-[#94A3B8]'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-[#64748B]">
            Canlı izləmə nümunəsi
          </span>
          <Link
            href={`/izle?kod=${current.code}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#087F70] transition-colors hover:text-[#06695E]"
          >
            <span>Tam tarixçəyə bax</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
