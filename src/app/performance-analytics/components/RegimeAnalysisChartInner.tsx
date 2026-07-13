'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

const REGIME_DATA = [
  {
    regime: 'Trending',
    winRate: 81,
    profitFactor: 3.2,
    trades: 24,
  },
  {
    regime: 'Ranging',
    winRate: 63,
    profitFactor: 1.9,
    trades: 16,
  },
  {
    regime: 'Volatile',
    winRate: 57,
    profitFactor: 1.4,
    trades: 7,
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface p-3 shadow-xl text-xs min-w-[140px]">
      <p className="text-foreground font-semibold mb-2">{label} Market</p>
      {payload.map((p: any) => (
        <p key={`reg-tt-${p.name}`} style={{ color: p.color }}>
          {p.name}: {p.value}{p.name === 'Win Rate' ? '%' : ''}
        </p>
      ))}
      <p className="text-muted-foreground mt-1 text-[10px]">
        {REGIME_DATA.find((d) => d.regime === label)?.trades} trades
      </p>
    </div>
  );
};

export default function RegimeAnalysisChartInner() {
  return (
    <div className="card-surface p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Performance by Market Regime
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Win rate and profit factor across detected regimes
        </p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={REGIME_DATA}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="regime"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '10px', color: 'var(--muted-foreground)' }}
          />
          <Bar
            dataKey="winRate"
            name="Win Rate"
            fill="var(--primary)"
            fillOpacity={0.8}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="profitFactor"
            name="Profit Factor"
            fill="var(--accent)"
            fillOpacity={0.7}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Regime insights */}
      <div className="mt-3 pt-3 border-t border-border space-y-1.5">
        {REGIME_DATA.map((r) => (
          <div key={`regime-insight-${r.regime}`} className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{r.regime}</span>
            <div className="flex items-center gap-3">
              <span className={r.winRate >= 70 ? 'text-positive font-semibold' : r.winRate >= 60 ? 'text-warning font-semibold' : 'text-negative font-semibold'}>
                {r.winRate}% WR
              </span>
              <span className="text-muted-foreground">{r.trades} trades</span>
              <span className={r.profitFactor >= 2 ? 'text-positive' : r.profitFactor >= 1.5 ? 'text-warning' : 'text-negative'}>
                PF {r.profitFactor}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}