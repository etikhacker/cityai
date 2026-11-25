'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ImagePlus,
  Loader2,
  LocateFixed,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CategoryIcon } from '@/components/StatusBadge';
import { getSupabase } from '@/lib/supabase';
import { saveTrackingCode } from '@/lib/local-tracking';
import {
  CATEGORIES,
  PRIORITY_CONFIG,
  type CategoryId,
  type CityAnalysis,
  type PriorityLevel,
} from '@/lib/types';

const PRIORITIES: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const MAX_AI_ANALYSIS_BYTES = 3 * 1024 * 1024;

export default function MuracietPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const videoPreviewUrls = useRef(new Set<string>());
  const [dragOver, setDragOver] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [allowAiAnalysis, setAllowAiAnalysis] = useState(false);
  const [analysisMediaKind, setAnalysisMediaKind] = useState<'image' | 'video'>('image');
  const [analysis, setAnalysis] = useState<CityAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  const [category, setCategory] = useState<CategoryId | ''>('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [copied, setCopied] = useState(false);

  const runAnalysis = useCallback(
    async (mediaFile: File, currentCategory: CategoryId | '', currentDescription: string) => {
      setAnalysisMediaKind(VIDEO_TYPES.has(mediaFile.type) ? 'video' : 'image');
      if (mediaFile.size > MAX_AI_ANALYSIS_BYTES) {
        setAnalyzing(false);
        setAnalysis(null);
        setAnalysisError('AI təhlili üçün şəkil və video 3 MB-dan kiçik olmalıdır. Daha böyük faylı müraciətə əlavə edə bilərsiniz; təsviri əl ilə daxil edin.');
        return;
      }
      setAnalyzing(true);
      setAnalysis(null);
      setAnalysisError('');

      try {
        const fd = new FormData();
        fd.append('file', mediaFile);

        const res = await fetch('/api/analyze', { method: 'POST', body: fd });
        const data = (await res.json()) as {
          success?: boolean;
          analysis?: CityAnalysis;
          error?: string;
        };

        if (!res.ok || !data.success || !data.analysis) {
          setAnalysisError(data.error || 'Media analizi tamamlana bilmədi.');
          return;
        }

        const aiResult = data.analysis;
        setAnalysis(aiResult);

        if (aiResult.is_infrastructure) {
          if (!currentCategory) {
            setCategory(aiResult.category_id);
          }
          setPriority(aiResult.severity);
        }
        if (!currentDescription.trim()) {
          setDescription(aiResult.description);
        }
      } catch {
        setAnalysisError('Media analizi xidməti ilə əlaqə qurmaq alınmadı.');
      } finally {
        setAnalyzing(false);
      }
    },
    []
  );

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const selected = Array.from(incoming);
      const supported = selected.filter((file) => IMAGE_TYPES.has(file.type) || VIDEO_TYPES.has(file.type));
      const valid = supported.filter((file) =>
        file.size <= (VIDEO_TYPES.has(file.type) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)
      );
      if (valid.length !== selected.length) {
        setMediaError('Şəkillər 10 MB, videolar isə 20 MB-dan kiçik olmalıdır. JPEG, PNG, WEBP, HEIC, HEIF, MP4, WEBM və MOV formatlarından istifadə edin.');
      }
      if (!valid.length) {
        if (!selected.length) setMediaError('Şəkil və ya video seçin.');
        return;
      }

      const nextFiles = [...files, ...valid].slice(0, 5);
      const addedFiles = nextFiles.slice(files.length);
      if (nextFiles.length < files.length + valid.length) {
        setMediaError('Bir müraciətə ən çox 5 şəkil və ya video əlavə etmək olar.');
      } else if (valid.length === selected.length) {
        setMediaError('');
      }
      if (nextFiles.reduce((total, file) => total + file.size, 0) > 50 * 1024 * 1024) {
        setMediaError('Bir müraciətə ümumilikdə ən çox 50 MB media əlavə etmək olar.');
        return;
      }
      setFiles(nextFiles);

      const readPreviews = await Promise.all(
        addedFiles.map((file) => {
          if (VIDEO_TYPES.has(file.type)) {
            const url = URL.createObjectURL(file);
            videoPreviewUrls.current.add(url);
            return Promise.resolve(url);
          }
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.readAsDataURL(file);
          });
        })
      );

      setPreviews((prev) => [...prev, ...readPreviews].slice(0, 5));

      const mediaToAnalyze = [...files, ...addedFiles].find((file) =>
        IMAGE_TYPES.has(file.type) && file.size <= MAX_AI_ANALYSIS_BYTES
      );
      if (!analysis && mediaToAnalyze) {
        if (allowAiAnalysis) {
          await runAnalysis(mediaToAnalyze, category, description);
        } else {
          setAnalysisMediaKind(VIDEO_TYPES.has(mediaToAnalyze.type) ? 'video' : 'image');
          setAnalysisError('Media müraciətə əlavə edildi. AI təhlili üçün Google Gemini-yə ötürülməsinə razılıq verməlisiniz.');
        }
      } else if (!analysis && addedFiles.some((file) => VIDEO_TYPES.has(file.type) || IMAGE_TYPES.has(file.type))) {
        setAnalysisMediaKind(addedFiles.some((file) => VIDEO_TYPES.has(file.type)) ? 'video' : 'image');
        setAnalysisError('Media müraciətə əlavə edildi. AI təhlili üçün fayl 3 MB-dan kiçik olmalıdır; daha böyük faylı təsviri əl ilə daxil edib göndərə bilərsiniz.');
      }
    },
    [allowAiAnalysis, analysis, category, description, files, runAnalysis]
  );

  const removeFile = (index: number) => {
    if (VIDEO_TYPES.has(files[index]?.type) && previews[index]) {
      URL.revokeObjectURL(previews[index]);
      videoPreviewUrls.current.delete(previews[index]);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const applyAiSuggestion = () => {
    if (!analysis) return;
    setCategory(analysis.category_id);
    setPriority(analysis.severity);
    setDescription(analysis.description);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Bu cihaz GPS məkanını paylaşmır. Ünvanı əl ilə daxil edin.');
      return;
    }
    setLocationError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (GPS koordinatı)`
        );
        setLocating(false);
      }, (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Məkan icazəsi verilmədi. Ünvanı əl ilə daxil edin.'
          : 'GPS mövqeyi müəyyən edilə bilmədi. Ünvanı əl ilə daxil edin.');
        setLocating(false);
      },
      { timeout: 6000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!category) {
      setSubmitError('Zəhmət olmasa problem kateqoriyasını seçin.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Zəhmət olmasa problemin qısa təsvirini daxil edin.');
      return;
    }

    setSubmitting(true);
    const uploadedMedia: Array<{ path: string; type: string; size: number; proof: string }> = [];
    try {
      if (files.length) {
        const signingResponse = await fetch('/api/uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: files.map((file) => ({ type: file.type, size: file.size })) }),
        });
        const signingData = await signingResponse.json() as {
          files?: Array<{ path: string; token: string; type: string; size: number; proof: string }>;
          error?: string;
        };
        if (!signingResponse.ok || !signingData.files || signingData.files.length !== files.length) {
          throw new Error(signingData.error || 'Media yükləməsini hazırlamaq alınmadı.');
        }
        for (const [index, file] of Array.from(files.entries())) {
          const signed = signingData.files[index];
          const { error } = await getSupabase().storage.from('muraciet-media').uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
          if (error) throw error;
          uploadedMedia.push({ path: signed.path, type: signed.type, size: signed.size, proof: signed.proof });
        }
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          priority,
          location: location.trim(),
          email: email.trim(),
          phone: phone.trim(),
          analysis,
          media: uploadedMedia,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        tracking_code?: string;
        email_sent?: boolean;
        error?: string;
      };

      if (!res.ok || !data.success || !data.tracking_code) {
        if (uploadedMedia.length) await fetch('/api/uploads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: uploadedMedia }) }).catch(() => undefined);
        setSubmitError(data.error || 'Müraciət göndərilə bilmədi.');
        return;
      }

      setTrackingCode(data.tracking_code);
      saveTrackingCode(data.tracking_code);
      setEmailSent(Boolean(data.email_sent));
    } catch (error) {
      if (uploadedMedia.length) await fetch('/api/uploads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: uploadedMedia }) }).catch(() => undefined);
      setSubmitError(error instanceof Error ? error.message : 'Server ilə əlaqə zamanı xəta baş verdi. Yenidən yoxlayın.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in some iframe contexts
    }
  };

  const resetForm = () => {
    setFiles([]);
    setPreviews([]);
    setAllowAiAnalysis(false);
    setAnalysis(null);
    setAnalysisError('');
    setCategory('');
    setPriority('medium');
    setDescription('');
    previews.forEach((preview, index) => {
      if (VIDEO_TYPES.has(files[index]?.type)) {
        URL.revokeObjectURL(preview);
        videoPreviewUrls.current.delete(preview);
      }
    });
    setMediaError('');
    setLocation('');
    setEmail('');
    setPhone('');
    setEmailSent(false);
    setSubmitError('');
    setTrackingCode('');
  };

  const selectedCategoryMeta = CATEGORIES.find((c) => c.id === category);

  useEffect(() => () => {
    videoPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    videoPreviewUrls.current.clear();
  }, []);

  if (trackingCode) {
    return (
      <div className="site-page flex min-h-screen flex-col text-[#102A35]">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-14 sm:px-6">
          <div className="civic-surface w-full rounded-[16px] p-8 text-center sm:p-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#D8F3E8] text-[#087F70]">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>

            <h1 className="font-display mt-5 text-2xl font-bold tracking-[-0.02em] text-[#102A35] sm:text-3xl">
              Müraciətiniz qeydə alındı
            </h1>
            <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-[#475569]">
              Müraciətiniz sistemdə qeydə alındı. Təklif olunan qurum:{' '}
              <span className="font-semibold text-[#102A35]">
                {selectedCategoryMeta?.department ?? 'aidiyyəti icra qurumuna'}
              </span>. Müraciət operator baxış növbəsinə əlavə edildi. Statusu izləmə kodu ilə yoxlaya bilərsiniz.
            </p>

            <div className="mx-auto mt-6 flex max-w-sm items-center justify-between gap-3 rounded-xl border border-[#E2E8E8] bg-[#F7F9FB] px-4 py-3.5">
              <div className="text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                  İzləmə kodu
                </p>
                <p className="font-mono-tabular mt-0.5 text-xl font-bold text-[#087F70]">
                  {trackingCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8E8] bg-white px-3 text-xs font-semibold text-[#102A35] transition-colors hover:bg-[#F1F5F5]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#087F70]" aria-hidden="true" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
                    <span>Kopyala</span>
                  </>
                )}
              </button>
            </div>

            {emailSent && (
              <p className="mx-auto mt-3 max-w-sm text-xs font-medium text-[#087F70]">
                İzləmə kodu e-poçt ünvanınıza da göndərildi.
              </p>
            )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/izle?kod=${trackingCode}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#087F70] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#06695E]"
              >
                <span>Müraciəti izlə</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#E2E8E8] bg-white px-6 text-sm font-medium text-[#102A35] transition-colors hover:bg-[#F1F5F5]"
              >
                Yeni müraciət yarat
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="site-page flex min-h-screen flex-col text-[#102A35]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Page Heading */}
        <div className="border-b border-[#E2E8E8] pb-6">
          <p className="text-sm font-semibold text-[#087F70]">Yeni müraciət</p>
          <h1 className="motion-heading font-display mt-1.5 text-3xl font-bold tracking-[-0.025em] text-[#102A35] sm:text-4xl">
            İnfrastruktur problemini bildirin
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#475569] sm:text-base">
            3 MB-dan kiçik şəkillər süni intellektlə təhlil olunur. Videolar müraciətə əlavə edilir, təsvir isə əl ilə yazılır.
            Göndərməzdən əvvəl bütün sahələri redaktə edə bilərsiniz.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]"
        >
          {/* Main Form Sequence */}
          <div className="space-y-6">
            {/* Step 1: Media Upload & AI Preliminary Analysis */}
            <section className="civic-surface rounded-[14px] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="font-mono-tabular text-xs font-semibold text-[#087F70]">
                    Addım 01
                  </span>
                  <h2 className="font-display mt-0.5 text-lg font-semibold text-[#102A35]">
                    Foto və ya video əlavə edin
                  </h2>
                </div>
                <span className="text-xs text-[#64748B]">Maks. 5 fayl · cəmi 50 MB</span>
              </div>

              <div className="mt-4 rounded-lg border border-[#F0D8A8] bg-[#FFF9EB] p-3 text-xs leading-relaxed text-[#684D17]">
                AI təhlili üçün seçdiyiniz 3 MB-dək fayl Google Gemini xidmətinə göndərilir. Google Free Tier sorğularındakı məzmunu məhsullarının təkmilləşdirilməsi üçün istifadə edə bilər. Məxfi şəxsi məlumatları olan media yükləməyin.
                <label className="mt-2 flex cursor-pointer items-start gap-2 font-semibold text-[#4A3712]">
                  <input
                    type="checkbox"
                    checked={allowAiAnalysis}
                    onChange={(event) => {
                      const accepted = event.target.checked;
                      setAllowAiAnalysis(accepted);
                      if (!accepted) return;
                      const mediaFile = files.find((file) => IMAGE_TYPES.has(file.type) && file.size <= MAX_AI_ANALYSIS_BYTES);
                      if (mediaFile && !analysis && !analyzing) void runAnalysis(mediaFile, category, description);
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#087F70]"
                  />
                  <span>Razıyam: seçilmiş media AI təhlili üçün Google Gemini-yə göndərilsin.</span>
                </label>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void handleFiles(e.dataTransfer.files);
                }}
                className={`relative mt-4 rounded-[12px] border-[1.5px] border-dashed px-6 py-8 text-center transition-colors ${
                  dragOver
                    ? 'border-[#087F70] bg-[#E6F5F1]/60'
                    : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#087F70]/60'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime"
                  onChange={(e) => e.target.files && void handleFiles(e.target.files)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Şəkil və ya video fayllarını seçin"
                />
                <div className="mx-auto flex h-11 w-11 items-center justify-center gap-0.5 rounded-xl border border-[#E2E8E8] bg-white text-[#087F70]">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  <Video className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#102A35]">
                  Şəkil və ya videonu bura sürükləyin və ya cihazdan seçin
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  JPEG, PNG, WEBP, HEIC, HEIF, MP4, WEBM və MOV dəstəklənir. AI təhlili yalnız 3 MB-dan kiçik şəkillər üçün mövcuddur; videonun təsvirini əl ilə yazın.
                </p>
              </div>

              {mediaError && (
                <p role="alert" className="mt-3 text-xs font-medium text-[#B45309]">
                  {mediaError}
                </p>
              )}

              {/* Thumbnail Previews */}
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {previews.map((src, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-[#E2E8E8] bg-[#F2F4F6]"
                    >
                      {VIDEO_TYPES.has(files[idx]?.type) ? (
                        <video
                          src={src}
                          controls
                          preload="metadata"
                          playsInline
                          aria-label={`Əlavə edilmiş video ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={src}
                          alt={`Yüklənmiş şəkil ${idx + 1}`}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        aria-label={`Faylı sil ${idx + 1}`}
                        className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#102A35]/80 text-white transition-opacity hover:bg-[#DC2626]"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Preliminary Analysis Banner */}
              {(analyzing || analysis || analysisError) && (
                <div className="mt-5 rounded-[12px] border border-[#087F70]/30 bg-[#E6F5F1] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#087F70]">
                      {analyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                      )}
                          <span>{analysisMediaKind === 'video' ? 'Videonun AI təhlili' : 'Süni intellekt tərəfindən ilkin təhlil'}</span>
                    </div>

                    {analysis && files.some((file) => IMAGE_TYPES.has(file.type) && file.size <= MAX_AI_ANALYSIS_BYTES) && (
                      <div className="flex items-center gap-3">
                        <span className="font-mono-tabular text-xs font-semibold text-[#07564F]">
                          Etibarlılıq: {Math.round(analysis.confidence * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const mediaFile = files.find((file) => IMAGE_TYPES.has(file.type) && file.size <= MAX_AI_ANALYSIS_BYTES);
                            if (mediaFile) void runAnalysis(mediaFile, category, description);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#087F70] hover:underline"
                        >
                          <RefreshCw className="h-3 w-3" aria-hidden="true" />
                          <span>Yenilə</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {analyzing ? (
                    <p className="mt-2 text-sm text-[#3E4946]">
                      {analysisMediaKind === 'video' ? 'Videonun məzmunu və zaman ardıcıllığı analiz edilir...' : 'Foto analiz edilir, problemin növü və təsviri hazırlanır...'}
                    </p>
                  ) : analysisError ? (
                    <div className="mt-2 flex items-start gap-2 text-sm text-[#B45309]">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <p>{analysisError} Məlumatları aşağıda əl ilə daxil edə bilərsiniz.</p>
                    </div>
                  ) : analysis ? (
                    <div className="mt-2.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#102A35]">
                          {analysis.problem_type}
                        </p>
                        {!analysis.is_infrastructure && (
                          <span className="text-xs font-medium text-[#B45309]">
                            İnfrastruktur problemi aşkarlanmadı — zəhmət olmasa yoxlayın
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-[#3E4946]">
                        {analysis.description}
                      </p>
                      {analysis.tags.length > 0 && (
                        <p className="text-xs font-medium text-[#07564F]">
                          {analysis.tags.join(' · ')}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#087F70]/15 pt-2.5">
                        <span className="text-xs text-[#3E4946]">
                          Tövsiyə olunan qurum: {analysis.recommended_department}
                        </span>
                        <button
                          type="button"
                          onClick={applyAiSuggestion}
                          className="text-xs font-semibold text-[#087F70] hover:underline"
                        >
                          Təklifi formaya tətbiq et
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            {/* Step 2: Category & Priority */}
            <section className="civic-surface rounded-[14px] p-5 sm:p-6">
              <div>
                <span className="font-mono-tabular text-xs font-semibold text-[#087F70]">
                  Addım 02
                </span>
                <h2 className="font-display mt-0.5 text-lg font-semibold text-[#102A35]">
                  Problem kateqoriyası və təcililik
                </h2>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                {CATEGORIES.map((item) => {
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`flex flex-col items-start rounded-[10px] border p-3.5 text-left transition-colors ${
                        active
                          ? 'border-[#087F70] bg-[#E6F5F1]/70 text-[#102A35]'
                          : 'border-[#E2E8E8] bg-white text-[#475569] hover:border-[#CBD5E1] hover:bg-[#F7F9FB]'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-md ${
                            active
                              ? 'bg-[#087F70] text-white'
                              : 'bg-[#F2F4F6] text-[#475569]'
                          }`}
                        >
                          <CategoryIcon category={item.id} className="h-4 w-4" />
                        </div>
                        {active && (
                          <CheckCircle2 className="h-4 w-4 text-[#087F70]" aria-hidden="true" />
                        )}
                      </div>
                      <span className="mt-2.5 text-sm font-semibold text-[#102A35]">
                        {item.label}
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs leading-snug text-[#64748B]">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Priority Selector */}
              <div className="mt-6 border-t border-[#E2E8E8] pt-5">
                <label className="block text-[13px] font-semibold text-[#102A35]">
                  Təcililik dərəcəsi
                </label>
                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRIORITIES.map((lvl) => {
                    const cfg = PRIORITY_CONFIG[lvl];
                    const active = priority === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setPriority(lvl)}
                        className={`flex flex-col items-start rounded-[10px] border px-3.5 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-[#087F70] bg-[#E6F5F1]/60'
                            : 'border-[#E2E8E8] bg-white hover:bg-[#F7F9FB]'
                        }`}
                      >
                        <span
                          className="inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeText }}
                        >
                          {cfg.label}
                        </span>
                        <span className="mt-1.5 text-[11px] leading-snug text-[#64748B]">
                          {cfg.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Step 3: Description & Address */}
            <section className="civic-surface rounded-[14px] p-5 sm:p-6">
              <div>
                <span className="font-mono-tabular text-xs font-semibold text-[#087F70]">
                  Addım 03
                </span>
                <h2 className="font-display mt-0.5 text-lg font-semibold text-[#102A35]">
                  Təsvir və ünvan məlumatları
                </h2>
              </div>

              <div className="mt-4 space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="complaint-desc"
                      className="text-[13px] font-semibold text-[#102A35]"
                    >
                      Problemin təsviri
                    </label>
                    <span className="font-mono-tabular text-xs text-[#64748B]">
                      {description.length} / 500
                    </span>
                  </div>
                  <textarea
                    id="complaint-desc"
                    rows={4}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Məsələn: Cəfər Cabbarlı küçəsi 44 ünvanında yolun sağ zolağında dərin asfalt çuxuru var..."
                    className="civic-input mt-2 w-full resize-none px-3.5 py-3 text-sm leading-relaxed"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="complaint-location"
                      className="block text-[13px] font-semibold text-[#102A35]"
                    >
                      Küçə, bina və ya nişangah
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="complaint-location"
                        type="text"
                        value={location}
                        onChange={(e) => { setLocation(e.target.value); setLocationError(''); }}
                        placeholder="Küçə adı, bina №..."
                        className="civic-input h-12 flex-1 px-3.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={locating}
                        className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#E2E8E8] bg-white px-3.5 text-xs font-semibold text-[#102A35] transition-colors hover:bg-[#F1F5F5] disabled:opacity-50"
                      >
                        <LocateFixed className="h-4 w-4 text-[#087F70]" aria-hidden="true" />
                        <span>{locating ? 'Təyin edilir...' : 'GPS'}</span>
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[#64748B]">
                      GPS ünvanı müəyyən etmir; cari koordinatları əlavə edir.
                    </p>
                    {locationError && <p role="status" className="mt-1 text-xs font-medium text-[#B45309]">{locationError}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="complaint-email" className="block text-[13px] font-semibold text-[#102A35]">
                      E-poçt <span className="font-normal text-[#64748B]">(istəyə bağlı)</span>
                    </label>
                    <input
                      id="complaint-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ad@example.com"
                      className="civic-input mt-2 h-12 w-full px-3.5 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="complaint-phone" className="block text-[13px] font-semibold text-[#102A35]">
                      Telefon <span className="font-normal text-[#64748B]">(istəyə bağlı)</span>
                    </label>
                    <input
                      id="complaint-phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+994 50 000 00 00"
                      className="civic-input mt-2 h-12 w-full px-3.5 text-sm"
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-[#64748B] sm:col-span-2">
                    E-poçt yazsanız, izləmə kodu ora da göndəriləcək. Telefon nömrəsi yalnız operatorun əlaqə saxlaması üçün saxlanılır.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sticky Summary Sidebar */}
          <aside className="civic-surface rounded-[14px] p-5 sm:p-6 lg:sticky lg:top-24">
            <h3 className="font-display text-base font-semibold text-[#102A35]">
              Müraciət xülasəsi
            </h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Göndərməzdən əvvəl əsas məlumatların tamlığını yoxlayın.
            </p>

            <ul className="mt-4 divide-y divide-[#E2E8E8] border-y border-[#E2E8E8] text-sm">
              <li className="flex items-center justify-between py-2.5">
                <span className="text-[#475569]">Media sübutu</span>
                <span className="font-mono-tabular text-xs font-semibold text-[#102A35]">
                  {files.length > 0 ? `${files.length} fayl` : 'Əlavə edilməyib'}
                </span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-[#475569]">Kateqoriya</span>
                <span className="text-xs font-semibold text-[#102A35]">
                  {selectedCategoryMeta ? selectedCategoryMeta.shortLabel : 'Seçilməyib'}
                </span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-[#475569]">Təcililik</span>
                <span className="text-xs font-semibold text-[#102A35]">
                  {PRIORITY_CONFIG[priority].label}
                </span>
              </li>
            </ul>

            <div className="mt-4 rounded-lg border border-[#E2E8E8] bg-[#F7F9FB] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#087F70]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Təklif olunan qurum</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                {selectedCategoryMeta
                  ? selectedCategoryMeta.department
                  : 'Kateqoriya seçildikdə uyğun qurum barədə təklif göstəriləcək.'}
              </p>
            </div>

            {submitError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-lg border border-[#DC2626]/30 bg-[#FEE2E2] p-3 text-xs text-[#991B1B]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !category}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#087F70] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#06695E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Göndərilir...</span>
                </>
              ) : (
                <>
                  <span>Müraciəti göndər</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#64748B]">
              Göndərildikdən sonra dərhal izləmə kodu təqdim edilir.
            </p>
          </aside>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
