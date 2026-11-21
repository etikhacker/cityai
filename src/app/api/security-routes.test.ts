import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/server/rate-limit', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(null),
  hasOversizedBody: vi.fn().mockReturnValue(false),
}));
import { GET as adminComplaints } from '@/app/api/admin/complaints/route';
import { POST as compare } from '@/app/api/compare/route';
import { GET as complaints } from '@/app/api/complaints/route';

describe('API access boundaries', () => {
  it('does not return a public complaint list without a tracking code', async () => {
    const request = new NextRequest('https://cityai.test/api/complaints');
    const response = await complaints(request);
    expect(response.status).toBe(400);
  });

  it('requires an admin session before returning the complaint queue', async () => {
    const request = new NextRequest('https://cityai.test/api/admin/complaints', { headers: { 'x-real-ip': '192.0.2.42' } });
    const response = await adminComplaints(request);
    expect(response.status).toBe(401);
  });

  it('rejects public attempts to update a complaint through image comparison', async () => {
    const form = new FormData();
    form.set('muraciet_id', '3b241101-e2bb-4255-8caf-4136c566a962');
    const request = new NextRequest('https://cityai.test/api/compare', {
      method: 'POST', headers: { origin: 'https://cityai.test', 'x-real-ip': '192.0.2.43' }, body: form,
    });
    const response = await compare(request);
    expect(response.status).toBe(401);
  });
});
