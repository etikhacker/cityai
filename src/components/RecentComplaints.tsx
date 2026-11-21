'use client';

import Link from 'next/link';

export function RecentComplaints() {
  return (
    <div className="col-span-full civic-surface flex flex-col items-center gap-3 rounded-[14px] px-5 py-8 text-center">
      <p className="max-w-xl text-sm leading-relaxed text-[#64748B]">
        Müraciətlərin ünvan və təsvirləri ictimai siyahıda göstərilmir. Öz müraciətinizi izləmək üçün şəxsi izləmə kodunuzdan istifadə edin.
      </p>
      <Link href="/izle" className="text-sm font-semibold text-[#087F70] hover:underline">İzləmə kodu ilə axtar</Link>
    </div>
  );
}
