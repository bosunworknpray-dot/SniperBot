// hooks/useRealtimeData.ts
// Real-time data updates for dashboard - polls all metrics simultaneously

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { requestManager } from '@/lib/requestManager';
import { logger } from '@/lib/logger';

export interface RealtimeData {
  balance: {
    totalEquity: number;
    availableBalance: number;
    totalMarginBalance: number;
    accountIMRate: string;
    totalInitialMargin: string;
    totalAvailableBalance: string;
  };
  positions: Array<{
    symbol: string;
    side: 'Buy' | 'Sell' | 'None';
    size: string;
    entryPrice: string;
    markPrice: string;
    leverage: string;
    unrealisedPnl: string;
    positionValue: string;
    createdTime: string;
    updatedTime: string;
  }>;
  openOrders: Array<any>;
  lastUpdate: number;
}

export interface UseRealtimeDataOptions {
  pollInterval?: number; // milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
}

const DEFAULT_POLL_INTERVAL = 2000; // 2 seconds

export function useRealtimeData(options: UseRealtimeDataOptions = {}) {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    enabled = true,
    onError,
  } = options;

  const [data, setData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchRealtimeData = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [walletResponse, positionsResponse, ordersResponse] = await Promise.allSettled([
        requestManager.executeWithRateLimit<any>('/api/bybit', {
          method: 'POST',
          body: JSON.stringify({
            endpoint: '/v5/account/wallet-balance',
            method: 'GET',
          }),
        }),
        requestManager.executeWithRateLimit<any>('/api/bybit', {
          method: 'POST',
          body: JSON.stringify({
            endpoint: '/v5/position/list',
            method: 'GET',
          }),
        }),
        requestManager.executeWithRateLimit<any>('/api/bybit', {
          method: 'POST',
          body: JSON.stringify({
            endpoint: '/v5/order/realtime',
            method: 'GET',
          }),
        }),
      ]);

      if (!isMountedRef.current) return;

      const walletData = walletResponse.status === 'fulfilled' ? walletResponse.value : null;
      const positionsData = positionsResponse.status === 'fulfilled' ? positionsResponse.value : null;
      const ordersData = ordersResponse.status === 'fulfilled' ? ordersResponse.value : null;

      // Extract wallet balance
      const walletBalance = walletData?.result?.list?.[0] || {
        totalEquity: '0',
        availableBalance: '0',
        totalMarginBalance: '0',
        accountIMRate: '0',
        totalInitialMargin: '0',
        totalAvailableBalance: '0',
      };

      // Extract positions
      const positions = positionsData?.result?.list || [];

      // Extract open orders
      const openOrders = ordersData?.result?.list || [];

      setData({
        balance: {
          totalEquity: parseFloat(walletBalance.totalEquity || '0'),
          availableBalance: parseFloat(walletBalance.availableBalance || '0'),
          totalMarginBalance: walletBalance.totalMarginBalance || '0',
          accountIMRate: walletBalance.accountIMRate || '0',
          totalInitialMargin: walletBalance.totalInitialMargin || '0',
          totalAvailableBalance: walletBalance.totalAvailableBalance || '0',
        },
        positions,
        openOrders,
        lastUpdate: Date.now(),
      });

      logger.debug('RealtimeData', 'Data updated successfully', {
        equity: walletBalance.totalEquity,
        positionCount: positions.length,
        orderCount: openOrders.length,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('RealtimeData', 'Failed to fetch realtime data', { error: error.message }, error);
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, onError]);

  const startPolling = useCallback(() => {
    if (!enabled) return;

    // Initial fetch
    fetchRealtimeData();

    // Set up polling
    pollTimeoutRef.current = setInterval(fetchRealtimeData, pollInterval);
  }, [enabled, fetchRealtimeData, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearInterval(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    data,
    loading,
    error,
    refetch: fetchRealtimeData,
  };
}
