import React from 'react';
import AppLayout from '@/components/AppLayout';
import AnalyticsHeader from './components/AnalyticsHeader';
import AnalyticsSummaryCards from './components/AnalyticsSummaryCards';
import EquityCurveChart from './components/EquityCurveChart';
import DrawdownChart from './components/DrawdownChart';
import TradeDistributionChart from './components/TradeDistributionChart';
import RegimeAnalysisChart from './components/RegimeAnalysisChart';
import MonthlyHeatmap from './components/MonthlyHeatmap';
import InstrumentPerformanceTable from './components/InstrumentPerformanceTable';
import WalkForwardSummary from './components/WalkForwardSummary';
import ConfidenceWinRateChart from './components/ConfidenceWinRateChart';

// Backend integration point: fetch historical trade data from
// Flask API at /api/performance?period=30d&mode=paper
// and stream real-time updates via WebSocket for live metrics

export default function PerformanceAnalyticsPage() {
  return (
    <AppLayout>
      <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
        {/* Page Header */}
        <AnalyticsHeader />

        {/* Summary KPI Cards */}
        <AnalyticsSummaryCards />

        {/* Row 1: Equity Curve + Drawdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2 2xl:col-span-2">
            <EquityCurveChart />
          </div>
          <div className="xl:col-span-1 2xl:col-span-1">
            <DrawdownChart />
          </div>
        </div>

        {/* Row 2: Monthly Heatmap + Trade Distribution + Regime Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-1 xl:col-span-1 2xl:col-span-1">
            <MonthlyHeatmap />
          </div>
          <div className="md:col-span-1 xl:col-span-1 2xl:col-span-1">
            <TradeDistributionChart />
          </div>
          <div className="md:col-span-2 xl:col-span-1 2xl:col-span-1">
            <RegimeAnalysisChart />
          </div>
        </div>

        {/* Row 3: Confidence vs Win Rate + Walk Forward */}
        <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2 2xl:col-span-2">
            <ConfidenceWinRateChart />
          </div>
          <div className="xl:col-span-1 2xl:col-span-1">
            <WalkForwardSummary />
          </div>
        </div>

        {/* Row 4: Instrument Performance Table — full width */}
        <InstrumentPerformanceTable />
      </div>
    </AppLayout>
  );
}