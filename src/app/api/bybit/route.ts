// app/api/bybit/route.ts
// Secure Bybit API proxy - Server-side credential handling for MAINNET ONLY

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requestManager } from '@/lib/requestManager';
import {
  parseWalletBalance,
  parsePositionList,
  parseOrderResponse,
  parseTickers,
  parseTimeResponse,
} from '@/lib/validators';

const BYBIT_BASE_URL = 'https://api.bybit.com';
const API_KEY = process.env.BYBIT_API_KEY || '';
const API_SECRET = process.env.BYBIT_API_SECRET || '';

// Validate credentials exist
if (!API_KEY || !API_SECRET) {
  logger.warn('Bybit API', 'Missing API credentials in environment variables');
}

async function createBybitSignature(
  timestamp: string,
  recvWindow: string,
  payload: string
): Promise<string> {
  const originString = `${timestamp}${API_KEY}${recvWindow}${payload}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(originString));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function createBybitHeaders(payload: string = ''): Promise<Record<string, string>> {
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const signature = await createBybitSignature(timestamp, recvWindow, payload);

  return {
    'X-BAPI-API-KEY': API_KEY,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-SIGN': signature,
    'X-BAPI-RECV-WINDOW': recvWindow,
    'Content-Type': 'application/json',
  };
}

// ============== WALLET BALANCE ==============
export async function POST(req: NextRequest) {
  const { endpoint, method = 'GET', body } = await req.json();

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint' },
      { status: 400 }
    );
  }

  try {
    const url = `${BYBIT_BASE_URL}${endpoint}`;
    const payload = method === 'POST' ? JSON.stringify(body || {}) : '';
    const headers = await createBybitHeaders(payload);

    logger.debug('Bybit API', `${method} ${endpoint}`, { payload });

    const response = await requestManager.executeWithRateLimit(
      url,
      {
        method,
        headers,
        ...(method === 'POST' && { body: payload }),
      }
    );

    // Validate response based on endpoint
    if (endpoint.includes('wallet-balance')) {
      const result = parseWalletBalance(response);
      if (!result.success) {
        logger.error('Bybit API', 'Invalid wallet balance response', { errors: result.error });
        return NextResponse.json(
          { error: 'Invalid API response format' },
          { status: 500 }
        );
      }
      return NextResponse.json(result.data);
    }

    if (endpoint.includes('position/list')) {
      const result = parsePositionList(response);
      if (!result.success) {
        logger.error('Bybit API', 'Invalid position list response', { errors: result.error });
        return NextResponse.json(
          { error: 'Invalid API response format' },
          { status: 500 }
        );
      }
      return NextResponse.json(result.data);
    }

    if (endpoint.includes('order/create')) {
      const result = parseOrderResponse(response);
      if (!result.success) {
        logger.error('Bybit API', 'Invalid order response', { errors: result.error });
        return NextResponse.json(
          { error: 'Invalid API response format' },
          { status: 500 }
        );
      }
      return NextResponse.json(result.data);
    }

    if (endpoint.includes('tickers')) {
      const result = parseTickers(response);
      if (!result.success) {
        logger.error('Bybit API', 'Invalid tickers response', { errors: result.error });
        return NextResponse.json(
          { error: 'Invalid API response format' },
          { status: 500 }
        );
      }
      return NextResponse.json(result.data);
    }

    if (endpoint.includes('market/time')) {
      const result = parseTimeResponse(response);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid API response format' },
          { status: 500 }
        );
      }
      return NextResponse.json(result.data);
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Bybit API', `Failed to call ${endpoint}`, { error: message }, error as Error);

    return NextResponse.json(
      { error: message, endpoint },
      { status: 500 }
    );
  }
}

// GET wrapper
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  return POST(
    new NextRequest(req, {
      body: JSON.stringify({ endpoint, method: 'GET' }),
    })
  );
}
