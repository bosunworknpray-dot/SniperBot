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
  Cell,
  ReferenceLine,
} from 'recharts';

const CONFIDENCE_DATA = [
  { bucket: '70–74%', winRate: 54, trades: 4, avgRR: 2.1 },
  { bucket: '75–79%', winRate: 62, trades: 7, avgRR: 2.3 },
  { bucket: '80–84%', winRate: 71, trades: 14, avgRR: 2.6 },
  { bucket: '85–89%', winRate: 81, trades: 16, avgRR: 2.9 },
  { bucket: '90–94%', winRate: 88, trades: 5, avgRR: 3.2 },
  { bucket: '95%+', winRate: 100, trades: 1, avgRR: 3.8 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface p-3 shadow-xl text-xs min-w-[150px]">
      <p className="text-foreground font-semibold mb-2">
        Confidence {label}
      </p>
      <p className={d.winRate >= 70 ? 'text-positive' : d.winRate >= 60 ? 'text-warning' : 'text-negative'}>
        Win Rate: {d.winRate}%
      </p>
      <p className="text-muted-foreground">Trades: {d.trades}</p>
      <p className="text-info">Avg R:R 1:{d.avgRR}</p>
    </div>
  );
};

export default function ConfidenceWinRateChartInner() {
  return (
    <div className="card-surface p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          AI Confidence vs Win Rate
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          XGBoost score bucket analysis — validates model accuracy
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={CONFIDENCE_DATA}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="bucket"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={70}
            stroke="var(--warning)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{ value: '70% target', fill: 'var(--warning)', fontSize: 9, position: 'right' }}
          />
          <Bar dataKey="winRate" radius={[3, 3, 0, 0]}>
            {CONFIDENCE_DATA.map((entry, index) => (
              <Cell
                key={`conf-cell-${index}`}
                fill={
                  entry.winRate >= 80
                    ? 'var(--positive)'
                    : entry.winRate >= 65
                    ? 'var(--accent)'
                    : 'var(--negative)'
                }
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          <span className="text-primary font-semibold">Insight:</span> Signals above 85% confidence deliver 81%+ win rate — validates the 80–85% threshold setting
        </p>
      </div>
    </div>
  );
}