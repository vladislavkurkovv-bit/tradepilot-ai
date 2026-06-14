import { NextRequest, NextResponse } from "next/server";
import { placeBinanceOrder } from "@/services/binance";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiSecret, symbol, side, quantity } = await req.json();
    if (!apiKey || !apiSecret || !symbol || !side || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const order = await placeBinanceOrder(
      apiKey,
      apiSecret,
      symbol,
      side,
      quantity
    );
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
