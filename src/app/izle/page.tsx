'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Check,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CategoryIcon, StatusBadge } from '@/components/StatusBadge';
import {
  CATEGORIES,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatAzDate,
  type ComplaintRecord,
} from '@/lib/types';

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('kod') ?? '';

  const [codeInput, setCodeInput] = useState(initialCode);
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(initialCode.trim()));
  const [notFound, setNotFound] = useState(false);
  const [searchedCode, setSearchedCode] = useState(
    initialCode.trim().toUpperCase().replace(/^#/, '')
  );

  const lookupCode = useCallback(async (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase().replace(/^#/, '');
    if (!clean) return;

    setCodeInput(clean);
    setLoading(true);
    setNotFound(false);
    setSearchedCode(clean);

    try {
      const res = await fetch(`/api/complaints?code=${encodeURIComponent(clean)}`);
      if (!res.ok) {
        setComplaint(null);
        setNotFound(true);
        return;
      }
      const data = (await res.json()) as { complaint?: ComplaintRecord };
      if (data.complaint) {
        setComplaint(data.complaint);
      } else {
        setComplaint(null);
        setNotFound(true);
      }
    } catch {
      setComplaint(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const clean = initialCode.trim().toUpperCase().replace(/^#/, '');
    if (!clean) return;
    let active = true;
    fetch(`/api/complaints?code=${encodeURIComponent(clean)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { complaint?: ComplaintRecord } | null) => {
        if (!active) return;
        if (data?.complaint) {
          setComplaint(data.complaint);
          setNotFound(false);
        } else {
          setComplaint(null);
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setComplaint(null);
        setNotFound(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void lookupCode(codeInput);
  };

  const categoryMeta = complaint
    ? CATEGORIES.find((c) => c.id === complaint.category)
    : undefined;
  const priorityMeta = complaint ? PRIORITY_CONFIG[complaint.priority] : undefined;
  const statusMeta = complaint ? STATUS_CONFIG[complaint.status] : undefined;

  return (
    <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header & Search */}
      <div className="border-b border-[#E2E8E8] pb-6">
        <p className="text-sm font-semibold text-[#087F70]">Müraciət izləmə</p>
        <h1 className="font-display mt-1.5 text-3xl font-bold tracking-[-0.025em] text-[#102A35] sm:text-4xl">
          Müraciətinizin statusunu yoxlayın
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#475569] sm:text-base">
          Müraciət göndərildikdə təqdim edilən izləmə kodunu daxil edərək icra mərhələlərini
          tarixçə ilə izləyə bilərsiniz.
        </p>
      </div>

      <section className="civic-surface mt-6 rounded-[14px] p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="İzləmə kodu (MZB- ilə başlayır)"
              aria-label="İzləmə kodu"
              className="civic-input font-mono-tabular h-12 w-full pr-4 pl-10 text-sm tracking-wide uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !codeInput.trim()}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#087F70] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#06695E] disabled:opacity-50"
          >
            {loading ? 'Axtarılır...' : 'Axtar'}
          </button>
        </form>

        <div className="mt-4 border-t border-[#E2E8E8] pt-3.5 text-xs leading-relaxed text-[#64748B]">
          Yeni izləmə kodu MZB- prefiksindən sonra 32 simvoldan ibarətdir. Köhnə MZB-XXXXXX kodları da qəbul olunur.
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className="civic-surface mt-6 space-y-4 rounded-[14px] p-6">
          <div className="h-6 w-48 animate-pulse rounded bg-[#E2E8E8]" />
          <div className="h-20 w-full animate-pulse rounded bg-[#F2F4F6]" />
          <div className="h-32 w-full animate-pulse rounded bg-[#F2F4F6]" />
        </div>
      )}

      {/* Not Found State */}
      {!loading && notFound && (
        <div className="civic-surface mt-6 rounded-[14px] p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#FEE2E2] text-[#B91C1C]">
            <XCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-display mt-4 text-xl font-semibold text-[#102A35]">
            Müraciət tapılmadı
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
            <span className="font-mono-tabular font-semibold text-[#102A35]">
              {searchedCode}
            </span>{' '}
            koduna uyğun müraciət tapılmadı. Kodu müraciət göndərildikdən sonra verilən kodla
            tutuşdurub yenidən yoxlayın.
          </p>
          <Link
            href="/muraciet"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#087F70] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#06695E]"
          >
            <span>Yeni müraciət yarat</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Found Complaint + Vertical Progress Rail */}
      {!loading && complaint && statusMeta && (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
          {/* Left: Details & AI Evidence */}
          <div className="space-y-6 lg:col-span-7">
            <section className="civic-surface rounded-[14px] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8E8] pb-4">
                <div>
                  <span className="font-mono-tabular text-sm font-bold text-[#087F70]">
                    #{complaint.tracking_code}
                  </span>
                  <h2 className="font-display mt-1 text-xl font-semibold text-[#102A35]">
                    {categoryMeta?.label ?? complaint.category}
                  </h2>
                </div>
                <StatusBadge status={complaint.status} />
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#102A35]">
                {complaint.description}
              </p>

              <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-[#E2E8E8] pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-[#64748B]">Məkan</dt>
                  <dd className="mt-1 flex items-start gap-1.5 font-medium text-[#102A35]">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#087F70]" aria-hidden="true" />
                    <span>
                      {complaint.location}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-[#64748B]">Təklif olunan qurum</dt>
                  <dd className="mt-1 flex items-start gap-1.5 font-medium text-[#102A35]">
                    <ShieldCheck
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#087F70]"
                      aria-hidden="true"
                    />
                    <span>{complaint.department}</span>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-[#64748B]">Təcililik</dt>
                  <dd className="mt-1">
                    {priorityMeta && (
                      <span
                        className="inline-flex rounded px-2 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: priorityMeta.badgeBg,
                          color: priorityMeta.badgeText,
                        }}
                      >
                        {priorityMeta.label}
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-[#64748B]">Qeydiyyat tarixi</dt>
                  <dd className="font-mono-tabular mt-1 flex items-center gap-1.5 text-xs font-medium text-[#102A35]">
                    <Clock className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
                    <span>{formatAzDate(complaint.created_at)}</span>
                  </dd>
                </div>
              </dl>
            </section>

            {/* AI Analysis Summary Card */}
            {complaint.analysis && (
              <section className="rounded-[14px] border border-[#087F70]/25 bg-[#E6F5F1] p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#087F70]">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Süni intellekt tərəfindən ilkin təhlil</span>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold text-[#07564F]">
                    {Math.round(complaint.analysis.confidence * 100)}% uyğunluq
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#102A35]">
                  {complaint.analysis.problem_type}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#3E4946]">
                  {complaint.analysis.description}
                </p>
                {complaint.analysis.tags.length > 0 && (
                  <p className="mt-2.5 text-xs font-medium text-[#07564F]">
                    {complaint.analysis.tags.join(' · ')}
                  </p>
                )}
              </section>
            )}

            {/* Before/After Comparison Result */}
            {complaint.comparison && (
              <section className="civic-surface rounded-[14px] p-5">
                <div className="flex items-center justify-between gap-2 border-b border-[#E2E8E8] pb-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={complaint.category} className="h-4 w-4 text-[#087F70]" />
                    <h3 className="font-display text-sm font-semibold text-[#102A35]">
                      Əvvəl / Sonra vizual təsdiq nəticəsi
                    </h3>
                  </div>
                  <span className="font-mono-tabular text-xs font-bold text-[#087F70]">
                    {complaint.comparison.resolution_score}/100 bal
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#475569]">
                  {complaint.comparison.summary}
                </p>
              </section>
            )}
          </div>

          {/* Right: Vertical Progress Rail */}
          <aside className="civic-surface rounded-[14px] p-5 sm:p-6 lg:col-span-5">
            <h3 className="font-display text-base font-semibold text-[#102A35]">
              İcra tarixçəsi
            </h3>
            <p className="mt-1 text-xs text-[#64748B]">{statusMeta.description}</p>

            <ol className="mt-6 space-y-0">
              {complaint.timeline.map((event, idx) => {
                const isLast = idx === complaint.timeline.length - 1;
                const isActive = isLast && complaint.status !== 'resolved' && complaint.status !== 'rejected';
                const isRejected = event.status === 'rejected';

                return (
                  <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* 2px Vertical Guide */}
                    {!isLast && (
                      <span
                        className="absolute top-7 left-[11px] bottom-0 w-[2px] bg-[#087F70]"
                        aria-hidden="true"
                      />
                    )}

                    {/* Node */}
                    <div
                      className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                        isRejected
                          ? 'bg-[#DC2626] text-white'
                          : isActive
                            ? 'bg-[#087F70] text-white ring-4 ring-[#087F70]/20'
                            : 'bg-[#087F70] text-white'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#102A35]">{event.title}</p>
                        <span className="font-mono-tabular text-[11px] text-[#64748B]">
                          {formatAzDate(event.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#475569]">{event.note}</p>
                      <p className="mt-1 text-[11px] font-medium text-[#64748B]">
                        Məsul: {event.actor}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 border-t border-[#E2E8E8] pt-4">
              <Link
                href={`/muqayise?kod=${complaint.tracking_code}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8E8] bg-[#F7F9FB] px-4 py-2.5 text-xs font-semibold text-[#102A35] transition-colors hover:bg-[#F1F5F5]"
              >
                <span>Bu müraciət üçün Əvvəl / Sonra yoxla</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

export default function IzlePage() {
  return (
    <div className="site-page flex min-h-screen flex-col text-[#102A35]">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-10">
            <div className="h-40 animate-pulse rounded-[14px] bg-white border border-[#E2E8E8]" />
          </main>
        }
      >
        <TrackingContent />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
