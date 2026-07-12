'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

interface InstrumentRow {
  id: string;
  symbol: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  netPnl: number;
  avgHoldMins: number;
  bestTrade: number;
  worstTrade: number;
  regime: 'trending' | 'ranging' | 'volatile';
}

const INSTRUMENT_DATA: InstrumentRow[] = [
  {
    id: 'inst-btcusdt',
    symbol: 'BTCUSDT',
    trades: 12,
    wins: 10,
    losses: 2,
    winRate: 83.3,
    grossProfit: 487.4,
    grossLoss: 89.2,
    profitFactor: 5.46,
    avgWin: 48.74,
    avgLoss: 44.6,
    netPnl: 398.2,
    avgHoldMins: 41,
    bestTrade: 98.9,
    worstTrade: -51.3,
    regime: 'trending',
  },
  {
    id: 'inst-ethusdt',
    symbol: 'ETHUSDT',
    trades: 10,
    wins: 7,
    losses: 3,
    winRate: 70.0,
    grossProfit: 298.1,
    grossLoss: 112.4,
    profitFactor: 2.65,
    avgWin: 42.59,
    avgLoss: 37.47,
    netPnl: 185.7,
    avgHoldMins: 35,
    bestTrade: 71.2,
    worstTrade: -44.8,
    regime: 'trending',
  },
  {
    id: 'inst-solusdt',
    symbol: 'SOLUSDT',
    trades: 8,
    wins: 5,
    losses: 3,
    winRate: 62.5,
    grossProfit: 187.3,
    grossLoss: 98.7,
    profitFactor: 1.9,
    avgWin: 37.46,
    avgLoss: 32.9,
    netPnl: 88.6,
    avgHoldMins: 43,
    bestTrade: 62.4,
    worstTrade: -38.1,
    regime: 'ranging',
  },
  {
    id: 'inst-bnbusdt',
    symbol: 'BNBUSDT',
    trades: 6,
    wins: 5,
    losses: 1,
    winRate: 83.3,
    grossProfit: 201.8,
    grossLoss: 31.4,
    profitFactor: 6.42,
    avgWin: 40.36,
    avgLoss: 31.4,
    netPnl: 170.4,
    avgHoldMins: 28,
    bestTrade: 54.1,
    worstTrade: -31.4,
    regime: 'trending',
  },
  {
    id: 'inst-adausdt',
    symbol: 'ADAUSDT',
    trades: 5,
    wins: 3,
    losses: 2,
    winRate: 60.0,
    grossProfit: 98.4,
    grossLoss: 72.1,
    profitFactor: 1.36,
    avgWin: 32.8,
    avgLoss: 36.05,
    netPnl: 26.3,
    avgHoldMins: 52,
    bestTrade: 41.2,
    worstTrade: -42.9,
    regime: 'ranging',
  },
  {
    id: 'inst-xrpusdt',
    symbol: 'XRPUSDT',
    trades: 4,
    wins: 3,
    losses: 1,
    winRate: 75.0,
    grossProfit: 142.6,
    grossLoss: 28.7,
    profitFactor: 4.97,
    avgWin: 47.53,
    avgLoss: 28.7,
    netPnl: 113.9,
    avgHoldMins: 38,
    bestTrade: 62.4,
    worstTrade: -28.7,
    regime: 'trending',
  },
  {
    id: 'inst-dotusdt',
    symbol: 'DOTUSDT',
    trades: 2,
    wins: 1,
    losses: 1,
    winRate: 50.0,
    grossProfit: 31.8,
    grossLoss: 29.4,
    profitFactor: 1.08,
    avgWin: 31.8,
    avgLoss: 29.4,
    netPnl: 2.4,
    avgHoldMins: 67,
    bestTrade: 31.8,
    worstTrade: -29.4,
    regime: 'volatile',
  },
];

type SortKey = keyof InstrumentRow;

export default function InstrumentPerformanceTable() {
  const [sortKey, setSortKey] = useState<SortKey>('netPnl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...INSTRUMENT_DATA].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av;
    }
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col ml-1 opacity-40">
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

  const columns: { label: string; key: SortKey; align?: 'right' }[] = [
    { label: 'Symbol', key: 'symbol' },
    { label: 'Trades', key: 'trades', align: 'right' },
    { label: 'Win Rate', key: 'winRate', align: 'right' },
    { label: 'Profit Factor', key: 'profitFactor', align: 'right' },
    { label: 'Net P&L', key: 'netPnl', align: 'right' },
    { label: 'Avg Win', key: 'avgWin', align: 'right' },
    { label: 'Avg Loss', key: 'avgLoss', align: 'right' },
    { label: 'Avg Hold', key: 'avgHoldMins', align: 'right' },
    { label: 'Best', key: 'bestTrade', align: 'right' },
    { label: 'Worst', key: 'worstTrade', align: 'right' },
    { label: 'Regime', key: 'regime' },
  ];

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Instrument Performance Breakdown
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {INSTRUMENT_DATA.length} symbols traded · click column headers to sort
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Total Net P&L</p>
          <p className="text-sm font-bold text-positive font-tabular">
            +${INSTRUMENT_DATA.reduce((s, r) => s + r.netPnl, 0).toFixed(1)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm" aria-label="Instrument performance table">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={`th-inst-${col.key}`}
                  className={`
                    px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground
                    cursor-pointer hover:text-foreground select-none transition-colors
                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                  `}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/40 hover:bg-muted/25 transition-colors duration-100"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-foreground">
                        {row.symbol.replace('USDT', '').slice(0, 3)}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground text-xs font-mono">
                      {row.symbol}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-tabular text-xs text-muted-foreground">
                  <span className="text-positive">{row.wins}W</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-negative">{row.losses}L</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.winRate >= 70
                            ? 'bg-positive'
                            : row.winRate >= 60
                            ? 'bg-warning' :'bg-negative'
                        }`}
                        style={{ width: `${row.winRate}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold font-tabular w-10 ${
                        row.winRate >= 70
                          ? 'text-positive'
                          : row.winRate >= 60
                          ? 'text-warning' :'text-negative'
                      }`}
                    >
                      {row.winRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-tabular text-xs">
                  <span
                    className={`font-semibold ${
                      row.profitFactor >= 2
                        ? 'text-positive'
                        : row.profitFactor >= 1.5
                        ? 'text-warning' :'text-negative'
                    }`}
                  >
                    {row.profitFactor.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-tabular text-xs">
                  <span
                    className={`font-semibold ${
                      row.netPnl >= 0 ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {row.netPnl >= 0 ? '+' : ''}${row.netPnl.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-tabular text-xs text-positive">
                  +${row.avgWin.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right font-tabular text-xs text-negative">
                  -${row.avgLoss.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right font-tabular text-xs text-muted-foreground">
                  {row.avgHoldMins}m
                </td>
                <td className="px-4 py-3 text-right font-tabular text-xs text-positive">
                  +${row.bestTrade.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right font-tabular text-xs text-negative">
                  ${row.worstTrade.toFixed(1)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge variant={row.regime} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}