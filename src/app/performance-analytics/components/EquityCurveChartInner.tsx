'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

// Realistic equity curve with drawdowns — not a smooth upward trend
const EQUITY_DATA = [
  { date: 'Jul 9', equity: 24000, drawdown: 0 },
  { date: 'Jul 9 PM', equity: 24087, drawdown: 0 },
  { date: 'Jul 9 Eve', equity: 24041, drawdown: -0.19 },
  { date: 'Jul 10 AM', equity: 24156, drawdown: 0 },
  { date: 'Jul 10', equity: 24310, drawdown: 0 },
  { date: 'Jul 10 PM', equity: 24198, drawdown: -0.46 },
  { date: 'Jul 10 Eve', equity: 24089, drawdown: -0.91 },
  { date: 'Jul 10 Night', equity: 23971, drawdown: -1.41 },
  { date: 'Jul 11 AM', equity: 24186, drawdown: -0.47 },
  { date: 'Jul 11', equity: 24389, drawdown: 0 },
  { date: 'Jul 11 PM', equity: 24512, drawdown: 0 },
  { date: 'Jul 11 Eve', equity: 24631, drawdown: 0 },
  { date: 'Jul 11 Night', equity: 24831, drawdown: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pnl = d.equity - 24000;
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
  const [showDrawdown, setShowDrawdown] = useState(false);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Equity Curve
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paper session · Jul 9–11, 2026 · Starting capital $24,000
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDrawdown(false)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all duration-150 ${
                !showDrawdown
                  ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Equity
            </button>
            <button
              onClick={() => setShowDrawdown(true)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all duration-150 ${
                showDrawdown
                  ? 'bg-negative-subtle text-negative' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Drawdown
            </button>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Total Return</p>
            <p className="text-sm font-bold text-positive font-tabular">+$831 (+3.46%)</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={EQUITY_DATA}
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
            interval={1}
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
          {!showDrawdown && (
            <ReferenceLine
              y={24000}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{ value: 'Start', fill: 'var(--muted-foreground)', fontSize: 10 }}
            />
          )}
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
    </div>
  );
}