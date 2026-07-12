'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Bell, Check, X, Filter } from 'lucide-react';

interface Alert {
  id: string;
  type: 'signal' | 'trade' | 'risk' | 'system';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_ALERTS: Alert[] = [
  { id: 'A001', type: 'signal', priority: 'high', title: '🔥 High-Confidence Setup: BTCUSDT', message: 'LONG signal at $43,250 | Confidence: 91% | Entry: $43,250 | SL: $42,800 | TP1: $44,100 | TP2: $45,200', time: '2 min ago', read: false },
  { id: 'A002', type: 'trade', priority: 'high', title: '✅ Trade Executed: ETHUSDT SHORT', message: 'Order filled at $2,580.50 | Slippage: 0.02% | Risk: $45.20 | Current exposure: 2.1%', time: '8 min ago', read: false },
  { id: 'A003', type: 'risk', priority: 'high', title: '⚠️ Daily Loss Limit Warning', message: 'Current daily loss: -3.8% of $5.0% limit. 2 more losing trades may trigger auto-shutdown.', time: '15 min ago', read: false },
  { id: 'A004', type: 'trade', priority: 'medium', title: '🎯 Take Profit Hit: SOLUSDT', message: 'TP1 reached at $102.40 | 50% position closed | P&L: +$87.50 (+2.24%) | Trailing stop activated', time: '32 min ago', read: true },
  { id: 'A005', type: 'trade', priority: 'medium', title: '🛑 Stop Loss Hit: XRPUSDT', message: 'SL triggered at $0.641 | Loss: -$32.00 (-2.56%) | Trade duration: 40 min | Regime: Ranging', time: '1h ago', read: true },
  { id: 'A006', type: 'signal', priority: 'medium', title: '📊 Signal Rejected: BNBUSDT', message: 'Confidence 74% below threshold (80%). Volume spike insufficient (1.2x vs 1.5x required).', time: '1h 15m ago', read: true },
  { id: 'A007', type: 'system', priority: 'low', title: '🔄 Model Retrain Scheduled', message: 'Weekly XGBoost retrain queued for Sunday 02:00 UTC. Last retrain accuracy: 83.2%', time: '2h ago', read: true },
  { id: 'A008', type: 'trade', priority: 'medium', title: '📊 Daily Performance Summary', message: 'Trades: 8 | Win Rate: 62.5% | P&L: +$142.30 (+1.42%) | Largest Win: +$105 | Largest Loss: -$43.50', time: '3h ago', read: true },
  { id: 'A009', type: 'system', priority: 'low', title: '🔌 WebSocket Reconnected', message: 'BTCUSDT stream reconnected after 2.3s interruption. No missed signals detected.', time: '4h ago', read: true },
  { id: 'A010', type: 'risk', priority: 'medium', title: '⚠️ Correlation Warning', message: 'ETHUSDT and BTCUSDT positions are 87% correlated. Max correlated trades limit (2) reached.', time: '5h ago', read: true },
];

const ALERT_COLORS = {
  signal: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  trade: { bg: 'bg-positive/10', text: 'text-positive', border: 'border-positive/20' },
  risk: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  system: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

const PRIORITY_DOT = {
  high: 'bg-negative',
  medium: 'bg-warning',
  low: 'bg-muted-foreground',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'signal' | 'trade' | 'risk' | 'system'>('all');

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

  const markAllRead = () => setAlerts((a) => a.map((al) => ({ ...al, read: true })));
  const markRead = (id: string) => setAlerts((a) => a.map((al) => al.id === id ? { ...al, read: true } : al));
  const deleteAlert = (id: string) => setAlerts((a) => a.filter((al) => al.id !== id));

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
        notifSettings[field] ? 'bg-positive' : 'bg-muted-foreground/30'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${notifSettings[field] ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Bell size={22} className="text-info" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                Alerts
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-negative text-white rounded-full">{unreadCount}</span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">Real-time trading signals, risk warnings, and system events</p>
            </div>
          </div>
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Check size={14} />
            Mark all read
          </button>
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
                    filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'unread' ? `Unread (${unreadCount})` : f}
                </button>
              ))}
            </div>

            {/* Alert List */}
            <div className="space-y-2">
              {filtered.map((alert) => {
                const colors = ALERT_COLORS[alert.type];
                return (
                  <div
                    key={alert.id}
                    className={`relative p-4 rounded-lg border transition-all ${colors.border} ${colors.bg} ${!alert.read ? 'ring-1 ring-primary/20' : 'opacity-80'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[alert.priority]}`} />
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${colors.text} truncate`}>{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{alert.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!alert.read && (
                          <button
                            onClick={() => markRead(alert.id)}
                            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-1 rounded hover:bg-negative/10 text-muted-foreground hover:text-negative transition-colors"
                          title="Delete"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm bg-card border border-border rounded-lg">
                  No alerts in this category
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Bell size={14} />
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
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <Toggle field={field} />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Today's Summary</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total Alerts', value: alerts.length.toString() },
                  { label: 'Unread', value: unreadCount.toString(), color: unreadCount > 0 ? 'text-warning' : 'text-positive' },
                  { label: 'High Priority', value: alerts.filter((a) => a.priority === 'high').length.toString(), color: 'text-negative' },
                  { label: 'Signal Alerts', value: alerts.filter((a) => a.type === 'signal').length.toString(), color: 'text-primary' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={`text-sm font-bold font-mono ${color ?? 'text-foreground'}`}>{value}</span>
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
