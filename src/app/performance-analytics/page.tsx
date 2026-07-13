'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  BarChart3, Clock, Calendar, RefreshCw, Download,
  Filter, ChevronDown, Maximize2
} from 'lucide-react';

// ============== TYPES ==============
interface PerformanceMetrics {
  totalReturn: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgTradeDuration: string;
  totalPnl: number;
}

interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
}

interface TradeData {
  date: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry: number;
  exit: number;
  pnl: number;
  pnlPercent: number;
  duration: string;
  regime: string;
  confidence: number;
}

interface MonthlyData {
  month: string;
  pnl: number;
  trades: number;
}

// ============== MOCK DATA ==============
const MOCK_METRICS: PerformanceMetrics = {
  totalReturn: 42.8,
  winRate: 68.5,
  profitFactor: 2.34,
  sharpeRatio: 1.87,
  maxDrawdown: -12.4,
  totalTrades: 247,
  winningTrades: 169,
  losingTrades: 78,
  avgWin: 2.84,
  avgLoss: -1.23,
  bestTrade: 18.7,
  worstTrade: -8.9,
  avgTradeDuration: '4h 23m',
  totalPnl: 42850.75,
};

const MOCK_EQUITY_DATA: EquityPoint[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (90 - i));
  const baseEquity = 100000;
  const growth = Math.sin(i / 15) * 15000 + (i / 90) * 40000;
  const noise = (Math.random() - 0.5) * 3000;
  return {
    date: date.toISOString().split('T')[0],
    equity: baseEquity + growth + noise,
    pnl: (growth + noise) / baseEquity * 100,
  };
});

const MOCK_TRADES: TradeData[] = Array.from({ length: 50 }, (_, i) => {
  const date = new Date();
  date.setHours(date.getHours() - i * 3);
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT'];
  const regimes = ['Trending', 'Ranging', 'Volatile', 'Breakout'];
  const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
  const pnl = (Math.random() - 0.3) * 10;
  return {
    date: date.toISOString(),
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    side,
    entry: 100 + Math.random() * 900,
    exit: 100 + Math.random() * 900,
    pnl,
    pnlPercent: pnl,
    duration: `${Math.floor(Math.random() * 12 + 1)}h ${Math.floor(Math.random() * 60)}m`,
    regime: regimes[Math.floor(Math.random() * regimes.length)],
    confidence: 65 + Math.random() * 30,
  };
});

const MOCK_MONTHLY_DATA: MonthlyData[] = [
  { month: 'Jan', pnl: 4.2, trades: 28 },
  { month: 'Feb', pnl: 6.8, trades: 32 },
  { month: 'Mar', pnl: -2.1, trades: 25 },
  { month: 'Apr', pnl: 8.4, trades: 35 },
  { month: 'May', pnl: 5.6, trades: 30 },
  { month: 'Jun', pnl: 3.9, trades: 27 },
  { month: 'Jul', pnl: 9.2, trades: 40 },
  { month: 'Aug', pnl: -1.8, trades: 22 },
  { month: 'Sep', pnl: 7.1, trades: 33 },
  { month: 'Oct', pnl: 4.5, trades: 29 },
  { month: 'Nov', pnl: 2.3, trades: 24 },
  { month: 'Dec', pnl: 6.7, trades: 31 },
];

// ============== COMPONENTS ==============

