'use client';

import React from 'react';
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

const EQUITY_DATA = [
  { time: '00:00', equity: 24190, pnl: 0 },
  { time: '01:00', equity: 24210, pnl: 20 },
  { time: '02:00', equity: 24185, pnl: -5 },
  { time: '03:00', equity: 24230, pnl: 40 },
  { time: '04:00', equity: 24198, pnl: 8 },
  { time: '05:00', equity: 24267, pnl: 77 },
  { time: '06:00', equity: 24310, pnl: 120 },
  { time: '07:00', equity: 24289, pnl: 99 },
  { time: '08:00', equity: 24358, pnl: 168 },
  { time: '09:00', equity: 24401, pnl: 211 },
  { time: '10:00', equity: 24378, pnl: 188 },
  { time: '11:00', equity: 24445, pnl: 255 },
  { time: '12:00', equity: 24412, pnl: 222 },
  { time: '13:00', equity: 24489, pnl: 299 },
  { time: '14:00', equity: 24531, pnl: 341 },
  { time: '15:00', equity: 24503, pnl: 313 },
  { time: '16:00', equity: 24567, pnl: 377 },
  { time: '17:00', equity: 24612, pnl: 422 },
  { time: '18:00', equity: 24589, pnl: 399 },
  { time: '19:00', equity: 24657, pnl: 467 },
  { time: '20:00', equity: 24701, pnl: 511 },
  { time: '21:00', equity: 24745, pnl: 555 },
  { time: '22:00', equity: 24789, pnl: 599 },
  { time: '23:00', equity: 24831, pnl: 641 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface p-3 shadow-xl text-xs font-mono min-w-[140px]">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      <p className="text-foreground font-semibold">
        Equity:{' '}
        <span className="text-primary">${d.equity.toLocaleString()}</span>
      </p>
      <p className={d.pnl >= 0 ? 'text-positive' : 'text-negative'}>
        P&L: {d.pnl >= 0 ? '+' : ''}${d.pnl}
      </p>
    </div>
  );
};

export default function EquitySparklineInner() {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Intraday Equity Curve
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Jul 11, 2026 · Paper Trading Session
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Session P&L
            </p>
            <p className="text-sm font-bold text-positive font-tabular">
              +$641.50
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Return
            </p>
            <p className="text-sm font-bold text-positive font-tabular">
              +2.65%
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart
          data={EQUITY_DATA}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis
            domain={['dataMin - 50', 'dataMax + 50']}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={24190}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#equityGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: 'var(--primary)',
              stroke: 'var(--card)',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}