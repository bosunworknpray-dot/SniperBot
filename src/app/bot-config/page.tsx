'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Bot, Save, RotateCcw, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ConfigSection {
  id: string;
  label: string;
  open: boolean;
}

export default function BotConfigPage() {
  const [sections, setSections] = useState<ConfigSection[]>([
    { id: 'trading', label: 'Trading Parameters', open: true },
    { id: 'execution', label: 'Execution Settings', open: true },
    { id: 'ml', label: 'ML Model Configuration', open: false },
    { id: 'scanning', label: 'Market Scanning', open: false },
  ]);

  const [config, setConfig] = useState({
    // Trading Parameters
    mode: 'paper',
    confidenceThreshold: 82,
    minWinRate: 70,
    minRiskReward: 2.5,
    maxOpenPositions: 3,
    defaultLeverage: 5,
    // Execution
    orderType: 'limit',
    executionWindow: 500,
    maxSlippage: 0.05,
    breakEvenTrigger: 1.0,
    maxTradeDuration: 120,
    // ML
    primaryModel: 'xgboost',
    retrainFrequency: 'weekly',
    featureWindow: 100,
    crossValidationFolds: 5,
    // Scanning
    rescanInterval: 30,
    topSymbolsCount: 20,
    volumeSpike: 1.5,
    timeframes: ['5m', '15m'],
  });

  const [saved, setSaved] = useState(false);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, open: !s.open } : s))
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig((prev) => ({ ...prev, confidenceThreshold: 82, minWinRate: 70 }));
  };

  const SectionHeader = ({ id, label }: { id: string; label: string }) => {
    const section = sections.find((s) => s.id === id);
    return (
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 rounded-t-lg transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {section?.open ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>
    );
  };

  const isOpen = (id: string) => sections.find((s) => s.id === id)?.open;

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Bot Configuration</h1>
              <p className="text-sm text-muted-foreground">
                Configure trading parameters, execution settings, and ML models
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                saved
                  ? 'bg-positive text-white' :'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <Save size={14} />
              {saved ? 'Saved!' : 'Save Config'}
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <span className="text-sm font-medium text-foreground">Trading Mode:</span>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {['paper', 'live'].map((mode) => (
              <button
                key={mode}
                onClick={() => setConfig((c) => ({ ...c, mode }))}
                className={`px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  config.mode === mode
                    ? mode === 'live' ?'bg-negative text-white' :'bg-positive text-white' :'text-muted-foreground hover:bg-muted'
                }`}
              >
                {mode === 'live' ? '⚠️ Live' : '📄 Paper'}
              </button>
            ))}
          </div>
          {config.mode === 'live' && (
            <span className="text-xs text-negative font-medium flex items-center gap-1">
              <Info size={12} /> Real funds at risk
            </span>
          )}
        </div>

        {/* Trading Parameters */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <SectionHeader id="trading" label="Trading Parameters" />
          {isOpen('trading') && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  AI Confidence Threshold (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={70}
                    max={95}
                    value={config.confidenceThreshold}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, confidenceThreshold: +e.target.value }))
                    }
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-mono font-bold text-primary w-10 text-right">
                    {config.confidenceThreshold}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Min Win Rate Requirement (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={50}
                    max={90}
                    value={config.minWinRate}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, minWinRate: +e.target.value }))
                    }
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-mono font-bold text-primary w-10 text-right">
                    {config.minWinRate}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Min Risk:Reward Ratio
                </label>
                <select
                  value={config.minRiskReward}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, minRiskReward: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                >
                  {[1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map((v) => (
                    <option key={v} value={v}>
                      1:{v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Max Concurrent Positions
                </label>
                <select
                  value={config.maxOpenPositions}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, maxOpenPositions: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>
                      {v} position{v > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Default Leverage
                </label>
                <select
                  value={config.defaultLeverage}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, defaultLeverage: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                >
                  {[1, 2, 3, 5, 10, 15, 20].map((v) => (
                    <option key={v} value={v}>
                      {v}x
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Execution Settings */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <SectionHeader id="execution" label="Execution Settings" />
          {isOpen('execution') && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Order Type
                </label>
                <div className="flex rounded-lg overflow-hidden border border-border">
                  {['limit', 'market'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setConfig((c) => ({ ...c, orderType: t }))}
                      className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                        config.orderType === t
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Execution Window (ms)
                </label>
                <input
                  type="number"
                  value={config.executionWindow}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, executionWindow: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Max Slippage (%)
                </label>
                <input
                  type="number"
                  step={0.01}
                  value={config.maxSlippage}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, maxSlippage: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Breakeven Trigger (% profit)
                </label>
                <input
                  type="number"
                  step={0.1}
                  value={config.breakEvenTrigger}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, breakEvenTrigger: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Max Trade Duration (min)
                </label>
                <input
                  type="number"
                  value={config.maxTradeDuration}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, maxTradeDuration: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
            </div>
          )}
        </div>

        {/* ML Model Configuration */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <SectionHeader id="ml" label="ML Model Configuration" />
          {isOpen('ml') && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Primary Model
                </label>
                <select
                  value={config.primaryModel}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, primaryModel: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                >
                  <option value="xgboost">XGBoost</option>
                  <option value="lightgbm">LightGBM</option>
                  <option value="ensemble">XGBoost + LightGBM Ensemble</option>
                  <option value="random_forest">Random Forest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Retrain Frequency
                </label>
                <select
                  value={config.retrainFrequency}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, retrainFrequency: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Feature Window (candles)
                </label>
                <input
                  type="number"
                  value={config.featureWindow}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, featureWindow: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Cross-Validation Folds
                </label>
                <select
                  value={config.crossValidationFolds}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, crossValidationFolds: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                >
                  {[3, 5, 7, 10].map((v) => (
                    <option key={v} value={v}>
                      {v}-fold
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Market Scanning */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <SectionHeader id="scanning" label="Market Scanning" />
          {isOpen('scanning') && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Full Rescan Interval (min)
                </label>
                <input
                  type="number"
                  value={config.rescanInterval}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, rescanInterval: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Top Symbols by Volume
                </label>
                <select
                  value={config.topSymbolsCount}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, topSymbolsCount: +e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground"
                >
                  {[10, 15, 20, 25, 30].map((v) => (
                    <option key={v} value={v}>
                      Top {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Volume Spike Multiplier
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1.0}
                    max={3.0}
                    step={0.1}
                    value={config.volumeSpike}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, volumeSpike: +e.target.value }))
                    }
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-mono font-bold text-primary w-12 text-right">
                    {config.volumeSpike.toFixed(1)}x
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Active Timeframes
                </label>
                <div className="flex gap-2">
                  {['1m', '5m', '15m', '1h'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() =>
                        setConfig((c) => ({
                          ...c,
                          timeframes: c.timeframes.includes(tf)
                            ? c.timeframes.filter((t) => t !== tf)
                            : [...c.timeframes, tf],
                        }))
                      }
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                        config.timeframes.includes(tf)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
