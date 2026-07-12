import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface MetricCardProps {
  id: string;
  title: string;
  value: string;
  subValue?: string;
  change?: string;
  changePositive?: boolean;
  icon: React.ElementType;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
  span?: 1 | 2;
  mono?: boolean;
}

function MetricCard({
  title,
  value,
  subValue,
  change,
  changePositive,
  icon: Icon,
  variant = 'default',
  span = 1,
  mono = false,
}: MetricCardProps) {
  const variantBorder =
    variant === 'positive' ?'border-positive/30 glow-primary'
      : variant === 'negative' ?'border-negative/30 glow-negative'
      : variant === 'warning' ?'border-warning/30 glow-warning' :'border-border';

  const iconBg =
    variant === 'positive' ?'bg-positive-subtle text-positive'
      : variant === 'negative' ?'bg-negative-subtle text-negative'
      : variant === 'warning' ?'bg-warning-subtle text-warning' :'bg-muted text-muted-foreground';

  const valueColor =
    variant === 'positive' ?'text-positive'
      : variant === 'negative' ?'text-negative'
      : variant === 'warning' ?'text-warning' :'text-foreground';

  return (
    <div
      className={`
        card-surface p-5 flex flex-col gap-3
        ${variantBorder}
        ${span === 2 ? 'col-span-2' : ''}
        hover:border-primary/20 transition-colors duration-200
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={15} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p
            className={`text-2xl font-bold font-tabular leading-none ${valueColor} ${
              mono ? 'font-mono' : ''
            }`}
          >
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1 font-tabular">
              {subValue}
            </p>
          )}
        </div>

        {change && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold font-tabular px-2 py-1 rounded-full ${
              changePositive
                ? 'bg-positive-subtle text-positive' :'bg-negative-subtle text-negative'
            }`}
          >
            {changePositive ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {change}
          </div>
        )}
      </div>
    </div>
  );
}

const METRIC_DATA: MetricCardProps[] = [
  {
    id: 'metric-equity',
    title: 'Account Equity',
    value: '$24,831.50',
    subValue: 'Balance: $24,190.00 · Unrealized: +$641.50',
    change: '+2.65%',
    changePositive: true,
    icon: DollarSign,
    variant: 'positive',
    span: 2,
    mono: true,
  },
  {
    id: 'metric-pnl',
    title: "Today's P&L",
    value: '+$487.20',
    subValue: '+2.01% vs open balance',
    change: '+2.01%',
    changePositive: true,
    icon: TrendingUp,
    variant: 'positive',
    mono: true,
  },
  {
    id: 'metric-winrate',
    title: 'Win Rate (Today)',
    value: '73.3%',
    subValue: '11 wins · 4 losses · 15 trades',
    change: '+3.3%',
    changePositive: true,
    icon: Percent,
    variant: 'positive',
  },
  {
    id: 'metric-heat',
    title: 'Portfolio Heat',
    value: '4.2%',
    subValue: '3 open positions · Max 5%',
    change: '84% of limit',
    changePositive: false,
    icon: ShieldAlert,
    variant: 'warning',
  },
  {
    id: 'metric-sharpe',
    title: 'Sharpe Ratio (30d)',
    value: '2.34',
    subValue: 'Target > 2.0 · Sortino: 3.12',
    change: '+0.18',
    changePositive: true,
    icon: Activity,
    variant: 'positive',
  },
  {
    id: 'metric-drawdown',
    title: 'Daily Loss Used',
    value: '1.2%',
    subValue: 'Limit: 5.0% · Remaining: 3.8%',
    change: '24% used',
    changePositive: true,
    icon: TrendingDown,
    variant: 'default',
  },
];

export default function LiveMetricCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {METRIC_DATA.map((m) => (
        <MetricCard key={m.id} {...m} />
      ))}
    </div>
  );
}