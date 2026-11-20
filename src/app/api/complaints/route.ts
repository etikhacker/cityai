import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  CATEGORIES,
  type CategoryId,
  type CityAnalysis,
  type ComplaintRecord,
  type ComplaintStatus,
  type PriorityLevel,
  type StatusTimelineEntry,
} from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = new Set<CategoryId>(['yol', 'isiq', 'zibil', 'su', 'yasilliq', 'diger']);
const VALID_PRIORITIES = new Set<PriorityLevel>(['low', 'medium', 'high', 'critical']);
const VALID_STATUSES = new Set<ComplaintStatus>([
  'pending', 'analyzing', 'open', 'in_progress', 'resolved', 'rejected',
]);
const STATUS_TITLES: Record<ComplaintStatus, string> = {
  pending: 'Müraciət qəbul edildi',
  analyzing: 'AI ilkin təhlil aparıldı',
  open: 'Müraciət baxışa yönləndirildi',
  in_progress: 'İcra işləri başladı',
  resolved: 'Müraciət həll edildi',
  rejected: 'Müraciətə imtina edildi',
};

function mapComplaint(row: any, analysisRow?: any, historyRows: any[] = [], mediaRows: any[] = []): ComplaintRecord {
  const category: CategoryId = VALID_CATEGORIES.has(row.category) ? row.category : 'diger';
  const status: ComplaintStatus = VALID_STATUSES.has(row.status) ? row.status : 'pending';
  const priority: PriorityLevel = VALID_PRIORITIES.has(row.priority) ? row.priority : 'medium';
  const categoryInfo = CATEGORIES.find((entry) => entry.id === category);
  const analysis: CityAnalysis | null = analysisRow ? {
    problem_type: analysisRow.problem_type || categoryInfo?.label || 'İnfrastruktur problemi',
    category_id: category,
    severity: VALID_PRIORITIES.has(analysisRow.severity) ? analysisRow.severity : priority,
    description: analysisRow.description || row.description || '',
    tags: Array.isArray(analysisRow.tags) ? analysisRow.tags : [],
    confidence: Number(analysisRow.confidence) || 0,
    is_infrastructure: true,
    recommended_department: categoryInfo?.department || 'Şəhər İcra Hakimiyyəti Operativ Mərkəzi',
  } : null;

  const timeline: StatusTimelineEntry[] = historyRows
    .filter((entry) => entry.muraciet_id === row.id)
    .map((entry, index) => {
      const eventStatus: ComplaintStatus = VALID_STATUSES.has(entry.new_status) ? entry.new_status : status;
      return {
        id: String(entry.id ?? `${row.id}-${index}`),
        status: eventStatus,
        title: STATUS_TITLES[eventStatus],
        note: entry.note || STATUS_TITLES[eventStatus],
        timestamp: entry.created_at || row.created_at,
        actor: entry.actor || 'CityAI operator mərkəzi',
      };
    });

  if (timeline.length === 0) {
    timeline.push({
      id: `${row.id}-created`, status, title: STATUS_TITLES[status],
      note: 'Müraciət sistemdə qeydiyyata alınıb.', timestamp: row.created_at,
      actor: 'Vətəndaş portalı',
    });
  }

  return {
    id: String(row.id),
    tracking_code: row.tracking_code,
    category,
    description: row.description || '',
    priority,
    district: row.district || 'Bakı şəhəri',
    location: row.location || 'Ünvan qeyd edilməyib',
    status,
    department: categoryInfo?.department || 'Şəhər İcra Hakimiyyəti Operativ Mərkəzi',
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    analysis,
    comparison: null,
    timeline,
    has_media: mediaRows.some((entry) => entry.muraciet_id === row.id),
  };
}

async function readComplaints(limit = 500) {
  const { data: rows, error } = await supabase
    .from('muracietler')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const ids = (rows || []).map((row: any) => row.id);
  if (ids.length === 0) return [];

  const [analyses, history, media] = await Promise.all([
    supabase.from('ai_analizler').select('*').in('muraciet_id', ids),
    supabase.from('status_tarix').select('*').in('muraciet_id', ids).order('created_at', { ascending: true }),
    supabase.from('media_fayllar').select('muraciet_id').in('muraciet_id', ids),
  ]);
  const analysisRows = analyses.data || [];
  const historyRows = history.data || [];
  const mediaRows = media.data || [];
  return (rows || []).map((row: any) => mapComplaint(
    row,
    analysisRows.find((entry: any) => entry.muraciet_id === row.id),
    historyRows,
    mediaRows,
  ));
}

export async function GET(req: NextRequest) {
  try {
    const requestedLimit = Number(req.nextUrl.searchParams.get('limit'));
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 500)
      : 500;
    const complaints = await readComplaints(limit);
    const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase().replace(/^#/, '');
    if (code) {
      const complaint = complaints.find((entry) => entry.tracking_code.toUpperCase() === code);
      return complaint
        ? NextResponse.json({ complaint })
        : NextResponse.json({ error: 'Bu izləmə koduna uyğun müraciət tapılmadı.' }, { status: 404 });
    }
    return NextResponse.json({ complaints });
  } catch (error) {
    console.error('[CityAI complaints GET]', error);
    return NextResponse.json({ error: 'Müraciətlər yüklənərkən xəta baş verdi.' }, { status: 500 });
  }
}

