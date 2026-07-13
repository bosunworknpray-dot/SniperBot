'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Bell, Check, X, Filter, Trash2, Settings, RefreshCw } from 'lucide-react';

interface Alert {
  id: string;
  type: 'signal' | 'trade' | 'risk' | 'system';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  time: string;
  read: boolean;
  timestamp: number;
}

// Sample initial alerts with timestamps
const MOCK_ALERTS: Alert[] = [
  { 
    id: 'A001', 
    type: 'signal', 
    priority: 'high', 
    title: '🔥 High-Confidence Setup: BTCUSDT', 
    message: 'LONG signal at $43,250 | Confidence: 91% | Entry: $43,250 | SL: $42,800 | TP1: $44,100 | TP2: $45,200', 
    time: '2 min ago', 
    read: false,
    timestamp: Date.now() - 120000
  },
  { 
    id: 'A002', 
    type: 'trade', 
    priority: 'high', 
    title: '✅ Trade Executed: ETHUSDT SHORT', 
    message: 'Order filled at $2,580.50 | Slippage: 0.02% | Risk: $45.20 | Current exposure: 2.1%', 
    time: '8 min ago', 
    read: false,
    timestamp: Date.now() - 480000
  },
  { 
    id: 'A003', 
    type: 'risk', 
    priority: 'high', 
    title: '⚠️ Daily Loss Limit Warning', 
    message: 'Current daily loss: -3.8% of $5.0% limit. 2 more losing trades may trigger auto-shutdown.', 
    time: '15 min ago', 
    read: false,
    timestamp: Date.now() - 900000
  },
  { 
    id: 'A004', 
    type: 'trade', 
    priority: 'medium', 
    title: '🎯 Take Profit Hit: SOLUSDT', 
    message: 'TP1 reached at $102.40 | 50% position closed | P&L: +$87.50 (+2.24%) | Trailing stop activated', 
    time: '32 min ago', 
    read: true,
    timestamp: Date.now() - 1920000
  },
  { 
    id: 'A005', 
    type: 'trade', 
    priority: 'medium', 
    title: '🛑 Stop Loss Hit: XRPUSDT', 
    message: 'SL triggered at $0.641 | Loss: -$32.00 (-2.56%) | Trade duration: 40 min | Regime: Ranging', 
    time: '1h ago', 
    read: true,
    timestamp: Date.now() - 3600000
  },
  { 
    id: 'A006', 
    type: 'signal', 
    priority: 'medium', 
    title: '📊 Signal Rejected: BNBUSDT', 
    message: 'Confidence 74% below threshold (80%). Volume spike insufficient (1.2x vs 1.5x required).', 
    time: '1h 15m ago', 
    read: true,
    timestamp: Date.now() - 4500000
  },
  { 
    id: 'A007', 
    type: 'system', 
    priority: 'low', 
    title: '🔄 Model Retrain Scheduled', 
    message: 'Weekly XGBoost retrain queued for Sunday 02:00 UTC. Last retrain accuracy: 83.2%', 
    time: '2h ago', 
    read: true,
    timestamp: Date.now() - 7200000
  },
  { 
    id: 'A008', 
    type: 'trade', 
    priority: 'medium', 
    title: '📊 Daily Performance Summary', 
    message: 'Trades: 8 | Win Rate: 62.5% | P&L: +$142.30 (+1.42%) | Largest Win: +$105 | Largest Loss: -$43.50', 
    time: '3h ago', 
    read: true,
    timestamp: Date.now() - 10800000
  },
  { 
    id: 'A009', 
    type: 'system', 
    priority: 'low', 
    title: '🔌 WebSocket Reconnected', 
    message: 'BTCUSDT stream reconnected after 2.3s interruption. No missed signals detected.', 
    time: '4h ago', 
    read: true,
    timestamp: Date.now() - 14400000
  },
  { 
    id: 'A010', 
    type: 'risk', 
    priority: 'medium', 
    title: '⚠️ Correlation Warning', 
    message: 'ETHUSDT and BTCUSDT positions are 87% correlated. Max correlated trades limit (2) reached.', 
    time: '5h ago', 
    read: true,
    timestamp: Date.now() - 18000000
  },
];

