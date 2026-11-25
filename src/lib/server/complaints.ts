import { CATEGORIES, type CategoryId, type CityAnalysis, type ComplaintRecord, type ComplaintStatus, type PriorityLevel, type StatusTimelineEntry } from '@/lib/types';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

const VALID_CATEGORIES = new Set<CategoryId>(['yol', 'isiq', 'zibil', 'su', 'yasilliq', 'diger']);
const VALID_PRIORITIES = new Set<PriorityLevel>(['low', 'medium', 'high', 'critical']);
const VALID_STATUSES = new Set<ComplaintStatus>(['pending', 'analyzing', 'open', 'in_progress', 'resolved', 'rejected']);
const STATUS_TITLES: Record<ComplaintStatus, string> = {
  pending: 'Müraciət qəbul edildi', analyzing: 'AI ilkin təhlil aparıldı', open: 'Operator baxışına verildi',
  in_progress: 'İcra işləri başladı', resolved: 'Müraciət həll edildi', rejected: 'Müraciətə imtina edildi',
};

type ComplaintRow = {
  id: string; tracking_code: string; category: string; description: string | null; priority: string | null;
  location: string | null; status: string | null; created_at: string; updated_at: string | null;
};

function mapComplaint(row: ComplaintRow, analysisRow?: Record<string, unknown>, historyRows: Array<Record<string, unknown>> = [], hasMedia = false): ComplaintRecord {
  const category: CategoryId = VALID_CATEGORIES.has(row.category as CategoryId) ? row.category as CategoryId : 'diger';
  const status: ComplaintStatus = VALID_STATUSES.has(row.status as ComplaintStatus) ? row.status as ComplaintStatus : 'pending';
  const priority: PriorityLevel = VALID_PRIORITIES.has(row.priority as PriorityLevel) ? row.priority as PriorityLevel : 'medium';
  const categoryInfo = CATEGORIES.find((entry) => entry.id === category);
  const analysis: CityAnalysis | null = analysisRow ? {
    problem_type: typeof analysisRow.problem_type === 'string' ? analysisRow.problem_type : categoryInfo?.label || 'İnfrastruktur problemi',
    category_id: category,
    severity: VALID_PRIORITIES.has(analysisRow.severity as PriorityLevel) ? analysisRow.severity as PriorityLevel : priority,
    description: typeof analysisRow.description === 'string' ? analysisRow.description : row.description || '',
    tags: Array.isArray(analysisRow.tags) ? analysisRow.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 6) : [],
    confidence: typeof analysisRow.confidence === 'number' ? analysisRow.confidence : Number(analysisRow.confidence) || 0,
    is_infrastructure: true,
    recommended_department: categoryInfo?.department || 'Şəhər İcra Hakimiyyəti Operativ Mərkəzi',
  } : null;
  const timeline: StatusTimelineEntry[] = historyRows.map((entry, index) => {
    const eventStatus = VALID_STATUSES.has(entry.new_status as ComplaintStatus) ? entry.new_status as ComplaintStatus : status;
    return {
      id: String(entry.id ?? `${row.id}-${index}`), status: eventStatus, title: STATUS_TITLES[eventStatus],
      note: typeof entry.note === 'string' && entry.note ? entry.note : STATUS_TITLES[eventStatus],
      timestamp: typeof entry.created_at === 'string' ? entry.created_at : row.created_at,
      actor: 'CityAI operator mərkəzi',
    };
  });
  if (timeline.length === 0) timeline.push({ id: `${row.id}-created`, status, title: STATUS_TITLES[status], note: 'Müraciət sistemdə qeydiyyata alınıb.', timestamp: row.created_at, actor: 'Vətəndaş portalı' });
  return {
    id: row.id, tracking_code: row.tracking_code, category, description: row.description || '', priority,
    location: row.location || 'Ünvan qeyd edilməyib', status,
    department: categoryInfo?.department || 'Şəhər İcra Hakimiyyəti Operativ Mərkəzi',
    created_at: row.created_at, updated_at: row.updated_at || row.created_at, analysis, comparison: null, timeline, has_media: hasMedia,
  };
}

