'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Settings, ExternalLink, Save, Key, Shield, 
  Wifi, WifiOff, RefreshCw, CheckCircle, XCircle,
  AlertCircle, Eye, EyeOff, Copy, Check,
  Network, Database, Activity, Server
} from 'lucide-react';

// ============== TYPES ==============
interface ApiCredentials {
  apiKey: string;
  apiSecret: string;
  isTestnet: boolean;
  permissions: string[];
}

interface SymbolConfig {
  symbol: string;
  enabled: boolean;
  baseAsset: string;
  quoteAsset: string;
}

interface WebSocketConfig {
  url: string;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  enableCompression: boolean;
  batchSize: number;
}

interface ConnectionHealth {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  latency: number;
  messagesReceived: number;
  messagesSent: number;
  connectionUptime: string;
  reconnectAttempts: number;
  lastMessage: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

// ============== COMPONENTS ==============

// API Credentials Panel
const ApiCredentialsPanel = () => {
  const [credentials, setCredentials] = useState<ApiCredentials>({
    apiKey: '',
    apiSecret: '',
    isTestnet: true,
    permissions: ['read', 'trade'],
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validate inputs
      if (!credentials.apiKey || credentials.apiKey.length < 10) {
        throw new Error('Invalid API Key format');
      }
      if (!credentials.apiSecret || credentials.apiSecret.length < 10) {
        throw new Error('Invalid API Secret format');
      }
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    // Simulate connection test
    setSaveStatus('idle');
    // Would call API to test connection
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Key size={16} className="text-blue-600 dark:text-blue-400" />
          API Credentials
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          credentials.isTestnet 
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {credentials.isTestnet ? 'Testnet' : 'Live'}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            API Key
          </label>
          <div className="relative">
            <input
              type="text"
              value={credentials.apiKey}
              onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 pr-24 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            {credentials.apiKey && (
              <button
                onClick={() => copyToClipboard(credentials.apiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            API Secret
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={credentials.apiSecret}
              onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
              placeholder="Enter your API secret"
              className="w-full px-3 py-2 pr-24 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              {credentials.apiSecret && (
                <button
                  onClick={() => copyToClipboard(credentials.apiSecret)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={credentials.isTestnet}
              onChange={(e) => setCredentials({ ...credentials, isTestnet: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Use Testnet
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Permissions:</span>
            {credentials.permissions.map((p) => (
              <span key={p} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Wifi size={14} />
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              saveStatus === 'success'
                ? 'bg-green-500 text-white'
                : saveStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle size={14} />
            ) : saveStatus === 'error' ? (
              <XCircle size={14} />
            ) : (
              <Save size={14} />
            )}
            {saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Failed' : 'Save'}
          </button>
        </div>

        {saveStatus === 'error' && (
          <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle size={12} />
            Failed to save credentials. Please check your inputs.
          </div>
        )}
      </div>
    </div>
  );
};

// Symbol Selector Panel
const SymbolSelectorPanel = () => {
  const [symbols, setSymbols] = useState<SymbolConfig[]>([
    { symbol: 'BTCUSDT', enabled: true, baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETHUSDT', enabled: true, baseAsset: 'ETH', quoteAsset: 'USDT' },
    { symbol: 'BNBUSDT', enabled: true, baseAsset: 'BNB', quoteAsset: 'USDT' },
    { symbol: 'SOLUSDT', enabled: true, baseAsset: 'SOL', quoteAsset: 'USDT' },
    { symbol: 'XRPUSDT', enabled: false, baseAsset: 'XRP', quoteAsset: 'USDT' },
    { symbol: 'ADAUSDT', enabled: false, baseAsset: 'ADA', quoteAsset: 'USDT' },
    { symbol: 'DOGEUSDT', enabled: false, baseAsset: 'DOGE', quoteAsset: 'USDT' },
    { symbol: 'DOTUSDT', enabled: false, baseAsset: 'DOT', quoteAsset: 'USDT' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const toggleSymbol = (symbol: string) => {
    setSymbols(prev => prev.map(s => 
      s.symbol === symbol ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const toggleAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setSymbols(prev => prev.map(s => ({ ...s, enabled: newState })));
  };

  const filteredSymbols = symbols.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = symbols.filter(s => s.enabled).length;

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Network size={16} className="text-green-600 dark:text-green-400" />
          Trading Symbols
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {enabledCount} / {symbols.length} enabled
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search symbols..."
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>
        <button
          onClick={toggleAll}
          className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {selectAll ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
        {filteredSymbols.map((symbol) => (
          <button
            key={symbol.symbol}
            onClick={() => toggleSymbol(symbol.symbol)}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
              symbol.enabled
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className={`text-xs font-medium ${
              symbol.enabled ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {symbol.symbol}
            </span>
            {symbol.enabled ? (
              <CheckCircle size={12} className="text-blue-600 dark:text-blue-400" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span>Base: {symbols.filter(s => s.enabled).map(s => s.baseAsset).join(', ') || 'None'}</span>
        <span>Quote: USDT</span>
      </div>
    </div>
  );
};

// WebSocket Config Panel
const WebSocketConfigPanel = () => {
  const [config, setConfig] = useState<WebSocketConfig>({
    url: 'wss://stream.binance.com:9443/ws',
    reconnectDelay: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    enableCompression: true,
    batchSize: 10,
  });
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const connect = async () => {
    setStatus('connecting');
    addLog('Connecting to WebSocket...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus('connected');
      addLog('✅ Connected successfully');
      
      // Simulate messages
      const interval = setInterval(() => {
        if (status === 'connected') {
          addLog(`📩 Received data: ${Math.random().toFixed(4)}`);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    } catch (error) {
      setStatus('error');
      addLog('❌ Connection failed');
    }
  };

  const disconnect = () => {
    setStatus('idle');
    addLog('🔌 Disconnected');
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-20));
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Server size={16} className="text-purple-600 dark:text-purple-400" />
          WebSocket Configuration
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
            status === 'connected' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : status === 'connecting'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              : status === 'error'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}>
            {status === 'connected' && <CheckCircle size={10} />}
            {status === 'connecting' && <RefreshCw size={10} className="animate-spin" />}
            {status === 'error' && <XCircle size={10} />}
            {status === 'idle' && <WifiOff size={10} />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            WebSocket URL
          </label>
          <input
            type="text"
            value={config.url}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Reconnect Delay (ms)
            </label>
            <input
              type="number"
              value={config.reconnectDelay}
              onChange={(e) => setConfig({ ...config, reconnectDelay: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Max Reconnect Attempts
            </label>
            <input
              type="number"
              value={config.maxReconnectAttempts}
              onChange={(e) => setConfig({ ...config, maxReconnectAttempts: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={config.enableCompression}
              onChange={(e) => setConfig({ ...config, enableCompression: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Enable Compression
          </label>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mr-2">
              Batch Size
            </label>
            <select
              value={config.batchSize}
              onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) })}
              className="px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 20, 50].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'connected' ? (
            <button
              onClick={disconnect}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <WifiOff size={14} />
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={status === 'connecting'}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'connecting' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Wifi size={14} />
              )}
              {status === 'connecting' ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>

        {logs.length > 0 && (
          <div className="p-2 bg-gray-900 dark:bg-gray-950 rounded-lg max-h-32 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-[10px] font-mono text-green-400">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Connection Health Panel
const ConnectionHealthPanel = () => {
  const [health, setHealth] = useState<ConnectionHealth>({
    status: 'connected',
    latency: 45,
    messagesReceived: 1234,
    messagesSent: 567,
    connectionUptime: '2h 15m 32s',
    reconnectAttempts: 2,
    lastMessage: '2024-01-15 14:23:45',
    quality: 'excellent',
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setHealth(prev => ({
        ...prev,
        messagesReceived: prev.messagesReceived + Math.floor(Math.random() * 10),
        latency: 30 + Math.random() * 50,
        connectionUptime: prev.connectionUptime,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 dark:text-green-400';
      case 'connecting': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity size={16} className="text-green-600 dark:text-green-400" />
          Connection Health
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh
          </label>
          <button 
            onClick={() => setHealth(prev => ({ ...prev, status: 'connected' }))}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
            <div className={`text-sm font-semibold flex items-center gap-1 ${getStatusColor(health.status)}`}>
              {health.status === 'connected' && <CheckCircle size={14} />}
              {health.status === 'error' && <XCircle size={14} />}
              {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">Latency</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {Math.round(health.latency)}ms
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">Messages Received</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {health.messagesReceived.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">Quality</div>
            <div className={`text-sm font-semibold ${getQualityColor(health.quality)}`}>
              {health.quality.charAt(0).toUpperCase() + health.quality.slice(1)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Uptime: {health.connectionUptime}</span>
          <span>Reconnects: {health.reconnectAttempts}</span>
          <span>Last: {health.lastMessage}</span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${
              health.quality === 'excellent' ? 'bg-green-500' :
              health.quality === 'good' ? 'bg-blue-500' :
              health.quality === 'fair' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ 
              width: health.quality === 'excellent' ? '95%' :
                     health.quality === 'good' ? '75%' :
                     health.quality === 'fair' ? '50%' :
                     '25%'
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <span>0ms</span>
          <span>100ms</span>
          <span>200ms</span>
          <span>300ms+</span>
        </div>
      </div>
    </div>
  );
};

// ============== MAIN PAGE ==============
export default function SettingsPage() {
  const [bybitLink, setBybitLink] = useState('https://www.bybit.com/app/user/api-management');

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Settings size={20} className="text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold text-xl tracking-tight">
                Settings
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                Configure Bybit API credentials, target symbols, WebSocket feeds, and monitor connection health
              </p>
            </div>
          </div>
          <a
            href={bybitLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ExternalLink size={12} />
            Bybit API Management
          </a>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ApiCredentialsPanel />
          <ConnectionHealthPanel />
          <SymbolSelectorPanel />
          <WebSocketConfigPanel />
        </div>

        {/* Footer note */}
        <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-center text-[11px] text-yellow-700 dark:text-yellow-400 flex items-center justify-center gap-2">
            <Shield size={12} />
            API credentials are stored in browser session only. For production use, store keys server-side via environment variables.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}