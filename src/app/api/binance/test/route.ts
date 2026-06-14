import { NextRequest, NextResponse } from "next/server";
import { testBinanceConnection } from "@/services/binance";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiSecret } = await req.json();
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "API Key and Secret are required" },
        { status: 400 }
      );
    }
    const result = await testBinanceConnection(apiKey, apiSecret);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
