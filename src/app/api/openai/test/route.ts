import { NextRequest, NextResponse } from "next/server";
import { parseOpenAIError, normalizeOpenAIKey } from "@/lib/openai-errors";

export async function POST(req: NextRequest) {
  try {
    const { openaiApiKey } = await req.json();
    const key = normalizeOpenAIKey(openaiApiKey ?? "");

    if (!key) {
      return NextResponse.json({ success: false, error: "Ключ пустой" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: 'Reply with JSON: {"ok":true}' }],
        max_tokens: 16,
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
      return NextResponse.json({
        success: false,
        error: parseOpenAIError(response.status, errBody),
        httpStatus: response.status,
        rawMessage: errBody.error?.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: "API-ключ работает. Баланс и лимиты в порядке для тестового запроса.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
