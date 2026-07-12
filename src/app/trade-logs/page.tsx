'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Activity, Search, Download, ChevronUp, ChevronDown } from 'lucide-react';

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
}

const MOCK_TRADES: Trade[] = [
  { id: 'T001', symbol: 'BTCUSDT', side: 'LONG', entryPrice: 43250, exitPrice: 44100, size: 0.12, pnl: 102.0, pnlPct: 1.97, confidence: 87, regime: 'Trending', entryTime: '2024-01-15 09:14', exitTime: '2024-01-15 10:02', duration: '48m', exitReason: 'TP1 Hit', slippage: 0.02 },
  { id: 'T002', symbol: 'ETHUSDT', side: 'SHORT', entryPrice: 2580, exitPrice: 2510, size: 1.5, pnl: 105.0, pnlPct: 2.71, confidence: 91, regime: 'Volatile', entryTime: '2024-01-15 11:30', exitTime: '2024-01-15 12:15', duration: '45m', exitReason: 'TP2 Hit', slippage: 0.03 },
  { id: 'T003', symbol: 'SOLUSDT', side: 'LONG', entryPrice: 98.5, exitPrice: 96.2, size: 15, pnl: -34.5, pnlPct: -2.34, confidence: 78, regime: 'Ranging', entryTime: '2024-01-15 13:00', exitTime: '2024-01-15 13:42', duration: '42m', exitReason: 'SL Hit', slippage: 0.04 },
  { id: 'T004', symbol: 'BNBUSDT', side: 'LONG', entryPrice: 312.0, exitPrice: 318.5, size: 3.2, pnl: 20.8, pnlPct: 2.08, confidence: 84, regime: 'Trending', entryTime: '2024-01-15 14:20', exitTime: '2024-01-15 15:05', duration: '45m', exitReason: 'TP1 Hit', slippage: 0.02 },
  { id: 'T005', symbol: 'XRPUSDT', side: 'SHORT', entryPrice: 0.625, exitPrice: 0.641, size: 2000, pnl: -32.0, pnlPct: -2.56, confidence: 76, regime: 'Ranging', entryTime: '2024-01-15 15:30', exitTime: '2024-01-15 16:10', duration: '40m', exitReason: 'SL Hit', slippage: 0.05 },
  { id: 'T006', symbol: 'ADAUSDT', side: 'LONG', entryPrice: 0.485, exitPrice: 0.502, size: 3000, pnl: 51.0, pnlPct: 3.51, confidence: 89, regime: 'Trending', entryTime: '2024-01-15 16:45', exitTime: '2024-01-15 17:30', duration: '45m', exitReason: 'TP2 Hit', slippage: 0.02 },
  { id: 'T007', symbol: 'DOTUSDT', side: 'SHORT', entryPrice: 8.92, exitPrice: 8.71, size: 120, pnl: 25.2, pnlPct: 2.35, confidence: 83, regime: 'Volatile', entryTime: '2024-01-15 18:00', exitTime: '2024-01-15 18:55', duration: '55m', exitReason: 'TP1 Hit', slippage: 0.03 },
  { id: 'T008', symbol: 'AVAXUSDT', side: 'LONG', entryPrice: 38.4, exitPrice: 39.8, size: 25, pnl: 35.0, pnlPct: 3.65, confidence: 92, regime: 'Trending', entryTime: '2024-01-15 19:10', exitTime: '2024-01-15 20:00', duration: '50m', exitReason: 'TP2 Hit', slippage: 0.02 },
  { id: 'T009', symbol: 'MATICUSDT', side: 'SHORT', entryPrice: 0.892, exitPrice: 0.921, size: 1500, pnl: -43.5, pnlPct: -3.25, confidence: 74, regime: 'Ranging', entryTime: '2024-01-15 20:30', exitTime: '2024-01-15 21:15', duration: '45m', exitReason: 'SL Hit', slippage: 0.04 },
  { id: 'T010', symbol: 'LINKUSDT', side: 'LONG', entryPrice: 14.85, exitPrice: 15.42, size: 80, pnl: 45.6, pnlPct: 3.84, confidence: 88, regime: 'Trending', entryTime: '2024-01-15 21:45', exitTime: '2024-01-15 22:30', duration: '45m', exitReason: 'TP2 Hit', slippage: 0.02 },
];

type SortKey = keyof Trade;

export default function TradeLogsPage() {
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [filterResult, setFilterResult] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('entryTime');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = MOCK_TRADES
    .filter((t) => {
      if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSide !== 'ALL' && t.side !== filterSide) return false;
      if (filterResult === 'WIN' && t.pnl <= 0) return false;
      if (filterResult === 'LOSS' && t.pnl > 0) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const dir = sortDir === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  const totalPnl = filtered.reduce((s, t) => s + t.pnl, 0);
  const wins = filtered.filter((t) => t.pnl > 0).length;
  const winRate = filtered.length > 0 ? ((wins / filtered.length) * 100).toFixed(1) : '0.0';

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />
    ) : (
      <ChevronDown size={12} className="text-muted-foreground/40" />
    );

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Trade Logs</h1>
              <p className="text-sm text-muted-foreground">Complete history of all executed trades</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Trades', value: filtered.length.toString(), color: 'text-foreground' },
            { label: 'Win Rate', value: `${winRate}%`, color: wins / filtered.length >= 0.6 ? 'text-positive' : 'text-negative' },
            { label: 'Total P&L', value: `$${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'text-positive' : 'text-negative' },
            { label: 'Avg Confidence', value: `${filtered.length > 0 ? (filtered.reduce((s, t) => s + t.confidence, 0) / filtered.length).toFixed(0) : 0}%`, color: 'text-info' },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              <p className={`text-lg font-bold font-mono ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            {(['ALL', 'LONG', 'SHORT'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSide(s)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  filterSide === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            {(['ALL', 'WIN', 'LOSS'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterResult(r)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  filterResult === r
                    ? r === 'WIN' ? 'bg-positive text-white' : r === 'LOSS' ? 'bg-negative text-white' : 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {[
                    { key: 'id' as SortKey, label: 'ID' },
                    { key: 'symbol' as SortKey, label: 'Symbol' },
                    { key: 'side' as SortKey, label: 'Side' },
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
                      className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none"
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
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{trade.id}</td>
                    <td className="px-3 py-2.5 font-semibold text-foreground">{trade.symbol}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.side === 'LONG' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">${trade.entryPrice.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">${trade.exitPrice.toLocaleString()}</td>
                    <td className={`px-3 py-2.5 font-mono text-xs font-bold ${trade.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      <span className="text-[10px] ml-1 opacity-70">({trade.pnlPct >= 0 ? '+' : ''}{trade.pnlPct}%)</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold ${trade.confidence >= 85 ? 'text-positive' : trade.confidence >= 80 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {trade.confidence}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{trade.regime}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{trade.duration}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        trade.exitReason.includes('TP') ? 'bg-positive/10 text-positive' :
                        trade.exitReason.includes('SL') ? 'bg-negative/10 text-negative' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {trade.exitReason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No trades match your filters</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