const ALERT_COLORS = {
  signal: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  trade: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  risk: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  system: { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
};

const PRIORITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-400',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'signal' | 'trade' | 'risk' | 'system'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    highConfidenceSignals: true,
    tradeExecutions: true,
    stopLossHits: true,
    takeProfitHits: true,
    riskLimitWarnings: true,
    dailySummary: true,
    systemEvents: false,
    modelRetrains: false,
  });

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new alert every 30-60 seconds
      if (Math.random() > 0.7) {
        const newAlert: Alert = {
          id: `A${String(alerts.length + 1).padStart(3, '0')}`,
          type: ['signal', 'trade', 'risk', 'system'][Math.floor(Math.random() * 4)] as any,
          priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
          title: '🆕 New Alert',
          message: `New ${['signal', 'trade', 'risk', 'system'][Math.floor(Math.random() * 4)]} alert generated`,
          time: 'Just now',
          read: false,
          timestamp: Date.now(),
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [alerts.length]);

  const markAllRead = () => {
    setAlerts((a) => a.map((al) => ({ ...al, read: true })));
  };

  const markRead = (id: string) => {
    setAlerts((a) => a.map((al) => al.id === id ? { ...al, read: true } : al));
  };

  const deleteAlert = (id: string) => {
    setAlerts((a) => a.filter((al) => al.id !== id));
  };

  const deleteAllRead = () => {
    setAlerts((a) => a.filter((al) => !al.read));
  };

  const refreshAlerts = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'unread') return !a.read;
    if (filter !== 'all') return a.type === filter;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  const Toggle = ({ field }: { field: keyof typeof notifSettings }) => (
    <button
      onClick={() => setNotifSettings((s) => ({ ...s, [field]: !s[field] }))}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        notifSettings[field] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${notifSettings[field] ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Alerts
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time trading signals, risk warnings, and system events
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAlerts}
              className={`p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={deleteAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 size={14} />
              Clear read
            </button>
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Check size={14} />
              Mark all read
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Alert Feed */}
          <div className="lg:col-span-2 space-y-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'unread', 'signal', 'trade', 'risk', 'system'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    filter === f 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f === 'unread' ? `Unread (${unreadCount})` : f}
                </button>
              ))}
            </div>

            {/* Alert List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  No alerts in this category
                </div>
              ) : (
                filtered.map((alert) => {
                  const colors = ALERT_COLORS[alert.type];
                  return (
                    <div
                      key={alert.id}
                      className={`relative p-4 rounded-lg border transition-all ${colors.border} ${colors.bg} ${
                        !alert.read ? 'ring-1 ring-blue-500/20 dark:ring-blue-400/20' : 'opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[alert.priority]}`} />
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${colors.text}`}>
                              {alert.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                              {alert.message}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">
                              {alert.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!alert.read && (
                            <button
                              onClick={() => markRead(alert.id)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                              title="Mark as read"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteAlert(alert.id)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Settings size={14} />
                Notification Settings
              </h3>
              <div className="space-y-3">
                {[
                  { field: 'highConfidenceSignals' as const, label: 'High-Confidence Signals (85%+)' },
                  { field: 'tradeExecutions' as const, label: 'Trade Executions' },
                  { field: 'stopLossHits' as const, label: 'Stop Loss Hits' },
                  { field: 'takeProfitHits' as const, label: 'Take Profit Hits' },
                  { field: 'riskLimitWarnings' as const, label: 'Risk Limit Warnings' },
                  { field: 'dailySummary' as const, label: 'Daily Summary' },
                  { field: 'systemEvents' as const, label: 'System Events' },
                  { field: 'modelRetrains' as const, label: 'Model Retrains' },
                ].map(({ field, label }) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                    <Toggle field={field} />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Today's Summary</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total Alerts', value: alerts.length.toString() },
                  { label: 'Unread', value: unreadCount.toString(), color: unreadCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400' },
                  { label: 'High Priority', value: alerts.filter((a) => a.priority === 'high').length.toString(), color: 'text-red-600 dark:text-red-400' },
                  { label: 'Signal Alerts', value: alerts.filter((a) => a.type === 'signal').length.toString(), color: 'text-blue-600 dark:text-blue-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                    <span className={`text-sm font-bold font-mono ${color ?? 'text-gray-900 dark:text-white'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}