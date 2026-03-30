import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortfolioManager } from './PortfolioManager';
import { supabase } from '@/lib/supabase';

// Mock fetch
global.fetch = vi.fn();

describe('PortfolioManager AI Lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    holdings: [],
    customRules: [],
    customStocks: [],
    onAddHolding: vi.fn(),
    onRemoveHolding: vi.fn(),
    onUpdateShares: vi.fn(),
    onUpdateAcquisitionDate: vi.fn(),
    onAddCustomRule: vi.fn(),
    onAddStockName: vi.fn(),
  };

  it('SHOULD include Authorization header in fetch request if session exists', async () => {
    const mockSession = { access_token: 'fake-jwt-token' };
    (supabase.auth.getSession as any).mockResolvedValueOnce({
      data: { session: mockSession },
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stockCode: '2702', stockName: 'マクドナルド', benefits: [] }),
    });

    render(<PortfolioManager {...defaultProps} />);

    // Open add modal
    const addBtn = screen.getByText('銘柄を追加');
    fireEvent.click(addBtn);

    // Enter search query (use something that doesn't trigger static results)
    const input = screen.getByPlaceholderText('例: 2702, マクドナルド');
    fireEvent.change(input, { target: { value: 'UNKNOWN_CODE' } });

    // Click AI search button
    const aiBtn = screen.getByRole('button', { name: /AIで優待情報を検索/i });
    fireEvent.click(aiBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/benefit-lookup', expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer fake-jwt-token'
        })
      }));
    });
  });

  it('SHOULD NOT include Authorization header if no session exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValueOnce({
      data: { session: null },
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'AI検索を利用するにはログインが必要です' }),
    });

    render(<PortfolioManager {...defaultProps} />);

    // Open add modal
    fireEvent.click(screen.getByText('銘柄を追加'));
    fireEvent.change(screen.getByPlaceholderText('例: 2702, マクドナルド'), { target: { value: 'UNKNOWN_CODE' } });
    fireEvent.click(screen.getByRole('button', { name: /AIで優待情報を検索/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/benefit-lookup', expect.objectContaining({
        headers: expect.not.objectContaining({
          'Authorization': expect.stringContaining('Bearer')
        })
      }));
    });

    // Error message should be displayed
    expect(await screen.findByText('AI検索を利用するにはログインが必要です')).toBeInTheDocument();
  });
});
