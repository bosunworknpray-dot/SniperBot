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

const DRAWDOWN_DATA = [
  { time: 'Jul 9 00:00', dd: 0 },
  { time: 'Jul 9 04:00', dd: -0.08 },
  { time: 'Jul 9 08:00', dd: 0 },
  { time: 'Jul 9 12:00', dd: -0.19 },
  { time: 'Jul 9 16:00', dd: -0.11 },
  { time: 'Jul 9 20:00', dd: 0 },
  { time: 'Jul 10 00:00', dd: 0 },
  { time: 'Jul 10 04:00', dd: -0.46 },
  { time: 'Jul 10 08:00', dd: -0.91 },
  { time: 'Jul 10 12:00', dd: -1.41 },
  { time: 'Jul 10 14:00', dd: -2.30 },
  { time: 'Jul 10 16:00', dd: -3.80 },
  { time: 'Jul 10 18:00', dd: -2.91 },
  { time: 'Jul 10 20:00', dd: -1.87 },
  { time: 'Jul 10 22:00', dd: -0.87 },
  { time: 'Jul 11 00:00', dd: -0.47 },
  { time: 'Jul 11 04:00', dd: 0 },
  { time: 'Jul 11 08:00', dd: 0 },
  { time: 'Jul 11 12:00', dd: -0.12 },
  { time: 'Jul 11 16:00', dd: 0 },
  { time: 'Jul 11 20:00', dd: 0 },
  { time: 'Jul 11 23:59', dd: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface p-3 shadow-xl text-xs font-mono">
      <p className="text-muted-foreground mb-1 font-sans text-[10px]">{label}</p>
      <p className={d.dd < -1 ? 'text-negative font-semibold' : d.dd < 0 ? 'text-warning' : 'text-positive'}>
        Drawdown: {d.dd.toFixed(2)}%
      </p>
      {d.dd === -3.8 && (
        <p className="text-negative text-[10px] mt-1">⚠ Max Drawdown</p>
      )}
    </div>
  );
};

export default function DrawdownChartInner() {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Drawdown Tracking
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Peak-to-trough decline · Max drawdown limit: 15%
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Max DD</p>
            <p className="font-bold text-negative font-tabular">-3.80%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Recovery</p>
            <p className="font-bold text-positive font-tabular">8.4h</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Limit Used</p>
            <p className="font-bold text-warning font-tabular">25.3%</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={DRAWDOWN_DATA}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="drawdownAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
            dataKey="time"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
            domain={[-5, 0.5]}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={-15}
            stroke="var(--negative)"
            strokeDasharray="6 3"
            strokeOpacity={0.5}
            label={{ value: 'Limit -15%', fill: 'var(--negative)', fontSize: 9, position: 'right' }}
          />
          <ReferenceLine
            y={-5}
            stroke="var(--warning)"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{ value: 'Alert -5%', fill: 'var(--warning)', fontSize: 9, position: 'right' }}
          />
          <Area
            type="monotone"
            dataKey="dd"
            stroke="var(--negative)"
            strokeWidth={1.5}
            fill="url(#drawdownAreaGrad)"
            dot={false}
            activeDot={{
              r: 3,
              fill: 'var(--negative)',
              stroke: 'var(--card)',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}