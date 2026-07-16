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

export async function createBybitSignature(
  apiKey: string,
  apiSecret: string,
  timestamp: string,
  recvWindow: string,
  params: string
): Promise<string> {
  const encoder = new TextEncoder();
  const payload = `${timestamp}${apiKey}${recvWindow}${params}`;
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function createBybitAuthHeaders(
  apiKey: string,
  apiSecret: string,
  params: string = '',
  recvWindow: string = '5000'
) {
  const timestamp = Date.now().toString();
  const signature = await createBybitSignature(apiKey, apiSecret, timestamp, recvWindow, params);

  return {
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-SIGN': signature,
    'X-BAPI-RECV-WINDOW': recvWindow,
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
