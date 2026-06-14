import { NextRequest, NextResponse } from "next/server";
import type { AISignal } from "@/lib/types";
import { parseOpenAIError, normalizeOpenAIKey } from "@/lib/openai-errors";

export async function POST(req: NextRequest) {
  try {
    const {
      exchange,
      symbol,
      price,
      rsi,
      ma20,
      ma50,
      volume,
      preliminarySignal,
      openaiApiKey,
    } = await req.json();

    const key = normalizeOpenAIKey(openaiApiKey ?? "");

    if (!key) {
      return NextResponse.json(
        { error: "OpenAI API Key is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a professional crypto trading analyst. Analyze the following market data and return ONLY valid JSON with no markdown.

Exchange: ${exchange}
Pair: ${symbol}
Current Price: ${price}
RSI(14): ${rsi ?? "N/A"}
MA20: ${ma20 ?? "N/A"}
MA50: ${ma50 ?? "N/A"}
Volume: ${volume}
Preliminary Strategy Signal: ${preliminarySignal}

Strategy rules:
- BUY if RSI < 30 and price above MA50
- SELL if RSI > 70
- Otherwise HOLD

Return strict JSON:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reason": "short explanation",
  "risk": "LOW" | "MEDIUM" | "HIGH"
}`;

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
            content:
              "You are a crypto trading AI. Always respond with valid JSON only, no markdown fences.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      let errBody: { error?: { message?: string; type?: string; code?: string } } = {};
      try {
        errBody = await response.json();
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        {
          error: parseOpenAIError(response.status, errBody),
          rawMessage: errBody.error?.message,
          httpStatus: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "OpenAI вернул пустой ответ" },
        { status: 502 }
      );
    }

    let parsed: AISignal;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "OpenAI вернул невалидный JSON" },
        { status: 502 }
      );
    }

    if (!["BUY", "SELL", "HOLD"].includes(parsed.signal)) {
      parsed.signal = "HOLD";
    }
    parsed.confidence = Math.min(100, Math.max(0, parsed.confidence || 50));
    if (!["LOW", "MEDIUM", "HIGH"].includes(parsed.risk)) {
      parsed.risk = "MEDIUM";
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
