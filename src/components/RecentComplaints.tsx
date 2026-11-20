'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CategoryIcon, StatusBadge } from '@/components/StatusBadge';
import { CATEGORIES, formatAzDate, type ComplaintRecord } from '@/lib/types';

export function RecentComplaints() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/complaints?limit=3')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { complaints?: ComplaintRecord[] } | null) => {
        if (active && data?.complaints) setComplaints(data.complaints.slice(0, 3));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (complaints.length === 0) {
    return <p className="col-span-full rounded-[14px] border border-dashed border-[#CBD5E1] px-5 py-8 text-center text-sm text-[#64748B]">{loading ? 'Müraciətlər yüklənir...' : 'Hələ ictimai reyestrdə müraciət yoxdur.'}</p>;
  }

  return <>
    {complaints.map((item) => {
      const category = CATEGORIES.find((entry) => entry.id === item.category);
      return (
        <Link key={item.id} href={`/izle?kod=${item.tracking_code}`} className="civic-surface group flex flex-col justify-between rounded-[14px] p-5 transition-colors duration-150 hover:border-[#087F70]/45">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-tabular text-xs font-semibold text-[#087F70]">#{item.tracking_code}</span>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-4 flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#F2F4F6] text-[#087F70]"><CategoryIcon category={item.category} className="h-4 w-4" /></div>
              <h3 className="font-display text-base font-semibold text-[#102A35] group-hover:text-[#087F70]">{category?.label ?? item.category}</h3>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#475569]">{item.description}</p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#E2E8E8] pt-3 text-xs text-[#64748B]">
            <span className="truncate">{item.district}</span>
            <span className="font-mono-tabular shrink-0">{formatAzDate(item.created_at)}</span>
          </div>
        </Link>
      );
    })}
  </>;
}