// Analytics Header
const AnalyticsHeader = () => {
  const [period, setPeriod] = useState('30d');
  const [mode, setMode] = useState('paper');

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />
          Performance Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Real-time performance metrics and trade analysis
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {['7d', '30d', '90d', '1y'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {['paper', 'live'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                mode === m
                  ? m === 'live' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <RefreshCw size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Download size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Summary Cards
const AnalyticsSummaryCards = () => {
  const metrics = MOCK_METRICS;
  
  const cards = [
    { 
      label: 'Total P&L', 
      value: `$${metrics.totalPnl.toLocaleString()}`, 
      change: metrics.totalReturn,
      icon: DollarSign,
      color: metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600',
    },
    { 
      label: 'Win Rate', 
      value: `${metrics.winRate}%`, 
      change: `${metrics.winningTrades}/${metrics.totalTrades}`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    { 
      label: 'Profit Factor', 
      value: metrics.profitFactor.toFixed(2), 
      change: `Avg Win $${metrics.avgWin.toFixed(2)}`,
      icon: Activity,
      color: 'text-purple-600',
    },
    { 
      label: 'Sharpe Ratio', 
      value: metrics.sharpeRatio.toFixed(2), 
      change: `Max DD ${metrics.maxDrawdown}%`,
      icon: TrendingDown,
      color: metrics.sharpeRatio >= 1.5 ? 'text-green-600' : 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
            <card.icon size={16} className={card.color} />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</span>
          </div>
          <div className="mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{card.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Equity Curve Chart (simplified visualization)
const EquityCurveChart = () => {
  const data = MOCK_EQUITY_DATA;
  const maxEquity = Math.max(...data.map(d => d.equity));
  const minEquity = Math.min(...data.map(d => d.equity));
  const range = maxEquity - minEquity;

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Equity Curve</h3>
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">+42.8%</span>
      </div>
      <div className="h-48 relative">
        <div className="absolute inset-0 flex items-end">
          {data.map((point, i) => {
            const height = ((point.equity - minEquity) / range) * 100;
            const isPositive = point.pnl >= 0;
            return (
              <div
                key={i}
                className={`flex-1 mx-0.5 transition-all duration-300 ${
                  isPositive ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {data[0]?.date}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ${minEquity.toLocaleString()} - ${maxEquity.toLocaleString()}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {data[data.length - 1]?.date}
        </span>
      </div>
    </div>
  );
};

// Drawdown Chart
const DrawdownChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Drawdown</h3>
        <span className="text-xs text-red-600 dark:text-red-400 font-medium">-12.4%</span>
      </div>
      <div className="h-48 relative">
        <div className="absolute inset-0 flex items-end">
          {Array.from({ length: 90 }, (_, i) => {
            const drawdown = -Math.abs(Math.sin(i / 20) * 12 + (Math.random() - 0.5) * 2);
            const height = Math.abs(drawdown) * 4;
            return (
              <div
                key={i}
                className="flex-1 mx-0.5 bg-red-500/80 rounded-t"
                style={{ height: `${Math.min(height, 100)}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Current: -3.2%</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Max: -12.4%</span>
      </div>
    </div>
  );
};

// Monthly Heatmap
const MonthlyHeatmap = () => {
  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Monthly Performance</h3>
      <div className="grid grid-cols-4 gap-1">
        {MOCK_MONTHLY_DATA.map((month) => {
          const intensity = Math.abs(month.pnl) / 10;
          const color = month.pnl >= 0 
            ? `rgba(34, 197, 94, ${intensity})`
            : `rgba(239, 68, 68, ${intensity})`;
          return (
            <div
              key={month.month}
              className="p-2 rounded text-center"
              style={{ backgroundColor: color }}
            >
              <div className="text-xs font-semibold text-white">{month.month}</div>
              <div className="text-xs text-white/80">{month.pnl >= 0 ? '+' : ''}{month.pnl}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Trade Distribution
const TradeDistributionChart = () => {
  const wins = MOCK_METRICS.winningTrades;
  const losses = MOCK_METRICS.losingTrades;
  const total = wins + losses;

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Trade Distribution</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-600 dark:text-green-400">Wins ({wins})</span>
            <span className="text-gray-500 dark:text-gray-400">{Math.round(wins/total * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${wins/total * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-600 dark:text-red-400">Losses ({losses})</span>
            <span className="text-gray-500 dark:text-gray-400">{Math.round(losses/total * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${losses/total * 100}%` }} />
          </div>
        </div>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Avg Win</span>
            <span className="text-green-600 dark:text-green-400 font-medium">+${MOCK_METRICS.avgWin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Avg Loss</span>
            <span className="text-red-600 dark:text-red-400 font-medium">-${Math.abs(MOCK_METRICS.avgLoss).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Regime Analysis
const RegimeAnalysisChart = () => {
  const regimes = ['Trending', 'Ranging', 'Volatile', 'Breakout'];
  const data = regimes.map(r => ({
    regime: r,
    winRate: 60 + Math.random() * 30,
    trades: 20 + Math.floor(Math.random() * 40),
  }));

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Regime Analysis</h3>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.regime}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-300">{item.regime}</span>
              <span className="text-gray-500 dark:text-gray-400">{item.winRate.toFixed(0)}% ({item.trades} trades)</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${item.winRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Confidence vs Win Rate
const ConfidenceWinRateChart = () => {
  const data = Array.from({ length: 30 }, (_, i) => ({
    confidence: 60 + Math.random() * 35,
    winRate: 50 + Math.random() * 45,
    trades: 5 + Math.floor(Math.random() * 20),
  }));

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Confidence vs Win Rate</h3>
      <div className="h-40 relative">
        <div className="absolute inset-0">
          {data.map((point, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500 rounded-full"
              style={{
                left: `${((point.confidence - 60) / 35) * 100}%`,
                bottom: `${((point.winRate - 50) / 45) * 100}%`,
                opacity: point.trades / 20,
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Confidence</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Win Rate →</span>
      </div>
    </div>
  );
};

// Walk Forward Summary
const WalkForwardSummary = () => {
  const tests = ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'];
  const results = tests.map(() => ({
    inSample: 65 + Math.random() * 25,
    outSample: 55 + Math.random() * 30,
  }));

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Walk-Forward Analysis</h3>
      <div className="space-y-2">
        {tests.map((test, i) => (
          <div key={test}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">{test}</span>
              <div className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">{results[i].inSample.toFixed(0)}%</span>
                <span className="text-gray-400">|</span>
                <span className="text-green-600 dark:text-green-400">{results[i].outSample.toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 h-1 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${results[i].inSample}%` }} />
              </div>
              <div className="flex-1 h-1 bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${results[i].outSample}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">In-Sample</span>
        <span className="text-gray-500 dark:text-gray-400">Out-of-Sample</span>
      </div>
    </div>
  );
};

// Instrument Performance Table
const InstrumentPerformanceTable = () => {
  const instruments = [
    { symbol: 'BTCUSDT', trades: 45, winRate: 72.3, pnl: 18450.50, sharpe: 2.1, avgTrade: 410.01 },
    { symbol: 'ETHUSDT', trades: 38, winRate: 65.8, pnl: 12340.75, sharpe: 1.8, avgTrade: 324.76 },
    { symbol: 'SOLUSDT', trades: 32, winRate: 68.9, pnl: 8750.20, sharpe: 1.9, avgTrade: 273.44 },
    { symbol: 'BNBUSDT', trades: 28, winRate: 71.4, pnl: 6520.30, sharpe: 1.7, avgTrade: 232.87 },
    { symbol: 'ADAUSDT', trades: 22, winRate: 63.6, pnl: 4210.85, sharpe: 1.5, avgTrade: 191.40 },
    { symbol: 'XRPUSDT', trades: 18, winRate: 66.7, pnl: 3580.15, sharpe: 1.6, avgTrade: 198.90 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Instrument Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Symbol</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Trades</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Win Rate</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">P&L</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Sharpe</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Avg Trade</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((inst) => (
              <tr key={inst.symbol} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">{inst.symbol}</td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-300">{inst.trades}</td>
                <td className="py-2 px-2 text-right">
                  <span className={inst.winRate >= 65 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                    {inst.winRate}%
                  </span>
                </td>
                <td className={`py-2 px-2 text-right font-medium ${inst.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${inst.pnl.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-300">{inst.sharpe.toFixed(1)}</td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-300">
                  ${inst.avgTrade.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== MAIN PAGE ==============
export default function PerformanceAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setMetrics(MOCK_METRICS);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <AnalyticsHeader />
        <AnalyticsSummaryCards />

        {/* Row 1: Equity Curve + Drawdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EquityCurveChart />
          </div>
          <div>
            <DrawdownChart />
          </div>
        </div>

        {/* Row 2: Monthly Heatmap + Trade Distribution + Regime Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MonthlyHeatmap />
          <TradeDistributionChart />
          <RegimeAnalysisChart />
        </div>

        {/* Row 3: Confidence vs Win Rate + Walk Forward */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ConfidenceWinRateChart />
          </div>
          <div>
            <WalkForwardSummary />
          </div>
        </div>

        {/* Row 4: Instrument Performance Table */}
        <InstrumentPerformanceTable />
      </div>
    </AppLayout>
  );
}