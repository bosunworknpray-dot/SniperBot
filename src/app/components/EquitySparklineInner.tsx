'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Loader2,
  AlertCircle,
} from 'recharts';
import { Wifi, WifiOff } from 'lucide-react';

interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}

interface EquityStats {
  startEquity: number;
  currentEquity: number;
  totalReturn: number;
  maxDrawdown: number;
  peakEquity: number;
}

// Bybit API endpoints
const BYBIT_API = {
  kline: 'https://api.bybit.com/v5/market/kline',
  spot: 'https://api.bybit.com/v5/market/tickers',
  accountInfo: 'https://api.bybit.com/v5/account/info',
  wallet: 'https://api.bybit.com/v5/account/wallet-balance',
};

const BYBIT_WS = {
  linear: 'wss://stream.bybit.com/v5/public/linear',
  private: 'wss://stream.bybit.com/v5/private/linear',
};

const BASE_EQUITY = 100000; // Base equity for simulation

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pnl = d.equity - BASE_EQUITY;
  return (
    <div className="card-surface p-3 shadow-xl text-xs font-mono min-w-[160px]">
      <p className="text-muted-foreground mb-2 font-sans">{label}</p>
      <p className="text-foreground">
        Equity: <span className="text-primary">${d.equity.toLocaleString()}</span>
      </p>
      <p className={pnl >= 0 ? 'text-positive' : 'text-negative'}>
        Net P&L: {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
      </p>
      {d.drawdown < 0 && (
        <p className="text-negative">DD: {d.drawdown.toFixed(2)}%</p>
      )}
    </div>
  );
};

