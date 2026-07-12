'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Zap, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

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
  status: 'live' | 'pending' | 'rejected';
  rejectionReason?: string;
  generatedAt: string;
}

const MOCK_SIGNALS: Signal[] = [
  { id: 'S001', symbol: 'BTCUSDT', direction: 'LONG', confidence: 91, entryPrice: 43250, sl: 42800, tp1: 44100, tp2: 45200, rr: 3.1, regime: 'Trending', volumeSpike: 2.1, rsi: 58, macdSignal: 'bullish', bbPosition: 'Mid-Upper', timeframe: '5m', status: 'live', generatedAt: '2 min ago' },
  { id: 'S002', symbol: 'ETHUSDT', direction: 'SHORT', confidence: 87, entryPrice: 2580, sl: 2620, tp1: 2510, tp2: 2450, rr: 2.8, regime: 'Volatile', volumeSpike: 1.8, rsi: 68, macdSignal: 'bearish', bbPosition: 'Upper Band', timeframe: '15m', status: 'live', generatedAt: '5 min ago' },
  { id: 'S003', symbol: 'SOLUSDT', direction: 'LONG', confidence: 83, entryPrice: 98.5, sl: 96.8, tp1: 102.2, tp2: 105.5, rr: 2.6, regime: 'Trending', volumeSpike: 1.6, rsi: 52, macdSignal: 'bullish', bbPosition: 'Mid', timeframe: '5m', status: 'pending', generatedAt: '12 min ago' },
  { id: 'S004', symbol: 'BNBUSDT', direction: 'SHORT', confidence: 74, entryPrice: 312, sl: 318, tp1: 302, tp2: 295, rr: 2.1, regime: 'Ranging', volumeSpike: 1.2, rsi: 62, macdSignal: 'neutral', bbPosition: 'Upper Band', timeframe: '5m', status: 'rejected', rejectionReason: 'Confidence below 80% threshold', generatedAt: '18 min ago' },
  { id: 'S005', symbol: 'AVAXUSDT', direction: 'LONG', confidence: 88, entryPrice: 38.4, sl: 37.2, tp1: 40.8, tp2: 42.5, rr: 2.9, regime: 'Trending', volumeSpike: 1.9, rsi: 55, macdSignal: 'bullish', bbPosition: 'Mid-Upper', timeframe: '15m', status: 'live', generatedAt: '22 min ago' },
  { id: 'S006', symbol: 'XRPUSDT', direction: 'SHORT', confidence: 71, entryPrice: 0.625, sl: 0.645, tp1: 0.598, tp2: 0.572, rr: 1.9, regime: 'Ranging', volumeSpike: 1.1, rsi: 58, macdSignal: 'neutral', bbPosition: 'Mid', timeframe: '5m', status: 'rejected', rejectionReason: 'R:R below 2.5 minimum & volume insufficient', generatedAt: '35 min ago' },
];

const INDICATOR_CONFIG = [
  { id: 'rsi', label: 'RSI (14)', enabled: true },
  { id: 'macd', label: 'MACD (12,26,9)', enabled: true },
  { id: 'bb', label: 'Bollinger Bands (20,2)', enabled: true },
  { id: 'vwap', label: 'VWAP', enabled: true },
  { id: 'ema9', label: 'EMA 9', enabled: true },
  { id: 'ema20', label: 'EMA 20', enabled: true },
  { id: 'ma50', label: 'MA 50', enabled: true },
  { id: 'ma200', label: 'MA 200', enabled: false },
  { id: 'stochrsi', label: 'Stochastic RSI', enabled: true },
  { id: 'atr', label: 'ATR (14)', enabled: true },
  { id: 'volume_profile', label: 'Volume Profile', enabled: false },
  { id: 'sr_levels', label: 'Support/Resistance', enabled: true },
];

