import React from 'react';
import { Download } from 'lucide-react';

export default function AnalyticsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
          Performance Analytics
        </h1>
        <p className="text-xs text-muted-foreground font-mono">
          Paper trading session · Day 3 of 14 · Started Jul 9, 2026 · 
          <span className="text-primary ml-1">47 trades logged</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['30D', '90D', '180D'] as const).map((range) => (
            <button
              key={`range-${range}`}
              className={`
                px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150
                ${range === '30D' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['Paper', 'Live'] as const).map((mode) => (
            <button
              key={`mode-${mode}`}
              className={`
                px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150
                ${mode === 'Paper' ? 'bg-info-subtle text-info' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              {mode}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-95">
          <Download size={12} />
          Export CSV
        </button>
      </div>
    </div>
  );
}