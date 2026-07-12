'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Shield, Save, AlertTriangle } from 'lucide-react';

export default function RiskRulesPage() {
  const [rules, setRules] = useState({
    perTradeRisk: 1.0,
    maxDailyLoss: 5.0,
    maxWeeklyDrawdown: 10.0,
    maxMonthlyDrawdown: 15.0,
    maxOpenPositions: 3,
    maxCorrelatedTrades: 2,
    atrMultiplierSL: 2.0,
    emergencyExitPct: 4.0,
    tp1Ratio: 2.5,
    tp2Ratio: 4.0,
    tp1SizeClose: 50,
    trailingStopEnabled: true,
    trailingStopATR: 1.5,
    kellyEnabled: true,
    kellyFraction: 0.25,
    portfolioHeatLimit: 8.0,
    anomalyDetection: true,
    autoScaling: true,
    correlationCheck: true,
    dailyLossShutdown: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ field }: { field: keyof typeof rules }) => (
    <button
      onClick={() => setRules((r) => ({ ...r, [field]: !r[field] }))}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        rules[field] ? 'bg-positive' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          rules[field] ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SliderField = ({
    label,
    field,
    min,
    max,
    step,
    unit,
    warn,
  }: {
    label: string;
    field: keyof typeof rules;
    min: number;
    max: number;
    step: number;
    unit: string;
    warn?: number;
  }) => {
    const val = rules[field] as number;
    const isWarn = warn !== undefined && val >= warn;
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-muted-foreground">{label}</label>
          <span className={`text-sm font-mono font-bold ${isWarn ? 'text-warning' : 'text-primary'}`}>
            {val}{unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={(e) => setRules((r) => ({ ...r, [field]: +e.target.value }))}
          className="w-full accent-primary"
        />
        {isWarn && (
          <p className="text-[10px] text-warning mt-0.5 flex items-center gap-1">
            <AlertTriangle size={10} /> High risk setting
          </p>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Shield size={22} className="text-warning" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Risk Rules</h1>
              <p className="text-sm text-muted-foreground">
                Define hard limits and protective mechanisms for capital preservation
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              saved ? 'bg-positive text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Rules'}
          </button>
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/5 border border-warning/20">
          <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-warning">
            Risk rules are enforced in real-time. Changes take effect on the next trade cycle. Tightening limits mid-session may trigger immediate position reviews.
          </p>
        </div>

        {/* Loss Limits */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-5">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
            Loss Limits & Drawdown Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SliderField label="Per-Trade Risk (%)" field="perTradeRisk" min={0.1} max={3.0} step={0.1} unit="%" warn={2.0} />
            <SliderField label="Daily Loss Limit (%)" field="maxDailyLoss" min={1.0} max={10.0} step={0.5} unit="%" warn={7.0} />
            <SliderField label="Weekly Drawdown Limit (%)" field="maxWeeklyDrawdown" min={2.0} max={20.0} step={0.5} unit="%" warn={15.0} />
            <SliderField label="Monthly Drawdown Limit (%)" field="maxMonthlyDrawdown" min={5.0} max={30.0} step={1.0} unit="%" warn={20.0} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Shutdown on Daily Limit</p>
              <p className="text-xs text-muted-foreground">Halt all trading when daily loss limit is reached</p>
            </div>
            <Toggle field="dailyLossShutdown" />
          </div>
        </div>

        {/* Position Controls */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-5">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
            Position & Exposure Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Max Open Positions</label>
              <select
                value={rules.maxOpenPositions}
                onChange={(e) => setRules((r) => ({ ...r, maxOpenPositions: +e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
              >
                {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Max Correlated Trades</label>
              <select
                value={rules.maxCorrelatedTrades}
                onChange={(e) => setRules((r) => ({ ...r, maxCorrelatedTrades: +e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
              >
                {[1, 2, 3].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <SliderField label="Portfolio Heat Limit (%)" field="portfolioHeatLimit" min={2.0} max={20.0} step={0.5} unit="%" warn={12.0} />
            <SliderField label="Emergency Exit Threshold (%)" field="emergencyExitPct" min={1.0} max={8.0} step={0.5} unit="%" warn={6.0} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium text-foreground">Correlation Check</p>
              <p className="text-xs text-muted-foreground">Block new entries when correlated positions exceed limit</p>
            </div>
            <Toggle field="correlationCheck" />
          </div>
        </div>

        {/* Stop Loss & Take Profit */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-5">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
            Stop Loss & Take Profit Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SliderField label="ATR Multiplier (Stop Loss)" field="atrMultiplierSL" min={1.0} max={4.0} step={0.1} unit="x" />
            <SliderField label="TP1 Risk:Reward Ratio" field="tp1Ratio" min={1.5} max={4.0} step={0.1} unit="x" />
            <SliderField label="TP2 Risk:Reward Ratio" field="tp2Ratio" min={2.0} max={6.0} step={0.1} unit="x" />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">TP1 Position Close (%)</label>
                <span className="text-sm font-mono font-bold text-primary">{rules.tp1SizeClose}%</span>
              </div>
              <input
                type="range"
                min={25}
                max={75}
                step={5}
                value={rules.tp1SizeClose}
                onChange={(e) => setRules((r) => ({ ...r, tp1SizeClose: +e.target.value }))}
                className="w-full accent-primary"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium text-foreground">Trailing Stop</p>
              <p className="text-xs text-muted-foreground">Dynamic ATR-based trailing after TP1</p>
            </div>
            <Toggle field="trailingStopEnabled" />
          </div>
          {rules.trailingStopEnabled && (
            <SliderField label="Trailing Stop ATR Multiplier" field="trailingStopATR" min={0.5} max={3.0} step={0.1} unit="x" />
          )}
        </div>

        {/* Advanced Controls */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
            Advanced Risk Controls
          </h2>
          {[
            { field: 'kellyEnabled' as const, label: 'Kelly Criterion Sizing', desc: 'Dynamically size positions based on historical win-rate and R:R' },
            { field: 'anomalyDetection' as const, label: 'Anomaly Detection', desc: 'Pause trading on unusual price movements or volume spikes' },
            { field: 'autoScaling' as const, label: 'Auto-Scaling', desc: 'Reduce position size after consecutive losses' },
          ].map(({ field, label, desc }) => (
            <div key={field} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Toggle field={field} />
            </div>
          ))}
          {rules.kellyEnabled && (
            <div className="mt-2">
              <SliderField label="Kelly Fraction (conservative multiplier)" field="kellyFraction" min={0.1} max={1.0} step={0.05} unit="x" />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
