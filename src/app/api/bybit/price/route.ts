import { NextRequest, NextResponse } from "next/server";
import { getBybitPrice, getBybitVolume } from "@/services/bybit";

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get("symbol") || "BTCUSDT";
    const [price, volume] = await Promise.all([
      getBybitPrice(symbol),
      getBybitVolume(symbol),
    ]);
    return NextResponse.json({ price, volume, symbol });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
