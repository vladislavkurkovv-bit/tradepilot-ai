import type { Balance, Kline } from "@/lib/types";
import { getBybitHeaders } from "@/lib/crypto-sign";

const BASE_URL = "https://api.bybit.com";

async function bybitFetch(
  path: string,
  init?: RequestInit & {
    apiKey?: string;
    apiSecret?: string;
    signPayload?: string;
  }
) {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

  if (init?.apiKey && init?.apiSecret) {
    Object.assign(
      headers,
      getBybitHeaders(init.apiKey, init.apiSecret, init.signPayload ?? "")
    );
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: init?.method || "GET",
    headers,
    body: init?.body,
  });

  const data = await res.json();
  if (data.retCode !== 0) {
    throw new Error(data.retMsg || `Bybit API error: ${data.retCode}`);
  }
  return data.result;
}

export async function testBybitConnection(
  apiKey: string,
  apiSecret: string
): Promise<{ success: boolean; message: string }> {
  try {
    await bybitFetch("/v5/account/wallet-balance?accountType=UNIFIED", {
      apiKey,
      apiSecret,
      signPayload: "accountType=UNIFIED",
    });
    return { success: true, message: "Bybit connection successful" };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

export async function getBybitBalance(
  apiKey: string,
  apiSecret: string
): Promise<Balance[]> {
  const result = await bybitFetch(
    "/v5/account/wallet-balance?accountType=UNIFIED",
    { apiKey, apiSecret, signPayload: "accountType=UNIFIED" }
  );

  const balances: Balance[] = [];
  for (const account of result.list || []) {
    for (const coin of account.coin || []) {
      const total = parseFloat(coin.walletBalance || "0");
      if (total > 0) {
        balances.push({
          asset: coin.coin,
          free: parseFloat(coin.availableToWithdraw || coin.availableBalance || "0"),
          locked: total - parseFloat(coin.availableToWithdraw || coin.availableBalance || "0"),
          total,
        });
      }
    }
  }
  return balances.sort((a, b) => b.total - a.total);
}

export async function getBybitPrice(symbol: string): Promise<number> {
  const result = await bybitFetch(
    `/v5/market/tickers?category=spot&symbol=${symbol.toUpperCase()}`
  );
  const ticker = result.list?.[0];
  if (!ticker) throw new Error("Symbol not found");
  return parseFloat(ticker.lastPrice);
}

export async function getBybitVolume(symbol: string): Promise<number> {
  const result = await bybitFetch(
    `/v5/market/tickers?category=spot&symbol=${symbol.toUpperCase()}`
  );
  const ticker = result.list?.[0];
  if (!ticker) throw new Error("Symbol not found");
  return parseFloat(ticker.volume24h);
}

export async function getBybitKlines(
  symbol: string,
  interval = "60",
  limit = 100
): Promise<Kline[]> {
  const result = await bybitFetch(
    `/v5/market/kline?category=spot&symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
  );

  return (result.list as string[][])
    .map(([time, open, high, low, close, volume]) => ({
      time: parseInt(time),
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume),
    }))
    .reverse();
}

export async function placeBybitOrder(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  side: "Buy" | "Sell",
  qty: string
) {
  const body = JSON.stringify({
    category: "spot",
    symbol: symbol.toUpperCase(),
    side,
    orderType: "Market",
    qty,
  });

  return bybitFetch("/v5/order/create", {
    method: "POST",
    apiKey,
    apiSecret,
    signPayload: body,
    body,
  });
}
