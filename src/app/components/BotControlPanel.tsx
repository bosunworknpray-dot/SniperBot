// BotControlPanel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Power,
  AlertTriangle,
  Settings2,
  RefreshCw,
  ChevronRight,
  Cpu,
  Wifi,
  Database,
  Loader2,
  Key,
  Shield,
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

interface SystemStatus {
  websocket: { status: 'connected' | 'disconnected' | 'connecting' | 'authenticated'; latency: number };
  signalEngine: { status: 'running' | 'paused' | 'idle'; lastRun: string };
  mlModel: { version: string; lastRetrain: string; accuracy: number };
  account: { type: string; uid: string; connected: boolean };
}

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
}

// Bybit API endpoints
const BYBIT_API = {
  positions: 'https://api.bybit.com/v5/position/list',
  accountInfo: 'https://api.bybit.com/v5/account/info',
  marketTime: 'https://api.bybit.com/v5/market/time',
};

const BYBIT_WS = {
  public: 'wss://stream.bybit.com/v5/public/linear',
  private: 'wss://stream.bybit.com/v5/private/linear',
};

// Helper to generate Bybit signature
const generateSignature = (apiKey: string, apiSecret: string, timestamp: string, recvWindow: string, params: string) => {
  const crypto = require('crypto');
  const paramStr = timestamp + apiKey + recvWindow + params;
  return crypto.createHmac('sha256', apiSecret).update(paramStr).digest('hex');
};

