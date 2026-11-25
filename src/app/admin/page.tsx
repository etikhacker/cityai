'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  CheckCircle2,
  GitCompareArrows,
  ImagePlus,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CategoryIcon, StatusBadge } from '@/components/StatusBadge';
import {
  CATEGORIES,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatAzDate,
  type CityComparison,
  type ComplaintRecord,
  type ComplaintStatus,
} from '@/lib/types';

const FILTER_OPTIONS: Array<{ value: 'all' | ComplaintStatus; label: string }> = [
  { value: 'all', label: 'Hamısı' },
  { value: 'pending', label: 'Qəbul edildi' },
  { value: 'open', label: 'Baxışdadır' },
  { value: 'in_progress', label: 'İcrada' },
  { value: 'resolved', label: 'Həll edildi' },
  { value: 'rejected', label: 'İmtina' },
];

const COMPARISON_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [authMessage, setAuthMessage] = useState('Daxil edilən şifrə yanlışdır.');

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CityComparison | null>(null);
  const [compareError, setCompareError] = useState('');

  const selectComplaint = useCallback((item: ComplaintRecord) => {
    setSelectedId(item.id);
    setBeforeFile(null);
    setAfterFile(null);
    setBeforePreview('');
    setAfterPreview('');
    setCompareResult(item.comparison);
    setCompareError('');
  }, []);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/complaints', { cache: 'no-store' });
      const data = (await res.json()) as { complaints?: ComplaintRecord[] };
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error('Admin müraciətləri yüklənmədi.');
      const items = data.complaints ?? [];
      setComplaints(items);
      if (items[0]) {
        selectComplaint(items[0]);
      } else {
        setSelectedId(null);
      }
    } catch {
      setComplaints([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [selectComplaint]);

  const selected = useMemo(
    () => complaints.find((c) => c.id === selectedId) ?? null,
    [complaints, selectedId]
  );

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.tracking_code.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [complaints, searchQuery, statusFilter]);

  const changeStatus = async (next: ComplaintStatus) => {
    if (!selected || statusSaving) return;
    setStatusSaving(true);
    setStatusError('');
    try {
      const response = await fetch('/api/admin/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status: next }),
      });
      const data = (await response.json()) as { complaint?: ComplaintRecord; error?: string };
      if (!response.ok || !data.complaint) {
        setStatusError(data.error || 'Status dəyişdirilə bilmədi.');
        return;
      }
      const updated = data.complaint;
      setComplaints((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setStatusError('Serverlə əlaqə alınmadı.');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setAuthMessage(data.error || 'Operator girişi alınmadı.');
        setAuthError(true);
        return;
      }
      setAuthenticated(true);
      setAuthError(false);
      await loadComplaints();
    } catch {
      setAuthError(true);
      setAuthMessage('Server ilə əlaqə yaratmaq alınmadı.');
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        if (active && data.authenticated) {
          setAuthenticated(true);
          void loadComplaints();
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [loadComplaints]);

  const handleCompareFile = (file: File, side: 'before' | 'after') => {
    if (!COMPARISON_IMAGE_TYPES.has(file.type)) {
      setCompareError('JPEG, PNG, WEBP, HEIC və ya HEIF şəkli seçin.');
      return;
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      setCompareError('Şəklin ölçüsü 10 MB-dan çox olmamalıdır.');
      return;
    }
    setCompareError('');
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

  const runTicketVerification = async () => {
    if (!selected || !beforeFile || !afterFile) return;
    setComparing(true);
    setCompareError('');
    try {
      const fd = new FormData();
      fd.append('before', beforeFile);
      fd.append('after', afterFile);
      fd.append('muraciet_id', selected.id);

      const res = await fetch('/api/compare', { method: 'POST', body: fd });
      const data = (await res.json()) as {
        success?: boolean;
        result?: CityComparison;
        updatedComplaint?: ComplaintRecord;
        error?: string;
      };

      if (!res.ok || !data.success || !data.result) {
        setCompareError(data.error || 'Müqayisə zamanı xəta baş verdi.');
        return;
      }

      setCompareResult(data.result);
      if (data.updatedComplaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === data.updatedComplaint!.id ? data.updatedComplaint! : c))
        );
      }
    } catch {
      setCompareError('Müqayisə servisinə qoşulmaq alınmadı.');
    } finally {
      setComparing(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="site-page flex min-h-screen flex-col text-[#102A35]">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-16">
          <div className="civic-surface w-full rounded-[16px] p-7 sm:p-8">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#E6F5F1] text-[#087F70]">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="font-display mt-5 text-center text-2xl font-bold text-[#102A35]">
              Operator girişi
            </h1>
            <p className="mt-1.5 text-center text-sm text-[#64748B]">
              Müraciət növbəsini idarə etmək üçün operator şifrəsini daxil edin.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-[13px] font-semibold text-[#102A35]"
                >
                  Şifrə
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="••••••••"
                  className="civic-input mt-1.5 h-12 w-full px-3.5 text-sm"
                />
              </div>

              {authError && <p role="alert" className="text-xs font-medium text-[#DC2626]">{authMessage}</p>}

              <button
                type="submit"
                className="h-12 w-full rounded-lg bg-[#087F70] text-sm font-semibold text-white transition-colors hover:bg-[#06695E]"
              >
                Daxil ol
              </button>
            </form>

          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const counts = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === 'pending' || c.status === 'open').length,
    inProgress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  return (
    <div className="site-page flex min-h-screen flex-col text-[#102A35]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Bar & KPI Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8E8] pb-5">
          <div>
            <p className="text-sm font-semibold text-[#087F70]">Operator idarəetmə paneli</p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-[-0.02em] text-[#102A35] sm:text-3xl">
              Şəhər müraciətləri reyestri
            </h1>
          </div>

          <button
            type="button"
                  onClick={() => {
              void fetch('/api/admin/session', { method: 'DELETE' });
              setAuthenticated(false);
              setComplaints([]);
              setSelectedId(null);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E2E8E8] bg-white px-3.5 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F5]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Çıxış</span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Cəmi müraciət', value: counts.total },
            { label: 'Yeni / Baxışda', value: counts.open },
            { label: 'İcrada', value: counts.inProgress },
            { label: 'Həll edildi', value: counts.resolved },
          ].map((kpi) => (
            <div key={kpi.label} className="civic-surface rounded-[12px] p-4">
              <p className="text-xs font-medium text-[#64748B]">{kpi.label}</p>
              <p className="font-display font-mono-tabular mt-1 text-2xl font-bold text-[#102A35]">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Split Workspace */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
          {/* Queue Sidebar */}
          <section className="civic-surface overflow-hidden rounded-[14px] lg:col-span-5">
            <div className="border-b border-[#E2E8E8] p-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kod və ya ünvan axtar..."
                  className="civic-input h-10 w-full pr-3 pl-9 text-sm"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      statusFilter === opt.value
                        ? 'bg-[#087F70] text-white'
                        : 'bg-[#F2F4F6] text-[#475569] hover:text-[#102A35]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[600px] divide-y divide-[#E2E8E8] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-sm text-[#64748B]">Yüklənir...</div>
              ) : filteredComplaints.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#64748B]">
                  Filtrə uyğun müraciət tapılmadı.
                </div>
              ) : (
                filteredComplaints.map((item) => {
                  const active = item.id === selected?.id;
                  const cat = CATEGORIES.find((c) => c.id === item.category);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectComplaint(item)}
                      className={`block w-full px-4 py-3.5 text-left transition-colors ${
                        active ? 'bg-[#E6F5F1]/70' : 'bg-white hover:bg-[#F7F9FB]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-tabular text-xs font-bold text-[#087F70]">
                          #{item.tracking_code}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-sm font-medium text-[#102A35]">
                        {item.description}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {cat?.shortLabel ?? item.category} · {item.location} ·{' '}
                        {PRIORITY_CONFIG[item.priority].label}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Detail Workspace */}
          <section className="civic-surface rounded-[14px] p-5 sm:p-6 lg:col-span-7">
            {!selected ? (
              <div className="py-16 text-center text-sm text-[#64748B]">
                Baxış üçün sol siyahıdan müraciət seçin.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8E8] pb-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F2F4F6] text-[#087F70]">
                      <CategoryIcon category={selected.category} className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular text-sm font-bold text-[#087F70]">
                          #{selected.tracking_code}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          · {formatAzDate(selected.created_at)}
                        </span>
                      </div>
                      <h2 className="font-display mt-0.5 text-lg font-semibold text-[#102A35]">
                        {CATEGORIES.find((c) => c.id === selected.category)?.label ??
                          selected.category}
                      </h2>
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {/* Status idarəetməsi */}
                <div className="rounded-[10px] border border-[#E2E8E8] bg-[#F8FAFC] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#102A35]">Statusu dəyiş</p>
                    {statusSaving && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        Saxlanılır...
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['open', 'in_progress', 'resolved', 'rejected'] as ComplaintStatus[]).map((value) => {
                      const active = selected.status === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={statusSaving || active}
                          onClick={() => void changeStatus(value)}
                          className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition-colors ${
                            active
                              ? 'border-[#087F70] bg-[#E6F5F1] text-[#07564F]'
                              : 'border-[#E2E8E8] bg-white text-[#102A35] hover:bg-[#F1F5F5] disabled:opacity-50'
                          }`}
                        >
                          {STATUS_CONFIG[value].label}
                        </button>
                      );
                    })}
                  </div>
                  {statusError && (
                    <p role="alert" className="mt-2 text-xs font-medium text-[#B45309]">{statusError}</p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-[#102A35]">{selected.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#475569]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#087F70]" aria-hidden="true" />
                      {selected.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#087F70]" aria-hidden="true" />
                      <span>Təklif olunan qurum:</span>
                      {selected.department}
                    </span>
                  </div>
                </div>

                {/* Before / After AI Verification inside Operator Panel */}
                <div className="border-t border-[#E2E8E8] pt-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-[#102A35]">
                      Əvvəl / Sonra AI vizual yoxlama
                    </h3>
                    <span className="text-xs text-[#64748B]">Avtomatik status təsdiqi</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {(
                      [
                        { side: 'before' as const, label: 'Əvvəl', preview: beforePreview },
                        { side: 'after' as const, label: 'Sonra', preview: afterPreview },
                      ] as const
                    ).map(({ side, label, preview }) => (
                      <label
                        key={side}
                        className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center hover:border-[#087F70]"
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                          className="hidden"
                          onChange={(e) =>
                            e.target.files?.[0] && handleCompareFile(e.target.files[0], side)
                          }
                        />
                        {preview ? (
                          <Image
                            src={preview}
                            alt={label}
                            fill
                            referrerPolicy="no-referrer"
                            className="object-cover"
                          />
                        ) : (
                          <div className="p-3">
                            <ImagePlus
                              className="mx-auto h-5 w-5 text-[#087F70]"
                              aria-hidden="true"
                            />
                            <span className="mt-1.5 block text-xs font-semibold text-[#102A35]">
                              {label} şəkli
                            </span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>

                  {compareError && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-[#DC2626]">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {compareError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void runTicketVerification()}
                    disabled={comparing || !beforeFile || !afterFile}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8E8] bg-white text-xs font-semibold text-[#102A35] transition-colors hover:bg-[#F1F5F5] disabled:opacity-50"
                  >
                    {comparing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>AI müqayisə aparır...</span>
                      </>
                    ) : (
                      <>
                        <GitCompareArrows className="h-4 w-4 text-[#087F70]" aria-hidden="true" />
                        <span>Həll uyğunluğunu yoxla</span>
                      </>
                    )}
                  </button>

                  {compareResult && (
                    <div className="mt-3 rounded-[10px] border border-[#087F70]/25 bg-[#E6F5F1] p-3.5 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#087F70]">
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                          {compareResult.is_resolved
                            ? 'Həll təsdiqləndi'
                            : 'Əlavə yoxlama tələb olunur'}
                        </span>
                        <span className="font-mono-tabular">
                          {compareResult.resolution_score}/100 bal
                        </span>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-[#3E4946]">
                        {compareResult.summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
