import { createHmac } from "crypto";

export function signBinanceQuery(
  queryString: string,
  apiSecret: string
): string {
  return createHmac("sha256", apiSecret).update(queryString).digest("hex");
}

export function buildSignedQuery(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const queryString = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  const signature = signBinanceQuery(queryString, apiSecret);
  return `${queryString}&signature=${signature}`;
}

export function signBybitPayload(
  payload: string,
  apiSecret: string
): string {
  return createHmac("sha256", apiSecret).update(payload).digest("hex");
}

export function getBybitHeaders(
  apiKey: string,
  apiSecret: string,
  payload: string,
  recvWindow = "5000"
) {
  const timestamp = Date.now().toString();
  const signPayload = timestamp + apiKey + recvWindow + payload;
  const signature = signBybitPayload(signPayload, apiSecret);

  return {
    "X-BAPI-API-KEY": apiKey,
    "X-BAPI-SIGN": signature,
    "X-BAPI-TIMESTAMP": timestamp,
    "X-BAPI-RECV-WINDOW": recvWindow,
    "Content-Type": "application/json",
  };
}

export function normalizeSymbol(symbol: string, exchange: "binance" | "bybit") {
  const cleaned = symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (exchange === "binance") return cleaned;
  return cleaned;
}