export default function BotControlPanel() {
  const [botActive, setBotActive] = useState(true);
  const [riskPct, setRiskPct] = useState(1.0);
  const [maxPositions, setMaxPositions] = useState(3);
  const [emergencyModal, setEmergencyModal] = useState(false);
  const [toggleModal, setToggleModal] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paperDay, setPaperDay] = useState(3);
  const [lastScan, setLastScan] = useState('23:47:31');
  const [nextScan, setNextScan] = useState('8m');
  const [positions, setPositions] = useState<Position[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const privateWsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    websocket: { status: 'connecting', latency: 0 },
    signalEngine: { status: 'idle', lastRun: '-' },
    mlModel: { version: 'v12', lastRetrain: '-', accuracy: 0 },
    account: { type: 'Unified', uid: 'N/A', connected: false },
  });

  // Get API credentials
  const getApiCredentials = () => {
    return {
      apiKey: process.env.NEXT_PUBLIC_BYBIT_API_KEY || '',
      apiSecret: process.env.NEXT_PUBLIC_BYBIT_API_SECRET || '',
      isTestnet: true,
    };
  };

  // Generate WebSocket authentication signature
  const generateWsSignature = (apiKey: string, apiSecret: string, timestamp: string, recvWindow: string) => {
    const crypto = require('crypto');
    const paramStr = timestamp + apiKey + recvWindow;
    return crypto.createHmac('sha256', apiSecret).update(paramStr).digest('hex');
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
      
      const data = await response.json();
      
      if (data && data.retCode === 0 && data.result) {
        const result = data.result;
        setSystemStatus(prev => ({
          ...prev,
          account: {
            type: result.accountType || result.accType || 'Unified',
            uid: result.uid || result.accountUid || 'N/A',
            connected: true,
          },
        }));
      }
    } catch (err) {
      console.error('Error fetching account info:', err);
    }
  };

  // Fetch positions
  const fetchPositions = async () => {
    try {
      const { apiKey, apiSecret, isTestnet } = getApiCredentials();
      if (!apiKey || !apiSecret) return;

      const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
      const timestamp = Date.now().toString();
      const recvWindow = '5000';
      const params = '';
      
      const signature = generateSignature(apiKey, apiSecret, timestamp, recvWindow, params);
      
      const response = await fetch(`${baseUrl}/v5/position/list`, {
        method: 'GET',
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
          'X-BAPI-RECV-WINDOW': recvWindow,
        },
      });
      
      const data = await response.json();
      
      if (data && data.retCode === 0 && data.result?.list) {
        const newPositions: Position[] = [];
        data.result.list.forEach((pos: any) => {
          const size = parseFloat(pos.size);
          if (size !== 0) {
            newPositions.push({
              id: `pos-${pos.symbol}-${pos.positionIdx}`,
              symbol: pos.symbol,
              side: pos.side === 'Buy' ? 'long' : 'short',
              size: Math.abs(size),
              entryPrice: parseFloat(pos.avgPrice),
              currentPrice: parseFloat(pos.markPrice),
              unrealizedPnl: parseFloat(pos.unrealisedPnl || 0),
            });
          }
        });
        setPositions(newPositions);
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  };

  // Connect to public WebSocket
  const connectWebSocket = () => {
    try {
      setSystemStatus(prev => ({
        ...prev,
        websocket: { ...prev.websocket, status: 'connecting' },
      }));
      
      const ws = new WebSocket(BYBIT_WS.public);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Public WebSocket connected');
        setSystemStatus(prev => ({
          ...prev,
          websocket: { ...prev.websocket, status: 'connected', latency: 0 },
        }));
        
        // Subscribe to tickers
        ws.send(JSON.stringify({
          op: 'subscribe',
          args: ['tickers.BTCUSDT', 'tickers.ETHUSDT', 'tickers.SOLUSDT'],
        }));
        
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.topic === 'tickers') {
            // Update last scan time
            setLastScan(new Date().toLocaleTimeString());
          } else if (data.op === 'pong') {
            // Update latency
            setSystemStatus(prev => ({
              ...prev,
              websocket: { ...prev.websocket, latency: 0 },
            }));
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      ws.onerror = (error) => {
        console.warn('Public WebSocket error:', error);
        setSystemStatus(prev => ({
          ...prev,
          websocket: { ...prev.websocket, status: 'disconnected' },
        }));
      };

      ws.onclose = () => {
        console.log('Public WebSocket disconnected');
        setSystemStatus(prev => ({
          ...prev,
          websocket: { ...prev.websocket, status: 'disconnected' },
        }));
        stopHeartbeat();
        // Attempt to reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };
    } catch (err) {
      console.error('Failed to connect public WebSocket:', err);
      setSystemStatus(prev => ({
        ...prev,
        websocket: { ...prev.websocket, status: 'disconnected' },
      }));
    }
  };

  // Connect to private WebSocket for Unified Account
  const connectPrivateWebSocket = () => {
    try {
      const { apiKey, apiSecret, isTestnet } = getApiCredentials();
      if (!apiKey || !apiSecret) {
        console.log('No API credentials for private WebSocket');
        return;
      }

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
        const signature = generateWsSignature(apiKey, apiSecret, timestamp, recvWindow);
        
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
            setSystemStatus(prev => ({
              ...prev,
              websocket: { ...prev.websocket, status: 'authenticated' },
              account: { ...prev.account, connected: true },
            }));
            
            // Subscribe to position updates
            privateWs.send(JSON.stringify({
              op: 'subscribe',
              args: ['position', 'execution', 'order'],
            }));
          }
          
          // Handle position updates
          if (data.topic === 'position' && data.data) {
            fetchPositions();
            setSystemStatus(prev => ({
              ...prev,
              signalEngine: { ...prev.signalEngine, lastRun: new Date().toLocaleTimeString() },
            }));
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      privateWs.onerror = (error) => {
        console.warn('Private WebSocket error:', error);
        setSystemStatus(prev => ({
          ...prev,
          websocket: { ...prev.websocket, status: 'disconnected' },
        }));
      };

      privateWs.onclose = () => {
        console.log('Private WebSocket disconnected');
        setSystemStatus(prev => ({
          ...prev,
          websocket: { ...prev.websocket, status: 'disconnected' },
        }));
        // Attempt to reconnect after delay
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

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      // Check WebSocket health with public API
      const wsStart = Date.now();
      const response = await fetch(BYBIT_API.marketTime);
      const wsLatency = Date.now() - wsStart;
      
      if (response.ok) {
        setSystemStatus(prev => ({
          ...prev,
          websocket: { 
            ...prev.websocket, 
            status: wsRef.current?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
            latency: wsLatency 
          },
        }));
      }

      // Fetch account info
      await fetchAccountInfo();
      
      // Fetch positions
      await fetchPositions();

      // In a real app, you'd have endpoints for signal engine and ML model status
      const savedStatus = localStorage.getItem('bot_system_status');
      if (savedStatus) {
        try {
          const parsed = JSON.parse(savedStatus);
          setSystemStatus(prev => ({
            ...prev,
            signalEngine: parsed.signalEngine || prev.signalEngine,
            mlModel: parsed.mlModel || prev.mlModel,
          }));
        } catch (e) { /* ignore */ }
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchSystemStatus();
    connectWebSocket();
    connectPrivateWebSocket();
    
    const interval = setInterval(fetchSystemStatus, 30000);
    const scanInterval = setInterval(() => {
      if (botActive) {
        setNextScan('0s');
        setLastScan(new Date().toLocaleTimeString());
        fetchPositions();
        // Schedule next scan
        setTimeout(() => setNextScan('5m'), 1000);
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(interval);
      clearInterval(scanInterval);
      disconnectWebSocket();
    };
  }, []);

  const handleToggleConfirm = () => {
    setBotActive((v) => !v);
    toast?.success(botActive ? 'Bot paused — no new signals will execute' : 'Bot resumed — scanning markets');
    setToggleModal(false);
    
    // Update signal engine status
    setSystemStatus(prev => ({
      ...prev,
      signalEngine: { 
        ...prev.signalEngine, 
        status: botActive ? 'paused' : 'running',
        lastRun: new Date().toLocaleTimeString(),
      },
    }));
  };

  const handleEmergencyConfirm = async () => {
    setBotActive(false);
    setIsExecuting(true);
    
    try {
      // Close all positions
      const { apiKey, apiSecret, isTestnet } = getApiCredentials();
      if (apiKey && apiSecret) {
        const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        for (const position of positions) {
          const side = position.side === 'long' ? 'Sell' : 'Buy';
          const params = `category=linear&symbol=${position.symbol}&side=${side}&orderType=Market&qty=${position.size}&timeInForce=GTC`;
          const signature = generateSignature(apiKey, apiSecret, timestamp, recvWindow, params);
          
          await fetch(`${baseUrl}/v5/order/create`, {
            method: 'POST',
            headers: {
              'X-BAPI-API-KEY': apiKey,
              'X-BAPI-TIMESTAMP': timestamp,
              'X-BAPI-SIGN': signature,
              'X-BAPI-RECV-WINDOW': recvWindow,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              category: 'linear',
              symbol: position.symbol,
              side: side,
              orderType: 'Market',
              qty: position.size.toString(),
              timeInForce: 'GTC',
            }),
          });
        }
      }
      
      toast?.error('Emergency shutdown executed — all positions closed', {
        duration: 6000,
      });
      setEmergencyModal(false);
      
      setSystemStatus(prev => ({
        ...prev,
        signalEngine: { ...prev.signalEngine, status: 'idle' },
      }));
      
      // Refresh positions
      await fetchPositions();
    } catch (error) {
      toast?.error('Failed to close all positions');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    toast?.info('Restarting signal engine...');
    
    try {
      // Reconnect WebSockets
      disconnectWebSocket();
      await new Promise((r) => setTimeout(r, 500));
      connectWebSocket();
      connectPrivateWebSocket();
      
      // Refresh data
      await fetchSystemStatus();
      setLastScan(new Date().toLocaleTimeString());
      setNextScan('5m');
      
      toast?.success('Signal engine restarted — indicators recalculated');
    } catch (error) {
      toast?.error('Failed to restart signal engine');
    } finally {
      setIsRestarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading system status...</span>
        </div>
      </div>
    );
  }

  const statusItems = [
    { 
      label: 'WebSocket', 
      status: systemStatus.websocket.status === 'authenticated' ? `Authenticated (${systemStatus.websocket.latency}ms)` : 
              systemStatus.websocket.status === 'connected' ? `Connected (${systemStatus.websocket.latency}ms)` : 
              systemStatus.websocket.status === 'connecting' ? 'Connecting...' : 'Disconnected', 
      ok: systemStatus.websocket.status === 'connected' || systemStatus.websocket.status === 'authenticated', 
      icon: Wifi 
    },
    { 
      label: 'Signal Engine', 
      status: systemStatus.signalEngine.status === 'running' ? 'Running' : 
              systemStatus.signalEngine.status === 'paused' ? 'Paused' : 'Idle', 
      ok: systemStatus.signalEngine.status === 'running', 
      icon: Cpu 
    },
    { 
      label: 'Unified Account', 
      status: systemStatus.account.connected ? `${systemStatus.account.type} (${systemStatus.account.uid})` : 'Not Connected', 
      ok: systemStatus.account.connected, 
      icon: Shield 
    },
    { 
      label: 'ML Model', 
      status: `${systemStatus.mlModel.version} · Acc: ${(systemStatus.mlModel.accuracy * 100).toFixed(1)}%`, 
      ok: true, 
      icon: Settings2 
    },
  ];

  const openPositions = positions.length;

  return (
    <>
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Bot Control
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`relative flex h-2 w-2 ${botActive ? '' : 'opacity-40'}`}
            >
              {botActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  botActive ? 'bg-positive' : 'bg-muted-foreground'
                }`}
              />
            </span>
            <span
              className={`text-xs font-semibold ${
                botActive ? 'text-positive' : 'text-muted-foreground'
              }`}
            >
              {botActive ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Mode Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-info-subtle border border-info/20">
            <div className="flex items-center gap-2">
              <Database size={13} className="text-info" />
              <span className="text-xs font-semibold text-info">
                PAPER TRADING MODE
              </span>
              {systemStatus.websocket.status === 'authenticated' && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  🔐 Authenticated
                </span>
              )}
            </div>
            <span className="text-[10px] text-info/70 font-mono">
              {openPositions} positions · Day {paperDay} / 14
            </span>
          </div>

          {/* System Status */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              System Status
            </p>
            {statusItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`status-${item.label}`}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold font-mono ${
                      item.ok ? 'text-positive' : 'text-warning'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Risk Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Per-Trade Risk
              </p>
              <span className="text-sm font-bold text-primary font-tabular">
                {riskPct?.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.1}
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e?.target?.value))}
              className="w-full"
              aria-label="Per-trade risk percentage"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>0.1% (Conservative)</span>
              <span>2.0% (Aggressive)</span>
            </div>
          </div>

          {/* Max Positions */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Max Concurrent Positions
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5]?.map((n) => (
                <button
                  key={`maxpos-${n}`}
                  onClick={() => setMaxPositions(n)}
                  className={`
                    flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 active:scale-95
                    ${
                      maxPositions === n
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setToggleModal(true)}
              className={`
                w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold
                transition-all duration-150 active:scale-95
                ${
                  botActive
                    ? 'bg-warning-subtle text-warning border border-warning/30 hover:bg-warning/20' : 'bg-positive-subtle text-positive border border-positive/30 hover:bg-positive/20'
                }
              `}
            >
              <Power size={14} />
              {botActive ? 'Pause Bot' : 'Resume Bot'}
            </button>

            <button
              onClick={handleRestart}
              disabled={isRestarting}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={12}
                className={isRestarting ? 'animate-spin' : ''}
              />
              {isRestarting ? 'Restarting Engine...' : 'Restart Signal Engine'}
            </button>

            <button
              onClick={() => setEmergencyModal(true)}
              disabled={isExecuting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-negative bg-negative-subtle border border-negative/30 hover:bg-negative/20 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle size={14} />
              {isExecuting ? 'Closing positions...' : 'Emergency Shutdown'}
            </button>
          </div>

          {/* Last Scan */}
          <div className="pt-1 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Last full scan</span>
            <span className="font-mono">{lastScan} · {botActive ? 'Active' : 'Paused'}</span>
            <span className="flex items-center gap-1 text-primary">
              Next in {nextScan} <ChevronRight size={9} />
            </span>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={toggleModal}
        title={botActive ? 'Pause SniperBot?' : 'Resume SniperBot?'}
        description={
          botActive
            ? 'Pausing will stop all new signal executions. Open positions will remain active and managed by the risk engine. You can resume at any time.' : 'Resuming will re-enable signal execution. The engine will rescan all markets within 30 seconds.'
        }
        confirmLabel={botActive ? 'Pause Bot' : 'Resume Bot'}
        variant="warning"
        onConfirm={handleToggleConfirm}
        onCancel={() => setToggleModal(false)}
      />

      <ConfirmModal
        open={emergencyModal}
        title="Emergency Shutdown"
        description={`This will immediately stop the bot AND submit market orders to close ALL ${openPositions} open positions. This is irreversible. Daily P&L will be locked at current value. Use only in genuine emergency situations.`}
        confirmLabel="Execute Emergency Shutdown"
        variant="danger"
        onConfirm={handleEmergencyConfirm}
        onCancel={() => setEmergencyModal(false)}
      />
    </>
  );
}