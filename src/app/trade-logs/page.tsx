'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Activity, Search, Download, ChevronUp, ChevronDown,
  Wifi, WifiOff, RefreshCw, AlertCircle, X, Filter,
  TrendingUp, TrendingDown, Clock, Calendar
} from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPct: number;
  confidence: number;
  regime: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  exitReason: string;
  slippage: number;
  entryTimestamp: number;
  exitTimestamp: number;
  status: 'open' | 'closed' | 'partial';
}

type SortKey = keyof Trade;

// API Configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws',
  endpoints: {
    trades: '/trades',
    export: '/trades/export',
  }
};

export default function TradeLogsPage() {
  // State
  const [trades, setTrades] = useState<Trade[]>([]);
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [filterResult, setFilterResult] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'open' | 'closed'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('entryTimestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchTrades();
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Fetch trades from REST API
  const fetchTrades = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.trades}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch trades');

      const data = await response.json();
      setTrades(data.trades || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to load trades. Please refresh.');
      setTrades([]);
    } finally {
      setIsLoading(false);
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
        
        startHeartbeat();
        
        // Subscribe to trade stream
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'trades',
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

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_trade':
        setTrades(prev => [data.trade, ...prev]);
        break;

      case 'trade_update':
        setTrades(prev => prev.map(t => 
          t.id === data.trade.id ? data.trade : t
        ));
        break;

      case 'trade_closed':
        setTrades(prev => prev.map(t => 
          t.id === data.tradeId ? { ...t, status: 'closed', ...data.update } : t
        ));
        break;

      case 'pong':
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Handle reconnect
  const handleReconnect = () => {
    disconnectWebSocket();
    setTimeout(connectWebSocket, 1000);
  };

  // Export trades
  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.export}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trades: filtered,
          format: 'csv',
        }),
      });

      if (!response.ok) throw new Error('Failed to export trades');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting trades:', err);
      setError('Failed to export trades');
    } finally {
      setExporting(false);
    }
  };

  // Sorting handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Filter and sort trades
  const filtered = trades
    .filter((t) => {
      if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSide !== 'ALL' && t.side !== filterSide) return false;
      if (filterResult === 'WIN' && t.pnl <= 0) return false;
      if (filterResult === 'LOSS' && t.pnl > 0) return false;
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const dir = sortDir === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  // Calculate statistics
  const totalPnl = filtered.reduce((s, t) => s + t.pnl, 0);
  const wins = filtered.filter((t) => t.pnl > 0).length;
  const losses = filtered.filter((t) => t.pnl < 0).length;
  const winRate = filtered.length > 0 ? ((wins / filtered.length) * 100).toFixed(1) : '0.0';
  const avgPnl = filtered.length > 0 ? totalPnl / filtered.length : 0;
  const avgConfidence = filtered.length > 0 
    ? (filtered.reduce((s, t) => s + t.confidence, 0) / filtered.length).toFixed(0) 
    : '0';

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-600" /> : <ChevronDown size={12} className="text-blue-600" />
    ) : (
      <ChevronDown size={12} className="text-gray-400" />
    );

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi size={14} className="text-green-500" />;
      case 'connecting': return <RefreshCw size={14} className="text-yellow-500 animate-spin" />;
      case 'error': return <WifiOff size={14} className="text-red-500" />;
      default: return <WifiOff size={14} className="text-gray-500" />;
    }
  };

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
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Activity size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Trade Logs</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete history of all executed trades
                {connectionStatus === 'connected' && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">● Live</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
              onClick={fetchTrades}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Refresh trades"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} className={exporting ? 'animate-pulse' : ''} />
              {exporting ? 'Exporting...' : 'Export CSV'}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Trades', value: filtered.length.toString(), color: 'text-gray-900 dark:text-white' },
            { label: 'Win Rate', value: `${winRate}%`, color: parseFloat(winRate) >= 60 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
            { label: 'Wins/Losses', value: `${wins}/${losses}`, color: 'text-gray-900 dark:text-white' },
            { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
            { label: 'Avg P&L', value: `${avgPnl >= 0 ? '+' : ''}$${avgPnl.toFixed(2)}`, color: avgPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
            { label: 'Avg Confidence', value: `${avgConfidence}%`, color: 'text-blue-600 dark:text-blue-400' },
          ].map((card) => (
            <div key={card.label} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
              <p className={`text-lg font-bold font-mono ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {(['ALL', 'LONG', 'SHORT'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSide(s)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  filterSide === s 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {(['ALL', 'WIN', 'LOSS'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterResult(r)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  filterResult === r
                    ? r === 'WIN' 
                      ? 'bg-green-600 text-white' 
                      : r === 'LOSS' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {(['ALL', 'open', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                  filterStatus === s 
                    ? s === 'open' 
                      ? 'bg-yellow-600 text-white' 
                      : s === 'closed' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {filtered.length} trades
          </span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  {[
                    { key: 'id' as SortKey, label: 'ID' },
                    { key: 'symbol' as SortKey, label: 'Symbol' },
                    { key: 'side' as SortKey, label: 'Side' },
                    { key: 'status' as SortKey, label: 'Status' },
                    { key: 'entryPrice' as SortKey, label: 'Entry' },
                    { key: 'exitPrice' as SortKey, label: 'Exit' },
                    { key: 'pnl' as SortKey, label: 'P&L' },
                    { key: 'confidence' as SortKey, label: 'Conf.' },
                    { key: 'regime' as SortKey, label: 'Regime' },
                    { key: 'duration' as SortKey, label: 'Duration' },
                    { key: 'exitReason' as SortKey, label: 'Exit Reason' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none whitespace-nowrap"
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((trade, i) => (
                  <tr
                    key={trade.id}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {trade.id}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-white">
                      {trade.symbol}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        trade.side === 'LONG' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        trade.status === 'open' 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-300">
                      ${trade.entryPrice.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {trade.exitPrice ? `$${trade.exitPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className={`px-3 py-2.5 font-mono text-xs font-bold ${
                      trade.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      <span className="text-[10px] ml-1 opacity-70">
                        ({trade.pnlPct >= 0 ? '+' : ''}{trade.pnlPct}%)
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold ${
                        trade.confidence >= 85 ? 'text-green-600 dark:text-green-400' : 
                        trade.confidence >= 75 ? 'text-yellow-600 dark:text-yellow-400' : 
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {trade.confidence}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {trade.regime}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {trade.duration || '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        trade.exitReason?.includes('TP') 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        trade.exitReason?.includes('SL') 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {trade.exitReason || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
              <Activity size={32} className="mx-auto mb-2 opacity-50" />
              No trades match your filters
              {connectionStatus === 'connected' && (
                <p className="text-xs mt-1 text-gray-400">Waiting for new trades...</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>Showing {filtered.length} of {trades.length} trades</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Data source: {connectionStatus === 'connected' ? 'WebSocket' : 'REST API'}</span>
            {connectionStatus === 'connected' && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}