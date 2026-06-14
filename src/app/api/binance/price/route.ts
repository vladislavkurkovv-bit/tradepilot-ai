import { NextRequest, NextResponse } from "next/server";
import { getBinancePrice, getBinanceVolume } from "@/services/binance";

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get("symbol") || "BTCUSDT";
    const [price, volume] = await Promise.all([
      getBinancePrice(symbol),
      getBinanceVolume(symbol),
    ]);
    return NextResponse.json({ price, volume, symbol });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
