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
} from 'recharts';

const DISTRIBUTION_DATA = [
  { bucket: '-4% to -3%', count: 1, type: 'loss' },
  { bucket: '-3% to -2%', count: 2, type: 'loss' },
  { bucket: '-2% to -1%', count: 4, type: 'loss' },
  { bucket: '-1% to 0%', count: 6, type: 'loss' },
  { bucket: '0% to 1%', count: 5, type: 'win' },
  { bucket: '1% to 2%', count: 12, type: 'win' },
  { bucket: '2% to 3%', count: 9, type: 'win' },
  { bucket: '3% to 4%', count: 6, type: 'win' },
  { bucket: '4% to 5%', count: 2, type: 'win' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface p-3 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className={d.type === 'win' ? 'text-positive font-semibold' : 'text-negative font-semibold'}>
        {d.count} trades
      </p>
    </div>
  );
};

export default function TradeDistributionChartInner() {
  return (
    <div className="card-surface p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          P&L Distribution
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Trade outcome by return bucket · 47 trades
        </p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={DISTRIBUTION_DATA}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="bucket"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 8 }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={48}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {DISTRIBUTION_DATA.map((entry, index) => (
              <Cell
                key={`dist-cell-${index}`}
                fill={entry.type === 'win' ? 'var(--positive)' : 'var(--negative)'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Win/Loss Summary */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-positive opacity-80" />
          <span className="text-xs text-muted-foreground">
            34 wins · avg +2.1%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-negative opacity-80" />
          <span className="text-xs text-muted-foreground">
            13 losses · avg -1.4%
          </span>
        </div>
      </div>
    </div>
  );
}