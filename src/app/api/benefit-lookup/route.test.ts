import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateObject } from 'ai';

describe('POST /api/benefit-lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SHOULD return 401 if no Authorization header is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/benefit-lookup', {
      method: 'POST',
      body: JSON.stringify({ stockCode: '1234' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('AI検索を利用するにはログインが必要です');
  });

  it('SHOULD return 401 if token is invalid or user not found', async () => {
    (supabase.auth.getUser as any).mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const req = new NextRequest('http://localhost:3000/api/benefit-lookup', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid-token' },
      body: JSON.stringify({ stockCode: '1234' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('AI検索を利用するにはログインが必要です');
  });

  it('SHOULD return cached data if available in benefit_cache', async () => {
    const cachedData = { stockCode: '1234', stockName: 'Test Stock', benefits: [] };
    
    // Mock user
    (supabase.auth.getUser as any).mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock cache hit
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValueOnce({ data: { data: cachedData }, error: null });

    (supabase.from as any).mockReturnValue({
      select: () => ({
        eq: () => ({
          single: mockSingle
        })
      })
    });

    const req = new NextRequest('http://localhost:3000/api/benefit-lookup', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ stockCode: '1234' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(cachedData);
    // AI check not called
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('SHOULD call AI if no cache and save to benefit_cache', async () => {
    const aiResponse = { stockCode: '1234', stockName: 'AI Stock', benefits: [] };
    
    // Mock user
    (supabase.auth.getUser as any).mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock cache miss
    (supabase.from as any).mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValueOnce({ data: null, error: null })
        })
      }),
      upsert: vi.fn().mockResolvedValueOnce({ error: null })
    });

    // Mock AI call
    (generateObject as any).mockResolvedValueOnce({ object: aiResponse });

    const req = new NextRequest('http://localhost:3000/api/benefit-lookup', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ stockCode: '1234' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(aiResponse);
    expect(supabase.from).toHaveBeenCalledWith('benefit_cache');
  });
});
