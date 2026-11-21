import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn().mockResolvedValue(null),
  storageCreateSignedUploadUrl: vi.fn(),
  storageList: vi.fn(),
  complaintInsert: vi.fn(),
  childInsert: vi.fn(),
  mediaLookup: vi.fn().mockResolvedValue({ data: [], error: null }),
  storageRemove: vi.fn().mockResolvedValue({ error: null }),
  readComplaint: vi.fn(),
  readAdminComplaints: vi.fn(),
  analyzeCityImage: vi.fn(),
  analyzeCityVideo: vi.fn(),
}));

vi.mock('@/lib/server/rate-limit', () => ({
  applyRateLimit: mocks.rateLimit,
  hasOversizedBody: vi.fn().mockReturnValue(false),
}));
vi.mock('@/lib/server/complaints', () => ({
  readComplaintByTrackingCode: mocks.readComplaint,
  readAllComplaintsForAdmin: mocks.readAdminComplaints,
}));
vi.mock('@/lib/city-analysis', () => ({
  analyzeCityImage: mocks.analyzeCityImage,
  analyzeCityVideo: mocks.analyzeCityVideo,
  CityAnalysisError: class CityAnalysisError extends Error {},
  compareCityImages: vi.fn(),
}));
vi.mock('@/lib/server/supabase-admin', () => ({
  getSupabaseAdmin: () => ({
    from(table: string) {
      if (table === 'muracietler') return {
        insert: mocks.complaintInsert,
        delete: () => ({ eq: async () => ({ error: null }) }),
      };
      if (table === 'media_fayllar') return {
        insert: mocks.childInsert,
        select: () => ({ in: mocks.mediaLookup }),
        delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      };
      return {
        insert: mocks.childInsert,
        delete: () => ({ eq: async () => ({ error: null }) }),
      };
    },
    storage: {
      from: () => ({
        createSignedUploadUrl: mocks.storageCreateSignedUploadUrl,
        list: mocks.storageList,
        remove: mocks.storageRemove,
      }),
    },
  }),
}));

import { GET as trackingGet } from '@/app/api/complaints/route';
import { POST as submitPost } from '@/app/api/submit/route';
import { POST as uploadPost } from '@/app/api/uploads/route';
import { POST as analyzePost } from '@/app/api/analyze/route';
import { POST as adminLoginPost } from '@/app/api/admin/session/route';
import { GET as adminComplaintsGet } from '@/app/api/admin/complaints/route';
import { ADMIN_COOKIE } from '@/lib/server/admin-auth';

const secret = 'integration-test-secret-that-is-long-enough';

afterEach(() => {
  vi.clearAllMocks();
  mocks.rateLimit.mockResolvedValue(null);
  mocks.mediaLookup.mockResolvedValue({ data: [], error: null });
  mocks.storageRemove.mockClear();
  process.env.CITYAI_SERVER_SECRET = secret;
  process.env.CITYAI_ADMIN_PASSWORD = 'integration-admin-password';
});

