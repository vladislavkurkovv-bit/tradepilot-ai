import { NextRequest, NextResponse } from "next/server";
import type { HybridAISignal } from "@/lib/types";
import { parseOpenAIError, normalizeOpenAIKey } from "@/lib/openai-errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      exchange,
      symbol,
      timeframe,
      price,
      indicators,
      preliminarySignal,
      selectedStrategy,
      openaiApiKey,
    } = body;

    const key = normalizeOpenAIKey(openaiApiKey ?? "");
    if (!key) {
      return NextResponse.json({ error: "OpenAI API Key required" }, { status: 400 });
    }

    const ind = indicators ?? {};
    const prompt = `Crypto trading AI hybrid analyst. Return JSON only.

Exchange: ${exchange}
Pair: ${symbol}
Timeframe: ${timeframe}
Strategy: ${selectedStrategy}
Price: ${price}
RSI: ${ind.rsi ?? "N/A"}
EMA9: ${ind.ema9 ?? "N/A"}
EMA20: ${ind.ema20 ?? "N/A"}
EMA21: ${ind.ema21 ?? "N/A"}
EMA50: ${ind.ema50 ?? "N/A"}
ATR: ${ind.atr ?? "N/A"}
Volume change %: ${ind.volumeChange ?? "N/A"}
Preliminary signal: ${preliminarySignal}

Return:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reason": "short",
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "should_trade": true | false
}

Set should_trade false unless you strongly agree with preliminary signal and risk is acceptable.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: parseOpenAIError(response.status, errBody) },
        { status: response.status }
      );
    }

    const data = await response.json();
    const parsed: HybridAISignal = JSON.parse(
      data.choices?.[0]?.message?.content ?? "{}"
    );
    if (!["BUY", "SELL", "HOLD"].includes(parsed.signal)) parsed.signal = "HOLD";
    parsed.confidence = Math.min(100, Math.max(0, parsed.confidence ?? 0));
    if (!["LOW", "MEDIUM", "HIGH"].includes(parsed.risk)) parsed.risk = "MEDIUM";
    parsed.should_trade = Boolean(parsed.should_trade);

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
