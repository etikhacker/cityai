'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitCompareArrows,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import type { CityComparison, ComplaintRecord } from '@/lib/types';

function CompareContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('kod') ?? '';

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');

  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');

  const [comparing, setComparing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<CityComparison | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data: { complaints?: ComplaintRecord[] }) => {
        if (!active || !data.complaints) return;
        setComplaints(data.complaints);
        if (initialCode) {
          const match = data.complaints.find(
            (c) => c.tracking_code.toUpperCase() === initialCode.toUpperCase()
          );
          if (match) setSelectedComplaintId(match.id);
        }
      })
      .catch(() => {
        // Ignore non-critical list fetch failure
      });
    return () => {
      active = false;
    };
  }, [initialCode]);

  const handleFile = (file: File, side: 'before' | 'after') => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Zəhmət olmasa yalnız şəkil faylı seçin.');
      return;
    }
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = (e.target?.result as string) || '';
      if (side === 'before') {
        setBeforeFile(file);
        setBeforePreview(src);
      } else {
        setAfterFile(file);
        setAfterPreview(src);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSide = (side: 'before' | 'after') => {
    if (side === 'before') {
      setBeforeFile(null);
      setBeforePreview('');
    } else {
      setAfterFile(null);
      setAfterPreview('');
    }
  };

  const runComparison = async () => {
    if (!beforeFile || !afterFile) return;
    setComparing(true);
    setErrorMsg('');
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('before', beforeFile);
      fd.append('after', afterFile);
      if (selectedComplaintId) {
        fd.append('muraciet_id', selectedComplaintId);
      }

      const res = await fetch('/api/compare', { method: 'POST', body: fd });
      const data = (await res.json()) as {
        success?: boolean;
        result?: CityComparison;
        error?: string;
      };

      if (!res.ok || !data.success || !data.result) {
        setErrorMsg(data.error || 'Müqayisə zamanı xəta baş verdi.');
        return;
      }

      setResult(data.result);
    } catch {
      setErrorMsg('Server ilə əlaqə qurmaq alınmadı.');
    } finally {
      setComparing(false);
    }
  };

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId);

  return (
    <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-[#E2E8E8] pb-6">
        <p className="text-sm font-semibold text-[#087F70]">Vizual həll yoxlaması</p>
        <h1 className="font-display mt-1.5 text-3xl font-bold tracking-[-0.025em] text-[#102A35] sm:text-4xl">
          Əvvəl və Sonra müqayisəsi
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#475569] sm:text-base">
          İlkin problem fotosunu icra sonrası foto ilə müqayisə edin. Süni intellekt eyni
          məkanı və problemin həll səviyyəsini yoxlayır.
        </p>
      </div>

      {/* Optional Complaint Link */}
      <section className="civic-surface mt-6 rounded-[14px] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label
              htmlFor="link-complaint"
              className="block text-[13px] font-semibold text-[#102A35]"
            >
              Müraciətə bağla (istəyə bağlı)
            </label>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Seçildikdə təsdiq nəticəsi birbaşa həmin müraciətin tarixçəsinə yazılır.
            </p>
          </div>
          <select
            id="link-complaint"
            value={selectedComplaintId}
            onChange={(e) => setSelectedComplaintId(e.target.value)}
            className="civic-input h-11 w-full px-3 text-sm sm:w-80"
          >
            <option value="">Yalnız sərbəst müqayisə et</option>
            {complaints.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.tracking_code} — {c.district}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Two-Column Dropzones */}
      <section className="mt-6 grid gap-5 md:grid-cols-2">
        {(
          [
            {
              side: 'before' as const,
              title: 'Əvvəlki vəziyyət',
              subtitle: 'Problemin ilkin fotoşəkli',
              preview: beforePreview,
            },
            {
              side: 'after' as const,
              title: 'Sonrakı vəziyyət',
              subtitle: 'Təmir və ya bərpa sonrası fotoşəkil',
              preview: afterPreview,
            },
          ] as const
        ).map(({ side, title, subtitle, preview }) => (
          <div key={side} className="civic-surface rounded-[14px] p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-[#102A35]">{title}</h2>
                <p className="text-xs text-[#64748B]">{subtitle}</p>
              </div>
              {preview && (
                <button
                  type="button"
                  onClick={() => clearSide(side)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E2E8E8] px-2.5 text-xs font-medium text-[#475569] hover:bg-[#F1F5F5]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sil</span>
                </button>
              )}
            </div>

            {preview ? (
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[10px] border border-[#E2E8E8] bg-[#F2F4F6]">
                <Image
                  src={preview}
                  alt={title}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            ) : (
              <label className="mt-4 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center transition-colors hover:border-[#087F70]">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], side)}
                />
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#E2E8E8] bg-white text-[#087F70]">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="mt-3 text-sm font-semibold text-[#102A35]">Şəkil seçin</span>
                <span className="mt-1 text-xs text-[#64748B]">JPEG, PNG, WEBP · maks. 10 MB</span>
              </label>
            )}
          </div>
        ))}
      </section>

      {errorMsg && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-[12px] border border-[#DC2626]/30 bg-[#FEE2E2] p-4 text-sm text-[#991B1B]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => void runComparison()}
          disabled={comparing || !beforeFile || !afterFile}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#087F70] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#06695E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {comparing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>AI müqayisə aparır...</span>
            </>
          ) : (
            <>
              <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
              <span>Vizual uyğunluğu yoxla</span>
            </>
          )}
        </button>
      </div>

      {/* Comparison Verdict */}
      {result && (
        <section className="civic-surface mt-6 rounded-[14px] p-6">
          <div
            className={`flex items-start gap-3 rounded-[12px] border p-4 ${
              result.is_resolved
                ? 'border-[#087F70]/30 bg-[#E6F5F1]'
                : 'border-[#D97706]/30 bg-[#FEF3C7]'
            }`}
          >
            {result.is_resolved ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#087F70]" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" aria-hidden="true" />
            )}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#087F70]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Süni intellekt müqayisə nəticəsi</span>
              </div>
              <h3 className="font-display mt-1 text-lg font-bold text-[#102A35]">
                {result.is_resolved ? 'Problem həll edilib' : 'Problem tam həll edilməyib'}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[#3E4946]">{result.summary}</p>
            </div>
          </div>

          {result.warning && (
            <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-[#D97706]/30 bg-[#FEF3C7]/60 p-3.5 text-sm text-[#92400E]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{result.warning}</span>
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 divide-x divide-[#E2E8E8] rounded-xl border border-[#E2E8E8] bg-[#F7F9FB] py-4 text-center">
            <div className="px-3">
              <p className="text-xs font-medium text-[#64748B]">Həll balı</p>
              <p className="font-display font-mono-tabular mt-1 text-2xl font-bold text-[#102A35]">
                {result.resolution_score}/100
              </p>
            </div>
            <div className="px-3">
              <p className="text-xs font-medium text-[#64748B]">Etibarlılıq</p>
              <p className="font-display font-mono-tabular mt-1 text-2xl font-bold text-[#102A35]">
                {Math.round(result.confidence * 100)}%
              </p>
            </div>
            <div className="px-3">
              <p className="text-xs font-medium text-[#64748B]">Eyni məkan</p>
              <p
                className={`font-display mt-1 text-2xl font-bold ${
                  result.is_same_location ? 'text-[#087F70]' : 'text-[#DC2626]'
                }`}
              >
                {result.is_same_location ? 'Bəli' : 'Xeyr'}
              </p>
            </div>
          </div>

          {selectedComplaint && (
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#E2E8E8] pt-4">
              <span className="text-xs text-[#475569]">
                Nəticə <strong className="text-[#102A35]">#{selectedComplaint.tracking_code}</strong>{' '}
                müraciətinə əlavə edildi.
              </span>
              <Link
                href={`/izle?kod=${selectedComplaint.tracking_code}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087F70] hover:underline"
              >
                <span>Tarixçəyə bax</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default function MuqayisePage() {
  return (
    <div className="site-page flex min-h-screen flex-col text-[#102A35]">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-10">
            <div className="h-48 animate-pulse rounded-[14px] border border-[#E2E8E8] bg-white" />
          </main>
        }
      >
        <CompareContent />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