describe('security-sensitive API integrations', () => {
  it('keeps the API database contract aligned with the unapplied SQL migrations', () => {
    const privacyMigration = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261120200000_cityai_private_complaints.sql', import.meta.url)), 'utf8');
    const limiterMigration = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261120190000_cityai_distributed_rate_limits.sql', import.meta.url)), 'utf8');
    for (const table of ['muracietler', 'ai_analizler', 'media_fayllar', 'status_tarix']) {
      expect(privacyMigration).toContain(`public.${table}`);
    }
    expect(privacyMigration).toContain('to service_role');
    expect(privacyMigration).toContain('create unique index if not exists media_fayllar_storage_path_unique');
    expect(limiterMigration).toContain('public.cityai_check_rate_limit');
    expect(limiterMigration).toContain('grant execute on function public.cityai_check_rate_limit(text, integer, integer) to service_role');
    expect(limiterMigration).toMatch(/p_key is null or p_limit is null or p_window_seconds is null/i);
  });

  it('tracks only the requested ticket by its code', async () => {
    mocks.readComplaint.mockResolvedValue({ tracking_code: 'MZB-0123456789ABCDEF0123456789ABCDEF', description: 'Pothole' });
    const response = await trackingGet(new NextRequest('https://cityai.test/api/complaints?code=MZB-0123456789ABCDEF0123456789ABCDEF'));
    expect(response.status).toBe(200);
    expect(mocks.readComplaint).toHaveBeenCalledWith('MZB-0123456789ABCDEF0123456789ABCDEF');
    expect(await response.json()).toHaveProperty('complaint.tracking_code');
  });

  it('issues signed private media uploads then submits their proof and AI metadata', async () => {
    mocks.storageCreateSignedUploadUrl.mockImplementation(async (path: string) => ({ data: { path, token: 'signed-token' }, error: null }));
    mocks.storageList.mockImplementation(async (_prefix: string, options: { search: string }) => ({ data: [{ name: options.search, metadata: { size: 2048 } }], error: null }));
    mocks.complaintInsert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: 'complaint-1' }, error: null }) }) });
    mocks.childInsert.mockResolvedValue({ error: null });

    const uploadResponse = await uploadPost(new NextRequest('https://cityai.test/api/uploads', {
      method: 'POST', headers: { origin: 'https://cityai.test' },
      body: JSON.stringify({ files: [{ type: 'video/mp4', size: 2048 }] }),
    }));
    expect(uploadResponse.status).toBe(200);
    const [{ path, token, proof }] = (await uploadResponse.json()).files;
    expect(token).toBe('signed-token');

    const submitResponse = await submitPost(new NextRequest('https://cityai.test/api/submit', {
      method: 'POST', headers: { origin: 'https://cityai.test' },
      body: JSON.stringify({
        category: 'yol', description: 'Yolda çuxur var', priority: 'medium', location: 'Bakı',
        analysis: { problem_type: 'Çuxur', description: 'Yol örtüyü zədələnib', severity: 'medium', confidence: 0.9, is_infrastructure: true, tags: ['yol'] },
        media: [{ path, type: 'video/mp4', size: 2048, proof }],
      }),
    }));
    expect(submitResponse.status).toBe(201);
    expect(mocks.complaintInsert).toHaveBeenCalledWith(expect.objectContaining({ category: 'yol', location: 'Bakı' }));
    expect(mocks.childInsert).toHaveBeenCalledTimes(3);
  });

  it('rejects media proofs already linked to another complaint', async () => {
    const path = 'ea1cc9f4-5904-4c2d-8242-5dd4113876a0.mp4';
    mocks.mediaLookup.mockResolvedValueOnce({ data: [{ storage_path: path }], error: null });
    const { createMediaProof } = await import('@/lib/server/media-proof');
    const response = await submitPost(new NextRequest('https://cityai.test/api/submit', {
      method: 'POST', headers: { origin: 'https://cityai.test' },
      body: JSON.stringify({
        category: 'yol', description: 'Yolda çuxur var', priority: 'medium', location: 'Bakı',
        media: [{ path, type: 'video/mp4', size: 2048, proof: createMediaProof(path, 'video/mp4', 2048) }],
      }),
    }));
    expect(response.status).toBe(409);
    expect(mocks.complaintInsert).not.toHaveBeenCalled();
  });

  it('does not delete an upload that another concurrent submission linked', async () => {
    const path = 'ea1cc9f4-5904-4c2d-8242-5dd4113876a0.mp4';
    mocks.storageList.mockResolvedValue({ data: [{ name: path, metadata: { size: 2048 } }], error: null });
    mocks.complaintInsert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: 'complaint-race' }, error: null }) }) });
    mocks.childInsert.mockImplementation(async (rows: Array<{ storage_path?: string }>) =>
      rows?.[0]?.storage_path ? { error: Object.assign(new Error('unique index conflict'), { code: '23505' }) } : { error: null });
    mocks.mediaLookup
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [{ storage_path: path }], error: null });
    const { createMediaProof } = await import('@/lib/server/media-proof');
    const response = await submitPost(new NextRequest('https://cityai.test/api/submit', {
      method: 'POST', headers: { origin: 'https://cityai.test' },
      body: JSON.stringify({
        category: 'yol', description: 'Yolda çuxur var', priority: 'medium', location: 'Bakı',
        media: [{ path, type: 'video/mp4', size: 2048, proof: createMediaProof(path, 'video/mp4', 2048) }],
      }),
    }));
    expect(response.status).toBe(409);
    expect(mocks.storageRemove).not.toHaveBeenCalledWith([path]);
  });

  it('passes validated images to the AI analysis service', async () => {
    mocks.analyzeCityImage.mockResolvedValue({ problem_type: 'Yol çuxuru', confidence: 0.91 });
    const form = new FormData();
    form.set('file', new File([new Uint8Array([1, 2, 3])], 'road.png', { type: 'image/png' }));
    const response = await analyzePost(new NextRequest('https://cityai.test/api/analyze', {
      method: 'POST', headers: { origin: 'https://cityai.test' }, body: form,
    }));
    expect(response.status).toBe(200);
    expect(mocks.analyzeCityImage).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'image/png' }));
  });

  it('passes video bytes as video content to the AI analysis service', async () => {
    mocks.analyzeCityVideo.mockResolvedValue({ problem_type: 'Yol problemi', category_id: 'yol' });
    const mp4Header = new Uint8Array(16);
    mp4Header.set([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0]);
    const form = new FormData();
    form.set('file', new File([mp4Header], 'clip.mp4', { type: 'video/mp4' }));
    const response = await analyzePost(new NextRequest('https://cityai.test/api/analyze', {
      method: 'POST', headers: { origin: 'https://cityai.test' }, body: form,
    }));
    expect(response.status).toBe(200);
    expect(mocks.analyzeCityVideo).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'video/mp4' }));
    expect(mocks.analyzeCityImage).not.toHaveBeenCalled();
  });

  it('rejects a video whose bytes do not match its declared MIME type', async () => {
    const form = new FormData();
    form.set('file', new File([new Uint8Array([1, 2, 3, 4])], 'spoofed.mp4', { type: 'video/mp4' }));
    const response = await analyzePost(new NextRequest('https://cityai.test/api/analyze', {
      method: 'POST', headers: { origin: 'https://cityai.test' }, body: form,
    }));
    expect(response.status).toBe(415);
    expect(mocks.analyzeCityVideo).not.toHaveBeenCalled();
  });

  it('sets a protected admin cookie and requires it for the complaint queue', async () => {
    process.env.CITYAI_SERVER_SECRET = secret;
    process.env.CITYAI_ADMIN_PASSWORD = 'integration-admin-password';
    const login = await adminLoginPost(new NextRequest('https://cityai.test/api/admin/session', {
      method: 'POST', headers: { origin: 'https://cityai.test' }, body: JSON.stringify({ password: process.env.CITYAI_ADMIN_PASSWORD }),
    }));
    expect(login.status).toBe(200);
    const cookie = login.cookies.get(ADMIN_COOKIE);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('strict');
    expect(cookie?.path).toBe('/api');

    mocks.readAdminComplaints.mockResolvedValue([]);
    const protectedRequest = new NextRequest('https://cityai.test/api/admin/complaints', {
      headers: { cookie: `${ADMIN_COOKIE}=${cookie?.value}` },
    });
    expect((await adminComplaintsGet(protectedRequest)).status).toBe(200);
    expect(mocks.readAdminComplaints).toHaveBeenCalledOnce();

    const anonymousRequest = new NextRequest('https://cityai.test/api/admin/complaints');
    expect((await adminComplaintsGet(anonymousRequest)).status).toBe(401);
  });

  it('rejects admin login CSRF and wrong passwords', async () => {
    const csrf = await adminLoginPost(new NextRequest('https://cityai.test/api/admin/session', {
      method: 'POST', body: JSON.stringify({ password: 'integration-admin-password' }),
    }));
    expect(csrf.status).toBe(403);
    const wrongPassword = await adminLoginPost(new NextRequest('https://cityai.test/api/admin/session', {
      method: 'POST', headers: { origin: 'https://cityai.test' }, body: JSON.stringify({ password: 'wrong' }),
    }));
    expect(wrongPassword.status).toBe(401);
  });
});