export default function SignalEnginePage() {
  const [signals] = useState<Signal[]>(MOCK_SIGNALS);
  const [indicators, setIndicators] = useState(INDICATOR_CONFIG);
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'pending' | 'rejected'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('S001');
  const [isScanning, setIsScanning] = useState(false);

  const toggleIndicator = (id: string) => {
    setIndicators((prev) => prev.map((ind) => ind.id === id ? { ...ind, enabled: !ind.enabled } : ind));
  };

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  const filtered = signals.filter((s) => filterStatus === 'all' || s.status === filterStatus);

  const liveCount = signals.filter((s) => s.status === 'live').length;
  const avgConfidence = signals.filter((s) => s.status === 'live').reduce((sum, s) => sum + s.confidence, 0) / (liveCount || 1);

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Signal Engine</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered signal generation with multi-indicator confluence
              </p>
            </div>
          </div>
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Scanning...' : 'Rescan Market'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Live Signals', value: liveCount.toString(), color: 'text-positive' },
            { label: 'Avg Confidence', value: `${avgConfidence.toFixed(0)}%`, color: 'text-primary' },
            { label: 'Rejected Today', value: signals.filter((s) => s.status === 'rejected').length.toString(), color: 'text-muted-foreground' },
            { label: 'Active Indicators', value: indicators.filter((i) => i.enabled).length.toString(), color: 'text-info' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Signal Feed */}
          <div className="lg:col-span-2 space-y-3">
            {/* Filter */}
            <div className="flex gap-1.5">
              {(['all', 'live', 'pending', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    filterStatus === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Signals */}
            <div className="space-y-2">
              {filtered.map((signal) => {
                const isExpanded = expandedId === signal.id;
                const statusColors = {
                  live: 'border-positive/30 bg-positive/5',
                  pending: 'border-warning/30 bg-warning/5',
                  rejected: 'border-border bg-muted/20 opacity-70',
                };
                return (
                  <div key={signal.id} className={`border rounded-lg overflow-hidden transition-all ${statusColors[signal.status]}`}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                      className="w-full p-4 flex items-center gap-3 text-left"
                    >
                      <div className={`p-1.5 rounded ${signal.direction === 'LONG' ? 'bg-positive/10' : 'bg-negative/10'}`}>
                        {signal.direction === 'LONG' ? (
                          <TrendingUp size={14} className="text-positive" />
                        ) : (
                          <TrendingDown size={14} className="text-negative" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{signal.symbol}</span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${signal.direction === 'LONG' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                            {signal.direction}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">{signal.timeframe}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${
                            signal.status === 'live' ? 'bg-positive/10 text-positive' :
                            signal.status === 'pending'? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                          }`}>
                            {signal.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">Entry: <span className="font-mono text-foreground">${signal.entryPrice.toLocaleString()}</span></span>
                          <span className="text-xs text-muted-foreground">R:R <span className="font-mono text-foreground">1:{signal.rr}</span></span>
                          <span className={`text-xs font-bold ${signal.confidence >= 85 ? 'text-positive' : signal.confidence >= 80 ? 'text-warning' : 'text-muted-foreground'}`}>
                            {signal.confidence}% conf
                          </span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                        {signal.rejectionReason && (
                          <p className="text-xs text-negative bg-negative/5 border border-negative/20 rounded px-3 py-2">
                            ❌ Rejected: {signal.rejectionReason}
                          </p>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Stop Loss', value: `$${signal.sl.toLocaleString()}`, color: 'text-negative' },
                            { label: 'TP1', value: `$${signal.tp1.toLocaleString()}`, color: 'text-positive' },
                            { label: 'TP2', value: `$${signal.tp2.toLocaleString()}`, color: 'text-positive' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-muted/40 rounded p-2 text-center">
                              <p className="text-[10px] text-muted-foreground">{label}</p>
                              <p className={`text-xs font-mono font-bold ${color}`}>{value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between"><span className="text-muted-foreground">Regime:</span><span className="font-medium">{signal.regime}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Volume Spike:</span><span className="font-medium">{signal.volumeSpike}x</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">RSI:</span><span className={`font-medium ${signal.rsi > 70 ? 'text-negative' : signal.rsi < 30 ? 'text-positive' : 'text-foreground'}`}>{signal.rsi}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">MACD:</span><span className={`font-medium capitalize ${signal.macdSignal === 'bullish' ? 'text-positive' : signal.macdSignal === 'bearish' ? 'text-negative' : 'text-muted-foreground'}`}>{signal.macdSignal}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">BB Position:</span><span className="font-medium">{signal.bbPosition}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Generated:</span><span className="font-mono">{signal.generatedAt}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicator Config */}
          <div className="bg-card border border-border rounded-lg p-4 h-fit">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              Active Indicators
            </h3>
            <div className="space-y-2">
              {indicators.map((ind) => (
                <div key={ind.id} className="flex items-center justify-between">
                  <span className={`text-xs ${ind.enabled ? 'text-foreground' : 'text-muted-foreground/50'}`}>{ind.label}</span>
                  <button
                    onClick={() => toggleIndicator(ind.id)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${ind.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ind.enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{indicators.filter((i) => i.enabled).length}</span> of {indicators.length} indicators active
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
