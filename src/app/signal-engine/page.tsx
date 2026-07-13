'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Zap, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Clock, Filter, Search, X,
  Sparkles, Wifi, WifiOff, Database, Activity
} from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  confidence: number;
  entryPrice: number;
  sl: number;
  tp1: number;
  tp2: number;
  rr: number;
  regime: string;
  volumeSpike: number;
  rsi: number;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  bbPosition: string;
  timeframe: string;
  status: 'live' | 'pending' | 'rejected' | 'executed';
  rejectionReason?: string;
  generatedAt: string;
  timestamp: number;
  volume: number;
  signalSource: 'ml' | 'technical' | 'hybrid';
}

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
  category: 'momentum' | 'trend' | 'volatility' | 'volume';
}

// WebSocket connection states
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// API Configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws',
  endpoints: {
    signals: '/signals',
    indicators: '/indicators',
    scan: '/signals/scan',
  }
};

export default function SignalEnginePage() {
  // State
  const [signals, setSignals] = useState<Signal[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'pending' | 'rejected' | 'executed'>('all');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showRejected, setShowRejected] = useState(true);
  const [sortBy, setSortBy] = useState<'confidence' | 'time' | 'rr'>('time');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    live: 0,
    pending: 0,
    rejected: 0,
    avgConfidence: 0,
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchSignals();
    fetchIndicators();
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Update stats when signals change
  useEffect(() => {
    updateStats();
  }, [signals]);

  // Fetch signals from REST API
  const fetchSignals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.signals}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch signals');

      const data = await response.json();
      setSignals(data.signals || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching signals:', err);
      setError('Failed to load signals. Using fallback data.');
      // Fallback to empty array
      setSignals([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch indicators configuration
  const fetchIndicators = async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.indicators}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch indicators');

      const data = await response.json();
      setIndicators(data.indicators || []);
    } catch (err) {
      console.error('Error fetching indicators:', err);
      // Use default indicators if API fails
      setIndicators([
        { id: 'rsi', label: 'RSI (14)', enabled: true, category: 'momentum' },
        { id: 'macd', label: 'MACD (12,26,9)', enabled: true, category: 'momentum' },
        { id: 'bb', label: 'Bollinger Bands (20,2)', enabled: true, category: 'volatility' },
        { id: 'vwap', label: 'VWAP', enabled: true, category: 'volume' },
        { id: 'ema9', label: 'EMA 9', enabled: true, category: 'trend' },
        { id: 'ema20', label: 'EMA 20', enabled: true, category: 'trend' },
        { id: 'ma50', label: 'MA 50', enabled: true, category: 'trend' },
        { id: 'ma200', label: 'MA 200', enabled: false, category: 'trend' },
        { id: 'stochrsi', label: 'Stochastic RSI', enabled: true, category: 'momentum' },
        { id: 'atr', label: 'ATR (14)', enabled: true, category: 'volatility' },
      ]);
    }
  };

  // WebSocket connection management
  const connectWebSocket = () => {
    try {
      setConnectionStatus('connecting');
      
      const ws = new WebSocket(API_CONFIG.wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
        
        // Start heartbeat
        startHeartbeat();
        
        // Subscribe to signal stream
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'signals',
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        stopHeartbeat();
        
        // Attempt to reconnect after delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setConnectionStatus('error');
      setError('Failed to establish WebSocket connection');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopHeartbeat();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const startHeartbeat = () => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        }));
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_signal':
        // Add new signal to the list
        setSignals(prev => [data.signal, ...prev].slice(0, 100));
        break;

      case 'signal_update':
        // Update existing signal
        setSignals(prev => prev.map(s => 
          s.id === data.signal.id ? data.signal : s
        ));
        break;

      case 'signal_status_change':
        // Update signal status
        setSignals(prev => prev.map(s => 
          s.id === data.signalId ? { ...s, status: data.status } : s
        ));
        break;

      case 'signal_deleted':
        // Remove deleted signal
        setSignals(prev => prev.filter(s => s.id !== data.signalId));
        break;

      case 'pong':
        // Heartbeat response - ignore
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Update statistics
  const updateStats = () => {
    const live = signals.filter(s => s.status === 'live').length;
    const pending = signals.filter(s => s.status === 'pending').length;
    const rejected = signals.filter(s => s.status === 'rejected').length;
    const avgConf = signals
      .filter(s => s.status === 'live' || s.status === 'pending')
      .reduce((sum, s) => sum + s.confidence, 0) / (live + pending) || 0;

    setStats({ live, pending, rejected, avgConfidence: avgConf });
  };

  // Trigger market scan
  const handleRescan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.scan}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indicators: indicators.filter(i => i.enabled).map(i => i.id),
        }),
      });

      if (!response.ok) throw new Error('Failed to start market scan');

      const result = await response.json();
      console.log('Scan started:', result);
      
      // If we get signals back immediately, add them
      if (result.signals && result.signals.length > 0) {
        setSignals(prev => [...result.signals, ...prev].slice(0, 100));
      }
    } catch (err) {
      console.error('Error during scan:', err);
      setError('Failed to scan market. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle indicator
  const toggleIndicator = async (id: string) => {
    const indicator = indicators.find(i => i.id === id);
    if (!indicator) return;

    const newState = !indicator.enabled;
    
    // Update local state immediately
    setIndicators(prev => prev.map(ind => 
      ind.id === id ? { ...ind, enabled: newState } : ind
    ));

    // Send update to backend
    try {
      await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.indicators}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newState }),
      });
    } catch (err) {
      console.error('Failed to update indicator:', err);
      // Revert on error
      setIndicators(prev => prev.map(ind => 
        ind.id === id ? { ...ind, enabled: !newState } : ind
      ));
    }
  };

  // Execute signal
  const handleExecuteSignal = async (id: string) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.signals}/${id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to execute signal');

      // Update local state
      setSignals(prev => prev.map(s => 
        s.id === id ? { ...s, status: 'executed' } : s
      ));
    } catch (err) {
      console.error('Error executing signal:', err);
      setError('Failed to execute signal. Please try again.');
    }
  };

  // Delete signal
  const handleDeleteSignal = async (id: string) => {
    if (!confirm('Delete this signal?')) return;

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.signals}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete signal');

      // Update local state
      setSignals(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting signal:', err);
      setError('Failed to delete signal. Please try again.');
    }
  };

  // Reconnect WebSocket manually
  const handleReconnect = () => {
    disconnectWebSocket();
    setTimeout(connectWebSocket, 1000);
  };

  // Get connection status icon
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi size={14} className="text-green-500" />;
      case 'connecting': return <RefreshCw size={14} className="text-yellow-500 animate-spin" />;
      case 'error': return <WifiOff size={14} className="text-red-500" />;
      default: return <WifiOff size={14} className="text-gray-500" />;
    }
  };

  // Get connection status text
  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Filtered and sorted signals
  const filtered = signals
    .filter(s => filterStatus === 'all' || s.status === filterStatus)
    .filter(s => showRejected || s.status !== 'rejected')
    .filter(s => s.symbol.toLowerCase().includes(filterSymbol.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'confidence': return b.confidence - a.confidence;
        case 'rr': return b.rr - a.rr;
        case 'time': return b.timestamp - a.timestamp;
        default: return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'executed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-600 dark:text-green-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'rejected': return 'text-red-600 dark:text-red-400';
      case 'executed': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Zap size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Signal Engine
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered signal generation with real-time streaming
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
              {getConnectionIcon()}
              <span className={`font-medium ${
                connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' :
                connectionStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                'text-gray-500 dark:text-gray-400'
              }`}>
                {getConnectionText()}
              </span>
              {connectionStatus === 'error' && (
                <button
                  onClick={handleReconnect}
                  className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Reconnect
                </button>
              )}
            </div>

            <button
              onClick={handleRescan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Scanning...' : 'Rescan Market'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Live Signals', value: stats.live.toString(), color: 'text-green-600 dark:text-green-400' },
            { label: 'Pending Signals', value: stats.pending.toString(), color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Rejected', value: stats.rejected.toString(), color: 'text-red-600 dark:text-red-400' },
            { label: 'Avg Confidence', value: `${stats.avgConfidence.toFixed(0)}%`, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Total Signals', value: signals.length.toString(), color: 'text-purple-600 dark:text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Signal Feed */}
          <div className="lg:col-span-3 space-y-3">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'live', 'pending', 'rejected', 'executed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                      filterStatus === f 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {f} {f !== 'all' && `(${signals.filter(s => s.status === f).length})`}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={filterSymbol}
                    onChange={(e) => setFilterSymbol(e.target.value)}
                    placeholder="Filter symbol..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="time">Sort by Time</option>
                  <option value="confidence">Sort by Confidence</option>
                  <option value="rr">Sort by R:R</option>
                </select>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={showRejected}
                    onChange={(e) => setShowRejected(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  Show Rejected
                </label>
              </div>
            </div>

            {/* Signals List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Zap size={32} className="mx-auto mb-2 opacity-50" />
                  No signals found matching your filters
                  {connectionStatus === 'connected' ? (
                    <p className="text-xs mt-1 text-gray-400">Waiting for new signals...</p>
                  ) : (
                    <p className="text-xs mt-1 text-gray-400">Connect to WebSocket to receive live signals</p>
                  )}
                </div>
              ) : (
                filtered.map((signal) => {
                  const isExpanded = expandedId === signal.id;
                  const statusColors = {
                    live: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20',
                    pending: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20',
                    rejected: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 opacity-70',
                    executed: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20',
                  };
                  
                  return (
                    <div key={signal.id} className={`border rounded-lg overflow-hidden transition-all ${statusColors[signal.status]}`}>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                            className="flex-1 flex items-center gap-3 text-left min-w-0"
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              signal.direction === 'LONG' 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              {signal.direction === 'LONG' ? (
                                <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
                              ) : (
                                <TrendingDown size={14} className="text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {signal.symbol}
                                </span>
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                  signal.direction === 'LONG' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                  {signal.direction}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {signal.timeframe}
                                </span>
                                {signal.signalSource && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                    {signal.signalSource}
                                  </span>
                                )}
                                <div className={`ml-auto flex items-center gap-1.5 ${getStatusTextColor(signal.status)}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(signal.status)}`} />
                                  <span className="text-xs font-medium capitalize">
                                    {signal.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Entry: <span className="font-mono text-gray-900 dark:text-white">${signal.entryPrice.toLocaleString()}</span>
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  R:R <span className="font-mono text-gray-900 dark:text-white">1:{signal.rr}</span>
                                </span>
                                <span className={`text-xs font-bold ${
                                  signal.confidence >= 85 ? 'text-green-600 dark:text-green-400' : 
                                  signal.confidence >= 75 ? 'text-yellow-600 dark:text-yellow-400' : 
                                  'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {signal.confidence}% conf
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                  {signal.generatedAt}
                                </span>
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            {signal.status === 'pending' && (
                              <button
                                onClick={() => handleExecuteSignal(signal.id)}
                                className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                                title="Execute signal"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteSignal(signal.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                              title="Delete signal"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            {signal.rejectionReason && (
                              <div className="flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                                <span>Rejected: {signal.rejectionReason}</span>
                              </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                { label: 'Stop Loss', value: `$${signal.sl.toLocaleString()}`, color: 'text-red-600 dark:text-red-400' },
                                { label: 'TP1', value: `$${signal.tp1.toLocaleString()}`, color: 'text-green-600 dark:text-green-400' },
                                { label: 'TP2', value: `$${signal.tp2.toLocaleString()}`, color: 'text-green-600 dark:text-green-400' },
                              ].map(({ label, value, color }) => (
                                <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded p-2 text-center">
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
                                  <p className={`text-xs font-mono font-bold ${color}`}>{value}</p>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Regime:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{signal.regime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Volume Spike:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{signal.volumeSpike.toFixed(1)}x</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">RSI:</span>
                                <span className={`font-medium ${
                                  signal.rsi > 70 ? 'text-red-600 dark:text-red-400' : 
                                  signal.rsi < 30 ? 'text-green-600 dark:text-green-400' : 
                                  'text-gray-900 dark:text-white'
                                }`}>{signal.rsi}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">MACD:</span>
                                <span className={`font-medium capitalize ${
                                  signal.macdSignal === 'bullish' ? 'text-green-600 dark:text-green-400' : 
                                  signal.macdSignal === 'bearish' ? 'text-red-600 dark:text-red-400' : 
                                  'text-gray-500 dark:text-gray-400'
                                }`}>{signal.macdSignal}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">BB Position:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{signal.bbPosition}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Volume:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  ${(signal.volume / 1000000).toFixed(1)}M
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Indicator Config & Stats */}
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
                Active Indicators
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {indicators.filter(i => i.enabled).length}/{indicators.length}
                </span>
              </h3>
              
              {(['momentum', 'trend', 'volatility', 'volume'] as const).map((category) => (
                <div key={category} className="mb-3">
                  <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    {category}
                  </h4>
                  <div className="space-y-1.5">
                    {indicators
                      .filter(ind => ind.category === category)
                      .map((ind) => (
                        <div key={ind.id} className="flex items-center justify-between py-1">
                          <span className={`text-xs ${ind.enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                            {ind.label}
                          </span>
                          <button
                            onClick={() => toggleIndicator(ind.id)}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${ind.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ind.enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Connection Stats */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Database size={14} className="text-purple-600 dark:text-purple-400" />
                Connection Status
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`font-medium flex items-center gap-1 ${
                    connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' :
                    connectionStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {getConnectionIcon()}
                    {getConnectionText()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total Signals</span>
                  <span className="font-medium text-gray-900 dark:text-white">{signals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Active Indicators</span>
                  <span className="font-medium text-gray-900 dark:text-white">{indicators.filter(i => i.enabled).length}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Data Source</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {connectionStatus === 'connected' ? 'WebSocket' : 'REST API'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Signal Summary</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Live</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{stats.live}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Pending</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">{stats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Rejected</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{stats.rejected}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Avg Confidence</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{stats.avgConfidence.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}