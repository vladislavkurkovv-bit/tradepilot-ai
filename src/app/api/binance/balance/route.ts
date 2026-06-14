import { NextRequest, NextResponse } from "next/server";
import { getBinanceBalance } from "@/services/binance";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiSecret } = await req.json();
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "API Key and Secret are required" },
        { status: 400 }
      );
    }
    const balances = await getBinanceBalance(apiKey, apiSecret);
    return NextResponse.json({ balances });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
