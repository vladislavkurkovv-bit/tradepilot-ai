import { NextRequest, NextResponse } from "next/server";
import { placeBybitOrder } from "@/services/bybit";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiSecret, symbol, side, quantity } = await req.json();
    if (!apiKey || !apiSecret || !symbol || !side || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const bybitSide = side === "BUY" ? "Buy" : "Sell";
    const order = await placeBybitOrder(
      apiKey,
      apiSecret,
      symbol,
      bybitSide,
      String(quantity)
    );
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
