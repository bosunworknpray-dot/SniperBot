import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from './components/DashboardHeader';
import LiveMetricCards from './components/LiveMetricCards';
import EquitySparkline from './components/EquitySparkline';
import OpenPositionsTable from './components/OpenPositionsTable';
import SignalFeed from './components/SignalFeed';
import BotControlPanel from './components/BotControlPanel';
import RecentTradesFeed from './components/RecentTradesFeed';

// Backend integration point: replace static mock data with WebSocket
// connection to Flask backend at ws://localhost:5000/live-feed
// and REST calls to /api/positions, /api/signals, /api/account

export default function LiveTradingDashboardPage() {
  return (
    <AppLayout>
      <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
        {/* Page Header */}
        <DashboardHeader />

        {/* KPI Bento Grid */}
        <div className="mb-6">
          <LiveMetricCards />
        </div>

        {/* Equity Curve */}
        <div className="mb-6">
          <EquitySparkline />
        </div>

        {/* Middle Row: Open Positions + Signal Feed + Bot Control */}
        <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mb-6">
          {/* Open Positions — spans 2 cols */}
          <div className="xl:col-span-2 2xl:col-span-2">
            <OpenPositionsTable />
          </div>

          {/* Bot Control Panel */}
          <div className="xl:col-span-1 2xl:col-span-1">
            <BotControlPanel />
          </div>
        </div>

        {/* Bottom Row: Signal Feed + Recent Trades */}
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-5 gap-6">
          {/* Signal Feed */}
          <div className="xl:col-span-1 2xl:col-span-2" style={{ minHeight: '480px' }}>
            <SignalFeed />
          </div>

          {/* Recent Trades */}
          <div className="xl:col-span-1 2xl:col-span-3">
            <RecentTradesFeed />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}