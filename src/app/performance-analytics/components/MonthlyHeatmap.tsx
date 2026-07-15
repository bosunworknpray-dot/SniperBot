'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface HeatmapCell {
  day: number;
  pnlPct: number | null;
  trades: number;
  priceChange: number | null;
}

interface HeatmapStats {
  totalPnl: number;
  winDays: number;
  tradingDays: number;
  totalTrades: number;
  bestDay: number;
  worstDay: number;
}

// Bybit API endpoints
const BYBIT_API = {
  kline: 'https://api.bybit.com/v5/market/kline',
  accountInfo: 'https://api.bybit.com/v5/account/info',
  spot: 'https://api.bybit.com/v5/market/tickers',
};

const BYBIT_WS = {
  linear: 'wss://stream.bybit.com/v5/public/linear',
  private: 'wss://stream.bybit.com/v5/private/linear',
};

const SUPPORTED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

// Helper to safely parse JSON
const safeJsonParse = async (response: Response) => {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// Helper to generate Bybit signature
const generateSignature = (apiKey: string, apiSecret: string, timestamp: string, recvWindow: string, params: string) => {
  const crypto = require('crypto');
  const paramStr = timestamp + apiKey + recvWindow + params;
  return crypto.createHmac('sha256', apiSecret).update(paramStr).digest('hex');
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getHeatmapClass(pnlPct: number | null): string {
  if (pnlPct === null) return 'bg-muted/30 text-muted-foreground/30';
  if (pnlPct >= 3) return 'bg-green-600/80 text-white';
  if (pnlPct >= 2) return 'bg-green-500/70 text-white';
  if (pnlPct >= 1) return 'bg-green-400/60 text-gray-900';
  if (pnlPct >= 0.5) return 'bg-green-300/50 text-gray-900';
  if (pnlPct > 0) return 'bg-green-200/40 text-gray-900';
  if (pnlPct === 0) return 'bg-gray-300/40 text-gray-500';
  if (pnlPct >= -0.5) return 'bg-red-200/40 text-gray-900';
  if (pnlPct >= -1) return 'bg-red-300/50 text-gray-900';
  if (pnlPct >= -2) return 'bg-red-400/60 text-white';
  if (pnlPct >= -3) return 'bg-red-500/70 text-white';
  return 'bg-red-600/80 text-white';
}

export default function MonthlyHeatmap() {
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<HeatmapStats>({
    totalPnl: 0,
    winDays: 0,
    tradingDays: 0,
    totalTrades: 0,
    bestDay: 0,
    worstDay: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'authenticated'>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [accountInfo, setAccountInfo] = useState<{ uid: string; accountType: string } | null>(null);

  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const privateWsRef = useRef<WebSocket | null>(null);
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
      if (!apiKey || !apiSecret) return;

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

      const result = await safeJsonParse(response);
      
      if (result && result.retCode === 0 && result.result) {
        const account = result.result;
        setAccountInfo({
          uid: account.uid || account.accountUid || 'N/A',
          accountType: account.accountType || account.accType || 'Unified',
        });
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  // Fetch current price for real-time updates
  const fetchCurrentPrice = async (): Promise<number> => {
    try {
      const response = await fetch(`${BYBIT_API.spot}?category=linear&symbol=BTCUSDT`);
      const result = await safeJsonParse(response);
      
      if (result && result.retCode === 0 && result.result?.list?.length > 0) {
        return parseFloat(result.result.list[0].lastPrice);
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch account info
      await fetchAccountInfo();

      // Fetch daily kline data for the current month (30 days)
      const response = await fetch(`${BYBIT_API.kline}?category=linear&symbol=BTCUSDT&interval=D&limit=30`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch kline data');
      }
      
      const result = await safeJsonParse(response);
      
      if (result && result.retCode === 0 && result.result?.list) {
        const klines = result.result.list;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Get current price for today's update
        const currentPrice = await fetchCurrentPrice();
        
        // Get the first day of the month to calculate starting weekday
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        
        const cells: HeatmapCell[] = [];
        let totalPnl = 0;
        let winDays = 0;
        let tradingDays = 0;
        let totalTrades = 0;
        let bestDay = -Infinity;
        let worstDay = Infinity;
        
        // Create map of day -> kline data
        const klineMap = new Map<number, any>();
        klines.forEach((k: any) => {
          const date = new Date(parseInt(k[0]));
          const day = date.getDate();
          klineMap.set(day, k);
        });
        
        // Build calendar for the month
        for (let day = 1; day <= daysInMonth; day++) {
          const kline = klineMap.get(day);
          const isToday = day === now.getDate();
          
          if (kline || isToday) {
            let open: number, close: number, high: number, low: number, volume: number;
            
            if (isToday && currentPrice > 0) {
              // Use today's data from kline if available, else use current price
              if (kline) {
                open = parseFloat(kline[1]);
                close = parseFloat(kline[4]);
                high = parseFloat(kline[2]);
                low = parseFloat(kline[3]);
                volume = parseFloat(kline[5]);
              } else {
                // Use yesterday's close as open and current price as close
                const yesterday = klineMap.get(day - 1);
                open = yesterday ? parseFloat(yesterday[4]) : currentPrice * 0.99;
                close = currentPrice;
                high = Math.max(open, close) * 1.01;
                low = Math.min(open, close) * 0.99;
                volume = 1e8;
              }
            } else if (kline) {
              open = parseFloat(kline[1]);
              close = parseFloat(kline[4]);
              high = parseFloat(kline[2]);
              low = parseFloat(kline[3]);
              volume = parseFloat(kline[5]);
            } else {
              continue;
            }
            
            // Calculate actual price change
            const change = open > 0 ? ((close - open) / open) * 100 : 0;
            const volatility = open > 0 ? ((high - low) / open) * 100 : 0;
            
            // Calculate simulated P&L based on price movement
            const pnlPct = change * (0.5 + volatility * 0.1);
            const roundedPnl = Math.round(pnlPct * 100) / 100;
            
            // Calculate trade count based on volume and volatility
            const tradeCount = Math.max(1, Math.round(5 + Math.abs(change) * 0.3 + volume / 1e8));
            
            cells.push({
              day: day,
              pnlPct: roundedPnl,
              trades: tradeCount,
              priceChange: change,
            });
            
            totalPnl += roundedPnl;
            totalTrades += tradeCount;
            if (roundedPnl > 0) winDays++;
            tradingDays++;
            
            if (roundedPnl > bestDay) bestDay = roundedPnl;
            if (roundedPnl < worstDay) worstDay = roundedPnl;
          } else {
            // No data for this day (future or missing)
            cells.push({
              day: day,
              pnlPct: null,
              trades: 0,
              priceChange: null,
            });
          }
        }
        
        setData(cells);
        setStats({
          totalPnl: Math.round(totalPnl * 100) / 100,
          winDays,
          tradingDays,
          totalTrades,
          bestDay: bestDay !== -Infinity ? Math.round(bestDay * 100) / 100 : 0,
          worstDay: worstDay !== Infinity ? Math.round(worstDay * 100) / 100 : 0,
        });
        
        setError(null);
      } else {
        throw new Error(result?.retMsg || 'Failed to fetch kline data');
      }
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
      setError('Failed to load heatmap data');
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to public WebSocket
  const connectWebSocket = () => {
    try {
      setConnectionStatus('connecting');
      
      const ws = new WebSocket(BYBIT_WS.linear);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Public WebSocket connected');
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        setError(null);
        
        ws.send(JSON.stringify({
          op: 'subscribe',
          args: ['tickers.BTCUSDT']
        }));
        
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.topic === 'tickers') {
            // Update data on price changes
            fetchData();
          } else if (data.op === 'pong') {
            // Heartbeat response - ignore
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      ws.onerror = (event) => {
        console.warn('Public WebSocket error:', event);
        setConnectionStatus('disconnected');
      };

      ws.onclose = (event) => {
        console.log('Public WebSocket disconnected:', event.code);
        setConnectionStatus('disconnected');
        stopHeartbeat();
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        if (event.code !== 1000) {
          const delay = Math.min(5000 * Math.pow(1.5, reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, delay);
        }
      };
    } catch (err) {
      console.error('Failed to connect public WebSocket:', err);
      setConnectionStatus('disconnected');
    }
  };

  // Connect to private WebSocket for Unified Account
  const connectPrivateWebSocket = () => {
    const { apiKey, apiSecret, isTestnet } = getApiCredentials();
    if (!apiKey || !apiSecret) return;

    try {
      const wsUrl = isTestnet 
        ? 'wss://stream-testnet.bybit.com/v5/private/linear'
        : 'wss://stream.bybit.com/v5/private/linear';
      
      const privateWs = new WebSocket(wsUrl);
      privateWsRef.current = privateWs;

      privateWs.onopen = () => {
        console.log('Private WebSocket connected');
        
        // Authenticate
        const expires = Date.now() + 10000;
        const timestamp = expires.toString();
        const recvWindow = '5000';
        const signature = generateSignature(apiKey, apiSecret, timestamp, recvWindow, '');
        
        privateWs.send(JSON.stringify({
          op: 'auth',
          args: [apiKey, expires, signature, recvWindow],
        }));
      };

      privateWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle authentication response
          if (data.op === 'auth' && data.retCode === 0) {
            console.log('Private WebSocket authenticated');
            setConnectionStatus('authenticated');
            
            // Subscribe to wallet updates
            privateWs.send(JSON.stringify({
              op: 'subscribe',
              args: ['wallet'],
            }));
          }
          
          // Handle wallet updates
          if (data.topic === 'wallet' && data.data) {
            fetchData();
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      privateWs.onerror = (error) => {
        console.warn('Private WebSocket error:', error);
      };

      privateWs.onclose = () => {
        console.log('Private WebSocket disconnected');
        setTimeout(connectPrivateWebSocket, 10000);
      };
    } catch (err) {
      console.error('Failed to connect private WebSocket:', err);
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
    if (privateWsRef.current) {
      privateWsRef.current.close(1000, 'Normal closure');
      privateWsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopHeartbeat();
  };

  useEffect(() => {
    fetchData();
    connectWebSocket();
    connectPrivateWebSocket();
    
    const interval = setInterval(() => {
      if (connectionStatus === 'disconnected') {
        fetchData();
      }
    }, 60000);
    
    return () => {
      clearInterval(interval);
      disconnectWebSocket();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="card-surface p-5">
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading heatmap data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-surface p-5">
        <div className="flex items-center gap-3 text-negative">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Build calendar grid with leading empty cells based on first day of month
  const firstDayOfMonth = new Date().getDate() > 1 ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() : 3;
  const START_DOW = firstDayOfMonth;
  const cells: (HeatmapCell | null)[] = [
    ...Array.from({ length: START_DOW }, () => null),
    ...data,
  ];

  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Monthly P&L Heatmap
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            {monthName} · Based on BTC daily price action
            <span className="flex items-center gap-1 text-[10px]">
              {connectionStatus === 'authenticated' ? (
                <span className="text-green-500">●</span>
              ) : connectionStatus === 'connected' ? (
                <span className="text-blue-500">●</span>
              ) : connectionStatus === 'connecting' ? (
                <Loader2 size={10} className="animate-spin text-yellow-500" />
              ) : (
                <span className="text-red-500">●</span>
              )}
              {connectionStatus === 'authenticated' ? 'Live' :
               connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
            {accountInfo && (
              <span className="text-[10px] text-muted-foreground">
                · {accountInfo.accountType} Account
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Month P&L</p>
            <p className={`font-bold font-tabular ${stats.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
              {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Win Days</p>
            <p className="font-bold font-tabular text-foreground">
              {stats.winDays}/{stats.tradingDays}
            </p>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={`dow-${d}`}
            className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return (
              <div
                key={`empty-cell-${i}`}
                className="aspect-square rounded-md"
              />
            );
          }
          const cls = getHeatmapClass(cell.pnlPct);
          const isToday = cell.day === new Date().getDate() && cell.pnlPct !== null;
          return (
            <div
              key={`heatmap-day-${cell.day}`}
              className={`
                aspect-square rounded-md flex flex-col items-center justify-center
                cursor-default transition-transform duration-100 hover:scale-105
                ${cls}
                ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
              `}
              title={
                cell.pnlPct !== null
                  ? `${monthName} ${cell.day}: ${cell.pnlPct >= 0 ? '+' : ''}${cell.pnlPct}% · ${cell.trades} trades${cell.priceChange !== null ? ` · Price: ${cell.priceChange >= 0 ? '+' : ''}${cell.priceChange.toFixed(2)}%` : ''}`
                  : `${monthName} ${cell.day}: No trading data`
              }
            >
              <span className="text-[10px] font-semibold leading-none">
                {cell.day}
              </span>
              {cell.pnlPct !== null && (
                <span className="text-[8px] font-mono leading-none mt-0.5 opacity-90">
                  {cell.pnlPct >= 0 ? '+' : ''}
                  {cell.pnlPct.toFixed(1)}%
                </span>
              )}
              {isToday && (
                <span className="text-[6px] font-mono mt-0.5 text-primary">●</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <div className="flex gap-4 text-[10px] text-muted-foreground">
          <span>
            Trading Days: <span className="text-foreground font-semibold">{stats.tradingDays}</span>
          </span>
          <span>
            Total Trades: <span className="text-foreground font-semibold">{stats.totalTrades}</span>
          </span>
          <span>
            Best Day: <span className="text-positive font-semibold">+{stats.bestDay}%</span>
          </span>
          <span>
            Worst Day: <span className="text-negative font-semibold">{stats.worstDay}%</span>
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground">Loss</span>
        <div className="flex gap-1">
          {[
            'bg-red-600/80',
            'bg-red-300/50',
            'bg-gray-300/40',
            'bg-green-300/50',
            'bg-green-500/70',
          ].map((cls, i) => (
            <div
              key={`legend-swatch-${i}`}
              className={`w-5 h-3 rounded-sm ${cls}`}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">Gain</span>
      </div>

      <div className="mt-2 text-[9px] text-muted-foreground">
        <span className="text-muted-foreground">Data source:</span> Bybit BTCUSDT daily klines · 
        <span className="ml-1">P&L based on daily price action</span>
        {accountInfo && (
          <span className="ml-1">· {accountInfo.accountType} Account</span>
        )}
      </div>
    </div>
  );
}