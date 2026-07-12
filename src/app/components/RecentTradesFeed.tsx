import React from 'react';
import { CheckCircle2, XCircle, Target, Clock } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';


interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  outcome: 'tp1_hit' | 'tp2_hit' | 'sl_hit' | 'expired';
  pnl: number;
  pnlPct: number;
  holdMins: number;
  confidence: number;
  closedAt: string;
}

const RECENT_TRADES: Trade[] = [
  {
    id: 'trade-xrp-011',
    symbol: 'XRPUSDT',
    direction: 'long',
    outcome: 'tp2_hit',
    pnl: 62.4,
    pnlPct: 2.8,
    holdMins: 47,
    confidence: 89,
    closedAt: '23:22:14',
  },
  {
    id: 'trade-btc-010',
    symbol: 'BTCUSDT',
    direction: 'long',
    outcome: 'tp1_hit',
    pnl: 38.1,
    pnlPct: 1.4,
    holdMins: 23,
    confidence: 85,
    closedAt: '22:58:41',
  },
  {
    id: 'trade-link-009',
    symbol: 'LINKUSDT',
    direction: 'short',
    outcome: 'sl_hit',
    pnl: -28.7,
    pnlPct: -1.1,
    holdMins: 38,
    confidence: 78,
    closedAt: '22:41:05',
  },
  {
    id: 'trade-avax-008',
    symbol: 'AVAXUSDT',
    direction: 'long',
    outcome: 'tp1_hit',
    pnl: 44.9,
    pnlPct: 1.9,
    holdMins: 31,
    confidence: 83,
    closedAt: '22:19:33',
  },
  {
    id: 'trade-matic-007',
    symbol: 'MATICUSDT',
    direction: 'long',
    outcome: 'tp2_hit',
    pnl: 71.2,
    pnlPct: 3.1,
    holdMins: 68,
    confidence: 91,
    closedAt: '21:54:18',
  },
  {
    id: 'trade-doge-006',
    symbol: 'DOGEUSDT',
    direction: 'short',
    outcome: 'sl_hit',
    pnl: -31.4,
    pnlPct: -1.2,
    holdMins: 19,
    confidence: 76,
    closedAt: '21:28:52',
  },
  {
    id: 'trade-eth-005',
    symbol: 'ETHUSDT',
    direction: 'long',
    outcome: 'tp1_hit',
    pnl: 29.6,
    pnlPct: 1.1,
    holdMins: 26,
    confidence: 82,
    closedAt: '21:03:27',
  },
];

const OUTCOME_ICON = {
  tp1_hit: CheckCircle2,
  tp2_hit: Target,
  sl_hit: XCircle,
  expired: Clock,
};

const OUTCOME_COLOR = {
  tp1_hit: 'text-positive',
  tp2_hit: 'text-positive',
  sl_hit: 'text-negative',
  expired: 'text-muted-foreground',
};

export default function RecentTradesFeed() {
  const wins = RECENT_TRADES.filter(
    (t) => t.outcome === 'tp1_hit' || t.outcome === 'tp2_hit'
  ).length;
  const totalPnl = RECENT_TRADES.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Recent Trades
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            {wins}/{RECENT_TRADES.length} wins
          </span>
          <span
            className={`font-semibold font-tabular ${
              totalPnl >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs" aria-label="Recent trades">
          <thead>
            <tr className="border-b border-border/50">
              {['Time', 'Symbol', 'Dir.', 'Outcome', 'P&L', 'Hold', 'Conf.'].map(
                (h, i) => (
                  <th
                    key={`th-recent-${i}`}
                    className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {RECENT_TRADES.map((trade) => {
              const Icon = OUTCOME_ICON[trade.outcome];
              const color = OUTCOME_COLOR[trade.outcome];
              return (
                <tr
                  key={trade.id}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors duration-100"
                >
                  <td className="px-4 py-2.5 font-mono text-muted-foreground font-tabular">
                    {trade.closedAt}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-foreground">
                    {trade.symbol}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge variant={trade.direction} size="sm" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className={`flex items-center gap-1.5 ${color}`}>
                      <Icon size={12} />
                      <StatusBadge variant={trade.outcome} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-semibold font-tabular ${
                        trade.pnl >= 0 ? 'text-positive' : 'text-negative'
                      }`}
                    >
                      {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl).toFixed(1)}
                    </span>
                    <span
                      className={`ml-1 text-[10px] font-tabular ${
                        trade.pnlPct >= 0 ? 'text-positive/70' : 'text-negative/70'
                      }`}
                    >
                      ({trade.pnlPct >= 0 ? '+' : ''}
                      {trade.pnlPct}%)
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground font-tabular">
                    {trade.holdMins}m
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-semibold font-tabular text-xs ${
                        trade.confidence >= 85
                          ? 'text-positive'
                          : trade.confidence >= 80
                          ? 'text-info' :'text-warning'
                      }`}
                    >
                      {trade.confidence}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}