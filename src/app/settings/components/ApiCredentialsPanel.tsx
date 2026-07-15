'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';

type TradingMode = 'paper' | 'live';

interface Credentials {
  apiKey: string;
  apiSecret: string;
}

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  latency?: number;
  accountInfo?: { 
    balance: string; 
    uid: string;
    accountType?: string;
    availableBalance?: string;
    totalEquity?: string;
  };
}

// Bybit API endpoints
const BYBIT_API = {
  paper: 'https://api-testnet.bybit.com',
  live: 'https://api.bybit.com',
};

// FIXED: Correct Bybit V5 signature generation
const generateSignature = (apiKey: string, apiSecret: string, timestamp: string, recvWindow: string, params: string) => {
  const crypto = require('crypto');
  // Bybit V5 signature format: timestamp + apiKey + recvWindow + params
  const paramStr = timestamp + apiKey + recvWindow + params;
  return crypto.createHmac('sha256', apiSecret).update(paramStr).digest('hex');
};

// Helper to safely parse JSON response
const safeJsonParse = async (response: Response) => {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
};

export default function ApiCredentialsPanel() {
  const [activeMode, setActiveMode] = useState<TradingMode>('paper');
  const [showSecret, setShowSecret] = useState<Record<TradingMode, boolean>>({ paper: false, live: false });
  const [credentials, setCredentials] = useState<Record<TradingMode, Credentials>>({
    paper: { apiKey: '', apiSecret: '' },
    live: { apiKey: '', apiSecret: '' },
  });
  const [testResult, setTestResult] = useState<Record<TradingMode, TestResult>>({
    paper: { status: 'idle', message: '' },
    live: { status: 'idle', message: '' },
  });

  const handleChange = (mode: TradingMode, field: keyof Credentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [mode]: { ...prev[mode], [field]: value.trim() } }));
    setTestResult((prev) => ({ ...prev, [mode]: { status: 'idle', message: '' } }));
  };

  // Fetch Unified Trading Account balance (V5 API)
  const fetchUnifiedAccountBalance = async (apiKey: string, apiSecret: string, isTestnet: boolean) => {
    const baseUrl = isTestnet ? BYBIT_API.paper : BYBIT_API.live;
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const params = '';

    const signature = generateSignature(apiKey, apiSecret, timestamp, recvWindow, params);

    const response = await fetch(`${baseUrl}/v5/account/wallet-balance`, {
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'X-BAPI-RECV-WINDOW': recvWindow,
      },
    });

    return safeJsonParse(response);
  };

  // Fetch account info (UID, account type)
  const fetchAccountInfo = async (apiKey: string, apiSecret: string, isTestnet: boolean) => {
    const baseUrl = isTestnet ? BYBIT_API.paper : BYBIT_API.live;
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const params = '';

    const signature = generateSignature(apiKey, apiSecret, timestamp, recvWindow, params);

    const response = await fetch(`${baseUrl}/v5/account/info`, {
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'X-BAPI-RECV-WINDOW': recvWindow,
      },
    });

    return safeJsonParse(response);
  };

  const handleTest = async (mode: TradingMode) => {
    const creds = credentials[mode];
    if (!creds.apiKey || !creds.apiSecret) {
      setTestResult((prev) => ({ ...prev, [mode]: { status: 'error', message: 'API Key and Secret are required.' } }));
      return;
    }

    setTestResult((prev) => ({ ...prev, [mode]: { status: 'testing', message: 'Connecting to Bybit...' } }));
    const start = Date.now();

    try {
      const isTestnet = mode === 'paper';
      
      // Step 1: Fetch account info (UID, account type)
      const accountInfoData = await fetchAccountInfo(creds.apiKey, creds.apiSecret, isTestnet);
      
      // Step 2: Fetch Unified Account balance
      const balanceData = await fetchUnifiedAccountBalance(creds.apiKey, creds.apiSecret, isTestnet);
      
      const latency = Date.now() - start;

      // Check if account info request succeeded
      let uid = 'N/A';
      let accountType = 'N/A';
      let accountStatus = 'Unknown';

      if (accountInfoData && accountInfoData.retCode === 0 && accountInfoData.result) {
        const result = accountInfoData.result;
        uid = result.uid || result.accountUid || 'N/A';
        accountType = result.accountType || result.accType || 'Unified';
        accountStatus = result.status || 'Active';
      }

      // Check if balance request succeeded
      let balance = '0';
      let totalEquity = '0';
      let availableBalance = '0';
      let walletBalance = '0';

      if (balanceData && balanceData.retCode === 0 && balanceData.result) {
        const result = balanceData.result;
        
        // Handle Unified Account response structure
        if (result.list && Array.isArray(result.list) && result.list.length > 0) {
          const wallet = result.list[0];
          
          // Unified Account fields
          totalEquity = wallet?.totalEquity || wallet?.equity || '0';
          availableBalance = wallet?.availableBalance || wallet?.available || '0';
          walletBalance = wallet?.walletBalance || wallet?.balance || '0';
          
          // Use totalEquity as the main balance for Unified Account
          balance = totalEquity || availableBalance || walletBalance || '0';
        } else if (result.account) {
          // Alternative response structure
          const account = result.account;
          totalEquity = account?.totalEquity || account?.equity || '0';
          availableBalance = account?.availableBalance || account?.available || '0';
          walletBalance = account?.walletBalance || account?.balance || '0';
          balance = totalEquity || availableBalance || walletBalance || '0';
        } else {
          // Try direct fields
          totalEquity = result?.totalEquity || result?.equity || '0';
          availableBalance = result?.availableBalance || result?.available || '0';
          walletBalance = result?.walletBalance || result?.balance || '0';
          balance = totalEquity || availableBalance || walletBalance || '0';
        }
      }

      // If either request succeeded, consider it a success (we can get balance even if account info fails)
      if (balanceData?.retCode === 0 || accountInfoData?.retCode === 0) {
        const balanceNum = parseFloat(balance);
        const balanceDisplay = balanceNum > 0 ? `${balanceNum.toFixed(2)} USDT` : '0.00 USDT';

        setTestResult((prev) => ({
          ...prev,
          [mode]: {
            status: 'success',
            message: `✅ Connected to ${mode === 'live' ? 'Live' : 'Testnet'} Unified Trading Account`,
            latency,
            accountInfo: {
              balance: balanceDisplay,
              uid: uid !== 'N/A' ? uid : (balanceData?.result?.uid || 'N/A'),
              accountType: accountType !== 'N/A' ? accountType : 'Unified',
              availableBalance: availableBalance !== '0' ? `${parseFloat(availableBalance).toFixed(2)} USDT` : '0.00 USDT',
              totalEquity: totalEquity !== '0' ? `${parseFloat(totalEquity).toFixed(2)} USDT` : '0.00 USDT',
            },
          },
        }));
      } else {
        // Handle errors
        const errorMsg = balanceData?.retMsg || accountInfoData?.retMsg || 'Unknown error';
        let errorCode = balanceData?.retCode || accountInfoData?.retCode || 'Unknown';
        
        let userMessage = `❌ Error ${errorCode}: ${errorMsg}`;
        if (errorCode === 10005) {
          userMessage = '❌ Invalid API key. Please check your API key.';
        } else if (errorCode === 10006) {
          userMessage = '❌ Invalid API signature. Please check your API secret.';
        } else if (errorCode === 10003) {
          userMessage = '❌ Rate limit exceeded. Please try again later.';
        } else if (errorCode === 10010) {
          userMessage = '❌ API key permissions insufficient. Please ensure your API key has read permissions.';
        }
        
        throw new Error(userMessage);
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      const latency = Date.now() - start;
      
      let userMessage = error.message || '❌ Failed to connect. Check your credentials and network.';
      
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        userMessage = '❌ Network error. Please check your internet connection.';
      } else if (error.message?.includes('timeout')) {
        userMessage = '❌ Connection timeout. Please try again.';
      }

      setTestResult((prev) => ({
        ...prev,
        [mode]: {
          status: 'error',
          message: userMessage,
          latency,
        },
      }));
    }
  };

  const result = testResult[activeMode];
  const creds = credentials[activeMode];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShieldCheck size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="text-foreground font-semibold text-sm">Bybit API Credentials</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Configure keys for Unified Trading Account</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-5 p-1 bg-muted rounded-lg w-fit">
        {(['paper', 'live'] as TradingMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 capitalize ${
              activeMode === mode
                ? mode === 'live' ? 'bg-negative text-white shadow-sm' : 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === 'live' ? '⚡ Live' : '📄 Paper'}
          </button>
        ))}
      </div>

      {/* Live Warning */}
      {activeMode === 'live' && (
        <div className="flex items-start gap-2.5 mb-4 p-3 rounded-lg bg-negative-subtle border border-negative/20">
          <ShieldAlert size={15} className="text-negative shrink-0 mt-0.5" />
          <p className="text-negative text-xs leading-relaxed">
            Live trading uses real funds. Ensure your API key has <strong>Trade</strong> permission only — never enable withdrawals.
          </p>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            API Key <span className="text-negative">*</span>
          </label>
          <input
            type="text"
            value={creds.apiKey}
            onChange={(e) => handleChange(activeMode, 'apiKey', e.target.value)}
            placeholder={activeMode === 'paper' ? 'Bybit Testnet API Key' : 'Bybit Mainnet API Key'}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            API Secret <span className="text-negative">*</span>
          </label>
          <div className="relative">
            <input
              type={showSecret[activeMode] ? 'text' : 'password'}
              value={creds.apiSecret}
              onChange={(e) => handleChange(activeMode, 'apiSecret', e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••••••"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowSecret((prev) => ({ ...prev, [activeMode]: !prev[activeMode] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSecret[activeMode] ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={() => handleTest(activeMode)}
        disabled={result.status === 'testing'}
        className={`mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
          result.status === 'testing' ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white'
        }`}
      >
        {result.status === 'testing' ? (
          <><Loader2 size={15} className="animate-spin" /> Testing Connection...</>
        ) : (
          'Test Connection'
        )}
      </button>

      {/* Result */}
      {result.status !== 'idle' && result.status !== 'testing' && (
        <div className={`mt-4 p-3 rounded-lg border flex items-start gap-2.5 ${
          result.status === 'success' ? 'bg-positive-subtle border-positive/20' : 'bg-negative-subtle border-negative/20'
        }`}>
          {result.status === 'success' ? (
            <CheckCircle2 size={15} className="text-positive shrink-0 mt-0.5" />
          ) : (
            <XCircle size={15} className="text-negative shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium ${result.status === 'success' ? 'text-positive' : 'text-negative'}`}>
              {result.message}
            </p>
            {result.latency && (
              <p className="text-muted-foreground text-[11px] mt-0.5">Latency: {result.latency}ms</p>
            )}
            {result.accountInfo && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="bg-background/60 rounded-md px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Total Equity</p>
                  <p className="text-xs font-mono font-semibold text-foreground">{result.accountInfo.totalEquity || result.accountInfo.balance}</p>
                </div>
                <div className="bg-background/60 rounded-md px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Available Balance</p>
                  <p className="text-xs font-mono font-semibold text-foreground">{result.accountInfo.availableBalance || '0.00 USDT'}</p>
                </div>
                <div className="bg-background/60 rounded-md px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Account Type</p>
                  <p className="text-xs font-mono font-semibold text-foreground">{result.accountInfo.accountType || 'Unified'}</p>
                </div>
                <div className="bg-background/60 rounded-md px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Account UID</p>
                  <p className="text-xs font-mono font-semibold text-foreground">{result.accountInfo.uid}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}