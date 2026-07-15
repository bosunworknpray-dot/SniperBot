// DashboardHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Bell, Wifi, Loader2, Shield, Key } from 'lucide-react';

interface HeaderData {
  status: 'connected' | 'disconnected' | 'connecting' | 'authenticated';
  latency: number;
  lastUpdated: string;
  date: string;
  accountType?: string;
  uid?: string;
  isPaperMode?: boolean;
}

// Bybit API endpoints
const BYBIT_API = {
  marketTime: 'https://api.bybit.com/v5/market/time',
  accountInfo: 'https://api.bybit.com/v5/account/info',
};

// Helper to generate Bybit signature
const generateSignature = (apiKey: string, apiSecret: string, timestamp: string, recvWindow: string, params: string) => {
  const crypto = require('crypto');
  const paramStr = timestamp + apiKey + recvWindow + params;
  return crypto.createHmac('sha256', apiSecret).update(paramStr).digest('hex');
};

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
  
  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get API credentials
  const getApiCredentials = () => {
    return {
      apiKey: process.env.NEXT_PUBLIC_BYBIT_API_KEY || '',
      apiSecret: process.env.NEXT_PUBLIC_BYBIT_API_SECRET || '',
      isTestnet: true,
    };
  };

  // Fetch account info for Unified Account
  const fetchAccountInfo = async () => {
    try {
      const { apiKey, apiSecret, isTestnet } = getApiCredentials();
      if (!apiKey || !apiSecret) {
        setData(prev => ({ ...prev, isPaperMode: true }));
        return;
      }

      const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
      const timestamp = Date.now().toString();
      const recvWindow = '5000';
      const params = '';
      
      const signature = generateSignature(apiKey, apiSecret, timestamp, recvWindow, params);
      
      const response = await fetch(`${baseUrl}/v5/account/info`, {
        method: 'GET',
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
          'X-BAPI-RECV-WINDOW': recvWindow,
        },
      });

      const result = await response.json();
      
      if (result && result.retCode === 0 && result.result) {
        const account = result.result;
        setData(prev => ({
          ...prev,
          accountType: account.accountType || account.accType || 'Unified',
          uid: account.uid || account.accountUid || 'N/A',
          isPaperMode: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  const fetchConnectionStatus = async () => {
    try {
      const start = Date.now();
      const response = await fetch(BYBIT_API.marketTime);
      const latency = Date.now() - start;

      if (response.ok) {
        const result = await response.json();
        if (result.retCode === 0) {
          setData(prev => ({
            ...prev,
            status: wsRef.current?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
            latency,
            lastUpdated: new Date().toLocaleTimeString(),
          }));
        } else {
          setData(prev => ({ ...prev, status: 'disconnected' }));
        }
      } else {
        setData(prev => ({ ...prev, status: 'disconnected' }));
      }
    } catch (error) {
      setData(prev => ({ ...prev, status: 'disconnected' }));
    }
  };

  // WebSocket connection for real-time updates
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Dashboard WebSocket connected');
        setData(prev => ({ ...prev, status: 'connected' }));
        
        // Subscribe to tickers
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
            // Update last updated time
            setData(prev => ({ ...prev, lastUpdated: new Date().toLocaleTimeString() }));
          } else if (data.op === 'pong') {
            // Update latency
            setData(prev => ({ ...prev, latency: 0 }));
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      ws.onerror = (error) => {
        console.warn('Dashboard WebSocket error:', error);
        setData(prev => ({ ...prev, status: 'disconnected' }));
      };

      ws.onclose = () => {
        console.log('Dashboard WebSocket disconnected');
        setData(prev => ({ ...prev, status: 'disconnected' }));
        stopHeartbeat();
        
        // Attempt to reconnect
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
    fetchAccountInfo();
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
    await fetchAccountInfo();
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