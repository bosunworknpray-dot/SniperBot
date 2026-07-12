'use client';

import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

interface Position {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  unrealizedPnl: number;
  unrealizedPct: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  atr: number;
  confidence: number;
  regime: 'trending' | 'ranging' | 'volatile';
  openedAt: string;
  holdMins: number;
}

const POSITIONS: Position[] = [
  {
    id: 'pos-btc-001',
    symbol: 'BTCUSDT',
    direction: 'long',
    entryPrice: 64820.5,
    currentPrice: 65341.0,
    size: 0.038,
    leverage: 5,
    unrealizedPnl: 98.92,
    unrealizedPct: 1.24,
    stopLoss: 63910.0,
    takeProfit1: 66380.0,
    takeProfit2: 67940.0,
    atr: 420.3,
    confidence: 87,
    regime: 'trending',
    openedAt: '22:14:33',
    holdMins: 105,
  },
  {
    id: 'pos-eth-002',
    symbol: 'ETHUSDT',
    direction: 'long',
    entryPrice: 3421.8,
    currentPrice: 3489.4,
    size: 0.61,
    leverage: 5,
    unrealizedPnl: 41.24,
    unrealizedPct: 1.97,
    stopLoss: 3356.0,
    takeProfit1: 3587.0,
    takeProfit2: 3752.0,
    atr: 28.4,
    confidence: 83,
    regime: 'trending',
    openedAt: '23:01:17',
    holdMins: 58,
  },
  {
    id: 'pos-sol-003',
    symbol: 'SOLUSDT',
    direction: 'short',
    entryPrice: 182.45,
    currentPrice: 184.1,
    size: 14.5,
    leverage: 5,
    unrealizedPnl: -23.93,
    unrealizedPct: -0.9,
    stopLoss: 186.8,
    takeProfit1: 176.2,
    takeProfit2: 170.8,
    atr: 1.85,
    confidence: 81,
    regime: 'ranging',
    openedAt: '23:28:44',
    holdMins: 31,
  },
];

type SortKey = 'symbol' | 'unrealizedPnl' | 'confidence' | 'holdMins';

export default function OpenPositionsTable() {
  const [sortKey, setSortKey] = useState<SortKey>('unrealizedPnl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [closeTarget, setCloseTarget] = useState<Position | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...POSITIONS].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av;
    }
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const handleCloseConfirm = () => {
    if (!closeTarget) return;
    toast.success(`Position closed — ${closeTarget.symbol}`, {
      description: `Market order submitted. Slippage report pending.`,
    });
    setCloseTarget(null);
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col ml-1 opacity-50">
      <ChevronUp
        size={9}
        className={sortKey === col && sortDir === 'asc' ? 'opacity-100 text-primary' : ''}
      />
      <ChevronDown
        size={9}
        className={sortKey === col && sortDir === 'desc' ? 'opacity-100 text-primary' : ''}
        style={{ marginTop: '-3px' }}
      />
    </span>
  );

  return (
    <>
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Open Positions
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-positive-subtle text-positive border border-positive/20">
              {POSITIONS.length} active
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Portfolio Heat:</span>
            <span className="text-warning font-semibold font-tabular">4.2%</span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-warning transition-all duration-500"
                style={{ width: '84%' }}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm" aria-label="Open positions table">
            <thead>
              <tr className="border-b border-border">
                {[
                  { label: 'Symbol', key: 'symbol' as SortKey, sortable: true },
                  { label: 'Dir.', key: null, sortable: false },
                  { label: 'Entry', key: null, sortable: false },
                  { label: 'Current', key: null, sortable: false },
                  { label: 'Size', key: null, sortable: false },
                  { label: 'Unreal. P&L', key: 'unrealizedPnl' as SortKey, sortable: true },
                  { label: 'SL / TP1 / TP2', key: null, sortable: false },
                  { label: 'Confidence', key: 'confidence' as SortKey, sortable: true },
                  { label: 'Regime', key: null, sortable: false },
                  { label: 'Hold', key: 'holdMins' as SortKey, sortable: true },
                  { label: '', key: null, sortable: false },
                ].map((col, i) => (
                  <th
                    key={`th-pos-${i}`}
                    className={`
                      px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground
                      ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}
                    `}
                    onClick={col.sortable && col.key ? () => handleSort(col.key!) : undefined}
                  >
                    {col.label}
                    {col.sortable && col.key && <SortIcon col={col.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((pos) => (
                <tr
                  key={pos.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-100 group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-[9px] font-bold text-foreground">
                          {pos.symbol.replace('USDT', '').slice(0, 3)}
                        </span>
                      </div>
                      <span className="font-semibold text-foreground text-xs font-mono">
                        {pos.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={pos.direction} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground font-tabular">
                    ${pos.entryPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-tabular">
                    <span
                      className={
                        pos.currentPrice > pos.entryPrice
                          ? 'text-positive' :'text-negative'
                      }
                    >
                      ${pos.currentPrice.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground font-tabular">
                    {pos.size} · {pos.leverage}x
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {pos.unrealizedPnl >= 0 ? (
                        <TrendingUp size={12} className="text-positive" />
                      ) : (
                        <TrendingDown size={12} className="text-negative" />
                      )}
                      <div>
                        <p
                          className={`font-semibold font-tabular text-xs ${
                            pos.unrealizedPnl >= 0 ? 'text-positive' : 'text-negative'
                          }`}
                        >
                          {pos.unrealizedPnl >= 0 ? '+' : ''}$
                          {Math.abs(pos.unrealizedPnl).toFixed(2)}
                        </p>
                        <p
                          className={`text-[10px] font-tabular ${
                            pos.unrealizedPct >= 0 ? 'text-positive' : 'text-negative'
                          }`}
                        >
                          {pos.unrealizedPct >= 0 ? '+' : ''}
                          {pos.unrealizedPct.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-mono font-tabular space-y-0.5">
                      <div className="flex gap-1 items-center">
                        <span className="text-negative w-6">SL</span>
                        <span className="text-muted-foreground">
                          ${pos.stopLoss.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-positive w-6">T1</span>
                        <span className="text-muted-foreground">
                          ${pos.takeProfit1.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-positive w-6">T2</span>
                        <span className="text-muted-foreground">
                          ${pos.takeProfit2.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pos.confidence >= 85
                              ? 'bg-positive'
                              : pos.confidence >= 75
                              ? 'bg-info' :'bg-warning'
                          }`}
                          style={{ width: `${pos.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold font-tabular text-foreground w-8">
                        {pos.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={pos.regime} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground font-tabular">
                    {pos.holdMins}m
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setCloseTarget(pos)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-md hover:bg-negative-subtle text-muted-foreground hover:text-negative active:scale-95"
                      title={`Close ${pos.symbol} position — market order`}
                      aria-label={`Close ${pos.symbol} position`}
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!closeTarget}
        title={`Close ${closeTarget?.symbol} Position`}
        description={`This will submit a market order to close your ${closeTarget?.direction?.toUpperCase()} position in ${closeTarget?.symbol}. Current unrealized P&L: ${closeTarget?.unrealizedPnl && closeTarget.unrealizedPnl >= 0 ? '+' : ''}$${Math.abs(closeTarget?.unrealizedPnl ?? 0).toFixed(2)}. This action cannot be undone.`}
        confirmLabel="Close Position"
        variant="danger"
        onConfirm={handleCloseConfirm}
        onCancel={() => setCloseTarget(null)}
      />
    </>
  );
}