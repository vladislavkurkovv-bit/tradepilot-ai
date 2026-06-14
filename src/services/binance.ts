import type { Balance, Kline } from "@/lib/types";
import { buildSignedQuery } from "@/lib/crypto-sign";

const BASE_URL = "https://api.binance.com";

async function binanceFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, init);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || data.message || `Binance API error: ${res.status}`);
  }
  return data;
}

export async function testBinanceConnection(
  apiKey: string,
  apiSecret: string
): Promise<{ success: boolean; message: string }> {
  try {
    const params = { timestamp: Date.now() };
    const query = buildSignedQuery(params, apiSecret);
    await binanceFetch(`/api/v3/account?${query}`, {
      headers: { "X-MBX-APIKEY": apiKey },
    });
    return { success: true, message: "Binance connection successful" };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

export async function getBinanceBalance(
  apiKey: string,
  apiSecret: string
): Promise<Balance[]> {
  const params = { timestamp: Date.now() };
  const query = buildSignedQuery(params, apiSecret);
  const data = await binanceFetch(`/api/v3/account?${query}`, {
    headers: { "X-MBX-APIKEY": apiKey },
  });

  return (data.balances as Array<{ asset: string; free: string; locked: string }>)
    .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    .map((b) => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
      total: parseFloat(b.free) + parseFloat(b.locked),
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getBinancePrice(symbol: string): Promise<number> {
  const data = await binanceFetch(
    `/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`
  );
  return parseFloat(data.lastPrice);
}

export async function getBinanceVolume(symbol: string): Promise<number> {
  const data = await binanceFetch(
    `/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`
  );
  return parseFloat(data.volume);
}

export async function getBinanceKlines(
  symbol: string,
  interval = "1h",
  limit = 100
): Promise<Kline[]> {
  const data = await binanceFetch(
    `/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
  );

  return (data as Array<[number, string, string, string, string, string]>).map(
    ([time, open, high, low, close, volume]) => ({
      time,
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume),
    })
  );
}

export async function placeBinanceOrder(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  side: "BUY" | "SELL",
  quantity: number
) {
  const params = {
    symbol: symbol.toUpperCase(),
    side,
    type: "MARKET",
    quantity: quantity.toFixed(6),
    timestamp: Date.now(),
  };
  const query = buildSignedQuery(params, apiSecret);

  return binanceFetch(`/api/v3/order?${query}`, {
    method: "POST",
    headers: { "X-MBX-APIKEY": apiKey },
  });
}
