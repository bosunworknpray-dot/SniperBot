import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

const PHASES = [
  {
    id: 'phase-paper',
    phase: 'Phase 1',
    label: 'Paper Trading',
    duration: '14 days mandatory',
    progress: 21,
    status: 'active' as const,
    metrics: {
      trades: 47,
      winRate: '72.3%',
      profitFactor: '2.74',
      sharpe: '2.34',
    },
    note: 'Day 3 of 14 — on track for Go/No-Go decision Jul 23',
  },
  {
    id: 'phase-live-small',
    phase: 'Phase 2',
    label: 'Live Small (0.1% risk)',
    duration: '7 days',
    progress: 0,
    status: 'pending' as const,
    metrics: null,
    note: 'Requires: Win Rate > 60%, Profit Factor > 1.5, 100 trades',
  },
  {
    id: 'phase-full',
    phase: 'Phase 3',
    label: 'Full Implementation',
    duration: 'Ongoing',
    progress: 0,
    status: 'pending' as const,
    metrics: null,
    note: 'Standard risk parameters · 5-15 trades/day target',
  },
  {
    id: 'phase-optimize',
    phase: 'Phase 4',
    label: 'Optimization',
    duration: 'Monthly review',
    progress: 0,
    status: 'pending' as const,
    metrics: null,
    note: 'Walk-forward parameter recalibration every 30 days',
  },
];

const LAUNCH_CRITERIA = [
  { id: 'crit-trades', label: 'Min 100 trades executed', met: false, current: '47 / 100' },
  { id: 'crit-winrate', label: 'Win rate > 60%', met: true, current: '72.3%' },
  { id: 'crit-pf', label: 'Profit factor > 1.5', met: true, current: '2.74' },
  { id: 'crit-returns', label: 'Risk-adjusted returns positive', met: true, current: 'Sharpe 2.34' },
  { id: 'crit-uptime', label: 'No critical system failures', met: true, current: '100% uptime' },
];

export default function WalkForwardSummary() {
  const metCount = LAUNCH_CRITERIA.filter((c) => c.met).length;

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Go/No-Go Launch Criteria
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paper trading phase · {metCount}/{LAUNCH_CRITERIA.length} criteria met
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-warning transition-all duration-500"
              style={{ width: `${(metCount / LAUNCH_CRITERIA.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-warning font-tabular">
            {metCount}/{LAUNCH_CRITERIA.length}
          </span>
        </div>
      </div>

      {/* Criteria Checklist */}
      <div className="space-y-2 mb-5">
        {LAUNCH_CRITERIA.map((crit) => (
          <div
            key={crit.id}
            className={`
              flex items-center justify-between px-3 py-2.5 rounded-lg
              ${crit.met ? 'bg-positive-subtle border border-positive/15' : 'bg-warning-subtle border border-warning/15'}
            `}
          >
            <div className="flex items-center gap-2.5">
              {crit.met ? (
                <CheckCircle2 size={14} className="text-positive shrink-0" />
              ) : (
                <Clock size={14} className="text-warning shrink-0" />
              )}
              <span className="text-xs text-foreground">{crit.label}</span>
            </div>
            <span
              className={`text-xs font-semibold font-tabular ${
                crit.met ? 'text-positive' : 'text-warning'
              }`}
            >
              {crit.current}
            </span>
          </div>
        ))}
      </div>

      {/* Deployment Phases */}
      <div className="border-t border-border pt-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          Deployment Phases
        </p>
        <div className="space-y-3">
          {PHASES.map((phase, idx) => (
            <div key={phase.id} className="flex gap-3">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2
                    ${
                      phase.status === 'active' ?'border-primary bg-primary/20' :'border-border bg-muted'
                    }
                  `}
                >
                  {phase.status === 'active' ? (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  ) : (
                    <span className="text-[8px] font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                  )}
                </div>
                {idx < PHASES.length - 1 && (
                  <div
                    className={`w-px flex-1 mt-1 ${
                      phase.status === 'active' ? 'bg-primary/30' : 'bg-border'
                    }`}
                    style={{ minHeight: '20px' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        phase.status === 'active' ?'text-foreground' :'text-muted-foreground'
                      }`}
                    >
                      {phase.phase}: {phase.label}
                    </span>
                    {phase.status === 'active' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {phase.duration}
                  </span>
                </div>

                {phase.status === 'active' && phase.progress > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-primary font-tabular">
                      {phase.progress}%
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground mt-1">
                  {phase.note}
                </p>

                {phase.metrics && (
                  <div className="flex gap-3 mt-1.5">
                    {Object.entries(phase.metrics).map(([k, v]) => (
                      <div key={`metric-${phase.id}-${k}`} className="text-[10px]">
                        <span className="text-muted-foreground capitalize">{k}: </span>
                        <span className="text-positive font-semibold font-tabular">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}