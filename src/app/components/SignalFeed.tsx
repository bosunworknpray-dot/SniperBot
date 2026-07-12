'use client';

import React, { useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Filter, Clock } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

interface Signal {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  confidence: number;
  entryZone: string;
  stopLoss: number;
  takeProfit1: number;
  riskReward: number;
  volumeSpike: number;
  regime: 'trending' | 'ranging' | 'volatile';
  timeframe: '5m' | '15m';
  status: 'pending' | 'confirmed' | 'executed' | 'expired';
  generatedAt: string;
  indicators: string[];
}

const SIGNALS: Signal[] = [
  {
    id: 'sig-btcusdt-001',
    symbol: 'BTCUSDT',
    direction: 'long',
    confidence: 91,
    entryZone: '65,280 – 65,340',
    stopLoss: 64820,
    takeProfit1: 66640,
    riskReward: 2.9,
    volumeSpike: 2.3,
    regime: 'trending',
    timeframe: '15m',
    status: 'confirmed',
    generatedAt: '23:51:04',
    indicators: ['MA50↑', 'RSI 58', 'VWAP+', 'Vol×2.3'],
  },
  {
    id: 'sig-ethusdt-002',
    symbol: 'ETHUSDT',
    direction: 'long',
    confidence: 88,
    entryZone: '3,481 – 3,492',
    stopLoss: 3420,
    takeProfit1: 3620,
    riskReward: 2.5,
    volumeSpike: 1.8,
    regime: 'trending',
    timeframe: '5m',
    status: 'executed',
    generatedAt: '23:48:22',
    indicators: ['EMA20↑', 'RSI 62', 'BB mid', 'MACD+'],
  },
  {
    id: 'sig-bnbusdt-003',
    symbol: 'BNBUSDT',
    direction: 'short',
    confidence: 84,
    entryZone: '598.4 – 601.2',
    stopLoss: 612.0,
    takeProfit1: 572.0,
    riskReward: 2.7,
    volumeSpike: 1.6,
    regime: 'ranging',
    timeframe: '15m',
    status: 'pending',
    generatedAt: '23:55:11',
    indicators: ['RSI 71', 'BB upper', 'Div↓', 'S/R rej'],
  },
  {
    id: 'sig-adausdt-004',
    symbol: 'ADAUSDT',
    direction: 'long',
    confidence: 82,
    entryZone: '0.4821 – 0.4838',
    stopLoss: 0.471,
    takeProfit1: 0.511,
    riskReward: 2.6,
    volumeSpike: 2.1,
    regime: 'trending',
    timeframe: '5m',
    status: 'pending',
    generatedAt: '23:53:47',
    indicators: ['EMA9↑', 'Stoch 38', 'VWAP+', 'Vol×2.1'],
  },
  {
    id: 'sig-solusdt-005',
    symbol: 'SOLUSDT',
    direction: 'short',
    confidence: 79,
    entryZone: '183.8 – 184.4',
    stopLoss: 187.2,
    takeProfit1: 175.5,
    riskReward: 2.4,
    volumeSpike: 1.5,
    regime: 'ranging',
    timeframe: '15m',
    status: 'executed',
    generatedAt: '23:28:09',
    indicators: ['RSI 68', 'MA100↓', 'MACD-', 'Vol×1.5'],
  },
  {
    id: 'sig-dotusdt-006',
    symbol: 'DOTUSDT',
    direction: 'long',
    confidence: 76,
    entryZone: '7.821 – 7.849',
    stopLoss: 7.640,
    takeProfit1: 8.270,
    riskReward: 2.3,
    volumeSpike: 1.7,
    regime: 'volatile',
    timeframe: '5m',
    status: 'expired',
    generatedAt: '22:44:55',
    indicators: ['ATR high', 'RSI 44', 'BB squeeze', 'Vol×1.7'],
  },
];

const CONFIDENCE_COLOR = (c: number) =>
  c >= 88
    ? 'text-positive border-positive/30 bg-positive-subtle'
    : c >= 80
    ? 'text-info border-info/30 bg-info-subtle' :'text-warning border-warning/30 bg-warning-subtle';

export default function SignalFeed() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed'>('all');
  const [minConfidence, setMinConfidence] = useState(75);

  const filtered = SIGNALS.filter((s) => {
    if (filter === 'pending' && s.status !== 'pending' && s.status !== 'confirmed')
      return false;
    if (filter === 'executed' && s.status !== 'executed') return false;
    return s.confidence >= minConfidence;
  });

  return (
    <div className="card-surface overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Signal Feed</h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-info-subtle text-info border border-info/20">
            {SIGNALS.filter((s) => s.status === 'pending' || s.status === 'confirmed').length} live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Min:</span>
          <span className="text-xs font-semibold font-tabular text-primary w-7">
            {minConfidence}%
          </span>
          <input
            type="range"
            min={70}
            max={95}
            step={1}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="w-16"
            aria-label="Minimum confidence filter"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-4 py-2.5 border-b border-border shrink-0">
        {(['all', 'pending', 'executed'] as const).map((f) => (
          <button
            key={`filter-${f}`}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 capitalize
              ${
                filter === f
                  ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            {f === 'all' ? 'All Signals' : f === 'pending' ? 'Pending' : 'Executed'}
          </button>
        ))}
      </div>

      {/* Signal List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border/50">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <Zap size={28} className="text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">
              No signals match current filters
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Lower the confidence threshold or change the status filter
            </p>
          </div>
        ) : (
          filtered.map((signal) => (
            <div
              key={signal.id}
              className="px-4 py-3.5 hover:bg-muted/20 transition-colors duration-100 fade-in"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {signal.direction === 'long' ? (
                      <TrendingUp size={13} className="text-positive" />
                    ) : (
                      <TrendingDown size={13} className="text-negative" />
                    )}
                    <span className="text-sm font-semibold font-mono text-foreground">
                      {signal.symbol}
                    </span>
                  </div>
                  <StatusBadge variant={signal.direction} size="sm" />
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                    {signal.timeframe}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-bold font-tabular px-2 py-0.5 rounded border ${CONFIDENCE_COLOR(signal.confidence)}`}
                  >
                    {signal.confidence}%
                  </span>
                  <StatusBadge variant={signal.status as any} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px] font-mono mb-2">
                <div>
                  <span className="text-muted-foreground">Entry: </span>
                  <span className="text-foreground font-tabular">{signal.entryZone}</span>
                </div>
                <div>
                  <span className="text-negative">SL: </span>
                  <span className="text-foreground font-tabular">
                    {signal.stopLoss.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-positive">TP1: </span>
                  <span className="text-foreground font-tabular">
                    {signal.takeProfit1.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">R:R </span>
                  <span
                    className={signal.riskReward >= 2.5 ? 'text-positive' : 'text-warning'}
                  >
                    1:{signal.riskReward}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vol× </span>
                  <span className="text-info font-tabular">{signal.volumeSpike}x</span>
                </div>
                <div>
                  <StatusBadge variant={signal.regime} size="sm" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {signal.indicators.map((ind) => (
                    <span
                      key={`ind-${signal.id}-${ind}`}
                      className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded font-mono"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock size={9} />
                  <span className="font-mono">{signal.generatedAt}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}