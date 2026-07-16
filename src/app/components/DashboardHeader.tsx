// app/components/DashboardHeader.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BYBIT_BASE_URL, createBybitAuthHeaders, fetchBybitWalletBalance, getBybitCredentials, safeJsonParse } from '@/lib/bybit';
import { RefreshCw, Bell, Wifi, Loader2, Shield } from 'lucide-react';

interface HeaderData {
  status: 'connected' | 'disconnected' | 'connecting' | 'authenticated';
  latency: number;
  lastUpdated: string;
  date: string;
  accountType?: string;
  uid?: string;
  balance?: number;
  isPaperMode?: boolean;
}

// ============== BYBIT API CONFIG ==============
const BYBIT_WS_URL = 'wss://stream.bybit.com/v5/public/linear';

// ============== API HELPERS ==============
const getApiCredentials = () => getBybitCredentials();

// ============== API FUNCTIONS ==============

// Fetch account info
const fetchAccountInfo = async (): Promise<{ type: string; uid: string; balance: number } | null> => {
  try {
    const { apiKey, apiSecret } = getApiCredentials();
    if (!apiKey || !apiSecret) {
      return { type: 'Demo', uid: 'N/A', balance: 0 };
    }

    const balanceData = await fetchBybitWalletBalance(apiKey, apiSecret);
    return {
      type: 'Unified',
      uid: 'N/A',
      balance: balanceData.totalEquity || 0,
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
};

// ============== COMPONENT ==============

export default function DashboardHeader() {
  const [data, setData] = useState<HeaderData>({
    status: 'connecting',
    latency: 0,
    lastUpdated: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    isPaperMode: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [isBotActive, setIsBotActive] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch connection status
  const fetchConnectionStatus = async () => {
    try {
      const start = Date.now();
      const response = await fetch(`${BYBIT_BASE_URL}/v5/market/time`);
      const latency = Date.now() - start;

      if (response.ok) {
        const result = await safeJsonParse(response);
        if (result?.retCode === 0) {
          // Fetch account info
          const accountInfo = await fetchAccountInfo();
          
          setData(prev => ({
            ...prev,
            status: wsRef.current?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
            latency,
            lastUpdated: new Date().toLocaleTimeString(),
            isPaperMode: !accountInfo?.uid || accountInfo.uid === 'N/A',
            accountType: accountInfo?.type || prev.accountType,
            uid: accountInfo?.uid || prev.uid,
            balance: accountInfo?.balance ?? prev.balance,
          }));
        }
      }
    } catch (error) {
      setData(prev => ({ ...prev, status: 'disconnected' }));
    }
  };

  // Connect WebSocket
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(BYBIT_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Dashboard WebSocket connected');
        setData(prev => ({ ...prev, status: 'connected' }));

        ws.send(JSON.stringify({
          op: 'subscribe',
          args: ['tickers.BTCUSDT', 'tickers.ETHUSDT', 'tickers.SOLUSDT']
        }));

        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.topic === 'tickers') {
            setData(prev => ({ ...prev, lastUpdated: new Date().toLocaleTimeString() }));
          } else if (data.op === 'pong') {
            setData(prev => ({ ...prev, latency: 0 }));
          }
        } catch (err) {
          // Ignore
        }
      };

      ws.onerror = () => {
        setData(prev => ({ ...prev, status: 'disconnected' }));
      };

      ws.onclose = () => {
        console.log('Dashboard WebSocket disconnected');
        setData(prev => ({ ...prev, status: 'disconnected' }));
        stopHeartbeat();

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };
    } catch (err) {
      console.error('Failed to connect dashboard WebSocket:', err);
      setData(prev => ({ ...prev, status: 'disconnected' }));
    }
  };

  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ op: 'ping' }));
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Normal closure');
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopHeartbeat();
  };

  useEffect(() => {
    fetchConnectionStatus();
    connectWebSocket();

    const interval = setInterval(fetchConnectionStatus, 30000);
    return () => {
      clearInterval(interval);
      disconnectWebSocket();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchConnectionStatus();
    setIsRefreshing(false);
  };

  const statusColor = {
    connected: 'text-positive',
    authenticated: 'text-positive',
    disconnected: 'text-negative',
    connecting: 'text-warning',
  };

  const statusText = {
    connected: 'Connected',
    authenticated: 'Authenticated',
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Live Trading Dashboard
          </h1>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono ${
            data.isPaperMode 
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}>
            {data.isPaperMode ? '📄 PAPER' : '⚡ LIVE'}
          </span>
          {!data.isPaperMode && data.accountType && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {data.accountType} Account
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Wifi size={11} className={statusColor[data.status]} />
            <span>
              Bybit WS · {data.status === 'connected' || data.status === 'authenticated' 
                ? `${data.latency}ms latency` 
                : statusText[data.status]}
            </span>
          </div>
          {!data.isPaperMode && data.uid && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Shield size={11} className="text-muted-foreground" />
                <span className="font-mono">UID: {data.uid}</span>
              </div>
            </>
          )}
          {!data.isPaperMode && typeof data.balance === 'number' && data.balance > 0 && (
            <>
              <span>·</span>
              <span className="font-mono text-foreground">Balance: ${data.balance.toFixed(2)}</span>
            </>
          )}
          <span>·</span>
          <span className="font-mono">Last updated: {data.lastUpdated}</span>
          <span>·</span>
          <span>{data.date}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-95 disabled:opacity-50"
          aria-label="Refresh dashboard data"
        >
          {isRefreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
        <button
          className="relative p-2 rounded-md text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-95"
          aria-label={`View alerts — ${unreadAlerts} unread`}
        >
          <Bell size={14} />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning border border-background" />
          )}
        </button>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${
          isBotActive 
            ? 'bg-positive-subtle border-positive/20' 
            : 'bg-muted border-border'
        }`}>
          <span className="relative flex h-2 w-2">
            {isBotActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isBotActive ? 'bg-positive' : 'bg-muted-foreground'
            }`} />
          </span>
          <span className={`text-xs font-semibold ${
            isBotActive ? 'text-positive' : 'text-muted-foreground'
          }`}>
            Bot {isBotActive ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>
    </div>
  );
}