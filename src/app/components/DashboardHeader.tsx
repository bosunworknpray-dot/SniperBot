import React from 'react';
import { RefreshCw, Bell, Wifi } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Live Trading Dashboard
          </h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-info-subtle text-info border border-info/20 font-mono">
            PAPER
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Wifi size={11} className="text-positive" />
            <span>Bybit WS · 12ms latency</span>
          </div>
          <span>·</span>
          <span className="font-mono">Last updated: 23:59:18</span>
          <span>·</span>
          <span>Jul 11, 2026</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-95"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
        <button
          className="relative p-2 rounded-md text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-95"
          aria-label="View alerts — 3 unread"
        >
          <Bell size={14} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning border border-background" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-positive-subtle border border-positive/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-positive" />
          </span>
          <span className="text-positive text-xs font-semibold">
            Bot Active
          </span>
        </div>
      </div>
    </div>
  );
}