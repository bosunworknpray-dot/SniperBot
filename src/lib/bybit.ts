export const BYBIT_BASE_URL = 'https://api.bybit.com';
export const BYBIT_WS_URL = 'wss://stream.bybit.com/v5/public/linear';

const BYBIT_CREDENTIALS_KEY = 'bybit_credentials';

export interface BybitCredentials {
  apiKey: string;
  apiSecret: string;
  isTestnet: boolean;
}

export function getBybitCredentials(): BybitCredentials {
  const envApiKey = process.env.NEXT_PUBLIC_BYBIT_API_KEY || '';
  const envApiSecret = process.env.NEXT_PUBLIC_BYBIT_API_SECRET || '';

  if (typeof window === 'undefined') {
    return { apiKey: envApiKey, apiSecret: envApiSecret, isTestnet: false };
  }

  try {
    const saved = window.localStorage.getItem(BYBIT_CREDENTIALS_KEY);
    if (!saved) {
      return { apiKey: envApiKey, apiSecret: envApiSecret, isTestnet: false };
    }

    const parsed = JSON.parse(saved);
    return {
      apiKey: parsed?.apiKey || envApiKey,
      apiSecret: parsed?.apiSecret || envApiSecret,
      isTestnet: Boolean(parsed?.isTestnet),
    };
  } catch {
    return { apiKey: envApiKey, apiSecret: envApiSecret, isTestnet: false };
  }
}

function normalizeSignaturePayload(payload: string | Record<string, unknown> | undefined): string {
  if (typeof payload === 'string') return payload;
  if (!payload) return '';
  return JSON.stringify(payload);
}

export async function createBybitSignature(
  apiKey: string,
  apiSecret: string,
  timestamp: string,
  recvWindow: string,
  payload: string | Record<string, unknown> | undefined
): Promise<string> {
  const encoder = new TextEncoder();
  const payloadString = normalizeSignaturePayload(payload);
  const originString = `${timestamp}${apiKey}${recvWindow}${payloadString}`;
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(originString));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function createBybitAuthHeaders(
  apiKey: string,
  apiSecret: string,
  payload: string | Record<string, unknown> = '',
  recvWindow: string = '5000'
) {
  const timestamp = Date.now().toString();
  const signature = await createBybitSignature(apiKey, apiSecret, timestamp, recvWindow, payload);

  return {
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-SIGN': signature,
    'X-BAPI-RECV-WINDOW': recvWindow,
  };
}

export interface BybitWalletBalance {
  totalEquity: number;
  availableBalance: number;
  walletBalance: number;
}

export async function fetchBybitWalletBalance(
  apiKey?: string,
  apiSecret?: string
): Promise<BybitWalletBalance> {
  const credentials = apiKey && apiSecret
    ? { apiKey, apiSecret, isTestnet: false }
    : getBybitCredentials();

  if (!credentials.apiKey || !credentials.apiSecret) {
    return { totalEquity: 0, availableBalance: 0, walletBalance: 0 };
  }

  const recvWindow = '5000';
  const params = 'accountType=UNIFIED';
  const headers = await createBybitAuthHeaders(credentials.apiKey, credentials.apiSecret, params, recvWindow);

  const response = await fetch(`${BYBIT_BASE_URL}/v5/account/wallet-balance?${params}`, {
    method: 'GET',
    headers,
  });

  const data = await safeJsonParse(response);
  const wallet = data?.result?.list?.[0] || data?.result || {};
  const totalEquity = parseFloat(wallet?.totalEquity ?? wallet?.equity ?? wallet?.walletBalance ?? '0');
  const availableBalance = parseFloat(wallet?.availableBalance ?? wallet?.available ?? wallet?.walletBalance ?? '0');

  return {
    totalEquity: Number.isFinite(totalEquity) ? totalEquity : 0,
    availableBalance: Number.isFinite(availableBalance) ? availableBalance : 0,
    walletBalance: Number.isFinite(totalEquity) ? totalEquity : 0,
  };
}

export async function placeBybitOrder(options: {
  symbol: string;
  side: 'LONG' | 'SHORT';
  qty: number;
  leverage?: number;
  positionIdx?: number;
  apiKey?: string;
  apiSecret?: string;
}) {
  const { symbol, side, qty, leverage = 5, positionIdx, apiKey, apiSecret } = options;
  const credentials = apiKey && apiSecret
    ? { apiKey, apiSecret, isTestnet: false }
    : getBybitCredentials();

  if (!credentials.apiKey || !credentials.apiSecret) {
    throw new Error('Live trading credentials are not configured. Add them in Settings first.');
  }

  const recvWindow = '5000';
  const orderSide = side === 'LONG' ? 'Buy' : 'Sell';

  const leverageBody = {
    category: 'linear',
    symbol,
    buyLeverage: leverage.toString(),
    sellLeverage: leverage.toString(),
  };
  const leverageHeaders = await createBybitAuthHeaders(credentials.apiKey, credentials.apiSecret, leverageBody, recvWindow);
  await fetch(`${BYBIT_BASE_URL}/v5/position/set-leverage`, {
    method: 'POST',
    headers: {
      ...leverageHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(leverageBody),
  });

  const orderBody = {
    category: 'linear',
    symbol,
    side: orderSide,
    orderType: 'Market',
    qty: qty.toString(),
    timeInForce: 'GTC',
    ...(typeof positionIdx === 'number' ? { positionIdx } : {}),
  };
  const orderHeaders = await createBybitAuthHeaders(credentials.apiKey, credentials.apiSecret, orderBody, recvWindow);
  const orderResponse = await fetch(`${BYBIT_BASE_URL}/v5/order/create`, {
    method: 'POST',
    headers: {
      ...orderHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderBody),
  });

  const orderData = await safeJsonParse(orderResponse);
  if (orderData?.retCode !== 0) {
    return {
      success: false,
      error: orderData?.retMsg || 'Bybit rejected the order',
    };
  }

  return {
    success: true,
    orderId: orderData?.result?.orderId,
  };
}

export async function safeJsonParse(response: Response) {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function buildBybitUrl(path: string, params?: string) {
  if (!params) return `${BYBIT_BASE_URL}${path}`;
  const separator = path.includes('?') ? '&' : '?';
  return `${BYBIT_BASE_URL}${path}${separator}${params}`;
}
