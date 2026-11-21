export type CategoryId = 'yol' | 'isiq' | 'zibil' | 'su' | 'yasilliq' | 'diger';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintStatus =
  | 'pending'
  | 'analyzing'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type CityAnalysis = {
  problem_type: string;
  category_id: CategoryId;
  severity: PriorityLevel;
  description: string;
  tags: string[];
  confidence: number;
  is_infrastructure: boolean;
  recommended_department: string;
};

export type CityComparison = {
  is_resolved: boolean;
  is_same_location: boolean;
  confidence: number;
  resolution_score: number;
  summary: string;
  warning: string | null;
};

export type StatusTimelineEntry = {
  id: string;
  status: ComplaintStatus;
  title: string;
  note: string;
  timestamp: string;
  actor: string;
};

export type ComplaintRecord = {
  id: string;
  tracking_code: string;
  category: CategoryId;
  description: string;
  priority: PriorityLevel;
  location: string;
  status: ComplaintStatus;
  department: string;
  created_at: string;
  updated_at: string;
  analysis: CityAnalysis | null;
  comparison: CityComparison | null;
  timeline: StatusTimelineEntry[];
  has_media: boolean;
};

export const CATEGORIES: Array<{
  id: CategoryId;
  label: string;
  shortLabel: string;
  department: string;
  description: string;
}> = [
  {
    id: 'yol',
    label: 'Yol infrastrukturu',
    shortLabel: 'Yol',
    department: 'Azərbaycan Avtomobil Yolları Dövlət Agentliyi',
    description: 'Asfalt çökməsi, çuxur, səki zədələnməsi, yol nişanları',
  },
  {
    id: 'isiq',
    label: 'Küçə işıqlandırması',
    shortLabel: 'İşıq',
    department: 'Bakı Şəhər İşıqlandırma İdarəsi',
    description: 'Yanmayan küçə fənərləri, zədələnmiş işıq dirəkləri, işıqfor nasazlığı',
  },
  {
    id: 'zibil',
    label: 'Təmizlik və tullantı',
    shortLabel: 'Təmizlik',
    department: 'Mənzil-Kommunal Təsərrüfatı Departamenti',
    description: 'Daşmış konteynerlər, qeyri-qanuni tullantı yığını, küçə təmizliyi',
  },
  {
    id: 'su',
    label: 'Su və kanalizasiya',
    shortLabel: 'Su',
    department: 'İri Şəhərlərin Birləşmiş Su Təchizatı Xidməti',
    description: 'Su sızması, boru partlaması, açıq və ya tutulmuş kanalizasiya lyuku',
  },
  {
    id: 'yasilliq',
    label: 'Yaşıllıq və parklar',
    shortLabel: 'Yaşıllıq',
    department: 'Yaşıllaşdırma Təsərrüfatı Birliyi',
    description: 'Qırılmış ağac budaqları, qurumuş yaşıllıq, park infrastruktur zədəsi',
  },
  {
    id: 'diger',
    label: 'Digər infrastruktur',
    shortLabel: 'Digər',
    department: 'Şəhər İcra Hakimiyyəti Operativ Mərkəzi',
    description: 'Bina fasadı, dayanacaq pavilyonu, ümumi ictimai məkan problemləri',
  },
];

export const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; description: string; badgeBg: string; badgeText: string }
> = {
  low: {
    label: 'Aşağı',
    description: 'Planlı müdaxilə tələb edir',
    badgeBg: '#F1F5F5',
    badgeText: '#475569',
  },
  medium: {
    label: 'Orta',
    description: 'Standart icra növbəsi',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
  },
  high: {
    label: 'Yüksək',
    description: 'Sürətli operativ baxış tələb olunur',
    badgeBg: '#FFEDD5',
    badgeText: '#C2410C',
  },
  critical: {
    label: 'Kritik',
    description: 'Təcili təhlükəsizlik riski yaradır',
    badgeBg: '#FEE2E2',
    badgeText: '#B91C1C',
  },
};

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  {
    label: string;
    description: string;
    bg: string;
    text: string;
    stepOrder: number;
  }
> = {
  pending: {
    label: 'Qəbul edildi',
    description: 'Müraciət qeydə alınıb və ilkin yoxlama növbəsindədir.',
    bg: '#DBEAFE',
    text: '#1D4ED8',
    stepOrder: 1,
  },
  analyzing: {
    label: 'Təhlil edilir',
    description: 'Süni intellekt və operator təsnifatı aparılır.',
    bg: '#DBEAFE',
    text: '#1D4ED8',
    stepOrder: 2,
  },
  open: {
    label: 'Baxışdadır',
    description: 'Müraciət uyğun qurum üzrə operator baxış növbəsindədir.',
    bg: '#FEF3C7',
    text: '#B45309',
    stepOrder: 3,
  },
  in_progress: {
    label: 'İcradadır',
    description: 'Müraciət üzrə icra prosesi davam edir.',
    bg: '#FEF3C7',
    text: '#B45309',
    stepOrder: 4,
  },
  resolved: {
    label: 'Həll edildi',
    description: 'Operator problemin həll edildiyini təsdiqləyib.',
    bg: '#D8F3E8',
    text: '#087F70',
    stepOrder: 5,
  },
  rejected: {
    label: 'İmtina edildi',
    description: 'Müraciət səlahiyyət dairəsi xaricində və ya təkrar olduğuna görə bağlanıb.',
    bg: '#FEE2E2',
    text: '#B91C1C',
    stepOrder: 5,
  },
};

export function formatAzDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} · ${hours}:${minutes}`;
}
