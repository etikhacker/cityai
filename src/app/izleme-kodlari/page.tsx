'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StatusBadge } from '@/components/StatusBadge';
import { formatAzDate, type ComplaintStatus } from '@/lib/types';
import { clearSavedCodes, readSavedCodes, removeSavedCode, type SavedTrackingCode } from '@/lib/local-tracking';

type SavedWithStatus = SavedTrackingCode & {
  status?: ComplaintStatus;
  createdAt?: string;
  missing?: boolean;
};

const MAX_STATUS_LOOKUPS = 10;

export default function ProfilePage() {
  const [entries, setEntries] = useState<SavedWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const saved = readSavedCodes();
    setEntries(saved);
    setLoading(false);

    const results: SavedWithStatus[] = [...saved];
    for (let index = 0; index < Math.min(saved.length, MAX_STATUS_LOOKUPS); index += 1) {
      const item = saved[index];
      try {
        const response = await fetch('/api/complaints?code=' + encodeURIComponent(item.code), { cache: 'no-store' });
        if (response.status === 429) break;
        if (!response.ok) {
          results[index] = { ...item, missing: response.status === 404 };
          setEntries([...results]);
          continue;
        }
        const data = (await response.json()) as { complaint?: { status?: ComplaintStatus; created_at?: string } };
        if (data.complaint) {
          results[index] = { ...item, status: data.complaint.status, createdAt: data.complaint.created_at };
        }
      } catch {
        break;
      }
      setEntries([...results]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRemove = (code: string) => {
    removeSavedCode(code);
    setEntries((prev) => prev.filter((item) => item.code !== code));
  };

  const handleClear = () => {
    clearSavedCodes();
    setEntries([]);
  };

  return (
    <div className="site-page flex min-h-screen flex-col text-[#102A35]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-[#E2E8E8] pb-6">
          <p className="text-sm font-semibold text-[#087F70]">İzləmə kodları</p>
          <h1 className="font-display mt-1.5 text-3xl font-bold tracking-[-0.025em] text-[#102A35] sm:text-4xl">
            İzləmə kodlarım
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#475569] sm:text-base">
            Bu brauzerdən göndərdiyiniz müraciətlərin izləmə kodları burada saxlanılır. Kodlar yalnız bu cihazda
            qalır — başqa cihazda və ya brauzer məlumatları təmizləndikdən sonra görünməyəcək.
          </p>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-[#64748B]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Yüklənir...
          </div>
        ) : entries.length === 0 ? (
          <div className="civic-surface mt-6 rounded-[14px] p-8 text-center">
            <p className="text-sm text-[#475569]">
              Hələ heç bir müraciət kodu yoxdur. Yeni müraciət göndərdikdən sonra kod avtomatik burada görünəcək.
            </p>
            <Link
              href="/muraciet"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#087F70] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#06695E]"
            >
              <span>Müraciət et</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-[#64748B]">
                {entries.length} kod{entries.length > MAX_STATUS_LOOKUPS ? ' · statuslar ilk ' + MAX_STATUS_LOOKUPS + ' kod üçün yüklənir' : ''}
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B45309] hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Hamısını sil
              </button>
            </div>

            <ul className="mt-3 space-y-2.5">
              {entries.map((item) => (
                <li key={item.code} className="civic-surface flex flex-wrap items-center gap-3 rounded-[12px] px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono-tabular text-sm font-bold text-[#087F70]">{item.code}</p>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      {formatAzDate(item.createdAt ?? new Date(item.savedAt).toISOString())}
                      {item.missing ? ' · bu kodla müraciət tapılmadı' : ''}
                    </p>
                  </div>

                  {item.status ? <StatusBadge status={item.status} /> : null}

                  <Link
                    href={'/izle?kod=' + encodeURIComponent(item.code)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8E8] bg-white px-3 text-xs font-semibold text-[#102A35] hover:bg-[#F1F5F5]"
                  >
                    İzlə
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.code)}
                    aria-label={item.code + ' kodunu sil'}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-[#E2E8E8] bg-white text-[#64748B] hover:border-[#DC2626] hover:text-[#DC2626]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