export async function readComplaintByTrackingCode(code: string): Promise<ComplaintRecord | null> {
  const db = getSupabaseAdmin();
  const { data: row, error } = await db.from('muracietler')
    .select('id,tracking_code,category,description,priority,location,status,created_at,updated_at')
    .eq('tracking_code', code).maybeSingle();
  if (error) throw error;
  if (!row) return null;
  return readOne(db, row as ComplaintRow);
}

export async function readAllComplaintsForAdmin(limit = 500): Promise<ComplaintRecord[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('muracietler')
    .select('id,tracking_code,category,description,priority,location,status,created_at,updated_at')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  const rows = (data || []) as ComplaintRow[];
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return [];
  const [analyses, history, media] = await Promise.all([
    db.from('ai_analizler').select('muraciet_id,problem_type,severity,description,tags,confidence').in('muraciet_id', ids),
    db.from('status_tarix').select('id,muraciet_id,new_status,note,created_at').in('muraciet_id', ids).order('created_at', { ascending: true }),
    db.from('media_fayllar').select('muraciet_id').in('muraciet_id', ids),
  ]);
  if (analyses.error) throw analyses.error;
  if (history.error) throw history.error;
  if (media.error) throw media.error;
  return rows.map((row) => mapComplaint(row,
    analyses.data?.find((entry) => entry.muraciet_id === row.id) as unknown as Record<string, unknown> | undefined,
    (history.data?.filter((entry) => entry.muraciet_id === row.id) || []) as unknown as Array<Record<string, unknown>>,
    Boolean(media.data?.some((entry) => entry.muraciet_id === row.id)),
  ));
}

async function readOne(db: ReturnType<typeof getSupabaseAdmin>, row: ComplaintRow): Promise<ComplaintRecord> {
  const [analysis, history, media] = await Promise.all([
    db.from('ai_analizler').select('problem_type,severity,description,tags,confidence').eq('muraciet_id', row.id).maybeSingle(),
    db.from('status_tarix').select('id,new_status,note,created_at').eq('muraciet_id', row.id).order('created_at', { ascending: true }),
    db.from('media_fayllar').select('id', { count: 'exact', head: true }).eq('muraciet_id', row.id),
  ]);
  if (analysis.error) throw analysis.error;
  if (history.error) throw history.error;
  if (media.error) throw media.error;
  return mapComplaint(row, analysis.data as unknown as Record<string, unknown> | undefined,
    (history.data || []) as unknown as Array<Record<string, unknown>>, (media.count || 0) > 0);
}

export async function updateComplaintStatus({
  id,
  status,
  note,
}: {
  id: string;
  status: ComplaintStatus;
  note?: string | null;
}): Promise<ComplaintRecord | null> {
  if (!VALID_STATUSES.has(status)) throw new Error('Unsupported complaint status.');
  const db = getSupabaseAdmin();
  const { data: current, error: readError } = await db.from('muracietler')
    .select('id,tracking_code,category,description,priority,location,status,created_at,updated_at')
    .eq('id', id).maybeSingle();
  if (readError) throw readError;
  if (!current) return null;
  const row = current as ComplaintRow;

  const updatedAt = new Date().toISOString();
  const { error: updateError } = await db.from('muracietler')
    .update({ status, updated_at: updatedAt })
    .eq('id', id);
  if (updateError) throw updateError;

  const { error: historyError } = await db.from('status_tarix').insert({
    muraciet_id: id,
    old_status: row.status,
    new_status: status,
    note: (note || '').trim() || STATUS_TITLES[status],
  });
  if (historyError) throw historyError;

  return readOne(db, { ...row, status, updated_at: updatedAt });
}