export default function EquityCurveChartInner() {
  const [data, setData] = useState<EquityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDrawdown, setShowDrawdown] = useState(false);
  const [stats, setStats] = useState<EquityStats>({
    startEquity: BASE_EQUITY,
    currentEquity: BASE_EQUITY,
    totalReturn: 0,
    maxDrawdown: 0,
    peakEquity: BASE_EQUITY,
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'authenticated'>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [accountInfo, setAccountInfo] = useState<{ uid: string; accountType: string } | null>(null);
  const [liveBalance, setLiveBalance] = useState<number>(BASE_EQUITY);
  const [isLiveMode, setIsLiveMode] = useState(false);

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

  // Fetch real balance from Bybit
  const fetchRealBalance = async (): Promise<number> => {
    try {
      const { apiKey, apiSecret, isTestnet } = getApiCredentials();
      if (!apiKey || !apiSecret) return BASE_EQUITY;

      const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
      const timestamp = Date.now().toString();
      const recvWindow = '5000';
      const params = '';
      
      const signature = generateSignature(apiKey, apiSecret, timestamp, recvWindow, params);
      
      const response = await fetch(`${baseUrl}/v5/account/wallet-balance`, {
        method: 'GET',
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
          'X-BAPI-RECV-WINDOW': recvWindow,
        },
      });

      const data = await safeJsonParse(response);
      
      if (data && data.retCode === 0 && data.result) {
        const wallet = data.result.list?.[0];
        const totalEquity = parseFloat(wallet?.totalEquity || '0');
        if (totalEquity > 0) {
          return totalEquity;
        }
      }
      return BASE_EQUITY;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return BASE_EQUITY;
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch account info
      await fetchAccountInfo();

      // Fetch real balance for live mode
      const realBalance = await fetchRealBalance();
      if (realBalance > 0 && realBalance !== BASE_EQUITY) {
        setLiveBalance(realBalance);
        setIsLiveMode(true);
      }

      // Fetch real kline data for BTCUSDT (4h intervals, 30 candles)
      const response = await fetch(`${BYBIT_API.kline}?category=linear&symbol=BTCUSDT&interval=240&limit=30`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch kline data');
      }
      
      const result = await safeJsonParse(response);
      
      if (result && result.retCode === 0 && result.result?.list) {
        const klines = result.result.list;
        const startPrice = parseFloat(klines[0][1]); // Open price of first candle
        const baseEquity = isLiveMode ? realBalance : BASE_EQUITY;
        
        let peakEquity = baseEquity;
        let maxDrawdown = 0;
        let peakPrice = startPrice;
        
        // Calculate equity and drawdown from real price data
        const equityData: EquityPoint[] = klines.map((k: any, i: number) => {
          const close = parseFloat(k[4]);
          const priceChange = ((close - startPrice) / startPrice);
          const equity = baseEquity * (1 + priceChange * 0.5);
          
          // Track peak equity for drawdown calculation
          if (equity > peakEquity) {
            peakEquity = equity;
            peakPrice = close;
          }
          
          // Calculate drawdown from peak equity
          const drawdown = peakEquity > 0 ? ((equity - peakEquity) / peakEquity) * 100 : 0;
          
          // Track max drawdown
          if (drawdown < maxDrawdown) {
            maxDrawdown = drawdown;
          }
          
          const date = new Date(parseInt(k[0]));
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          
          return {
            date: `${dateStr} ${timeStr}`,
            equity: Math.round(equity * 100) / 100,
            drawdown: Math.round(drawdown * 100) / 100,
          };
        });
        
        // Create enhanced data with more points for smoother curve
        const enhancedData: EquityPoint[] = [];
        equityData.forEach((point, i) => {
          enhancedData.push(point);
          if (i < equityData.length - 1) {
            const nextPoint = equityData[i + 1];
            const midEquity = (point.equity + nextPoint.equity) / 2;
            const midDrawdown = (point.drawdown + nextPoint.drawdown) / 2;
            
            // Add mid-point for smoother curve
            enhancedData.push({
              date: `${point.date} → ${nextPoint.date}`,
              equity: Math.round(midEquity * 100) / 100,
              drawdown: Math.round(midDrawdown * 100) / 100,
            });
          }
        });
        
        // Calculate final stats
        const finalEquity = enhancedData[enhancedData.length - 1]?.equity || baseEquity;
        const totalReturn = ((finalEquity - baseEquity) / baseEquity) * 100;
        
        setData(enhancedData);
        setStats({
          startEquity: baseEquity,
          currentEquity: finalEquity,
          totalReturn: totalReturn,
          maxDrawdown: Math.round(Math.abs(maxDrawdown) * 100) / 100,
          peakEquity: peakEquity,
        });
        
        setError(null);
      } else {
        throw new Error(result?.retMsg || 'Failed to fetch kline data');
      }
    } catch (error) {
      console.error('Failed to fetch equity data:', error);
      setError('Failed to load equity data');
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
          <span className="ml-3 text-sm text-muted-foreground">Loading equity data...</span>
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

  if (data.length === 0) {
    return (
      <div className="card-surface p-5">
        <div className="flex items-center justify-center py-12">
          <span className="text-sm text-muted-foreground">No equity data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Equity Curve
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            Based on BTC price action · {data.length} data points
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
            {isLiveMode && (
              <span className="text-[10px] text-green-600 dark:text-green-400">
                · Live Balance: ${liveBalance.toFixed(2)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDrawdown(false)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all duration-150 ${
                !showDrawdown
                  ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Equity
            </button>
            <button
              onClick={() => setShowDrawdown(true)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all duration-150 ${
                showDrawdown
                  ? 'bg-negative-subtle text-negative' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Drawdown
            </button>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Total Return</p>
            <p className={`text-sm font-bold font-tabular ${stats.totalReturn >= 0 ? 'text-positive' : 'text-negative'}`}>
              {stats.totalReturn >= 0 ? '+' : ''}{stats.totalReturn.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityCurveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--negative)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--negative)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            dataKey={showDrawdown ? 'drawdown' : 'equity'}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              showDrawdown ? `${v.toFixed(1)}%` : `$${(v / 1000).toFixed(1)}k`
            }
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={stats.startEquity}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{ value: 'Start', fill: 'var(--muted-foreground)', fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey={showDrawdown ? 'drawdown' : 'equity'}
            stroke={showDrawdown ? 'var(--negative)' : 'var(--primary)'}
            strokeWidth={2}
            fill={showDrawdown ? 'url(#drawdownGrad)' : 'url(#equityCurveGrad)'}
            dot={false}
            activeDot={{
              r: 4,
              fill: showDrawdown ? 'var(--negative)' : 'var(--primary)',
              stroke: 'var(--card)',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>
            Start Equity: <span className="text-foreground font-mono">${stats.startEquity.toLocaleString()}</span>
          </span>
          <span>
            Current: <span className="text-foreground font-mono">${stats.currentEquity.toLocaleString()}</span>
          </span>
          <span>
            Max DD: <span className="text-negative font-mono">{stats.maxDrawdown.toFixed(1)}%</span>
          </span>
          <span>
            Peak: <span className="text-foreground font-mono">${stats.peakEquity.toLocaleString()}</span>
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          <span className="text-muted-foreground">Data source:</span> Bybit BTCUSDT 4h klines
          {accountInfo && (
            <span className="ml-1">· {accountInfo.accountType} Account</span>
          )}
        </p>
      </div>
    </div>
  );
}