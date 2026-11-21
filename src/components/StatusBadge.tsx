import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Construction,
  Droplets,
  FileCheck2,
  Lightbulb,
  ScanSearch,
  Trash2,
  Trees,
  Wrench,
  XCircle,
} from 'lucide-react';
import type { CategoryId, ComplaintStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/types';

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const Icon =
    status === 'pending'
      ? Clock
      : status === 'analyzing'
        ? ScanSearch
        : status === 'open'
          ? FileCheck2
          : status === 'in_progress'
            ? Wrench
            : status === 'resolved'
              ? CheckCircle2
              : XCircle;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function CategoryIcon({
  category,
  className = 'h-5 w-5',
}: {
  category: CategoryId | string;
  className?: string;
}) {
  switch (category) {
    case 'yol':
      return <Construction className={className} aria-hidden="true" />;
    case 'isiq':
      return <Lightbulb className={className} aria-hidden="true" />;
    case 'zibil':
      return <Trash2 className={className} aria-hidden="true" />;
    case 'su':
      return <Droplets className={className} aria-hidden="true" />;
    case 'yasilliq':
      return <Trees className={className} aria-hidden="true" />;
    default:
      return <ClipboardList className={className} aria-hidden="true" />;
  }
}
