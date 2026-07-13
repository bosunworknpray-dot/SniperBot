import React from 'react';

interface HeatmapCell {
  day: number;
  pnlPct: number | null;
  trades: number;
}

// July 2026 — partial month (Jul 1-11 with trading only on Jul 9-11)
const HEATMAP_DATA: HeatmapCell[] = [
  { day: 1, pnlPct: null, trades: 0 },
  { day: 2, pnlPct: null, trades: 0 },
  { day: 3, pnlPct: null, trades: 0 },
  { day: 4, pnlPct: null, trades: 0 },
  { day: 5, pnlPct: null, trades: 0 },
  { day: 6, pnlPct: null, trades: 0 },
  { day: 7, pnlPct: null, trades: 0 },
  { day: 8, pnlPct: null, trades: 0 },
  { day: 9, pnlPct: 1.27, trades: 18 },
  { day: 10, pnlPct: -0.87, trades: 16 },
  { day: 11, pnlPct: 2.65, trades: 13 },
  ...Array.from({ length: 19 }, (_, i) => ({
    day: i + 12,
    pnlPct: null,
    trades: 0,
  })),
];

function getHeatmapClass(pnlPct: number | null): string {
  if (pnlPct === null) return 'bg-muted/30 text-muted-foreground/30';
  if (pnlPct >= 3) return 'heatmap-cell-positive-5';
  if (pnlPct >= 2) return 'heatmap-cell-positive-4';
  if (pnlPct >= 1) return 'heatmap-cell-positive-3';
  if (pnlPct >= 0.5) return 'heatmap-cell-positive-2';
  if (pnlPct > 0) return 'heatmap-cell-positive-1';
  if (pnlPct === 0) return 'heatmap-cell-zero';
  if (pnlPct >= -0.5) return 'heatmap-cell-negative-1';
  if (pnlPct >= -1) return 'heatmap-cell-negative-2';
  if (pnlPct >= -2) return 'heatmap-cell-negative-3';
  if (pnlPct >= -3) return 'heatmap-cell-negative-4';
  return 'heatmap-cell-negative-5';
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// July 1, 2026 is a Wednesday (index 3)
const START_DOW = 3;

export default function MonthlyHeatmap() {
  const totalPnl = HEATMAP_DATA.reduce(
    (sum, d) => sum + (d.pnlPct ?? 0),
    0
  );
  const tradingDays = HEATMAP_DATA.filter((d) => d.pnlPct !== null).length;
  const winDays = HEATMAP_DATA.filter(
    (d) => d.pnlPct !== null && d.pnlPct > 0
  ).length;

  // Build calendar grid with leading empty cells
  const cells: (HeatmapCell | null)[] = [
    ...Array.from({ length: START_DOW }, () => null),
    ...HEATMAP_DATA,
  ];

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Monthly P&L Heatmap
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            July 2026 · Paper session in progress
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Month P&L</p>
            <p className={`font-bold font-tabular ${totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Win Days</p>
            <p className="font-bold font-tabular text-foreground">
              {winDays}/{tradingDays}
            </p>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={`dow-${d}`}
            className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return (
              <div
                key={`empty-cell-${i}`}
                className="aspect-square rounded-md"
              />
            );
          }
          const cls = getHeatmapClass(cell.pnlPct);
          return (
            <div
              key={`heatmap-day-${cell.day}`}
              className={`
                aspect-square rounded-md flex flex-col items-center justify-center
                cursor-default transition-transform duration-100 hover:scale-105
                ${cls}
              `}
              title={
                cell.pnlPct !== null
                  ? `Jul ${cell.day}: ${cell.pnlPct >= 0 ? '+' : ''}${cell.pnlPct}% · ${cell.trades} trades`
                  : `Jul ${cell.day}: No trading`
              }
            >
              <span className="text-[10px] font-semibold leading-none">
                {cell.day}
              </span>
              {cell.pnlPct !== null && (
                <span className="text-[8px] font-mono leading-none mt-0.5 opacity-90">
                  {cell.pnlPct >= 0 ? '+' : ''}
                  {cell.pnlPct.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-[10px] text-muted-foreground">Loss</span>
        <div className="flex gap-1">
          {[
            'heatmap-cell-negative-4',
            'heatmap-cell-negative-2',
            'heatmap-cell-zero',
            'heatmap-cell-positive-2',
            'heatmap-cell-positive-4',
          ].map((cls, i) => (
            <div
              key={`legend-swatch-${i}`}
              className={`w-5 h-3 rounded-sm ${cls}`}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">Gain</span>
      </div>
    </div>
  );
}