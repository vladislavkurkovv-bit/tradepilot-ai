import { NextRequest, NextResponse } from "next/server";
import { getBinanceKlines } from "@/services/binance";
import { enrichKlinesWithIndicators, getLatestVolume } from "@/lib/indicators";
import { getPreliminarySignal } from "@/lib/strategy";

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get("symbol") || "BTCUSDT";
    const interval = req.nextUrl.searchParams.get("interval") || "1h";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "168", 10);
    const klines = await getBinanceKlines(symbol, interval, limit);
    const { rsi, ma20, ma50 } = enrichKlinesWithIndicators(klines);
    const price = klines[klines.length - 1]?.close ?? 0;
    const volume = getLatestVolume(klines);
    const preliminarySignal = getPreliminarySignal(rsi, price, ma50);

    return NextResponse.json({
      klines,
      price,
      volume,
      rsi,
      ma20,
      ma50,
      preliminarySignal,
      symbol,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
